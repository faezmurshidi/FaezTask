'use client';

import React from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import TaskColumn from '@/components/TaskColumn';
import TaskDetailPanel from '@/components/TaskDetailPanel';

export function KanbanBoard() {
  const { state, selectTask } = useKanban();
  const { tasks, columns, selectedTask, loading, error } = state;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  // Debug information for testing (remove in production)
  const taskStats = columns.map(column => ({
    ...column,
    count: tasks.filter(task => task.status === column.id).length
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Debug Panel - Remove in production */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Mock Data Status: {tasks.length} total tasks loaded
        </h3>
        <div className="flex gap-4 text-xs text-gray-600">
          {taskStats.map(stat => (
            <span key={stat.id} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
              {stat.title}: {stat.count}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto min-h-0">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(task => task.status === column.id)}
            onTaskClick={selectTask}
          />
        ))}
      </div>

      {selectedTask && (
        <TaskDetailPanel 
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => selectTask(null)}
        />
      )}
    </div>
  );
} 