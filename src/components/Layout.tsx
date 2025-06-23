'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { Project } from '@/types';
import { getProjects } from '@/lib/projectService';
import Dashboard from './Dashboard';
import GitView from './GitView';
import TaskBoard from './TaskBoard';
import FocusTerminal from './Terminal/FocusTerminal';
import Focus from './Focus';
import KnowledgeBase from './KnowledgeBase';
import { ToastProvider } from './Toast';
import ErrorBoundary from './ErrorBoundary';
import WelcomeScreen from './WelcomeScreen';
import ProjectCreator from './ProjectCreator';

interface LayoutProps {
  children: ReactNode;
}

type MainView = 'projects';
type ProjectView = 'dashboard' | 'focus' | 'git' | 'kanban' | 'knowledge';

export default function Layout({ children }: LayoutProps) {
  const [currentView, setCurrentView] = useState<MainView>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectView, setProjectView] = useState<ProjectView>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showTerminalHint, setShowTerminalHint] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Load projects data
  const { data: projects, error, isLoading } = useSWR<Project[]>('projects', getProjects);

  // Auto-select first project if available
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('projects');
    setProjectView('dashboard'); // Default to dashboard when selecting a project
  };

  const renderMainContent = () => {
    if (currentView === 'projects' && selectedProject) {
      switch (projectView) {
        case 'dashboard':
          return <Dashboard projectPath={selectedProject.local_folder_path || '/Users/faez/Documents/FaezPM'} />;
        case 'focus':
          return <Focus projectPath={selectedProject.local_folder_path || '/Users/faez/Documents/FaezPM'} />;
        case 'git':
          return <GitView />;
        case 'kanban':
          return <TaskBoard projectPath={selectedProject.local_folder_path || ''} />;
        case 'knowledge':
          return <KnowledgeBase projectPath={selectedProject.local_folder_path || ''} />;
        default:
          return <div>Unknown project view</div>;
      }
    }

    // Show Welcome Screen for fresh installations (no projects)
    if (!isLoading && projects && projects.length === 0) {
      return <WelcomeScreen onProjectCreated={() => mutate('projects')} />;
    }

    // Loading or error states
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-red-500">Error loading projects</p>
        </div>
      );
    }

    // Fallback for when projects exist but none selected
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a project to get started</p>
      </div>
    );
  };

  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 md:w-64 sm:w-56 xs:w-48 bg-white shadow-lg border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Draggable header area for sidebar */}
        <div 
          className="h-8 bg-white"
          style={{ 
            WebkitAppRegion: 'drag',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '256px',
            zIndex: 10
          } as React.CSSProperties}
        />
        
        {/* App Header */}
        <div className="p-4 border-b border-gray-200 pt-10">
          <h1 className="text-lg font-semibold text-gray-900">Faez PM</h1>
          <p className="text-sm text-gray-500">Your Personal Software PM</p>
        </div>
        
        {/* Main Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {/* Projects Dropdown */}
            <li>
              <div className="space-y-1">
                <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
                  Projects
                </div>
                
                {/* Project Selector */}
                {projects && projects.length > 0 && (
                  <div className="px-3">
                    <select
                      value={selectedProject?.id || ''}
                      onChange={(e) => {
                        if (e.target.value === '__new_project__') {
                          setShowNewProjectModal(true);
                          return;
                        }
                        const project = projects.find(p => p.id === e.target.value);
                        if (project) handleProjectSelect(project);
                      }}
                      className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                      <option value="__new_project__" className="font-medium text-blue-600">
                        + New Project
                      </option>
                    </select>
                  </div>
                )}

                {/* No Projects Message */}
                {projects && projects.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    <p>No projects found</p>
                    <p className="text-xs mt-1">Create a project to get started</p>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    <p>Loading projects...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="px-3 py-2 text-sm text-red-500 text-center">
                    <p>Error loading projects</p>
                  </div>
                )}

                {/* Project Views */}
                {selectedProject && (
                  <div className="space-y-1 ml-4">
                    <button 
                      onClick={() => { setCurrentView('projects'); setProjectView('dashboard'); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'projects' && projectView === 'dashboard'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        Dashboard
                      </div>
                    </button>

                    <button 
                      onClick={() => { setCurrentView('projects'); setProjectView('focus'); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'projects' && projectView === 'focus'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Focus
                      </div>
                    </button>

                    <button 
                      onClick={() => { setCurrentView('projects'); setProjectView('git'); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'projects' && projectView === 'git'
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

                    <button 
                      onClick={() => { setCurrentView('projects'); setProjectView('kanban'); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'projects' && projectView === 'kanban'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2v2M7 7h10" />
                        </svg>
                        Kanban Board
                      </div>
                    </button>

                    <button 
                      onClick={() => { setCurrentView('projects'); setProjectView('knowledge'); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'projects' && projectView === 'knowledge'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Knowledge Base
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </li>
          </ul>
        </nav>
        
        {/* Bottom Settings */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full bg-gray-50">
              {/* Main Content */}
              <div className={`${currentView === 'projects' && projectView === 'focus' && selectedProject ? 'lg:w-1/2 md:w-3/5 sm:w-full' : 'flex-1'} min-w-0 bg-white transition-all duration-300 overflow-hidden`}>
                <div className="h-full overflow-auto">
                  {renderMainContent()}
                </div>
              </div>
              
              {/* Terminal - Only visible in focus view */}
              {selectedProject && (
                <div className={`${currentView === 'projects' && projectView === 'focus' ? 'lg:w-1/2 md:w-2/5 hidden md:flex' : 'w-0'} flex-col border-l border-gray-200 transition-all duration-300 overflow-hidden`}>
                  {/* Terminal Integration Hint */}
                  {showTerminalHint && currentView === 'projects' && projectView === 'focus' && (
                    <div className="m-4 mb-2 bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
                      <button
                        onClick={() => setShowTerminalHint(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Terminal Integration</h4>
                          <p className="text-sm text-blue-700">
                            This terminal is integrated with Task-Master CLI. Use commands like <code className="bg-blue-100 px-1 rounded text-xs">tm next</code>, <code className="bg-blue-100 px-1 rounded text-xs">tm show &lt;id&gt;</code>, and <code className="bg-blue-100 px-1 rounded text-xs">tm set-status</code> to manage your tasks.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={`${showTerminalHint && currentView === 'projects' && projectView === 'focus' ? 'flex-1 m-4 mt-0' : 'h-full m-4'}`}>
                    <FocusTerminal 
                      className="h-full"
                      cwd={selectedProject.local_folder_path}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>No active timer</span>
              <span>•</span>
              <span>0 tasks pending</span>
              {selectedProject && (
                <>
                  <span>•</span>
                  <span>Project: {selectedProject.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preferences</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-600">Enable notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-600">Auto-save changes</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-600">Dark mode</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
                <p className="text-sm text-gray-600">
                  Faez PM - Personal Software Project Management
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Version 1.0.0
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ProjectCreator 
                onProjectCreated={() => {
                  setShowNewProjectModal(false);
                  mutate('projects'); // Refresh projects list
                }}
                onCancel={() => setShowNewProjectModal(false)}
              />
            </div>
          </div>
        </div>
      )}
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}