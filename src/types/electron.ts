declare global {
  interface Window {
    electronAPI: {
      // App info
      getAppVersion: () => Promise<string>;
      
      // File operations
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<any>;
      writeBinaryFile: (filePath: string, base64Content: string) => Promise<{ success: boolean; error?: string }>;
      pathExists: (filePath: string) => Promise<boolean>;
      createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
      readDirectory: (dirPath: string) => Promise<{ 
        success: boolean; 
        files?: Array<{
          name: string;
          isDirectory: boolean;
          isFile: boolean;
          size: number;
          mtime: string;
          path: string;
        }>; 
        error?: string;
      }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
      
      // Document conversion operations
      convertDocument: (inputPath: string, outputDir: string) => Promise<{ 
        success: boolean; 
        error?: string; 
        outputPath?: string; 
        fileType?: string; 
      }>;
      getSupportedExtensions: () => Promise<{ success: boolean; extensions?: string[]; error?: string }>;
      isFileSupported: (filePath: string) => Promise<{ success: boolean; supported?: boolean; error?: string }>;
      
      // Project operations
      selectFolder: () => Promise<any>;
      checkTaskmasterFolder: (folderPath: string) => Promise<boolean>;
      getProjects: () => Promise<any>;
      createProject: (projectData: any) => Promise<any>;
      updateProject: (projectId: string, updates: any) => Promise<any>;
      
      // New project creation operations
      initializeTaskMaster: (options: {
        projectPath: string;
        projectName: string;
        projectDescription?: string;
        skipInstall?: boolean;
        yes?: boolean;
      }) => Promise<{ success: boolean; error?: string; message?: string; projectPath?: string; taskmasterPath?: string }>;
      addExistingProject: (projectPath: string) => Promise<{ 
        success: boolean; 
        error?: string; 
        message?: string; 
        project?: any;
        needsTaskMaster?: boolean;
        projectPath?: string;
        projectName?: string;
      }>;
      loadProjectsList: () => Promise<{ success: boolean; projects: any[]; error?: string }>;
      saveProjectsList: (projects: any[]) => Promise<{ success: boolean; error?: string }>;
      addProjectToList: (projectMetadata: any) => Promise<{ success: boolean; error?: string; projects?: any[] }>;
      
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
      gitUnstage: (repoPath: string, files: string[]) => Promise<any>;
      gitCommit: (repoPath: string, message: string) => Promise<any>;
      gitPush: (repoPath: string, remote?: string, branch?: string) => Promise<any>;
      gitPushUpstream: (repoPath: string, remote?: string, branch?: string) => Promise<any>;
      gitPullAndPush: (repoPath: string, remote?: string, branch?: string) => Promise<any>;
      gitPull: (repoPath: string, remote?: string, branch?: string) => Promise<any>;
      gitAddRemote: (repoPath: string, name: string, url: string) => Promise<any>;
      gitGetRemotes: (repoPath: string) => Promise<any>;
      gitGetLog: (repoPath: string, options?: any) => Promise<any>;
      gitGetFileStatus: (repoPath: string) => Promise<any>;
      gitAnalyzeCommits: (repoPath: string, options?: any) => Promise<any>;
      
      // Branch Management
      gitListBranches: (repoPath: string, options?: { 
        includeRemote?: boolean; 
        includeAll?: boolean; 
      }) => Promise<{
        success: boolean;
        branches?: Array<{
          name: string;
          current: boolean;
          commit: string;
          tracking?: string;
          ahead?: number;
          behind?: number;
          isRemote: boolean;
        }>;
        error?: string;
      }>;
      gitCreateBranch: (repoPath: string, name: string, startPoint?: string) => Promise<{ success: boolean; error?: string }>;
      gitSwitchBranch: (repoPath: string, name: string) => Promise<{ success: boolean; error?: string }>;
      gitDeleteBranch: (repoPath: string, name: string, force?: boolean) => Promise<{ success: boolean; error?: string }>;
      gitSetUpstream: (repoPath: string, branch?: string, remote?: string, remoteBranch?: string) => Promise<{ success: boolean; error?: string }>;
      gitBranchInfo: (repoPath: string, branchName?: string) => Promise<{
        success: boolean;
        branchInfo?: {
          name: string;
          commit: string;
          tracking?: string;
          ahead?: number;
          behind?: number;
          lastCommit?: {
            hash: string;
            message: string;
            author: string;
            date: string;
          };
        };
        error?: string;
      }>;
      
      // GitHub CLI Integration
      githubCliAvailable: (repoPath: string) => Promise<{ success: boolean; available?: boolean; version?: string; path?: string; error?: string }>;
      githubAuthStatus: (repoPath: string) => Promise<{ success: boolean; authenticated?: boolean; username?: string; scopes?: string[]; protocol?: string; error?: string }>;
      githubCliCommand: (repoPath: string, command: string, args?: string[]) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
      githubRepoInfo: (repoPath: string) => Promise<{ success: boolean; isGitHubRepo?: boolean; repoInfo?: any; error?: string }>;
      githubIsRepo: (repoPath: string) => Promise<{ success: boolean; isGitHubRepo?: boolean; error?: string }>;
      githubCreateRepo: (repoPath: string, options: {
        name: string;
        description?: string;
        isPrivate?: boolean;
        initializeWithReadme?: boolean;
        addGitIgnore?: string;
        license?: string;
      }) => Promise<{ success: boolean; repository?: any; message?: string; localPath?: string; error?: string; errorType?: string }>;
      githubCheckRepoName: (repoName: string, username: string) => Promise<{ success: boolean; available?: boolean; message?: string; error?: string }>;
      
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