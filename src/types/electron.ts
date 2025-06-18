declare global {
  interface Window {
    electronAPI: {
      // App info
      getAppVersion: () => Promise<string>;
      
      // File operations
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      readFile: (filePath: string) => Promise<any>;
      writeFile: (filePath: string, content: string) => Promise<any>;
      
      // Project operations
      selectFolder: () => Promise<any>;
      checkTaskmasterFolder: (folderPath: string) => Promise<boolean>;
      getProjects: () => Promise<any>;
      createProject: (projectData: any) => Promise<any>;
      updateProject: (projectId: string, updates: any) => Promise<any>;
      
      // PRD Processing
      processPRDUpload: (data: any) => Promise<any>;
      
      // File watching
      startFileWatching: (filePath: string) => Promise<any>;
      stopFileWatching: () => Promise<any>;
      onFileChanged: (callback: (data: any) => void) => void;
      removeFileChangedListener: (callback: (data: any) => void) => void;
      
      // Git operations
      gitStatus: (repoPath: string) => Promise<any>;
      gitInit: (repoPath: string) => Promise<any>;
      gitAdd: (repoPath: string, files?: string[]) => Promise<any>;
      gitCommit: (repoPath: string, message: string) => Promise<any>;
      gitPush: (repoPath: string, remote?: string, branch?: string) => Promise<any>;
      gitPull: (repoPath: string, remote?: string, branch?: string) => Promise<any>;
      gitAddRemote: (repoPath: string, name: string, url: string) => Promise<any>;
      gitGetRemotes: (repoPath: string) => Promise<any>;
      gitGetLog: (repoPath: string, options?: any) => Promise<any>;
      
      // Simple PTY API - following proven pattern
      spawnPty: (options: { cols?: number; rows?: number }) => void;
      onPtyData: (callback: (data: string) => void) => void;
      sendPtyInput: (input: string) => void;
      resizePty: (size: { cols: number; rows: number }) => void;
      onPtyExit: (callback: (code?: number) => void) => void;
      
      // Cleanup listeners
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {}; 