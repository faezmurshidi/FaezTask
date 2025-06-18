#!/usr/bin/env node

const { spawn } = require('child_process');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const program = new Command();

// Helper function to find project root (similar to task-master's logic)
function findProjectRoot() {
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, '.taskmaster'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

// Helper function to get current tag (simplified version)
function getCurrentTag(projectRoot) {
  try {
    const statePath = path.join(projectRoot, '.taskmaster', 'state.json');
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return state.currentTag || 'master';
    }
  } catch (error) {
    // Ignore errors and fall back to master
  }
  return 'master';
}

// Helper function to read and filter tasks
function filterTasksByPriority(tasksData, priorityFilter, tag = 'master') {
  // Handle the tagged structure
  const tagData = tasksData[tag];
  if (!tagData || !tagData.tasks) {
    return [];
  }

  if (!priorityFilter || priorityFilter.toLowerCase() === 'all') {
    return tagData.tasks;
  }

  const allowedPriorities = priorityFilter
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0);

  return tagData.tasks.filter(
    (task) => task.priority && allowedPriorities.includes(task.priority.toLowerCase())
  );
}

// Helper function to display filtered tasks
function displayFilteredTasks(tasks, priorityFilter, statusFilter, tag) {
  if (tasks.length === 0) {
    console.log(chalk.yellow('No tasks found matching the specified criteria.'));
    return;
  }

  console.log(chalk.blue('\n📋 Filtered Task List'));
  console.log(chalk.blue(`🏷️  Tag: ${tag}`));
  if (priorityFilter) {
    console.log(chalk.blue(`🎯 Priority filter: ${priorityFilter}`));
  }
  if (statusFilter) {
    console.log(chalk.blue(`📊 Status filter: ${statusFilter}`));
  }
  console.log(chalk.gray('─'.repeat(80)));

  tasks.forEach((task, index) => {
    const priorityColor = {
      high: chalk.red.bold,
      medium: chalk.yellow,
      low: chalk.gray
    }[task.priority?.toLowerCase()] || chalk.white;

    const statusColor = {
      done: chalk.green,
      'in-progress': chalk.blue,
      pending: chalk.yellow,
      blocked: chalk.red,
      deferred: chalk.gray,
      cancelled: chalk.strikethrough
    }[task.status?.toLowerCase()] || chalk.white;

    console.log(
      `${chalk.cyan(task.id.toString().padStart(3))} │ ` +
      `${priorityColor(task.priority?.padEnd(8) || 'none'.padEnd(8))} │ ` +
      `${statusColor(task.status?.padEnd(12) || 'pending'.padEnd(12))} │ ` +
      `${task.title}`
    );

    if (task.description) {
      console.log(`    │ ${chalk.gray(task.description)}`);
    }

    if (index < tasks.length - 1) {
      console.log(chalk.gray('    │'));
    }
  });

  console.log(chalk.gray('─'.repeat(80)));
  console.log(chalk.green(`✅ Found ${tasks.length} matching tasks`));
}

// Extended list command with priority filtering
program
  .command('list')
  .description('List all tasks with extended filtering options')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --priority <priority>', 'Filter by priority (high, medium, low)')
  .option('--with-subtasks', 'Show subtasks for each task')
  .option('--tag <tag>', 'Specify tag context')
  .option('-f, --file <file>', 'Path to tasks file')
  .action(async (options) => {
    try {
      // If no priority filtering is requested, use original command
      if (!options.priority) {
        const args = ['list'];
        if (options.status) args.push('--status', options.status);
        if (options.withSubtasks) args.push('--with-subtasks');
        if (options.tag) args.push('--tag', options.tag);
        if (options.file) args.push('--file', options.file);
        
        spawn('task-master', args, { stdio: 'inherit' });
        return;
      }

      // Handle priority filtering with custom logic
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error(chalk.red('Error: Could not find project root. Make sure you\'re in a task-master project.'));
        process.exit(1);
      }

      // Determine current tag
      const tag = options.tag || getCurrentTag(projectRoot);

      // Determine tasks file path
      const tasksFile = options.file || path.join(projectRoot, '.taskmaster', 'tasks', 'tasks.json');
      
      if (!fs.existsSync(tasksFile)) {
        console.error(chalk.red(`Error: Tasks file not found at ${tasksFile}`));
        process.exit(1);
      }

      // Read and parse tasks
      const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      
      if (!tasksData) {
        console.error(chalk.red('Error: Invalid tasks file format'));
        process.exit(1);
      }

      // Apply priority filtering
      let filteredTasks = filterTasksByPriority(tasksData, options.priority, tag);

      // Apply status filtering if specified
      if (options.status && options.status.toLowerCase() !== 'all') {
        const allowedStatuses = options.status
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0);

        filteredTasks = filteredTasks.filter(
          (task) => task.status && allowedStatuses.includes(task.status.toLowerCase())
        );
      }

      // Display results
      displayFilteredTasks(filteredTasks, options.priority, options.status, tag);

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Check if we're handling a list command with priority
const args = process.argv.slice(2);
const isListWithPriority = args[0] === 'list' && args.some(arg => arg.includes('--priority'));

if (isListWithPriority) {
  // Parse with our custom list command
  program.parse();
} else {
  // Pass through to original task-master for all other commands
  spawn('task-master', args, { stdio: 'inherit' });
} 