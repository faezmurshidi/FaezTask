'use client';

import { useTabContext } from '@/contexts/TabContext';

export default function TabBar() {
  const { tabs, switchToTab, closeTab, openTab } = useTabContext();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center px-4 py-2">
        <div className="flex space-x-1 flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                tab.isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => switchToTab(tab.id)}
            >
              <span className="truncate max-w-32">{tab.title}</span>
              {tab.id !== 'dashboard' && (
                <button
                  className="ml-2 p-0.5 rounded-full hover:bg-gray-300 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => {
            // Open terminal tab
            openTab({
              id: 'terminal',
              type: 'terminal',
              title: 'Terminal'
            });
          }}
          title="Open Terminal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => {
            // This will be connected to project creation functionality later
            console.log('Add new project tab');
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}