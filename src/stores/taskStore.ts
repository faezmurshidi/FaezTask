import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware/persist';
import { Task, TaskStatus } from '@/types/kanban';

// Normalized state structure for better performance
interface NormalizedTask extends Omit<Task, 'subtasks'> {
  subtaskIds: string[];
}

interface TaskState {
  // Normalized data
  tasks: Record<string, NormalizedTask>;
  subtasks: Record<string, Task>;
  
  // UI state
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;
  
  // Project context
  currentProject: string;
  lastSync: number;
  
  // Derived data (computed)
  tasksByStatus: Record<TaskStatus, string[]>;
  
  // Performance optimizations
  batchUpdates: boolean;
  pendingUpdates: Set<string>;
}

interface TaskActions {
  // Core CRUD operations
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  
  // Subtask operations
  addSubtask: (parentId: string, subtask: Task) => void;
  updateSubtask: (subtaskId: string, updates: Partial<Task>) => void;
  deleteSubtask: (subtaskId: string) => void;
  
  // UI operations
  selectTask: (taskId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Performance operations
  startBatchUpdate: () => void;
  endBatchUpdate: () => void;
  invalidateCache: () => void;
  
  // Sync operations
  syncWithFileSystem: (projectPath: string) => Promise<void>;
  startRealtimeSync: (projectPath: string) => void;
  stopRealtimeSync: () => void;
}

// Selectors for performance (only re-render when specific data changes)
export const taskSelectors = {
  // Get tasks by status (memoized)
  getTasksByStatus: (status: TaskStatus) => (state: TaskState) => 
    state.tasksByStatus[status]?.map(id => state.tasks[id]).filter(Boolean) || [],
  
  // Get single task with its subtasks
  getTaskWithSubtasks: (taskId: string) => (state: TaskState) => {
    const task = state.tasks[taskId];
    if (!task) return null;
    
    const subtasks = task.subtaskIds.map(id => state.subtasks[id]).filter(Boolean);
    return { ...task, subtasks };
  },
  
  // Get task counts by status
  getTaskCounts: (state: TaskState) => 
    Object.entries(state.tasksByStatus).reduce((acc, [status, taskIds]) => ({
      ...acc,
      [status]: taskIds.length
    }), {} as Record<TaskStatus, number>),
  
  // Get filtered tasks (for search, etc.)
  getFilteredTasks: (filter: (task: NormalizedTask) => boolean) => (state: TaskState) =>
    Object.values(state.tasks).filter(filter),
};

// Performance-optimized store with middleware
export const useTaskStore = create<TaskState & TaskActions>()(
  subscribeWithSelector(
    immer(
      persist(
        (set: any, get: any) => ({
          // Initial state
          tasks: {},
          subtasks: {},
          selectedTaskId: null,
          loading: false,
          error: null,
          currentProject: '',
          lastSync: 0,
          tasksByStatus: {
            'pending': [],
            'in-progress': [],
            'review': [],
            'done': [],
            'blocked': [],
            'cancelled': [],
            'deferred': [],
          } as Record<TaskStatus, string[]>,
          batchUpdates: false,
          pendingUpdates: new Set(),

          // Actions
          setTasks: (tasks: Task[]) =>
            set((state) => {
              // Clear existing data
              state.tasks = {};
              state.subtasks = {};
              state.tasksByStatus = {
                'pending': [],
                'in-progress': [],
                'review': [],
                'done': [],
                'blocked': [],
                'deferred': [],
              };

              // Normalize and populate
              tasks.forEach((task) => {
                const { subtasks = [], ...mainTask } = task;
                const subtaskIds = subtasks.map(st => st.id);

                // Store main task
                state.tasks[task.id] = { ...mainTask, subtaskIds };
                
                // Store subtasks
                subtasks.forEach(subtask => {
                  state.subtasks[subtask.id] = subtask;
                });

                // Update status index
                if (!state.tasksByStatus[task.status]) {
                  state.tasksByStatus[task.status] = [];
                }
                state.tasksByStatus[task.status].push(task.id);
              });

              state.lastSync = Date.now();
              state.error = null;
              state.loading = false;
            }),

          addTask: (task: Task) =>
            set((state) => {
              const { subtasks = [], ...mainTask } = task;
              const subtaskIds = subtasks.map(st => st.id);

              state.tasks[task.id] = { ...mainTask, subtaskIds };
              
              subtasks.forEach(subtask => {
                state.subtasks[subtask.id] = subtask;
              });

              if (!state.tasksByStatus[task.status]) {
                state.tasksByStatus[task.status] = [];
              }
              state.tasksByStatus[task.status].push(task.id);
            }),

          updateTask: (taskId: string, updates: Partial<Task>) =>
            set((state) => {
              const task = state.tasks[taskId];
              if (!task) return;

              // Handle status change
              if (updates.status && updates.status !== task.status) {
                // Remove from old status
                state.tasksByStatus[task.status] = state.tasksByStatus[task.status].filter(id => id !== taskId);
                
                // Add to new status
                if (!state.tasksByStatus[updates.status]) {
                  state.tasksByStatus[updates.status] = [];
                }
                state.tasksByStatus[updates.status].push(taskId);
              }

              // Update task data
              Object.assign(state.tasks[taskId], updates);

              // Mark for sync if not in batch mode
              if (!state.batchUpdates) {
                state.pendingUpdates.add(taskId);
              }
            }),

          deleteTask: (taskId: string) =>
            set((state) => {
              const task = state.tasks[taskId];
              if (!task) return;

              // Remove from status index
              state.tasksByStatus[task.status] = state.tasksByStatus[task.status].filter(id => id !== taskId);

              // Delete subtasks
              task.subtaskIds.forEach(subtaskId => {
                delete state.subtasks[subtaskId];
              });

              // Delete main task
              delete state.tasks[taskId];

              // Clear selection if this task was selected
              if (state.selectedTaskId === taskId) {
                state.selectedTaskId = null;
              }
            }),

          moveTask: (taskId: string, newStatus: TaskStatus) =>
            set((state) => {
              const task = state.tasks[taskId];
              if (!task) return;

              // Remove from old status
              state.tasksByStatus[task.status] = state.tasksByStatus[task.status].filter(id => id !== taskId);
              
              // Add to new status
              if (!state.tasksByStatus[newStatus]) {
                state.tasksByStatus[newStatus] = [];
              }
              state.tasksByStatus[newStatus].push(taskId);

              // Update task
              state.tasks[taskId].status = newStatus;
            }),

          addSubtask: (parentId: string, subtask: Task) =>
            set((state) => {
              const parentTask = state.tasks[parentId];
              if (!parentTask) return;

              state.subtasks[subtask.id] = subtask;
              parentTask.subtaskIds.push(subtask.id);
            }),

          updateSubtask: (subtaskId: string, updates: Partial<Task>) =>
            set((state) => {
              if (state.subtasks[subtaskId]) {
                Object.assign(state.subtasks[subtaskId], updates);
              }
            }),

          deleteSubtask: (subtaskId: string) =>
            set((state) => {
              delete state.subtasks[subtaskId];
              
              // Remove from parent task
              Object.values(state.tasks).forEach(task => {
                task.subtaskIds = task.subtaskIds.filter(id => id !== subtaskId);
              });
            }),

          selectTask: (taskId: string | null) =>
            set((state) => {
              state.selectedTaskId = taskId;
            }),

          setLoading: (loading: boolean) =>
            set((state) => {
              state.loading = loading;
            }),

          setError: (error: string | null) =>
            set((state) => {
              state.error = error;
            }),

          startBatchUpdate: () =>
            set((state) => {
              state.batchUpdates = true;
            }),

          endBatchUpdate: () =>
            set((state) => {
              state.batchUpdates = false;
              // Process pending updates
              state.pendingUpdates.clear();
            }),

          invalidateCache: () =>
            set((state) => {
              state.lastSync = 0;
            }),

          // Async operations
          syncWithFileSystem: async (projectPath: string) => {
            const { setLoading, setError, setTasks } = get();
            
            setLoading(true);
            setError(null);

            try {
              if (typeof window !== 'undefined' && (window as any).electronAPI?.taskmaster?.loadTasks) {
                const result = await (window as any).electronAPI.taskmaster.loadTasks(projectPath);
                
                if (result.success && result.tasks) {
                  setTasks(result.tasks);
                } else {
                  setError(result.error || 'Failed to load tasks');
                }
              }
            } catch (error) {
              setError('Failed to sync with file system');
              console.error('Sync error:', error);
            } finally {
              setLoading(false);
            }
          },

          startRealtimeSync: (projectPath: string) => {
            // Set up file watching and real-time updates
            if (typeof window !== 'undefined' && (window as any).electronAPI?.taskmaster?.startFileWatching) {
              (window as any).electronAPI.taskmaster.startFileWatching(projectPath).then((result: any) => {
                if (result.success) {
                  // Set up real-time listener
                  (window as any).electronAPI.taskmaster.onTasksUpdated((data: any) => {
                    if (data.success && data.tasks) {
                      get().setTasks(data.tasks);
                    }
                  });
                }
              });
            }
          },

          stopRealtimeSync: () => {
            if (typeof window !== 'undefined' && (window as any).electronAPI?.taskmaster?.stopFileWatching) {
              (window as any).electronAPI.taskmaster.stopFileWatching();
            }
          },
        }),
        {
          name: 'task-store',
          partialize: (state) => ({
            tasks: state.tasks,
            subtasks: state.subtasks,
            currentProject: state.currentProject,
            lastSync: state.lastSync,
          }),
        }
      )
    )
  )
);

// Hook for specific task status (prevents unnecessary re-renders)
export const useTasksByStatus = (status: TaskStatus) => 
  useTaskStore(state => taskSelectors.getTasksByStatus(status)(state));

// Hook for single task with subtasks
export const useTaskWithSubtasks = (taskId: string | null) =>
  useTaskStore(state => taskId ? taskSelectors.getTaskWithSubtasks(taskId)(state) : null);

// Hook for task counts (dashboard stats)
export const useTaskCounts = () =>
  useTaskStore(taskSelectors.getTaskCounts);

// Hook for loading/error state only
export const useTaskMeta = () =>
  useTaskStore(state => ({
    loading: state.loading,
    error: state.error,
    lastSync: state.lastSync,
  })); 