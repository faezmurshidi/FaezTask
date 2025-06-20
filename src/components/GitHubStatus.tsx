import React, { useState, useEffect } from 'react';
import { GitHubRepoCreator } from './GitHubRepoCreator';

interface GitHubStatusProps {
  projectPath: string;
}

interface GitHubCliStatus {
  available: boolean;
  version?: string;
  path?: string;
}

interface GitHubAuthStatus {
  authenticated: boolean;
  username?: string;
  scopes?: string[];
  protocol?: string;
  error?: string;
}

interface GitHubRepoInfo {
  isGitHubRepo: boolean;
  repoInfo?: {
    owner: string;
    name: string;
    fullName: string;
    url: string;
    isPrivate: boolean;
  };
  error?: string;
}

export const GitHubStatus: React.FC<GitHubStatusProps> = ({ projectPath }) => {
  const [cliStatus, setCLIStatus] = useState<GitHubCliStatus | null>(null);
  const [authStatus, setAuthStatus] = useState<GitHubAuthStatus | null>(null);
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRepoCreator, setShowRepoCreator] = useState(false);

  const checkGitHubStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in an Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const electronAPI = (window as any).electronAPI;

        // Test 1: Check CLI availability
        console.log('🔍 Checking GitHub CLI availability...');
        const cliResult = await electronAPI.githubCliAvailable(projectPath);
        console.log('CLI Result:', cliResult);
        setCLIStatus(cliResult.success ? cliResult : { available: false });

        // Test 2: Check authentication status
        console.log('🔐 Checking GitHub authentication...');
        const authResult = await electronAPI.githubAuthStatus(projectPath);
        console.log('Auth Result:', authResult);
        setAuthStatus(authResult.success ? authResult : { authenticated: false, error: authResult.error });

        // Test 3: Check repository info
        console.log('📁 Checking GitHub repository info...');
        const repoResult = await electronAPI.githubIsRepo(projectPath);
        console.log('Repo Result:', repoResult);
        setRepoInfo(repoResult);

      } else {
        // Mock data for web development
        setCLIStatus({ available: false });
        setAuthStatus({ authenticated: false, error: 'Not in Electron environment' });
        setRepoInfo({ isGitHubRepo: false, error: 'Not in Electron environment' });
      }
    } catch (err) {
      console.error('Error checking GitHub status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkGitHubStatus();
  }, [projectPath]);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Checking GitHub CLI status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-red-600 font-semibold">❌ Error:</span>
          <span className="text-red-700">{error}</span>
        </div>
        <button 
          onClick={checkGitHubStatus}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">GitHub CLI Integration Status</h3>
      
      {/* CLI Availability Status */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">GitHub CLI Availability</h4>
        {cliStatus?.available ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-700">GitHub CLI is installed</span>
            </div>
            {cliStatus.version && (
              <div className="text-sm text-gray-600 ml-6">
                Version: {cliStatus.version}
              </div>
            )}
            {cliStatus.path && (
              <div className="text-sm text-gray-600 ml-6">
                Path: {cliStatus.path}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-700">GitHub CLI not found</span>
          </div>
        )}
      </div>

      {/* Authentication Status */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">GitHub Authentication</h4>
        {authStatus?.authenticated ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-700">Authenticated</span>
            </div>
            {authStatus.username && (
              <div className="text-sm text-gray-600 ml-6">
                User: {authStatus.username}
              </div>
            )}
            {authStatus.protocol && (
              <div className="text-sm text-gray-600 ml-6">
                Protocol: {authStatus.protocol}
              </div>
            )}
            {authStatus.scopes && authStatus.scopes.length > 0 && (
              <div className="text-sm text-gray-600 ml-6">
                Scopes: {authStatus.scopes.join(', ')}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-red-700">Not authenticated</span>
            </div>
            {authStatus?.error && (
              <div className="text-sm text-red-600 ml-6">
                {authStatus.error}
              </div>
            )}
            <div className="text-sm text-gray-600 ml-6">
              Run <code className="bg-gray-200 px-1 rounded">gh auth login</code> to authenticate
            </div>
          </div>
        )}
      </div>

      {/* Repository Status */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">GitHub Repository</h4>
        {repoInfo?.isGitHubRepo ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-700">Connected to GitHub repository</span>
            </div>
            {repoInfo.repoInfo && (
              <div className="ml-6 space-y-1 text-sm text-gray-600">
                <div>Repository: {repoInfo.repoInfo.fullName}</div>
                <div>Owner: {repoInfo.repoInfo.owner}</div>
                <div>Visibility: {repoInfo.repoInfo.isPrivate ? 'Private' : 'Public'}</div>
                <div>URL: <a href={repoInfo.repoInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{repoInfo.repoInfo.url}</a></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-yellow-700">Not a GitHub repository</span>
            </div>
            {repoInfo?.error && (
              <div className="text-sm text-gray-600 ml-6">
                {repoInfo.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="flex justify-between items-center">
        <div>
          {/* Repository Creation Button - only show if authenticated and CLI available */}
          {cliStatus?.available && authStatus?.authenticated && !repoInfo?.isGitHubRepo && (
            <button 
              onClick={() => setShowRepoCreator(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Create Repository</span>
            </button>
          )}
        </div>
        
        <button 
          onClick={checkGitHubStatus}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
        >
          Refresh Status
        </button>
      </div>

      {/* Repository Creator Modal */}
      {showRepoCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <GitHubRepoCreator
              projectPath={projectPath}
              onRepoCreated={(repoInfo) => {
                console.log('Repository created:', repoInfo);
                setShowRepoCreator(false);
                // Refresh the status to show the new repository
                checkGitHubStatus();
              }}
              onCancel={() => setShowRepoCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 