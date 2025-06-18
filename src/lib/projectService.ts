import { Project } from '@/types';
import { electronAPI } from './electronAPI';

// Mock data for development - used when not in Electron
const mockProjects: Project[] = [
  {
    id: 'faezpm',
    name: 'Faez PM',
    description: 'Personal software project management companion',
    prd_file_path: '/Users/faez/Documents/FaezPM/faez_prd.md',
    local_folder_path: '/Users/faez/Documents/FaezPM',
    status: 'active',
    created_at: new Date('2024-01-01'),
    updated_at: new Date(),
  },
];

export async function getProjects(): Promise<Project[]> {
  try {
    if (electronAPI.isElectron()) {
      const projects = await electronAPI.getProjects();
      return projects.map((p: any) => ({
        ...p,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at),
      }));
    }
  } catch (error) {
    console.warn('Failed to get projects from Electron API, using mock data:', error);
  }
  
  // Fallback to mock data for web development
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockProjects;
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find(p => p.id === id) || null;
}

export async function createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
  try {
    if (electronAPI.isElectron()) {
      const project = await electronAPI.createProject({
        ...projectData,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return {
        ...project,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
      };
    }
  } catch (error) {
    console.warn('Failed to create project via Electron API, using mock:', error);
  }

  // Fallback for web development
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const newProject: Project = {
    ...projectData,
    id: Date.now().toString(),
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  mockProjects.push(newProject);
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project | null> {
  try {
    if (electronAPI.isElectron()) {
      const project = await electronAPI.updateProject(id, {
        ...updates,
        updated_at: new Date(),
      });
      return project ? {
        ...project,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
      } : null;
    }
  } catch (error) {
    console.warn('Failed to update project via Electron API, using mock:', error);
  }

  // Fallback for web development
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const projectIndex = mockProjects.findIndex(p => p.id === id);
  if (projectIndex === -1) return null;
  
  mockProjects[projectIndex] = {
    ...mockProjects[projectIndex],
    ...updates,
    updated_at: new Date(),
  };
  
  return mockProjects[projectIndex];
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    if (electronAPI.isElectron()) {
      // Delete project functionality would be implemented in Electron API
      console.log('Delete project not yet implemented in Electron API');
    }
  } catch (error) {
    console.warn('Failed to delete project via Electron API:', error);
  }

  // Fallback for web development
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const projectIndex = mockProjects.findIndex(p => p.id === id);
  if (projectIndex === -1) return false;
  
  mockProjects.splice(projectIndex, 1);
  return true;
}