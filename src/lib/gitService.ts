import { simpleGit, SimpleGit, StatusResult, LogResult } from 'simple-git';
import { GitStatus } from '@/types';

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
  async push(remote: string = 'origin', branch?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (branch) {
        await this.git.push(remote, branch);
      } else {
        await this.git.push();
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to push changes' 
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
} 