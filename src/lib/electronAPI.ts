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

  readFile: async (filePath: string) => {
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