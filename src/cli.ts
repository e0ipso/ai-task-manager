#!/usr/bin/env node
/**
 * CLI Entry Point
 *
 * This file contains the main CLI setup using Commander.js
 * Handles command-line argument parsing and routing to appropriate handlers
 */

import { Command } from 'commander';
import { init } from './index';
import { status } from './status';
import { InitOptions } from './types';
import * as logger from './logger';

const program = new Command();

program.name('ai-task-manager').version('0.1.0').description('AI-powered task management CLI tool');

program
  .command('init')
  .description('Initialize a new AI task management project')
  .requiredOption(
    '--assistants <value>',
    'Comma-separated list of assistants to configure (claude,gemini,opencode)'
  )
  .option(
    '--destination-directory <path>',
    'Directory to create project structure in (default: current directory)'
  )
  .option('--force', 'Force overwrite all files without prompting')
  .action(async (options: InitOptions) => {
    try {
      // Initialize the logger to ensure colors are available
      await logger.initLogger();

      // Execute the init command
      const result = await init(options);

      // Exit with appropriate code based on result
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } catch (error) {
      await logger.error(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Display dashboard with plans and task statistics')
  .action(async () => {
    try {
      await logger.initLogger();

      const result = await status();

      if (result.success) {
        process.exit(0);
      } else {
        if (result.message) {
          await logger.error(result.message);
        }
        process.exit(1);
      }
    } catch (error) {
      await logger.error(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

// Handle case where no command is provided
program.hook('preAction', async (_thisCommand, _actionCommand) => {
  // Initialize logger for all commands
  await logger.initLogger();
});

// Error handling for unknown commands
program.on('command:*', async operands => {
  await logger.error(`Unknown command: ${operands[0]}`);
  await logger.info('Use --help to see available commands');
  process.exit(1);
});

// Parse command line arguments
program.parse();

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}
