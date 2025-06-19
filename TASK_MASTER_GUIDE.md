# Task-Master CLI Integration Guide for Claude Code

This guide helps Claude Code understand and work effectively with the Task-Master CLI system integrated into Faez PM.

## Core Workflow Understanding

### Project Structure
```
.taskmaster/
├── config.json          # AI model configuration
├── docs/                # Project documentation
│   └── prd.md           # Product requirements document
├── tasks/               # Task management
│   └── tasks.json       # Main task definitions
└── history/             # Task history and logs
```

### Task Lifecycle
1. **Creation**: Tasks are created from PRDs using `tm parse-prd` or manually with `tm add-task`
2. **Status Flow**: pending → in-progress → done (or review/deferred/cancelled)
3. **Expansion**: Complex tasks can be broken down using `tm expand --id=<id>`
4. **Dependencies**: Tasks can depend on others using `tm add-dependency`

### Common Command Patterns

#### Daily Workflow
```bash
# Start of day - see what to work on
tm next

# Show detailed task info
tm show <id>

# Mark task as started
tm set-status --id=<id> --status=in-progress

# When task is complete
tm set-status --id=<id> --status=done

# Check overall progress
tm list --status=pending
```

#### Task Management
```bash
# Add a new task with AI assistance
tm add-task --prompt="Implement user authentication system"

# Break down complex tasks
tm expand --id=5 --num=3

# Research help with context
tm research "Best practices for React authentication"

# Update task with new information
tm update-task --id=5 --prompt="Add OAuth integration requirements"
```

#### Project Setup
```bash
# Initialize new project
tm init --name="My Project" --description="Project description"

# Setup AI models (first time)
tm models --setup

# Generate tasks from PRD
tm parse-prd --input=requirements.txt
```

## Integration Points with Faez PM

### Real-time Sync
- Task status changes in terminal reflect immediately in Kanban board
- Project directory context is automatically passed to terminal
- Git integration tracks task completion with commits

### UI Components
- **Focus Tab**: Terminal appears on right side for task management
- **Kanban Board**: Visual representation of tasks from tasks.json
- **Dashboard**: Overview of current project status

### File Watching
- Changes to `.taskmaster/tasks/tasks.json` trigger UI updates
- Terminal commands automatically sync with visual components

## AI-Powered Features

### Task Generation
- Natural language PRD parsing
- Intelligent task breakdown
- Dependency analysis and suggestion

### Research Integration
- Context-aware research queries
- Project file analysis
- Implementation recommendations

### Status Management
- Smart task prioritization
- Dependency validation
- Progress tracking

## Best Practices for Claude Code

1. **Always check current task status** before suggesting work:
   ```bash
   tm list --status=pending
   tm next
   ```

2. **Use task context** when providing coding assistance:
   ```bash
   tm show <current-task-id>
   ```

3. **Update task status** when work is completed:
   ```bash
   tm set-status --id=<id> --status=done
   ```

4. **Break down complex requests** into manageable tasks:
   ```bash
   tm add-task --prompt="User's complex request"
   tm expand --id=<new-task-id>
   ```

5. **Research before implementing** unfamiliar features:
   ```bash
   tm research "Implementation approach for <feature>"
   ```

## Error Handling

### Common Issues
- **No .taskmaster directory**: Run `tm init` to set up project structure
- **No AI models configured**: Run `tm models --setup` for first-time setup
- **Invalid task ID**: Use `tm list` to see available task IDs
- **Dependency conflicts**: Use `tm validate-dependencies` to check

### Recovery Commands
```bash
# Check project status
tm list

# Validate and fix dependencies
tm validate-dependencies
tm fix-dependencies

# Reset to known good state
tm list --with-subtasks
```

This integration makes Claude Code more effective at understanding project context and providing relevant assistance within the Task-Master workflow.