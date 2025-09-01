/**
 * Installation verification with integrity checks
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  VerificationResult,
  FileInfo,
  InstallationConfig,
  CompletedOperation,
  FileSystemError,
} from './types';
import { FileSystemUtils } from './utils';

export interface VerificationManifest {
  version: string;
  files: Map<string, ExpectedFileInfo>;
  directories: Map<string, ExpectedDirectoryInfo>;
  timestamp: Date;
  checksum: string;
}

export interface ExpectedFileInfo extends FileInfo {
  required: boolean;
  executable?: boolean;
}

export interface ExpectedDirectoryInfo {
  path: string;
  required: boolean;
  permissions: number;
  expectedFiles?: string[];
}

export class InstallationVerifier {
  private manifest: VerificationManifest | null = null;

  constructor(manifest?: VerificationManifest) {
    if (manifest) {
      this.manifest = manifest;
    }
  }

  /**
   * Set verification manifest
   */
  setManifest(manifest: VerificationManifest): void {
    this.manifest = manifest;
  }

  /**
   * Generate verification manifest from operations
   */
  async generateManifest(
    operations: CompletedOperation[],
    version: string
  ): Promise<VerificationManifest> {
    const files = new Map<string, ExpectedFileInfo>();
    const directories = new Map<string, ExpectedDirectoryInfo>();

    try {
      for (const operation of operations) {
        if (!operation.completed) continue;

        switch (operation.type) {
          case 'copy_file':
            if (await FileSystemUtils.pathExists(operation.target)) {
              const fileInfo = await FileSystemUtils.getFileInfo(operation.target);
              files.set(operation.target, {
                ...fileInfo,
                required: true,
                executable: operation.permissions
                  ? Boolean(operation.permissions & parseInt('111', 8))
                  : false,
              });
            }
            break;

          case 'create_directory':
            if (await FileSystemUtils.pathExists(operation.target)) {
              const stats = await fs.stat(operation.target);
              directories.set(operation.target, {
                path: operation.target,
                required: true,
                permissions: stats.mode,
                expectedFiles: [],
              });
            }
            break;
        }
      }

      // Calculate manifest checksum
      const manifestData = JSON.stringify({
        version,
        files: Array.from(files.entries()),
        directories: Array.from(directories.entries()),
      });

      const checksum = require('crypto').createHash('sha256').update(manifestData).digest('hex');

      const manifest: VerificationManifest = {
        version,
        files,
        directories,
        timestamp: new Date(),
        checksum,
      };

      this.manifest = manifest;
      return manifest;
    } catch (error) {
      throw this.createError(
        `Failed to generate verification manifest: ${error}`,
        'MANIFEST_GENERATION_FAILED'
      );
    }
  }

  /**
   * Verify complete installation against manifest
   */
  async verifyInstallation(
    installationPath: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _config?: InstallationConfig
  ): Promise<VerificationResult> {
    if (!this.manifest) {
      throw this.createError('No verification manifest available', 'MANIFEST_NOT_AVAILABLE');
    }

    const result: VerificationResult = {
      valid: true,
      checkedFiles: 0,
      validFiles: 0,
      issues: [],
      summary: '',
    };

    try {
      // Verify files
      await this.verifyFiles(installationPath, result);

      // Verify directories
      await this.verifyDirectories(installationPath, result);

      // Verify version consistency
      await this.verifyVersion(installationPath, result);

      // Determine overall validity
      result.valid =
        result.issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high')
          .length === 0;

      // Generate summary
      result.summary = this.generateVerificationSummary(result);

      return result;
    } catch (error) {
      throw this.createError(
        `Installation verification failed: ${error}`,
        'VERIFICATION_FAILED',
        installationPath
      );
    }
  }

  /**
   * Verify individual files
   */
  async verifyFiles(installationPath: string, result: VerificationResult): Promise<void> {
    if (!this.manifest) return;

    for (const [relativePath, expectedFile] of this.manifest.files) {
      const fullPath = path.isAbsolute(relativePath)
        ? relativePath
        : path.join(installationPath, relativePath);

      result.checkedFiles++;

      try {
        // Check if file exists
        if (!(await FileSystemUtils.pathExists(fullPath))) {
          result.issues.push({
            path: relativePath,
            issue: 'missing',
            severity: expectedFile.required ? 'high' : 'medium',
          });
          continue;
        }

        // Get actual file info
        const actualFile = await FileSystemUtils.getFileInfo(fullPath);

        // Verify file type
        if (actualFile.type !== expectedFile.type) {
          result.issues.push({
            path: relativePath,
            issue: 'corrupted',
            expected: expectedFile.type,
            actual: actualFile.type,
            severity: 'high',
          });
          continue;
        }

        // Verify size
        if (actualFile.size !== expectedFile.size) {
          result.issues.push({
            path: relativePath,
            issue: 'size_mismatch',
            expected: expectedFile.size,
            actual: actualFile.size,
            severity: 'medium',
          });
        }

        // Verify checksum
        if (expectedFile.checksum && actualFile.checksum) {
          if (expectedFile.checksum !== actualFile.checksum) {
            result.issues.push({
              path: relativePath,
              issue: 'corrupted',
              expected: expectedFile.checksum,
              actual: actualFile.checksum,
              severity: 'high',
            });
            continue;
          }
        }

        // Verify permissions
        await this.verifyFilePermissions(fullPath, relativePath, expectedFile, result);

        result.validFiles++;
      } catch (error) {
        result.issues.push({
          path: relativePath,
          issue: 'corrupted',
          severity: 'critical',
        });
      }
    }
  }

  /**
   * Verify directories
   */
  async verifyDirectories(installationPath: string, result: VerificationResult): Promise<void> {
    if (!this.manifest) return;

    for (const [relativePath, expectedDir] of this.manifest.directories) {
      const fullPath = path.isAbsolute(relativePath)
        ? relativePath
        : path.join(installationPath, relativePath);

      try {
        // Check if directory exists
        if (!(await FileSystemUtils.pathExists(fullPath))) {
          result.issues.push({
            path: relativePath,
            issue: 'missing',
            severity: expectedDir.required ? 'high' : 'medium',
          });
          continue;
        }

        // Verify it's actually a directory
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
          result.issues.push({
            path: relativePath,
            issue: 'corrupted',
            expected: 'directory',
            actual: 'file',
            severity: 'high',
          });
          continue;
        }

        // Verify permissions on Unix-like systems
        if (process.platform !== 'win32') {
          const expectedPerms = expectedDir.permissions & parseInt('777', 8);
          const actualPerms = stats.mode & parseInt('777', 8);

          if (expectedPerms !== actualPerms) {
            result.issues.push({
              path: relativePath,
              issue: 'permission_mismatch',
              expected: expectedPerms.toString(8),
              actual: actualPerms.toString(8),
              severity: 'low',
            });
          }
        }

        // Verify expected files in directory
        if (expectedDir.expectedFiles && expectedDir.expectedFiles.length > 0) {
          await this.verifyDirectoryContents(fullPath, relativePath, expectedDir, result);
        }
      } catch (error) {
        result.issues.push({
          path: relativePath,
          issue: 'corrupted',
          severity: 'critical',
        });
      }
    }
  }

  /**
   * Verify file permissions
   */
  private async verifyFilePermissions(
    fullPath: string,
    relativePath: string,
    expectedFile: ExpectedFileInfo,
    result: VerificationResult
  ): Promise<void> {
    if (process.platform === 'win32') {
      return; // Skip permission checks on Windows
    }

    try {
      const stats = await fs.stat(fullPath);

      // Check executable permissions if expected
      if (expectedFile.executable) {
        const hasExecutePerms = Boolean(stats.mode & parseInt('111', 8));
        if (!hasExecutePerms) {
          result.issues.push({
            path: relativePath,
            issue: 'permission_mismatch',
            expected: 'executable',
            actual: 'not executable',
            severity: 'medium',
          });
        }
      }

      // Check general permission mismatch
      const expectedPerms = expectedFile.permissions & parseInt('777', 8);
      const actualPerms = stats.mode & parseInt('777', 8);

      if (expectedPerms !== actualPerms) {
        result.issues.push({
          path: relativePath,
          issue: 'permission_mismatch',
          expected: expectedPerms.toString(8),
          actual: actualPerms.toString(8),
          severity: 'low',
        });
      }
    } catch (error) {
      result.issues.push({
        path: relativePath,
        issue: 'corrupted',
        severity: 'high',
      });
    }
  }

  /**
   * Verify directory contents
   */
  private async verifyDirectoryContents(
    fullPath: string,
    relativePath: string,
    expectedDir: ExpectedDirectoryInfo,
    result: VerificationResult
  ): Promise<void> {
    try {
      const actualFiles = await FileSystemUtils.readDirectory(fullPath);

      for (const expectedFile of expectedDir.expectedFiles || []) {
        if (!actualFiles.includes(expectedFile)) {
          result.issues.push({
            path: path.join(relativePath, expectedFile),
            issue: 'missing',
            severity: 'medium',
          });
        }
      }
    } catch (error) {
      result.issues.push({
        path: relativePath,
        issue: 'corrupted',
        severity: 'high',
      });
    }
  }

  /**
   * Verify version consistency
   */
  private async verifyVersion(installationPath: string, result: VerificationResult): Promise<void> {
    if (!this.manifest) return;

    const versionFilePath = path.join(installationPath, '.ai', 'task-manager', 'VERSION');

    try {
      if (await FileSystemUtils.pathExists(versionFilePath)) {
        const actualVersion = (await fs.readFile(versionFilePath, 'utf-8')).trim();

        if (actualVersion !== this.manifest.version) {
          result.issues.push({
            path: '.ai/task-manager/VERSION',
            issue: 'corrupted',
            expected: this.manifest.version,
            actual: actualVersion,
            severity: 'high',
          });
        }
      } else {
        result.issues.push({
          path: '.ai/task-manager/VERSION',
          issue: 'missing',
          severity: 'high',
        });
      }
    } catch (error) {
      result.issues.push({
        path: '.ai/task-manager/VERSION',
        issue: 'corrupted',
        severity: 'critical',
      });
    }
  }

  /**
   * Generate human-readable verification summary
   */
  private generateVerificationSummary(result: VerificationResult): string {
    const { checkedFiles, validFiles, issues } = result;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    let summary = `Verification completed: ${validFiles}/${checkedFiles} files valid`;

    if (issues.length === 0) {
      summary += '. Installation is healthy.';
    } else {
      summary += `. Issues found: `;
      const issueParts: string[] = [];

      if (criticalIssues > 0) issueParts.push(`${criticalIssues} critical`);
      if (highIssues > 0) issueParts.push(`${highIssues} high`);
      if (mediumIssues > 0) issueParts.push(`${mediumIssues} medium`);
      if (lowIssues > 0) issueParts.push(`${lowIssues} low`);

      summary += issueParts.join(', ');

      if (result.valid) {
        summary += '. Installation is functional but has minor issues.';
      } else {
        summary += '. Installation requires attention.';
      }
    }

    return summary;
  }

  /**
   * Save verification manifest to file
   */
  async saveManifest(filePath: string): Promise<void> {
    if (!this.manifest) {
      throw this.createError('No manifest to save', 'MANIFEST_NOT_AVAILABLE');
    }

    try {
      // Convert maps to objects for JSON serialization
      const manifestData = {
        version: this.manifest.version,
        files: Object.fromEntries(this.manifest.files),
        directories: Object.fromEntries(this.manifest.directories),
        timestamp: this.manifest.timestamp.toISOString(),
        checksum: this.manifest.checksum,
      };

      await FileSystemUtils.createDirectory(path.dirname(filePath));
      await fs.writeFile(filePath, JSON.stringify(manifestData, null, 2), 'utf-8');
    } catch (error) {
      throw this.createError(`Failed to save manifest: ${error}`, 'MANIFEST_SAVE_FAILED', filePath);
    }
  }

  /**
   * Load verification manifest from file
   */
  async loadManifest(filePath: string): Promise<VerificationManifest> {
    try {
      const manifestData = JSON.parse(await fs.readFile(filePath, 'utf-8'));

      const manifest: VerificationManifest = {
        version: manifestData.version,
        files: new Map(Object.entries(manifestData.files)),
        directories: new Map(Object.entries(manifestData.directories)),
        timestamp: new Date(manifestData.timestamp),
        checksum: manifestData.checksum,
      };

      this.manifest = manifest;
      return manifest;
    } catch (error) {
      throw this.createError(`Failed to load manifest: ${error}`, 'MANIFEST_LOAD_FAILED', filePath);
    }
  }

  /**
   * Create a FileSystemError with consistent structure
   */
  private createError(message: string, code: string, path?: string): FileSystemError {
    const error = new Error(message) as FileSystemError;
    error.code = code;
    error.path = path;
    error.operation = 'verifyInstallation';
    return error;
  }
}
