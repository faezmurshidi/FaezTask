'use client';

import React from 'react';
import { useTabContext } from '../contexts/TabContext';
import TaskBoard from './TaskBoard';
import { ImprovedTerminal } from './Terminal';
import Dashboard from './Dashboard';

const TabContent: React.FC = () => {
  const { tabs, activeTabId } = useTabContext();
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a tab to get started</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab.type) {
      case 'project':
        return <TaskBoard projectPath={activeTab.project?.local_folder_path || ''} />;
      case 'terminal':
        return (
          <div className="flex-1 bg-gray-900 p-4">
            <ImprovedTerminal 
              className="h-full"
              cwd={activeTab.project?.local_folder_path}
            />
          </div>
        );
      case 'dashboard':
        return <Dashboard />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Unknown tab type: {activeTab.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default TabContent;