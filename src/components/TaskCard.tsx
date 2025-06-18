'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskPriority } from '@/types/kanban';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get priority color and styling
  const getPriorityStyles = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return {
          color: 'bg-red-500',
          text: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
        };
      case 'medium':
        return {
          color: 'bg-yellow-500',
          text: 'text-yellow-700',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
        };
      case 'low':
        return {
          color: 'bg-green-500',
          text: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
        };
    }
  };

  const priorityStyles = getPriorityStyles(task.priority);

  // Calculate subtask progress
  const getSubtaskProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return null;
    }

    const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'done').length;
    const totalSubtasks = task.subtasks.length;
    const percentage = Math.round((completedSubtasks / totalSubtasks) * 100);

    return {
      completed: completedSubtasks,
      total: totalSubtasks,
      percentage,
    };
  };

  const subtaskProgress = getSubtaskProgress();

  // Format description for display (truncate if too long)
  const formatDescription = (description: string, maxLength: number = 120) => {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength).trim() + '...';
  };

  // Check if task has dependencies that are not completed
  const hasBlockingDependencies = () => {
    // TODO: This would need access to all tasks to check dependency status
    // For now, just return false - this will be implemented when full task integration is added
    return false;
  };

  const isBlocked = hasBlockingDependencies();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}
        ${isBlocked ? 'opacity-60 border-orange-300' : ''}
      `}
      onClick={onClick}
    >
      {/* Drag Handle (invisible but covers the card) */}
      <div
        {...listeners}
        className="p-4 relative"
      >
        {/* Priority Indicator */}
        <div className="flex items-start justify-between mb-2">
          <div className={`w-3 h-3 rounded-full ${priorityStyles.color} flex-shrink-0 mt-1`}></div>
          
          {/* Task ID and Complexity Score */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>#{task.id}</span>
            {task.complexityScore && (
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                {task.complexityScore}/10
              </span>
            )}
          </div>
        </div>

        {/* Task Title */}
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
          {task.title}
        </h4>

        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
            {formatDescription(task.description)}
          </p>
        )}

        {/* Subtask Progress */}
        {subtaskProgress && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Subtasks</span>
              <span>{subtaskProgress.completed}/{subtaskProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${subtaskProgress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Dependencies Indicator */}
        {task.dependencies && task.dependencies.length > 0 && (
          <div className="flex items-center space-x-1 mb-2">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-xs text-gray-500">
              {task.dependencies.length} {task.dependencies.length === 1 ? 'dependency' : 'dependencies'}
            </span>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center justify-between">
          {/* Priority Badge */}
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full capitalize
            ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border}
          `}>
            {task.priority}
          </span>

          {/* Additional Indicators */}
          <div className="flex items-center space-x-1">
            {/* Blocked Indicator */}
            {isBlocked && (
              <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Details Indicator */}
            {task.details && (
              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}

            {/* Test Strategy Indicator */}
            {task.testStrategy && (
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Drag Handle Visual Indicator (appears on hover) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </div>
    </div>
  );
} 