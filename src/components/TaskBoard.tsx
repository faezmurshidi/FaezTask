'use client';

import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanProvider, useKanban } from '@/contexts/KanbanContext';
import { Task, TaskStatus } from '@/types/kanban';
import TaskColumn from './TaskColumn';
import TaskDetailPanel from './TaskDetailPanel';

interface TaskBoardProps {
  projectPath: string;
  className?: string;
}

function TaskBoardContent({ projectPath, className }: TaskBoardProps) {
  const { state, loadTasks, moveTask, selectTask } = useKanban();
  const { tasks, columns, selectedTask, loading, error } = state;
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Require 3px movement before drag starts
      },
    })
  );

  // Load tasks on mount
  useEffect(() => {
    if (projectPath) {
      loadTasks(projectPath);
    }
  }, [projectPath, loadTasks]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setDraggedTask(task || null);
  };

  // Handle drag over (for visual feedback)
  const handleDragOver = (event: DragOverEvent) => {
    // Add visual feedback logic here if needed
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedTask(null);
    
    const { active, over } = event;
    
    if (!over || !active) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    // Only move if status actually changed
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  // Handle task click
  const handleTaskClick = (task: Task) => {
    selectTask(task);
  };

  // Handle detail panel close
  const handleDetailPanelClose = () => {
    selectTask(null);
  };

  // Filter tasks by status for each column
  const getTasksForColumn = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Error loading tasks</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => loadTasks(projectPath)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Board Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Task Board</h1>
            <p className="text-gray-600 text-sm mt-1">
              {tasks.length} total tasks • {getTasksForColumn('done').length} completed
            </p>
          </div>
          
          {/* Add quick filters or actions here */}
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Kanban Columns */}
          <div className="flex-1 flex space-x-4 p-4 overflow-x-auto min-w-0" style={{ minWidth: 'fit-content' }}>
            {columns
              .sort((a, b) => a.order - b.order)
              .map(column => (
                <TaskColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksForColumn(column.id)}
                  onTaskClick={handleTaskClick}
                  isDraggedOver={draggedTask !== null}
                />
              ))}
          </div>

          {/* Task Detail Panel */}
          <TaskDetailPanel
            task={selectedTask}
            isOpen={selectedTask !== null}
            onClose={handleDetailPanelClose}
          />
        </DndContext>
      </div>
    </div>
  );
}

// Main TaskBoard component with provider
export default function TaskBoard({ projectPath, className }: TaskBoardProps) {
  return (
    <KanbanProvider projectPath={projectPath}>
      <TaskBoardContent projectPath={projectPath} className={className} />
    </KanbanProvider>
  );
} 