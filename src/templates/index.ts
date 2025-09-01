/**
 * Template system exports
 */
export { TemplateManager } from './template-manager';
export { FileUtils } from './file-utils';
export type {
  TemplateFile,
  TemplateConfig,
  CopyOptions,
  TemplateValidationResult,
  CopyResult,
} from './types';
export { TemplateError } from './types';

// Default template manager instance
import { TemplateManager } from './template-manager';
export const templateManager = new TemplateManager();
