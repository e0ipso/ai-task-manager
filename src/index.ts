/**
 * Main Init Command Implementation
 *
 * This file contains the implementation of the init command
 * Handles initialization of new AI task management projects
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { InitOptions, Assistant, CommandResult, ConflictResolution } from './types';
import * as logger from './logger';
import {
  parseAssistants,
  validateAssistants,
  getTemplateFormat,
  readAndProcessTemplate,
  writeProcessedTemplate,
} from './utils';
import { calculateFileHash, loadMetadata, saveMetadata, getPackageVersion } from './metadata';
import { detectConflicts } from './conflict-detector';
import { promptForConflicts } from './prompts';

/**
 * Get the absolute path to a template file
 */
function getTemplatePath(templateFile: string): string {
  return path.join(__dirname, '..', 'templates', templateFile);
}

/**
 * Resolve path segments relative to a base directory with cross-platform compatibility
 */
function resolvePath(baseDir: string | undefined, ...segments: string[]): string {
  const base = baseDir || '.';
  const validSegments = segments.filter(
    segment => segment !== null && segment !== undefined && segment !== ''
  );
  return path.resolve(base, ...validSegments);
}

/**
 * Check if a file or directory exists
 */
async function exists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

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
    await fs.ensureDir(resolvePath(baseDir, '.ai/task-manager/plans'));
    await fs.ensureDir(resolvePath(baseDir, '.ai/task-manager/config/hooks'));

    // Copy common templates to .ai/task-manager with conflict detection
    await logger.info('📋 Copying common template files...');
    await copyCommonTemplates(baseDir, options.force || false);

    // Create assistant-specific directories and copy templates
    for (const assistant of assistants) {
      await logger.info(`🤖 Setting up ${assistant} assistant configuration...`);
      await createAssistantStructure(assistant, baseDir);
    }

    // Show success message with created directories
    await logger.success('🎉 AI Task Manager initialized successfully!');

    await logger.info(`  ✓ ${resolvePath(baseDir, '.ai/task-manager/config/TASK_MANAGER.md')}`);
    await logger.info(`  ✓ ${resolvePath(baseDir, '.ai/task-manager/config/hooks/POST_PHASE.md')}`);
    await logger.info(
      `  ✓ ${resolvePath(baseDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md')}`
    );
    for (const assistant of assistants) {
      const templateFormat = getTemplateFormat(assistant);
      // Open Code uses 'command' (singular) instead of 'commands' (plural)
      const commandsPath = assistant === 'opencode' ? 'command' : 'commands';
      await logger.info(
        `  ✓ ${resolvePath(baseDir, `.${assistant}/${commandsPath}/tasks/create-plan.${templateFormat}`)}`
      );
      await logger.info(
        `  ✓ ${resolvePath(baseDir, `.${assistant}/${commandsPath}/tasks/execute-blueprint.${templateFormat}`)}`
      );
      await logger.info(
        `  ✓ ${resolvePath(baseDir, `.${assistant}/${commandsPath}/tasks/generate-tasks.${templateFormat}`)}`
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
    const errorMessage =
      error instanceof Error ? error.message : 'Initialization failed with unknown error';
    await logger.error(`Initialization failed: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Copy common template files to .ai/task-manager directory with conflict detection
 */
async function copyCommonTemplates(baseDir: string, force: boolean): Promise<void> {
  const sourceDir = getTemplatePath('ai-task-manager');
  const destDir = resolvePath(baseDir, '.ai/task-manager');
  const metadataPath = resolvePath(destDir, '.init-metadata.json');

  // Check if source template directory exists
  if (!(await exists(sourceDir))) {
    throw new Error(`Template directory not found: ${sourceDir}`);
  }

  // Load existing metadata if present
  const existingMetadata = await loadMetadata(metadataPath);

  // Scenario 1: First-time init (no metadata) - copy all files
  if (!existingMetadata) {
    await logger.debug('First-time initialization detected');
    await fs.copy(sourceDir, destDir);
    await logger.debug(`📤 Copied ${sourceDir} to ${destDir}`);

    // Create initial metadata
    await createMetadata(sourceDir, destDir, metadataPath);
    return;
  }

  // Scenario 2: Force flag - overwrite all files
  if (force) {
    await logger.debug('Force flag detected, overwriting all files');
    await fs.copy(sourceDir, destDir, { overwrite: true });
    await logger.debug(`📤 Copied ${sourceDir} to ${destDir}`);

    // Update metadata
    await createMetadata(sourceDir, destDir, metadataPath);
    return;
  }

  // Scenario 3: Conflict detection - check for user modifications
  await logger.debug('Checking for file conflicts...');
  const conflicts = await detectConflicts(destDir, sourceDir, existingMetadata);

  if (conflicts.length === 0) {
    await logger.debug('No conflicts detected, updating files');
    await fs.copy(sourceDir, destDir, { overwrite: true });
    await logger.debug(`📤 Copied ${sourceDir} to ${destDir}`);

    // Update metadata
    await createMetadata(sourceDir, destDir, metadataPath);
    return;
  }

  // Conflicts detected - prompt user for resolution
  await logger.info(
    `⚠️  Detected ${conflicts.length} modified file(s). Prompting for resolution...`
  );
  const resolutions = await promptForConflicts(conflicts);

  // Apply resolutions
  await applyResolutions(sourceDir, destDir, resolutions);

  // Update metadata for all files (including resolved conflicts)
  await createMetadata(sourceDir, destDir, metadataPath);
}

/**
 * Create or update metadata file with current file hashes
 */
async function createMetadata(
  sourceDir: string,
  destDir: string,
  metadataPath: string
): Promise<void> {
  const files: Record<string, string> = {};

  // Get all config files (excluding scripts directory)
  async function walkDir(dir: string, relativeTo: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(relativeTo, fullPath);

      // Skip scripts directory
      if (relativePath.startsWith('config/scripts') || relativePath.includes('/scripts/')) {
        continue;
      }

      // Skip README.md (always overwrite on init/re-init)
      if (relativePath === 'README.md') {
        continue;
      }

      // Skip metadata file itself
      if (relativePath === '.init-metadata.json') {
        continue;
      }

      if (entry.isDirectory()) {
        await walkDir(fullPath, relativeTo);
      } else if (entry.isFile()) {
        // Calculate hash of the destination file (what we just copied)
        const destFilePath = path.join(destDir, relativePath);
        if (await exists(destFilePath)) {
          const hash = await calculateFileHash(destFilePath);
          files[relativePath] = hash;
        }
      }
    }
  }

  const configDir = path.join(destDir, 'config');
  if (await exists(configDir)) {
    await walkDir(configDir, destDir);
  }

  // Create metadata object
  const metadata = {
    version: getPackageVersion(),
    timestamp: new Date().toISOString(),
    files,
  };

  // Save metadata
  await saveMetadata(metadataPath, metadata);
  await logger.debug(`💾 Saved metadata to ${metadataPath}`);
}

/**
 * Apply user resolutions to file conflicts
 */
async function applyResolutions(
  sourceDir: string,
  destDir: string,
  resolutions: Map<string, ConflictResolution>
): Promise<void> {
  for (const [relativePath, resolution] of resolutions) {
    const sourcePath = path.join(sourceDir, relativePath);
    const destPath = path.join(destDir, relativePath);

    if (resolution === 'overwrite') {
      await fs.copy(sourcePath, destPath, { overwrite: true });
      await logger.debug(`📤 Overwrote ${relativePath}`);
    } else if (resolution === 'keep') {
      await logger.debug(`📌 Kept user version of ${relativePath}`);
      // Do nothing, keep user's file
    }
  }
}

/**
 * Create directory structure and copy templates for a specific assistant
 */
async function createAssistantStructure(assistant: Assistant, baseDir: string): Promise<void> {
  const sourceDir = getTemplatePath('assistant');
  const assistantDir = resolvePath(baseDir, `.${assistant}`);

  // Check if source template directory exists
  if (!(await exists(sourceDir))) {
    throw new Error(`Template directory not found: ${sourceDir}`);
  }

  // Copy entire template directory structure
  await fs.copy(sourceDir, assistantDir);
  await logger.debug(`📤 Copied ${sourceDir} to ${assistantDir}`);

  // OpenCode uses 'command' (singular) instead of 'commands' (plural)
  if (assistant === 'opencode') {
    const commandsDir = resolvePath(assistantDir, 'commands');
    const commandDir = resolvePath(assistantDir, 'command');

    if (await exists(commandsDir)) {
      await fs.move(commandsDir, commandDir);
      await logger.debug(`📁 Renamed 'commands' to 'command' for ${assistant}`);
    }
  }

  // Determine template format based on assistant type
  const templateFormat = getTemplateFormat(assistant);
  await logger.debug(`🎨 Using ${templateFormat} template format for ${assistant} assistant`);

  // If target format is different from source (md), process files in place
  if (templateFormat !== 'md') {
    const commandsPath = assistant === 'opencode' ? 'command' : 'commands';
    const tasksDir = resolvePath(assistantDir, `${commandsPath}/tasks`);
    const files = await fs.readdir(tasksDir);

    for (const file of files.filter(f => f.endsWith('.md'))) {
      const mdPath = resolvePath(tasksDir, file);
      const newPath = resolvePath(tasksDir, file.replace('.md', `.${templateFormat}`));

      // Read and process the template
      const processedContent = await readAndProcessTemplate(mdPath, templateFormat);

      // Write processed content to new file
      await writeProcessedTemplate(processedContent, newPath);

      // Remove original .md file
      await fs.remove(mdPath);

      await logger.debug(`⚡ Converted ${file} to ${templateFormat} format for ${assistant}`);
    }
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
  hasOpencodeConfig: boolean;
  assistants: Assistant[];
}> {
  const targetDir = baseDir || '.';
  const hasAiTaskManager = await exists(resolvePath(targetDir, '.ai/task-manager'));
  const hasClaudeConfig = await exists(resolvePath(targetDir, '.claude/commands/tasks'));
  const hasGeminiConfig = await exists(resolvePath(targetDir, '.gemini/commands/tasks'));
  const hasOpencodeConfig = await exists(resolvePath(targetDir, '.opencode/command/tasks'));

  const assistants: Assistant[] = [];
  if (hasClaudeConfig) assistants.push('claude');
  if (hasGeminiConfig) assistants.push('gemini');
  if (hasOpencodeConfig) assistants.push('opencode');

  return {
    hasAiTaskManager,
    hasClaudeConfig,
    hasGeminiConfig,
    hasOpencodeConfig,
    assistants,
  };
}

/**
 * Display formatted workflow help text to guide users after successful installation
 */
async function displayWorkflowHelp(): Promise<void> {
  const width = 60;
  const separator = '═'.repeat(width);
  const thinSeparator = '─'.repeat(width);

  console.log('');
  console.log(`╔${separator}╗`);
  console.log(`║${' '.repeat(22)}SUGGESTED WORKFLOW${' '.repeat(20)}║`);
  console.log(`╚${separator}╝`);
  console.log('');

  console.log(`┌─ ONE-TIME SETUP ${thinSeparator.slice(17)}┐`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  Review and tweak AI Task Manager config prompts to match  │`);
  console.log(`│  your project:${' '.repeat(45)}│`);
  console.log(`│    • .ai/task-manager/config/${' '.repeat(30)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`└${thinSeparator}┘`);
  console.log('');

  console.log(`┌─ DAY-TO-DAY WORKFLOW ${thinSeparator.slice(22)}┐`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  1) Create a plan:${' '.repeat(41)}│`);
  console.log(`│      /tasks:create-plan Create an authentication...${' '.repeat(8)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  2) Provide additional context if the assistant needs it${' '.repeat(3)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  3) MANUALLY REVIEW THE PLAN (don't skip this!)${' '.repeat(12)}│`);
  console.log(`│      Find it in: .ai/task-manager/plans/01--*/plan-[0-9]*--*.md${' '.repeat(4)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  4) Create the tasks for the plan:${' '.repeat(25)}│`);
  console.log(`│      /tasks:generate-tasks 1${' '.repeat(31)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  5) REVIEW THE TASKS LIST (avoid scope creep!)${' '.repeat(13)}│`);
  console.log(`│      Find them in: .ai/task-manager/plans/01--*/tasks/${' '.repeat(5)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  6) Execute the tasks:${' '.repeat(37)}│`);
  console.log(`│      /tasks:execute-blueprint 1${' '.repeat(28)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  7) Review the implementation and generated tests${' '.repeat(10)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`└${thinSeparator}┘`);
  console.log('');
  console.log('Pro tip: The manual review steps are crucial for success!');
  console.log('');
}
