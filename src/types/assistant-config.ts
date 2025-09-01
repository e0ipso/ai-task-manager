/**
 * Assistant Configuration Types and Interfaces
 *
 * Provides comprehensive TypeScript interfaces and types for assistant configuration
 * throughout the system, including directory mapping utilities and installation
 * configuration per assistant.
 */

import { SupportedAssistant } from '../utils/assistant-validator';

/**
 * Core assistant configuration interface
 */
export interface AssistantConfig {
  /** List of assistants to configure */
  assistants: SupportedAssistant[];
  /** Directory paths mapped by assistant type */
  directories: Record<SupportedAssistant, string>;
  /** Installation targets for each assistant */
  installationTargets: AssistantInstallationTarget[];
}

/**
 * Installation target configuration for a specific assistant
 */
export interface AssistantInstallationTarget {
  /** The assistant this installation target is for */
  assistant: SupportedAssistant;
  /** Base directory where assistant files will be installed */
  baseDirectory: string;
  /** Directory for command files */
  commandsDirectory: string;
  /** Directory for task files */
  tasksDirectory: string;
}

/**
 * Directory structure configuration for assistants
 */
export interface AssistantDirectoryConfig {
  /** Base directory for assistant files (typically .ai/<assistant>) */
  baseDir: string;
  /** Commands subdirectory (typically .ai/<assistant>/commands) */
  commandsDir: string;
  /** Tasks subdirectory (typically .ai/<assistant>/tasks) */
  tasksDir: string;
  /** Optional configuration subdirectory (typically .ai/<assistant>/config) */
  configDir?: string;
}

/**
 * Assistant installation preferences
 */
export interface AssistantInstallationPreferences {
  /** Whether to create backup copies of existing files */
  createBackups: boolean;
  /** Whether to overwrite existing files without confirmation */
  overwriteExisting: boolean;
  /** Whether to create directory structure if it doesn't exist */
  createDirectories: boolean;
  /** File permissions for created files (octal, e.g., 0o755) */
  filePermissions: number;
  /** Directory permissions for created directories (octal, e.g., 0o755) */
  directoryPermissions: number;
}

/**
 * Complete configuration including preferences
 */
export interface AssistantConfigurationOptions {
  /** Core assistant configuration */
  config: AssistantConfig;
  /** Installation preferences */
  preferences: AssistantInstallationPreferences;
  /** Target project directory */
  projectDirectory: string;
}

/**
 * Directory mapping utility functions
 */
export class AssistantDirectoryMapper {
  /**
   * Get the base directory path for an assistant
   */
  static getBaseDirectory(assistant: SupportedAssistant, projectPath: string): string {
    return `${projectPath}/.ai/${assistant}`;
  }

  /**
   * Get the commands directory path for an assistant
   */
  static getCommandsDirectory(assistant: SupportedAssistant, projectPath: string): string {
    return `${projectPath}/.ai/${assistant}/commands`;
  }

  /**
   * Get the tasks directory path for an assistant
   */
  static getTasksDirectory(assistant: SupportedAssistant, projectPath: string): string {
    return `${projectPath}/.ai/${assistant}/tasks`;
  }

  /**
   * Get the configuration directory path for an assistant
   */
  static getConfigDirectory(assistant: SupportedAssistant, projectPath: string): string {
    return `${projectPath}/.ai/${assistant}/config`;
  }

  /**
   * Get complete directory configuration for an assistant
   */
  static getDirectoryConfig(
    assistant: SupportedAssistant,
    projectPath: string
  ): AssistantDirectoryConfig {
    return {
      baseDir: this.getBaseDirectory(assistant, projectPath),
      commandsDir: this.getCommandsDirectory(assistant, projectPath),
      tasksDir: this.getTasksDirectory(assistant, projectPath),
      configDir: this.getConfigDirectory(assistant, projectPath),
    };
  }

  /**
   * Create directory mapping record for all assistants
   */
  static createDirectoryMapping(
    assistants: SupportedAssistant[],
    projectPath: string
  ): Record<SupportedAssistant, string> {
    const mapping = {} as Record<SupportedAssistant, string>;

    for (const assistant of assistants) {
      mapping[assistant] = this.getBaseDirectory(assistant, projectPath);
    }

    return mapping;
  }
}

