'use client';

import { useState, useEffect } from 'react';
import { CommitAnalysis, CommitTaskCorrelation } from '@/types';
import { electronAPI } from '@/lib/electronAPI';
import { taskCorrelationService } from '@/lib/taskCorrelationService';

interface GitCommitAnalysisProps {
  projectPath: string;
}

export default function GitCommitAnalysis({ projectPath }: GitCommitAnalysisProps) {
  const [analysis, setAnalysis] = useState<CommitAnalysis | null>(null);
  const [correlations, setCorrelations] = useState<CommitTaskCorrelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [correlationLoading, setCorrelationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState({
    maxCount: 100,
    since: '',
    until: '',
    author: ''
  });

  useEffect(() => {
    if (electronAPI.isElectron()) {
      loadAnalysis();
    }
  }, [projectPath]);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await electronAPI.gitAnalyzeCommits(projectPath, {
        maxCount: options.maxCount || 100
      });
      
      if (result.success) {
        setAnalysis(result.analysis);
        // After loading analysis, correlate commits with tasks
        await analyzeCommitTaskCorrelations(result.analysis);
      } else {
        setError(result.error || 'Failed to analyze commits');
      }
    } catch (err) {
      console.error('Failed to analyze commits:', err);
      setError('Failed to analyze commits');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCommitTaskCorrelations = async (analysisData: CommitAnalysis) => {
    setCorrelationLoading(true);
    try {
      // Get recent commits for correlation analysis
      const logResult = await electronAPI.gitGetLog(projectPath, { maxCount: 20 });
      
      if (logResult.success && logResult.log?.all) {
        const correlationPromises = logResult.log.all.map(async (commit: any) => {
          try {
                         const correlation = await taskCorrelationService.analyzeCommitTaskCorrelation({
               hash: commit.hash,
               message: commit.message,
               author: {
                 name: commit.author_name,
                 email: commit.author_email
               },
               date: new Date(commit.date),
               filesChanged: [], // Would need to get from git show --name-only
               insertions: 0,
               deletions: 0,
               taskReferences: []
             });
            return correlation;
          } catch (error) {
            console.error('Error correlating commit:', commit.hash, error);
            return null;
          }
        });

        const results = await Promise.all(correlationPromises);
        const validCorrelations = results.filter((c): c is CommitTaskCorrelation => 
          c !== null && c.taskId !== null && c.confidence > 0.3
        );
        
        setCorrelations(validCorrelations);
      }
    } catch (error) {
      console.error('Failed to analyze commit-task correlations:', error);
    } finally {
      setCorrelationLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalysis();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getRecentCommitDays = () => {
    if (!analysis?.commitFrequency) return [];
    
    const sorted = Object.entries(analysis.commitFrequency)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7);
    
    return sorted;
  };

  const getTopFiles = () => {
    if (!analysis?.fileChangePatterns) return [];
    
    return Object.entries(analysis.fileChangePatterns)
      .slice(0, 10);
  };

  const getTaskReferences = () => {
    if (!analysis?.taskReferences) return [];
    
    return Object.entries(analysis.taskReferences)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Analyzing commits...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-600">{error}</span>
          <button
            onClick={handleRefresh}
            className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">No commit analysis available</p>
          <button
            onClick={handleRefresh}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            Analyze Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Commit Analysis</h3>
        <button
          onClick={handleRefresh}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Total Commits</p>
          <p className="text-xl font-bold text-blue-800">{analysis.totalCommits}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Lines Added</p>
          <p className="text-xl font-bold text-green-800">
            {analysis.codeVelocity.totalLinesAdded.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-xs text-red-600 font-medium">Lines Deleted</p>
          <p className="text-xl font-bold text-red-800">
            {analysis.codeVelocity.totalLinesDeleted.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-purple-600 font-medium">Avg/Day</p>
          <p className="text-xl font-bold text-purple-800">
            {analysis.codeVelocity.avgCommitsPerDay.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-600 font-medium mb-1">Analysis Period</p>
        <p className="text-sm text-gray-800">
          {formatDate(analysis.dateRange.from)} → {formatDate(analysis.dateRange.to)}
        </p>
      </div>

      {/* Authors */}
      {analysis.authors.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Contributors</h4>
          <div className="space-y-2">
            {analysis.authors.map((author, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">
                  {author.name} ({author.commitCount} commits)
                </span>
                <div className="text-xs text-gray-500">
                  +{author.linesAdded} -{author.linesDeleted}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {getRecentCommitDays().length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Recent Activity (Last 7 Days)</h4>
          <div className="space-y-1">
            {getRecentCommitDays().map(([date, count]) => (
              <div key={date} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{formatDate(new Date(date))}</span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-blue-200 h-2 rounded"
                    style={{ width: `${Math.max(20, (count / Math.max(...Object.values(analysis.commitFrequency))) * 100)}px` }}
                  ></div>
                  <span className="text-gray-700 font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Changed Files */}
      {getTopFiles().length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Most Changed Files</h4>
          <div className="space-y-1">
            {getTopFiles().map(([file, count]) => (
              <div key={file} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate" title={file}>
                  {file.split('/').pop() || file}
                </span>
                <span className="text-gray-700 font-medium">{count} changes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task References */}
      {getTaskReferences().length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Task References</h4>
          <div className="space-y-2">
            {getTaskReferences().map(([taskId, commits]) => (
              <div key={taskId} className="bg-gray-50 p-2 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-600">Task #{taskId}</span>
                  <span className="text-xs text-gray-500">{commits.length} commits</span>
                </div>
                <div className="text-xs text-gray-600">
                  Recent: {commits[0]?.message.substring(0, 60)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commit-Task Correlations */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800">Commit-Task Correlations</h4>
          {correlationLoading && (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-500">Analyzing...</span>
            </div>
          )}
        </div>
        
        {correlations.length > 0 ? (
          <div className="space-y-2">
            {correlations.map((correlation, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">
                      Task #{correlation.taskId}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      correlation.confidence > 0.7 ? 'bg-green-100 text-green-700' :
                      correlation.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {Math.round(correlation.confidence * 100)}% confidence
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      correlation.progressEstimate === 'completed' ? 'bg-green-100 text-green-700' :
                      correlation.progressEstimate === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      correlation.progressEstimate === 'started' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {correlation.progressEstimate}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {correlation.commitHash.substring(0, 8)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mb-1">
                  {correlation.reasoning}
                </p>
                
                {correlation.suggestedAction && correlation.suggestedAction !== 'none' && (
                  <div className="mt-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      Suggested: {correlation.suggestedAction.replace('-', ' ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !correlationLoading ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No task correlations found in recent commits</p>
            <p className="text-xs text-gray-400 mt-1">
              Try including task IDs (e.g., "Fix task 27.6") in commit messages
            </p>
          </div>
        ) : null}
      </div>

      {/* Code Velocity Details */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Code Velocity</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Average commits per day</p>
            <p className="font-medium">{analysis.codeVelocity.avgCommitsPerDay.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">Average lines changed</p>
            <p className="font-medium">{analysis.codeVelocity.avgLinesChanged.toFixed(0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 