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
  writeBinaryFile: (filePath, base64Content) => ipcRenderer.invoke('write-binary-file', filePath, base64Content),
  pathExists: (filePath) => ipcRenderer.invoke('path-exists', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  
  // Document conversion operations
  convertDocument: (inputPath, outputDir) => ipcRenderer.invoke('convert-document', inputPath, outputDir),
  getSupportedExtensions: () => ipcRenderer.invoke('get-supported-extensions'),
  isFileSupported: (filePath) => ipcRenderer.invoke('is-file-supported', filePath),
  
  // Project operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  checkTaskmasterFolder: (folderPath) => ipcRenderer.invoke('check-taskmaster-folder', folderPath),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (projectData) => ipcRenderer.invoke('create-project', projectData),
  updateProject: (projectId, updates) => ipcRenderer.invoke('update-project', projectId, updates),
  
  // New project creation operations
  initializeTaskMaster: (options) => ipcRenderer.invoke('initialize-taskmaster', options),
  addExistingProject: (projectPath) => ipcRenderer.invoke('add-existing-project', projectPath),
  loadProjectsList: () => ipcRenderer.invoke('load-projects-list'),
  saveProjectsList: (projects) => ipcRenderer.invoke('save-projects-list', projects),
  addProjectToList: (projectMetadata) => ipcRenderer.invoke('add-project-to-list', projectMetadata),
  
  // PRD Processing
  processPRDUpload: (data) => ipcRenderer.invoke('process-prd-upload', data),
  
  // Command execution for task-master CLI
  executeCommand: (command, cwd) => ipcRenderer.invoke('executeCommand', command, cwd),
  
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
  
  // Branch Management
  gitListBranches: (repoPath, options) => ipcRenderer.invoke('git-list-branches', repoPath, options),
  gitCreateBranch: (repoPath, name, startPoint) => ipcRenderer.invoke('git-create-branch', repoPath, name, startPoint),
  gitSwitchBranch: (repoPath, name) => ipcRenderer.invoke('git-switch-branch', repoPath, name),
  gitDeleteBranch: (repoPath, name, force) => ipcRenderer.invoke('git-delete-branch', repoPath, name, force),
  gitSetUpstream: (repoPath, branch, remote, remoteBranch) => ipcRenderer.invoke('git-set-upstream', repoPath, branch, remote, remoteBranch),
  gitBranchInfo: (repoPath, branchName) => ipcRenderer.invoke('git-branch-info', repoPath, branchName),
  
  // GitHub CLI Integration
  githubCliAvailable: (repoPath) => ipcRenderer.invoke('github-cli-available', repoPath),
  githubAuthStatus: (repoPath) => ipcRenderer.invoke('github-auth-status', repoPath),
  githubCliCommand: (repoPath, command, args) => ipcRenderer.invoke('github-cli-command', repoPath, command, args),
  githubRepoInfo: (repoPath) => ipcRenderer.invoke('github-repo-info', repoPath),
  githubIsRepo: (repoPath) => ipcRenderer.invoke('github-is-repo', repoPath),
  githubCreateRepo: (repoPath, options) => ipcRenderer.invoke('github-create-repo', repoPath, options),
  githubCheckRepoName: (repoName, username) => ipcRenderer.invoke('github-check-repo-name', repoName, username),
  
  // Terminal API using node-pty for proper pseudo-terminal support
  terminal: {
    create: (options) => ipcRenderer.invoke('terminal-create', options),
    sendInput: (terminalId, data) => ipcRenderer.invoke('terminal-send-input', terminalId, data),
    resize: (terminalId, cols, rows) => ipcRenderer.invoke('terminal-resize', terminalId, cols, rows),
    close: (terminalId) => ipcRenderer.invoke('terminal-close', terminalId),
    setupListeners: (terminalId) => ipcRenderer.invoke('terminal-setup-listeners', terminalId),
    onOutput: (terminalId, callback) => {
      const handler = (_event, receivedTerminalId, data) => {
        if (receivedTerminalId === terminalId) {
          callback(data);
        }
      };
      ipcRenderer.on('terminal-output', handler);
      return () => ipcRenderer.off('terminal-output', handler);
    },
    onExit: (terminalId, callback) => {
      const handler = (_event, receivedTerminalId, code, signal) => {
        if (receivedTerminalId === terminalId) {
          callback(code, signal);
        }
      };
      ipcRenderer.on('terminal-exit', handler);
      return () => ipcRenderer.off('terminal-exit', handler);
    }
  },
  
  // Cleanup listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});