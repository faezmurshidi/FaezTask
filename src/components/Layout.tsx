'use client';

import { ReactNode, useState } from 'react';
import { TabProvider } from '@/contexts/TabContext';
import TabBar from './TabBar';
import TabContent from './TabContent';
import ProjectList from './ProjectList';
import TaskBoard from './TaskBoard';
import GitView from './GitView';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'tasks' | 'kanban' | 'time' | 'chat' | 'calendar' | 'knowledge' | 'git'>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'projects':
        return <ProjectList />;
      case 'kanban':
        return <TaskBoard projectPath="/Users/faez/Documents/FaezPM" className="h-full" />;
      case 'git':
        return <GitView />;
      case 'dashboard':
      default:
        return <TabContent />;
    }
  };

  return (
    <TabProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          {/* Draggable header area for sidebar */}
          <div 
            className="h-8 bg-white"
            style={{ 
              WebkitAppRegion: 'drag',
              // Ensure the drag region is at the very top
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              width: '256px', // 64 * 4 = 256px (w-64)
              zIndex: 10
            } as React.CSSProperties}
          />
          
          <div className="p-4 border-b border-gray-200 pt-10">
            <h1 className="text-lg font-semibold text-gray-900">Faez PM</h1>
            <p className="text-sm text-gray-500">Your Personal Software PM</p>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('projects')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'projects' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  Projects
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('git')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'git' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    Git
                  </div>
                </button>
              </li>
              
              <li>
                <button 
                  onClick={() => setCurrentView('tasks')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'tasks' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  Tasks
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('kanban')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'kanban' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  Kanban Board
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('time')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'time' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  Time Tracking
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('chat')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'chat' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  AI Chat
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('calendar')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'calendar' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  Calendar
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('knowledge')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'knowledge' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  Knowledge Base
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Draggable header area for main content */}
          <div 
            className="h-8 bg-gray-50"
            style={{ 
              WebkitAppRegion: 'drag',
              position: 'absolute',
              top: 0,
              left: '256px', // Start after sidebar (w-64 = 256px)
              right: 0,
              zIndex: 10
            } as React.CSSProperties}
          />
          
          {/* Project Tabs */}
          <div className="pt-8">
            <TabBar />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {renderContent()}
          </div>

          {/* Status Bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>No active timer</span>
                <span>•</span>
                <span>0 tasks pending</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabProvider>
  );
}