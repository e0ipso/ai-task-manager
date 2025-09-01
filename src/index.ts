/**
 * Main Init Command Implementation
 *
 * This file contains the implementation of the init command
 * Handles initialization of new AI task management projects
 */

import { InitOptions, Assistant, FileSystemError, CommandResult } from './types';
import * as logger from './logger';
import {
  parseAssistants,
  validateAssistants,
  ensureDir,
  copyTemplate,
  getTemplatePath,
  getCreatedDirectories,
  exists,
} from './utils';

/**
 * Initialize a new AI Task Manager project
 *
 * Creates directory structures and copies template files based on the selected assistants.
 * Validates input, creates necessary directories, and copies appropriate templates.
 *
 * @param options - Initialization options containing assistant selection
 * @returns CommandResult indicating success or failure with details
 */
export async function init(options: InitOptions): Promise<CommandResult> {
  try {
    // Log start of initialization
    await logger.info('Initializing AI Task Manager...');

    // Parse and validate assistants
    const assistants = parseAssistants(options.assistants);
    await logger.debug(`Parsed assistants: ${assistants.join(', ')}`);

    // Validate assistants
    validateAssistants(assistants);
    await logger.debug('Assistant validation passed');

    // Create .ai/task-manager structure
    await logger.info('Creating .ai/task-manager directory structure...');
    await ensureDir('.ai/task-manager/plans');

    // Copy common templates to .ai/task-manager
    await logger.info('Copying common template files...');
    await copyCommonTemplates();

    // Create assistant-specific directories and copy templates
    for (const assistant of assistants) {
      await logger.info(`Setting up ${assistant} assistant configuration...`);
      await createAssistantStructure(assistant);
    }

    // Show success message with created directories
    const createdDirectories = getCreatedDirectories(assistants);
    await logger.success('AI Task Manager initialized successfully!');
    await logger.info('Created directory structure:');

    for (const dir of createdDirectories) {
      await logger.info(`  ✓ ${dir}`);
    }

    // Show copied templates
    await logger.info('Template files copied:');
    await logger.info('  ✓ .ai/task-manager/TASK_MANAGER_INFO.md');
    await logger.info('  ✓ .ai/task-manager/VALIDATION_GATES.md');

    for (const assistant of assistants) {
      await logger.info(`  ✓ .${assistant}/commands/tasks/create-plan.md`);
      await logger.info(`  ✓ .${assistant}/commands/tasks/execute-blueprint.md`);
      await logger.info(`  ✓ .${assistant}/commands/tasks/generate-tasks.md`);
    }

    await logger.success('Project is ready for AI-powered task management!');

    return {
      success: true,
      message: 'AI Task Manager initialized successfully!',
      data: { assistants },
    };
  } catch (error) {
    let errorMessage: string;
    let errorInstance: Error;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorInstance = error;
      if (
        error.message.includes('Invalid assistant') ||
        error.message.includes('Assistants parameter')
      ) {
        await logger.error(`Configuration Error: ${error.message}`);
      } else if (error instanceof FileSystemError) {
        await logger.error(`File System Error: ${error.message}`);
      } else {
        await logger.error(`Initialization failed: ${error.message}`);
      }
    } else {
      errorMessage = 'Initialization failed with unknown error';
      errorInstance = new Error(String(error));
      await logger.error(errorMessage);
    }

    return {
      success: false,
      message: errorMessage,
      error: errorInstance,
    };
  }
}

/**
 * Copy common template files to .ai/task-manager directory
 */
async function copyCommonTemplates(): Promise<void> {
  const templates = [
    {
      source: getTemplatePath('ai-task-manager/TASK_MANAGER_INFO.md'),
      dest: '.ai/task-manager/TASK_MANAGER_INFO.md',
    },
    {
      source: getTemplatePath('ai-task-manager/VALIDATION_GATES.md'),
      dest: '.ai/task-manager/VALIDATION_GATES.md',
    },
  ];

  for (const template of templates) {
    // Check if source template exists
    if (!(await exists(template.source))) {
      throw new FileSystemError(`Template file not found: ${template.source}`, {
        templatePath: template.source,
      });
    }

    await copyTemplate(template.source, template.dest);
    await logger.debug(`Copied ${template.source} to ${template.dest}`);
  }
}

/**
 * Create directory structure and copy templates for a specific assistant
 */
async function createAssistantStructure(assistant: Assistant): Promise<void> {
  // Create assistant directory structure
  const assistantDir = `.${assistant}`;
  const commandsDir = `${assistantDir}/commands`;
  const tasksDir = `${commandsDir}/tasks`;

  await ensureDir(tasksDir);
  await logger.debug(`Created directory structure for ${assistant}`);

  // Copy assistant-specific command templates
  const commandTemplates = ['create-plan.md', 'execute-blueprint.md', 'generate-tasks.md'];

  for (const templateFile of commandTemplates) {
    const sourcePath = getTemplatePath(`commands/tasks/${templateFile}`);
    const destPath = `${tasksDir}/${templateFile}`;

    // Check if source template exists
    if (!(await exists(sourcePath))) {
      throw new FileSystemError(`Command template not found: ${sourcePath}`, {
        templatePath: sourcePath,
        assistant,
      });
    }

    await copyTemplate(sourcePath, destPath);
    await logger.debug(`Copied ${templateFile} for ${assistant}`);
  }
}

/**
 * Check if the current directory already has AI Task Manager initialized
 */
export async function isInitialized(): Promise<boolean> {
  return await exists('.ai/task-manager');
}

/**
 * Get information about existing initialization
 */
export async function getInitInfo(): Promise<{
  hasAiTaskManager: boolean;
  hasClaudeConfig: boolean;
  hasGeminiConfig: boolean;
  assistants: Assistant[];
}> {
  const hasAiTaskManager = await exists('.ai/task-manager');
  const hasClaudeConfig = await exists('.claude/commands/tasks');
  const hasGeminiConfig = await exists('.gemini/commands/tasks');

  const assistants: Assistant[] = [];
  if (hasClaudeConfig) assistants.push('claude');
  if (hasGeminiConfig) assistants.push('gemini');

  return {
    hasAiTaskManager,
    hasClaudeConfig,
    hasGeminiConfig,
    assistants,
  };
}
