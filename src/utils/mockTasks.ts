import { Task } from '@/types/kanban';

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Setup Project Structure',
    description: 'Initialize the project with necessary folders and configuration files',
    status: 'done',
    priority: 'high',
    dependencies: [],
    details: 'Create folder structure, setup package.json, configure TypeScript and linting rules.',
    testStrategy: 'Verify all files are created and project builds successfully.',
    complexityScore: 3,
    created_at: '2025-06-15T10:00:00Z',
    updated_at: '2025-06-16T14:30:00Z',
    subtasks: [
      {
        id: 1,
        title: 'Create folder structure',
        description: 'Setup src/, public/, and config directories',
        status: 'done',
        dependencies: []
      },
      {
        id: 2,
        title: 'Configure package.json',
        description: 'Add dependencies and scripts',
        status: 'done',
        dependencies: [1]
      }
    ]
  },
  {
    id: '2',
    title: 'Implement User Authentication',
    description: 'Add login and registration functionality with JWT tokens',
    status: 'in-progress',
    priority: 'high',
    dependencies: ['1'],
    details: 'Implement secure authentication flow with proper validation and error handling.',
    testStrategy: 'Test login/logout flows, token expiration, and security edge cases.',
    complexityScore: 7,
    created_at: '2025-06-16T09:00:00Z',
    updated_at: '2025-06-17T10:15:00Z',
    subtasks: [
      {
        id: 1,
        title: 'Design auth API endpoints',
        description: 'Define login, register, and refresh token endpoints',
        status: 'done',
        dependencies: []
      },
      {
        id: 2,
        title: 'Implement JWT middleware',
        description: 'Create middleware for token validation',
        status: 'in-progress',
        dependencies: [1]
      },
      {
        id: 3,
        title: 'Create login form UI',
        description: 'Build responsive login and registration forms',
        status: 'pending',
        dependencies: [1]
      }
    ]
  },
  {
    id: '3',
    title: 'Database Schema Design',
    description: 'Design and implement the database schema for user and project data',
    status: 'review',
    priority: 'medium',
    dependencies: ['1'],
    details: 'Create normalized database schema with proper indexes and relationships.',
    testStrategy: 'Run migration tests and verify data integrity constraints.',
    complexityScore: 6,
    created_at: '2025-06-16T11:00:00Z',
    updated_at: '2025-06-17T09:45:00Z',
    subtasks: [
      {
        id: 1,
        title: 'Design user tables',
        description: 'Create users, profiles, and authentication tables',
        status: 'done',
        dependencies: []
      },
      {
        id: 2,
        title: 'Design project tables',
        description: 'Create projects, tasks, and relationships',
        status: 'done',
        dependencies: []
      },
      {
        id: 3,
        title: 'Write migration scripts',
        description: 'Create database migration files',
        status: 'done',
        dependencies: [1, 2]
      }
    ]
  },
  {
    id: '4',
    title: 'API Documentation',
    description: 'Create comprehensive API documentation using OpenAPI/Swagger',
    status: 'pending',
    priority: 'low',
    dependencies: ['2'],
    details: 'Document all endpoints with examples, error codes, and authentication requirements.',
    testStrategy: 'Verify documentation accuracy and test all examples.',
    complexityScore: 4,
    created_at: '2025-06-16T15:00:00Z',
    updated_at: '2025-06-16T15:00:00Z'
  },
  {
    id: '5',
    title: 'Task Management Interface',
    description: 'Build the main task management dashboard with Kanban board functionality',
    status: 'in-progress',
    priority: 'high',
    dependencies: ['2', '3'],
    details: 'Implement drag-and-drop Kanban board with real-time updates and filtering.',
    testStrategy: 'Test drag-and-drop, filtering, and real-time synchronization.',
    complexityScore: 8,
    created_at: '2025-06-17T08:00:00Z',
    updated_at: '2025-06-17T10:30:00Z',
    subtasks: [
      {
        id: 1,
        title: 'Design component architecture',
        description: 'Plan TaskBoard, TaskColumn, and TaskCard components',
        status: 'done',
        dependencies: []
      },
      {
        id: 2,
        title: 'Implement drag-and-drop',
        description: 'Add @dnd-kit for task movement between columns',
        status: 'done',
        dependencies: [1]
      },
      {
        id: 3,
        title: 'Add filtering and search',
        description: 'Implement task filtering by status, priority, and search',
        status: 'pending',
        dependencies: [2]
      }
    ]
  },
  {
    id: '6',
    title: 'Performance Optimization',
    description: 'Optimize application performance and loading times',
    status: 'pending',
    priority: 'medium',
    dependencies: ['5'],
    details: 'Implement code splitting, lazy loading, and performance monitoring.',
    testStrategy: 'Run performance audits and load testing.',
    complexityScore: 5,
    created_at: '2025-06-17T12:00:00Z',
    updated_at: '2025-06-17T12:00:00Z'
  },
  {
    id: '7',
    title: 'Security Audit',
    description: 'Conduct comprehensive security review and implement fixes',
    status: 'pending',
    priority: 'high',
    dependencies: ['2', '4'],
    details: 'Review authentication, authorization, input validation, and data protection.',
    testStrategy: 'Penetration testing and security scanning.',
    complexityScore: 6,
    created_at: '2025-06-17T13:00:00Z',
    updated_at: '2025-06-17T13:00:00Z'
  }
]; 