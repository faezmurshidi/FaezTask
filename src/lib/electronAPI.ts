// Wrapper functions for Electron API - types are defined in types/electron.ts

export const electronAPI = {
  // Check if we're running in Electron
  isElectron: () => typeof window !== 'undefined' && window.electronAPI,

  // File operations
  showOpenDialog: async (options: any) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.showOpenDialog(options);
    }
    throw new Error('File operations are only available in Electron');
  },

  showSaveDialog: async (options: any) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.showSaveDialog(options);
    }
    throw new Error('File operations are only available in Electron');
  },

  readFile: async (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.readFile(filePath);
    }
    throw new Error('File operations are only available in Electron');
  },

  writeFile: async (filePath: string, content: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.writeFile(filePath, content);
    }
    throw new Error('File operations are only available in Electron');
  },

  writeBinaryFile: async (filePath: string, base64Content: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.writeBinaryFile(filePath, base64Content);
    }
    throw new Error('File operations are only available in Electron');
  },

  pathExists: async (filePath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.pathExists(filePath);
    }
    throw new Error('File operations are only available in Electron');
  },

  createDirectory: async (dirPath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.createDirectory(dirPath);
    }
    throw new Error('File operations are only available in Electron');
  },

  readDirectory: async (dirPath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.readDirectory(dirPath);
    }
    throw new Error('File operations are only available in Electron');
  },

  deleteFile: async (filePath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.deleteFile(filePath);
    }
    throw new Error('File operations are only available in Electron');
  },

  renameFile: async (oldPath: string, newPath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.renameFile(oldPath, newPath);
    }
    throw new Error('File operations are only available in Electron');
  },

  // Document conversion operations
  convertDocument: async (inputPath: string, outputDir: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.convertDocument(inputPath, outputDir);
    }
    throw new Error('Document conversion is only available in Electron');
  },

  getSupportedExtensions: async () => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.getSupportedExtensions();
    }
    throw new Error('Document conversion is only available in Electron');
  },

  isFileSupported: async (filePath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.isFileSupported(filePath);
    }
    throw new Error('Document conversion is only available in Electron');
  },

  // Git operations
  gitStatus: async (repoPath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitStatus(repoPath);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitInit: async (repoPath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitInit(repoPath);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitAdd: async (repoPath: string, files?: string[]) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitAdd(repoPath, files);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitUnstage: async (repoPath: string, files: string[]) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitUnstage(repoPath, files);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitCommit: async (repoPath: string, message: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitCommit(repoPath, message);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitPush: async (repoPath: string, remote?: string, branch?: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitPush(repoPath, remote, branch);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitPushUpstream: async (repoPath: string, remote?: string, branch?: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitPushUpstream(repoPath, remote, branch);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitPullAndPush: async (repoPath: string, remote?: string, branch?: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitPullAndPush(repoPath, remote, branch);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitPull: async (repoPath: string, remote?: string, branch?: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitPull(repoPath, remote, branch);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitAddRemote: async (repoPath: string, name: string, url: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitAddRemote(repoPath, name, url);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitGetRemotes: async (repoPath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitGetRemotes(repoPath);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitGetLog: async (repoPath: string, options?: any) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitGetLog(repoPath, options);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitGetFileStatus: async (repoPath: string) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitGetFileStatus(repoPath);
    }
    throw new Error('Git operations are only available in Electron');
  },

  gitAnalyzeCommits: async (repoPath: string, options?: any) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.gitAnalyzeCommits(repoPath, options);
    }
    throw new Error('Git operations are only available in Electron');
  },

  // Project operations - these are now properly available in the current preload
  getProjects: async () => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.getProjects();
    }
    // Fallback for web development
    return [];
  },

  createProject: async (projectData: any) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.createProject(projectData);
    }
    throw new Error('Project operations are only available in Electron');
  },

  updateProject: async (projectId: string, updates: any) => {
    if (electronAPI.isElectron()) {
      return window.electronAPI!.updateProject(projectId, updates);
    }
    throw new Error('Project operations are only available in Electron');
  },

  // Task operations - these are legacy and may not be available in current preload
  getTasks: async (projectId: string) => {
    if (electronAPI.isElectron() && (window.electronAPI as any).getTasks) {
      return (window.electronAPI as any).getTasks(projectId);
    }
    // Fallback for web development
    return [];
  },

  createTask: async (taskData: any) => {
    if (electronAPI.isElectron() && (window.electronAPI as any).createTask) {
      return (window.electronAPI as any).createTask(taskData);
    }
    throw new Error('Task operations are only available in Electron');
  },

  updateTask: async (taskId: string, updates: any) => {
    if (electronAPI.isElectron() && (window.electronAPI as any).updateTask) {
      return (window.electronAPI as any).updateTask(taskId, updates);
    }
    throw new Error('Task operations are only available in Electron');
  },

  // Time tracking operations - these are legacy and may not be available in current preload
  startTimer: async (taskId: string) => {
    if (electronAPI.isElectron() && (window.electronAPI as any).startTimer) {
      return (window.electronAPI as any).startTimer(taskId);
    }
    throw new Error('Time tracking is only available in Electron');
  },

  stopTimer: async (entryId: string) => {
    if (electronAPI.isElectron() && (window.electronAPI as any).stopTimer) {
      return (window.electronAPI as any).stopTimer(entryId);
    }
    throw new Error('Time tracking is only available in Electron');
  },

  getTimeEntries: async (projectId: string) => {
    if (electronAPI.isElectron() && (window.electronAPI as any).getTimeEntries) {
      return (window.electronAPI as any).getTimeEntries(projectId);
    }
    // Fallback for web development
    return [];
  },
};