'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, Column, TaskStatus } from '@/types/kanban';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isDraggedOver?: boolean;
}

export default function TaskColumn({ column, tasks, onTaskClick, isDraggedOver }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Get priority count for display
  const priorityCounts = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  // Calculate completion percentage for columns that track progress
  const getCompletionInfo = () => {
    if (column.id === 'done') {
      return null; // Done column doesn't need progress
    }
    
    const completedSubtasks = tasks.reduce((total, task) => {
      if (task.subtasks) {
        return total + task.subtasks.filter(subtask => subtask.status === 'done').length;
      }
      return total;
    }, 0);
    
    const totalSubtasks = tasks.reduce((total, task) => {
      return total + (task.subtasks?.length || 0);
    }, 0);
    
    if (totalSubtasks === 0) return null;
    
    const percentage = Math.round((completedSubtasks / totalSubtasks) * 100);
    return { completed: completedSubtasks, total: totalSubtasks, percentage };
  };

  const completionInfo = getCompletionInfo();

  return (
    <div className="flex flex-col min-w-80 max-w-80 h-full bg-gray-50 rounded-lg border border-gray-200">
      {/* Column Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
              {tasks.length}
            </span>
          </div>
        </div>

        {/* Priority Distribution */}
        {tasks.length > 0 && (
          <div className="flex items-center space-x-3 text-xs">
            {priorityCounts.high > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">{priorityCounts.high} high</span>
              </div>
            )}
            {priorityCounts.medium > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">{priorityCounts.medium} med</span>
              </div>
            )}
            {priorityCounts.low > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{priorityCounts.low} low</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar for In-Progress and Review columns */}
        {completionInfo && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Subtasks Progress</span>
              <span>{completionInfo.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${completionInfo.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {completionInfo.completed} of {completionInfo.total} subtasks completed
            </div>
          </div>
        )}
      </div>

      {/* Column Content - Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto transition-colors ${
          isOver || isDraggedOver
            ? 'bg-blue-50 border-2 border-dashed border-blue-300'
            : ''
        }`}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">No tasks</p>
                <p className="text-gray-400 text-xs mt-1">
                  {column.id === 'pending' ? 'Create new tasks to get started' : 
                   column.id === 'in-progress' ? 'Move tasks here when working on them' :
                   column.id === 'review' ? 'Move completed tasks here for review' :
                   'Completed tasks will appear here'}
                </p>
              </div>
            ) : (
              tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>

      {/* Column Footer - Quick Actions */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <button
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors flex items-center justify-center space-x-1"
          onClick={() => {
            // TODO: Implement quick add task functionality
            console.log(`Add task to ${column.title}`);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add task</span>
        </button>
      </div>
    </div>
  );
} 