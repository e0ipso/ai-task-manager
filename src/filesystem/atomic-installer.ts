/**
 * Atomic file operations with rollback capability
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  InstallationPlan,
  InstallationOperation,
  InstallationResult,
  CompletedOperation,
  InstallationConfig,
  RollbackData,
  RollbackOperation,
  BackupInfo,
  FileSystemError,
  AtomicOperationContext,
} from './types';
import { FileSystemUtils } from './utils';

export class AtomicInstaller {
  private currentContext: AtomicOperationContext | null = null;
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'ai-task-manager-atomic');
  }

  /**
   * Execute installation plan atomically
   */
  async executeInstallationPlan(
    plan: InstallationPlan,
    config: InstallationConfig
  ): Promise<InstallationResult> {
    const startTime = Date.now();
    const operationId = `install-${Date.now()}`;

    const result: InstallationResult = {
      success: false,
      operations: [],
      conflicts: [],
      errors: [],
      summary: {
        totalOperations: plan.operations.length,
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

    try {
      // Create atomic operation context
      this.currentContext = await FileSystemUtils.createAtomicContext(operationId);
      result.rollbackData = this.currentContext.rollbackData;

      // Prepare staging area
      await this.prepareStagingArea();

      // Execute operations in staging area first
      await this.executeOperationsInStaging(plan.operations, config, result);

      // If dry run, don't commit
      if (config.dryRun) {
        result.success = result.errors.length === 0;
        await this.cleanup();
        return result;
      }

      // Commit operations if all succeeded
      if (result.errors.length === 0) {
        await this.commitOperations(result);
        result.success = true;
      } else {
        await this.rollbackOperations(result);
      }

      // Calculate final summary
      result.summary.duration = Date.now() - startTime;
      result.summary.successfulOperations = result.operations.filter(op => op.completed).length;
      result.summary.failedOperations = result.errors.length;

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push({
        operation: {
          type: 'create_directory',
          target: plan.targetDirectory,
        },
        error: `Installation failed: ${error}`,
        code: 'INSTALLATION_FAILED',
        recoverable: false,
        timestamp: new Date(),
      });

      // Attempt rollback
      if (this.currentContext) {
        await this.rollbackOperations(result);
      }

      return result;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Rollback completed operations
   */
  async rollbackInstallation(rollbackData: RollbackData): Promise<boolean> {
    try {
      for (const operation of rollbackData.operations.reverse()) {
        await this.executeRollbackOperation(operation);
      }

      // Restore backups
      for (const backup of rollbackData.backups.reverse()) {
        await this.restoreBackup(backup);
      }

      return true;
    } catch (error) {
      console.error(`Rollback failed: ${error}`);
      return false;
    }
  }

  /**
   * Verify installation integrity after completion
   */
  async verifyInstallation(
    operations: CompletedOperation[],
    config: InstallationConfig
  ): Promise<boolean> {
    if (!config.verifyIntegrity) {
      return true;
    }

    try {
      for (const operation of operations) {
        if (!operation.completed) continue;

        switch (operation.type) {
          case 'copy_file':
            if (!(await this.verifyFileOperation(operation))) {
              return false;
            }
            break;

          case 'create_directory':
            if (!(await FileSystemUtils.pathExists(operation.target))) {
              return false;
            }
            break;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Prepare staging area for atomic operations
   */
  private async prepareStagingArea(): Promise<void> {
    if (!this.currentContext) {
      throw new Error('No atomic context available');
    }

    try {
      await FileSystemUtils.createDirectory(this.currentContext.tempDirectory);
    } catch (error) {
      throw this.createError(`Failed to prepare staging area: ${error}`, 'STAGING_AREA_FAILED');
    }
  }

  /**
   * Execute operations in staging area
   */
  private async executeOperationsInStaging(
    operations: InstallationOperation[],
    config: InstallationConfig,
    result: InstallationResult
  ): Promise<void> {
    if (!this.currentContext) {
      throw new Error('No atomic context available');
    }

    for (const operation of operations) {
      const completedOperation: CompletedOperation = {
        ...operation,
        completed: false,
        timestamp: new Date(),
      };

      try {
        await this.executeOperation(operation, config);
        completedOperation.completed = true;

        // Calculate checksum for files
        if (operation.type === 'copy_file' && operation.source) {
          completedOperation.checksum = await FileSystemUtils.calculateChecksum(operation.source);
        }

        result.operations.push(completedOperation);

        // Update summary
        if (operation.type === 'copy_file') {
          result.summary.filesCreated++;
          if (operation.source) {
            const stats = await fs.stat(operation.source);
            result.summary.bytesTransferred += stats.size;
          }
        } else if (operation.type === 'create_directory') {
          result.summary.directoriesCreated++;
        }
      } catch (error) {
        completedOperation.error = error instanceof Error ? error.message : String(error);
        result.operations.push(completedOperation);

        result.errors.push({
          operation,
          error: completedOperation.error,
          code: 'OPERATION_FAILED',
          recoverable: !operation.skipOnError,
          timestamp: new Date(),
        });

        // Stop on non-recoverable errors
        if (!operation.skipOnError) {
          break;
        }
      }
    }
  }

  /**
   * Execute a single operation in staging
   */
  private async executeOperation(
    operation: InstallationOperation,
    config: InstallationConfig
  ): Promise<void> {
    if (!this.currentContext) {
      throw new Error('No atomic context available');
    }

    const stagingTarget = path.join(
      this.currentContext.tempDirectory,
      path.relative(path.parse(operation.target).root, operation.target)
    );

    switch (operation.type) {
      case 'create_directory':
        await FileSystemUtils.createDirectory(stagingTarget, { mode: operation.permissions });

        // Add to rollback operations
        this.currentContext.rollbackData.operations.push({
          type: 'remove_directory',
          path: operation.target,
        });
        break;

      case 'copy_file':
        if (!operation.source) {
          throw new Error('Source path required for copy_file operation');
        }

        // Ensure staging directory exists
        await FileSystemUtils.createDirectory(path.dirname(stagingTarget));

        // Copy to staging
        await FileSystemUtils.copyFileWithVerification(operation.source, stagingTarget, {
          preservePermissions: true,
          preserveTimestamps: true,
          verifyIntegrity: config.verifyIntegrity,
        });

        // Set permissions if specified
        if (operation.permissions && process.platform !== 'win32') {
          await fs.chmod(stagingTarget, operation.permissions);
        }

        // Create backup if needed
        if (config.createBackup && (await FileSystemUtils.pathExists(operation.target))) {
          const backupPath = await this.createBackup(operation.target, operation.backup);
          this.currentContext.rollbackData.backups.push({
            originalPath: operation.target,
            backupPath,
            timestamp: new Date(),
            size: (await fs.stat(operation.target)).size,
            checksum: await FileSystemUtils.calculateChecksum(operation.target),
          });
        }

        // Add to rollback operations
        this.currentContext.rollbackData.operations.push({
          type: 'delete_file',
          path: operation.target,
          backupPath: operation.backup,
        });
        break;

      case 'set_permissions':
        if (operation.permissions && process.platform !== 'win32') {
          // Store original permissions for rollback
          if (await FileSystemUtils.pathExists(operation.target)) {
            const stats = await fs.stat(operation.target);
            this.currentContext.rollbackData.operations.push({
              type: 'restore_permissions',
              path: operation.target,
              originalPermissions: stats.mode,
            });
          }
        }
        break;

      default:
        throw this.createError(
          `Unknown operation type: ${operation.type}`,
          'UNKNOWN_OPERATION_TYPE'
        );
    }
  }

  /**
   * Commit operations from staging to final destination
   */
  private async commitOperations(result: InstallationResult): Promise<void> {
    if (!this.currentContext) {
      throw new Error('No atomic context available');
    }

    try {
      // Move files from staging to final destination
      await this.moveFromStaging(result.operations);

      // Mark as committed
      this.currentContext.committed = true;
    } catch (error) {
      throw this.createError(`Failed to commit operations: ${error}`, 'COMMIT_FAILED');
    }
  }

  /**
   * Move files from staging area to final destination
   */
  private async moveFromStaging(operations: CompletedOperation[]): Promise<void> {
    if (!this.currentContext) {
      throw new Error('No atomic context available');
    }

    for (const operation of operations) {
      if (!operation.completed) continue;

      const stagingTarget = path.join(
        this.currentContext.tempDirectory,
        path.relative(path.parse(operation.target).root, operation.target)
      );

      switch (operation.type) {
        case 'create_directory':
          await FileSystemUtils.createDirectory(operation.target, {
            mode: operation.permissions,
          });
          break;

        case 'copy_file':
          // Ensure destination directory exists
          await FileSystemUtils.createDirectory(path.dirname(operation.target));

          // Move from staging to final destination
          if (await FileSystemUtils.pathExists(stagingTarget)) {
            await fs.rename(stagingTarget, operation.target);
          }
          break;

        case 'set_permissions':
          if (operation.permissions && process.platform !== 'win32') {
            await fs.chmod(operation.target, operation.permissions);
          }
          break;
      }
    }
  }

  /**
   * Rollback operations
   */
  private async rollbackOperations(result: InstallationResult): Promise<void> {
    if (!this.currentContext) {
      return;
    }

    try {
      await FileSystemUtils.rollbackAtomicOperations(this.currentContext);
    } catch (error) {
      result.errors.push({
        operation: {
          type: 'create_directory',
          target: 'rollback',
        },
        error: `Rollback failed: ${error}`,
        code: 'ROLLBACK_FAILED',
        recoverable: false,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Execute a single rollback operation
   */
  private async executeRollbackOperation(operation: RollbackOperation): Promise<void> {
    try {
      switch (operation.type) {
        case 'delete_file':
          if (await FileSystemUtils.pathExists(operation.path)) {
            await FileSystemUtils.remove(operation.path);
          }
          break;

        case 'remove_directory':
          if (await FileSystemUtils.pathExists(operation.path)) {
            await FileSystemUtils.remove(operation.path, { recursive: true });
          }
          break;

        case 'restore_backup':
          if (operation.backupPath && (await FileSystemUtils.pathExists(operation.backupPath))) {
            await FileSystemUtils.copyFileWithVerification(operation.backupPath, operation.path);
            await FileSystemUtils.remove(operation.backupPath);
          }
          break;

        case 'restore_permissions':
          if (operation.originalPermissions && process.platform !== 'win32') {
            await fs.chmod(operation.path, operation.originalPermissions);
          }
          break;
      }
    } catch (error) {
      // Log rollback errors but don't throw
      console.error(`Rollback operation failed for ${operation.path}: ${error}`);
    }
  }

  /**
   * Restore a backup file
   */
  private async restoreBackup(backup: BackupInfo): Promise<void> {
    try {
      if (await FileSystemUtils.pathExists(backup.backupPath)) {
        await FileSystemUtils.copyFileWithVerification(backup.backupPath, backup.originalPath);

        // Verify restoration
        const restoredChecksum = await FileSystemUtils.calculateChecksum(backup.originalPath);
        if (restoredChecksum !== backup.checksum) {
          throw new Error(`Backup restoration failed: checksum mismatch`);
        }

        // Remove backup file
        await FileSystemUtils.remove(backup.backupPath);
      }
    } catch (error) {
      console.error(`Failed to restore backup ${backup.backupPath}: ${error}`);
    }
  }

  /**
   * Create backup with proper naming
   */
  private async createBackup(filePath: string, backupPath?: string): Promise<string> {
    const backupDir = backupPath || path.join(path.dirname(filePath), '.backups');
    return await FileSystemUtils.createBackup(filePath, backupDir, {
      timestamp: true,
    });
  }

  /**
   * Verify a completed file operation
   */
  private async verifyFileOperation(operation: CompletedOperation): Promise<boolean> {
    try {
      if (!(await FileSystemUtils.pathExists(operation.target))) {
        return false;
      }

      // Verify checksum if available
      if (operation.checksum && operation.source) {
        const actualChecksum = await FileSystemUtils.calculateChecksum(operation.target);
        return actualChecksum === operation.checksum;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up temporary files and contexts
   */
  private async cleanup(): Promise<void> {
    if (this.currentContext) {
      await FileSystemUtils.remove(this.currentContext.tempDirectory, { recursive: true }).catch(
        () => {}
      ); // Ignore cleanup errors

      this.currentContext = null;
    }
  }

  /**
   * Create a FileSystemError with consistent structure
   */
  private createError(message: string, code: string, path?: string): FileSystemError {
    const error = new Error(message) as FileSystemError;
    error.code = code;
    error.path = path;
    error.operation = 'atomicInstall';
    return error;
  }
}
