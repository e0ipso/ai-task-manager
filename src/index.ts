/**
 * Main Init Command Implementation
 *
 * This file contains the implementation of the init command
 * Handles initialization of new AI task management projects
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { InitOptions, Assistant, CommandResult, ConflictResolution } from './types';
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

// Visual formatting constants
const TERM_WIDTH = 80;
const DIVIDER = '─'.repeat(TERM_WIDTH);

/**
 * Format a section header with cyan styling
 */
function formatSectionHeader(title: string): string {
  return `\n${chalk.cyan.bold(title)}\n${chalk.cyan(DIVIDER)}\n`;
}

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

    // Parse and validate assistants
    const assistants = parseAssistants(options.assistants);
    validateAssistants(assistants);

    // ========== HEADER SECTION ==========
    console.log(chalk.bold.white('\nAI Task Manager Initialization'));
    console.log(chalk.gray(DIVIDER));

    // ========== CONFIGURATION SECTION ==========
    console.log(formatSectionHeader('Configuration'));
    console.log(`  ${chalk.cyan('●')} Target Directory: ${resolvedBaseDir}`);
    console.log(`  ${chalk.cyan('●')} Assistants: ${assistants.join(', ')}`);

    // ========== SETUP PROGRESS SECTION ==========
    console.log(formatSectionHeader('Setup Progress'));

    // Create .ai/task-manager structure
    console.log(`  ${chalk.green('✓')} Creating .ai/task-manager directory structure`);
    await fs.ensureDir(resolvePath(baseDir, '.ai/task-manager/plans'));
    await fs.ensureDir(resolvePath(baseDir, '.ai/task-manager/config/hooks'));

    // Copy common templates to .ai/task-manager with conflict detection
    console.log(`  ${chalk.green('✓')} Copying common template files`);
    await copyCommonTemplates(baseDir, options.force || false);

    // Create assistant-specific directories and copy templates
    for (const assistant of assistants) {
      console.log(`  ${chalk.green('✓')} Setting up ${assistant} assistant configuration`);
      await createAssistantStructure(assistant, baseDir);
    }

    // ========== CREATED FILES SECTION ==========
    console.log(formatSectionHeader('Created Files'));

    // Common configuration files
    console.log(chalk.cyan('  Common Configuration:'));
    console.log(
      `    ${chalk.blue('●')} ${resolvePath(baseDir, '.ai/task-manager/config/TASK_MANAGER.md')}`
    );
    console.log(
      `    ${chalk.blue('●')} ${resolvePath(baseDir, '.ai/task-manager/config/hooks/POST_PHASE.md')}`
    );
    console.log(
      `    ${chalk.blue('●')} ${resolvePath(baseDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md')}`
    );

    // Assistant-specific files
    for (const assistant of assistants) {
      const templateFormat = getTemplateFormat(assistant);
      // Open Code uses 'command' (singular) instead of 'commands' (plural)
      const commandsPath = assistant === 'opencode' ? 'command' : 'commands';

      console.log(
        chalk.cyan(`  ${assistant.charAt(0).toUpperCase() + assistant.slice(1)} Commands:`)
      );
      console.log(
        `    ${chalk.blue('●')} ${resolvePath(baseDir, `.${assistant}/${commandsPath}/tasks/create-plan.${templateFormat}`)}`
      );
      console.log(
        `    ${chalk.blue('●')} ${resolvePath(baseDir, `.${assistant}/${commandsPath}/tasks/execute-blueprint.${templateFormat}`)}`
      );
      console.log(
        `    ${chalk.blue('●')} ${resolvePath(baseDir, `.${assistant}/${commandsPath}/tasks/generate-tasks.${templateFormat}`)}`
      );

      // Only show agents for Claude
      if (assistant === 'claude') {
        console.log(
          chalk.cyan(`  ${assistant.charAt(0).toUpperCase() + assistant.slice(1)} Agents:`)
        );
        console.log(
          `    ${chalk.blue('●')} ${resolvePath(baseDir, `.${assistant}/agents/plan-creator.md`)}`
        );
      }
    }

    // ========== FOOTER SECTION ==========
    console.log(`\n${chalk.green('✓')} AI Task Manager initialized successfully!`);
    console.log(chalk.gray(DIVIDER));

    // Add documentation link
    console.log(`\n  📚 Documentation: ${chalk.cyan('https://mateuaguilo.com/ai-task-manager')}\n`);

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
    console.error(chalk.red(`\n✗ Initialization failed: ${errorMessage}\n`));

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
    await fs.copy(sourceDir, destDir);
    // Create initial metadata
    await createMetadata(sourceDir, destDir, metadataPath);
    return;
  }

  // Scenario 2: Force flag - overwrite all files
  if (force) {
    await fs.copy(sourceDir, destDir, { overwrite: true });
    // Update metadata
    await createMetadata(sourceDir, destDir, metadataPath);
    return;
  }

  // Scenario 3: Conflict detection - check for user modifications
  const conflicts = await detectConflicts(destDir, sourceDir, existingMetadata);

  if (conflicts.length === 0) {
    await fs.copy(sourceDir, destDir, { overwrite: true });
    // Update metadata
    await createMetadata(sourceDir, destDir, metadataPath);
    return;
  }

  // Conflicts detected - prompt user for resolution
  console.log(
    chalk.yellow(
      `\n⚠  Detected ${conflicts.length} modified file(s). Prompting for resolution...\n`
    )
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
    }
    // If 'keep', do nothing - keep user's file
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

  // Determine correct commands directory name based on assistant type
  // OpenCode uses 'command' (singular) while Claude and Gemini use 'commands' (plural)
  const commandsPath = assistant === 'opencode' ? 'command' : 'commands';

  // Copy template structure with correct directory naming
  const sourceCommandsDir = resolvePath(sourceDir, 'commands');
  const targetCommandsDir = resolvePath(assistantDir, commandsPath);

  // Copy the commands directory to the correct location
  if (await exists(sourceCommandsDir)) {
    await fs.copy(sourceCommandsDir, targetCommandsDir);
  }

  // Copy agent files for Claude (agents are Claude-specific)
  if (assistant === 'claude') {
    const sourceAgentsDir = resolvePath(sourceDir, 'agents');
    const targetAgentsDir = resolvePath(assistantDir, 'agents');

    if (await exists(sourceAgentsDir)) {
      await fs.copy(sourceAgentsDir, targetAgentsDir);
    }
  }

  // Determine template format based on assistant type
  const templateFormat = getTemplateFormat(assistant);

  // If target format is different from source (md), process files in place
  if (templateFormat !== 'md') {
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
  console.log(formatSectionHeader('Suggested Workflow'));

  // One-Time Setup
  console.log(chalk.cyan.bold('  One-Time Setup'));
  console.log(
    chalk.gray('  ────────────────────────────────────────────────────────────────────────────────')
  );
  console.log(`  Review and tweak AI Task Manager config prompts to match your project:`);
  console.log(`    ${chalk.blue('●')} ${chalk.gray('.ai/task-manager/config/')}`);
  console.log('');

  // Automated Workflow
  console.log(chalk.cyan.bold('  Automated Workflow (Recommended for Simple Tasks)'));
  console.log(
    chalk.gray('  ────────────────────────────────────────────────────────────────────────────────')
  );
  console.log('');
  console.log(`  Execute:`);
  console.log(`      ${chalk.gray('/tasks:full-workflow Update product page with...')}`);
  console.log('');
  console.log(`  This automatically:`);
  console.log(`    ${chalk.green('✓')} Creates the plan (with clarification prompts)`);
  console.log(`    ${chalk.green('✓')} Generates tasks`);
  console.log(`    ${chalk.green('✓')} Executes the blueprint`);
  console.log(`    ${chalk.green('✓')} Archives the completed plan`);
  console.log('');
  console.log(`  ${chalk.blue('●')} Best for: Straightforward implementations`);
  console.log('');

  // Manual Workflow
  console.log(chalk.cyan.bold('  Manual Workflow (Recommended for Complex Tasks)'));
  console.log(
    chalk.gray('  ────────────────────────────────────────────────────────────────────────────────')
  );
  console.log('');
  console.log(`  ${chalk.blue('1.')} Create a plan:`);
  console.log(`      ${chalk.gray('/tasks:create-plan Create an authentication...')}`);
  console.log('');
  console.log(`  ${chalk.blue('2.')} Provide additional context if the assistant needs it`);
  console.log('');
  console.log(
    `  ${chalk.blue('3.')} ${chalk.yellow.bold('MANUALLY REVIEW THE PLAN')} ${chalk.yellow("(don't skip this!")}`
  );
  console.log(`      ${chalk.gray('Find it in: .ai/task-manager/plans/01--*/plan-[0-9]*--*.md')}`);
  console.log('');
  console.log(`  ${chalk.blue('4.')} Create the tasks for the plan:`);
  console.log(`      ${chalk.gray('/tasks:generate-tasks 1')}`);
  console.log('');
  console.log(
    `  ${chalk.blue('5.')} ${chalk.yellow.bold('REVIEW THE TASKS LIST')} ${chalk.yellow('(avoid scope creep!)')}`
  );
  console.log(`      ${chalk.gray('Find them in: .ai/task-manager/plans/01--*/tasks/')}`);
  console.log('');
  console.log(`  ${chalk.blue('6.')} Execute the tasks:`);
  console.log(`      ${chalk.gray('/tasks:execute-blueprint 1')}`);
  console.log('');
  console.log(`  ${chalk.blue('7.')} Review the implementation and generated tests`);
  console.log('');
  console.log(chalk.yellow(`💡 Pro tip: The manual review steps are crucial for success!`));
  console.log('');
}
