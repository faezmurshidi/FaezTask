'use client';

import { useState, useEffect } from 'react';
import { GitStatus } from '@/types';
import { electronAPI } from '@/lib/electronAPI';

interface GitStatusBadgeProps {
  projectPath?: string;
  className?: string;
}

export default function GitStatusBadge({ projectPath, className = '' }: GitStatusBadgeProps) {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
    
    try {
      const result = await electronAPI.gitInit(projectPath);
      if (result.success) {
        await loadGitStatus(); // Refresh status after init
      }
    } catch (error) {
      console.error('Failed to initialize git:', error);
    }
  };

  const handleCommitChanges = async () => {
    if (!projectPath) return;
    
    try {
      // Add all files
      await electronAPI.gitAdd(projectPath, ['.']);
      
      // Commit with a default message
      const result = await electronAPI.gitCommit(projectPath, `Auto-commit: ${new Date().toISOString()}`);
      
      if (result.success) {
        await loadGitStatus(); // Refresh status after commit
      }
    } catch (error) {
      console.error('Failed to commit changes:', error);
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${className}`}>
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
        <span className="ml-1">Loading...</span>
      </div>
    );
  }

  if (!gitStatus) {
    return null;
  }

  if (!gitStatus.isGitRepo) {
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ${className}`}
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Connect Git
        </button>
        
        {showActions && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-max">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInitGit();
                setShowActions(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Initialize Git Repository
            </button>
          </div>
        )}
      </div>
    );
  }

  const getStatusColor = () => {
    if (gitStatus.hasConflicts) return 'bg-red-100 text-red-800';
    if (gitStatus.uncommittedChanges > 0) return 'bg-yellow-100 text-yellow-800';
    if (gitStatus.unpushedCommits > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = () => {
    if (gitStatus.hasConflicts) {
      return (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (gitStatus.uncommittedChanges > 0) {
      return (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    if (gitStatus.unpushedCommits > 0) {
      return (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (gitStatus.hasConflicts) return 'Conflicts';
    if (gitStatus.uncommittedChanges > 0) return `${gitStatus.uncommittedChanges} changes`;
    if (gitStatus.unpushedCommits > 0) return `${gitStatus.unpushedCommits} to push`;
    return 'Up to date';
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs hover:opacity-80 transition-opacity ${getStatusColor()} ${className}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {gitStatus.currentBranch && (
          <span className="ml-1 opacity-75">({gitStatus.currentBranch})</span>
        )}
      </button>

      {showActions && gitStatus.uncommittedChanges > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-max">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCommitChanges();
              setShowActions(false);
            }}
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Quick Commit All Changes
          </button>
        </div>
      )}
    </div>
  );
} 