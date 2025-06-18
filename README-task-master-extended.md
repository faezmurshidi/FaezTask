# Task Master Extended - Priority Filtering Wrapper

This is a local wrapper for the `task-master` CLI that adds priority filtering functionality to the `list` command while maintaining full compatibility with all existing task-master features.

## Features

- ✅ **Priority Filtering**: Filter tasks by priority (high, medium, low)
- ✅ **Multiple Priority Support**: Filter by multiple priorities (e.g., "high,medium")
- ✅ **Combined Filtering**: Use priority and status filters together
- ✅ **Tag Support**: Works with task-master's tag system
- ✅ **Pass-through**: All other commands are passed through to the original task-master
- ✅ **Colored Output**: Beautiful, colored output with clear formatting

## Installation

1. **Dependencies**: Make sure you have the required packages installed:
   ```bash
   npm install chalk@4.1.2 commander
   ```

2. **Setup Alias** (Optional but recommended):
   ```bash
   ./setup-task-master-alias.sh
   source ~/.zshrc  # or ~/.bashrc
   ```
   
   This creates a convenient `tm` alias that provides both regular task-master functionality and priority filtering.

## Usage

### Using the alias (recommended):

**Enhanced task-master (`tm`) - handles both regular and priority filtering:**
```bash
# Regular task-master commands (pass-through)
tm list                              # Full dashboard view
tm next                              # Next recommended task
tm show 4                            # View task details
tm set-status --id=5 --status=done   # Update task status
tm expand --id=3                     # Expand task into subtasks

# Priority filtering (new functionality)
tm list --priority high              # High priority tasks only
tm list --priority medium            # Medium priority tasks only
tm list --priority low               # Low priority tasks only

# Multiple priority filtering
tm list --priority "high,medium"     # High and medium priorities
tm list --priority "medium,low"      # Medium and low priorities

# Combined priority and status filtering
tm list --priority high --status pending    # High priority pending tasks
tm list --priority medium --status done     # Medium priority completed tasks
```

### Using the script directly:
```bash
# Regular commands
node task-master-extended.js list
node task-master-extended.js next

# Priority filtering
node task-master-extended.js list --priority high

# Combined filtering
node task-master-extended.js list --priority high --status pending
```

## Examples

### High Priority Tasks Only
```bash
tm list --priority high
```
Output:
```
📋 Filtered Task List
🏷️  Tag: master
🎯 Priority filter: high
────────────────────────────────────────────────────────────────────────────────
  1 │ high     │ done         │ Setup Electron and Next.js Project Structure
  4 │ high     │ in-progress  │ Implement PRD Upload and Processing
  5 │ high     │ pending      │ Develop Task Management Interface
────────────────────────────────────────────────────────────────────────────────
✅ Found 3 matching tasks
```

### High Priority Pending Tasks
```bash
tm list --priority high --status pending
```

### Multiple Priorities
```bash
tm list --priority "high,medium"
```

## How It Works

1. **Priority Filtering**: When you use the `--priority` flag, the wrapper:
   - Reads your tasks.json file directly
   - Handles the tagged task structure (master, feature branches, etc.)
   - Filters tasks by the specified priority levels
   - Displays results in a clean, formatted table

2. **Pass-through**: When you don't use `--priority`, the wrapper:
   - Passes all arguments directly to the original `task-master` command
   - Maintains full compatibility with existing workflows

3. **Combined Filtering**: You can combine priority and status filters:
   - Priority filtering is handled by the wrapper
   - Status filtering is also handled by the wrapper
   - Both filters work together seamlessly

## Supported Priority Values

- `high` - High priority tasks
- `medium` - Medium priority tasks  
- `low` - Low priority tasks
- `high,medium` - Multiple priorities (comma-separated)
- `all` - All priorities (equivalent to no filter)

## File Structure

- `task-master-extended.js` - Main wrapper script
- `setup-task-master-alias.sh` - Alias setup script
- `README-task-master-extended.md` - This documentation

## Compatibility

- ✅ Works with task-master-ai v0.17.0+
- ✅ Supports tagged task lists
- ✅ Compatible with all existing task-master commands
- ✅ Works on macOS, Linux, and Windows (with Node.js)

## Troubleshooting

### "Cannot use import statement outside a module"
- The script uses CommonJS (require) to avoid module conflicts
- Make sure you have chalk@4.1.2 installed (not v5+)

### "Invalid tasks file format"
- Ensure you're in a task-master project directory
- Check that `.taskmaster/tasks/tasks.json` exists
- Verify the file contains valid JSON

### Alias not working
- Run `source ~/.zshrc` (or `~/.bashrc`) after setup
- Check that the alias was added: `grep "alias tm=" ~/.zshrc`
- Manually add if needed: `alias tm='node /path/to/task-master-extended.js'`

## Contributing

This is a local wrapper solution. For permanent integration, consider:
1. Forking the original task-master-ai repository
2. Implementing the priority filter in the core codebase
3. Submitting a pull request to the main project

## License

This wrapper follows the same license as the original task-master-ai project. 