# Faez Project Master (FPM)

## Task Master + Claude + Git + AI - All in One Desktop App

A modern desktop project management application built specifically for solo software developers. Seamlessly integrates with Task Master AI for intelligent project management, featuring built-in terminal, git operations, and comprehensive document management.

## 🚀 Features

### ✅ **Fully Implemented & Production Ready**

- **📁 Multi-Project Management**: Create and manage multiple software projects with tabbed interface and persistent project storage
- **🎯 Smart Project Creation**: Two-way project setup - create new projects or add existing folders (with automatic Task Master initialization)
- **📋 PRD Upload & AI Processing**: Upload Product Requirements Documents and automatically generate comprehensive task breakdowns using Task Master AI
- **📊 Advanced Kanban Board**: Drag-and-drop task management with real-time file system synchronization
- **🔗 Complete Task Master Integration**: Full compatibility with Task Master CLI, VS Code extension, and file formats
- **💻 Integrated Terminal**: Built-in terminal with command execution, file system access, and project context awareness
- **🔧 Comprehensive Git Integration**: Repository initialization, status tracking, commit/push/pull operations, GitHub CLI integration, and commit-task correlation
- **📚 Knowledge Base System**: Complete document management with markdown rendering, file conversion (DOCX, PDF, TXT), search capabilities, and drag-and-drop uploads
- **📱 Responsive Dashboard**: Modern interface with today's tasks, progress tracking, git activity, and time tracking widgets
- **🖥️ Native Desktop App**: Packaged Electron application with native menus, keyboard shortcuts, and system integration
- **🎨 Modern UI/UX**: Built with Next.js, Tailwind CSS, and comprehensive error handling with toast notifications

### 🚧 **In Active Development**

- **🤖 AI Chat Assistant**: Context-aware AI chat for task refinement and technical questions
- **⏱️ Advanced Time Tracking**: Enhanced time tracking with Pomodoro timer integration and detailed analytics
- **📅 Calendar & Scheduling**: Project timeline management and deadline visualization
- **🔄 Real-time Collaboration**: Multi-user project sharing and real-time updates

### 📋 **Planned Features**

- **📊 Advanced Analytics**: Comprehensive reporting and productivity insights
- **🌐 Cloud Sync**: Optional cloud synchronization for cross-device access
- **🔌 Plugin System**: Extensible architecture for custom integrations
- **📱 Mobile Companion**: Mobile app for task updates and notifications

## 🏗️ Architecture

**Core Technology Stack:**
- **Frontend**: Next.js 14+ with App Router (React 18+)
- **Desktop Framework**: Electron with Forge packaging
- **Task Management**: Task Master AI CLI integration
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React Context + useReducer + SWR
- **Git Operations**: simple-git library with GitHub CLI
- **Terminal**: xterm.js with Node.js child_process
- **Document Processing**: Mammoth (DOCX), pdf-parse (PDF), turndown (HTML→MD)
- **UI Components**: Custom components with react-markdown, react-dropzone

