/**
 * Template Manager - Handles template file operations
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TemplateConfig,
  CopyOptions,
  TemplateValidationResult,
  CopyResult,
  TemplateError,
} from './types';
import { FileUtils } from './file-utils';

export class TemplateManager {
  private readonly templateBasePath: string;

  constructor(templateBasePath?: string) {
    // Default to templates directory in the package
    this.templateBasePath = templateBasePath || FileUtils.joinPath(__dirname, '../../templates');
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.templateBasePath, { withFileTypes: true });
      return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    } catch (error) {
      throw new TemplateError(
        `Failed to read templates directory: ${error}`,
        'READ_TEMPLATES_FAILED'
      );
    }
  }

  /**
   * Get template configuration
   */
  async getTemplateConfig(templateName: string): Promise<TemplateConfig> {
    const templatePath = path.join(this.templateBasePath, templateName);

    try {
      await this.validateTemplatePath(templatePath);

      const files = await this.discoverTemplateFiles(templatePath);

      return {
        name: templateName,
        description: `Template for ${templateName}`,
        files: files.map(file => ({
          source: file,
          destination: path.basename(file),
          name: path.basename(file, path.extname(file)),
        })),
      };
    } catch (error) {
      throw new TemplateError(
        `Failed to get template config for '${templateName}': ${error}`,
        'TEMPLATE_CONFIG_FAILED'
      );
    }
  }

  /**
   * Validate template before copying
   */
  async validateTemplate(templateName: string): Promise<TemplateValidationResult> {
    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const templatePath = path.join(this.templateBasePath, templateName);

      // Check if template directory exists
      try {
        const stat = await fs.stat(templatePath);
        if (!stat.isDirectory()) {
          result.errors.push(`Template '${templateName}' is not a directory`);
          result.isValid = false;
        }
      } catch (error) {
        result.errors.push(`Template '${templateName}' does not exist`);
        result.isValid = false;
        return result;
      }

      // Check if template has files
      const files = await this.discoverTemplateFiles(templatePath);
      if (files.length === 0) {
        result.warnings.push(`Template '${templateName}' contains no files`);
      }

      // Validate each template file
      for (const file of files) {
        try {
          await fs.access(file, fs.constants.R_OK);
        } catch (error) {
          result.errors.push(`Template file '${path.basename(file)}' is not readable`);
          result.isValid = false;
        }
      }
    } catch (error) {
      result.errors.push(`Validation failed: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Copy template files to destination
   */
  async copyTemplate(
    templateName: string,
    destinationPath: string,
    options: CopyOptions = {}
  ): Promise<CopyResult> {
    const result: CopyResult = {
      success: true,
      copiedFiles: [],
      errors: [],
      warnings: [],
    };

    const defaultOptions: CopyOptions = {
      overwrite: false,
      preserveTimestamps: true,
      createDirectories: true,
      ...options,
    };

    try {
      // Validate template first
      const validation = await this.validateTemplate(templateName);
      if (!validation.isValid) {
        result.success = false;
        result.errors = validation.errors;
        result.warnings = validation.warnings;
        return result;
      }

      // Get template config
      const config = await this.getTemplateConfig(templateName);

      // Ensure destination directory exists
      if (defaultOptions.createDirectories) {
        await this.ensureDirectoryExists(destinationPath);
      }

      // Copy each template file
      for (const templateFile of config.files) {
        try {
          const sourcePath = templateFile.source;
          const destPath = path.join(destinationPath, templateFile.destination);

          // Check if destination file exists
          const destExists = await this.fileExists(destPath);
          if (destExists && !defaultOptions.overwrite) {
            result.warnings.push(`File '${templateFile.destination}' already exists, skipping`);
            continue;
          }

          // Ensure destination directory exists
          const destDir = path.dirname(destPath);
          if (defaultOptions.createDirectories) {
            await this.ensureDirectoryExists(destDir);
          }

          // Copy the file with proper permissions
          await FileUtils.copyFileWithPermissions(
            sourcePath,
            destPath,
            defaultOptions.preserveTimestamps
          );

          result.copiedFiles.push(destPath);
        } catch (error) {
          result.errors.push(`Failed to copy '${templateFile.name}': ${error}`);
          result.success = false;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Template copy failed: ${error}`);
    }

    return result;
  }

  /**
   * Initialize AI task manager structure in a directory
   */
  async initializeAiTaskManager(
    projectPath: string,
    options: CopyOptions = {}
  ): Promise<CopyResult> {
    const aiTaskManagerPath = path.join(projectPath, '.ai', 'task-manager');

    return this.copyTemplate('ai-task-manager', aiTaskManagerPath, {
      createDirectories: true,
      ...options,
    });
  }

  /**
   * Private helper methods
   */

  private async validateTemplatePath(templatePath: string): Promise<void> {
    try {
      const stat = await fs.stat(templatePath);
      if (!stat.isDirectory()) {
        throw new TemplateError(`Template path is not a directory: ${templatePath}`);
      }
    } catch (error) {
      throw new TemplateError(`Template path does not exist: ${templatePath}`);
    }
  }

  private async discoverTemplateFiles(templatePath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(templatePath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(templatePath, entry.name);

        if (entry.isFile()) {
          files.push(fullPath);
        } else if (entry.isDirectory()) {
          // Recursively discover files in subdirectories
          const subFiles = await this.discoverTemplateFiles(fullPath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      throw new TemplateError(`Failed to discover template files: ${error}`);
    }

    return files;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    await FileUtils.createDirectory(dirPath);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    return FileUtils.isAccessible(filePath);
  }
}
