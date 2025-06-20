'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect, useRef } from 'react';
import { BoardState, Task, TaskStatus, TaskUpdatePayload, Column, TaskMasterUpdatedData, TaskMasterLoadResult, TaskMasterResult, TaskMasterTaskResult, TaskMasterFileWatchResult } from '@/types/kanban';

// Default columns configuration
const DEFAULT_COLUMNS: Column[] = [
  { id: 'pending', title: 'Pending', color: 'bg-gray-500', order: 1 },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500', order: 2 },
  { id: 'review', title: 'Review', color: 'bg-yellow-500', order: 3 },
  { id: 'done', title: 'Done', color: 'bg-green-500', order: 4 },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-500', order: 5 },
  { id: 'deferred', title: 'Deferred', color: 'bg-purple-500', order: 6 },
];

// Action types
type BoardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK'; payload: TaskUpdatePayload }
  | { type: 'SELECT_TASK'; payload: Task | null }
  | { type: 'MOVE_TASK'; payload: { taskId: string; newStatus: TaskStatus; previousStatus?: TaskStatus } }
  | { type: 'ROLLBACK_TASK'; payload: { taskId: string; status: TaskStatus } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string };

// Initial state
const initialState: BoardState = {
  tasks: [],
  columns: DEFAULT_COLUMNS,
  selectedTask: null,
  loading: false,
  error: null,
};

// Reducer function
function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false, error: null };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, ...action.payload.updates }
            : task
        ),
        selectedTask: state.selectedTask?.id === action.payload.taskId
          ? { ...state.selectedTask, ...action.payload.updates }
          : state.selectedTask,
      };
    
    case 'SELECT_TASK':
      return { ...state, selectedTask: action.payload };
    
    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, status: action.payload.newStatus }
            : task
        ),
      };
    
    case 'ROLLBACK_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, status: action.payload.status }
            : task
        ),
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        selectedTask: state.selectedTask?.id === action.payload ? null : state.selectedTask,
      };
    
    default:
      return state;
  }
}

// Context type
interface KanbanContextType {
  state: BoardState;
  loadTasks: (projectPath?: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  selectTask: (task: Task | null) => void;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

// Create context
const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

// Provider component
interface KanbanProviderProps {
  children: ReactNode;
  projectPath?: string;
}

export function KanbanProvider({ children, projectPath = '/Users/faez/Documents/FaezPM' }: KanbanProviderProps) {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const cleanupFileWatchingRef = useRef<(() => void) | null>(null);

  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Transform task-master tasks to our Task format
  const transformTaskMasterTask = (tmTask: any): Task => {
    return {
      id: tmTask.id?.toString() || tmTask.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      title: tmTask.title || 'Untitled Task',
      description: tmTask.description || '',
      status: (tmTask.status || 'pending') as TaskStatus,
      priority: (tmTask.priority || 'medium') as 'low' | 'medium' | 'high',
      estimated_hours: tmTask.estimatedHours || 0,
      actual_hours: tmTask.actualHours || 0,
      created_at: tmTask.created_at || new Date().toISOString(),
      updated_at: tmTask.updated_at || new Date().toISOString(),
      tags: tmTask.tags || [],
      dependencies: tmTask.dependencies || [],
      subtasks: tmTask.subtasks || [],
    };
  };

  // Load tasks from .taskmaster/tasks/tasks.json via Electron IPC
  const loadTasks = useCallback(async (projectPath?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (!isElectron) {
        // Fallback for web development - use mock data
        const { simulateAsyncLoad } = await import('@/data/mockTasks');
        const tasks = await simulateAsyncLoad(500);
        dispatch({ type: 'SET_TASKS', payload: tasks });
        console.log('Loaded mock tasks for web development');
        return;
      }

      const currentProjectPath = projectPath || '/Users/faez/Documents/FaezPM';
      console.log('Loading tasks from .taskmaster/tasks/tasks.json for project:', currentProjectPath);
      
      // Use the same approach as Focus component - read tasks.json directly
      const tasksPath = `${currentProjectPath}/.taskmaster/tasks/tasks.json`;
      const result = await (window as any).electronAPI.readFile(tasksPath);
      
      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to read tasks.json file');
      }
      
      console.log('Successfully read tasks.json, content length:', result.content.length);
      const taskData = JSON.parse(result.content);
      
      // Extract tasks from master tag
      const tmTasks = taskData.master?.tasks || [];
      console.log('Found tasks in master tag:', tmTasks.length);
      
      const transformedTasks = tmTasks.map(transformTaskMasterTask);
      dispatch({ type: 'SET_TASKS', payload: transformedTasks });
      console.log(`Loaded ${transformedTasks.length} tasks from .taskmaster/tasks/tasks.json`);
      
      // TODO: Implement file watching for real-time updates
      // For now, we'll just load the tasks without file watching
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      console.error('Error loading tasks:', error);
    }
  }, [isElectron]);

