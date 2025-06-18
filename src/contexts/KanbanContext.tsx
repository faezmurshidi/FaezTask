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

  // Load tasks from task-master CLI via Electron IPC
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
      console.log('Loading tasks from task-master for project:', currentProjectPath);
      
      const result = await (window as any).electronAPI.taskmaster.loadTasks(currentProjectPath) as TaskMasterLoadResult;
      
      if (result.success) {
        const transformedTasks = result.tasks.map(transformTaskMasterTask);
        dispatch({ type: 'SET_TASKS', payload: transformedTasks });
        console.log(`Loaded ${transformedTasks.length} tasks from task-master (${result.source})`);
        
        // Start file watching for real-time updates
        const watchResult = await (window as any).electronAPI.taskmaster.startFileWatching(currentProjectPath) as TaskMasterFileWatchResult;
        if (watchResult.success) {
          console.log('File watching started:', watchResult.watchedPath);
          
          // Set up real-time update listener
          cleanupFileWatchingRef.current = (window as any).electronAPI.taskmaster.onTasksUpdated((data: TaskMasterUpdatedData) => {
            if (data.success) {
              const transformedTasks = data.tasks?.map(transformTaskMasterTask) || [];
              dispatch({ type: 'SET_TASKS', payload: transformedTasks });
              console.log('Tasks updated from file change:', transformedTasks.length);
            } else {
              console.error('File update error:', data.error);
            }
          });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load tasks' });
        console.error('Failed to load tasks:', result.error);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      console.error('Error loading tasks:', error);
    }
  }, [isElectron]);

  // Update task via task-master CLI
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
      
      const result = await (window as any).electronAPI.taskmaster.updateTask(
        projectPath || '/Users/faez/Documents/FaezPM',
        taskId,
        updates
      ) as TaskMasterResult;
      
      if (!result.success) {
        // Rollback on error
        console.error('Failed to update task:', result.error);
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to update task' });
        // TODO: Implement proper rollback logic
      } else {
        console.log(`Task ${taskId} updated successfully`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
    }
  }, [isElectron, projectPath]);

  // Move task between columns with rollback support
  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    if (!isElectron) {
      // Mock implementation for web development
      console.log('Mock: Moved task', taskId, 'to', newStatus);
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus } });
      return;
    }

    try {
      // Get current task for rollback
      const currentTask = state.tasks.find(task => task.id === taskId);
      const previousStatus = currentTask?.status;
      
      // Optimistic update
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus, previousStatus } });
      
      const result = await (window as any).electronAPI.taskmaster.updateTaskStatus(
        projectPath || '/Users/faez/Documents/FaezPM',
        taskId,
        newStatus,
        previousStatus
      ) as TaskMasterTaskResult;
      
      if (!result.success) {
        // Rollback on error
        if (previousStatus) {
          dispatch({ type: 'ROLLBACK_TASK', payload: { taskId, status: previousStatus } });
        }
        console.error('Failed to move task:', result.error);
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to move task' });
      } else {
        console.log(`Task ${taskId} moved to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error moving task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to move task' });
    }
  }, [isElectron, projectPath, state.tasks]);

  // Select task for detail panel
  const selectTask = useCallback((task: Task | null) => {
    dispatch({ type: 'SELECT_TASK', payload: task });
  }, []);

  // Add new task
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
      const result = await (window as any).electronAPI.taskmaster.addTask(
        projectPath || '/Users/faez/Documents/FaezPM',
        {
          title: task.title,
          description: task.description,
          priority: task.priority,
          dependencies: task.dependencies,
        }
      ) as TaskMasterResult;
      
      if (result.success) {
        // Reload tasks to get the new task with proper ID
        await loadTasks();
        console.log('Task added successfully');
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to add task' });
        console.error('Failed to add task:', result.error);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add task' });
    }
  }, [isElectron, projectPath, loadTasks]);

  // Delete task
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
      const result = await (window as any).electronAPI.taskmaster.deleteTask(
        projectPath || '/Users/faez/Documents/FaezPM',
        taskId
      ) as TaskMasterTaskResult;
      
      if (result.success) {
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        console.log(`Task ${taskId} deleted successfully`);
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete task' });
        console.error('Failed to delete task:', result.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
    }
  }, [isElectron, projectPath]);

  // Auto-load tasks on mount and when projectPath changes
  useEffect(() => {
    loadTasks(projectPath);
    
    // Cleanup file watching on unmount
    return () => {
      if (cleanupFileWatchingRef.current) {
        cleanupFileWatchingRef.current();
        cleanupFileWatchingRef.current = null;
      }
      
      if (isElectron) {
        (window as any).electronAPI.taskmaster.stopFileWatching().catch(console.error);
      }
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