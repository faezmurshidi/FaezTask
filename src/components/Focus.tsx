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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Render task card
  const renderTaskCard = (task: Task, isFocus = false) => (
    <div
      key={task.id}
      className={`
        p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
        ${isFocus ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
        ${selectedTask?.id === task.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}
      `}
      onClick={() => setSelectedTask(task)}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full border
            ${getPriorityColor(task.priority)}
          `}>
            {task.priority}
          </span>
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${getStatusColor(task.status)}
          `}>
            {task.status}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>#{task.id}</span>
          {task.complexityScore && (
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
              {task.complexityScore}/10
            </span>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 className={`font-semibold mb-2 ${isFocus ? 'text-blue-900' : 'text-gray-900'}`}>
        {task.title}
      </h3>

      {/* Task Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {task.description}
      </p>

      {/* Task Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {/* Dependencies */}
        {task.dependencies.length > 0 && (
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>{task.dependencies.length} deps</span>
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>
              {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length} subtasks
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Render task details panel
  const renderTaskDetails = () => {
    if (!selectedTask) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Select a task to view details</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto">
        {/* Task Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">Task #{selectedTask.id}</h2>
            <button
              onClick={() => setSelectedTask(null)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedTask.title}</h3>
          
          <div className="flex items-center space-x-3">
            <span className={`
              px-3 py-1 text-sm font-medium rounded-full border
              ${getPriorityColor(selectedTask.priority)}
            `}>
              {selectedTask.priority} priority
            </span>
            <span className={`
              px-3 py-1 text-sm font-medium rounded-full
              ${getStatusColor(selectedTask.status)}
            `}>
              {selectedTask.status}
            </span>
            {selectedTask.complexityScore && (
              <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                Complexity: {selectedTask.complexityScore}/10
              </span>
            )}
          </div>
        </div>

        {/* Task Content */}
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 leading-relaxed">{selectedTask.description}</p>
          </div>

          {/* Details */}
          {selectedTask.details && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Implementation Details</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTask.details}
                </pre>
              </div>
            </div>
          )}

          {/* Test Strategy */}
          {selectedTask.testStrategy && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Test Strategy</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm leading-relaxed">{selectedTask.testStrategy}</p>
              </div>
            </div>
          )}

          {/* Dependencies */}
          {selectedTask.dependencies.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Dependencies</h4>
              <div className="space-y-2">
                {selectedTask.dependencies.map((depId) => (
                  <div key={depId} className="flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-gray-600">Task #{depId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Subtasks ({selectedTask.subtasks.filter(st => st.status === 'done').length}/{selectedTask.subtasks.length} completed)
              </h4>
              <div className="space-y-3">
                {selectedTask.subtasks.map((subtask) => (
                  <div key={subtask.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-gray-900">#{selectedTask.id}.{subtask.id} {subtask.title}</span>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${getStatusColor(subtask.status)}
                      `}>
                        {subtask.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{subtask.description}</p>
                    {subtask.details && (
                      <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                        <pre className="whitespace-pre-wrap">{subtask.details}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
    <div className="h-full flex">
      {/* Left Panel - Task Lists */}
      <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-8">
          {/* Focus Task Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">🎯 Today&apos;s Focus</h2>
              {focusTask && (
                <span className="text-sm text-gray-500">Next recommended task</span>
              )}
            </div>
            
            {focusTask ? (
              renderTaskCard(focusTask, true)
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">All tasks completed! 🎉</p>
                <p className="text-gray-500 text-sm mt-1">Great job staying on top of your work.</p>
              </div>
            )}
          </div>

          {/* All Pending Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">📋 All Pending Tasks</h2>
              <span className="text-sm text-gray-500">{pendingTasks.length} tasks</span>
            </div>
            
            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.map((task) => renderTaskCard(task))}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-600">No pending tasks</p>
                <p className="text-gray-500 text-sm mt-1">All tasks are completed!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Task Details */}
      <div className="w-1/2 p-6">
        {renderTaskDetails()}
      </div>
    </div>
  );
};

export default Focus; 