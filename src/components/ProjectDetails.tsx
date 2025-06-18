'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Project, Task } from '@/types';
import { getProject } from '@/lib/projectService';

interface ProjectDetailsProps {
  projectId: string;
}

// Transform task-master task to our Task interface
function transformTaskMasterTask(tmTask: any, projectId: string): Task {
  // Map task-master status to our interface
  const statusMap: Record<string, 'todo' | 'in_progress' | 'completed'> = {
    'pending': 'todo',
    'in-progress': 'in_progress', 
    'review': 'in_progress',
    'done': 'completed',
    'blocked': 'todo',
    'cancelled': 'todo',
    'deferred': 'todo'
  };

  // Map task-master priority to our interface
  const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high'
  };

  return {
    id: tmTask.id?.toString() || 'unknown',
    project_id: projectId,
    title: tmTask.title || 'Untitled Task',
    description: tmTask.description || '',
    status: statusMap[tmTask.status] || 'todo',
    priority: priorityMap[tmTask.priority] || 'medium',
    estimated_hours: tmTask.estimated_hours,
    actual_hours: tmTask.actual_hours,
    due_date: tmTask.due_date ? new Date(tmTask.due_date) : undefined,
    created_at: tmTask.created_at ? new Date(tmTask.created_at) : new Date(),
    updated_at: tmTask.updated_at ? new Date(tmTask.updated_at) : new Date(),
  };
}

// Task fetcher using real task-master data
async function getTasks(projectId: string): Promise<Task[]> {
  try {
    // Check if we're in Electron context
    if (typeof window !== 'undefined' && (window as any).electronAPI?.taskmaster?.loadTasks) {
      // Use the correct project path - for now, hardcode to current directory
      // In a real app, this would come from project config or be passed as a prop
      const projectPath = '/Users/faez/Documents/FaezPM';
      const result = await (window as any).electronAPI.taskmaster.loadTasks(projectPath);
      
      if (result.success && result.tasks) {
        // Transform task-master tasks to our Task interface
        const transformedTasks = result.tasks.map((tmTask: any) => 
          transformTaskMasterTask(tmTask, projectId)
        );
        
        console.log(`Loaded ${transformedTasks.length} tasks for project ${projectId}`);
        return transformedTasks;
      } else {
        console.warn('Failed to load tasks:', result.error);
        return [];
      }
    } else {
      // Fallback for web development - return empty array or mock data
      console.log('Not in Electron context, returning empty tasks');
      return [];
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

export default function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const { data: project, error: projectError, isLoading: projectLoading } = useSWR(
    `project-${projectId}`,
    () => getProject(projectId)
  );
  const { data: tasks, error: tasksError, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(
    `tasks-${projectId}`,
    () => getTasks(projectId)
  );

  const [activeSection, setActiveSection] = useState<'overview' | 'tasks' | 'files' | 'settings'>('overview');

  // Set up real-time task updates in Electron context
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.taskmaster?.onTasksUpdated) {
      const handleTasksUpdated = (updatedData: any) => {
        console.log('Tasks updated, refreshing ProjectDetails');
        mutateTasks(); // Refresh the task data
      };

      // Listen for task updates
      const cleanup = (window as any).electronAPI.taskmaster.onTasksUpdated(handleTasksUpdated);
      
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [mutateTasks]);

  if (projectError || tasksError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Error loading project</h3>
          <p className="mt-2 text-sm text-red-700">Failed to load project data. Please try again.</p>
        </div>
      </div>
    );
  }

  if (projectLoading || tasksLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
          <p className="text-gray-500">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  const getTaskStatusCounts = () => {
    if (!tasks) return { todo: 0, in_progress: 0, completed: 0 };
    return tasks.reduce(
      (acc, task) => {
        acc[task.status]++;
        return acc;
      },
      { todo: 0, in_progress: 0, completed: 0 }
    );
  };

  const statusCounts = getTaskStatusCounts();
  const totalTasks = tasks?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((statusCounts.completed / totalTasks) * 100) : 0;

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            project.status === 'active' ? 'bg-green-100 text-green-800' :
            project.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {project.status}
          </span>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">Completion</h3>
            <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">Total Tasks</h3>
            <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">Completed</h3>
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'tasks', name: 'Tasks' },
              { id: 'files', name: 'Files' },
              { id: 'settings', name: 'Settings' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Section Content */}
      <div>
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Local Path</dt>
                  <dd className="text-sm text-gray-900 font-mono">{project.local_folder_path || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">GitHub Repository</dt>
                  <dd className="text-sm text-gray-900">{project.github_repo_url || 'Not connected'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Created</dt>
                  <dd className="text-sm text-gray-900">{project.created_at.toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{project.updated_at.toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Task completed: Setup Electron and Next.js</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Task started: Develop Project Management Module</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  <span className="text-gray-600">Project created</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tasks</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Add Task
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {tasks?.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-base font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {task.estimated_hours && (
                          <span>Est: {task.estimated_hours}h</span>
                        )}
                        {task.actual_hours && (
                          <span>Actual: {task.actual_hours}h</span>
                        )}
                        <span>Updated {task.updated_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'files' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Project Files</h3>
            <p className="text-gray-600">File management interface will be implemented in a future update.</p>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Project Settings</h3>
            <p className="text-gray-600">Project settings interface will be implemented in a future update.</p>
          </div>
        )}
      </div>
    </div>
  );
}