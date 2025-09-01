/**
 * Conflict resolution system with user interaction
 */
import * as path from 'path';
import {
  FileConflict,
  ConflictResolution,
  InstallationConfig,
  FileSystemError,
  ResolvedConflict,
} from './types';
import { FileSystemUtils } from './utils';

export interface ConflictResolutionStrategy {
  resolveConflict(conflict: FileConflict): Promise<ConflictResolution>;
}

export class InteractiveConflictResolver implements ConflictResolutionStrategy {
  constructor(private promptFunction: (message: string, choices: string[]) => Promise<string>) {}

  async resolveConflict(conflict: FileConflict): Promise<ConflictResolution> {
    const choices = ['overwrite', 'skip', 'rename', 'backup-and-overwrite'];

    if (conflict.type === 'directory') {
      choices.push('merge');
    }

    const message = this.formatConflictMessage(conflict);
    const choice = await this.promptFunction(message, choices);

    switch (choice) {
      case 'overwrite':
        return { action: 'overwrite' };

      case 'skip':
        return { action: 'skip' };

      case 'rename': {
        const newName = await this.promptForNewName(conflict.path);
        return { action: 'rename', newName };
      }

      case 'backup-and-overwrite':
        return { action: 'overwrite', backupOriginal: true };

      case 'merge':
        return { action: 'merge' };

      default:
        return { action: 'skip' };
    }
  }

  private formatConflictMessage(conflict: FileConflict): string {
    const { existing, incoming } = conflict;
    const sizeFormatted = (size: number) => `${(size / 1024).toFixed(1)}KB`;

    return `
Conflict detected: ${conflict.path}
  Existing: ${sizeFormatted(existing.size)}, modified ${existing.modified.toISOString()}
  Incoming: ${sizeFormatted(incoming.size)}, ${incoming.checksum ? 'verified' : 'unverified'}
  
How would you like to resolve this conflict?`;
  }

  private async promptForNewName(originalPath: string): Promise<string> {
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);

    // Simple auto-rename strategy - in real implementation, would prompt user
    let counter = 1;
    let newName: string;

    do {
      const suffix = counter === 1 ? '.new' : `.new${counter}`;
      newName = path.join(dir, `${base}${suffix}${ext}`);
      counter++;
    } while ((await FileSystemUtils.pathExists(newName)) && counter < 100);

    return newName;
  }
}

export class AutoConflictResolver implements ConflictResolutionStrategy {
  constructor(private strategy: 'overwrite' | 'skip' | 'backup') {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolveConflict(_conflict: FileConflict): Promise<ConflictResolution> {
    switch (this.strategy) {
      case 'overwrite':
        return { action: 'overwrite' };

      case 'skip':
        return { action: 'skip' };

      case 'backup':
        return { action: 'overwrite', backupOriginal: true };

      default:
        return { action: 'skip' };
    }
  }
}

export class ConflictResolutionManager {
  private readonly strategies: Map<string, ConflictResolutionStrategy> = new Map();
  private defaultStrategy: ConflictResolutionStrategy;

  constructor(defaultStrategy?: ConflictResolutionStrategy) {
    this.defaultStrategy = defaultStrategy || new AutoConflictResolver('skip');
  }

