'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GitStatus, CommitAnalysis } from '@/types';
import { electronAPI } from '@/lib/electronAPI';

interface GitActivityWidgetProps {
  projectPath?: string;
}

const GitActivityWidget: React.FC<GitActivityWidgetProps> = ({ 
  projectPath = process.cwd() 
}) => {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [commitAnalysis, setCommitAnalysis] = useState<CommitAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGitData = useCallback(async () => {
    if (!electronAPI.isElectron()) {
      setError('Git data only available in Electron environment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load git status and recent commit analysis in parallel
      const [statusResult, analysisResult] = await Promise.all([
        electronAPI.gitStatus(projectPath),
        electronAPI.gitAnalyzeCommits(projectPath, { maxCount: 20 })
      ]);

      if (statusResult.success) {
        setGitStatus(statusResult.status);
      } else {
        setError(statusResult.error || 'Failed to load git status');
      }

      if (analysisResult.success) {
        setCommitAnalysis(analysisResult.analysis);
      }
    } catch (err) {
      console.error('Failed to load git data:', err);
      setError('Failed to load git data');
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    loadGitData();
    
    // Refresh git data every 30 seconds
    const interval = setInterval(loadGitData, 30000);
    
    return () => clearInterval(interval);
  }, [loadGitData]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getRecentCommitDays = () => {
    if (!commitAnalysis?.commitFrequency) return [];
    
    return Object.entries(commitAnalysis.commitFrequency)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7);
  };

  const getStatusColor = (status: GitStatus) => {
    if (!status.isGitRepo) return 'text-gray-500';
    if (status.hasConflicts) return 'text-red-500';
    if (status.uncommittedChanges > 0) return 'text-yellow-500';
    if (status.unpushedCommits > 0) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStatusIcon = (status: GitStatus) => {
    if (!status.isGitRepo) return '⚪';
    if (status.hasConflicts) return '🔴';
    if (status.uncommittedChanges > 0) return '🟡';
    if (status.unpushedCommits > 0) return '🔵';
    return '🟢';
  };

  const getStatusText = (status: GitStatus) => {
    if (!status.isGitRepo) return 'Not a Git repository';
    if (status.hasConflicts) return 'Has merge conflicts';
    if (status.uncommittedChanges > 0) return `${status.uncommittedChanges} uncommitted changes`;
    if (status.unpushedCommits > 0) return `${status.unpushedCommits} unpushed commits`;
    return 'All changes committed and pushed';
  };

  if (loading && !gitStatus) {
    return (
      <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Git Activity</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !gitStatus) {
    return (
      <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Git Activity</h3>
        <div className="text-center py-8">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={loadGitData}
            className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Git Activity</h3>
        <button
          onClick={loadGitData}
          disabled={loading}
          className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-2 py-1 rounded transition-colors"
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto">
        {/* Repository Status */}
        {gitStatus && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getStatusIcon(gitStatus)}</span>
              <span className={`text-sm font-medium ${getStatusColor(gitStatus)}`}>
                {getStatusText(gitStatus)}
              </span>
            </div>
            
            {gitStatus.isGitRepo && (
              <div className="space-y-1 text-xs text-gray-600">
                {gitStatus.currentBranch && (
                  <div className="flex justify-between">
                    <span>Branch:</span>
                    <span className="font-mono">{gitStatus.currentBranch}</span>
                  </div>
                )}
                {gitStatus.hasRemote && (
                  <div className="flex justify-between">
                    <span>Remote:</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {commitAnalysis && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-xs text-blue-600 font-medium">Total Commits</p>
              <p className="text-lg font-bold text-blue-800">{commitAnalysis.totalCommits}</p>
            </div>
            
            <div className="bg-green-50 p-2 rounded">
              <p className="text-xs text-green-600 font-medium">Avg/Day</p>
              <p className="text-lg font-bold text-green-800">
                {commitAnalysis.codeVelocity.avgCommitsPerDay.toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {commitAnalysis && getRecentCommitDays().length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
            <div className="space-y-1">
              {getRecentCommitDays().slice(0, 5).map(([date, count]) => (
                <div key={date} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{formatDate(new Date(date))}</span>
                  <div className="flex items-center space-x-1">
                    <div 
                      className="bg-blue-200 h-1.5 rounded"
                      style={{ 
                        width: `${Math.max(10, (count / Math.max(...Object.values(commitAnalysis.commitFrequency))) * 40)}px` 
                      }}
                    ></div>
                    <span className="text-gray-700 font-medium text-xs">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Commit */}
        {gitStatus?.lastCommitMessage && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Commit</h4>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-700 leading-relaxed">
                {gitStatus.lastCommitMessage.length > 80 
                  ? `${gitStatus.lastCommitMessage.substring(0, 77)}...`
                  : gitStatus.lastCommitMessage
                }
              </p>
              {gitStatus.lastCommitHash && (
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {gitStatus.lastCommitHash.substring(0, 8)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contributors */}
        {commitAnalysis && commitAnalysis.authors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Contributors</h4>
            <div className="space-y-1">
              {commitAnalysis.authors.slice(0, 3).map((author, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate">{author.name}</span>
                  <span className="text-gray-700 font-medium">{author.commitCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not a git repository message */}
        {gitStatus && !gitStatus.isGitRepo && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-sm text-gray-600">This directory is not a Git repository</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitActivityWidget; 