export { TaskManager } from './task-manager';
export { CommandManager } from './command-manager';
export type { Task, WorkspaceConfig, WorkspaceStatus } from './task-manager';
export type { ClaudeCommand, CommandInstallationResult } from './command-manager';

// UI System exports
export {
  UserInterface,
  ui,
  ProgressIndicator,
  Spinner,
  EnhancedPrompts,
  CommonPrompts,
  PromptValidator,
  MessageFormatter,
  SystemMessages,
  systemMessages,
  setupGracefulExit,
  createProgressBar,
  createSpinner,
  simulateProgress
} from './ui';

export type {
  UIOptions,
  ProgressOptions,
  SpinnerOptions,
  PromptConfig,
  ValidationRule,
  MessageOptions,
  NextStep
} from './ui';

// Template system exports
export { 
  TemplateManager, 
  FileUtils,
  templateManager,
  type TemplateFile,
  type TemplateConfig,
  type CopyOptions,
  type TemplateValidationResult,
  type CopyResult,
  TemplateError
} from './templates';

// Main entry point for programmatic usage
export * from './task-manager';
export * from './command-manager';
export * from './ui';
