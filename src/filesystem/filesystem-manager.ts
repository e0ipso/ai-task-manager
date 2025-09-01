/**
 * Integrated file system manager that coordinates all filesystem operations
 * Integrates with existing TemplateManager and CommandManager
 */
import * as path from 'path';
import {
  InstallationConfig,
  InstallationPlan,
  InstallationOperation,
  InstallationResult,
  InstallationDetectionResult,
  VerificationResult,
  FileInfo,
  FileSystemError,
  FileSystemEvent,
  FileSystemEventHandler,
} from './types';
import { FileSystemUtils } from './utils';
import { InstallationDetector } from './installation-detector';
import { ConflictResolutionManager } from './conflict-resolver';
import { AtomicInstaller } from './atomic-installer';
import { InstallationVerifier } from './installation-verifier';
import { TemplateManager } from '../templates/template-manager';
import { CommandManager } from '../command-manager';

export interface FileSystemManagerConfig {
  templateManager?: TemplateManager;
  commandManager?: CommandManager;
  verificationEnabled?: boolean;
  eventHandlers?: FileSystemEventHandler[];
}

export class FileSystemManager {
  private readonly templateManager: TemplateManager;
  private readonly commandManager: CommandManager;
  private readonly detector: InstallationDetector;
  private readonly conflictResolver: ConflictResolutionManager;
  private readonly atomicInstaller: AtomicInstaller;
  private readonly verifier: InstallationVerifier;
  private readonly eventHandlers: FileSystemEventHandler[] = [];
  private readonly verificationEnabled: boolean;

  constructor(config: FileSystemManagerConfig = {}) {
    this.templateManager = config.templateManager || new TemplateManager();
    this.commandManager = config.commandManager || new CommandManager();
    this.detector = new InstallationDetector();
    this.conflictResolver = new ConflictResolutionManager();
    this.atomicInstaller = new AtomicInstaller();
    this.verifier = new InstallationVerifier();
    this.verificationEnabled = config.verificationEnabled !== false;

    if (config.eventHandlers) {
      this.eventHandlers.push(...config.eventHandlers);
    }
  }