  // Move task between columns - implement actual CLI integration
  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    if (!isElectron) {
      // Mock implementation for web development
      console.log('Mock: Moved task', taskId, 'to', newStatus);
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus } });
      return;
    }

    try {
      // Get current task for potential rollback
      const currentTask = state.tasks.find(task => task.id === taskId);
      const previousStatus = currentTask?.status;
      
      if (!currentTask) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Optimistic update
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus, previousStatus } });
      console.log(`Task ${taskId} moved to ${newStatus} (optimistic update)`);
      
      // Execute task-master CLI command to persist the change
      const result = await (window as any).electronAPI.executeCommand(
        `task-master set-status --id=${taskId} --status=${newStatus}`,
        projectPath || '/Users/faez/Documents/FaezPM'
      );
      
      if (!result.success) {
        // Rollback on failure
        if (previousStatus) {
          dispatch({ type: 'ROLLBACK_TASK', payload: { taskId, status: previousStatus } });
        }
        throw new Error(result.error || 'Failed to update task status via CLI');
      }
      
      console.log(`✅ Task ${taskId} status successfully updated to ${newStatus} via CLI`);
      
    } catch (error) {
      console.error('Error moving task:', error);
      
      // Rollback optimistic update on error
      if (state.tasks.find(task => task.id === taskId)?.status !== newStatus) {
        const originalTask = state.tasks.find(task => task.id === taskId);
        if (originalTask) {
          dispatch({ type: 'ROLLBACK_TASK', payload: { taskId, status: originalTask.status } });
        }
      }
      
      dispatch({ type: 'SET_ERROR', payload: 'Failed to move task' });
    }
  }, [isElectron, state.tasks, projectPath]);

  // Update task - implement actual CLI integration
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!isElectron) {
      // Mock implementation for web development
      console.log('Mock: Updated task', taskId, updates);
      dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
      return;
    }

    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
      console.log(`Task ${taskId} updated (optimistic update)`);
      
      // Construct update prompt based on changes
      const updatePrompts = [];
      if (updates.title) updatePrompts.push(`Title updated to: ${updates.title}`);
      if (updates.description) updatePrompts.push(`Description updated to: ${updates.description}`);
      if (updates.priority) updatePrompts.push(`Priority changed to: ${updates.priority}`);
      if (updates.status) updatePrompts.push(`Status changed to: ${updates.status}`);
      
      const updatePrompt = updatePrompts.join('\n') || 'Task details updated via UI';
      
      // Execute task-master CLI command to persist the changes
      const result = await (window as any).electronAPI.executeCommand(
        `task-master update-task --id=${taskId} --prompt="${updatePrompt}" --append`,
        projectPath || '/Users/faez/Documents/FaezPM'
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update task via CLI');
      }
      
      console.log(`✅ Task ${taskId} successfully updated via CLI`);
      
    } catch (error) {
      console.error('Error updating task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
    }
  }, [isElectron, projectPath]);

  // Select task for detail panel
  const selectTask = useCallback((task: Task | null) => {
    dispatch({ type: 'SELECT_TASK', payload: task });
  }, []);

  // Add new task - implement actual CLI integration
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isElectron) {
      // Mock implementation for web development
      const { generateNewTaskId, addTaskToMockData } = await import('@/data/mockTasks');
      const taskWithId = { 
        ...task, 
        id: generateNewTaskId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      addTaskToMockData(taskWithId);
      dispatch({ type: 'ADD_TASK', payload: taskWithId });
      console.log('Mock: Added new task', taskWithId);
      return;
    }

    try {
      // Create task prompt for CLI
      const taskPrompt = `${task.title}\n\nDescription: ${task.description}\nPriority: ${task.priority}\nEstimated hours: ${task.estimated_hours}`;
      
      // Execute task-master CLI command to add the task
      const result = await (window as any).electronAPI.executeCommand(
        `task-master add-task --prompt="${taskPrompt}" --priority=${task.priority}`,
        projectPath || '/Users/faez/Documents/FaezPM'
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add task via CLI');
      }
      
      console.log('✅ New task successfully added via CLI');
      
      // Reload tasks to get the newly created task with proper ID
      await loadTasks(projectPath);
      
    } catch (error) {
      console.error('Error adding task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add task' });
    }
  }, [isElectron, projectPath, loadTasks]);

  // Delete task - implement actual CLI integration
  const deleteTask = useCallback(async (taskId: string) => {
    if (!isElectron) {
      // Mock implementation for web development
      const { deleteTaskFromMockData } = await import('@/data/mockTasks');
      const success = deleteTaskFromMockData(taskId);
      if (success) {
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        console.log('Mock: Deleted task', taskId);
      }
      return;
    }

    try {
      // Store task for potential rollback
      const taskToDelete = state.tasks.find(task => task.id === taskId);
      
      // Optimistic delete
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      console.log(`Task ${taskId} deleted (optimistic update)`);
      
      // Execute task-master CLI command to delete the task
      const result = await (window as any).electronAPI.executeCommand(
        `task-master remove-task --id=${taskId} --yes`,
        projectPath || '/Users/faez/Documents/FaezPM'
      );
      
      if (!result.success) {
        // Rollback if delete failed
        if (taskToDelete) {
          dispatch({ type: 'ADD_TASK', payload: taskToDelete });
        }
        throw new Error(result.error || 'Failed to delete task via CLI');
      }
      
      console.log(`✅ Task ${taskId} successfully deleted via CLI`);
      
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
    }
  }, [isElectron, projectPath, state.tasks]);

  // Auto-load tasks on mount and when projectPath changes
  useEffect(() => {
    loadTasks(projectPath);
    
    // Cleanup any watchers on unmount
    return () => {
      if (cleanupFileWatchingRef.current) {
        cleanupFileWatchingRef.current();
        cleanupFileWatchingRef.current = null;
      }
      
      // TODO: Implement file watching cleanup when file watching is added
    };
  }, [projectPath, loadTasks, isElectron]);

  const contextValue: KanbanContextType = {
    state,
    loadTasks,
    updateTask,
    moveTask,
    selectTask,
    addTask,
    deleteTask,
  };

  return (
    <KanbanContext.Provider value={contextValue}>
      {children}
    </KanbanContext.Provider>
  );
}

// Hook to use Kanban context
export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
} 