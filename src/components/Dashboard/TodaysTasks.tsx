'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircleIcon, ClockIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// Task interfaces based on Task Master structure
interface Subtask {
  id: number;
  title: string;
  description: string;
  status: string;
  dependencies: number[];
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dependencies: number[];
  subtasks?: Subtask[];
  complexityScore?: number;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionPercentage: number;
}

interface TodaysTasksProps {
  projectPath?: string;
  onTaskClick?: (taskId: number) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const TodaysTasks: React.FC<TodaysTasksProps> = ({ 
  projectPath = '/Users/faez/Documents/FaezPM',
  onTaskClick,
  onStatusChange 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());



  // Load tasks from .taskmaster/tasks/tasks.json
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Import electronAPI
      const { electronAPI } = await import('../../lib/electronAPI');

      if (electronAPI.isElectron()) {
        // Use electron API to read the file
        const tasksPath = `${projectPath}/.taskmaster/tasks/tasks.json`;
        const result = await electronAPI.readFile(tasksPath);
        
        if (!result.success || !result.content) {
          throw new Error(result.error || 'Failed to read file or file is empty');
        }
        
        const taskData: any = JSON.parse(result.content);
        
        // Extract tasks from master tag
        const allTasks = taskData.master?.tasks || [];
        
        // Filter and prioritize tasks for "today's focus"
        const todaysTasks = filterTodaysTasks(allTasks);
        
        // Calculate stats
        const calculatedStats = calculateStats(allTasks);
        
        setTasks(todaysTasks);
        setStats(calculatedStats);
        setLastRefresh(new Date());
      } else {
        // Fallback for web environment
        console.warn('TodaysTasks component requires Electron environment to read tasks.json');
        setError('Tasks can only be loaded in desktop app mode');
        // Use mock data for development
        setTasks(getMockTodaysTasks());
        setStats(getMockStats());
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks. Make sure .taskmaster/tasks/tasks.json exists.');
      // Fallback to mock data for development
      setTasks(getMockTodaysTasks());
      setStats(getMockStats());
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  // Calculate task statistics
  const calculateStats = (allTasks: Task[]): TaskStats => {
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.status === 'done').length;
    const inProgress = allTasks.filter(task => task.status === 'in-progress').length;
    const pending = allTasks.filter(task => task.status === 'pending').length;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionPercentage
    };
  };

  // Filter tasks to show most relevant ones for today
  const filterTodaysTasks = (allTasks: Task[]): Task[] => {
    const filtered = allTasks
      .filter(task => {
        // Include high priority tasks
        if (task.priority === 'high') return true;
        
        // Include tasks that are in-progress
        if (task.status === 'in-progress') return true;
        
        // Include pending tasks with no blocking dependencies
        if (task.status === 'pending' && (!task.dependencies || task.dependencies.length === 0)) return true;
        
        // Include tasks with pending subtasks
        if (task.subtasks && task.subtasks.some(st => st.status === 'pending' || st.status === 'in-progress')) return true;
        
        return false;
      })
      .sort((a, b) => {
        // Sort by priority (high > medium > low) then by ID
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return a.id - b.id;
      })
      .slice(0, 8); // Limit to 8 most important tasks

    return filtered;
  };

  // Mock data for development/fallback
  const getMockTodaysTasks = (): Task[] => [
    {
      id: 13,
      title: "Complete Dashboard TodaysTasks Widget",
      description: "Implement the TodaysTasks component with Task Master integration",
      status: "in-progress",
      priority: "high",
      dependencies: [],
      subtasks: [
        { id: 1, title: "Create component structure", description: "", status: "done", dependencies: [] },
        { id: 2, title: "Integrate with Task Master", description: "", status: "in-progress", dependencies: [] },
        { id: 3, title: "Add interactive features", description: "", status: "pending", dependencies: [] }
      ]
    },
    {
      id: 30,
      title: "Fix Production Electron App Issues",
      description: "Debug and fix issues causing the Electron app to show a blank screen",
      status: "pending",
      priority: "high",
      dependencies: [],
      subtasks: []
    }
  ];

  const getMockStats = (): TaskStats => ({
    total: 21,
    completed: 7,
    inProgress: 1,
    pending: 13,
    completionPercentage: 33.33
  });

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Import electronAPI
      const { electronAPI } = await import('../../lib/electronAPI');

      if (electronAPI.isElectron()) {
        // Read current tasks file
        const tasksPath = `${projectPath}/.taskmaster/tasks/tasks.json`;
        const result = await electronAPI.readFile(tasksPath);
        
        if (!result.success || !result.content) {
          throw new Error('Failed to read tasks file');
        }
        
        const taskData: any = JSON.parse(result.content);
        const allTasks = taskData.master?.tasks || [];
        
        // Find and update the task
        const taskIndex = allTasks.findIndex((task: Task) => task.id.toString() === taskId);
        if (taskIndex !== -1) {
          allTasks[taskIndex].status = newStatus;
          
          // Write back to file
          const updatedData = {
            ...taskData,
            master: {
              ...taskData.master,
              tasks: allTasks
            }
          };
          
          await electronAPI.writeFile(tasksPath, JSON.stringify(updatedData, null, 2));
          
          // Refresh tasks after status change
          await loadTasks();
          
          // Notify parent component
          onStatusChange?.(taskId, newStatus);
        }
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  // Handle task click
  const handleTaskClick = (taskId: number) => {
    onTaskClick?.(taskId);
  };

  // Load tasks on component mount and set up refresh interval
  useEffect(() => {
    loadTasks();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadTasks, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadTasks]);

  // Get priority color classes
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'done': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
      case 'in-progress':
        return <PlayIcon className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <PauseIcon className="h-4 w-4 text-yellow-500" />;
      case 'done':
        return <CheckCircleSolid className="h-4 w-4 text-green-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today&apos;s Tasks</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Today&apos;s Tasks</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadTasks}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Refresh tasks"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <span className="text-xs text-gray-500">
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-800">
              {stats.completed}/{stats.total} ({stats.completionPercentage.toFixed(0)}%)
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No tasks for today!</p>
            <p className="text-xs text-gray-400 mt-1">Great job staying on top of things.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`border-l-4 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow ${getPriorityColor(task.priority)}`}
              onClick={() => handleTaskClick(task.id)}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(task.status)}
                    <span className="text-xs font-medium text-gray-500">#{task.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm truncate" title={task.title}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-1 ml-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id.toString(), 'in-progress');
                      }}
                      className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                      title="Start task"
                    >
                      <PlayIcon className="h-3 w-3" />
                    </button>
                  )}
                  {(task.status === 'in-progress' || task.status === 'review') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id.toString(), 'done');
                      }}
                      className="p-1 text-green-500 hover:bg-green-100 rounded transition-colors"
                      title="Complete task"
                    >
                      <CheckCircleIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subtasks Preview */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Subtasks</span>
                    <span>
                      {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {task.subtasks.slice(0, 3).map((subtask) => (
                      <div key={subtask.id} className="flex items-center space-x-2">
                        {getStatusIcon(subtask.status)}
                        <span className="text-xs text-gray-600 truncate flex-1">
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                    {task.subtasks.length > 3 && (
                      <div className="text-xs text-gray-400 text-center">
                        +{task.subtasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-center">
        <button
          onClick={() => {/* Navigate to full task view */}}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          View all tasks &rarr;
        </button>
      </div>
    </div>
  );
};

export default TodaysTasks; 