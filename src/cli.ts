#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { TaskManager } from './task-manager';
import { UserInterface, UIOptions } from './ui';

const program = new Command();

// Read package.json to get version dynamically
const getPackageVersion = (): string => {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = require(packagePath);
    return packageJson.version;
  } catch (error) {
    return '0.1.0';
  }
};

// Configure main program
program
  .name('ai-task-manager')
  .description('AI-powered task management CLI tool with enhanced user experience')
  .version(getPackageVersion(), '-v, --version', 'Display the current version')
  .helpOption('-h, --help', 'Display help information')
  .addHelpText('after', `
Examples:
  $ npx @e0ipso/ai-task-manager init
  $ npx @e0ipso/ai-task-manager init --project "My Project" --non-interactive
  $ npx @e0ipso/ai-task-manager create --title "Fix bug" --description "Fix login issue"
  $ npx @e0ipso/ai-task-manager list --status pending
  $ npx @e0ipso/ai-task-manager status

For more information, visit: https://github.com/e0ipso/ai-task-manager`);

// Enhanced init command with new UI system
program
  .command('init')
  .description('Initialize a new task management workspace with interactive setup')
  .option('-p, --project <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('--template <template>', 'Project template (basic, development, research, custom)', 'basic')
  .option('--no-examples', 'Skip including example tasks')
  .option('--non-interactive', 'Skip interactive prompts and use defaults')
  .option('--force', 'Overwrite existing workspace if it exists')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ai-task-manager init
  $ ai-task-manager init --project "My App" --description "A web application"
  $ ai-task-manager init --non-interactive
  $ ai-task-manager init --project "API Server" --force`)
  .action(async (options) => {
    try {
      // Check if workspace already exists
      const configPath = path.join(process.cwd(), '.ai-tasks', 'config.json');
      const workspaceExists = await fs.access(configPath).then(() => true).catch(() => false);

      if (workspaceExists && !options.force) {
        console.error('❌ Error: Workspace already exists in this directory.');
        console.log('💡 Use --force flag to overwrite existing workspace.');
        process.exit(1);
      }

      // Create UI instance with options
      const uiOptions: UIOptions = {
        nonInteractive: options.nonInteractive,
        colors: !options.noColor,
        defaults: {
          projectName: options.project || path.basename(process.cwd()),
          description: options.description || 'A new project managed by AI Task Manager',
          template: options.template || 'basic',
          includeExamples: !options.noExamples
        }
      };

      const ui = new UserInterface(uiOptions);
      
      // Run initialization flow
      const config = await ui.runInitializationFlow();
      const taskManager = new TaskManager();
      
      // Initialize workspace with progress tracking
      await ui.withProgress(
        async () => {
          await taskManager.initialize(config.projectName, config.description);
          
          // Add example tasks if requested
          if (config.includeExamples) {
            await taskManager.createTask(
              'Welcome to AI Task Manager',
              'This is your first example task. You can edit or delete it anytime.'
            );
            await taskManager.createTask(
              'Explore the CLI features',
              'Try running list, status, and create commands to get familiar with the tool.'
            );
          }
        },
        'Setting up workspace',
        'Workspace initialization completed successfully'
      );
      
      ui.showInitializationSuccess(config.projectName, process.cwd());
      
    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showInitializationError(
        error instanceof Error ? error.message : String(error),
        [
          'Check that you have write permissions in the current directory',
          'Ensure you have enough disk space available',
          'Try running with elevated permissions if necessary'
        ]
      );
      process.exit(1);
    }
  });

// Enhanced create command with new UI system
program
  .command('create')
  .description('Create a new task with interactive prompts')
  .option('-t, --title <title>', 'Task title')
  .option('-d, --description <description>', 'Task description')
  .option('-p, --priority <priority>', 'Task priority (low, medium, high, critical)', 'medium')
  .option('--due-date <date>', 'Due date in YYYY-MM-DD format')
  .option('--non-interactive', 'Skip interactive prompts (requires title)')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ai-task-manager create
  $ ai-task-manager create --title "Fix login bug"
  $ ai-task-manager create --title "Add feature" --description "Implement user profiles"
  $ ai-task-manager create --title "Deploy app" --non-interactive`)
  .action(async (options) => {
    try {
      // Check if workspace is initialized
      const configPath = path.join(process.cwd(), '.ai-tasks', 'config.json');
      const workspaceExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (!workspaceExists) {
        const ui = new UserInterface({ colors: !options.noColor });
        ui.showNoWorkspaceFound();
        process.exit(1);
      }

      // Create UI instance with options
      const uiOptions: UIOptions = {
        nonInteractive: options.nonInteractive,
        colors: !options.noColor,
        defaults: {
          title: options.title,
          description: options.description || '',
          priority: options.priority || 'medium',
          dueDate: options.dueDate || null
        }
      };

      const ui = new UserInterface(uiOptions);
      
      // Run task creation flow if not all required data provided via flags
      let taskData;
      if (!options.title || (!options.nonInteractive && !options.description)) {
        taskData = await ui.runTaskCreationFlow();
      } else {
        // Use provided options for non-interactive mode
        taskData = {
          title: options.title,
          description: options.description || '',
          priority: options.priority || 'medium',
          dueDate: options.dueDate || null
        };
      }
      
      // Create task with progress indicator
      const taskManager = new TaskManager();
      const task = await ui.withProgress(
        async () => {
          return await taskManager.createTask(taskData.title, taskData.description);
        },
        'Creating task',
        `Task "${taskData.title}" created successfully`
      );
      
      ui.showTaskCreationSuccess(taskData.title, task.id);
      
    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showError(
        'Failed to create task',
        [error instanceof Error ? error.message : String(error)],
        [
          'Ensure the task title is provided',
          'Check that workspace is properly initialized',
          'Try running the command again'
        ]
      );
      process.exit(1);
    }
  });

