export interface Project {
  id: string;
  name: string;
  description: string;
  prd_file_path?: string;
  local_folder_path?: string;
  github_repo_url?: string;
  status: 'active' | 'paused' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface GitStatus {
  isGitRepo: boolean;
  hasRemote: boolean;
  currentBranch?: string;
  uncommittedChanges: number;
  unpushedCommits: number;
  lastCommitHash?: string;
  lastCommitMessage?: string;
  hasConflicts: boolean;
  isDirty: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  project_id: string;
  start_time: Date;
  end_time?: Date;
  duration_minutes: number;
  description?: string;
  entry_type: 'manual' | 'pomodoro';
}

export interface Document {
  id: string;
  project_id: string;
  file_path: string;
  title: string;
  content: string;
  document_type: 'readme' | 'spec' | 'notes' | 'other';
  last_indexed: Date;
  created_at: Date;
}

// Commit Analysis Types
export interface CommitMetadata {
  hash: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: Date;
  filesChanged: string[];
  insertions: number;
  deletions: number;
  taskReferences: string[];
}

export interface AuthorStats {
  name: string;
  email: string;
  commitCount: number;
  linesAdded: number;
  linesDeleted: number;
  firstCommit: Date;
  lastCommit: Date;
}

export interface CommitAnalysis {
  totalCommits: number;
  dateRange: {
    from: Date;
    to: Date;
  };
  authors: AuthorStats[];
  commitFrequency: { [date: string]: number };
  fileChangePatterns: { [file: string]: number };
  taskReferences: { [taskId: string]: CommitMetadata[] };
  codeVelocity: {
    avgCommitsPerDay: number;
    avgLinesChanged: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
  };
}

export interface CommitTaskCorrelation {
  commitHash: string;
  taskId: string | null;
  confidence: number; // 0-1 scale
  method: 'regex' | 'semantic' | 'manual' | 'ai'; // How the correlation was determined
  reasoning: string;
  progressEstimate: 'started' | 'in-progress' | 'completed' | 'unknown';
  suggestedAction?: 'update-status' | 'add-progress' | 'create-task' | 'none';
  timestamp: string;
}

export interface TaskCorrelationService {
  analyzeCommitTaskCorrelation: (
    commit: CommitMetadata,
    availableTasks?: any[],
    options?: CorrelationOptions
  ) => Promise<CommitTaskCorrelation>;
  getTaskReferences: (commitMessage: string) => string[];
  updateTaskProgress: (correlation: CommitTaskCorrelation) => Promise<boolean>;
}

export interface CorrelationOptions {
  useAI?: boolean; // Future AI integration flag
  confidenceThreshold?: number;
  includeFileAnalysis?: boolean;
  projectContext?: string;
}