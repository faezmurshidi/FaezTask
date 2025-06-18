export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies?: string[];
  details?: string;
  testStrategy?: string;
  subtasks?: Subtask[];
  complexityScore?: number;
  created_at?: string;
  updated_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
}

export interface Subtask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dependencies?: number[];
  details?: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'review' | 'done' | 'blocked' | 'cancelled' | 'deferred';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  order: number;
}

export interface BoardState {
  tasks: Task[];
  columns: Column[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
}

export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current?: {
        task: Task;
      };
    };
  };
  over: {
    id: string;
  } | null;
}

export interface TaskUpdatePayload {
  taskId: string;
  updates: Partial<Task>;
}

// Task-Master CLI Integration Types
export interface TaskMasterResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface TaskMasterLoadResult extends TaskMasterResult {
  tasks: any[];
  source?: 'cli' | 'file';
}

export interface TaskMasterTaskResult extends TaskMasterResult {
  taskId?: string;
  rollback?: { taskId: string; status: TaskStatus };
}

export interface TaskMasterFileWatchResult extends TaskMasterResult {
  watchedPath?: string;
}

export interface TaskMasterUpdatedData {
  success: boolean;
  tasks?: any[];
  timestamp?: string;
  error?: string;
}

 