import React, { useState, useEffect } from 'react';

interface Branch {
  name: string;
  current: boolean;
  commit: string;
  tracking?: string;
  ahead?: number;
  behind?: number;
  isRemote: boolean;
}

interface BranchManagerProps {
  projectPath: string;
}

export const BranchManager: React.FC<BranchManagerProps> = ({ projectPath }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [includeRemote, setIncludeRemote] = useState(false);
  const [branchInfo, setBranchInfo] = useState<any>(null);

  const loadBranches = async () => {
    if (!projectPath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.gitListBranches(projectPath, { 
        includeRemote,
        includeAll: includeRemote 
      });
      
      if (result.success) {
        setBranches(result.branches || []);
      } else {
        setError(result.error || 'Failed to load branches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim() || !projectPath) return;
    
    setLoading(true);
    try {
      const result = await window.electronAPI.gitCreateBranch(projectPath, newBranchName.trim());
      
      if (result.success) {
        setNewBranchName('');
        await loadBranches();
      } else {
        setError(result.error || 'Failed to create branch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const switchBranch = async (branchName: string) => {
    if (!projectPath) return;
    
    setLoading(true);
    try {
      const result = await window.electronAPI.gitSwitchBranch(projectPath, branchName);
      
      if (result.success) {
        await loadBranches();
      } else {
        setError(result.error || 'Failed to switch branch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (branchName: string, force: boolean = false) => {
    if (!projectPath || branchName === 'main' || branchName === 'master') return;
    
    if (!confirm(`Are you sure you want to delete branch "${branchName}"?`)) return;
    
    setLoading(true);
    try {
      const result = await window.electronAPI.gitDeleteBranch(projectPath, branchName, force);
      
      if (result.success) {
        await loadBranches();
      } else {
        setError(result.error || 'Failed to delete branch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getBranchInfo = async (branchName: string) => {
    if (!projectPath) return;
    
    try {
      const result = await window.electronAPI.gitBranchInfo(projectPath, branchName);
      
      if (result.success) {
        setBranchInfo(result.branchInfo);
      } else {
        setError(result.error || 'Failed to get branch info');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const setUpstream = async (branchName: string) => {
    if (!projectPath) return;
    
    setLoading(true);
    try {
      const result = await window.electronAPI.gitSetUpstream(projectPath, branchName, 'origin');
      
      if (result.success) {
        await loadBranches();
      } else {
        setError(result.error || 'Failed to set upstream');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [projectPath, includeRemote]);

  if (!projectPath) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">No project path provided</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Branch Management</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Create Branch */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="New branch name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && createBranch()}
          />
          <button
            onClick={createBranch}
            disabled={!newBranchName.trim() || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Create Branch
          </button>
        </div>

        {/* Options */}
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeRemote}
              onChange={(e) => setIncludeRemote(e.target.checked)}
              className="mr-2"
            />
            Include Remote Branches
          </label>
          <button
            onClick={loadBranches}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Branch List */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Branches ({branches.length})</h4>
        {branches.length === 0 ? (
          <p className="text-gray-500 italic">No branches found</p>
        ) : (
          branches.map((branch) => (
            <div
              key={branch.name}
              className={`p-3 border rounded-lg ${
                branch.current ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${branch.current ? 'text-green-700' : 'text-gray-700'}`}>
                      {branch.name}
                    </span>
                    {branch.current && (
                      <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded">
                        CURRENT
                      </span>
                    )}
                    {branch.isRemote && (
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                        REMOTE
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span>Commit: {branch.commit.substring(0, 8)}</span>
                    {branch.tracking && (
                      <span className="ml-4">Tracking: {branch.tracking}</span>
                    )}
                    {branch.ahead && (
                      <span className="ml-4 text-orange-600">↑{branch.ahead}</span>
                    )}
                    {branch.behind && (
                      <span className="ml-2 text-red-600">↓{branch.behind}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!branch.current && !branch.isRemote && (
                    <button
                      onClick={() => switchBranch(branch.name)}
                      disabled={loading}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Switch
                    </button>
                  )}
                  
                  <button
                    onClick={() => getBranchInfo(branch.name)}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Info
                  </button>
                  
                  {!branch.current && !branch.isRemote && branch.name !== 'main' && branch.name !== 'master' && (
                    <button
                      onClick={() => deleteBranch(branch.name)}
                      disabled={loading}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                  
                  {!branch.isRemote && !branch.tracking && (
                    <button
                      onClick={() => setUpstream(branch.name)}
                      disabled={loading}
                      className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
                    >
                      Set Upstream
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Branch Info Panel */}
      {branchInfo && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Branch Information: {branchInfo.name}</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Commit:</strong> {branchInfo.commit}</p>
            {branchInfo.tracking && <p><strong>Tracking:</strong> {branchInfo.tracking}</p>}
            {branchInfo.ahead && <p><strong>Ahead:</strong> {branchInfo.ahead} commits</p>}
            {branchInfo.behind && <p><strong>Behind:</strong> {branchInfo.behind} commits</p>}
            {branchInfo.lastCommit && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p><strong>Last Commit:</strong></p>
                <p className="ml-2">Hash: {branchInfo.lastCommit.hash.substring(0, 8)}</p>
                <p className="ml-2">Message: {branchInfo.lastCommit.message}</p>
                <p className="ml-2">Author: {branchInfo.lastCommit.author}</p>
                <p className="ml-2">Date: {new Date(branchInfo.lastCommit.date).toLocaleString()}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setBranchInfo(null)}
            className="mt-3 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default BranchManager; 