/**
 * Types and interfaces for the template system
 */

export interface TemplateFile {
  source: string;
  destination: string;
  name: string;
}

export interface TemplateConfig {
  name: string;
  description: string;
  files: TemplateFile[];
}

export interface CopyOptions {
  overwrite?: boolean;
  preserveTimestamps?: boolean;
  createDirectories?: boolean;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CopyResult {
  success: boolean;
  copiedFiles: string[];
  errors: string[];
  warnings: string[];
}

export class TemplateError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'TemplateError';
  }
}