**System Architecture:**
```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Electron App      │────│   Task Master    │────│   File System  │
│   (Next.js 14 UI)   │    │   AI CLI/API     │    │   (.taskmaster) │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
         │                           │                       │
         ▼                           ▼                       ▼
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Git Integration     │    │ Terminal         │    │ Project Files   │
│ (simple-git + gh)   │    │ (xterm.js)       │    │ & Directories   │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
         │                           │                       │
         ▼                           ▼                       ▼
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Knowledge Base      │    │ Document Convert │    │ AI Integration  │
│ (Markdown + Search) │    │ (Multi-format)   │    │ (Task Master)   │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js 18+** and npm
- **Task Master AI CLI**: `npm install -g task-master-ai`
- **Git** (for repository management)
- **GitHub CLI** (optional, for GitHub integration): `brew install gh`

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
   
   Create `.cursor/mcp.json` and add your API keys:
   ```json
   {
     "mcpServers": {
       "task-master-ai": {
         "command": "npx",
         "args": ["task-master-ai", "mcp"],
         "env": {
           "ANTHROPIC_API_KEY": "your_anthropic_key_here",
           "OPENAI_API_KEY": "your_openai_key_here",
           "PERPLEXITY_API_KEY": "your_perplexity_key_here"
         }
       }
     }
   }
   ```
   
   ⚠️ **Important**: The `mcp.json` file is gitignored to prevent accidental exposure of API keys.

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Launch Electron app:**
   ```bash
   npm run electron-dev
   ```

6. **Build production app:**
   ```bash
   npm run make
   ```

## 🎯 Getting Started

### Creating Your First Project

1. **Launch Faez PM** - The app opens with a welcome screen for first-time users
2. **Choose Project Type**:
   - **New Project**: Create from scratch with Task Master initialization
   - **Existing Project**: Add any folder (we'll set up Task Master if needed)
3. **Upload a PRD** (optional): Upload Product Requirements Document for automatic task generation
4. **Watch the Magic**: Faez automatically:
   - Creates/validates project directory structure
   - Initializes Task Master configuration
   - Generates intelligent task breakdown from your PRD
   - Sets up git repository with proper .gitignore
   - Creates knowledge base with sample documents

### Managing Tasks with the Kanban Board

1. **View Tasks**: Navigate to the "Tasks" tab to see your intelligent Kanban board
2. **Drag & Drop**: Move tasks between columns (Pending → In Progress → Review → Done)
3. **Task Details**: Click any task card to view comprehensive information and subtasks
4. **Real-time Sync**: All changes automatically sync with `.taskmaster/tasks.json`
5. **Dependencies**: Visual indicators show task dependencies and completion status

### Using the Integrated Terminal

1. **Access Terminal**: Click the terminal icon in the tab bar
2. **Project Context**: Terminal automatically starts in your current project directory
3. **Execute Commands**: Run git operations, Task Master commands, file management, etc.
4. **Smart Integration**: Terminal output integrates with git status and project updates

### Git Integration & GitHub

1. **Initialize Repository**: Use the "Connect Git" button on project cards
2. **Real-time Status**: See file changes, branch information, and commit status
3. **Commit Workflow**: Stage files and commit with messages directly from the UI
4. **GitHub Integration**: Create repositories, push/pull, and track remote status
5. **Commit Analysis**: Automatic correlation between commits and project tasks

### Knowledge Base & Document Management

1. **Access Documents**: Navigate to the "Knowledge" tab
2. **Upload Documents**: Drag-and-drop files (MD, DOCX, PDF, TXT) for automatic conversion
3. **Search & Browse**: Full-text search across all documents and organized navigation
4. **Document Operations**: Rename, delete, and organize documents with full file management
5. **Markdown Rendering**: Rich markdown display with syntax highlighting and link handling

## 📁 Project Structure

```
FaezPM/
├── src/
│   ├── app/                     # Next.js app router
│   ├── components/              # React components
│   │   ├── Board/              # Kanban board system
│   │   ├── Dashboard/          # Dashboard widgets
│   │   ├── Terminal/           # Terminal integration
│   │   ├── ProjectCreator.tsx  # Project creation workflow
│   │   ├── KnowledgeBase.tsx   # Document management
│   │   ├── DocumentUpload.tsx  # File upload system
│   │   ├── Toast.tsx          # Notification system
│   │   └── ...                # Other UI components
│   ├── contexts/               # React contexts for state
│   ├── lib/                    # Services and utilities
│   │   ├── electronAPI.ts     # Electron IPC wrapper
│   │   ├── gitService.ts      # Git operations
│   │   ├── projectService.ts  # Project management
│   │   └── taskCorrelationService.ts # Task-commit correlation
│   ├── stores/                 # State management
│   ├── types/                  # TypeScript definitions
│   └── utils/                  # Helper functions
├── public/
│   ├── electron.js             # Electron main process
│   ├── preload.js             # Electron preload script
│   └── documentConverter.js   # Document conversion service
├── .taskmaster/                # Task Master configuration
│   ├── tasks/                 # Generated task files
│   ├── docs/                  # Knowledge base documents
│   └── config.json           # Task Master settings
└── forge.config.js            # Electron Forge configuration
```

## 🔧 Key Features in Detail

### Intelligent Project Setup

**Two-Way Project Creation:**
- **New Projects**: AI-powered setup with PRD analysis and task generation
- **Existing Projects**: Smart detection and Task Master initialization for any folder
- **Automatic Structure**: Creates organized directory structure with proper .gitignore
- **Dependency Analysis**: Identifies task dependencies and prerequisites automatically

### Advanced Task Management

**Kanban Board with Intelligence:**
- **Visual Dependencies**: Clear indicators for task relationships and blocking dependencies
- **Real-time Sync**: File system integration ensures data consistency
- **Subtask Support**: Hierarchical task breakdown with progress tracking
- **Status Management**: Comprehensive status tracking (pending, in-progress, review, done, etc.)

### Comprehensive Git Integration

**Professional Git Workflow:**
- **Repository Management**: Initialize, clone, and manage repositories
- **Visual Status**: Real-time file status, branch tracking, and remote synchronization
- **Commit Correlation**: Automatic linking between commits and project tasks
- **GitHub Integration**: Repository creation, issue tracking, and collaboration features

### Knowledge Base System

**Document Management Excellence:**
- **Multi-format Support**: Automatic conversion of DOCX, PDF, TXT to Markdown
- **Full-text Search**: Search across document names and content
- **Rich Rendering**: GitHub-flavored markdown with syntax highlighting
- **File Operations**: Complete CRUD operations with drag-and-drop interface

### Native Desktop Experience

**Electron-powered Application:**
- **Native Menus**: Standard application menus with keyboard shortcuts
- **System Integration**: File system access and proper desktop app behavior
- **Cross-platform**: Runs on macOS, Windows, and Linux
- **Offline-first**: All data stored locally with optional cloud sync

## 🚦 Development Status

### Phase 1: Core Foundation ✅ **COMPLETE**
- ✅ Multi-project management with persistent storage
- ✅ Task Master AI integration and CLI compatibility
- ✅ Kanban board with drag-and-drop functionality
- ✅ PRD upload and intelligent task generation
- ✅ Comprehensive git integration with GitHub support
- ✅ Integrated terminal with project context
- ✅ Knowledge base with document conversion
- ✅ Native desktop app with proper packaging

### Phase 2: AI Enhancement 🚧 **IN PROGRESS** (47.8% Complete)
- 🚧 AI chat interface for task refinement
- 🚧 Enhanced time tracking with analytics
- ⏸️ Calendar integration with timeline visualization
- ⏸️ Advanced reporting and productivity insights

### Phase 3: Advanced Features 📋 **PLANNED**
- 📋 Real-time collaboration and team features
- 📋 Cloud synchronization and cross-device access
- 📋 Plugin system for extensibility
- 📋 Mobile companion application
- 📋 Advanced analytics and machine learning insights

## 🎯 Project Statistics

**Current Implementation:**
- **11 Major Features** completed and production-ready
- **59 Subtasks** implemented with comprehensive testing
- **47.8% Overall Completion** of planned feature set
- **Native Desktop App** with professional packaging
- **Full Task Master Compatibility** with CLI and VS Code extension

## 🤝 Contributing

This project is designed for solo software developers but welcomes contributions:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Task Master AI](https://github.com/task-master-ai)**: For the excellent task management CLI and intelligent project analysis
- **[Electron](https://electronjs.org/)**: For enabling cross-platform desktop development
- **[Next.js](https://nextjs.org/)**: For the powerful React framework and development experience
- **[xterm.js](https://xtermjs.org/)**: For the excellent terminal emulation
- **[simple-git](https://github.com/steveukx/git-js)**: For comprehensive git integration
- **[Tailwind CSS](https://tailwindcss.com/)**: For the utility-first CSS framework

---

**Faez Project Master** - Elevating solo software development through intelligent project management, comprehensive tooling, and seamless workflow integration. 🚀

*Built with ❤️ for developers who value efficiency, organization, and intelligent automation.* 