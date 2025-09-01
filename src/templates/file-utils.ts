/**
 * Cross-platform file utilities for template operations
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { TemplateError } from './types';

export class FileUtils {
  /**
   * Cross-platform path normalization
   */
  static normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Safe path joining that handles cross-platform concerns
   */
  static joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Check if a path is safe (no path traversal)
   */
  static isSafePath(basePath: string, targetPath: string): boolean {
    const normalizedBase = path.resolve(basePath);
    const normalizedTarget = path.resolve(normalizedBase, targetPath);

    return normalizedTarget.startsWith(normalizedBase);
  }

  /**
   * Copy file with proper error handling and cross-platform support
   */
  static async copyFileWithPermissions(
    source: string,
    destination: string,
    preservePermissions: boolean = true
  ): Promise<void> {
    try {
      // Get source file stats
      const sourceStats = await fs.stat(source);

      // Copy the file
      await fs.copyFile(source, destination);

      // Preserve permissions if requested and on Unix-like systems
      if (preservePermissions && process.platform !== 'win32') {
        await fs.chmod(destination, sourceStats.mode);
      }

      // Preserve timestamps
      await fs.utimes(destination, sourceStats.atime, sourceStats.mtime);
    } catch (error) {
      throw new TemplateError(`Failed to copy file from '${source}' to '${destination}': ${error}`);
    }
  }

  /**
   * Create directory with proper permissions
   */
  static async createDirectory(dirPath: string, mode: number = 0o755): Promise<void> {
    try {
      await fs.mkdir(dirPath, {
        recursive: true,
        mode: process.platform !== 'win32' ? mode : undefined,
      });
    } catch (error) {
      throw new TemplateError(`Failed to create directory '${dirPath}': ${error}`);
    }
  }

  /**
   * Check if file exists and is accessible
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
   * Get file stats safely
   */
  static async getStats(filePath: string): Promise<Awaited<ReturnType<typeof fs.stat>> | null> {
    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Read directory contents safely
   */
  static async readDirectory(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      throw new TemplateError(`Failed to read directory '${dirPath}': ${error}`);
    }
  }

  /**
   * Calculate relative path between two paths
   */
  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Get file extension
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Get file name without extension
   */
  static getBaseName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Check if path is absolute
   */
  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Resolve path to absolute
   */
  static resolvePath(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Validate file name for cross-platform compatibility
   */
  static isValidFileName(fileName: string): boolean {
    // Check for invalid characters
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"\\|?*\x00-\x1f]/;
    if (invalidChars.test(fileName)) {
      return false;
    }

    // Check for reserved names on Windows
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(fileName)) {
      return false;
    }

    // Check length (255 chars is generally safe across platforms)
    if (fileName.length > 255) {
      return false;
    }

    // Check for trailing dots or spaces (problematic on Windows)
    if (fileName.endsWith('.') || fileName.endsWith(' ')) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize file name for cross-platform compatibility
   */
  static sanitizeFileName(fileName: string): string {
    return (
      fileName
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"\\|?*\x00-\x1f]/g, '_')
        .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '_$1')
        .substring(0, 255)
        .replace(/[. ]+$/, '')
    );
  }
}
