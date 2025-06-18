'use client';

import React from 'react';
import TaskBoard from '@/components/TaskBoard';

export default function KanbanPage() {
  // For now, we'll use a mock project path
  // Later this will come from the selected project
  const mockProjectPath = '/Users/faez/Documents/FaezPM'; // Current project for testing

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <TaskBoard 
        projectPath={mockProjectPath}
        className="flex-1"
      />
    </div>
  );
} 