  /**
   * Register a conflict resolution strategy
   */
  registerStrategy(name: string, strategy: ConflictResolutionStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Resolve all conflicts using appropriate strategies
   */
  async resolveConflicts(
    conflicts: FileConflict[],
    config: InstallationConfig
  ): Promise<ResolvedConflict[]> {
    const resolved: ResolvedConflict[] = [];

    for (const conflict of conflicts) {
      try {
        let resolution: ConflictResolution;

        // Determine resolution based on config
        switch (config.overwriteMode) {
          case 'ask': {
            const interactiveResolver = this.strategies.get('interactive') || this.defaultStrategy;
            resolution = await interactiveResolver.resolveConflict(conflict);
            break;
          }

          case 'overwrite':
            resolution = { action: 'overwrite', backupOriginal: config.createBackup };
            break;

          case 'skip':
            resolution = { action: 'skip' };
            break;

          case 'merge':
            resolution =
              conflict.type === 'directory'
                ? { action: 'merge' }
                : { action: 'overwrite', backupOriginal: config.createBackup };
            break;

          default:
            resolution = await this.defaultStrategy.resolveConflict(conflict);
        }

        const resolvedConflict: ResolvedConflict = {
          ...conflict,
          resolution,
          appliedAt: new Date(),
          success: false, // Will be updated when actually applied
        };

        resolved.push(resolvedConflict);
      } catch (error) {
        const resolvedConflict: ResolvedConflict = {
          ...conflict,
          resolution: { action: 'skip' },
          appliedAt: new Date(),
          success: false,
          error: `Failed to resolve conflict: ${error}`,
        };

        resolved.push(resolvedConflict);
      }
    }

    return resolved;
  }

  /**
   * Apply resolved conflicts to the file system
   */
  async applyResolutions(
    resolvedConflicts: ResolvedConflict[],
    targetDirectory: string,
    backupDirectory?: string
  ): Promise<void> {
    for (const conflict of resolvedConflicts) {
      try {
        const targetPath = path.join(targetDirectory, conflict.path);

        await this.applyResolution(conflict, targetPath, backupDirectory);
        conflict.success = true;
      } catch (error) {
        conflict.success = false;
        conflict.error = `Failed to apply resolution: ${error}`;
      }
    }
  }

  /**
   * Preview what actions would be taken for conflicts
   */
  async previewResolutions(
    conflicts: FileConflict[],
    config: InstallationConfig
  ): Promise<
    Array<{ conflict: FileConflict; resolution: ConflictResolution; description: string }>
  > {
    const preview: Array<{
      conflict: FileConflict;
      resolution: ConflictResolution;
      description: string;
    }> = [];

    for (const conflict of conflicts) {
      try {
        let resolution: ConflictResolution;

        // Simulate resolution without actual user interaction
        switch (config.overwriteMode) {
          case 'ask':
            resolution = { action: 'skip' }; // Default for preview
            break;

          case 'overwrite':
            resolution = { action: 'overwrite', backupOriginal: config.createBackup };
            break;

          case 'skip':
            resolution = { action: 'skip' };
            break;

          case 'merge':
            resolution =
              conflict.type === 'directory'
                ? { action: 'merge' }
                : { action: 'overwrite', backupOriginal: config.createBackup };
            break;

          default:
            resolution = { action: 'skip' };
        }

        const description = this.getResolutionDescription(resolution, conflict);

        preview.push({
          conflict,
          resolution,
          description,
        });
      } catch (error) {
        preview.push({
          conflict,
          resolution: { action: 'skip' },
          description: `Error determining resolution: ${error}`,
        });
      }
    }

    return preview;
  }

  /**
   * Apply a single conflict resolution
   */
  private async applyResolution(
    conflict: ResolvedConflict,
    targetPath: string,
    backupDirectory?: string
  ): Promise<void> {
    const { resolution } = conflict;

    switch (resolution.action) {
      case 'overwrite':
        if (resolution.backupOriginal && backupDirectory) {
          await FileSystemUtils.createBackup(targetPath, backupDirectory);
        }
        // File will be overwritten by normal installation process
        break;

      case 'skip':
        // Nothing to do - file will be skipped
        break;

      case 'rename':
        if (resolution.newName) {
          const newPath = path.join(path.dirname(targetPath), resolution.newName);
          // The incoming file will be written to the new path instead
          conflict.path = path.relative(path.dirname(targetPath), newPath);
        }
        break;

      case 'merge':
        if (conflict.type === 'directory') {
          // Directory merge will be handled by the installation process
          // by not overwriting the directory structure
        }
        break;

      default:
        throw this.createError(
          `Unknown resolution action: ${resolution.action}`,
          'UNKNOWN_RESOLUTION_ACTION'
        );
    }
  }

  /**
   * Get human-readable description of a resolution
   */
  private getResolutionDescription(resolution: ConflictResolution, conflict: FileConflict): string {
    switch (resolution.action) {
      case 'overwrite': {
        const backup = resolution.backupOriginal ? ' (with backup)' : '';
        return `Replace existing ${conflict.type}${backup}`;
      }

      case 'skip':
        return `Keep existing ${conflict.type}, skip new one`;

      case 'rename':
        return `Install new ${conflict.type} with name: ${resolution.newName}`;

      case 'merge':
        return `Merge directory contents`;

      default:
        return `Unknown action: ${resolution.action}`;
    }
  }

  /**
   * Create a FileSystemError with consistent structure
   */
  private createError(message: string, code: string, path?: string): FileSystemError {
    const error = new Error(message) as FileSystemError;
    error.code = code;
    error.path = path;
    error.operation = 'resolveConflict';
    return error;
  }
}

/**
 * Utility function to create a simple prompt-based interactive resolver
 */
export function createPromptBasedResolver(
  promptFn: (message: string, choices: string[]) => Promise<string>
): InteractiveConflictResolver {
  return new InteractiveConflictResolver(promptFn);
}

/**
 * Utility function to create conflict resolver from config
 */
export function createResolverFromConfig(config: InstallationConfig): ConflictResolutionManager {
  const manager = new ConflictResolutionManager();

  // Register interactive resolver if needed
  if (config.overwriteMode === 'ask') {
    // Note: This would need to be provided by the calling code
    // as it requires UI interaction capabilities
    const interactiveResolver = new AutoConflictResolver('skip'); // Fallback
    manager.registerStrategy('interactive', interactiveResolver);
  }

  return manager;
}
