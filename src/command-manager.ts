import fs from 'fs/promises';
import path from 'path';

export interface ClaudeCommand {
  filename: string;
  content: string;
  frontmatter: {
    argumentHint?: string;
    description?: string;
    [key: string]: any;
  };
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
   * Get all available Claude commands from the package
   */
  async getAvailableCommands(): Promise<ClaudeCommand[]> {
    try {
      const files = await fs.readdir(this.sourceCommandsPath);
      const commands: ClaudeCommand[] = [];

      for (const file of files) {
        if (path.extname(file) === '.md') {
          const filePath = path.join(this.sourceCommandsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const frontmatter = this.parseFrontmatter(content);

          commands.push({
            filename: file,
            content,
            frontmatter,
          });
        }
      }

      return commands;
    } catch (error) {
      throw new Error(`Failed to load available commands: ${error}`);
    }
  }

  /**
   * Install Claude commands to target repository
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