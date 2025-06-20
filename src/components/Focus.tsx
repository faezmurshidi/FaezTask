'use client';

import React, { useState, useEffect } from 'react';
import { electronAPI } from '@/lib/electronAPI';

// Task types based on the .taskmaster structure
interface Task {
  id: number | string;
  title: string;
  description: string;
  details?: string;
  testStrategy?: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  dependencies: (number | string)[];
  subtasks?: Subtask[];
  complexityScore?: number;
}

interface Subtask {
  id: number;
  title: string;
  description: string;
  details?: string;
  status: string;
  dependencies?: (number | string)[];
}

interface TaskData {
  master: {
    tasks: Task[];
  };
}

interface FocusProps {
  projectPath: string;
}

const Focus: React.FC<FocusProps> = ({ projectPath }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  // Save tasks to .taskmaster/tasks/tasks.json
  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      if (electronAPI.isElectron()) {
        const tasksPath = `${projectPath}/.taskmaster/tasks/tasks.json`;
        const taskData: TaskData = {
          master: {
            tasks: updatedTasks
          }
        };
        
        const result = await electronAPI.writeFile(tasksPath, JSON.stringify(taskData, null, 2));
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to save tasks');
        }
        
        return true;
      } else {
        console.warn('Cannot save tasks in browser mode');
        return false;
      }
    } catch (err) {
      console.error('Error saving tasks:', err);
      throw err;
    }
  };

  // Update task status and send instructions to terminal
  const updateTaskStatus = async (taskId: number | string, newStatus: string) => {
    try {
      setIsUpdatingTask(true);
      
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      );
      
      await saveTasks(updatedTasks);
      setTasks(updatedTasks);
      
      // If starting work on a task, send instructions to terminal
      if (newStatus === 'in-progress') {
        const task = updatedTasks.find(t => t.id === taskId);
        if (task) {
          sendTaskInstructionsToTerminal(task);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
      return false;
    } finally {
      setIsUpdatingTask(false);
    }
  };

  // Send task instructions to terminal
  const sendTaskInstructionsToTerminal = (task: Task) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.terminal) {
      // Create a clean branch name from task title
      const branchName = `${task.id}-${task.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50)}`; // Limit length
      
      const instructions = [
        '',
        `Let's start working on the next task ${task.id}.`,
        `Run "tm show ${task.id}" for more details.`,
        `Before proceeding, check git status and if clean create a new branch "${branchName}".`,
        `Then proceed to plan the implementation.`,
        ''
      ];

      // Send each instruction line to terminal with a delay
      instructions.forEach((instruction, index) => {
        setTimeout(() => {
          // Get the active terminal ID - we'll need to track this
          const terminalEvent = new CustomEvent('focus-terminal-message', {
            detail: { message: instruction }
          });
          window.dispatchEvent(terminalEvent);
        }, index * 100);
      });
    }
  };

  // Load tasks from .taskmaster/tasks/tasks.json
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to read tasks.json via electron API
      if (electronAPI.isElectron()) {
        // Use electron API to read the file
        const tasksPath = `${projectPath}/.taskmaster/tasks/tasks.json`;
        const result = await electronAPI.readFile(tasksPath);
        
        if (!result.success || !result.content) {
          throw new Error(result.error || 'Failed to read file or file is empty');
        }
        
        const taskData: TaskData = JSON.parse(result.content);
        
        // Extract tasks from master tag
        const allTasks = taskData.master?.tasks || [];
        setTasks(allTasks);
      } else {
        // Fallback for web environment - you could fetch from an API endpoint
        console.warn('Focus component requires Electron environment to read tasks.json');
        setError('Tasks can only be loaded in desktop app mode');
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Make sure .taskmaster/tasks/tasks.json exists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath]);

  // Filter tasks to get pending ones (not done)
  const pendingTasks = tasks.filter(task => task.status !== 'done');

  // Get the focus task (next task) - highest priority pending task with no blocking dependencies
  const getFocusTask = () => {
    // Simple logic: get the first high priority pending task, or first pending task
    const highPriorityTasks = pendingTasks.filter(task => task.priority === 'high');
    return highPriorityTasks.length > 0 ? highPriorityTasks[0] : pendingTasks[0] || null;
  };

  const focusTask = getFocusTask();

  // Get priority color class
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get status color class
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      case 'deferred': return 'text-purple-600 bg-purple-100';
      case 'done': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };



  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Error Loading Tasks</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <button
            onClick={loadTasks}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">🎯 Focus Mode</h1>
          <p className="text-gray-600">Your recommended task to work on right now</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-orange-600">{pendingTasks.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl font-bold text-green-600">{tasks.length - pendingTasks.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Focus Task Card */}
        {focusTask ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-4 md:p-6 lg:p-8 shadow-lg">
            {/* Task Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                  Currently Recommended
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`
                  px-3 py-1 text-sm font-medium rounded-full border-2
                  ${getPriorityColor(focusTask.priority)}
                `}>
                  {focusTask.priority} priority
                </span>
                <span className="text-sm text-gray-500 font-mono">#{focusTask.id}</span>
              </div>
            </div>

            {/* Task Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {focusTask.title}
              </h2>
              
              <p className="text-gray-700 text-lg leading-relaxed">
                {focusTask.description}
              </p>

              {/* Task Metadata */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-blue-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{focusTask.status}</span>
                </div>
                
                {focusTask.complexityScore && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Complexity: {focusTask.complexityScore}/10</span>
                  </div>
                )}
                
                {focusTask.dependencies.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>{focusTask.dependencies.length} dependencies</span>
                  </div>
                )}
                
                {focusTask.subtasks && focusTask.subtasks.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>
                      {focusTask.subtasks.filter(st => st.status === 'done').length}/{focusTask.subtasks.length} subtasks done
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expand Details Button - Only show if there are details to show */}
            {(focusTask.details || focusTask.testStrategy || focusTask.dependencies.length > 0 || (focusTask.subtasks && focusTask.subtasks.length > 0)) && (
              <div className="mt-6 pt-6 border-t border-blue-200">
                <button
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="flex items-center justify-between w-full text-left text-blue-700 hover:text-blue-800 font-medium transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span>{isDetailsExpanded ? 'Hide Details' : 'Show Full Details'}</span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      {focusTask.details && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Details</span>}
                      {focusTask.testStrategy && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Tests</span>}
                      {focusTask.dependencies.length > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{focusTask.dependencies.length} Deps</span>}
                      {focusTask.subtasks && focusTask.subtasks.length > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{focusTask.subtasks.length} Subtasks</span>}
                    </div>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isDetailsExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Collapsible Details Section */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isDetailsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="mt-6 space-y-6 pt-6 border-t border-blue-200">
                
                {/* Implementation Details */}
                {focusTask.details && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Implementation Details
                    </h4>
                    <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-blue-100">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                        {focusTask.details}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Test Strategy */}
                {focusTask.testStrategy && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Test Strategy
                    </h4>
                    <div className="bg-green-50/70 backdrop-blur border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm leading-relaxed">{focusTask.testStrategy}</p>
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {focusTask.dependencies.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Dependencies
                    </h4>
                    <div className="space-y-2">
                      {focusTask.dependencies.map((depId) => (
                        <div key={depId} className="flex items-center space-x-3 bg-white/70 backdrop-blur rounded-lg p-3 border border-blue-100">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <span className="text-gray-700 font-medium">Task #{depId}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Required</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                {focusTask.subtasks && focusTask.subtasks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Subtasks ({focusTask.subtasks.filter(st => st.status === 'done').length}/{focusTask.subtasks.length} completed)
                    </h4>
                    <div className="space-y-3">
                      {focusTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="bg-white/70 backdrop-blur border border-blue-100 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <span className="font-medium text-gray-900">#{focusTask.id}.{subtask.id} {subtask.title}</span>
                            <span className={`
                              px-2 py-1 text-xs font-medium rounded-full
                              ${getStatusColor(subtask.status)}
                            `}>
                              {subtask.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{subtask.description}</p>
                          {subtask.details && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                                {subtask.details}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-blue-200">
              <button 
                onClick={() => updateTaskStatus(focusTask.id, 'in-progress')}
                disabled={isUpdatingTask || focusTask.status === 'in-progress'}
                className={`px-6 py-3 font-medium rounded-lg shadow-md transition-colors ${
                  focusTask.status === 'in-progress'
                    ? 'bg-green-600 text-white cursor-default'
                    : isUpdatingTask
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isUpdatingTask ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </div>
                ) : focusTask.status === 'in-progress' ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>In Progress</span>
                  </div>
                ) : (
                  'Start Working'
                )}
              </button>
              <button className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors">
                View All Tasks
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-12 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">All tasks completed! 🎉</h2>
            <p className="text-gray-600 text-lg">Great job staying on top of your work. Time to celebrate or start planning your next milestone!</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Focus; 