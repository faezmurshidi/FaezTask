# API Reference

## Task Master CLI Commands

### Basic Commands

- `task-master list` - List all tasks
- `task-master next` - Get next task to work on
- `task-master show <id>` - Show task details
- `task-master set-status --id=<id> --status=done` - Mark task as done

### Advanced Commands

- `task-master expand --id=<id>` - Break down complex task
- `task-master update --from=<id> --prompt="..."` - Update multiple tasks
- `task-master research "query"` - AI-powered research

## Electron API

### File Operations
- `electronAPI.readFile(path)` - Read file content
- `electronAPI.writeFile(path, content)` - Write file
- `electronAPI.pathExists(path)` - Check if path exists

### Git Operations
- `electronAPI.gitStatus(repoPath)` - Get git status
- `electronAPI.gitCommit(repoPath, message)` - Commit changes
- `electronAPI.gitPush(repoPath, remote, branch)` - Push changes

## Project Structure

```
src/
  components/
    - Layout.tsx (Main app layout)
    - Focus.tsx (Focus view)
    - KnowledgeBase.tsx (Knowledge base)
    - GitView.tsx (Git operations)
  lib/
    - electronAPI.ts (Electron bridge)
    - gitService.ts (Git utilities)
``` 