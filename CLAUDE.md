# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Faez PM is a personal software project management desktop application built with Electron + Next.js. It serves as an intelligent companion for solo developers, providing unified task management, time tracking, and AI-powered documentation assistance. The application integrates with the task-master CLI system for project and task management.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server (port 3000)
- `npm run electron-dev` - Start both Next.js dev server and Electron app concurrently
- `npm run build` - Build Next.js app for production (outputs to `out/` directory)
- `npm run electron` - Run Electron app with production build
- `npm run dist` - Build and package the complete Electron application

### Code Quality
- `npm run lint` - Run ESLint on the codebase
- `npm run start` - Start Next.js production server

### Task Management Integration
- `task-master list --status=pending` - List pending tasks
- `task-master next` - Get next recommended task to work on
- `task-master set-status --id=X --status=Y` - Update task status (pending/in-progress/done)

## Architecture Overview

### Hybrid Desktop Application Stack
- **Frontend**: Next.js 15 with React 18, TypeScript, and Tailwind CSS
- **Desktop Shell**: Electron 32 with secure IPC communication
- **Data Fetching**: SWR for caching and state management
- **File Operations**: Node.js fs module through Electron main process
- **Project Management**: Integration with task-master CLI system

### Key Architectural Patterns

#### Electron IPC Architecture
The app uses a secure main/renderer process pattern:
- **Main Process** (`public/electron.js`): Handles file system operations, project management, and system integration
- **Preload Script** (`public/preload.js`): Exposes secure APIs to renderer through `window.electronAPI`
- **Renderer Process**: Next.js app with `electronAPI` abstraction layer (`src/lib/electronAPI.ts`)

#### Multi-Project Tab System
The application uses a sophisticated tab management system:
- **TabContext** (`src/contexts/TabContext.tsx`): React Context managing multiple project tabs
- **TabBar Component**: Renders tab interface with open/close functionality
- **Content Router**: Routes different views (Dashboard, Project Details) based on active tab

#### Data Layer Architecture
- **Service Layer** (`src/lib/projectService.ts`): Abstracts data operations with Electron/mock fallbacks
- **SWR Integration**: Handles caching, revalidation, and loading states
- **Type Safety**: Comprehensive TypeScript interfaces in `src/types/index.ts`

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

#### File System Organization
```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── contexts/           # React Context providers
├── lib/                # Utility libraries and services
└── types/              # TypeScript type definitions
```

## Current Development Status

The application is in MVP development phase with core project management functionality implemented:
- ✅ Electron-Next.js foundation with secure IPC
- ✅ Multi-project tab interface
- ✅ Project list and detail views
- ✅ SWR data fetching with Electron API integration
- 🏗️ PRD upload and processing (currently in progress)

Use `task-master next` to see the current recommended task for development priorities.