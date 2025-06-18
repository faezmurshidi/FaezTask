import { Task, TaskStatus, TaskPriority } from '@/types/kanban';

// Original mock tasks data (immutable reference)
const ORIGINAL_MOCK_TASKS: Task[] = [
  // Pending tasks
  {
    id: '1',
    title: 'Setup Project Repository',
    description: 'Initialize the project repository with basic structure and configuration',
    status: 'pending' as TaskStatus,
    priority: 'high' as TaskPriority,
    dependencies: [],
    details: 'Create GitHub repository, setup initial folder structure, add README, and configure basic CI/CD pipeline',
    testStrategy: 'Verify repository is accessible and all initial files are present',
    complexityScore: 3,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    subtasks: [
      {
        id: 1,
        title: 'Create GitHub repository',
        description: 'Initialize new repository on GitHub',
        status: 'pending' as TaskStatus,
        details: 'Create repository with appropriate name and description'
      },
      {
        id: 2,
        title: 'Setup folder structure',
        description: 'Create basic project folder structure',
        status: 'pending' as TaskStatus,
        details: 'Create src/, docs/, tests/ folders'
      }
    ]
  },
  {
    id: '2',
    title: 'Design Database Schema',
    description: 'Create comprehensive database schema for the application',
    status: 'pending' as TaskStatus,
    priority: 'high' as TaskPriority,
    dependencies: ['1'],
    details: 'Design tables for users, projects, tasks, and relationships. Include proper indexing and constraints.',
    testStrategy: 'Create test database and verify all tables can be created successfully',
    complexityScore: 7,
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z'
  },
  {
    id: '3',
    title: 'Implement User Authentication',
    description: 'Build secure user authentication system',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: ['2'],
    details: 'Implement JWT-based authentication with login, register, and password reset functionality',
    testStrategy: 'Test all authentication flows including edge cases and security vulnerabilities',
    complexityScore: 8,
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },

  // In-progress tasks
  {
    id: '4',
    title: 'Create API Endpoints',
    description: 'Develop RESTful API endpoints for core functionality',
    status: 'in-progress' as TaskStatus,
    priority: 'high' as TaskPriority,
    dependencies: ['2'],
    details: 'Create CRUD endpoints for tasks, projects, and user management. Include proper error handling and validation.',
    testStrategy: 'Write comprehensive API tests covering all endpoints and edge cases',
    complexityScore: 9,
    created_at: '2024-01-16T09:00:00Z',
    updated_at: '2024-01-18T14:30:00Z',
    subtasks: [
      {
        id: 1,
        title: 'User management endpoints',
        description: 'Create endpoints for user CRUD operations',
        status: 'done' as TaskStatus,
        details: 'Implemented GET, POST, PUT, DELETE for users'
      },
      {
        id: 2,
        title: 'Project management endpoints',
        description: 'Create endpoints for project operations',
        status: 'in-progress' as TaskStatus,
        details: 'Working on project creation and listing endpoints'
      },
      {
        id: 3,
        title: 'Task management endpoints',
        description: 'Create endpoints for task operations',
        status: 'pending' as TaskStatus,
        details: 'Need to implement task CRUD operations'
      }
    ]
  },
  {
    id: '5',
    title: 'Frontend Component Library',
    description: 'Build reusable UI components for the application',
    status: 'in-progress' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: [],
    details: 'Create a comprehensive component library with buttons, forms, modals, and data display components',
    testStrategy: 'Create Storybook stories for all components and test in different scenarios',
    complexityScore: 6,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-19T16:45:00Z'
  },

  // Review tasks
  {
    id: '6',
    title: 'Security Audit',
    description: 'Conduct comprehensive security review of the application',
    status: 'review' as TaskStatus,
    priority: 'high' as TaskPriority,
    dependencies: ['3', '4'],
    details: 'Review authentication implementation, API security, input validation, and potential vulnerabilities',
    testStrategy: 'Run security scanning tools and perform manual penetration testing',
    complexityScore: 5,
    created_at: '2024-01-17T08:00:00Z',
    updated_at: '2024-01-20T11:20:00Z'
  },
  {
    id: '7',
    title: 'Performance Optimization',
    description: 'Optimize application performance and loading times',
    status: 'review' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: ['4', '5'],
    details: 'Analyze and optimize database queries, implement caching, and optimize frontend bundle size',
    testStrategy: 'Run performance benchmarks and compare before/after metrics',
    complexityScore: 7,
    created_at: '2024-01-17T14:00:00Z',
    updated_at: '2024-01-21T09:15:00Z',
    subtasks: [
      {
        id: 1,
        title: 'Database query optimization',
        description: 'Optimize slow database queries',
        status: 'done' as TaskStatus,
        details: 'Added proper indexes and optimized N+1 queries'
      },
      {
        id: 2,
        title: 'Frontend bundle optimization',
        description: 'Reduce frontend bundle size',
        status: 'review' as TaskStatus,
        details: 'Implemented code splitting and lazy loading'
      }
    ]
  },

  // Done tasks
  {
    id: '8',
    title: 'Project Planning',
    description: 'Complete initial project planning and requirements gathering',
    status: 'done' as TaskStatus,
    priority: 'high' as TaskPriority,
    dependencies: [],
    details: 'Gather requirements, create user stories, and plan project timeline',
    testStrategy: 'Review requirements with stakeholders and get approval',
    complexityScore: 4,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-14T17:00:00Z'
  },
  {
    id: '9',
    title: 'Technology Stack Selection',
    description: 'Research and select appropriate technology stack',
    status: 'done' as TaskStatus,
    priority: 'high' as TaskPriority,
    dependencies: ['8'],
    details: 'Evaluate different frameworks, databases, and tools. Document decisions and rationale.',
    testStrategy: 'Create proof of concept with selected technologies',
    complexityScore: 5,
    created_at: '2024-01-11T10:00:00Z',
    updated_at: '2024-01-14T15:30:00Z'
  },
  {
    id: '10',
    title: 'Development Environment Setup',
    description: 'Setup development environment and tooling',
    status: 'done' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: ['9'],
    details: 'Configure development environment, install necessary tools, setup linting and formatting',
    testStrategy: 'Verify all team members can run the project locally',
    complexityScore: 3,
    created_at: '2024-01-12T08:00:00Z',
    updated_at: '2024-01-14T12:00:00Z'
  },

  // Blocked task
  {
    id: '11',
    title: 'Third-party Integration',
    description: 'Integrate with external payment processing service',
    status: 'blocked' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: ['3'],
    details: 'Integrate with Stripe for payment processing. Waiting for API access approval.',
    testStrategy: 'Test payment flows in sandbox environment',
    complexityScore: 6,
    created_at: '2024-01-18T13:00:00Z',
    updated_at: '2024-01-21T10:00:00Z'
  },

  // Deferred task
  {
    id: '12',
    title: 'Mobile App Development',
    description: 'Develop mobile application for iOS and Android',
    status: 'deferred' as TaskStatus,
    priority: 'low' as TaskPriority,
    dependencies: ['4'],
    details: 'Create mobile apps using React Native. Deferred to Phase 2 of the project.',
    testStrategy: 'Test on various devices and OS versions',
    complexityScore: 10,
    created_at: '2024-01-19T11:00:00Z',
    updated_at: '2024-01-21T14:00:00Z'
  },

  // Additional tasks for better visual variety
  {
    id: '13',
    title: 'Write Unit Tests',
    description: 'Add comprehensive unit test coverage',
    status: 'pending' as TaskStatus,
    priority: 'low' as TaskPriority,
    dependencies: [],
    details: 'Write unit tests for all utility functions and core business logic',
    testStrategy: 'Achieve at least 80% test coverage',
    complexityScore: 4,
    created_at: '2024-01-22T09:00:00Z',
    updated_at: '2024-01-22T09:00:00Z'
  },
  {
    id: '14',
    title: 'Setup Docker Configuration',
    description: 'Create Docker containers for development and production',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: [],
    details: 'Create Dockerfile and docker-compose.yml for easy deployment',
    testStrategy: 'Verify application runs correctly in Docker containers',
    complexityScore: 5,
    created_at: '2024-01-22T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z'
  },
  {
    id: '15',
    title: 'Implement Real-time Features',
    description: 'Add WebSocket support for real-time updates',
    status: 'in-progress' as TaskStatus,
    priority: 'low' as TaskPriority,
    dependencies: ['4'],
    details: 'Implement WebSocket connection and real-time task updates',
    testStrategy: 'Test real-time updates across multiple browser sessions',
    complexityScore: 6,
    created_at: '2024-01-23T11:00:00Z',
    updated_at: '2024-01-24T15:20:00Z',
    subtasks: [
      {
        id: 1,
        title: 'WebSocket server setup',
        description: 'Configure WebSocket server',
        status: 'done' as TaskStatus,
        details: 'Set up Socket.io server'
      },
      {
        id: 2,
        title: 'Client-side WebSocket integration',
        description: 'Integrate WebSocket client',
        status: 'in-progress' as TaskStatus,
        details: 'Working on client connection handling'
      }
    ]
  },
  {
    id: '16',
    title: 'Mobile Responsive Design',
    description: 'Ensure application works well on mobile devices',
    status: 'in-progress' as TaskStatus,
    priority: 'high' as TaskPriority,
    dependencies: ['5'],
    details: 'Optimize UI components and layouts for mobile screens',
    testStrategy: 'Test on various mobile devices and screen sizes',
    complexityScore: 4,
    created_at: '2024-01-23T14:00:00Z',
    updated_at: '2024-01-24T10:30:00Z'
  },
  {
    id: '17',
    title: 'Code Review Guidelines',
    description: 'Establish code review process and guidelines',
    status: 'review' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: [],
    details: 'Create documentation for code review standards and processes',
    testStrategy: 'Test the guidelines with actual code reviews',
    complexityScore: 2,
    created_at: '2024-01-24T09:00:00Z',
    updated_at: '2024-01-24T14:00:00Z'
  },
  {
    id: '18',
    title: 'Initial UI Mockups',
    description: 'Create wireframes and UI mockups',
    status: 'done' as TaskStatus,
    priority: 'low' as TaskPriority,
    dependencies: ['8'],
    details: 'Design initial wireframes and high-fidelity mockups for key screens',
    testStrategy: 'Review mockups with design team and stakeholders',
    complexityScore: 3,
    created_at: '2024-01-13T10:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  {
    id: '19',
    title: 'Git Workflow Setup',
    description: 'Establish Git branching strategy and workflows',
    status: 'done' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: ['1'],
    details: 'Set up branch protection rules, establish PR templates, and define merge strategies',
    testStrategy: 'Test workflow with sample pull requests',
    complexityScore: 2,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-16T12:00:00Z'
  },
  {
    id: '20',
    title: 'Email Service Integration',
    description: 'Setup email notifications and communication',
    status: 'blocked' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: ['3'],
    details: 'Integrate with SendGrid for transactional emails. Blocked pending account setup.',
    testStrategy: 'Test email delivery across different providers',
    complexityScore: 4,
    created_at: '2024-01-24T16:00:00Z',
    updated_at: '2024-01-24T16:00:00Z'
  },
  {
    id: '21',
    title: 'Multi-language Support',
    description: 'Add internationalization (i18n) support',
    status: 'deferred' as TaskStatus,
    priority: 'low' as TaskPriority,
    dependencies: ['5'],
    details: 'Implement i18n framework and translate UI to multiple languages. Deferred to future release.',
    testStrategy: 'Test language switching and content display in different locales',
    complexityScore: 7,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z'
  },
  {
    id: '22',
    title: 'Setup Monitoring & Logging',
    description: 'Implement application monitoring and centralized logging',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: [],
    details: 'Set up application performance monitoring, error tracking, and centralized logging system',
    testStrategy: 'Verify all critical events are properly logged and monitored',
    complexityScore: 5,
    created_at: '2024-01-25T14:00:00Z',
    updated_at: '2024-01-25T14:00:00Z'
  },
  {
    id: '23',
    title: 'API Documentation',
    description: 'Create comprehensive API documentation',
    status: 'pending' as TaskStatus,
    priority: 'low' as TaskPriority,
    dependencies: ['4'],
    details: 'Generate interactive API documentation using OpenAPI/Swagger',
    testStrategy: 'Validate documentation accuracy by testing all documented endpoints',
    complexityScore: 3,
    created_at: '2024-01-25T15:00:00Z',
    updated_at: '2024-01-25T15:00:00Z'
  },
  {
    id: '24',
    title: 'Advanced Search Features',
    description: 'Implement full-text search and advanced filtering',
    status: 'deferred' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dependencies: ['4'],
    details: 'Add Elasticsearch integration for advanced search capabilities. Deferred due to infrastructure requirements.',
    testStrategy: 'Test search performance with large datasets', 
    complexityScore: 8,
    created_at: '2024-01-25T11:00:00Z',
    updated_at: '2024-01-25T11:00:00Z'
  }
];

