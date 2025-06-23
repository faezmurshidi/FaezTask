# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Faez PM is a personal software project management desktop application built with Electron + Next.js. It serves as an intelligent companion for solo developers, providing unified task management, time tracking, and AI-powered documentation assistance. The application integrates with the task-master CLI system for project and task management.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server (port 3000)
- `npm run electron-dev` - Start both Next.js dev server and Electron app concurrently
- `npm run electron-dev-only` - Start Electron app in development mode only
- `npm run build` - Build Next.js app for production (outputs to `out/` directory)
- `npm run electron` - Run Electron app with production build
- `npm run dist` - Build and package the complete Electron application

### Code Quality & Tools
- `npm run lint` - Run ESLint on the codebase
- `npm run start` - Start Electron Forge development server
- `npm run package` - Package application using Electron Forge
- `npm run make` - Create distributable packages using Electron Forge

### Task Management Integration
The application includes an integrated terminal with Task-Master CLI support. Use these commands for project management:

#### Core Task Commands
- `tm list` - List all tasks in current project
- `tm next` - Get next recommended task to work on
- `tm show <id>` - Display detailed task information
- `tm set-status --id=<id> --status=<status>` - Update task status (pending/in-progress/done)

#### Project Setup
- `tm init` - Initialize new Task-Master project
- `tm models --setup` - Configure AI models (first time setup)
- `tm parse-prd --input=<file>` - Generate tasks from PRD document

#### Advanced Features
- `tm expand --id=<id>` - Break down complex tasks into subtasks
- `tm research "<query>"` - AI-powered research with project context
- `tm add-task --prompt="<description>"` - Add new tasks using AI assistance

#### Status Management
- `pending` - Task not yet started
- `in-progress` - Currently working on task
- `done` - Task completed
- `review` - Task ready for review
- `deferred` - Task postponed
- `cancelled` - Task cancelled

Use `tm -h` for complete command reference. The integrated terminal automatically syncs with your current project directory.

## Architecture Overview

### Hybrid Desktop Application Stack
- **Frontend**: Next.js 15 with React 18, TypeScript, and Tailwind CSS
- **Desktop Shell**: Electron 32 with secure IPC communication and context isolation
- **State Management**: React Context (TabContext, KanbanContext) + Zustand for task state
- **Data Layer**: Custom electronAPI abstraction layer with fallbacks for web development
- **File Operations**: Node.js fs module through Electron main process with full document conversion support
- **Git Integration**: simple-git library with comprehensive branch management and commit analysis
- **Terminal Integration**: xterm.js + node-pty for true pseudo-terminal functionality
- **Project Management**: Deep integration with task-master CLI system and real-time file watching

### Key Architectural Patterns

#### Electron IPC Architecture
The app uses a secure main/renderer process pattern with context isolation:
- **Main Process** (`public/electron.js`): Comprehensive IPC handlers for file operations, git commands, terminal management, task-master CLI integration, GitHub CLI operations, and document conversion
- **Preload Script** (`public/preload.js`): Secure API exposure through `window.electronAPI` with context isolation enabled
- **Renderer Abstraction** (`src/lib/electronAPI.ts`): Type-safe wrapper with Electron detection and graceful fallbacks for web development

#### Multi-Project Tab System
The application uses a sophisticated tab management system:
- **TabContext** (`src/contexts/TabContext.tsx`): React Context managing multiple project tabs
- **TabBar Component**: Renders tab interface with open/close functionality
- **Content Router**: Routes different views (Dashboard, Project Details) based on active tab

#### Data Layer Architecture
- **Service Layer** (`src/lib/projectService.ts`): Abstracts data operations with Electron/mock fallbacks
- **State Management**: Zustand stores (`src/stores/taskStore.ts`) for complex state, React Context for UI state
- **Type Safety**: Comprehensive TypeScript interfaces in `src/types/index.ts` including Project, Task, GitStatus, CommitAnalysis, and TaskCorrelation types
- **Real-time Updates**: Chokidar file watching for automatic task synchronization with file system changes

