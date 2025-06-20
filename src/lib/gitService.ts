import { simpleGit, SimpleGit, StatusResult, LogResult } from 'simple-git';
import { GitStatus, CommitAnalysis, CommitMetadata, AuthorStats } from '@/types';

export class GitService {
  private git: SimpleGit;
  
  constructor(private repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  /**
   * Check if the directory is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize a new git repository
   */
  async initRepository(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.git.init();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize repository' 
      };
    }
  }

  /**
   * Get comprehensive git status information
   */
  async getGitStatus(): Promise<GitStatus> {
    try {
      const isRepo = await this.isGitRepository();
      
      if (!isRepo) {
        return {
          isGitRepo: false,
          hasRemote: false,
          uncommittedChanges: 0,
          unpushedCommits: 0,
          hasConflicts: false,
          isDirty: false,
        };
      }

      const [status, branches, log] = await Promise.all([
        this.git.status(),
        this.git.branch(),
        this.git.log({ maxCount: 1 }).catch(() => null), // Handle empty repos
      ]);

      const remotes = await this.git.getRemotes(true);
      const hasRemote = remotes.length > 0;

      // Count unpushed commits if we have a remote
      let unpushedCommits = 0;
      if (hasRemote && branches.current) {
        try {
          const ahead = await this.git.status(['--porcelain', '-b']);
          // Parse the branch status line to get ahead count
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
        isGitRepo: true,
        hasRemote,
        currentBranch: branches.current || undefined,
        uncommittedChanges: status.files.length,
        unpushedCommits,
        lastCommitHash: log?.latest?.hash,
        lastCommitMessage: log?.latest?.message,
        hasConflicts: status.conflicted.length > 0,
        isDirty: !status.isClean(),
      };
    } catch (error) {
      console.error('Error getting git status:', error);
      return {
        isGitRepo: false,
        hasRemote: false,
        uncommittedChanges: 0,
        unpushedCommits: 0,
        hasConflicts: false,
        isDirty: false,
      };
    }
  }

  /**
   * Add files to staging area
   */
  async addFiles(files: string[] = ['.']): Promise<{ success: boolean; error?: string }> {
    try {
      await this.git.add(files);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add files' 
      };
    }
  }

  /**
   * Commit changes with a message
   */
  async commit(message: string): Promise<{ success: boolean; error?: string; hash?: string }> {
    try {
      const result = await this.git.commit(message);
      return { success: true, hash: result.commit };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to commit changes' 
      };
    }
  }

  /**
   * Push changes to remote repository
   */
  async push(remote: string = 'origin', branch?: string): Promise<{ success: boolean; error?: string; needsUpstream?: boolean; needsPull?: boolean }> {
    try {
      if (branch) {
        await this.git.push(remote, branch);
      } else {
        await this.git.push();
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to push changes';
      
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
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Push changes and set upstream branch
   */
  async pushWithUpstream(remote: string = 'origin', branch?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentBranch = branch || (await this.git.branch()).current;
      if (!currentBranch) {
        return { success: false, error: 'No current branch found' };
      }
      
      await this.git.push(['-u', remote, currentBranch]);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to push with upstream' 
      };
    }
  }

  /**
   * Pull changes first, then push (for handling "fetch first" scenarios)
   */
  async pullAndPush(remote: string = 'origin', branch?: string): Promise<{ success: boolean; error?: string; pullResult?: any; pushResult?: any }> {
    try {
      // First, pull the remote changes
      const pullResult = await this.pull(remote, branch);
      if (!pullResult.success) {
        return { 
          success: false, 
          error: `Failed to pull: ${pullResult.error}`,
          pullResult
        };
      }

      // Then, push our changes
      const pushResult = await this.push(remote, branch);
      if (!pushResult.success) {
        return { 
          success: false, 
          error: `Failed to push after pull: ${pushResult.error}`,
          pullResult,
          pushResult
        };
      }

      return { 
        success: true,
        pullResult,
        pushResult
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to pull and push' 
      };
    }
  }

  /**
   * Pull changes from remote repository
   */
  async pull(remote: string = 'origin', branch?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (branch) {
        await this.git.pull(remote, branch);
      } else {
        await this.git.pull();
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to pull changes' 
      };
    }
  }

  /**
   * Add a remote repository
   */
  async addRemote(name: string, url: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.git.addRemote(name, url);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add remote' 
      };
    }
  }

  /**
   * Get list of remotes
   */
  async getRemotes(): Promise<Array<{ name: string; refs: { fetch: string; push: string } }>> {
    try {
      return await this.git.getRemotes(true);
    } catch (error) {
      console.error('Error getting remotes:', error);
      return [];
    }
  }

  /**
   * Get git log with specified options
   */
  async getLog(options?: { maxCount?: number; from?: string; to?: string }): Promise<LogResult | null> {
    try {
      return await this.git.log(options);
    } catch (error) {
      console.error('Error getting git log:', error);
      return null;
    }
  }

  /**
   * Check if there are any commits in the repository
   */
  async hasCommits(): Promise<boolean> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      return log.all.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all branches with detailed information
   */
  async listBranches(options: { 
    includeRemote?: boolean; 
    includeAll?: boolean; 
  } = {}): Promise<{
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
  }> {
    try {
      const branchSummary = await this.git.branch(
        options.includeAll ? ['-a'] : 
        options.includeRemote ? ['-r'] : []
      );

      const branches = Object.entries(branchSummary.branches).map(([name, info]) => ({
        name: name.replace('remotes/', ''),
        current: info.current,
        commit: info.commit,
        tracking: (info as any).tracking || undefined,
        ahead: (info as any).ahead || undefined,
        behind: (info as any).behind || undefined,
        isRemote: name.startsWith('remotes/'),
      }));

      return { success: true, branches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list branches'
      };
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(name: string, startPoint?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (startPoint) {
        await this.git.checkoutBranch(name, startPoint);
      } else {
        await this.git.checkoutLocalBranch(name);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create branch'
      };
    }
  }

  /**
   * Switch to an existing branch
   */
  async switchBranch(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.git.checkout(name);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to switch branch'
      };
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(name: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      await this.git.deleteLocalBranch(name, force);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete branch'
      };
    }
  }

  /**
   * Set upstream branch for current or specified branch
   */
  async setUpstreamBranch(
    branch?: string, 
    remote: string = 'origin', 
    remoteBranch?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentBranch = branch || (await this.git.branch()).current;
      if (!currentBranch) {
        return { success: false, error: 'No current branch found' };
      }
      
      const upstream = remoteBranch || currentBranch;
      await this.git.branch(['-u', `${remote}/${upstream}`, currentBranch]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set upstream branch'
      };
    }
  }

  /**
   * Get detailed information about a specific branch
   */
  async getBranchInfo(branchName?: string): Promise<{
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
  }> {
    try {
      const branches = await this.git.branch();
      const targetBranch = branchName || branches.current;
      
      if (!targetBranch) {
        return { success: false, error: 'No branch specified and no current branch found' };
      }

      const branchData = branches.branches[targetBranch];
      if (!branchData) {
        return { success: false, error: `Branch '${targetBranch}' not found` };
      }

      // Get the last commit for this branch
      const log = await this.git.log({ from: targetBranch, maxCount: 1 });
      const lastCommit = log.latest;

      return {
        success: true,
        branchInfo: {
          name: targetBranch,
          commit: branchData.commit,
          tracking: (branchData as any).tracking || undefined,
          ahead: (branchData as any).ahead || undefined,
          behind: (branchData as any).behind || undefined,
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
        error: error instanceof Error ? error.message : 'Failed to get branch information'
      };
    }
  }

  /**
   * Analyze commit history and extract comprehensive metadata
   */
  async analyzeCommits(options: {
    maxCount?: number;
    since?: string;
    until?: string;
    author?: string;
  } = {}): Promise<CommitAnalysis> {
    try {
      const logOptions: any = {
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

      const log = await this.git.log(logOptions);
      
      if (log.all.length === 0) {
        return this.createEmptyAnalysis();
      }

      const commits: CommitMetadata[] = [];
      
      // Process each commit to get detailed information
      for (const commit of log.all) {
        try {
          // Get file stats for this commit
          const stats = await this.getCommitStats(commit.hash);
          
          commits.push({
            hash: commit.hash,
            message: commit.message,
            author: {
              name: commit.author_name,
              email: commit.author_email
            },
            date: new Date(commit.date),
            filesChanged: stats.filesChanged,
            insertions: stats.insertions,
            deletions: stats.deletions,
            taskReferences: this.extractTaskReferences(commit.message)
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
            taskReferences: this.extractTaskReferences(commit.message)
          });
        }
      }
      
      return this.generateAnalysis(commits);
    } catch (error) {
      console.error('Error analyzing commits:', error);
      return this.createEmptyAnalysis();
    }
  }

  /**
   * Get detailed statistics for a specific commit
   */
  private async getCommitStats(hash: string): Promise<{
    filesChanged: string[];
    insertions: number;
    deletions: number;
  }> {
    try {
      // Get commit stats using --numstat which gives us file-by-file statistics
      const result = await this.git.show([
        '--numstat',
        '--format=',
        hash
      ]);

      const lines = result.split('\n').filter(line => line.trim());
      const filesChanged: string[] = [];
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

      return {
        filesChanged,
        insertions: totalInsertions,
        deletions: totalDeletions
      };
    } catch (error) {
      return {
        filesChanged: [],
        insertions: 0,
        deletions: 0
      };
    }
  }

  /**
   * Extract task references from commit messages
   */
  private extractTaskReferences(message: string): string[] {
    const patterns = [
      /(?:task|fix|close|resolve|ref|refs|references)[s]?\s*[#:]?\s*(\d+(?:\.\d+)?)/gi,
      /#(\d+(?:\.\d+)?)/g,
      /\b(\d+\.\d+)\b/g, // Subtask references like "27.6"
      /task[s]?\s*(\d+)/gi,
    ];
    
    const references = new Set<string>();
    
    patterns.forEach(pattern => {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          references.add(match[1]);
        }
      }
    });
    
    return Array.from(references);
  }

  /**
   * Generate comprehensive analysis from commit metadata
   */
  private generateAnalysis(commits: CommitMetadata[]): CommitAnalysis {
    const dateRange = this.calculateDateRange(commits);
    const authors = this.analyzeAuthors(commits);
    const commitFrequency = this.calculateCommitFrequency(commits);
    const fileChangePatterns = this.analyzeFileChanges(commits);
    const taskReferences = this.groupByTaskReferences(commits);
    const codeVelocity = this.calculateVelocity(commits, dateRange);

    return {
      totalCommits: commits.length,
      dateRange,
      authors,
      commitFrequency,
      fileChangePatterns,
      taskReferences,
      codeVelocity
    };
  }

  /**
   * Calculate the date range of commits
   */
  private calculateDateRange(commits: CommitMetadata[]): { from: Date; to: Date } {
    if (commits.length === 0) {
      const now = new Date();
      return { from: now, to: now };
    }

    const dates = commits.map(c => c.date);
    return {
      from: new Date(Math.min(...dates.map(d => d.getTime()))),
      to: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  /**
   * Analyze author statistics
   */
  private analyzeAuthors(commits: CommitMetadata[]): AuthorStats[] {
    const authorMap = new Map<string, AuthorStats>();

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

      const stats = authorMap.get(key)!;
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

    return Array.from(authorMap.values()).sort((a, b) => b.commitCount - a.commitCount);
  }

  /**
   * Calculate commit frequency by date
   */
  private calculateCommitFrequency(commits: CommitMetadata[]): { [date: string]: number } {
    const frequency: { [date: string]: number } = {};

    commits.forEach(commit => {
      const dateKey = commit.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      frequency[dateKey] = (frequency[dateKey] || 0) + 1;
    });

    return frequency;
  }

  /**
   * Analyze file change patterns
   */
  private analyzeFileChanges(commits: CommitMetadata[]): { [file: string]: number } {
    const patterns: { [file: string]: number } = {};

    commits.forEach(commit => {
      commit.filesChanged.forEach(file => {
        patterns[file] = (patterns[file] || 0) + 1;
      });
    });

    // Sort by frequency and return top 50 files
    const sorted = Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50);

    return Object.fromEntries(sorted);
  }

  /**
   * Group commits by task references
   */
  private groupByTaskReferences(commits: CommitMetadata[]): { [taskId: string]: CommitMetadata[] } {
    const taskGroups: { [taskId: string]: CommitMetadata[] } = {};

    commits.forEach(commit => {
      commit.taskReferences.forEach(taskId => {
        if (!taskGroups[taskId]) {
          taskGroups[taskId] = [];
        }
        taskGroups[taskId].push(commit);
      });
    });

    return taskGroups;
  }

  /**
   * Calculate code velocity metrics
   */
  private calculateVelocity(commits: CommitMetadata[], dateRange: { from: Date; to: Date }): {
    avgCommitsPerDay: number;
    avgLinesChanged: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
  } {
    const totalLinesAdded = commits.reduce((sum, c) => sum + c.insertions, 0);
    const totalLinesDeleted = commits.reduce((sum, c) => sum + c.deletions, 0);
    
    const daysDiff = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      avgCommitsPerDay: commits.length / daysDiff,
      avgLinesChanged: (totalLinesAdded + totalLinesDeleted) / Math.max(1, commits.length),
      totalLinesAdded,
      totalLinesDeleted
    };
  }

  /**
   * Create empty analysis for repositories with no commits
   */
  private createEmptyAnalysis(): CommitAnalysis {
    const now = new Date();
    return {
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
    };
  }

  // GitHub CLI Integration Methods
  
  /**
   * Check if GitHub CLI is installed and available
   */
  async isGitHubCliAvailable(): Promise<{ available: boolean; version?: string; path?: string }> {
    try {
      // Use Node.js to check if gh command exists
      const { execSync } = require('child_process');
      
      // Check if gh is available
      const whichResult = execSync('which gh', { encoding: 'utf8' }).trim();
      const versionResult = execSync('gh --version', { encoding: 'utf8' });
      
      // Parse version from output like "gh version 2.73.0 (2025-05-19)"
      const versionMatch = versionResult.match(/gh version ([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';
      
      return {
        available: true,
        version,
        path: whichResult
      };
    } catch (error) {
      return {
        available: false
      };
    }
  }

  /**
   * Check GitHub CLI authentication status
   */
  async getGitHubAuthStatus(): Promise<{
    authenticated: boolean;
    username?: string;
    scopes?: string[];
    protocol?: string;
    error?: string;
  }> {
    try {
      const { execSync } = require('child_process');
      
      const authResult = execSync('gh auth status', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'] // Capture both stdout and stderr
      });
      
      // Parse the auth status output
      const lines = authResult.split('\n');
      let username: string | undefined;
      let protocol: string | undefined;
      let scopes: string[] = [];
      
      for (const line of lines) {
        if (line.includes('Logged in to github.com account')) {
          const usernameMatch = line.match(/account (\w+)/);
          username = usernameMatch ? usernameMatch[1] : undefined;
        } else if (line.includes('Git operations protocol:')) {
          const protocolMatch = line.match(/protocol: (\w+)/);
          protocol = protocolMatch ? protocolMatch[1] : undefined;
        } else if (line.includes('Token scopes:')) {
          const scopesMatch = line.match(/Token scopes: '([^']+)'/);
          if (scopesMatch) {
            scopes = scopesMatch[1].split("', '").map((s: string) => s.replace(/'/g, ''));
          }
        }
      }
      
      return {
        authenticated: true,
        username,
        protocol,
        scopes
      };
    } catch (error) {
      // If command fails, user is likely not authenticated
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      };
    }
  }

  /**
   * Execute a GitHub CLI command safely
   */
  async executeGitHubCliCommand(command: string, args: string[] = []): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    try {
      // Validate that GitHub CLI is available
      const cliStatus = await this.isGitHubCliAvailable();
      if (!cliStatus.available) {
        return {
          success: false,
          error: 'GitHub CLI is not installed or not available in PATH'
        };
      }

      // Validate authentication
      const authStatus = await this.getGitHubAuthStatus();
      if (!authStatus.authenticated) {
        return {
          success: false,
          error: 'GitHub CLI is not authenticated. Please run "gh auth login" first.'
        };
      }

      const { execSync } = require('child_process');
      
      // Construct the full command
      const fullCommand = ['gh', command, ...args].join(' ');
      
      // Execute the command with proper error handling
      const output = execSync(fullCommand, {
        encoding: 'utf8',
        cwd: this.repoPath,
        timeout: 30000 // 30-second timeout
      });
      
      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub CLI command failed'
      };
    }
  }

  /**
   * Get repository information from GitHub
   */
  async getGitHubRepoInfo(): Promise<{
    success: boolean;
    owner?: string;
    name?: string;
    fullName?: string;
    url?: string;
    isPrivate?: boolean;
    error?: string;
  }> {
    const result = await this.executeGitHubCliCommand('repo', ['view', '--json', 'owner,name,nameWithOwner,url,isPrivate']);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    try {
      const repoData = JSON.parse(result.output || '{}');
      
      return {
        success: true,
        owner: repoData.owner?.login,
        name: repoData.name,
        fullName: repoData.nameWithOwner,
        url: repoData.url,
        isPrivate: repoData.isPrivate
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse repository information'
      };
    }
  }

  /**
   * Check if current directory is a GitHub repository
   */
  async isGitHubRepository(): Promise<{
    isGitHubRepo: boolean;
    repoInfo?: {
      owner: string;
      name: string;
      fullName: string;
      url: string;
      isPrivate: boolean;
    };
    error?: string;
  }> {
    // First check if it's a git repository
    const isGitRepo = await this.isGitRepository();
    if (!isGitRepo) {
      return {
        isGitHubRepo: false,
        error: 'Not a git repository'
      };
    }

    // Check if it has a GitHub remote
    const repoResult = await this.getGitHubRepoInfo();
    
    if (repoResult.success && repoResult.owner && repoResult.name) {
      return {
        isGitHubRepo: true,
        repoInfo: {
          owner: repoResult.owner,
          name: repoResult.name,
          fullName: repoResult.fullName || `${repoResult.owner}/${repoResult.name}`,
          url: repoResult.url || `https://github.com/${repoResult.owner}/${repoResult.name}`,
          isPrivate: repoResult.isPrivate || false
        }
      };
    }

    return {
      isGitHubRepo: false,
      error: repoResult.error || 'Not connected to a GitHub repository'
    };
  }
} 