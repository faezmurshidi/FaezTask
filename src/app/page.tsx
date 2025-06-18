'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import PRDUpload from '@/components/PRDUpload';

export default function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUpload = async (file: File, projectName: string) => {
    try {
      // Read the file content
      const fileContent = await file.text();
      
      // Get the default projects directory
      const baseProjectsPath = await (window as any).electronAPI?.getProjectsDirectory();
      
      // Process the PRD upload
      const result = await (window as any).electronAPI?.processPRDUpload({
        fileContent,
        fileName: file.name,
        projectName: projectName.trim(),
        baseProjectsPath
      });
      
      if (result?.success) {
        setShowUploadModal(false);
        alert(`Project "${projectName}" created successfully!\nProject path: ${result.projectPath}\nPRD saved and parsed into tasks.`);
      } else {
        throw new Error(result?.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Re-throw to let the component handle it
    }
  };

  const handleAddExisting = async (folderPath: string, projectName: string) => {
    try {
      // TODO: Implement the actual existing project import logic
      console.log('Adding existing project:', { folderPath, projectName });
      
      // For now, just close the modal and show success
      setShowUploadModal(false);
      alert(`Existing project "${projectName}" will be imported from: ${folderPath}`);
    } catch (error) {
      console.error('Import error:', error);
      throw error; // Re-throw to let the component handle it
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Faez PM
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your AI-powered project management companion. Upload a PRD to get started with 
            intelligent task breakdown and project management.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Project Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Project</h3>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              Start a new project with PRD upload or import an existing one with Task Master structure.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              New Project
            </button>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
              </svg>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Tasks</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Today</span>
                <span className="font-medium text-green-600">0</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center text-gray-500 py-4">
              <p>No recent activity</p>
              <p className="text-sm mt-1">Create your first project to get started!</p>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">PRD Processing</h3>
              <p className="text-sm text-gray-600 mt-1">AI-powered task breakdown from requirements</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Task Management</h3>
              <p className="text-sm text-gray-600 mt-1">Kanban boards with drag-and-drop</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-600 mt-1">Context-aware project guidance</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Time Tracking</h3>
              <p className="text-sm text-gray-600 mt-1">Automated and manual time logging</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <PRDUpload 
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          onAddExisting={handleAddExisting}
        />
      )}
    </Layout>
  );
}