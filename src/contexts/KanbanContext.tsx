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

  // Update task - simplified for now, just optimistic update
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!isElectron) {
      // Mock implementation for web development
      console.log('Mock: Updated task', taskId, updates);
      dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
      return;
    }

    try {
      // For now, just do optimistic update
      // TODO: Implement actual task-master CLI integration for updates
      dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
      console.log(`Task ${taskId} updated (optimistic update only)`);
      
      // Note: To fully implement this, we would need to:
      // 1. Read the current tasks.json file
      // 2. Update the specific task
      // 3. Write back to tasks.json file
      // OR integrate with task-master CLI commands like `tm update-task`
      
    } catch (error) {
      console.error('Error updating task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
    }
  }, [isElectron]);

  // Move task between columns - simplified for now, just optimistic update
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
      
      // Optimistic update
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus, previousStatus } });
      console.log(`Task ${taskId} moved to ${newStatus} (optimistic update only)`);
      
      // TODO: Implement actual task-master CLI integration for status updates
      // For now, we just do the optimistic update without backend persistence
      
    } catch (error) {
      console.error('Error moving task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to move task' });
    }
  }, [isElectron, state.tasks]);

  // Select task for detail panel
  const selectTask = useCallback((task: Task | null) => {
    dispatch({ type: 'SELECT_TASK', payload: task });
  }, []);

  // Add new task - simplified for now
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
      // For now, create a temporary task ID and add optimistically
      const taskWithId = { 
        ...task, 
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_TASK', payload: taskWithId });
      console.log('Added new task (optimistic, temporary ID):', taskWithId);
      
      // TODO: Implement actual task-master CLI integration for adding tasks
      // This would involve using task-master CLI commands like `tm add-task`
      
    } catch (error) {
      console.error('Error adding task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add task' });
    }
  }, [isElectron]);

  // Delete task - simplified for now
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
      // For now, just do optimistic delete
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      console.log(`Task ${taskId} deleted (optimistic update only)`);
      
      // TODO: Implement actual task-master CLI integration for deleting tasks
      // This would involve using task-master CLI commands like `tm remove-task`
      
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
    }
  }, [isElectron]);

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