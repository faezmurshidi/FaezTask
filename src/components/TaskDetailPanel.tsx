'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/kanban';

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailPanel({ task, isOpen, onClose }: TaskDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  // Update edited task when task prop changes
  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  // Handle save changes
  const handleSave = async () => {
    if (!editedTask) return;

    try {
      // TODO: Implement save functionality via context
      console.log('Saving task:', editedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    if (task) {
      setEditedTask({ ...task });
    }
    setIsEditing(false);
  };

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      case 'deferred': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !task) {
    return null;
  }

  const currentTask = editedTask || task;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform z-50 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
              <span className="text-sm text-gray-500">#{currentTask.id}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{currentTask.title}</h3>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(currentTask.status)}`}>
                {currentTask.status.replace('-', ' ')}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(currentTask.priority)}`}>
                {currentTask.priority}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <p className="text-gray-700 whitespace-pre-wrap">{currentTask.description}</p>
          </div>

          {/* Implementation Details */}
          {currentTask.details && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Details</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{currentTask.details}</p>
              </div>
            </div>
          )}

          {/* Test Strategy */}
          {currentTask.testStrategy && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Strategy</label>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{currentTask.testStrategy}</p>
              </div>
            </div>
          )}

          {/* Subtasks */}
          {currentTask.subtasks && currentTask.subtasks.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Subtasks ({currentTask.subtasks.filter(s => s.status === 'done').length}/{currentTask.subtasks.length} completed)
              </label>
              <div className="space-y-2">
                {currentTask.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      subtask.status === 'done' ? 'bg-green-500' : 
                      subtask.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{subtask.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{subtask.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subtask.status)}`}>
                      {subtask.status.replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {currentTask.dependencies && currentTask.dependencies.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Dependencies</label>
              <div className="space-y-2">
                {currentTask.dependencies.map((depId) => (
                  <div key={depId} className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-sm text-gray-700">Task #{depId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Metadata</h4>
            <div className="space-y-2 text-sm">
              {currentTask.complexityScore && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Complexity Score:</span>
                  <span className="font-medium">{currentTask.complexityScore}/10</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 