/**
 * Core file system utilities with cross-platform support
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileInfo, FileSystemError, AtomicOperationContext, AtomicOperation } from './types';

export class FileSystemUtils {
  /**
   * Calculate file checksum for integrity verification
   */
  static async calculateChecksum(filePath: string): Promise<string> {
    try {
      const data = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      throw this.createError(
        `Failed to calculate checksum for '${filePath}': ${error}`,
        'CHECKSUM_FAILED',
        filePath,
        'calculateChecksum'
      );
    }
  }

  /**
   * Get comprehensive file information
   */
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      const checksum = stats.isFile() ? await this.calculateChecksum(filePath) : undefined;

      const fileInfo: FileInfo = {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        permissions: stats.mode,
        type: stats.isDirectory() ? 'directory' : stats.isSymbolicLink() ? 'symlink' : 'file',
      };

      if (checksum) {
        fileInfo.checksum = checksum;
      }

      return fileInfo;
    } catch (error) {
      throw this.createError(
        `Failed to get file info for '${filePath}': ${error}`,
        'FILE_INFO_FAILED',
        filePath,
        'getFileInfo'
      );
    }
  }

  /**
   * Safely check if path exists
   */
  static async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safely check if path is accessible with specific permissions
   */
  static async isAccessible(filePath: string, mode: number = fs.constants.F_OK): Promise<boolean> {
    try {
      await fs.access(filePath, mode);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read directory contents safely
   */
  static async readDirectory(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      throw this.createError(
        `Failed to read directory '${dirPath}': ${error}`,
        'READ_DIRECTORY_FAILED',
        dirPath
      );
    }
  }

  /**
   * Create directory with proper permissions and error handling
   */
  static async createDirectory(
    dirPath: string,
    options: { recursive?: boolean; mode?: number } = {}
  ): Promise<void> {
    const { recursive = true, mode = 0o755 } = options;

    try {
      await fs.mkdir(dirPath, {
        recursive,
        mode: process.platform !== 'win32' ? mode : undefined,
      });
    } catch (error) {
      throw this.createError(
        `Failed to create directory '${dirPath}': ${error}`,
        'DIRECTORY_CREATE_FAILED',
        dirPath,
        'createDirectory'
      );
    }
  }

  /**
   * Copy file with integrity verification
   */
  static async copyFileWithVerification(
    source: string,
    destination: string,
    options: {
      preservePermissions?: boolean;
      preserveTimestamps?: boolean;
      verifyIntegrity?: boolean;
    } = {}
  ): Promise<void> {
    const {
      preservePermissions = true,
      preserveTimestamps = true,
      verifyIntegrity = true,
    } = options;

    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destination);
      await this.createDirectory(destDir);

      // Get source file stats
      const sourceStats = await fs.stat(source);
      const sourceChecksum = verifyIntegrity ? await this.calculateChecksum(source) : undefined;

      // Copy the file
      await fs.copyFile(source, destination);

      // Preserve permissions if requested and on Unix-like systems
      if (preservePermissions && process.platform !== 'win32') {
        await fs.chmod(destination, sourceStats.mode);
      }

      // Preserve timestamps if requested
      if (preserveTimestamps) {
        await fs.utimes(destination, sourceStats.atime, sourceStats.mtime);
      }

      // Verify integrity if requested
      if (verifyIntegrity && sourceChecksum) {
        const destChecksum = await this.calculateChecksum(destination);
        if (sourceChecksum !== destChecksum) {
          // Remove corrupted destination file
          await fs.unlink(destination).catch(() => {});
          throw this.createError(
            `Integrity verification failed for '${destination}'`,
            'INTEGRITY_CHECK_FAILED',
            destination,
            'copyFileWithVerification'
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('INTEGRITY_CHECK_FAILED')) {
        throw error;
      }
      throw this.createError(
        `Failed to copy file from '${source}' to '${destination}': ${error}`,
        'FILE_COPY_FAILED',
        source,
        'copyFileWithVerification'
      );
    }
  }

  /**
   * Create backup of a file or directory
   */
  static async createBackup(
    sourcePath: string,
    backupDir: string,
    options: { timestamp?: boolean; preserveStructure?: boolean } = {}
  ): Promise<string> {
    const { timestamp = true, preserveStructure = false } = options;

    try {
      await this.createDirectory(backupDir);

      const stats = await fs.stat(sourcePath);
      const baseName = path.basename(sourcePath);
      const backupName = timestamp ? `${baseName}.backup.${Date.now()}` : `${baseName}.backup`;

      const backupPath = preserveStructure
        ? path.join(backupDir, path.relative(process.cwd(), sourcePath), backupName)
        : path.join(backupDir, backupName);

      if (stats.isDirectory()) {
        await this.copyDirectory(sourcePath, backupPath, { preservePermissions: true });
      } else {
        await this.copyFileWithVerification(sourcePath, backupPath, {
          preservePermissions: true,
          preserveTimestamps: true,
          verifyIntegrity: true,
        });
      }

      return backupPath;
    } catch (error) {
      throw this.createError(
        `Failed to create backup of '${sourcePath}': ${error}`,
        'BACKUP_FAILED',
        sourcePath,
        'createBackup'
      );
    }
  }

  /**
   * Recursively copy directory with proper error handling
   */
  static async copyDirectory(
    source: string,
    destination: string,
    options: {
      preservePermissions?: boolean;
      preserveTimestamps?: boolean;
      verifyIntegrity?: boolean;
      overwrite?: boolean;
    } = {}
  ): Promise<void> {
    const { overwrite = false } = options;

    try {
      const sourceStats = await fs.stat(source);
      if (!sourceStats.isDirectory()) {
        throw new Error('Source is not a directory');
      }

      // Create destination directory
      await this.createDirectory(destination);

      // Copy directory permissions
      if (options.preservePermissions && process.platform !== 'win32') {
        await fs.chmod(destination, sourceStats.mode);
      }

      // Read directory contents
      const entries = await fs.readdir(source, { withFileTypes: true });

      // Process each entry
      for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);

        if (entry.isDirectory()) {
          await this.copyDirectory(sourcePath, destPath, options);
        } else if (entry.isFile()) {
          // Check if destination exists
          if (!overwrite && (await this.pathExists(destPath))) {
            continue; // Skip existing files
          }

          await this.copyFileWithVerification(sourcePath, destPath, options);
        } else if (entry.isSymbolicLink()) {
          // Handle symlinks
          const linkTarget = await fs.readlink(sourcePath);
          if (!overwrite && (await this.pathExists(destPath))) {
            continue; // Skip existing symlinks
          }
          await fs.symlink(linkTarget, destPath);
        }
      }

      // Preserve directory timestamps
      if (options.preserveTimestamps) {
        await fs.utimes(destination, sourceStats.atime, sourceStats.mtime);
      }
    } catch (error) {
      throw this.createError(
        `Failed to copy directory from '${source}' to '${destination}': ${error}`,
        'DIRECTORY_COPY_FAILED',
        source,
        'copyDirectory'
      );
    }
  }

  /**
   * Remove file or directory safely
   */
  static async remove(targetPath: string, options: { recursive?: boolean } = {}): Promise<void> {
    const { recursive = false } = options;

    try {
      const stats = await fs.stat(targetPath);

      if (stats.isDirectory()) {
        if (recursive) {
          await fs.rm(targetPath, { recursive: true, force: true });
        } else {
          await fs.rmdir(targetPath);
        }
      } else {
        await fs.unlink(targetPath);
      }
    } catch (error) {
      throw this.createError(
        `Failed to remove '${targetPath}': ${error}`,
        'REMOVE_FAILED',
        targetPath,
        'remove'
      );
    }
  }

  /**
   * Create atomic operation context for safe operations
   */
  static async createAtomicContext(operationId: string): Promise<AtomicOperationContext> {
    const tempDir = path.join(require('os').tmpdir(), `atomic-${operationId}-${Date.now()}`);

    try {
      await this.createDirectory(tempDir);

      return {
        operationId,
        tempDirectory: tempDir,
        operations: [],
        committed: false,
        rollbackData: {
          operations: [],
          backups: [],
          timestamp: new Date(),
        },
      };
    } catch (error) {
      throw this.createError(
        `Failed to create atomic context: ${error}`,
        'ATOMIC_CONTEXT_FAILED',
        tempDir,
        'createAtomicContext'
      );
    }
  }

  /**
   * Add operation to atomic context
   */
  static addAtomicOperation(
    context: AtomicOperationContext,
    operation: Omit<AtomicOperation, 'id' | 'completed'>
  ): void {
    const atomicOp: AtomicOperation = {
      ...operation,
      id: `${context.operationId}-${context.operations.length}`,
      completed: false,
    };
    context.operations.push(atomicOp);
  }

  /**
   * Commit atomic operations
   */
  static async commitAtomicOperations(context: AtomicOperationContext): Promise<void> {
    try {
      for (const operation of context.operations) {
        if (operation.completed) continue;

        switch (operation.type) {
          case 'copy_file':
            if (operation.source && operation.tempTarget && operation.target) {
              await fs.rename(operation.tempTarget, operation.target);
            }
            break;
          case 'create_directory':
            // Directory operations are typically already in place
            break;
          default:
            throw new Error(`Unknown atomic operation type: ${operation.type}`);
        }

        operation.completed = true;
      }

      context.committed = true;

      // Clean up temporary directory
      await this.remove(context.tempDirectory, { recursive: true }).catch(() => {});
    } catch (error) {
      throw this.createError(
        `Failed to commit atomic operations: ${error}`,
        'ATOMIC_COMMIT_FAILED',
        context.tempDirectory,
        'commitAtomicOperations'
      );
    }
  }

  /**
   * Rollback atomic operations
   */
  static async rollbackAtomicOperations(context: AtomicOperationContext): Promise<void> {
    try {
      // Remove any successfully created files/directories
      for (const operation of context.operations.reverse()) {
        if (operation.completed && operation.target) {
          await this.remove(operation.target, { recursive: true }).catch(() => {});
        }
      }

      // Clean up temporary directory
      await this.remove(context.tempDirectory, { recursive: true }).catch(() => {});
    } catch (error) {
      throw this.createError(
        `Failed to rollback atomic operations: ${error}`,
        'ATOMIC_ROLLBACK_FAILED',
        context.tempDirectory,
        'rollbackAtomicOperations'
      );
    }
  }

  /**
   * Create a FileSystemError with consistent structure
   */
  private static createError(
    message: string,
    code: string,
    filePath?: string,
    operation?: string
  ): FileSystemError {
    const error = new Error(message) as FileSystemError;
    error.code = code;
    if (filePath) {
      error.path = filePath;
    }
    if (operation) {
      error.operation = operation;
    }
    return error;
  }
}