#### Component Architecture
- **Layout Component**: Main application shell with sidebar navigation and tab management
- **Project Components**: ProjectList (grid view), ProjectDetails (comprehensive project view)
- **Responsive Design**: Tailwind CSS with mobile-first approach

### Development Workflow Integration

#### Task-Master CLI Integration
The application is built to integrate with the task-master CLI system:
- Project data stored in `.taskmaster/` directories
- Task definitions in `.taskmaster/tasks/tasks.json`
- Progress tracking through task-master commands
- PRD processing for automated project setup

#### Advanced Integration Systems

**Terminal Integration**:
- **Multi-terminal Support**: Map-based terminal management with unique IDs
- **Cross-platform Shell Detection**: Automatic shell selection (zsh/bash/powershell)
- **True PTY**: Node-pty with proper terminal emulation and color support
- **Real-time Communication**: Bidirectional data flow through IPC events
- **Lifecycle Management**: Proper cleanup and resource management

**Task-Master CLI Integration**:
- **Real-time File Watching**: Chokidar monitoring of `.taskmaster/tasks/tasks.json`
- **Command Execution**: Direct CLI command execution with both global and npx fallbacks
- **Optimistic Updates**: UI updates immediately with rollback on failure
- **Status Synchronization**: Bidirectional sync between UI and CLI state

**GitHub CLI Integration**:
- **Authentication Management**: Status checking and auth flow guidance
- **Repository Operations**: Creation, info retrieval, and name availability checking
- **Command Abstraction**: Type-safe wrappers around gh CLI commands

**Document Processing**:
- **Multi-format Support**: PDF, DOCX, TXT conversion to Markdown using MarkItDown
- **PRD Processing**: Automated project setup from Product Requirements Documents
- **File Validation**: Extension checking and format verification

#### File System Organization
```
src/
├── app/                    # Next.js app router pages
│   ├── kanban/            # Kanban board page
│   ├── terminal/          # Terminal page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Board/             # Kanban board components
│   ├── Terminal/          # Terminal components (FocusTerminal, ImprovedTerminal, etc.)
│   ├── Dashboard/         # Dashboard widgets and components
│   └── *.tsx              # Other UI components (Layout, ProjectList, TaskCard, etc.)
├── contexts/              # React Context providers
│   ├── TabContext.tsx     # Multi-tab interface management
│   └── KanbanContext.tsx  # Kanban board state management
├── lib/                   # Utility libraries and services
│   ├── electronAPI.ts     # Electron IPC abstraction layer
│   ├── projectService.ts  # Project data operations
│   ├── gitService.ts      # Git operations wrapper
│   └── taskCorrelationService.ts  # Task-commit correlation logic
├── stores/                # State management
│   └── taskStore.ts       # Zustand task state store
├── types/                 # TypeScript type definitions
│   ├── index.ts           # Main application types
│   ├── electron.ts        # Electron API types
│   └── kanban.ts          # Kanban-specific types
└── utils/                 # Utility functions
    └── mockTasks.ts       # Development mock data

public/
├── electron.js            # Electron main process (2300+ lines of IPC handlers)
├── preload.js            # Secure IPC bridge
└── documentConverter.js   # Document conversion utilities
```

## Current Development Status

The application is in MVP development phase with comprehensive project management functionality:
- ✅ Electron-Next.js foundation with secure IPC and context isolation
- ✅ Multi-project tab interface with advanced state management
- ✅ Project list and detail views with git integration
- ✅ Real-time task management with file watching and CLI integration
- ✅ Multi-terminal support with true PTY functionality
- ✅ Document upload and conversion (PDF, DOCX, TXT → Markdown)
- ✅ Git operations including branch management and commit analysis
- ✅ GitHub CLI integration with repository creation and management
- ✅ PRD upload and processing with automated project setup
- ✅ Drag-and-drop Kanban board with optimistic updates
- 🏗️ Knowledge base and document indexing (in development)

Use `tm next` in the integrated terminal to see the current recommended task for development priorities.