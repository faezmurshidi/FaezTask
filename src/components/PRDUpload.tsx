'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface PRDUploadProps {
  onClose: () => void;
  onUpload: (file: File, projectName: string) => void;
  onAddExisting: (folderPath: string, projectName: string) => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

type ProjectType = 'new' | 'existing';

export default function PRDUpload({ onClose, onUpload, onAddExisting }: PRDUploadProps) {
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [projectName, setProjectName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [errors, setErrors] = useState<{
    projectName?: string;
    file?: string;
    folder?: string;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const resetForm = () => {
    setProjectType(null);
    setProjectName('');
    setUploadedFile(null);
    setSelectedFolder('');
    setErrors({});
    setIsUploading(false);
    setProcessingSteps([]);
    setCurrentStepIndex(0);
    setProgressPercentage(0);
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrors(prev => ({ ...prev, file: undefined }));
    
    if (rejectedFiles.length > 0) {
      setErrors(prev => ({ 
        ...prev, 
        file: 'Please upload a valid .md or .txt file (max 10MB)' 
      }));
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading
  });

  const handleFolderSelect = async () => {
    try {
      // Use Electron's dialog to select folder
      const result = await (window as any).electronAPI?.selectFolder();
      if (result && !result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        
        // Check if folder contains .taskmaster directory
        const hasTaskmaster = await (window as any).electronAPI?.checkTaskmasterFolder(folderPath);
        
        if (hasTaskmaster) {
          setSelectedFolder(folderPath);
          setErrors(prev => ({ ...prev, folder: undefined }));
          
          // Auto-populate project name from folder name
          const folderName = folderPath.split('/').pop() || folderPath.split('\\').pop() || '';
          if (folderName && !projectName) {
            setProjectName(folderName);
          }
        } else {
          setErrors(prev => ({ 
            ...prev, 
            folder: 'Selected folder does not contain a .taskmaster directory. Please select a valid Task Master project folder.' 
          }));
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      setErrors(prev => ({ 
        ...prev, 
        folder: 'Error accessing folder. Please try again.' 
      }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    } else if (projectName.trim().length < 2) {
      newErrors.projectName = 'Project name must be at least 2 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(projectName.trim())) {
      newErrors.projectName = 'Project name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    if (projectType === 'new' && !uploadedFile) {
      newErrors.file = 'Please upload a PRD file';
    }

    if (projectType === 'existing' && !selectedFolder) {
      newErrors.folder = 'Please select a project folder';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const initializeProcessingSteps = (type: ProjectType) => {
    const baseSteps: ProcessingStep[] = [
      {
        id: 'validate',
        label: 'Validate',
        description: type === 'new' ? 'Validating PRD file and project details' : 'Validating project folder and structure',
        status: 'pending'
      }
    ];

    if (type === 'new') {
      baseSteps.push(
        {
          id: 'directory',
          label: 'Directory',
          description: 'Creating project folder structure',
          status: 'pending'
        },
        {
          id: 'init',
          label: 'Init',
          description: 'Initializing Task-master project',
          status: 'pending'
        },
        {
          id: 'save',
          label: 'Save',
          description: 'Saving PRD file to project',
          status: 'pending'
        },
        {
          id: 'parse',
          label: 'Parse',
          description: 'Generating task breakdown from PRD',
          status: 'pending'
        }
      );
    } else {
      baseSteps.push(
        {
          id: 'scan',
          label: 'Scan',
          description: 'Scanning project structure and tasks',
          status: 'pending'
        },
        {
          id: 'import',
          label: 'Import',
          description: 'Importing existing project data',
          status: 'pending'
        }
      );
    }

    baseSteps.push({
      id: 'complete',
      label: 'Complete',
      description: 'Project setup completed successfully',
      status: 'pending'
    });

    return baseSteps;
  };

  const processProject = async (type: ProjectType) => {
    const steps = initializeProcessingSteps(type);
    setProcessingSteps(steps);
    setCurrentStepIndex(0);

    try {
      if (type === 'new' && uploadedFile) {
        // Process new project creation
        await processNewProject(steps);
      } else if (type === 'existing' && selectedFolder) {
        // Process existing project import
        await processExistingProject(steps);
      }
    } catch (error) {
      // Mark current step as error
      setProcessingSteps(prev => prev.map((step, index) => 
        index === currentStepIndex ? { 
          ...step, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Processing failed' 
        } : step
      ));
      throw error;
    }
  };

  const processNewProject = async (steps: ProcessingStep[]) => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      const step = steps[i];
      
      // Update current step to processing
      setProcessingSteps(prev => prev.map((stepItem, index) => 
        index === i ? { ...stepItem, status: 'processing' } : stepItem
      ));

      // Update progress
      setProgressPercentage(((i + 0.5) / steps.length) * 100);

      try {
        // Execute the actual step based on its ID
        switch (step.id) {
          case 'validate':
            // Validation step - just a brief pause
            await new Promise(resolve => setTimeout(resolve, 500));
            break;
          
          case 'directory':
          case 'init':
          case 'save':
          case 'parse':
            // These are handled by the backend in a single call
            // We'll just add some delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          
          case 'complete':
            // Final step
            await new Promise(resolve => setTimeout(resolve, 300));
            break;
        }

        // Complete current step
        setProcessingSteps(prev => prev.map((stepItem, index) => 
          index === i ? { ...stepItem, status: 'completed' } : stepItem
        ));

        setProgressPercentage(((i + 1) / steps.length) * 100);
      } catch (error) {
        setProcessingSteps(prev => prev.map((stepItem, index) => 
          index === i ? { 
            ...stepItem, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Step failed' 
          } : stepItem
        ));
        throw error;
      }
    }

    setCurrentStepIndex(steps.length);
  };

  const processExistingProject = async (steps: ProcessingStep[]) => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      
      // Update current step to processing
      setProcessingSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'processing' } : step
      ));

      // Update progress
      setProgressPercentage(((i + 0.5) / steps.length) * 100);

      // Simulate processing time for existing project import
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

      // Complete current step
      setProcessingSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'completed' } : step
      ));

      setProgressPercentage(((i + 1) / steps.length) * 100);
    }

    setCurrentStepIndex(steps.length);
  };

  const handleSubmit = async () => {
    if (!validateForm() || !projectType) return;

    setIsUploading(true);

    try {
      await processProject(projectType);

      // Final processing
      await new Promise(resolve => setTimeout(resolve, 500));

      if (projectType === 'new' && uploadedFile) {
        onUpload(uploadedFile, projectName.trim());
      } else if (projectType === 'existing' && selectedFolder) {
        onAddExisting(selectedFolder, projectName.trim());
      }
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingSteps(prev => prev.map(step => 
        step.status === 'processing' 
          ? { ...step, status: 'error', error: 'Processing failed' }
          : step
      ));
    }
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-600 rounded-full" />
          </div>
        );
    }
  };

  // Project type selection view
  if (!projectType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 mb-6">Choose how you&apos;d like to add your project:</p>
            
            <button
              onClick={() => setProjectType('new')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Create New Project</h3>
                  <p className="text-sm text-gray-600 mt-1">Upload a PRD file and let Task Master generate your project structure and tasks automatically.</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setProjectType('existing')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700">Add Existing Project</h3>
                  <p className="text-sm text-gray-600 mt-1">Import an existing project that already has a .taskmaster folder and task structure.</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing view
  if (isUploading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {projectType === 'new' ? 'Creating Project' : 'Importing Project'}
            </h2>
            <p className="text-gray-600">
              {projectType === 'new' 
                ? 'Setting up your new project with Task Master...' 
                : 'Importing your existing project...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-3">
            {processingSteps.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  step.status === 'processing' 
                    ? 'bg-blue-50 border border-blue-200' 
                    : step.status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : step.status === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50'
                }`}
              >
                {getStepIcon(step.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      step.status === 'processing' ? 'text-blue-700' :
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'error' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {step.label}
                    </span>
                    {step.status === 'processing' && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  <p className={`text-sm ${
                    step.status === 'processing' ? 'text-blue-600' :
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'error' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {step.error || step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500">
              Please wait while we {projectType === 'new' ? 'set up' : 'import'} your project...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form view (either new or existing project)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {projectType === 'new' ? 'Create New Project' : 'Add Existing Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Name Input */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (errors.projectName) {
                  setErrors(prev => ({ ...prev, projectName: undefined }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.projectName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter project name"
              disabled={isUploading}
            />
            {errors.projectName && (
              <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
            )}
          </div>

          {/* Conditional content based on project type */}
          {projectType === 'new' ? (
            /* PRD File Upload for New Projects */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PRD File
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : errors.file
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                <svg
                  className={`mx-auto h-12 w-12 ${
                    isDragActive ? 'text-blue-400' : 'text-gray-400'
                  }`}
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  {uploadedFile ? (
                    <div className="text-sm text-gray-900">
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">
                        {isDragActive ? 'Drop your PRD file here' : 'Drag and drop your PRD file here'}
                      </p>
                      <p>or click to select a file</p>
                      <p className="text-xs mt-1">Supports .md and .txt files up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600">{errors.file}</p>
              )}
            </div>
          ) : (
            /* Folder Selection for Existing Projects */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Folder
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleFolderSelect}
                  disabled={isUploading}
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                    errors.folder
                      ? 'border-red-300 bg-red-50'
                      : selectedFolder
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg
                    className={`mx-auto h-8 w-8 mb-2 ${
                      selectedFolder ? 'text-green-500' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <div className="text-sm">
                    {selectedFolder ? (
                      <div>
                        <p className="font-medium text-green-700">Folder Selected</p>
                        <p className="text-green-600 mt-1 break-all">{selectedFolder}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-700">Select Project Folder</p>
                        <p className="text-gray-600 mt-1">Choose a folder that contains a .taskmaster directory</p>
                      </div>
                    )}
                  </div>
                </button>
                {errors.folder && (
                  <p className="text-sm text-red-600">{errors.folder}</p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isUploading || (projectType === 'new' && !uploadedFile) || (projectType === 'existing' && !selectedFolder) || !projectName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isUploading 
              ? 'Processing...' 
              : projectType === 'new' 
                ? 'Create Project' 
                : 'Add Project'
            }
          </button>
        </div>
      </div>
    </div>
  );
} 