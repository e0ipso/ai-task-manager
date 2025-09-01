/**
 * Installation detection and conflict analysis system
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  InstallationDetectionResult,
  FileConflict,
  FileInfo,
  IntegrityIssue,
  FileSystemError,
} from './types';
import { FileSystemUtils } from './utils';

export class InstallationDetector {
  private readonly expectedFiles: Map<string, FileInfo> = new Map();
  private readonly versionFile = '.ai/task-manager/VERSION';
  private readonly configFile = '.ai/task-manager/config.json';

  constructor(expectedFiles?: Map<string, FileInfo>) {
    if (expectedFiles) {
      this.expectedFiles = expectedFiles;
    }
  }

  /**
   * Set expected files for installation verification
   */
  setExpectedFiles(files: Map<string, FileInfo>): void {
    this.expectedFiles.clear();
    files.forEach((info, path) => {
      this.expectedFiles.set(path, info);
    });
  }

  /**
   * Detect existing installation in target directory
   */
  async detectInstallation(targetDirectory: string): Promise<InstallationDetectionResult> {
    const result: InstallationDetectionResult = {
      isInstalled: false,
      partialInstallation: false,
      conflictingFiles: [],
      missingFiles: [],
      integrityIssues: [],
    };

    try {
      // Check for version file to determine if installation exists
      const versionPath = path.join(targetDirectory, this.versionFile);
      const versionExists = await FileSystemUtils.pathExists(versionPath);

      if (versionExists) {
        try {
          const versionContent = await fs.readFile(versionPath, 'utf-8');
          result.version = versionContent.trim();
          result.installationPath = targetDirectory;
        } catch (error) {
          result.integrityIssues.push({
            path: versionPath,
            issue: 'corrupted',
            severity: 'high',
          });
        }
      }

      // Check for config file
      const configPath = path.join(targetDirectory, this.configFile);
      const configExists = await FileSystemUtils.pathExists(configPath);

      // Analyze expected files if provided
      if (this.expectedFiles.size > 0) {
        await this.analyzeExpectedFiles(targetDirectory, result);
      } else {
        // Fallback: check for common AI task manager files
        await this.detectCommonFiles(targetDirectory, result);
      }

      // Determine installation status
      result.isInstalled = versionExists && configExists && result.missingFiles.length === 0;
      result.partialInstallation =
        (versionExists || configExists) && result.missingFiles.length > 0;
    } catch (error) {
      throw this.createError(
        `Failed to detect installation in '${targetDirectory}': ${error}`,
        'DETECTION_FAILED',
        targetDirectory
      );
    }

    return result;
  }

  /**
   * Analyze conflicts between existing and incoming files
   */
  async analyzeConflicts(
    targetDirectory: string,
    incomingFiles: Map<string, FileInfo>
  ): Promise<FileConflict[]> {
    const conflicts: FileConflict[] = [];

    try {
      for (const [relativePath, incomingInfo] of incomingFiles) {
        const fullPath = path.join(targetDirectory, relativePath);

        if (await FileSystemUtils.pathExists(fullPath)) {
          try {
            const existingInfo = await FileSystemUtils.getFileInfo(fullPath);

            // Check if files are different
            if (this.areFilesDifferent(existingInfo, incomingInfo)) {
              conflicts.push({
                path: relativePath,
                type: existingInfo.type as 'file' | 'directory',
                existing: existingInfo,
                incoming: incomingInfo,
              });
            }
          } catch (error) {
            // File exists but can't be read - consider it a conflict
            conflicts.push({
              path: relativePath,
              type: 'file',
              existing: {
                path: fullPath,
                size: 0,
                modified: new Date(0),
                permissions: 0,
                type: 'file',
              },
              incoming: incomingInfo,
            });
          }
        }
      }
    } catch (error) {
      throw this.createError(
        `Failed to analyze conflicts in '${targetDirectory}': ${error}`,
        'CONFLICT_ANALYSIS_FAILED',
        targetDirectory
      );
    }

    return conflicts;
  }

  /**
   * Verify installation integrity
   */
  async verifyInstallationIntegrity(
    targetDirectory: string,
    expectedFiles?: Map<string, FileInfo>
  ): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    const filesToCheck = expectedFiles || this.expectedFiles;

    try {
      for (const [relativePath, expectedInfo] of filesToCheck) {
        const fullPath = path.join(targetDirectory, relativePath);

        try {
          if (!(await FileSystemUtils.pathExists(fullPath))) {
            issues.push({
              path: relativePath,
              issue: 'missing',
              severity: 'high',
            });
            continue;
          }

          const actualInfo = await FileSystemUtils.getFileInfo(fullPath);

          // Check size
          if (expectedInfo.size !== actualInfo.size) {
            issues.push({
              path: relativePath,
              issue: 'size_mismatch',
              expected: expectedInfo.size,
              actual: actualInfo.size,
              severity: 'medium',
            });
          }

          // Check checksum for files
          if (expectedInfo.type === 'file' && expectedInfo.checksum && actualInfo.checksum) {
            if (expectedInfo.checksum !== actualInfo.checksum) {
              issues.push({
                path: relativePath,
                issue: 'corrupted',
                expected: expectedInfo.checksum,
                actual: actualInfo.checksum,
                severity: 'high',
              });
            }
          }

          // Check permissions (Unix-like systems only)
          if (process.platform !== 'win32') {
            const expectedPerms = expectedInfo.permissions & parseInt('777', 8);
            const actualPerms = actualInfo.permissions & parseInt('777', 8);

            if (expectedPerms !== actualPerms) {
              issues.push({
                path: relativePath,
                issue: 'permission_mismatch',
                expected: expectedPerms.toString(8),
                actual: actualPerms.toString(8),
                severity: 'low',
              });
            }
          }
        } catch (error) {
          issues.push({
            path: relativePath,
            issue: 'corrupted',
            severity: 'critical',
          });
        }
      }
    } catch (error) {
      throw this.createError(
        `Failed to verify installation integrity: ${error}`,
        'INTEGRITY_CHECK_FAILED',
        targetDirectory
      );
    }

    return issues;
  }

  /**
   * Get installation status summary
   */
  async getInstallationStatus(targetDirectory: string): Promise<{
    hasInstallation: boolean;
    version?: string;
    health: 'healthy' | 'partial' | 'corrupted' | 'unknown';
    issueCount: number;
    lastModified?: Date;
  }> {
    try {
      const detection = await this.detectInstallation(targetDirectory);
      const integrity = await this.verifyInstallationIntegrity(targetDirectory);

      let health: 'healthy' | 'partial' | 'corrupted' | 'unknown' = 'unknown';

      if (detection.isInstalled) {
        if (integrity.length === 0) {
          health = 'healthy';
        } else if (
          integrity.some(issue => issue.severity === 'critical' || issue.severity === 'high')
        ) {
          health = 'corrupted';
        } else {
          health = 'partial';
        }
      } else if (detection.partialInstallation) {
        health = 'partial';
      }

      // Get last modified time from version file
      let lastModified: Date | undefined;
      const versionPath = path.join(targetDirectory, this.versionFile);
      if (await FileSystemUtils.pathExists(versionPath)) {
        const stats = await fs.stat(versionPath);
        lastModified = stats.mtime;
      }

      return {
        hasInstallation: detection.isInstalled || detection.partialInstallation,
        version: detection.version,
        health,
        issueCount: integrity.length,
        lastModified,
      };
    } catch (error) {
      return {
        hasInstallation: false,
        health: 'unknown',
        issueCount: 0,
      };
    }
  }

  /**
   * Analyze expected files against target directory
   */
  private async analyzeExpectedFiles(
    targetDirectory: string,
    result: InstallationDetectionResult
  ): Promise<void> {
    for (const [relativePath, expectedInfo] of this.expectedFiles) {
      const fullPath = path.join(targetDirectory, relativePath);

      if (await FileSystemUtils.pathExists(fullPath)) {
        try {
          const actualInfo = await FileSystemUtils.getFileInfo(fullPath);

          // Check if file is different from expected
          if (this.areFilesDifferent(actualInfo, expectedInfo)) {
            result.conflictingFiles.push(relativePath);
          }

          // Check integrity
          const issues = await this.verifyFileIntegrity(relativePath, expectedInfo, actualInfo);
          result.integrityIssues.push(...issues);
        } catch (error) {
          result.integrityIssues.push({
            path: relativePath,
            issue: 'corrupted',
            severity: 'high',
          });
        }
      } else {
        result.missingFiles.push(relativePath);
      }
    }
  }

  /**
   * Detect common AI task manager files
   */
  private async detectCommonFiles(
    targetDirectory: string,
    result: InstallationDetectionResult
  ): Promise<void> {
    const commonFiles = [
      '.ai/task-manager/config.json',
      '.ai/task-manager/VERSION',
      '.ai/task-manager/plans',
      '.ai/task-manager/templates',
      '.claude/commands/tasks',
    ];

    for (const relativePath of commonFiles) {
      const fullPath = path.join(targetDirectory, relativePath);

      if (!(await FileSystemUtils.pathExists(fullPath))) {
        result.missingFiles.push(relativePath);
      }
    }
  }

  /**
   * Check if two files are different
   */
  private areFilesDifferent(existing: FileInfo, incoming: FileInfo): boolean {
    // Different types
    if (existing.type !== incoming.type) {
      return true;
    }

    // Different sizes
    if (existing.size !== incoming.size) {
      return true;
    }

    // Different checksums (if available)
    if (existing.checksum && incoming.checksum && existing.checksum !== incoming.checksum) {
      return true;
    }

    // Files are considered the same
    return false;
  }

  /**
   * Verify individual file integrity
   */
  private async verifyFileIntegrity(
    relativePath: string,
    expected: FileInfo,
    actual: FileInfo
  ): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    if (expected.size !== actual.size) {
      issues.push({
        path: relativePath,
        issue: 'size_mismatch',
        expected: expected.size,
        actual: actual.size,
        severity: 'medium',
      });
    }

    if (expected.checksum && actual.checksum && expected.checksum !== actual.checksum) {
      issues.push({
        path: relativePath,
        issue: 'corrupted',
        expected: expected.checksum,
        actual: actual.checksum,
        severity: 'high',
      });
    }

    return issues;
  }

  /**
   * Create a FileSystemError with consistent structure
   */
  private createError(message: string, code: string, path?: string): FileSystemError {
    const error = new Error(message) as FileSystemError;
    error.code = code;
    error.path = path;
    error.operation = 'detectInstallation';
    return error;
  }
}