  /**
   * Add event handler for filesystem operations
   */
  addEventListener(handler: FileSystemEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Remove event handler
   */
  removeEventListener(handler: FileSystemEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Complete AI task manager installation with all components
   */
  async installAITaskManager(
    targetDirectory: string,
    config: InstallationConfig = this.getDefaultConfig()
  ): Promise<InstallationResult> {
    try {
      this.emitEvent({ type: 'operation_start', timestamp: new Date() });

      // Step 1: Detect existing installation
      const detection = await this.detectInstallation(targetDirectory);

      // Step 2: Create installation plan
      const plan = await this.createInstallationPlan(targetDirectory, detection, config);

      // Step 3: Analyze and resolve conflicts
      if (plan.conflicts.length > 0) {
        this.emitEvent({
          type: 'conflict_detected',
          timestamp: new Date(),
          data: { conflicts: plan.conflicts },
        });

        const resolvedConflicts = await this.conflictResolver.resolveConflicts(
          plan.conflicts,
          config
        );

        await this.conflictResolver.applyResolutions(
          resolvedConflicts,
          targetDirectory,
          config.createBackup ? path.join(targetDirectory, '.ai', 'backups') : undefined
        );

        this.emitEvent({
          type: 'conflict_resolved',
          timestamp: new Date(),
          data: { resolvedConflicts },
        });
      }

      // Step 4: Execute atomic installation
      const result = await this.atomicInstaller.executeInstallationPlan(plan, config);

      // Step 5: Install Claude commands
      if (result.success) {
        await this.installClaudeCommands(targetDirectory, config);
      }

      // Step 6: Generate and save verification manifest
      if (result.success && this.verificationEnabled) {
        const packageJson = require('../../package.json');
        await this.verifier.generateManifest(result.operations, packageJson.version);

        const manifestPath = path.join(targetDirectory, '.ai', 'task-manager', 'MANIFEST.json');
        await this.verifier.saveManifest(manifestPath);
      }

      // Step 7: Verify installation
      if (result.success && this.verificationEnabled) {
        this.emitEvent({ type: 'verification_start', timestamp: new Date() });

        const verification = await this.verifier.verifyInstallation(targetDirectory);
        result.summary.bytesTransferred += verification.checkedFiles * 1024; // Estimate

        this.emitEvent({
          type: 'verification_complete',
          timestamp: new Date(),
          data: { verification },
        });

        if (!verification.valid) {
          result.success = false;
          result.errors.push({
            operation: { type: 'create_directory', target: targetDirectory },
            error: `Installation verification failed: ${verification.summary}`,
            code: 'VERIFICATION_FAILED',
            recoverable: false,
            timestamp: new Date(),
          });
        }
      }

      this.emitEvent({
        type: 'operation_complete',
        timestamp: new Date(),
        data: { result },
      });

      return result;
    } catch (error) {
      const errorEvent: FileSystemEvent = {
        type: 'operation_error',
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      };

      this.emitEvent(errorEvent);
      throw error;
    }
  }

  /**
   * Detect existing AI task manager installation
   */
  async detectInstallation(targetDirectory: string): Promise<InstallationDetectionResult> {
    return await this.detector.detectInstallation(targetDirectory);
  }

  /**
   * Verify existing installation
   */
  async verifyInstallation(targetDirectory: string): Promise<VerificationResult> {
    const manifestPath = path.join(targetDirectory, '.ai', 'task-manager', 'MANIFEST.json');

    if (await FileSystemUtils.pathExists(manifestPath)) {
      await this.verifier.loadManifest(manifestPath);
    }

    return await this.verifier.verifyInstallation(targetDirectory);
  }

  /**
   * Repair damaged installation
   */
  async repairInstallation(
    targetDirectory: string,
    config: InstallationConfig = this.getDefaultConfig()
  ): Promise<InstallationResult> {
    try {
      // Verify current state
      const verification = await this.verifyInstallation(targetDirectory);

      if (verification.valid) {
        // Nothing to repair
        return {
          success: true,
          operations: [],
          conflicts: [],
          errors: [],
          summary: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            skippedOperations: 0,
            filesCreated: 0,
            directoriesCreated: 0,
            conflictsResolved: 0,
            bytesTransferred: 0,
            duration: 0,
          },
        };
      }

      // Create repair plan based on issues
      const repairConfig: InstallationConfig = {
        ...config,
        overwriteMode: 'overwrite', // Force repair
        createBackup: true,
      };

      // Reinstall with repair configuration
      return await this.installAITaskManager(targetDirectory, repairConfig);
    } catch (error) {
      throw this.createError(
        `Installation repair failed: ${error}`,
        'REPAIR_FAILED',
        targetDirectory
      );
    }
  }

  /**
   * Uninstall AI task manager
   */
  async uninstallAITaskManager(targetDirectory: string): Promise<boolean> {
    try {
      const aiPath = path.join(targetDirectory, '.ai');
      const claudePath = path.join(targetDirectory, '.claude', 'commands', 'tasks');

      // Remove .ai directory
      if (await FileSystemUtils.pathExists(aiPath)) {
        await FileSystemUtils.remove(aiPath, { recursive: true });
      }

      // Remove Claude commands
      if (await FileSystemUtils.pathExists(claudePath)) {
        await FileSystemUtils.remove(claudePath, { recursive: true });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get installation status
   */
  async getInstallationStatus(targetDirectory: string): Promise<{
    isInstalled: boolean;
    version?: string;
    health: 'healthy' | 'partial' | 'corrupted' | 'unknown';
    details: {
      templates: boolean;
      commands: boolean;
      config: boolean;
    };
    lastVerified?: Date;
  }> {
    try {
      const detection = await this.detector.detectInstallation(targetDirectory);
      const commandStatus = await this.commandManager.getInstallationStatus(targetDirectory);

      let health: 'healthy' | 'partial' | 'corrupted' | 'unknown' = 'unknown';

      if (detection.isInstalled && commandStatus.isInstalled) {
        if (this.verificationEnabled) {
          const verification = await this.verifyInstallation(targetDirectory);
          health = verification.valid ? 'healthy' : 'corrupted';
        } else {
          health = 'healthy';
        }
      } else if (detection.partialInstallation || commandStatus.installedCommands.length > 0) {
        health = 'partial';
      }

      const result: {
        isInstalled: boolean;
        version?: string;
        health: 'healthy' | 'partial' | 'corrupted' | 'unknown';
        details: {
          templates: boolean;
          commands: boolean;
          config: boolean;
        };
        lastVerified?: Date;
      } = {
        isInstalled: detection.isInstalled && commandStatus.isInstalled,
        health,
        details: {
          templates: detection.isInstalled,
          commands: commandStatus.isInstalled,
          config: await FileSystemUtils.pathExists(
            path.join(targetDirectory, '.ai', 'task-manager', 'config.json')
          ),
        },
      };

      if (detection.version) {
        result.version = detection.version;
      }

      if (this.verificationEnabled) {
        result.lastVerified = new Date();
      }

      return result;
    } catch (error) {
      return {
        isInstalled: false,
        health: 'unknown',
        details: {
          templates: false,
          commands: false,
          config: false,
        },
      };
    }
  }

  /**
   * Create installation plan
   */
  private async createInstallationPlan(
    targetDirectory: string,
    detection: InstallationDetectionResult,
    config: InstallationConfig
  ): Promise<InstallationPlan> {
    const operations: Array<InstallationOperation> = [];
    let totalSize = 0;

    try {
      // Plan template installation
      const templateOperations = await this.planTemplateInstallation(targetDirectory);
      operations.push(...templateOperations);

      // Plan command installation
      const commandOperations = await this.planCommandInstallation(targetDirectory);
      operations.push(...commandOperations);

      // Calculate total size and conflicts
      const incomingFiles = new Map<string, FileInfo>();

      for (const operation of operations) {
        if (operation.source && operation.type === 'copy_file') {
          try {
            const fileInfo = await FileSystemUtils.getFileInfo(operation.source);
            incomingFiles.set(path.relative(targetDirectory, operation.target), fileInfo);
            totalSize += fileInfo.size;
          } catch (error) {
            // Skip files we can't analyze
          }
        }
      }

      // Analyze conflicts
      const conflicts = await this.detector.analyzeConflicts(targetDirectory, incomingFiles);

      return {
        targetDirectory,
        operations,
        conflicts,
        totalSize,
        estimatedTime: Math.max(operations.length * 100, 1000), // 100ms per operation minimum
        requiresBackup: config.createBackup && conflicts.length > 0,
      };
    } catch (error) {
      throw this.createError(
        `Failed to create installation plan: ${error}`,
        'PLAN_CREATION_FAILED',
        targetDirectory
      );
    }
  }

  /**
   * Plan template installation operations
   */
  private async planTemplateInstallation(
    targetDirectory: string
  ): Promise<InstallationOperation[]> {
    const operations: InstallationOperation[] = [];

    try {
      // Get available templates
      const templates = await this.templateManager.getAvailableTemplates();

      for (const templateName of templates) {
        const config = await this.templateManager.getTemplateConfig(templateName);
        const templateTarget = path.join(
          targetDirectory,
          '.ai',
          'task-manager',
          'templates',
          templateName
        );

        // Create template directory
        operations.push({
          type: 'create_directory',
          target: templateTarget,
          permissions: 0o755,
        });

        // Copy template files
        for (const file of config.files) {
          operations.push({
            type: 'copy_file',
            source: file.source,
            target: path.join(templateTarget, file.destination),
            permissions: 0o644,
          });
        }
      }
    } catch (error) {
      // Log error but don't fail - templates are optional
      console.warn(`Template planning failed: ${error}`);
    }

    return operations;
  }

  /**
   * Plan command installation operations
   */
  private async planCommandInstallation(targetDirectory: string): Promise<InstallationOperation[]> {
    const operations: InstallationOperation[] = [];

    try {
      const commands = await this.commandManager.getAvailableCommands();
      const commandsTarget = path.join(targetDirectory, '.claude', 'commands', 'tasks');

      // Create commands directory
      operations.push({
        type: 'create_directory',
        target: commandsTarget,
        permissions: 0o755,
      });

      // Copy command files
      for (const command of commands) {
        operations.push({
          type: 'copy_file',
          source: path.join(this.commandManager['sourceCommandsPath'], command.filename),
          target: path.join(commandsTarget, command.filename),
          permissions: 0o644,
        });
      }
    } catch (error) {
      console.warn(`Command planning failed: ${error}`);
    }

    return operations;
  }

  /**
   * Install Claude commands using CommandManager
   */
  private async installClaudeCommands(
    targetDirectory: string,
    config: InstallationConfig
  ): Promise<void> {
    try {
      await this.commandManager.installCommands(targetDirectory, {
        overwrite: config.overwriteMode === 'overwrite',
        validate: config.verifyIntegrity,
      });
    } catch (error) {
      throw this.createError(
        `Claude command installation failed: ${error}`,
        'COMMAND_INSTALLATION_FAILED',
        targetDirectory
      );
    }
  }

  /**
   * Get default installation configuration
   */
  private getDefaultConfig(): InstallationConfig {
    return {
      targetDirectory: process.cwd(),
      overwriteMode: 'ask',
      backupMode: 'auto',
      verifyIntegrity: true,
      createBackup: true,
      permissions: {
        files: 0o644,
        directories: 0o755,
      },
      dryRun: false,
    };
  }

  /**
   * Emit filesystem event to all handlers
   */
  private emitEvent(event: FileSystemEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch(error => {
            console.error('Event handler error:', error);
          });
        }
      } catch (error) {
        console.error('Event handler error:', error);
      }
    }
  }

  /**
   * Create a FileSystemError with consistent structure
   */
  private createError(message: string, code: string, filePath?: string): FileSystemError {
    const error = new Error(message) as FileSystemError;
    error.code = code;
    if (filePath) {
      error.path = filePath;
    }
    error.operation = 'filesystemManager';
    return error;
  }
}
