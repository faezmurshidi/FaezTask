import React, { useState, useEffect } from 'react';

interface GitHubRepoCreatorProps {
  projectPath: string;
  onRepoCreated?: (repoInfo: any) => void;
  onCancel?: () => void;
}

interface CreateRepoOptions {
  name: string;
  description: string;
  isPrivate: boolean;
  initializeWithReadme: boolean;
  addGitIgnore: string;
  license: string;
}

const GITIGNORE_TEMPLATES = [
  '',
  'Node',
  'Python', 
  'Java',
  'Go',
  'Rust',
  'C++',
  'React',
  'NextJS',
  'Vue',
  'Angular'
];

const LICENSE_OPTIONS = [
  '',
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'ISC',
  'MPL-2.0'
];

export const GitHubRepoCreator: React.FC<GitHubRepoCreatorProps> = ({
  projectPath,
  onRepoCreated,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateRepoOptions>({
    name: '',
    description: '',
    isPrivate: false,
    initializeWithReadme: true,
    addGitIgnore: '',
    license: ''
  });

  const [isCreating, setIsCreating] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [nameCheckTimeout, setNameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get authenticated username on component mount
  useEffect(() => {
    const getUsername = async () => {
      try {
        const authResult = await window.electronAPI.githubAuthStatus(projectPath);
        if (authResult.success && authResult.authenticated) {
          setUsername(authResult.username || '');
        }
      } catch (err) {
        console.error('Failed to get auth status:', err);
      }
    };
    getUsername();
  }, [projectPath]);

  // Check repository name availability with debounce
  useEffect(() => {
    if (formData.name.trim() && username) {
      // Clear existing timeout
      if (nameCheckTimeout) {
        clearTimeout(nameCheckTimeout);
      }

      // Set new timeout for debounced name checking
      const timeout = setTimeout(async () => {
        setNameCheckLoading(true);
        try {
          const result = await window.electronAPI.githubCheckRepoName(formData.name.trim(), username);
          setNameAvailable(result.success && result.available !== undefined ? result.available : null);
        } catch (err) {
          console.error('Name check failed:', err);
          setNameAvailable(null);
        } finally {
          setNameCheckLoading(false);
        }
      }, 800); // 800ms debounce

      setNameCheckTimeout(timeout);
    } else {
      setNameAvailable(null);
    }

    // Cleanup timeout on unmount
    return () => {
      if (nameCheckTimeout) {
        clearTimeout(nameCheckTimeout);
      }
    };
  }, [formData.name, username]);

  const handleInputChange = (field: keyof CreateRepoOptions, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user makes changes
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Repository name is required');
      return false;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(formData.name)) {
      setError('Repository name can only contain letters, numbers, dots, hyphens, and underscores');
      return false;
    }

    if (nameAvailable === false) {
      setError('Repository name is already taken');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const result = await window.electronAPI.githubCreateRepo(projectPath, formData);
      
      if (result.success) {
        onRepoCreated?.(result.repository);
      } else {
        setError(result.error || 'Failed to create repository');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const getNameStatusIcon = () => {
    if (nameCheckLoading) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
    }
    if (nameAvailable === true) {
      return <span className="text-green-500">✅</span>;
    }
    if (nameAvailable === false) {
      return <span className="text-red-500">❌</span>;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Repository</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Repository Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repository Name *
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">{username}/</span>
            <div className="flex-1 relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-awesome-project"
                disabled={isCreating}
              />
              <div className="absolute right-3 top-2.5">
                {getNameStatusIcon()}
              </div>
            </div>
          </div>
          {nameAvailable === false && (
            <p className="text-red-500 text-sm mt-1">Repository name is already taken</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="A brief description of your project..."
            disabled={isCreating}
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.isPrivate}
                onChange={() => handleInputChange('isPrivate', false)}
                className="mr-2"
                disabled={isCreating}
              />
              <span className="text-sm">🌍 Public - Anyone can see this repository</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.isPrivate}
                onChange={() => handleInputChange('isPrivate', true)}
                className="mr-2"
                disabled={isCreating}
              />
              <span className="text-sm">🔒 Private - Only you can see this repository</span>
            </label>
          </div>
        </div>

        {/* Initialize with README */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.initializeWithReadme}
            onChange={(e) => handleInputChange('initializeWithReadme', e.target.checked)}
            className="mr-2"
            disabled={isCreating}
          />
          <label className="text-sm text-gray-700">
            Initialize with README file
          </label>
        </div>

        {/* .gitignore Template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            .gitignore Template
          </label>
          <select
            value={formData.addGitIgnore}
            onChange={(e) => handleInputChange('addGitIgnore', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
          >
            <option value="">None</option>
            {GITIGNORE_TEMPLATES.slice(1).map(template => (
              <option key={template} value={template}>{template}</option>
            ))}
          </select>
        </div>

        {/* License */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License
          </label>
          <select
            value={formData.license}
            onChange={(e) => handleInputChange('license', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
          >
            <option value="">None</option>
            {LICENSE_OPTIONS.slice(1).map(license => (
              <option key={license} value={license}>{license}</option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isCreating}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            disabled={isCreating || !formData.name.trim() || nameAvailable === false}
          >
            {isCreating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isCreating ? 'Creating Repository...' : 'Create Repository'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}; 