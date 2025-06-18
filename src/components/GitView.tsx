'use client';

import { useState, useEffect } from 'react';
import { GitStatus } from '@/types';
import { electronAPI } from '@/lib/electronAPI';
import GitCommitAnalysis from './GitCommitAnalysis';

interface FileStatus {
  path: string;
  status: 'M' | 'A' | 'D' | '??' | 'R' | 'C';
  staged: boolean;
}

export default function GitView() {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [fileChanges, setFileChanges] = useState<FileStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'pull' | 'push' | 'push-upstream' | 'pull-and-push' | 'commit' | 'init' | 'stage-all' | string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [showRemoteForm, setShowRemoteForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [pushError, setPushError] = useState<string | null>(null);
  const [needsUpstream, setNeedsUpstream] = useState(false);
  const [needsPull, setNeedsPull] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'analysis'>('status');

  // Use current project path - in a real app this would come from context
  const projectPath = '/Users/faez/Documents/FaezPM';

  useEffect(() => {
    if (electronAPI.isElectron()) {
      loadGitStatus();
      loadFileChanges();
    }
  }, []);

  const loadGitStatus = async () => {
    setLoading(true);
    try {
      const result = await electronAPI.gitStatus(projectPath);
      if (result.success) {
        setGitStatus(result.status);
        // Clear push error when status is refreshed
        setPushError(null);
        setNeedsUpstream(false);
        setNeedsPull(false);
      }
    } catch (error) {
      console.error('Failed to load git status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileChanges = async () => {
    try {
      const result = await electronAPI.gitGetFileStatus(projectPath);
      if (result.success) {
        setFileChanges(result.files);
      } else {
        console.error('Failed to load file changes:', result.error);
        setFileChanges([]);
      }
    } catch (error) {
      console.error('Failed to load file changes:', error);
      setFileChanges([]);
    }
  };

  const handleInitGit = async () => {
    setActionLoading('init');
    try {
      const result = await electronAPI.gitInit(projectPath);
      if (result.success) {
        await loadGitStatus();
        await loadFileChanges();
      }
    } catch (error) {
      console.error('Failed to initialize git:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStageFile = async (filePath: string) => {
    setActionLoading(`stage-${filePath}`);
    try {
      const result = await electronAPI.gitAdd(projectPath, [filePath]);
      if (result.success) {
        // Reload both git status and file changes for accurate state
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      } else {
        console.error('Failed to stage file:', result.error);
      }
    } catch (error) {
      console.error('Failed to stage file:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStageAll = async () => {
    setActionLoading('stage-all');
    try {
      const result = await electronAPI.gitAdd(projectPath, ['.']);
      if (result.success) {
        // Reload both git status and file changes for accurate state
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      } else {
        console.error('Failed to stage all files:', result.error);
      }
    } catch (error) {
      console.error('Failed to stage all files:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnstageFile = async (filePath: string) => {
    setActionLoading(`unstage-${filePath}`);
    try {
      const result = await electronAPI.gitUnstage(projectPath, [filePath]);
      if (result.success) {
        // Reload both git status and file changes for accurate state
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      } else {
        console.error('Failed to unstage file:', result.error);
      }
    } catch (error) {
      console.error('Failed to unstage file:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    setActionLoading('commit');
    try {
      const result = await electronAPI.gitCommit(projectPath, commitMessage);
      if (result.success) {
        setCommitMessage('');
        // Reload both git status and file changes for accurate state
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      } else {
        console.error('Failed to commit:', result.error);
      }
    } catch (error) {
      console.error('Failed to commit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePush = async () => {
    setActionLoading('push');
    setPushError(null);
    setNeedsUpstream(false);
    setNeedsPull(false);
    
    try {
      const result = await electronAPI.gitPush(projectPath);
      if (result.success) {
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      } else {
        setPushError(result.error || 'Failed to push');
        if (result.needsUpstream) {
          setNeedsUpstream(true);
        } else if (result.needsPull) {
          setNeedsPull(true);
        }
      }
    } catch (error) {
      console.error('Failed to push:', error);
      setPushError('Failed to push changes');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePushUpstream = async () => {
    setActionLoading('push-upstream');
    setPushError(null);
    setNeedsUpstream(false);
    setNeedsPull(false);
    
    try {
      const result = await electronAPI.gitPushUpstream(projectPath);
      if (result.success) {
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      } else {
        setPushError(result.error || 'Failed to push with upstream');
      }
    } catch (error) {
      console.error('Failed to push with upstream:', error);
      setPushError('Failed to push with upstream');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePullAndPush = async () => {
    setActionLoading('pull-and-push');
    setPushError(null);
    setNeedsUpstream(false);
    setNeedsPull(false);
    
    try {
      const result = await electronAPI.gitPullAndPush(projectPath);
      if (result.success) {
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      } else {
        setPushError(result.error || 'Failed to pull and push');
      }
    } catch (error) {
      console.error('Failed to pull and push:', error);
      setPushError('Failed to pull and push');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePull = async () => {
    setActionLoading('pull');
    try {
      const result = await electronAPI.gitPull(projectPath);
      if (result.success) {
        await Promise.all([
          loadGitStatus(),
          loadFileChanges()
        ]);
      }
    } catch (error) {
      console.error('Failed to pull:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string, staged: boolean) => {
    const baseColor = staged ? 'text-green-600' : '';
    
    switch (status) {
      case 'M':
        return { 
          icon: staged ? '📝✅' : '📝', 
          text: staged ? 'Modified (Staged)' : 'Modified', 
          color: staged ? 'text-green-600' : 'text-yellow-600',
          bgColor: staged ? 'bg-green-50' : 'bg-yellow-50'
        };
      case 'A':
        return { 
          icon: staged ? '➕✅' : '➕', 
          text: staged ? 'Added (Staged)' : 'Added', 
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'D':
        return { 
          icon: staged ? '🗑️✅' : '🗑️', 
          text: staged ? 'Deleted (Staged)' : 'Deleted', 
          color: staged ? 'text-green-600' : 'text-red-600',
          bgColor: staged ? 'bg-green-50' : 'bg-red-50'
        };
      case '??':
        return { 
          icon: '❓', 
          text: 'Untracked', 
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
      case 'R':
        return { 
          icon: staged ? '🔄✅' : '🔄', 
          text: staged ? 'Renamed (Staged)' : 'Renamed', 
          color: staged ? 'text-green-600' : 'text-blue-600',
          bgColor: staged ? 'bg-green-50' : 'bg-blue-50'
        };
      default:
        return { 
          icon: '📄', 
          text: 'Changed', 
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  if (!electronAPI.isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Git integration not available</h3>
          <p className="mt-1 text-sm text-gray-500">Git operations are only available in Electron mode.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gitStatus?.isGitRepo) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">Initialize Git Repository</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              This project is not yet a Git repository. Initialize it to start version control and track your changes.
            </p>
            <div className="mt-8">
              <button
                onClick={handleInitGit}
                disabled={actionLoading === 'init'}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'init' ? 'Initializing...' : 'Initialize Git Repository'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Git Repository</h1>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="font-medium">Branch: {gitStatus.currentBranch || 'main'}</span>
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Status & Changes
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Commit Analysis
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Changes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">File Changes</h3>
                  {fileChanges.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {fileChanges.filter(f => f.staged).length} staged · {fileChanges.filter(f => !f.staged).length} unstaged
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      loadFileChanges();
                      loadGitStatus();
                    }}
                    className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                    title="Refresh file status"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={handleStageAll}
                    disabled={actionLoading === 'stage-all' || fileChanges.length === 0 || fileChanges.every(f => f.staged)}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'stage-all' ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Staging...
                      </span>
                    ) : fileChanges.every(f => f.staged) ? 'All Staged' : 'Stage All'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {fileChanges.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="mt-2 font-medium">Working directory clean</p>
                  <p className="text-sm text-gray-400 mt-1">No changes detected in your repository</p>
                  <button
                    onClick={() => {
                      loadFileChanges();
                      loadGitStatus();
                    }}
                    className="mt-3 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {fileChanges.map((file) => {
                                              const statusInfo = getStatusIcon(file.status, file.staged);
                    return (
                      <div key={file.path} className={`p-4 hover:bg-gray-50 border-l-4 transition-colors ${file.staged ? 'border-green-400 bg-green-50' : 'border-gray-200'} ${statusInfo.bgColor}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <span className={`text-lg ${statusInfo.color}`}>{statusInfo.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${file.staged ? 'text-green-800' : 'text-gray-900'}`}>
                                {file.path}
                              </p>
                              <p className={`text-xs ${statusInfo.color}`}>
                                {statusInfo.text}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.staged ? (
                              <div className="flex items-center space-x-2">
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Staged
                                </span>
                                <button
                                  onClick={() => handleUnstageFile(file.path)}
                                  disabled={actionLoading === `unstage-${file.path}` || actionLoading === 'commit'}
                                  className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Unstage this file"
                                >
                                  {actionLoading === `unstage-${file.path}` ? (
                                    <span className="flex items-center">
                                      <div className="animate-spin rounded-full h-2 w-2 border border-orange-600 border-t-transparent mr-1"></div>
                                      Unstaging...
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                                      </svg>
                                      Unstage
                                    </span>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStageFile(file.path)}
                                disabled={actionLoading === `stage-${file.path}` || actionLoading === 'stage-all'}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {actionLoading === `stage-${file.path}` ? (
                                  <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-2 w-2 border border-gray-600 border-t-transparent mr-1"></div>
                                    Staging...
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Stage
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Commit Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Commit Changes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commit Message
                </label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter your commit message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || actionLoading === 'commit' || fileChanges.filter(f => f.staged).length === 0}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'commit' ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Committing...
                  </span>
                ) : fileChanges.filter(f => f.staged).length === 0 ? (
                  'No Staged Changes'
                ) : (
                  `Commit ${fileChanges.filter(f => f.staged).length} File${fileChanges.filter(f => f.staged).length === 1 ? '' : 's'}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="space-y-4">
          {/* Status Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Repository Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uncommitted Changes</span>
                <span className="text-sm font-medium">{gitStatus.uncommittedChanges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unpushed Commits</span>
                <span className="text-sm font-medium">{gitStatus.unpushedCommits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${gitStatus.isDirty ? 'text-yellow-600' : 'text-green-600'}`}>
                  {gitStatus.isDirty ? 'Dirty' : 'Clean'}
                </span>
              </div>
            </div>
          </div>

          {/* Remote Operations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Remote Operations</h3>
            
            {/* Push Error Display */}
            {pushError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-start">
                  <div className="text-red-400 mr-2">⚠️</div>
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Push Failed</p>
                    <p className="text-xs text-red-600 mt-1">{pushError}</p>
                    {needsUpstream && (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 mb-2">
                          This branch needs to be set up to track a remote branch.
                        </p>
                        <button
                          onClick={handlePushUpstream}
                          disabled={actionLoading === 'push-upstream'}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === 'push-upstream' ? 'Setting up...' : 'Push & Set Upstream'}
                        </button>
                      </div>
                    )}
                    {needsPull && (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 mb-2">
                          The remote repository has changes that you don't have locally. You need to pull first.
                        </p>
                        <button
                          onClick={handlePullAndPush}
                          disabled={actionLoading === 'pull-and-push'}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionLoading === 'pull-and-push' ? 'Pulling & Pushing...' : 'Pull & Push'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handlePull}
                disabled={actionLoading === 'pull'}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === 'pull' ? 'Pulling...' : 'Pull'}
              </button>
                          <button
              onClick={handlePush}
              disabled={actionLoading === 'push' || actionLoading === 'push-upstream' || actionLoading === 'pull-and-push'}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading === 'push' ? 'Pushing...' : 'Push'}
            </button>
            </div>
          </div>

          {/* Add Remote Repository */}
          {!gitStatus.hasRemote && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Remote Repository</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <div className="flex items-start">
                  <div className="text-yellow-400 mr-2">💡</div>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 font-medium">No Remote Repository</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Add a remote repository to enable push/pull operations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={async () => {
                    if (remoteUrl.trim()) {
                      const result = await electronAPI.gitAddRemote(projectPath, 'origin', remoteUrl);
                      if (result.success) {
                        setRemoteUrl('');
                        await loadGitStatus();
                      }
                    }
                  }}
                  disabled={!remoteUrl.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Remote Repository
                </button>
              </div>
            </div>
          )}

          {/* Last Commit */}
          {gitStatus.lastCommitMessage && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Commit</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{gitStatus.lastCommitMessage}</p>
                {gitStatus.lastCommitHash && (
                  <p className="text-xs text-gray-500 font-mono">{gitStatus.lastCommitHash.substring(0, 8)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'analysis' && (
        <GitCommitAnalysis projectPath={projectPath} />
      )}
    </div>
  );
} 