// Enhanced list command
program
  .command('list')
  .description('List tasks with enhanced formatting')
  .option('-s, --status <status>', 'Filter by status (pending, in_progress, completed)')
  .option('--format <format>', 'Output format (table, json, simple)', 'simple')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ai-task-manager list
  $ ai-task-manager list --status pending
  $ ai-task-manager list --status completed
  $ ai-task-manager list --format json`)
  .action(async (options) => {
    try {
      // Check if workspace is initialized
      const configPath = path.join(process.cwd(), '.ai-tasks', 'config.json');
      const workspaceExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (!workspaceExists) {
        const ui = new UserInterface({ colors: !options.noColor });
        ui.showNoWorkspaceFound();
        process.exit(1);
      }

      // Validate status filter
      if (options.status && !['pending', 'in_progress', 'completed'].includes(options.status)) {
        console.error('❌ Error: Invalid status filter. Use: pending, in_progress, or completed');
        process.exit(1);
      }

      // Validate format option
      if (!['table', 'json', 'simple'].includes(options.format)) {
        console.error('❌ Error: Invalid format. Use: table, json, or simple');
        process.exit(1);
      }

      const taskManager = new TaskManager();
      const tasks = await taskManager.listTasks(options.status);
      const ui = new UserInterface({ colors: !options.noColor });

      if (tasks.length === 0) {
        const statusText = options.status ? ` with status "${options.status}"` : '';
        ui.showInfo(`No tasks found${statusText}`, [], [
          'Create your first task with "ai-task-manager create"'
        ]);
        return;
      }

      // JSON format output
      if (options.format === 'json') {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      // Enhanced display with UI formatter
      const statusText = options.status ? ` (${options.status})` : '';
      console.log(`\n📋 Tasks${statusText}:`);
      
      tasks.forEach((task, index) => {
        const statusEmoji = {
          'completed': '✅',
          'in_progress': '🔄',
          'pending': '⏳'
        }[task.status] || '❓';
        
        console.log(`${index + 1}. ${statusEmoji} ${task.title} [${task.status}]`);
        
        if (task.description) {
          console.log(`   ${task.description}`);
        }
      });
      
      ui.showInfo(`Total: ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`);
      
    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showError('Error listing tasks', [
        error instanceof Error ? error.message : String(error)
      ]);
      process.exit(1);
    }
  });

// Enhanced status command
program
  .command('status')
  .description('Show workspace status with enhanced visuals')
  .option('--format <format>', 'Output format (summary, json)', 'summary')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ai-task-manager status
  $ ai-task-manager status --format json`)
  .action(async (options) => {
    try {
      // Check if workspace is initialized
      const configPath = path.join(process.cwd(), '.ai-tasks', 'config.json');
      const workspaceExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (!workspaceExists) {
        const ui = new UserInterface({ colors: !options.noColor });
        ui.showNoWorkspaceFound();
        process.exit(1);
      }

      // Validate format option
      if (!['summary', 'json'].includes(options.format)) {
        console.error('❌ Error: Invalid format. Use: summary or json');
        process.exit(1);
      }

      const taskManager = new TaskManager();
      const status = await taskManager.getStatus();
      const ui = new UserInterface({ colors: !options.noColor });

      // Load workspace config
      let workspaceConfig = null;
      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        workspaceConfig = JSON.parse(configData);
      } catch (error) {
        // Config file exists but can't be read, continue without it
      }

      // JSON format output
      if (options.format === 'json') {
        const output = {
          workspace: workspaceConfig ? {
            projectName: workspaceConfig.projectName,
            description: workspaceConfig.description,
            createdAt: workspaceConfig.createdAt
          } : null,
          tasks: status,
          directory: process.cwd()
        };
        console.log(JSON.stringify(output, null, 2));
        return;
      }

      // Enhanced status display
      ui.showWorkspaceStatus(status, workspaceConfig?.projectName);
      
    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showError('Error getting workspace status', [
        error instanceof Error ? error.message : String(error)
      ]);
      process.exit(1);
    }
  });

// Add global error handler
process.on('uncaughtException', (error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Handle unknown commands
program.on('command:*', (operands) => {
  const unknownCommand = operands[0];
  console.error(`❌ Unknown command: ${unknownCommand}`);
  console.log('');
  console.log('Available commands:');
  console.log('  init     Initialize a new task workspace');
  console.log('  create   Create a new task');
  console.log('  list     List tasks with filtering options');
  console.log('  status   Show workspace status');
  console.log('');
  console.log('Use "ai-task-manager --help" for general help');
  process.exit(1);
});

// Parse command line arguments
try {
  program.parse(process.argv);
} catch (error) {
  console.error('❌ Command parsing error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  console.log('🚀 AI Task Manager - Enhanced User Experience\n');
  program.outputHelp();
  process.exit(0);
}