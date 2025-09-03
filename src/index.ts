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
  exists,
  resolvePath,
  getTemplateFormat,
  readAndProcessTemplate,
  writeProcessedTemplate,
  getMarkdownTemplateNames,
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
    // Determine base directory
    const baseDir = options.destinationDirectory || '.';
    const resolvedBaseDir = resolvePath(baseDir);

    // Log start of initialization
    await logger.info(`Initializing AI Task Manager in: ${resolvedBaseDir}...`);

    // Parse and validate assistants
    const assistants = parseAssistants(options.assistants);
    await logger.debug(`Parsed assistants: ${assistants.join(', ')}`);

    // Validate assistants
    validateAssistants(assistants);
    await logger.debug('Assistant validation passed');

    // Create .ai/task-manager structure
    await logger.info('📁 Creating .ai/task-manager directory structure...');
    await ensureDir(resolvePath(baseDir, '.ai/task-manager/plans'));

    // Copy common templates to .ai/task-manager
    await logger.info('📋 Copying common template files...');
    await copyCommonTemplates(baseDir);

    // Create assistant-specific directories and copy templates
    for (const assistant of assistants) {
      await logger.info(`🤖 Setting up ${assistant} assistant configuration...`);
      await createAssistantStructure(assistant, baseDir);
    }

    // Show success message with created directories
    await logger.success('🎉 AI Task Manager initialized successfully!');

    for (const assistant of assistants) {
      const templateFormat = getTemplateFormat(assistant);
      await logger.info(
        `  ✓ ${resolvePath(baseDir, `.${assistant}/commands/tasks/create-plan.${templateFormat}`)}`
      );
      await logger.info(
        `  ✓ ${resolvePath(baseDir, `.${assistant}/commands/tasks/execute-blueprint.${templateFormat}`)}`
      );
      await logger.info(
        `  ✓ ${resolvePath(baseDir, `.${assistant}/commands/tasks/generate-tasks.${templateFormat}`)}`
      );
    }

    // Show suggested workflow help text
    await displayWorkflowHelp();

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
async function copyCommonTemplates(baseDir: string): Promise<void> {
  const templates = [
    {
      source: getTemplatePath('ai-task-manager/TASK_MANAGER_INFO.md'),
      dest: resolvePath(baseDir, '.ai/task-manager/TASK_MANAGER_INFO.md'),
    },
    {
      source: getTemplatePath('ai-task-manager/VALIDATION_GATES.md'),
      dest: resolvePath(baseDir, '.ai/task-manager/VALIDATION_GATES.md'),
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
    await logger.debug(`📤 Copied ${template.source} to ${template.dest}`);
  }
}

/**
 * Create directory structure and copy templates for a specific assistant
 */
async function createAssistantStructure(assistant: Assistant, baseDir: string): Promise<void> {
  // Create assistant directory structure
  const tasksDir = resolvePath(baseDir, `.${assistant}/commands/tasks`);

  await ensureDir(tasksDir);
  await logger.debug(`🏗️ Created directory structure for ${assistant} in ${tasksDir}`);

  // Determine template format based on assistant type
  const templateFormat = getTemplateFormat(assistant);
  await logger.debug(`🎨 Using ${templateFormat} template format for ${assistant} assistant`);

  // Copy assistant-specific command templates with appropriate format
  const commandTemplateNames = await getMarkdownTemplateNames('commands/tasks');

  for (const templateName of commandTemplateNames) {
    const templateFile = `${templateName}.${templateFormat}`;

    // Always read from the MD template source (DRY principle)
    const mdSourcePath = getTemplatePath(`commands/tasks/${templateName}.md`);
    const destPath = resolvePath(baseDir, `.${assistant}/commands/tasks/${templateFile}`);

    // Check if MD source template exists
    if (!(await exists(mdSourcePath))) {
      throw new FileSystemError(`Command template not found: ${mdSourcePath}`, {
        templatePath: mdSourcePath,
        assistant,
        templateFormat,
      });
    }

    // Read and process the template based on target format
    const processedContent = await readAndProcessTemplate(mdSourcePath, templateFormat);

    // Write the processed content to destination
    await writeProcessedTemplate(processedContent, destPath);

    await logger.debug(
      `⚡ Processed ${templateName}.md and created ${templateFile} for ${assistant} at ${destPath}`
    );
  }
}

/**
 * Check if a directory already has AI Task Manager initialized
 */
export async function isInitialized(baseDir?: string): Promise<boolean> {
  const targetDir = baseDir || '.';
  return await exists(resolvePath(targetDir, '.ai/task-manager'));
}

/**
 * Get information about existing initialization
 */
export async function getInitInfo(baseDir?: string): Promise<{
  hasAiTaskManager: boolean;
  hasClaudeConfig: boolean;
  hasGeminiConfig: boolean;
  assistants: Assistant[];
}> {
  const targetDir = baseDir || '.';
  const hasAiTaskManager = await exists(resolvePath(targetDir, '.ai/task-manager'));
  const hasClaudeConfig = await exists(resolvePath(targetDir, '.claude/commands/tasks'));
  const hasGeminiConfig = await exists(resolvePath(targetDir, '.gemini/commands/tasks'));

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

/**
 * Display formatted workflow help text to guide users after successful installation
 */
async function displayWorkflowHelp(): Promise<void> {
  const separator = '═'.repeat(60);
  const thinSeparator = '─'.repeat(60);
  
  await logger.info('');
  await logger.info(`╔${separator}╗`);
  await logger.info(`║${' '.repeat(18)}🚀 SUGGESTED WORKFLOW 🚀${' '.repeat(18)}║`);
  await logger.info(`╚${separator}╝`);
  await logger.info('');
  
  await logger.info(`┌─ 📋 ONE-TIME SETUP ${thinSeparator.slice(20)}┐`);
  await logger.info('│                                                            │');
  await logger.info('│  Review and tweak these files to match your project:      │');
  await logger.info('│  • .ai/task-manager/TASK_MANAGER_INFO.md                   │');
  await logger.info('│  • .ai/task-manager/VALIDATION_GATES.md                    │');
  await logger.info('│                                                            │');
  await logger.info(`└${thinSeparator}┘`);
  await logger.info('');
  
  await logger.info(`┌─ 🔄 DAY-TO-DAY WORKFLOW ${thinSeparator.slice(22)}┐`);
  await logger.info('│                                                            │');
  await logger.info('│  1️⃣  Create a plan:                                        │');
  await logger.info('│      /tasks:create-plan Create an authentication...       │');
  await logger.info('│                                                            │');
  await logger.info('│  2️⃣  Provide additional context if the assistant needs it  │');
  await logger.info('│                                                            │');
  await logger.info('│  3️⃣  ⚠️  MANUALLY REVIEW THE PLAN (don\'t skip this!)      │');
  await logger.info('│      Find it in: .ai/task-manager/plans/01--*/plan-*.md   │');
  await logger.info('│                                                            │');
  await logger.info('│  4️⃣  Create the tasks for the plan:                        │');
  await logger.info('│      /tasks:generate-tasks 1                              │');
  await logger.info('│                                                            │');
  await logger.info('│  5️⃣  ⚠️  REVIEW THE TASKS LIST (avoid scope creep!)       │');
  await logger.info('│      Find them in: .ai/task-manager/plans/01--*/tasks/    │');
  await logger.info('│                                                            │');
  await logger.info('│  6️⃣  Execute the tasks:                                    │');
  await logger.info('│      /tasks:execute-blueprint 1                           │');
  await logger.info('│                                                            │');
  await logger.info('│  7️⃣  Review the implementation and generated tests         │');
  await logger.info('│                                                            │');
  await logger.info(`└${thinSeparator}┘`);
  await logger.info('');
  await logger.info('💡 Pro tip: The manual review steps are crucial for success!');
  await logger.info('');
}