/**
 * Default installation preferences
 */
export const DEFAULT_INSTALLATION_PREFERENCES: AssistantInstallationPreferences = {
  createBackups: true,
  overwriteExisting: false,
  createDirectories: true,
  filePermissions: 0o644,
  directoryPermissions: 0o755,
};

/**
 * Create assistant configuration with directory mapping
 */
export function createAssistantConfig(
  assistants: SupportedAssistant[],
  projectPath: string = process.cwd()
): AssistantConfig {
  // Validate input
  if (!assistants || assistants.length === 0) {
    throw new Error('At least one assistant must be specified');
  }

  // Remove duplicates while preserving order
  const uniqueAssistants: SupportedAssistant[] = [];
  const seen = new Set<SupportedAssistant>();
  for (const assistant of assistants) {
    if (!seen.has(assistant)) {
      seen.add(assistant);
      uniqueAssistants.push(assistant);
    }
  }

  // Create directory mapping
  const directories = AssistantDirectoryMapper.createDirectoryMapping(
    uniqueAssistants,
    projectPath
  );

  // Create installation targets
  const installationTargets: AssistantInstallationTarget[] = uniqueAssistants.map(assistant => ({
    assistant,
    baseDirectory: AssistantDirectoryMapper.getBaseDirectory(assistant, projectPath),
    commandsDirectory: AssistantDirectoryMapper.getCommandsDirectory(assistant, projectPath),
    tasksDirectory: AssistantDirectoryMapper.getTasksDirectory(assistant, projectPath),
  }));

  return {
    assistants: uniqueAssistants,
    directories,
    installationTargets,
  };
}

/**
 * Create complete assistant configuration with preferences
 */
export function createAssistantConfigurationOptions(
  assistants: SupportedAssistant[],
  projectPath: string = process.cwd(),
  preferences: Partial<AssistantInstallationPreferences> = {}
): AssistantConfigurationOptions {
  const config = createAssistantConfig(assistants, projectPath);
  const mergedPreferences: AssistantInstallationPreferences = {
    ...DEFAULT_INSTALLATION_PREFERENCES,
    ...preferences,
  };

  return {
    config,
    preferences: mergedPreferences,
    projectDirectory: projectPath,
  };
}

/**
 * Validate assistant configuration
 */
export function validateAssistantConfig(config: AssistantConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if assistants array is not empty
  if (!config.assistants || config.assistants.length === 0) {
    errors.push('Configuration must include at least one assistant');
  }

  // Check if directories mapping exists for all assistants
  for (const assistant of config.assistants) {
    if (!config.directories[assistant]) {
      errors.push(`Missing directory mapping for assistant: ${assistant}`);
    }
  }

  // Check if installation targets exist for all assistants
  const targetAssistants = new Set(config.installationTargets.map(target => target.assistant));
  config.assistants.forEach(assistant => {
    if (!targetAssistants.has(assistant)) {
      errors.push(`Missing installation target for assistant: ${assistant}`);
    }
  });

  // Check for duplicate assistants in installation targets
  const assistantCounts = new Map<SupportedAssistant, number>();
  for (const target of config.installationTargets) {
    const count = assistantCounts.get(target.assistant) || 0;
    assistantCounts.set(target.assistant, count + 1);
  }

  assistantCounts.forEach((count, assistant) => {
    if (count > 1) {
      errors.push(`Duplicate installation target found for assistant: ${assistant}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all directory paths for a configuration
 */
export function getAllDirectoryPaths(config: AssistantConfig): string[] {
  const paths = new Set<string>();

  // Add base directories
  for (const dir of Object.values(config.directories)) {
    paths.add(dir);
  }

  // Add installation target directories
  for (const target of config.installationTargets) {
    paths.add(target.baseDirectory);
    paths.add(target.commandsDirectory);
    paths.add(target.tasksDirectory);
  }

  return Array.from(paths).sort();
}

/**
 * Type guard to check if a value is a valid AssistantConfig
 */
export function isAssistantConfig(value: any): value is AssistantConfig {
  return (
    value &&
    typeof value === 'object' &&
    Array.isArray(value.assistants) &&
    typeof value.directories === 'object' &&
    Array.isArray(value.installationTargets)
  );
}
