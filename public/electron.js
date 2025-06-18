const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');  
const path = require('path');
const fs = require('fs').promises;
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const { simpleGit } = require('simple-git');

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
  const startUrl = isDev 
    ? 'http://localhost:3000' // Next.js default port
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  // Try to load with fallback
  try {
    await mainWindow.loadURL(startUrl);
    console.log(`Successfully loaded: ${startUrl}`);
    // Show window immediately after successful load
    mainWindow.show();
    mainWindow.focus();
  } catch (error) {
    console.log(`Failed to load ${startUrl}, trying port 3001...`);
    const fallbackUrl = isDev ? 'http://localhost:3001' : startUrl;
    await mainWindow.loadURL(fallbackUrl);
    // Show window after fallback load
    mainWindow.show();
    mainWindow.focus();
  }

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

// Terminal functionality using child_process (reverting while we fix node-pty)

// Single terminal instance - following proven pattern
let ptyProcess = null;

ipcMain.on('pty:spawn', (event, options) => {
  try {
    console.log('PTY spawn requested with options:', options);
    
    // Determine shell
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 
                  process.env.SHELL || '/bin/zsh';
    
    console.log('Using shell:', shell, 'on platform:', os.platform());
    
    // Create PTY using child_process for now
    ptyProcess = spawn(shell, ['-i', '-l'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8',
        COLORTERM: 'truecolor',
        PS1: '$ ', // Simple prompt to avoid complex shell setup
        FORCE_COLOR: '1'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log('PTY created with PID:', ptyProcess.pid);
    
    // Handle terminal output
    ptyProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('PTY stdout:', JSON.stringify(output));
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('pty:data', output);
      }
    });

    ptyProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('PTY stderr:', JSON.stringify(output));
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('pty:data', output);
      }
    });
    
    // Handle process exit
    ptyProcess.on('exit', (code) => {
      console.log('PTY exited with code:', code);
      ptyProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('pty:exit', code);
      }
    });
    
    // Send initial command to show terminal is ready
    setTimeout(() => {
      console.log('Sending welcome message to PTY');
      ptyProcess.stdin.write('echo "Terminal Ready!"\n');
      ptyProcess.stdin.write('pwd\n');
    }, 500);
    
  } catch (error) {
    console.error('PTY creation error:', error);
  }
});

ipcMain.on('pty:input', (event, input) => {
  try {
    console.log('PTY input received:', input.charCodeAt(0), JSON.stringify(input));
    if (!ptyProcess) {
      console.error('No PTY process available');
      return;
    }
    
    console.log('Writing to PTY stdin...');
    
    // Handle special keys
    if (input === '\r') {
      // Enter key - send newline and execute command
      ptyProcess.stdin.write('\n');
      // Echo the newline to terminal
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('pty:data', '\r\n');
      }
    } else if (input === '\u007F' || input === '\b') {
      // Backspace - handle deletion
      ptyProcess.stdin.write(input);
      // Echo backspace sequence to terminal
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('pty:data', '\b \b');
      }
    } else if (input.charCodeAt(0) >= 32 && input.charCodeAt(0) <= 126) {
      // Printable characters - echo them back immediately
      ptyProcess.stdin.write(input);
      // Echo the character to terminal for immediate feedback
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('pty:data', input);
      }
    } else {
      // Control characters and other special keys
      ptyProcess.stdin.write(input);
    }
    
    console.log('Input written successfully');
    
  } catch (error) {
    console.error('Error writing to PTY:', error);
  }
});

ipcMain.on('pty:resize', (event, size) => {
  try {
    if (!ptyProcess) {
      console.error('No PTY process available for resize');
      return;
    }
    
    // Note: Resize functionality limited with child_process
    // Would be available with node-pty
    console.log('PTY resize requested:', size);
    
  } catch (error) {
    console.error('Error resizing PTY:', error);
  }
});

// Clean up PTY on app quit
app.on('before-quit', () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
});