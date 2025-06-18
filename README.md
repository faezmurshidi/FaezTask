# FaezPM - Project Management Tool

A modern project management application built with Next.js and Electron, featuring git integration and task management.

## Security Setup

### MCP Configuration
This project uses MCP (Model Context Protocol) for AI integration. You need to set up your API keys:

1. Copy the template file:
   ```bash
   cp .cursor/mcp.json.example .cursor/mcp.json
   ```

2. Edit `.cursor/mcp.json` and replace the placeholder values with your actual API keys:
   - `ANTHROPIC_API_KEY`: Your Anthropic Claude API key
   - `OPENAI_API_KEY`: Your OpenAI API key  
   - `PERPLEXITY_API_KEY`: Your Perplexity API key
   - Other API keys as needed

⚠️ **Important**: The `mcp.json` file is gitignored to prevent accidental exposure of API keys. Never commit this file to version control.

## Features

- Git integration with comprehensive error handling
- Task management with Taskmaster integration
- Modern UI with drag-and-drop kanban boards
- Terminal integration
- Project management and tracking

## Development

```bash
npm install
npm run dev
```

## Git Integration

The application includes comprehensive git integration that handles:
- Push with missing upstream branches
- Pull with conflicting remote changes  
- Pull with no tracking information
- Pull with divergent branches (merge/rebase/fast-forward options)

All git operations provide user-friendly error messages and actionable solutions. 