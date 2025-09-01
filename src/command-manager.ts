import fs from 'fs/promises';
import path from 'path';
import { AssistantConfig } from './types/assistant-config';

export interface ClaudeCommand {
  filename: string;
  content: string;
  frontmatter: {
    argumentHint?: string;
    description?: string;
    [key: string]: any;
  };
}

export interface CommandFile {
  filename: string;
  content: string;
  frontmatter: {
    argumentHint?: string;
    description?: string;
    [key: string]: any;
  };
  filePath?: string;
}

export interface CommandInstallationResult {
  installed: ClaudeCommand[];
  skipped: ClaudeCommand[];
  errors: { command: string; error: string }[];
}

export class CommandManager {
  private sourceCommandsPath: string;

  constructor() {
    // Path to the embedded commands in the NPX package
    this.sourceCommandsPath = path.join(__dirname, '..', 'commands', 'tasks');
  }

  /**
   * Get command files from a specific directory
   */
  async getCommandFiles(sourceDirectory: string): Promise<CommandFile[]> {
    try {
      const files = await fs.readdir(sourceDirectory);
      const commands: CommandFile[] = [];

      for (const file of files) {
        if (path.extname(file) === '.md') {
          const filePath = path.join(sourceDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const frontmatter = this.parseFrontmatter(content);

          commands.push({
            filename: file,
            content,
            frontmatter,
            filePath,
          });
        }
      }

      return commands;
    } catch (error) {
      throw new Error(`Failed to load commands from ${sourceDirectory}: ${error}`);
    }
  }

  /**
   * Get all available Claude commands from the package
   */
  async getAvailableCommands(): Promise<ClaudeCommand[]> {
    try {
      const commands = await this.getCommandFiles(this.sourceCommandsPath);
      return commands.map(({ filePath, ...rest }) => rest as ClaudeCommand);
    } catch (error) {
      throw new Error(`Failed to load available commands: ${error}`);
    }
  }

  /**
   * Copy command files to a specific target directory
   */
  private async copyCommandsToTarget(
    commands: CommandFile[],
    targetPath: string,
    options: {
      overwrite?: boolean;
      validate?: boolean;
      preservePermissions?: boolean;
    } = {}
  ): Promise<{
    installed: CommandFile[];
    skipped: CommandFile[];
    errors: { command: string; error: string }[];
  }> {
    const { overwrite = false, validate = true, preservePermissions = true } = options;
    const result = {
      installed: [] as CommandFile[],
      skipped: [] as CommandFile[],
      errors: [] as { command: string; error: string }[],
    };

    // Ensure target directory exists
    await this.ensureDirectoryExists(targetPath);

    for (const command of commands) {
      try {
        const targetFilePath = path.join(targetPath, command.filename);
        const exists = await this.fileExists(targetFilePath);

        // Skip if file exists and overwrite is false
        if (exists && !overwrite) {
          result.skipped.push(command);
          continue;
        }

        // Validate command if requested
        if (validate && !this.validateCommandFile(command)) {
          result.errors.push({
            command: command.filename,
            error: 'Command validation failed: missing required frontmatter',
          });
          continue;
        }

        // Copy command file
        await fs.writeFile(targetFilePath, command.content, 'utf-8');
        
        // Set proper permissions if requested
        if (preservePermissions) {
          await fs.chmod(targetFilePath, 0o644);
        }

        result.installed.push(command);
      } catch (error) {
        result.errors.push({
          command: command.filename,
          error: `Failed to copy: ${error}`,
        });
      }
    }

    return result;
  }

  /**
   * Install commands to multiple assistant directories simultaneously
   */
  async installCommandsForAssistants(
    sourceDirectory: string,
    targetDirectory: string,
    assistantConfig: AssistantConfig,
    options: {
      overwrite?: boolean;
      validate?: boolean;
      rollbackOnFailure?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    results: Record<string, CommandInstallationResult>;
    rollbackPerformed?: boolean;
    errors: string[];
  }> {
    const { overwrite = false, validate = true, rollbackOnFailure = true } = options;
    const results: Record<string, CommandInstallationResult> = {};
    const errors: string[] = [];
    const installedPaths: string[] = [];
    let allSuccessful = true;

    try {
      // Validate paths before proceeding
      const installationPaths = assistantConfig.installationTargets.map(target => target.tasksDirectory);
      const pathValidation = await this.validateInstallationPaths(sourceDirectory, installationPaths);
      
      if (!pathValidation.valid) {
        return {
          success: false,
          results: {},
          errors: [`Path validation failed: ${pathValidation.errors.join(', ')}`],
        };
      }

      // Get command files from source
      const commands = await this.getCommandFiles(sourceDirectory);
      
      if (commands.length === 0) {
        return {
          success: false,
          results: {},
          errors: ['No command files found in source directory'],
        };
      }

      // Install to each assistant target
      for (const target of assistantConfig.installationTargets) {
        try {
          const targetPath = target.tasksDirectory;
          const copyResult = await this.copyCommandsToTarget(commands, targetPath, {
            overwrite,
            validate,
            preservePermissions: true,
          });

          // Convert to CommandInstallationResult format
          const installationResult: CommandInstallationResult = {
            installed: copyResult.installed.map(({ filePath, ...rest }) => rest as ClaudeCommand),
            skipped: copyResult.skipped.map(({ filePath, ...rest }) => rest as ClaudeCommand),
            errors: copyResult.errors,
          };

          results[target.assistant] = installationResult;

          // Track successful installations for potential rollback
          if (copyResult.installed.length > 0) {
            installedPaths.push(targetPath);
          }

          // Check if this installation had errors
          if (copyResult.errors.length > 0) {
            allSuccessful = false;
            errors.push(`Errors installing to ${target.assistant}: ${copyResult.errors.map(e => e.error).join(', ')}`);
          }

        } catch (error) {
          allSuccessful = false;
          const errorMsg = `Failed to install commands for ${target.assistant}: ${error}`;
          errors.push(errorMsg);
          
          results[target.assistant] = {
            installed: [],
            skipped: [],
            errors: [{ command: 'all', error: errorMsg }],
          };
        }
      }

      // Handle rollback if requested and there were failures
      let rollbackPerformed = false;
      if (!allSuccessful && rollbackOnFailure && installedPaths.length > 0) {
        try {
          await this.performRollback(installedPaths, commands);
          rollbackPerformed = true;
        } catch (rollbackError) {
          errors.push(`Rollback failed: ${rollbackError}`);
        }
      }

      return {
        success: allSuccessful,
        results,
        rollbackPerformed,
        errors,
      };

    } catch (error) {
      return {
        success: false,
        results: {},
        errors: [`Installation failed: ${error}`],
      };
    }
  }

  /**
   * Install commands for a single assistant (convenience method)
   */
  async installCommandsForSingleAssistant(
    sourceDirectory: string,
    targetDirectory: string,
    assistantType: 'claude' | 'gemini',
    options: {
      overwrite?: boolean;
      validate?: boolean;
    } = {}
  ): Promise<CommandInstallationResult> {
    // Validate assistant type
    const validAssistants = ['claude', 'gemini'] as const;
    if (!validAssistants.includes(assistantType as any)) {
      throw new Error(`Invalid assistant type: ${assistantType}. Supported types: ${validAssistants.join(', ')}`);
    }

    try {
      // Import here to avoid circular dependency issues
      const { createAssistantConfig } = await import('./types/assistant-config');
      
      // Create a minimal config for single assistant
      const assistantConfig = createAssistantConfig([assistantType], targetDirectory);
      
      // Use the multi-assistant method
      const result = await this.installCommandsForAssistants(
        sourceDirectory,
        targetDirectory,
        assistantConfig,
        {
          ...options,
          rollbackOnFailure: false, // Don't rollback for single assistant
        }
      );

      // Return the result for the specific assistant
      const assistantResult = result.results[assistantType];
      if (!assistantResult) {
        throw new Error(`No installation result found for ${assistantType}`);
      }

      return assistantResult;
    } catch (error) {
      throw new Error(`Failed to install commands for ${assistantType}: ${error}`);
    }
  }

  /**
   * Install Claude commands to target repository (legacy method for backwards compatibility)
   */
  async installCommands(
    targetDir: string = process.cwd(),
    options: {
      overwrite?: boolean;
      validate?: boolean;
    } = {}
  ): Promise<CommandInstallationResult> {
    const { overwrite = false, validate = true } = options;
    const targetCommandsPath = path.join(targetDir, '.claude', 'commands', 'tasks');
    const result: CommandInstallationResult = {
      installed: [],
      skipped: [],
      errors: [],
    };

    try {
      // Ensure target directory exists
      await this.ensureDirectoryExists(targetCommandsPath);

      // Get available commands
      const commands = await this.getAvailableCommands();

      for (const command of commands) {
        try {
          const targetFilePath = path.join(targetCommandsPath, command.filename);
          const exists = await this.fileExists(targetFilePath);

          // Skip if file exists and overwrite is false
          if (exists && !overwrite) {
            result.skipped.push(command);
            continue;
          }

          // Validate command if requested
          if (validate && !this.validateCommand(command)) {
            result.errors.push({
              command: command.filename,
              error: 'Command validation failed: missing required frontmatter',
            });
            continue;
          }

          // Copy command file
          await fs.writeFile(targetFilePath, command.content, 'utf-8');
          
          // Set proper permissions (readable/writable by owner, readable by group)
          await fs.chmod(targetFilePath, 0o644);

          result.installed.push(command);
        } catch (error) {
          result.errors.push({
            command: command.filename,
            error: `Failed to install: ${error}`,
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to install commands: ${error}`);
    }
  }

  /**
   * Check if Claude commands are already installed in target directory
   */
  async isInstalled(targetDir: string = process.cwd()): Promise<boolean> {
    const targetCommandsPath = path.join(targetDir, '.claude', 'commands', 'tasks');
    
    try {
      const stats = await fs.stat(targetCommandsPath);
      if (!stats.isDirectory()) {
        return false;
      }

      // Check if at least one command file exists
      const files = await fs.readdir(targetCommandsPath);
      return files.some(file => path.extname(file) === '.md');
    } catch {
      return false;
    }
  }

  /**
   * Get status of installed commands
   */
  async getInstallationStatus(targetDir: string = process.cwd()): Promise<{
    isInstalled: boolean;
    installedCommands: string[];
    missingCommands: string[];
    conflictingCommands: string[];
  }> {
    const targetCommandsPath = path.join(targetDir, '.claude', 'commands', 'tasks');
    const availableCommands = await this.getAvailableCommands();
    const availableFilenames = availableCommands.map(cmd => cmd.filename);

    const status = {
      isInstalled: false,
      installedCommands: [] as string[],
      missingCommands: [] as string[],
      conflictingCommands: [] as string[],
    };

    try {
      const stats = await fs.stat(targetCommandsPath);
      if (!stats.isDirectory()) {
        status.missingCommands = availableFilenames;
        return status;
      }

      const installedFiles = await fs.readdir(targetCommandsPath);
      const installedMdFiles = installedFiles.filter(file => path.extname(file) === '.md');

      // Check which commands are installed
      for (const filename of availableFilenames) {
        if (installedMdFiles.includes(filename)) {
          // Verify content matches (simple check)
          try {
            const installedFilePath = path.join(targetCommandsPath, filename);
            const installedContent = await fs.readFile(installedFilePath, 'utf-8');
            const originalCommand = availableCommands.find(cmd => cmd.filename === filename);
            
            if (originalCommand && installedContent === originalCommand.content) {
              status.installedCommands.push(filename);
            } else {
              status.conflictingCommands.push(filename);
            }
          } catch {
            status.conflictingCommands.push(filename);
          }
        } else {
          status.missingCommands.push(filename);
        }
      }

      status.isInstalled = status.installedCommands.length === availableFilenames.length;
      return status;
    } catch {
      status.missingCommands = availableFilenames;
      return status;
    }
  }

  /**
   * Parse frontmatter from markdown content
   */
  private parseFrontmatter(content: string): { [key: string]: any } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    
    if (!match || !match[1]) {
      return {};
    }

    const frontmatterString = match[1];
    const frontmatter: { [key: string]: any } = {};

    // Simple YAML-like parsing for basic key-value pairs
    const lines = frontmatterString.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        frontmatter[key] = value;
      }
    }

    return frontmatter;
  }

  /**
   * Validate that a command has required frontmatter
   */
  private validateCommand(command: ClaudeCommand): boolean {
    // Check for required frontmatter fields
    return !!(
      command.frontmatter.description &&
      command.content.includes('---') && // Has frontmatter block
      command.content.length > 100 // Has substantial content
    );
  }

  /**
   * Validate that a command file has required frontmatter
   */
  private validateCommandFile(command: CommandFile): boolean {
    // Check for required frontmatter fields
    return !!(
      command.frontmatter.description &&
      command.content.includes('---') && // Has frontmatter block
      command.content.length > 100 // Has substantial content
    );
  }

  /**
   * Perform rollback by removing installed command files
   */
  private async performRollback(
    installedPaths: string[],
    commands: CommandFile[]
  ): Promise<void> {
    const rollbackErrors: string[] = [];

    for (const targetPath of installedPaths) {
      for (const command of commands) {
        try {
          const filePath = path.join(targetPath, command.filename);
          const exists = await this.fileExists(filePath);
          
          if (exists) {
            await fs.unlink(filePath);
          }
        } catch (error) {
          rollbackErrors.push(`Failed to remove ${command.filename} from ${targetPath}: ${error}`);
        }
      }
    }

    if (rollbackErrors.length > 0) {
      throw new Error(`Rollback completed with errors: ${rollbackErrors.join('; ')}`);
    }
  }

  /**
   * Validate paths and permissions before installation
   */
  private async validateInstallationPaths(
    sourceDirectory: string,
    installationPaths: string[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check source directory
    try {
      const sourceStat = await fs.stat(sourceDirectory);
      if (!sourceStat.isDirectory()) {
        errors.push(`Source path is not a directory: ${sourceDirectory}`);
      }
    } catch (error) {
      errors.push(`Source directory does not exist or is not accessible: ${sourceDirectory}`);
    }

    // Check each installation path
    for (const targetPath of installationPaths) {
      try {
        // Check if parent directory exists or can be created
        const parentDir = path.dirname(targetPath);
        try {
          await fs.access(parentDir);
        } catch {
          // Parent doesn't exist, check if we can create it
          try {
            await fs.mkdir(parentDir, { recursive: true, mode: 0o755 });
            // Clean up test directory creation
            await fs.rmdir(parentDir).catch(() => {}); // Ignore errors
          } catch (error) {
            errors.push(`Cannot create parent directory for: ${targetPath}`);
          }
        }
      } catch (error) {
        errors.push(`Invalid target path: ${targetPath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get detailed installation summary
   */
  private formatInstallationSummary(
    results: Record<string, CommandInstallationResult>
  ): {
    totalInstalled: number;
    totalSkipped: number;
    totalErrors: number;
    assistantSummary: Array<{
      assistant: string;
      installed: number;
      skipped: number;
      errors: number;
    }>;
  } {
    let totalInstalled = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const assistantSummary = [];

    for (const [assistant, result] of Object.entries(results)) {
      const installed = result.installed.length;
      const skipped = result.skipped.length;
      const errors = result.errors.length;

      totalInstalled += installed;
      totalSkipped += skipped;
      totalErrors += errors;

      assistantSummary.push({
        assistant,
        installed,
        skipped,
        errors,
      });
    }

    return {
      totalInstalled,
      totalSkipped,
      totalErrors,
      assistantSummary,
    };
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}