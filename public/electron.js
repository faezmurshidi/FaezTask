const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');  
const path = require('path');
const fs = require('fs').promises;
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const { simpleGit } = require('simple-git');
const documentConverter = require('./documentConverter');

const execAsync = promisify(exec);

let mainWindow;

async function createWindow() {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  console.log('Creating Electron window...');
  console.log('Platform:', process.platform);
  console.log('Development mode:', isDev);
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    show: true,
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    alwaysOnTop: false,
    skipTaskbar: false,
  });

  // Load the app (handle port changes)
  if (isDev) {
    // Development mode - load from localhost
    try {
      await mainWindow.loadURL('http://localhost:3000');
      console.log('Successfully loaded: http://localhost:3000');
    } catch (error) {
      console.log('Failed to load localhost:3000, trying port 3001...');
      await mainWindow.loadURL('http://localhost:3001');
    }
  } else {
    // Production mode - load from packaged files
    // When using extraResource, files are in Resources directory alongside app.asar
    const resourcesPath = process.resourcesPath;
    const htmlPath = path.join(resourcesPath, 'out/index.html');
    console.log('Loading file from:', htmlPath);
    console.log('Resources path:', resourcesPath);
    await mainWindow.loadFile(htmlPath);
    console.log('Successfully loaded packaged app');
  }
  
  // Show window after successful load
  mainWindow.show();
  mainWindow.focus();

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready-to-show event fired');
    mainWindow.show();
    mainWindow.focus();
  });

  // Fallback: show window after a delay if ready-to-show doesn't fire
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Fallback: showing window after timeout');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3000);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// IPC handlers for app info
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// File system operations
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-binary-file', async (event, filePath, base64Content) => {
  try {
    const buffer = Buffer.from(base64Content, 'base64');
    await fs.writeFile(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('path-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      try {
        const fullPath = path.join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        
        files.push({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          path: fullPath
        });
      } catch (statError) {
        // Skip files that can't be accessed
        console.warn(`Could not stat file ${entry.name}:`, statError.message);
      }
    }
    
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Document conversion operations
ipcMain.handle('convert-document', async (event, inputPath, outputDir) => {
  try {
    const result = await documentConverter.convertToMarkdown(inputPath, outputDir);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-supported-extensions', async () => {
  try {
    return { success: true, extensions: documentConverter.getSupportedExtensions() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('is-file-supported', async (event, filePath) => {
  try {
    return { success: true, supported: documentConverter.isSupported(filePath) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Folder operations for existing project import
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
      buttonLabel: 'Select Folder'
    });
    return result;
  } catch (error) {
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('check-taskmaster-folder', async (event, folderPath) => {
  try {
    const taskmasterPath = path.join(folderPath, '.taskmaster');
    const stats = await fs.stat(taskmasterPath);
    return stats.isDirectory();
  } catch (error) {
    // If .taskmaster folder doesn't exist or there's an error accessing it
    return false;
  }
});

// Git operations
ipcMain.handle('git-status', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    
    // Check if it's a git repository
    let isRepo = true;
    try {
      await git.status();
    } catch (error) {
      isRepo = false;
    }
    
    if (!isRepo) {
      return {
        success: true,
        status: {
          isGitRepo: false,
          hasRemote: false,
          uncommittedChanges: 0,
          unpushedCommits: 0,
          hasConflicts: false,
          isDirty: false,
        }
      };
    }

    const [status, branches, log] = await Promise.all([
      git.status(),
      git.branch(),
      git.log({ maxCount: 1 }).catch(() => null), // Handle empty repos
    ]);

    const remotes = await git.getRemotes(true);
    const hasRemote = remotes.length > 0;

    // Count unpushed commits if we have a remote
    let unpushedCommits = 0;
    if (hasRemote && branches.current) {
      try {
        const ahead = await git.status(['--porcelain', '-b']);
        const branchInfo = ahead.tracking;
        if (branchInfo && branchInfo.includes('ahead')) {
          const match = branchInfo.match(/ahead (\d+)/);
          if (match) {
            unpushedCommits = parseInt(match[1], 10);
          }
        }
      } catch (error) {
        // Ignore errors when checking unpushed commits
      }
    }

    return {
      success: true,
      status: {
        isGitRepo: true,
        hasRemote,
        currentBranch: branches.current || undefined,
        uncommittedChanges: status.files.length,
        unpushedCommits,
        lastCommitHash: log?.latest?.hash,
        lastCommitMessage: log?.latest?.message,
        hasConflicts: status.conflicted.length > 0,
        isDirty: !status.isClean(),
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-init', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    await git.init();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-add', async (event, repoPath, files = ['.']) => {
  try {
    const git = simpleGit(repoPath);
    await git.add(files);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-unstage', async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    await git.reset(['HEAD', '--', ...files]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-commit', async (event, repoPath, message) => {
  try {
    const git = simpleGit(repoPath);
    const result = await git.commit(message);
    return { success: true, hash: result.commit };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-push', async (event, repoPath, remote = 'origin', branch) => {
  try {
    const git = simpleGit(repoPath);
    if (branch) {
      await git.push(remote, branch);
    } else {
      await git.push();
    }
    return { success: true };
  } catch (error) {
    const errorMessage = error.message;
    
    // Check if it's an upstream branch issue
    if (errorMessage.includes('no upstream branch') || errorMessage.includes('set-upstream')) {
      return { 
        success: false, 
        error: errorMessage,
        needsUpstream: true
      };
    }
    
    // Check if it's a "fetch first" issue (remote has changes)
    if (errorMessage.includes('rejected') && 
        (errorMessage.includes('fetch first') || 
         errorMessage.includes('remote contains work') ||
         errorMessage.includes('Updates were rejected'))) {
      return { 
        success: false, 
        error: errorMessage,
        needsPull: true
      };
    }
    
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle('git-push-upstream', async (event, repoPath, remote = 'origin', branch) => {
  try {
    const git = simpleGit(repoPath);
    
    // Get current branch if not specified
    const currentBranch = branch || (await git.branch()).current;
    if (!currentBranch) {
      return { success: false, error: 'No current branch found' };
    }
    
    // Push with upstream flag
    await git.push(['-u', remote, currentBranch]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-pull-and-push', async (event, repoPath, remote = 'origin', branch) => {
  try {
    const git = simpleGit(repoPath);
    
    // First, pull the remote changes
    let pullResult;
    try {
      if (branch) {
        await git.pull(remote, branch);
      } else {
        await git.pull();
      }
      pullResult = { success: true };
    } catch (pullError) {
      return { 
        success: false, 
        error: `Failed to pull: ${pullError.message}`,
        pullResult: { success: false, error: pullError.message }
      };
    }

    // Then, push our changes
    let pushResult;
    try {
      if (branch) {
        await git.push(remote, branch);
      } else {
        await git.push();
      }
      pushResult = { success: true };
    } catch (pushError) {
      return { 
        success: false, 
        error: `Failed to push after pull: ${pushError.message}`,
        pullResult,
        pushResult: { success: false, error: pushError.message }
      };
    }

    return { 
      success: true,
      pullResult,
      pushResult
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-pull', async (event, repoPath, remote = 'origin', branch) => {
  try {
    const git = simpleGit(repoPath);
    if (branch) {
      await git.pull(remote, branch);
    } else {
      await git.pull();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-add-remote', async (event, repoPath, name, url) => {
  try {
    const git = simpleGit(repoPath);
    await git.addRemote(name, url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-get-remotes', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const remotes = await git.getRemotes(true);
    return { success: true, remotes };
  } catch (error) {
    return { success: false, error: error.message, remotes: [] };
  }
});

ipcMain.handle('git-get-log', async (event, repoPath, options = {}) => {
  try {
    const git = simpleGit(repoPath);
    const log = await git.log(options);
    return { success: true, log };
  } catch (error) {
    return { success: false, error: error.message, log: null };
  }
});

ipcMain.handle('git-get-file-status', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    
    // Check if it's a git repository
    let isRepo = true;
    try {
      await git.status();
    } catch (error) {
      isRepo = false;
    }
    
    if (!isRepo) {
      return { success: true, files: [] };
    }

    const status = await git.status();
    const files = [];
    
    // Process staged files
    status.staged.forEach(file => {
      files.push({
        path: file,
        status: 'M', // Modified and staged
        staged: true
      });
    });
    
    // Process modified files
    status.modified.forEach(file => {
      if (!files.find(f => f.path === file)) {
        files.push({
          path: file,
          status: 'M', // Modified
          staged: false
        });
      }
    });
    
    // Process created files
    status.created.forEach(file => {
      files.push({
        path: file,
        status: 'A', // Added and staged
        staged: true
      });
    });
    
    // Process new files (untracked)
    status.not_added.forEach(file => {
      files.push({
        path: file,
        status: '??', // Untracked
        staged: false
      });
    });
    
    // Process deleted files
    status.deleted.forEach(file => {
      files.push({
        path: file,
        status: 'D', // Deleted
        staged: false
      });
    });
    
    // Process renamed files
    status.renamed.forEach(file => {
      files.push({
        path: file.to || file,
        status: 'R', // Renamed
        staged: true
      });
    });
    
    return { success: true, files };
  } catch (error) {
    console.error('Error getting file status:', error);
    return { success: false, error: error.message, files: [] };
  }
});

// Commit analysis using simple-git directly (since GitService is TypeScript)
ipcMain.handle('git-analyze-commits', async (event, repoPath, options = {}) => {
  try {
    // Create a simplified version of commit analysis directly in electron.js
    const git = simpleGit(repoPath);
    
    // Check if it's a git repository
    let isRepo = true;
    try {
      await git.status();
    } catch (error) {
      isRepo = false;
    }
    
    if (!isRepo) {
      // Return empty analysis for non-git repos
      const now = new Date();
      return {
        success: true,
        analysis: {
          totalCommits: 0,
          dateRange: { from: now, to: now },
          authors: [],
          commitFrequency: {},
          fileChangePatterns: {},
          taskReferences: {},
          codeVelocity: {
            avgCommitsPerDay: 0,
            avgLinesChanged: 0,
            totalLinesAdded: 0,
            totalLinesDeleted: 0
          }
        }
      };
    }

    const logOptions = {
      maxCount: options.maxCount || 100,
      format: {
        hash: '%H',
        date: '%ai',
        message: '%s',
        author_name: '%an',
        author_email: '%ae',
      }
    };

    if (options.since) logOptions.since = options.since;
    if (options.until) logOptions.until = options.until;
    if (options.author) logOptions.author = options.author;

    const log = await git.log(logOptions);
    
    if (log.all.length === 0) {
      const now = new Date();
      return {
        success: true,
        analysis: {
          totalCommits: 0,
          dateRange: { from: now, to: now },
          authors: [],
          commitFrequency: {},
          fileChangePatterns: {},
          taskReferences: {},
          codeVelocity: {
            avgCommitsPerDay: 0,
            avgLinesChanged: 0,
            totalLinesAdded: 0,
            totalLinesDeleted: 0
          }
        }
      };
    }

    const commits = [];
    
    // Process each commit to get detailed information
    for (const commit of log.all) {
      try {
        // Get file stats for this commit using --numstat
        const statsResult = await git.show([
          '--numstat',
          '--format=',
          commit.hash
        ]);

        const lines = statsResult.split('\n').filter(line => line.trim());
        const filesChanged = [];
        let totalInsertions = 0;
        let totalDeletions = 0;

        for (const line of lines) {
          const parts = line.split('\t');
          if (parts.length >= 3) {
            const additions = parseInt(parts[0]) || 0;
            const deletions = parseInt(parts[1]) || 0;
            const filename = parts[2];
            
            if (!isNaN(additions)) totalInsertions += additions;
            if (!isNaN(deletions)) totalDeletions += deletions;
            filesChanged.push(filename);
          }
        }

        // Extract task references from commit message
        const taskReferences = [];
        const patterns = [
          /(?:task|fix|close|resolve|ref|refs|references)[s]?\s*[#:]?\s*(\d+(?:\.\d+)?)/gi,
          /#(\d+(?:\.\d+)?)/g,
          /\b(\d+\.\d+)\b/g, // Subtask references like "27.6"
          /task[s]?\s*(\d+)/gi,
        ];
        
        const referencesSet = new Set();
        
        patterns.forEach(pattern => {
          const matches = commit.message.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              referencesSet.add(match[1]);
            }
          }
        });
        
        commits.push({
          hash: commit.hash,
          message: commit.message,
          author: {
            name: commit.author_name,
            email: commit.author_email
          },
          date: new Date(commit.date),
          filesChanged,
          insertions: totalInsertions,
          deletions: totalDeletions,
          taskReferences: Array.from(referencesSet)
        });
      } catch (error) {
        console.warn(`Failed to get stats for commit ${commit.hash}:`, error);
        // Add commit with basic info even if stats fail
        commits.push({
          hash: commit.hash,
          message: commit.message,
          author: {
            name: commit.author_name,
            email: commit.author_email
          },
          date: new Date(commit.date),
          filesChanged: [],
          insertions: 0,
          deletions: 0,
          taskReferences: []
        });
      }
    }
    
    // Generate analysis
    const dates = commits.map(c => c.date);
    const dateRange = {
      from: new Date(Math.min(...dates.map(d => d.getTime()))),
      to: new Date(Math.max(...dates.map(d => d.getTime())))
    };

    // Analyze authors
    const authorMap = new Map();
    commits.forEach(commit => {
      const key = `${commit.author.name}<${commit.author.email}>`;
      
      if (!authorMap.has(key)) {
        authorMap.set(key, {
          name: commit.author.name,
          email: commit.author.email,
          commitCount: 0,
          linesAdded: 0,
          linesDeleted: 0,
          firstCommit: commit.date,
          lastCommit: commit.date
        });
      }

      const stats = authorMap.get(key);
      stats.commitCount++;
      stats.linesAdded += commit.insertions;
      stats.linesDeleted += commit.deletions;
      
      if (commit.date < stats.firstCommit) {
        stats.firstCommit = commit.date;
      }
      if (commit.date > stats.lastCommit) {
        stats.lastCommit = commit.date;
      }
    });

    const authors = Array.from(authorMap.values()).sort((a, b) => b.commitCount - a.commitCount);

    // Calculate commit frequency
    const commitFrequency = {};
    commits.forEach(commit => {
      const dateKey = commit.date.toISOString().split('T')[0];
      commitFrequency[dateKey] = (commitFrequency[dateKey] || 0) + 1;
    });

    // Analyze file changes
    const filePatterns = {};
    commits.forEach(commit => {
      commit.filesChanged.forEach(file => {
        filePatterns[file] = (filePatterns[file] || 0) + 1;
      });
    });

    // Sort and limit file patterns to top 50
    const sortedFiles = Object.entries(filePatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50);
    const fileChangePatterns = Object.fromEntries(sortedFiles);

    // Group by task references
    const taskReferences = {};
    commits.forEach(commit => {
      commit.taskReferences.forEach(taskId => {
        if (!taskReferences[taskId]) {
          taskReferences[taskId] = [];
        }
        taskReferences[taskId].push(commit);
      });
    });

    // Calculate velocity
    const totalLinesAdded = commits.reduce((sum, c) => sum + c.insertions, 0);
    const totalLinesDeleted = commits.reduce((sum, c) => sum + c.deletions, 0);
    const daysDiff = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
    
    const codeVelocity = {
      avgCommitsPerDay: commits.length / daysDiff,
      avgLinesChanged: (totalLinesAdded + totalLinesDeleted) / Math.max(1, commits.length),
      totalLinesAdded,
      totalLinesDeleted
    };

    const analysis = {
      totalCommits: commits.length,
      dateRange,
      authors,
      commitFrequency,
      fileChangePatterns,
      taskReferences,
      codeVelocity
    };

    return { success: true, analysis };
  } catch (error) {
    console.error('Error analyzing commits:', error);
    return { success: false, error: error.message, analysis: null };
  }
});

// Branch Management handlers
ipcMain.handle('git-list-branches', async (event, repoPath, options = {}) => {
  try {
    const git = simpleGit(repoPath);
    
    const branchSummary = await git.branch(
      options.includeAll ? ['-a'] : 
      options.includeRemote ? ['-r'] : []
    );

    const branches = Object.entries(branchSummary.branches).map(([name, info]) => ({
      name: name.replace('remotes/', ''),
      current: info.current,
      commit: info.commit,
      tracking: info.tracking || undefined,
      ahead: info.ahead || undefined,
      behind: info.behind || undefined,
      isRemote: name.startsWith('remotes/'),
    }));

    return { success: true, branches };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('git-create-branch', async (event, repoPath, name, startPoint) => {
  try {
    const git = simpleGit(repoPath);
    
    if (startPoint) {
      await git.checkoutBranch(name, startPoint);
    } else {
      await git.checkoutLocalBranch(name);
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('git-switch-branch', async (event, repoPath, name) => {
  try {
    const git = simpleGit(repoPath);
    await git.checkout(name);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('git-delete-branch', async (event, repoPath, name, force = false) => {
  try {
    const git = simpleGit(repoPath);
    await git.deleteLocalBranch(name, force);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('git-set-upstream', async (event, repoPath, branch, remote = 'origin', remoteBranch) => {
  try {
    const git = simpleGit(repoPath);
    
    const currentBranch = branch || (await git.branch()).current;
    if (!currentBranch) {
      return { success: false, error: 'No current branch found' };
    }
    
    const upstream = remoteBranch || currentBranch;
    await git.branch(['-u', `${remote}/${upstream}`, currentBranch]);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('git-branch-info', async (event, repoPath, branchName) => {
  try {
    const git = simpleGit(repoPath);
    
    const branches = await git.branch();
    const targetBranch = branchName || branches.current;
    
    if (!targetBranch) {
      return { success: false, error: 'No branch specified and no current branch found' };
    }

    const branchData = branches.branches[targetBranch];
    if (!branchData) {
      return { success: false, error: `Branch '${targetBranch}' not found` };
    }

    // Get the last commit for this branch
    const log = await git.log({ from: targetBranch, maxCount: 1 });
    const lastCommit = log.latest;

    return {
      success: true,
      branchInfo: {
        name: targetBranch,
        commit: branchData.commit,
        tracking: branchData.tracking || undefined,
        ahead: branchData.ahead || undefined,
        behind: branchData.behind || undefined,
        lastCommit: lastCommit ? {
          hash: lastCommit.hash,
          message: lastCommit.message,
          author: lastCommit.author_name,
          date: lastCommit.date,
        } : undefined,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// PRD Processing handlers
ipcMain.handle('process-prd-upload', async (event, { fileContent, fileName, projectName, baseProjectsPath }) => {
  try {
    // Step 1: Create project directory
    const projectPath = path.join(baseProjectsPath || path.join(require('os').homedir(), 'Documents'), projectName);
    
    // Check if directory already exists
    try {
      await fs.access(projectPath);
      return { 
        success: false, 
        error: `Project directory already exists: ${projectPath}`,
        step: 'directory'
      };
    } catch (error) {
      // Directory doesn't exist, which is good - we can proceed
    }
    
    // Create the project directory
    await fs.mkdir(projectPath, { recursive: true });
    
    // Step 2: Initialize Task-Master project structure
    try {
      // Change to project directory and run task-master init
      const { stdout: initOutput, stderr: initError } = await execAsync('task-master init --yes', { 
        cwd: projectPath,
        timeout: 30000 // 30 second timeout
      });
      
      if (initError) {
        console.warn('Task-master init stderr:', initError);
      }
      
    } catch (error) {
      // If task-master is not installed globally, try with npx
      try {
        const { stdout: initOutput, stderr: initError } = await execAsync('npx task-master-ai init --yes', { 
          cwd: projectPath,
          timeout: 30000
        });
        
        if (initError) {
          console.warn('Task-master init stderr:', initError);
        }
      } catch (npxError) {
        return { 
          success: false, 
          error: `Failed to initialize Task-Master project. Please ensure task-master is installed globally or npx is available. Error: ${npxError.message}`,
          step: 'init'
        };
      }
    }
    
    // Step 3: Save PRD file to project directory
    const prdPath = path.join(projectPath, '.taskmaster', 'docs', 'prd.md');
    
    // Ensure the docs directory exists
    await fs.mkdir(path.dirname(prdPath), { recursive: true });
    
    // Write the PRD file
    await fs.writeFile(prdPath, fileContent, 'utf8');
    
    // Step 4: Parse PRD using Task-Master CLI
    try {
      const { stdout: parseOutput, stderr: parseError } = await execAsync(`task-master parse-prd "${prdPath}" --force`, { 
        cwd: projectPath,
        timeout: 60000 // 60 second timeout for PRD parsing
      });
      
      if (parseError) {
        console.warn('Task-master parse-prd stderr:', parseError);
      }
      
    } catch (error) {
      // Try with npx if global command failed
      try {
        const { stdout: parseOutput, stderr: parseError } = await execAsync(`npx task-master-ai parse-prd "${prdPath}" --force`, { 
          cwd: projectPath,
          timeout: 60000
        });
        
        if (parseError) {
          console.warn('Task-master parse-prd stderr:', parseError);
        }
      } catch (npxError) {
        return { 
          success: false, 
          error: `Failed to parse PRD. Error: ${npxError.message}`,
          step: 'parse'
        };
      }
    }
    
    // Step 5: Return success with project info
    return {
      success: true,
      projectPath,
      projectName,
      prdPath,
      message: 'Project created and PRD processed successfully'
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      step: 'unknown'
    };
  }
});

// Get projects directory for user selection
ipcMain.handle('get-projects-directory', async () => {
  const documentsPath = path.join(require('os').homedir(), 'Documents');
  return documentsPath;
});

// Select projects directory
ipcMain.handle('select-projects-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Projects Directory',
      buttonLabel: 'Select Directory',
      defaultPath: path.join(require('os').homedir(), 'Documents')
    });
    return result;
  } catch (error) {
    return { canceled: true, error: error.message };
  }
});

// Project management (using .taskmaster files)
ipcMain.handle('get-projects', async () => {
  // This would scan for .taskmaster directories and return project info
  // For now, return mock data for the current project
  const currentPath = process.cwd();
  return [
    {
      id: 'faezpm',
      name: 'Faez PM',
      description: 'Personal software project management companion',
      prd_file_path: path.join(currentPath, 'faez_prd.md'),
      local_folder_path: currentPath,
      github_repo_url: undefined,
      status: 'active',
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
    }
  ];
});

ipcMain.handle('create-project', async (event, projectData) => {
  // This would create a new .taskmaster directory and initialize project files
  console.log('Creating project:', projectData);
  return { ...projectData, id: Date.now().toString() };
});

ipcMain.handle('update-project', async (event, projectId, updates) => {
  // This would update project metadata
  console.log('Updating project:', projectId, updates);
  return { id: projectId, ...updates };
});

// Task management (reading from .taskmaster/tasks.json)
ipcMain.handle('get-tasks', async (event, projectId) => {
  // This would read from .taskmaster/tasks/tasks.json
  return [
    {
      id: '1',
      project_id: projectId,
      title: 'Setup Electron and Next.js Project Structure',
      description: 'Initialize the project with Electron and Next.js, setting up the core application structure.',
      status: 'completed',
      priority: 'high',
      estimated_hours: 4,
      actual_hours: 3.5,
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
    }
  ];
});

ipcMain.handle('create-task', async (event, taskData) => {
  console.log('Creating task:', taskData);
  return { ...taskData, id: Date.now().toString() };
});

ipcMain.handle('update-task', async (event, taskId, updates) => {
  console.log('Updating task:', taskId, updates);
  return { id: taskId, ...updates };
});

// Time tracking
ipcMain.handle('start-timer', async (event, taskId) => {
  const entryId = Date.now().toString();
  console.log('Starting timer for task:', taskId, 'Entry ID:', entryId);
  return { id: entryId, taskId, startTime: new Date() };
});

ipcMain.handle('stop-timer', async (event, entryId) => {
  console.log('Stopping timer:', entryId);
  return { id: entryId, endTime: new Date() };
});

ipcMain.handle('get-time-entries', async (event, projectId) => {
  // This would read time entries from storage
  return [];
});

// Task-Master CLI Integration for Kanban Board
ipcMain.handle('taskmaster-load-tasks', async (event, projectPath) => {
  try {
    const tasksJsonPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
    
    // First check if tasks.json exists
    try {
      await fs.access(tasksJsonPath);
    } catch (error) {
      return { 
        success: false, 
        error: 'No tasks.json file found. Please ensure this is a valid task-master project.',
        tasks: []
      };
    }

    // Try to use CLI first (preferred method)
    try {
      const { stdout, stderr } = await execAsync('task-master list --with-subtasks', { 
        cwd: projectPath,
        timeout: 10000
      });
      
      if (stderr && !stderr.includes('warn')) {
        console.warn('Task-master CLI stderr:', stderr);
      }
      
      // Since CLI doesn't return JSON, fall back to direct file reading
      // The CLI output is formatted text, not JSON
      console.log('CLI executed successfully, now reading tasks.json directly');
      
      // Read tasks.json directly since CLI was successful
      const content = await fs.readFile(tasksJsonPath, 'utf8');
      const tasksData = JSON.parse(content);
      
      // Handle the tagged structure - get tasks from the master tag
      const tasks = tasksData.master?.tasks || tasksData.tasks || [];
      return { success: true, tasks, source: 'cli+file' };
      
    } catch (cliError) {
      console.warn('CLI command failed, falling back to direct file read:', cliError.message);
      
      // Fallback: Read tasks.json directly
      try {
        const content = await fs.readFile(tasksJsonPath, 'utf8');
        const tasksData = JSON.parse(content);
        
        // Handle the tagged structure - get tasks from the master tag
        const tasks = tasksData.master?.tasks || tasksData.tasks || [];
        return { success: true, tasks, source: 'file' };
        
      } catch (fileError) {
        return { 
          success: false, 
          error: `Failed to load tasks: ${fileError.message}`,
          tasks: []
        };
      }
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      tasks: []
    };
  }
});

ipcMain.handle('taskmaster-update-task-status', async (event, projectPath, taskId, newStatus, oldStatus = null) => {
  try {
    // Use CLI command to update task status
    const command = `task-master set-status --id="${taskId}" --status="${newStatus}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: projectPath,
        timeout: 5000
      });
      
      if (stderr && !stderr.includes('warn')) {
        console.warn('Task status update stderr:', stderr);
      }
      
      return { 
        success: true, 
        message: `Task ${taskId} status updated to ${newStatus}`,
        taskId,
        newStatus
      };
      
    } catch (cliError) {
      // If CLI fails, try to rollback optimistic update
      if (oldStatus) {
        console.error(`Failed to update task ${taskId} status, rollback needed:`, cliError.message);
      }
      
      return { 
        success: false, 
        error: `Failed to update task status: ${cliError.message}`,
        taskId,
        rollback: oldStatus ? { taskId, status: oldStatus } : null
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      taskId
    };
  }
});

ipcMain.handle('taskmaster-update-task', async (event, projectPath, taskId, updates) => {
  try {
    // Build the update prompt from the updates object
    const updatePrompt = Object.entries(updates)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    const command = `task-master update-task --id="${taskId}" --prompt="${updatePrompt}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: projectPath,
        timeout: 10000
      });
      
      if (stderr && !stderr.includes('warn')) {
        console.warn('Task update stderr:', stderr);
      }
      
      return { 
        success: true, 
        message: `Task ${taskId} updated successfully`,
        taskId,
        updates
      };
      
    } catch (cliError) {
      return { 
        success: false, 
        error: `Failed to update task: ${cliError.message}`,
        taskId
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      taskId
    };
  }
});

ipcMain.handle('taskmaster-add-task', async (event, projectPath, taskData) => {
  try {
    const { title, description, priority = 'medium', dependencies = [] } = taskData;
    
    // Build the task creation prompt
    let prompt = `Title: ${title}\nDescription: ${description}`;
    if (priority !== 'medium') prompt += `\nPriority: ${priority}`;
    if (dependencies.length > 0) prompt += `\nDependencies: ${dependencies.join(', ')}`;
    
    const command = `task-master add-task --prompt="${prompt}" --priority="${priority}"`;
    if (dependencies.length > 0) {
      command += ` --dependencies="${dependencies.join(',')}"`;
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: projectPath,
        timeout: 10000
      });
      
      if (stderr && !stderr.includes('warn')) {
        console.warn('Task creation stderr:', stderr);
      }
      
      return { 
        success: true, 
        message: 'Task created successfully',
        taskData: { ...taskData, id: 'new' } // CLI will assign actual ID
      };
      
    } catch (cliError) {
      return { 
        success: false, 
        error: `Failed to create task: ${cliError.message}`
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message
    };
  }
});

ipcMain.handle('taskmaster-delete-task', async (event, projectPath, taskId) => {
  try {
    const command = `task-master remove-task --id="${taskId}" --yes`;
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: projectPath,
        timeout: 5000
      });
      
      if (stderr && !stderr.includes('warn')) {
        console.warn('Task deletion stderr:', stderr);
      }
      
      return { 
        success: true, 
        message: `Task ${taskId} deleted successfully`,
        taskId
      };
      
    } catch (cliError) {
      return { 
        success: false, 
        error: `Failed to delete task: ${cliError.message}`,
        taskId
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      taskId
    };
  }
});

// File System Watching for Real-time Updates
const chokidar = require('chokidar');
let taskFileWatcher = null;

ipcMain.handle('taskmaster-start-file-watching', async (event, projectPath) => {
  try {
    // Stop existing watcher if running
    if (taskFileWatcher) {
      taskFileWatcher.close();
      taskFileWatcher = null;
    }
    
    const tasksJsonPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
    
    // Initialize watcher
    taskFileWatcher = chokidar.watch(tasksJsonPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });
    
    // Handle file changes
    taskFileWatcher.on('change', async (filePath) => {
      try {
        console.log('Tasks file changed:', filePath);
        
        // Read updated tasks
        const content = await fs.readFile(filePath, 'utf8');
        const tasksData = JSON.parse(content);
        const tasks = tasksData.tasks || [];
        
        // Notify renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('taskmaster-tasks-updated', { 
            success: true, 
            tasks,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('Error processing file change:', error);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('taskmaster-tasks-updated', { 
            success: false, 
            error: error.message 
          });
        }
      }
    });
    
    taskFileWatcher.on('error', (error) => {
      console.error('File watcher error:', error);
    });
    
    return { 
      success: true, 
      message: 'File watching started successfully',
      watchedPath: tasksJsonPath
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message
    };
  }
});

ipcMain.handle('taskmaster-stop-file-watching', async () => {
  try {
    if (taskFileWatcher) {
      taskFileWatcher.close();
      taskFileWatcher = null;
      return { success: true, message: 'File watching stopped' };
    }
    return { success: true, message: 'No file watcher was running' };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message
    };
  }
});

// Execute command for task-master CLI integration
ipcMain.handle('executeCommand', async (event, command, cwd = process.cwd()) => {
  try {
    console.log(`Executing command: ${command} in directory: ${cwd}`);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: {
        ...process.env,
        PATH: process.env.PATH
      },
      timeout: 30000 // 30 second timeout
    });
    
    const result = {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
    
    console.log(`Command executed successfully:`, result);
    return result;
    
  } catch (error) {
    console.error(`Command execution failed:`, error);
    
    return {
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      code: error.code || -1
    };
  }
});

// GitHub CLI Integration handlers
// Using executeCommand infrastructure instead of importing TypeScript GitService

// GitHub CLI availability check
ipcMain.handle('github-cli-available', async (event, repoPath) => {
  try {
    console.log('Checking GitHub CLI availability...');
    
    // Check if gh command exists
    const whichResult = await execAsync('which gh', { 
      cwd: repoPath || process.cwd(),
      timeout: 10000 
    });
    
    if (!whichResult.stdout.trim()) {
      return { 
        success: true, 
        available: false, 
        error: 'GitHub CLI not found' 
      };
    }
    
    // Get version information
    const versionResult = await execAsync('gh --version', { 
      cwd: repoPath || process.cwd(),
      timeout: 10000 
    });
    
    // Parse version from output like "gh version 2.73.0 (2025-05-19)"
    const versionMatch = versionResult.stdout.match(/gh version ([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    return {
      success: true,
      available: true,
      version,
      path: whichResult.stdout.trim()
    };
    
  } catch (error) {
    console.error('GitHub CLI availability check failed:', error);
    return { 
      success: true, 
      available: false, 
      error: error.message 
    };
  }
});

// GitHub CLI authentication status
ipcMain.handle('github-auth-status', async (event, repoPath) => {
  try {
    console.log('Checking GitHub authentication status...');
    
    const authResult = await execAsync('gh auth status', { 
      cwd: repoPath || process.cwd(),
      timeout: 10000 
    });
    
    // Parse authentication info from stderr (gh auth status outputs to stderr)
    const output = authResult.stderr || authResult.stdout;
    
    if (output.includes('You are not logged into any GitHub hosts')) {
      return {
        success: true,
        authenticated: false,
        error: 'Not authenticated with GitHub CLI'
      };
    }
    
    // Parse user information
    const userMatch = output.match(/account (\w+)/);
    const username = userMatch ? userMatch[1] : null;
    
    // Parse protocol
    const protocolMatch = output.match(/Git operations protocol: (\w+)/);
    const protocol = protocolMatch ? protocolMatch[1] : 'unknown';
    
    // Parse scopes
    const scopesMatch = output.match(/Token scopes: '([^']+)'/);
    const scopes = scopesMatch ? scopesMatch[1].split("', '").map(s => s.replace(/'/g, '')) : [];
    
    return {
      success: true,
      authenticated: true,
      username,
      protocol,
      scopes
    };
    
  } catch (error) {
    console.error('GitHub auth status check failed:', error);
    return { 
      success: true, 
      authenticated: false, 
      error: error.message 
    };
  }
});

// Execute GitHub CLI command
ipcMain.handle('github-cli-command', async (event, repoPath, command, args = []) => {
  try {
    console.log(`Executing GitHub CLI command: gh ${command} ${args.join(' ')}`);
    
    // Build the full command
    const fullCommand = `gh ${command} ${args.join(' ')}`;
    
    const result = await execAsync(fullCommand, { 
      cwd: repoPath || process.cwd(),
      timeout: 30000 
    });
    
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr
    };
    
  } catch (error) {
    console.error('GitHub CLI command execution failed:', error);
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
});

// Get GitHub repository information
ipcMain.handle('github-repo-info', async (event, repoPath) => {
  try {
    console.log('Getting GitHub repository information...');
    
    const result = await execAsync('gh repo view --json nameWithOwner,owner,name,url,isPrivate', { 
      cwd: repoPath || process.cwd(),
      timeout: 15000 
    });
    
    const repoInfo = JSON.parse(result.stdout);
    
    return {
      success: true,
      repoInfo: {
        fullName: repoInfo.nameWithOwner,
        owner: repoInfo.owner.login,
        name: repoInfo.name,
        url: repoInfo.url,
        isPrivate: repoInfo.isPrivate
      }
    };
    
  } catch (error) {
    console.error('GitHub repo info check failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Check if directory is a GitHub repository
ipcMain.handle('github-is-repo', async (event, repoPath) => {
  try {
    console.log('Checking if directory is a GitHub repository...');
    
    // First check if it's a git repository
    const gitCheckResult = await execAsync('git rev-parse --is-inside-work-tree', { 
      cwd: repoPath || process.cwd(),
      timeout: 10000 
    });
    
    if (gitCheckResult.stdout.trim() !== 'true') {
      return {
        success: true,
        isGitHubRepo: false,
        error: 'Not a git repository'
      };
    }
    
    // Check if it has a GitHub remote
    const remoteResult = await execAsync('git remote -v', { 
      cwd: repoPath || process.cwd(),
      timeout: 10000 
    });
    
    const hasGitHubRemote = remoteResult.stdout.includes('github.com');
    
    if (!hasGitHubRemote) {
      return {
        success: true,
        isGitHubRepo: false,
        error: 'No GitHub remote found'
      };
    }
    
    // Try to get repository information
    try {
      const repoInfoResult = await execAsync('gh repo view --json nameWithOwner,owner,name,url,isPrivate', { 
        cwd: repoPath || process.cwd(),
        timeout: 15000 
      });
      
      const repoInfo = JSON.parse(repoInfoResult.stdout);
      
      return {
        success: true,
        isGitHubRepo: true,
        repoInfo: {
          fullName: repoInfo.nameWithOwner,
          owner: repoInfo.owner.login,
          name: repoInfo.name,
          url: repoInfo.url,
          isPrivate: repoInfo.isPrivate
        }
      };
      
    } catch (repoError) {
      return {
        success: true,
        isGitHubRepo: true,
        error: 'GitHub repository detected but could not fetch details'
      };
    }
    
  } catch (error) {
    console.error('GitHub repository check failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Create GitHub repository
ipcMain.handle('github-create-repo', async (event, repoPath, options) => {
  try {
    console.log('Creating GitHub repository with options:', options);
    
    const { 
      name, 
      description = '', 
      isPrivate = false, 
      initializeWithReadme = true,
      addGitIgnore = '',
      license = '' 
    } = options;
    
    // Validate required parameters
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Repository name is required');
    }
    
    // Build gh repo create command
    const args = ['repo', 'create', name];
    
    // Add description if provided
    if (description.trim()) {
      args.push('--description', description.trim());
    }
    
    // Set visibility
    if (isPrivate) {
      args.push('--private');
    } else {
      args.push('--public');
    }
    
    // Initialize with README
    if (initializeWithReadme) {
      args.push('--add-readme');
    }
    
    // Add .gitignore if specified
    if (addGitIgnore.trim()) {
      args.push('--gitignore', addGitIgnore.trim());
    }
    
    // Add license if specified
    if (license.trim()) {
      args.push('--license', license.trim());
    }
    
    // Clone the repository locally
    args.push('--clone');
    
    console.log('Executing gh command:', 'gh', args.join(' '));
    
    // Execute the repository creation command
    const createResult = await execAsync(`gh ${args.join(' ')}`, { 
      cwd: repoPath || process.cwd(),
      timeout: 60000 // 60 seconds for repository creation
    });
    
    // Parse the output to get repository URL
    const output = createResult.stdout + createResult.stderr;
    const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+/);
    const repositoryUrl = urlMatch ? urlMatch[0] : null;
    
    // Get repository information after creation
    const repoInfoResult = await execAsync(`gh repo view ${name} --json nameWithOwner,owner,name,url,isPrivate,description`, { 
      cwd: repoPath || process.cwd(),
      timeout: 15000 
    });
    
    const repoInfo = JSON.parse(repoInfoResult.stdout);
    
    return {
      success: true,
      repository: {
        name: repoInfo.name,
        fullName: repoInfo.nameWithOwner,
        owner: repoInfo.owner.login,
        url: repoInfo.url,
        description: repoInfo.description,
        isPrivate: repoInfo.isPrivate,
        cloneUrl: `https://github.com/${repoInfo.nameWithOwner}.git`,
        sshUrl: `git@github.com:${repoInfo.nameWithOwner}.git`
      },
      message: `Repository '${name}' created successfully and cloned locally`,
      localPath: `${repoPath || process.cwd()}/${name}`
    };
    
  } catch (error) {
    console.error('GitHub repository creation failed:', error);
    
    // Parse specific error messages
    let errorMessage = error.message;
    let errorType = 'general';
    
    if (error.message.includes('already exists')) {
      errorMessage = 'A repository with this name already exists';
      errorType = 'name_conflict';
    } else if (error.message.includes('authentication')) {
      errorMessage = 'GitHub authentication required. Please run "gh auth login"';
      errorType = 'authentication';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'GitHub API rate limit exceeded. Please try again later';
      errorType = 'rate_limit';
    } else if (error.message.includes('permission')) {
      errorMessage = 'Insufficient permissions to create repository';
      errorType = 'permission';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      errorType,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
});

// Check repository name availability
ipcMain.handle('github-check-repo-name', async (event, repoName, username) => {
  try {
    console.log(`Checking availability of repository name: ${username}/${repoName}`);
    
    // Try to view the repository - if it exists, this will succeed
    const checkResult = await execAsync(`gh repo view ${username}/${repoName} --json name`, { 
      timeout: 10000 
    });
    
    // If we get here, the repository exists
    return {
      success: true,
      available: false,
      message: `Repository '${username}/${repoName}' already exists`
    };
    
  } catch (error) {
    // If the command fails, the repository likely doesn't exist
    if (error.message.includes('not found') || error.message.includes('Could not resolve')) {
      return {
        success: true,
        available: true,
        message: `Repository name '${repoName}' is available`
      };
    }
    
    // Other errors (authentication, network, etc.)
    return {
      success: false,
      error: error.message,
      available: false
    };
  }
});

// Terminal functionality using node-pty for proper pseudo-terminal support
const pty = require('node-pty');

// Multiple terminal instances support
const terminals = new Map();
let terminalIdCounter = 1;

// Terminal management
ipcMain.handle('terminal-create', async (event, options = {}) => {
  try {
    console.log('Creating terminal with options:', options);
    
    // Determine shell based on platform
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 
                  process.env.SHELL || '/bin/zsh';
    
    const { cols = 80, rows = 24, cwd = process.cwd() } = options;
    
    // Create pseudo-terminal
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols,
      rows,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8',
        COLORTERM: 'truecolor',
        FORCE_COLOR: '1'
      }
    });
    
    const terminalId = terminalIdCounter++;
    
    // Store terminal instance
    terminals.set(terminalId, {
      pty: ptyProcess,
      listeners: []
    });
    
    console.log(`Terminal ${terminalId} created with PID:`, ptyProcess.pid);
    
    return { 
      success: true, 
      terminalId,
      pid: ptyProcess.pid
    };
    
  } catch (error) {
    console.error('Terminal creation error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

ipcMain.handle('terminal-send-input', async (event, terminalId, data) => {
  try {
    const terminal = terminals.get(terminalId);
    if (!terminal) {
      return { success: false, error: 'Terminal not found' };
    }
    
    terminal.pty.write(data);
    return { success: true };
    
  } catch (error) {
    console.error(`Error sending input to terminal ${terminalId}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('terminal-resize', async (event, terminalId, cols, rows) => {
  try {
    const terminal = terminals.get(terminalId);
    if (!terminal) {
      return { success: false, error: 'Terminal not found' };
    }
    
    terminal.pty.resize(cols, rows);
    return { success: true };
    
  } catch (error) {
    console.error(`Error resizing terminal ${terminalId}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('terminal-close', async (event, terminalId) => {
  try {
    const terminal = terminals.get(terminalId);
    if (!terminal) {
      return { success: false, error: 'Terminal not found' };
    }
    
    // Clean up listeners
    terminal.listeners.forEach(cleanup => cleanup());
    
    // Kill the PTY process
    terminal.pty.kill();
    
    // Remove from map
    terminals.delete(terminalId);
    
    console.log(`Terminal ${terminalId} closed`);
    return { success: true };
    
  } catch (error) {
    console.error(`Error closing terminal ${terminalId}:`, error);
    return { success: false, error: error.message };
  }
});

// Set up terminal output listeners
ipcMain.handle('terminal-setup-listeners', async (event, terminalId) => {
  try {
    const terminal = terminals.get(terminalId);
    if (!terminal) {
      return { success: false, error: 'Terminal not found' };
    }
    
    // Data listener
    const dataListener = (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-output', terminalId, data);
      }
    };
    
    // Exit listener
    const exitListener = (code, signal) => {
      console.log(`Terminal ${terminalId} exited with code:`, code, 'signal:', signal);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-exit', terminalId, code, signal);
      }
      terminals.delete(terminalId);
    };
    
    terminal.pty.on('data', dataListener);
    terminal.pty.on('exit', exitListener);
    
    // Store cleanup functions
    terminal.listeners.push(
      () => terminal.pty.off('data', dataListener),
      () => terminal.pty.off('exit', exitListener)
    );
    
    return { success: true };
    
  } catch (error) {
    console.error(`Error setting up listeners for terminal ${terminalId}:`, error);
    return { success: false, error: error.message };
  }
});

// Clean up all terminals on app quit
app.on('before-quit', () => {
  console.log('Cleaning up terminals before quit...');
  terminals.forEach((terminal, terminalId) => {
    try {
      terminal.listeners.forEach(cleanup => cleanup());
      terminal.pty.kill();
      console.log(`Cleaned up terminal ${terminalId}`);
    } catch (error) {
      console.error(`Error cleaning up terminal ${terminalId}:`, error);
    }
  });
  terminals.clear();
});