'use client';

import React, { useState, useEffect } from 'react';

interface ProjectCreatorProps {
  onProjectCreated?: () => void;
  onCancel?: () => void;
}

type ProjectType = 'existing' | 'new' | null;

interface NewProjectData {
  name: string;
  location: string;
  description?: string;
}

const ProjectCreator: React.FC<ProjectCreatorProps> = ({ onProjectCreated, onCancel }) => {
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [newProjectData, setNewProjectData] = useState<NewProjectData>({
    name: '',
    location: '',
    description: ''
  });
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'type' | 'details' | 'prd'>('type');
  const [taskMasterInitialized, setTaskMasterInitialized] = useState(false);
  const [showPRDUpload, setShowPRDUpload] = useState(false);

  const handleSelectFolder = async () => {
    try {
      setError('');
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openDirectory'],
        title: projectType === 'existing' ? 'Select Project Folder' : 'Select Location for New Project'
      });
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        
        if (projectType === 'existing') {
          setSelectedFolder(folderPath);
          // Check for .taskmaster directory
          const hasTaskMaster = await window.electronAPI.pathExists(`${folderPath}/.taskmaster`);
          if (!hasTaskMaster) {
            setError('Selected folder does not contain a Task Master project (.taskmaster directory not found)');
            return;
          }
        } else {
          setNewProjectData(prev => ({ ...prev, location: folderPath }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to select folder');
    }
  };

  const handleInitializeTaskMaster = async () => {
    if (!newProjectData.name || !newProjectData.location) {
      setError('Project name and location are required');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const projectPath = `${newProjectData.location}/${newProjectData.name}`;
      
      // Initialize Task Master via IPC
      const result = await window.electronAPI.initializeTaskMaster({
        projectPath,
        projectName: newProjectData.name,
        projectDescription: newProjectData.description || '',
        skipInstall: false,
        yes: true
      });

      if (result.success) {
        // Add project to persistent list
        const projectMetadata = {
          id: `project_${Date.now()}`,
          name: newProjectData.name,
          description: newProjectData.description || '',
          local_folder_path: projectPath,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_opened: new Date().toISOString()
        };

        await window.electronAPI.addProjectToList(projectMetadata);
        
        setTaskMasterInitialized(true);
        setStep('prd');
      } else {
        throw new Error(result.error || 'Failed to initialize Task Master');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize project');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddExistingProject = async () => {
    if (!selectedFolder) {
      setError('Please select a project folder');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Check existing project via IPC
      const result = await window.electronAPI.addExistingProject(selectedFolder);
      
      if (result.success && result.project) {
        // Project has Task Master - add to persistent list
        await window.electronAPI.addProjectToList(result.project);
        onProjectCreated?.();
      } else if (result.needsTaskMaster) {
        // Project needs Task Master initialization - show prompt
        setIsProcessing(false);
        const shouldInitialize = window.confirm(
          `${result.message}\n\nProject: ${result.projectName}\nLocation: ${result.projectPath}\n\nThis will initialize Task Master in the selected folder.`
        );
        
        if (shouldInitialize) {
          setIsProcessing(true);
          
          // Initialize Task Master in the existing project
          const initResult = await window.electronAPI.initializeTaskMaster({
            projectPath: result.projectPath!,
            projectName: result.projectName!,
            projectDescription: '',
            skipInstall: false,
            yes: true
          });

          if (initResult.success) {
            // After successful initialization, add project to list
            const projectMetadata = {
              id: `project_${Date.now()}`,
              name: result.projectName!,
              description: '',
              local_folder_path: result.projectPath!,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_opened: new Date().toISOString()
            };

            await window.electronAPI.addProjectToList(projectMetadata);
            onProjectCreated?.();
          } else {
            throw new Error(initResult.error || 'Failed to initialize Task Master');
          }
        }
        return; // Exit early if user cancels
      } else {
        throw new Error(result.error || 'Failed to add existing project');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add existing project');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipPRD = () => {
    onProjectCreated?.();
  };

  const handlePRDProcessed = () => {
    onProjectCreated?.();
  };

  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">What would you like to do?</h3>
        <div className="space-y-3">
          <button
            onClick={() => setProjectType('existing')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add Existing Project</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Import an existing project that already has Task Master initialized
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setProjectType('new')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create New Project</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Start a new project with Task Master initialization and optional PRD processing
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderExistingProject = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Existing Project</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select any project folder. If it doesn't have Task Master initialized, we'll help you set it up.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Folder
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={selectedFolder}
              readOnly
              placeholder="No folder selected"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
            />
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => setProjectType(null)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleAddExistingProject}
            disabled={!selectedFolder || isProcessing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Adding Project...' : 'Add Project'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNewProject = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create a new project with Task Master initialization.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={newProjectData.name}
            onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter project name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={newProjectData.description}
            onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of your project"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Location *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newProjectData.location}
              readOnly
              placeholder="Select where to create the project"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
            />
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse
            </button>
          </div>
          {newProjectData.location && (
            <p className="text-xs text-gray-500 mt-1">
              Project will be created at: {newProjectData.location}/{newProjectData.name}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => setProjectType(null)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleInitializeTaskMaster}
            disabled={!newProjectData.name || !newProjectData.location || isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPRDStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Created Successfully! 🎉</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your project has been created and Task Master has been initialized. You can now optionally upload a PRD (Product Requirements Document) to automatically generate initial tasks.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-800">Task Master Initialized</h4>
            <p className="text-sm text-green-700 mt-1">
              Project: {newProjectData.name}<br />
              Location: {newProjectData.location}/{newProjectData.name}
            </p>
          </div>
        </div>
      </div>

      {!showPRDUpload ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Would you like to upload a PRD?</h4>
            <p className="text-xs text-gray-500 mb-4">
              A PRD helps automatically generate initial tasks for your project. You can also add tasks manually later.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSkipPRD}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={() => setShowPRDUpload(true)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload PRD
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              PRD Upload functionality will be available here.
            </p>
            <p className="text-xs text-gray-500">
              TODO: Integrate PRD upload and processing via Task Master CLI
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => setShowPRDUpload(false)}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePRDProcessed}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Update step when project type is selected
  useEffect(() => {
    if (projectType && step === 'type') {
      setStep('details');
    }
  }, [projectType, step]);

  return (
    <div className="max-w-2xl mx-auto">
      {step === 'type' && renderTypeSelection()}
      {step === 'details' && projectType === 'existing' && renderExistingProject()}
      {step === 'details' && projectType === 'new' && renderNewProject()}
      {step === 'prd' && renderPRDStep()}
    </div>
  );
};

export default ProjectCreator; 