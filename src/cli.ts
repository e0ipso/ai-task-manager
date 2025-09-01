#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { TaskManager } from './task-manager';
import { UserInterface, UIOptions } from './ui';
import { FileSystemManager, createDefaultInstallationConfig } from './filesystem';
import { InitOrchestrator, InitOptions } from './init-orchestrator';
import { validateAssistants } from './utils/assistant-validator';

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
  $ npx @e0ipso/ai-task-manager install
  $ npx @e0ipso/ai-task-manager init --assistants claude --project "My Project" --non-interactive
  $ npx @e0ipso/ai-task-manager create --title "Fix bug" --description "Fix login issue"
  $ npx @e0ipso/ai-task-manager list --status pending
  $ npx @e0ipso/ai-task-manager status
  $ npx @e0ipso/ai-task-manager verify --repair

For more information, visit: https://github.com/e0ipso/ai-task-manager`);

// Enhanced init command with integrated orchestrator
program
  .command('init')
  .description('Initialize a new task management workspace with comprehensive integration')
  .option('-p, --project <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('--template <template>', 'Project template (basic, development, research, custom)', 'basic')
  .option('--no-examples', 'Skip including example tasks')
  .option('--non-interactive', 'Skip interactive prompts and use defaults')
  .option('--force', 'Overwrite existing workspace if it exists')
  .option('--no-color', 'Disable colored output')
  .option('--dry-run', 'Preview initialization without making changes')
  .option('--verbose', 'Enable detailed logging output')
  .requiredOption('--assistants <assistants>', 'Select coding assistants (claude,gemini)', (value) => {
    const result = validateAssistants(value);
    if (!result.valid) {
      throw new Error(`Invalid assistants: ${result.errors.join(', ')}`);
    }
    return result.assistants;
  })
  .addHelpText('after', `
Examples:
  $ ai-task-manager init --assistants claude
  $ ai-task-manager init --assistants claude,gemini --project "My App" --description "A web application"
  $ ai-task-manager init --assistants claude --non-interactive
  $ ai-task-manager init --assistants gemini --project "API Server" --force
  $ ai-task-manager init --assistants claude --dry-run --verbose`)
  .action(async (options) => {
    try {
      // Create initialization options
      const initOptions: InitOptions = {
        project: options.project,
        description: options.description,
        template: options.template || 'basic',
        includeExamples: !options.noExamples,
        nonInteractive: options.nonInteractive,
        force: options.force,
        noColor: options.noColor,
        dryRun: options.dryRun,
        verbose: options.verbose,
        assistants: options.assistants,
      };

      // Create and run orchestrator
      const orchestrator = new InitOrchestrator(options.verbose);
      const result = await orchestrator.orchestrateInit(initOptions);

      if (result.success) {
        if (options.verbose) {
          console.log('\n📊 Operation Summary:');
          console.log(`  • Project: ${result.projectName}`);
          console.log(`  • Files Created: ${result.operationsSummary.filesCreated}`);
          console.log(`  • Directories Created: ${result.operationsSummary.directoriesCreated}`);
          console.log(`  • Templates Installed: ${result.operationsSummary.templatesInstalled}`);
          console.log(`  • Commands Installed: ${result.operationsSummary.commandsInstalled}`);
          console.log(`  • Tasks Created: ${result.operationsSummary.tasksCreated}`);
          console.log(`  • Duration: ${(result.operationsSummary.duration / 1000).toFixed(2)}s`);

          if (orchestrator.getLogs().length > 0) {
            console.log('\n📝 Detailed Logs:');
            orchestrator.getLogs().forEach(log => {
              const timestamp = log.timestamp.toISOString().substring(11, 23);
              console.log(`  [${timestamp}] ${log.level.toUpperCase()}: ${log.message}`);
            });
          }
        }

        if (result.warnings.length > 0) {
          console.log('\n⚠️  Warnings:');
          result.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        if (options.dryRun) {
          console.log('\n🧪 Dry run completed - no changes were made');
          console.log('Remove --dry-run flag to perform actual initialization');
        }
      } else {
        // Error handling is done by the orchestrator
        process.exit(1);
      }

    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showError('Initialization failed', [
        error instanceof Error ? error.message : String(error)
      ], [
        'Use --verbose flag for detailed error information',
        'Check that you have proper permissions',
        'Ensure the target directory is accessible'
      ]);
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

// Enhanced install command with comprehensive filesystem operations
program
  .command('install')
  .description('Install AI Task Manager with templates and Claude commands')
  .option('-f, --force', 'Force installation even if conflicts exist')
  .option('--overwrite-mode <mode>', 'Conflict resolution mode (ask, overwrite, skip, merge)', 'ask')
  .option('--no-backup', 'Skip creating backups of existing files')
  .option('--no-verify', 'Skip installation verification')
  .option('--dry-run', 'Preview installation without making changes')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ai-task-manager install
  $ ai-task-manager install --force --overwrite-mode overwrite
  $ ai-task-manager install --dry-run
  $ ai-task-manager install --no-backup --no-verify`)
  .action(async (options) => {
    try {
      const ui = new UserInterface({ colors: !options.noColor });
      const fsManager = new FileSystemManager();
      const targetDirectory = process.cwd();

      // Create installation configuration
      const config = createDefaultInstallationConfig(targetDirectory);
      config.overwriteMode = options.overwriteMode || 'ask';
      config.createBackup = !options.noBackup;
      config.verifyIntegrity = !options.noVerify;
      config.dryRun = options.dryRun;

      if (options.force) {
        config.overwriteMode = 'overwrite';
      }

      ui.showInfo('🔧 Installing AI Task Manager', [
        `Target directory: ${targetDirectory}`,
        `Mode: ${config.overwriteMode}`,
        `Backup: ${config.createBackup ? 'enabled' : 'disabled'}`,
        `Verification: ${config.verifyIntegrity ? 'enabled' : 'disabled'}`,
        ...(config.dryRun ? ['⚠️  DRY RUN MODE - No changes will be made'] : [])
      ]);

      // Check existing installation
      const existingInstallation = await fsManager.detectInstallation(targetDirectory);
      
      if (existingInstallation.isInstalled) {
        if (!options.force && !options.dryRun) {
          ui.showInfo('📦 Existing installation detected', [
            `Version: ${existingInstallation.version || 'unknown'}`,
            `Path: ${existingInstallation.installationPath}`,
          ], [
            'Use --force to overwrite existing installation',
            'Use --dry-run to preview changes'
          ]);
        }
      }

      // Perform installation with progress tracking
      const result = await ui.withProgress(
        async () => {
          return await fsManager.installAITaskManager(targetDirectory, config);
        },
        'Installing AI Task Manager',
        options.dryRun 
          ? 'Dry run completed - no changes made'
          : 'Installation completed successfully'
      );

      if (options.dryRun) {
        ui.showInfo('📋 Installation Preview', [
          `Total operations: ${result.operations.length}`,
          `Files to create: ${result.summary.filesCreated}`,
          `Directories to create: ${result.summary.directoriesCreated}`,
          `Estimated size: ${(result.summary.bytesTransferred / 1024).toFixed(1)}KB`
        ]);

        if (result.errors.length > 0) {
          ui.showError('❌ Potential Issues Found', 
            result.errors.map(e => e.error),
            ['Review and fix these issues before installation']
          );
        }
        return;
      }

      if (result.success) {
        ui.showInfo('✅ Installation Successful', [
          `Files created: ${result.summary.filesCreated}`,
          `Directories created: ${result.summary.directoriesCreated}`,
          `Duration: ${(result.summary.duration / 1000).toFixed(1)}s`,
          `Size transferred: ${(result.summary.bytesTransferred / 1024).toFixed(1)}KB`
        ], [
          'You can now use AI Task Manager commands',
          'Try "ai-task-manager init" to create a workspace'
        ]);
      } else {
        ui.showError('❌ Installation Failed', 
          result.errors.map(e => e.error),
          [
            'Check file permissions in the target directory',
            'Ensure you have sufficient disk space',
            'Try running with --force if conflicts exist'
          ]
        );
        process.exit(1);
      }

    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showError('❌ Installation Error', [
        error instanceof Error ? error.message : String(error)
      ], [
        'Check that you have write permissions',
        'Ensure the target directory is accessible',
        'Try running the command again'
      ]);
      process.exit(1);
    }
  });

// Verify command for installation integrity
program
  .command('verify')
  .description('Verify AI Task Manager installation integrity')
  .option('--repair', 'Attempt to repair damaged installation')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ai-task-manager verify
  $ ai-task-manager verify --repair`)
  .action(async (options) => {
    try {
      const ui = new UserInterface({ colors: !options.noColor });
      const fsManager = new FileSystemManager();
      const targetDirectory = process.cwd();

      ui.showInfo('🔍 Verifying Installation', [
        `Checking: ${targetDirectory}`
      ]);

      // Get installation status
      const status = await fsManager.getInstallationStatus(targetDirectory);
      
      if (!status.isInstalled) {
        ui.showInfo('❌ No Installation Found', [
          'AI Task Manager is not installed in this directory'
        ], [
          'Run "ai-task-manager install" to install',
          'Ensure you are in the correct directory'
        ]);
        process.exit(1);
      }

      // Run verification
      const verification = await ui.withProgress(
        async () => {
          return await fsManager.verifyInstallation(targetDirectory);
        },
        'Verifying installation integrity',
        'Verification completed'
      );

      // Display results
      if (verification.valid) {
        ui.showInfo('✅ Installation Healthy', [
          `Verified: ${verification.checkedFiles} files`,
          `Status: ${status.health}`,
          `Version: ${status.version || 'unknown'}`
        ]);
      } else {
        const criticalIssues = verification.issues.filter(i => 
          i.severity === 'critical' || i.severity === 'high'
        ).length;

        ui.showError('❌ Installation Issues Found', [
          verification.summary,
          `Critical/High issues: ${criticalIssues}`,
          `Total issues: ${verification.issues.length}`
        ]);

        // Show detailed issues
        for (const issue of verification.issues.slice(0, 10)) { // Show first 10 issues
          console.log(`  • ${issue.path}: ${issue.issue} (${issue.severity})`);
        }

        if (verification.issues.length > 10) {
          console.log(`  ... and ${verification.issues.length - 10} more issues`);
        }

        if (options.repair) {
          ui.showInfo('🔧 Attempting Repair', [
            'This will reinstall damaged components'
          ]);

          const repairResult = await ui.withProgress(
            async () => {
              const config = createDefaultInstallationConfig(targetDirectory);
              config.overwriteMode = 'overwrite';
              config.createBackup = true;
              return await fsManager.repairInstallation(targetDirectory, config);
            },
            'Repairing installation',
            'Repair completed'
          );

          if (repairResult.success) {
            ui.showInfo('✅ Repair Successful', [
              `Fixed: ${repairResult.summary.filesCreated} files`,
              'Installation should now be healthy'
            ], [
              'Run verify again to confirm the repair'
            ]);
          } else {
            ui.showError('❌ Repair Failed', 
              repairResult.errors.map(e => e.error),
              ['Manual intervention may be required']
            );
            process.exit(1);
          }
        } else {
          console.log('\n💡 Use --repair flag to attempt automatic repair');
        }
      }

    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showError('❌ Verification Error', [
        error instanceof Error ? error.message : String(error)
      ]);
      process.exit(1);
    }
  });

// Uninstall command
program
  .command('uninstall')
  .description('Uninstall AI Task Manager from current directory')
  .option('--force', 'Skip confirmation prompt')
  .option('--no-color', 'Disable colored output')
  .addHelpText('after', `
Examples:
  $ ai-task-manager uninstall
  $ ai-task-manager uninstall --force`)
  .action(async (options) => {
    try {
      const ui = new UserInterface({ colors: !options.noColor });
      const fsManager = new FileSystemManager();
      const targetDirectory = process.cwd();

      // Check if installation exists
      const status = await fsManager.getInstallationStatus(targetDirectory);
      
      if (!status.isInstalled) {
        ui.showInfo('ℹ️  No Installation Found', [
          'AI Task Manager is not installed in this directory'
        ]);
        return;
      }

      // Confirmation prompt (unless forced)
      if (!options.force) {
        ui.showInfo('⚠️  Uninstall Confirmation', [
          'This will remove:',
          '  • .ai/ directory and all templates',
          '  • .claude/commands/tasks/ directory',
          '  • All AI Task Manager files',
          '',
          'This action cannot be undone!'
        ]);

        // In a real implementation, you'd prompt the user here
        console.log('Use --force to skip this confirmation');
        return;
      }

      // Perform uninstallation
      const success = await ui.withProgress(
        async () => {
          return await fsManager.uninstallAITaskManager(targetDirectory);
        },
        'Removing AI Task Manager',
        'Uninstallation completed'
      );

      if (success) {
        ui.showInfo('✅ Uninstallation Successful', [
          'AI Task Manager has been removed from this directory'
        ], [
          'You can reinstall anytime with "ai-task-manager install"'
        ]);
      } else {
        ui.showError('❌ Uninstallation Failed', [
          'Some files could not be removed'
        ], [
          'Check file permissions',
          'Try running with elevated privileges',
          'Manual cleanup may be required'
        ]);
        process.exit(1);
      }

    } catch (error) {
      const ui = new UserInterface({ colors: !options.noColor });
      ui.showError('❌ Uninstallation Error', [
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
  console.log('  install    Install AI Task Manager with templates and commands');
  console.log('  verify     Verify installation integrity and optionally repair');
  console.log('  uninstall  Remove AI Task Manager from current directory');
  console.log('  init       Initialize a new task workspace');
  console.log('  create     Create a new task');
  console.log('  list       List tasks with filtering options');
  console.log('  status     Show workspace status');
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