// Mutable copy for testing
export let MOCK_TASKS: Task[] = [...ORIGINAL_MOCK_TASKS];

// Helper function to get tasks by status
export function getTasksByStatus(status: TaskStatus): Task[] {
  return MOCK_TASKS.filter(task => task.status === status);
}

// Helper function to get task by ID
export function getTaskById(id: string): Task | undefined {
  return MOCK_TASKS.find(task => task.id === id);
}

// Helper function to simulate async loading
export function simulateAsyncLoad(delay: number = 1000): Promise<Task[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_TASKS]), delay);
  });
}

// Helper function to generate new task ID
export function generateNewTaskId(): string {
  const maxId = Math.max(...MOCK_TASKS.map(task => parseInt(task.id)));
  return (maxId + 1).toString();
}

// Helper function to add task to mock data (for testing)
export function addTaskToMockData(task: Task): void {
  MOCK_TASKS.push(task);
}

// Helper function to update task in mock data (for testing)
export function updateTaskInMockData(taskId: string, updates: Partial<Task>): boolean {
  const taskIndex = MOCK_TASKS.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    MOCK_TASKS[taskIndex] = { ...MOCK_TASKS[taskIndex], ...updates };
    return true;
  }
  return false;
}

// Helper function to delete task from mock data (for testing)
export function deleteTaskFromMockData(taskId: string): boolean {
  const taskIndex = MOCK_TASKS.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    MOCK_TASKS.splice(taskIndex, 1);
    return true;
  }
  return false;
}

// Helper function to reset mock data to original state
export function resetMockData(): void {
  MOCK_TASKS.length = 0;
  MOCK_TASKS.push(...ORIGINAL_MOCK_TASKS.map(task => ({ ...task })));
} 