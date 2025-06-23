# Faez Project Master (FPM)

## Task-master + claude code + git all in one app.

A modern desktop project management application built specifically for solo software developers. Use your existing task-master with built-in terminal made solely for Claude Code.

## 🚀 Features

### ✅ Currently Implemented

- **📁 Project Management**: Create and manage multiple software projects with tabbed interface
- **📋 PRD Upload & Processing**: Upload Product Requirements Documents and automatically generate task breakdowns using Task Master AI
- **📊 Kanban Task Board**: Drag-and-drop task management with real-time updates
- **🔄 Task Master Integration**: Full compatibility with Task Master CLI and VS Code extension
- **💻 Integrated Terminal**: Built-in terminal with command execution and file system access
- **🔧 Git Integration**: Repository initialization, status tracking, commit/push/pull operations
- **📱 Responsive UI**: Modern interface built with Next.js and Tailwind CSS

### 🚧 In Development

- **🤖 AI Chat Assistant**: Context-aware AI chat for task refinement and technical questions
- **⏱️ Time Tracking**: Manual time tracking with Pomodoro timer integration
- **📅 Calendar & Scheduling**: Project timeline management and deadline visualization
- **📚 Knowledge Base**: Document indexing and semantic search capabilities

## 🏗️ Architecture

**Core Technology Stack:**
- **Frontend**: Next.js 13+ (React-based UI)
- **Desktop Framework**: Electron
- **Task Management**: Task Master CLI integration
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Git Operations**: simple-git library
- **Terminal**: xterm.js with Node.js child_process

**System Architecture:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Electron App  │────│   Task Master    │────│   File System  │
│   (Next.js UI)  │    │   CLI/API        │    │   (.taskmaster) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Git Integration │    │ Terminal         │    │ Project Files   │
│ (simple-git)    │    │ (xterm.js)       │    │ & Directories   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Task Master CLI (`npm install -g task-master-ai`)
- Git (for repository management)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FaezPM
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up API keys (for AI features):**
   ```bash
   cp .cursor/mcp.json.example .cursor/mcp.json
   ```
   
   Edit `.cursor/mcp.json` and add your API keys:
   - `ANTHROPIC_API_KEY`: Your Anthropic Claude API key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PERPLEXITY_API_KEY`: Your Perplexity API key

   ⚠️ **Important**: The `mcp.json` file is gitignored to prevent accidental exposure of API keys.

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Launch Electron app:**
   ```bash
   npm run electron-dev
   ```

## 🎯 Getting Started

### Creating Your First Project

1. **Launch Faez** and click "New Project"
2. **Upload a PRD** (Product Requirements Document) in Markdown format
3. **Enter project name** and click "Create Project"
4. **Watch the magic happen** as Faez automatically:
   - Creates project directory structure
   - Initializes Task Master configuration
   - Generates task breakdown from your PRD
   - Sets up git repository (optional)

### Managing Tasks

1. **View Tasks**: Switch to the "Tasks" tab to see your Kanban board
2. **Drag & Drop**: Move tasks between columns (Pending → In Progress → Review → Done)
3. **Task Details**: Click any task card to view detailed information
4. **Real-time Sync**: All changes automatically sync with your local `.taskmaster/tasks.json`

### Using the Terminal

1. **Open Terminal**: Click the terminal icon in the tab bar
2. **Execute Commands**: Use the integrated terminal for git operations, file management, etc.
3. **Project Context**: Terminal automatically starts in your current project directory

### Git Integration

1. **Initialize Repository**: Use the "Connect Git" button on project cards
2. **View Status**: See file changes and branch information in the Git panel
3. **Commit Changes**: Stage files and commit with messages directly from the UI
4. **Push/Pull**: Sync with remote repositories using the built-in git operations

## 📁 Project Structure

```
FaezPM/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── components/          # React components
│   │   │   ├── Board/          # Kanban board components
│   │   │   ├── Terminal/       # Terminal components
│   │   │   └── ...             # Other UI components
│   │   ├── contexts/           # React contexts for state management
│   │   ├── lib/                # Utility libraries and services
│   │   ├── stores/             # State management
│   │   └── types/              # TypeScript type definitions
│   ├── public/
│   │   ├── electron.js         # Electron main process
│   │   └── preload.js          # Electron preload script
│   └── .taskmaster/            # Task Master configuration
│       ├── tasks/              # Generated task files
│       └── docs/               # Project documentation
```

## 🔧 Key Features in Detail

### Task Master Integration

Faez provides seamless integration with the Task Master ecosystem:
- **File Compatibility**: Reads/writes standard `.taskmaster/tasks.json` format
- **CLI Integration**: Execute Task Master commands directly from the UI
- **VS Code Sync**: Share task data with the Task Master VS Code extension
- **Real-time Updates**: File watching ensures UI stays synchronized

### Intelligent Project Setup

The PRD upload feature provides intelligent project bootstrapping:
- **Automatic Task Generation**: AI analyzes your PRD and creates detailed task breakdowns
- **Directory Structure**: Creates organized project folder structure
- **Git Integration**: Optional repository initialization with proper .gitignore
- **Dependency Management**: Identifies task dependencies and prerequisites

### Modern Development Workflow

Faez enhances your development workflow with:
- **Unified Interface**: Manage multiple projects in a single application
- **Visual Task Management**: Kanban boards for intuitive progress tracking
- **Integrated Tools**: Terminal and git operations without leaving the app
- **Local-First**: All data stored locally with optional cloud sync

## 🚦 Current Status

### Phase 1: Core MVP ✅ COMPLETE
- ✅ Project creation and management
- ✅ Basic task management (CRUD operations)  
- ✅ Task Master CLI integration
- ✅ Kanban board interface
- ✅ PRD upload and processing
- ✅ Git integration
- ✅ Integrated terminal

### Phase 2: AI Enhancement 🚧 IN PROGRESS
- 🚧 AI chat interface (in development)
- 🚧 RAG integration with project documents
- ⏸️ Time tracking features (planned)
- ⏸️ Calendar integration (planned)

### Phase 3: Advanced Features 📋 PLANNED
- 📋 Advanced reporting and analytics
- 📋 GitHub integration enhancements
- 📋 Performance optimizations
- 📋 Multi-project scheduling

## 🤝 Contributing

This is currently a personal project focused on solo development workflows. However, contributions and feedback are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Task Master**: For the excellent task management CLI and VS Code extension
- **Electron**: For enabling cross-platform desktop development
- **Next.js**: For the powerful React framework
- **xterm.js**: For the excellent terminal emulation
- **simple-git**: For the comprehensive git integration

---

**Faez** - Elevating solo software development through intelligent project management. 