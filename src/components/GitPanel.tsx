'use client';

import { useState, useEffect } from 'react';
import { GitStatus } from '@/types';
import { electronAPI } from '@/lib/electronAPI';

interface GitPanelProps {
  projectPath?: string;
}

export default function GitPanel({ projectPath }: GitPanelProps) {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [showRemoteForm, setShowRemoteForm] = useState(false);

  useEffect(() => {
    if (projectPath && electronAPI.isElectron()) {
      loadGitStatus();
    }
  }, [projectPath]);

  const loadGitStatus = async () => {
    if (!projectPath) return;
    
    setLoading(true);
    try {
      const result = await electronAPI.gitStatus(projectPath);
      if (result.success) {
        setGitStatus(result.status);
      }
    } catch (error) {
      console.error('Failed to load git status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitGit = async () => {
    if (!projectPath) return;
    
    setActionLoading('init');
    try {
      const result = await electronAPI.gitInit(projectPath);
      if (result.success) {
        await loadGitStatus();
      }
    } catch (error) {
      console.error('Failed to initialize git:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommit = async () => {
    if (!projectPath || !commitMessage.trim()) return;
    
    setActionLoading('commit');
    try {
      // Add all files first
      await electronAPI.gitAdd(projectPath, ['.']);
      
      // Then commit
      const result = await electronAPI.gitCommit(projectPath, commitMessage);
      if (result.success) {
        setCommitMessage('');
        await loadGitStatus();
      }
    } catch (error) {
      console.error('Failed to commit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePush = async () => {
    if (!projectPath) return;
    
    setActionLoading('push');
    try {
      const result = await electronAPI.gitPush(projectPath);
      if (result.success) {
        await loadGitStatus();
      }
    } catch (error) {
      console.error('Failed to push:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePull = async () => {
    if (!projectPath) return;
    
    setActionLoading('pull');
    try {
      const result = await electronAPI.gitPull(projectPath);
      if (result.success) {
        await loadGitStatus();
      }
    } catch (error) {
      console.error('Failed to pull:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddRemote = async () => {
    if (!projectPath || !remoteUrl.trim()) return;
    
    setActionLoading('remote');
    try {
      const result = await electronAPI.gitAddRemote(projectPath, 'origin', remoteUrl);
      if (result.success) {
        setRemoteUrl('');
        setShowRemoteForm(false);
        await loadGitStatus();
      }
    } catch (error) {
      console.error('Failed to add remote:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!projectPath || !electronAPI.isElectron()) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Git integration not available</h3>
        <p className="mt-1 text-sm text-gray-500">Git operations are only available in Electron mode.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!gitStatus?.isGitRepo) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Initialize Git Repository</h3>
          <p className="mt-1 text-sm text-gray-500">
            This project is not yet a Git repository. Initialize it to start version control.
          </p>
          <div className="mt-6">
            <button
              onClick={handleInitGit}
              disabled={actionLoading === 'init'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'init' ? 'Initializing...' : 'Initialize Git Repository'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Git Repository</h3>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              <span>Branch: {gitStatus.currentBranch || 'unknown'}</span>
              {gitStatus.hasRemote && (
                <span className="ml-2 text-green-600">• Connected to remote</span>
              )}
            </div>
          </div>
          <button
            onClick={loadGitStatus}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh git status"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{gitStatus.uncommittedChanges}</div>
            <div className="text-sm text-gray-500">Uncommitted</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{gitStatus.unpushedCommits}</div>
            <div className="text-sm text-gray-500">Unpushed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{gitStatus.hasConflicts ? '⚠️' : '✅'}</div>
            <div className="text-sm text-gray-500">{gitStatus.hasConflicts ? 'Conflicts' : 'Clean'}</div>
          </div>
        </div>

        {/* Last Commit Info */}
        {gitStatus.lastCommitMessage && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Latest Commit</h4>
            <p className="text-sm text-gray-600">{gitStatus.lastCommitMessage}</p>
            {gitStatus.lastCommitHash && (
              <p className="text-xs text-gray-500 mt-1 font-mono">{gitStatus.lastCommitHash.substring(0, 8)}</p>
            )}
          </div>
        )}

        {/* Commit Section */}
        {gitStatus.uncommittedChanges > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Commit Changes</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Enter commit message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || actionLoading === 'commit'}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'commit' ? 'Committing...' : 'Commit'}
              </button>
            </div>
          </div>
        )}

        {/* Remote Actions */}
        {gitStatus.hasRemote ? (
          <div className="flex space-x-2">
            <button
              onClick={handlePull}
              disabled={actionLoading === 'pull'}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'pull' ? 'Pulling...' : 'Pull'}
            </button>
            <button
              onClick={handlePush}
              disabled={actionLoading === 'push' || gitStatus.unpushedCommits === 0}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'push' ? 'Pushing...' : `Push ${gitStatus.unpushedCommits > 0 ? `(${gitStatus.unpushedCommits})` : ''}`}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Remote Repository</h4>
              <button
                onClick={() => setShowRemoteForm(!showRemoteForm)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showRemoteForm ? 'Cancel' : 'Add Remote'}
              </button>
            </div>
            
            {showRemoteForm && (
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddRemote}
                  disabled={!remoteUrl.trim() || actionLoading === 'remote'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'remote' ? 'Adding...' : 'Add'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 