const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  
  // Project operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  checkTaskmasterFolder: (folderPath) => ipcRenderer.invoke('check-taskmaster-folder', folderPath),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (projectData) => ipcRenderer.invoke('create-project', projectData),
  updateProject: (projectId, updates) => ipcRenderer.invoke('update-project', projectId, updates),
  
  // PRD Processing
  processPRDUpload: (data) => ipcRenderer.invoke('process-prd-upload', data),
  
  // File watching
  startFileWatching: (filePath) => ipcRenderer.invoke('taskmaster-start-file-watching', filePath),
  stopFileWatching: () => ipcRenderer.invoke('taskmaster-stop-file-watching'),
  onFileChanged: (callback) => ipcRenderer.on('taskmaster-file-changed', callback),
  removeFileChangedListener: (callback) => ipcRenderer.removeListener('taskmaster-file-changed', callback),
  
  // Git operations
  gitStatus: (repoPath) => ipcRenderer.invoke('git-status', repoPath),
  gitInit: (repoPath) => ipcRenderer.invoke('git-init', repoPath),
  gitAdd: (repoPath, files) => ipcRenderer.invoke('git-add', repoPath, files),
  gitUnstage: (repoPath, files) => ipcRenderer.invoke('git-unstage', repoPath, files),
  gitCommit: (repoPath, message) => ipcRenderer.invoke('git-commit', repoPath, message),
  gitPush: (repoPath, remote, branch) => ipcRenderer.invoke('git-push', repoPath, remote, branch),
  gitPushUpstream: (repoPath, remote, branch) => ipcRenderer.invoke('git-push-upstream', repoPath, remote, branch),
  gitPullAndPush: (repoPath, remote, branch) => ipcRenderer.invoke('git-pull-and-push', repoPath, remote, branch),
  gitPull: (repoPath, remote, branch) => ipcRenderer.invoke('git-pull', repoPath, remote, branch),
  gitAddRemote: (repoPath, name, url) => ipcRenderer.invoke('git-add-remote', repoPath, name, url),
  gitGetRemotes: (repoPath) => ipcRenderer.invoke('git-get-remotes', repoPath),
  gitGetLog: (repoPath, options) => ipcRenderer.invoke('git-get-log', repoPath, options),
  gitGetFileStatus: (repoPath) => ipcRenderer.invoke('git-get-file-status', repoPath),
  gitAnalyzeCommits: (repoPath, options) => ipcRenderer.invoke('git-analyze-commits', repoPath, options),
  
  // Simple PTY API - following proven pattern
  spawnPty: (options) => ipcRenderer.send('pty:spawn', options),
  onPtyData: (callback) => ipcRenderer.on('pty:data', (_event, data) => callback(data)),
  sendPtyInput: (input) => ipcRenderer.send('pty:input', input),
  resizePty: (size) => ipcRenderer.send('pty:resize', size),
  onPtyExit: (callback) => ipcRenderer.on('pty:exit', callback),
  
  // Cleanup listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});