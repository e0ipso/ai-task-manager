/**
 * File System Operations Module
 *
 * This module provides comprehensive file system operations for the AI Task Manager,
 * including installation detection, conflict resolution, atomic operations, and verification.
 */

// Core types and interfaces
export * from './types';

// Utilities
export { FileSystemUtils } from './utils';

// Main components
export { InstallationDetector } from './installation-detector';
export {
  ConflictResolutionManager,
  InteractiveConflictResolver,
  AutoConflictResolver,
  createPromptBasedResolver,
  createResolverFromConfig,
  type ConflictResolutionStrategy,
} from './conflict-resolver';
export { AtomicInstaller } from './atomic-installer';
export {
  InstallationVerifier,
  type VerificationManifest,
  type ExpectedFileInfo,
  type ExpectedDirectoryInfo,
} from './installation-verifier';

// Integrated manager
export { FileSystemManager, type FileSystemManagerConfig } from './filesystem-manager';

// Utility functions for common use cases
import { FileSystemManager } from './filesystem-manager';

export function createFileSystemManager(config?: {
  verificationEnabled?: boolean;
  templateBasePath?: string;
}): FileSystemManager {
  const { verificationEnabled = true } = config || {};

  return new FileSystemManager({
    verificationEnabled,
  });
}

export function createDefaultInstallationConfig(
  targetDirectory: string
): import('./types').InstallationConfig {
  return {
    targetDirectory,
    overwriteMode: 'ask',
    backupMode: 'auto',
    verifyIntegrity: true,
    createBackup: true,
    permissions: {
      files: 0o644,
      directories: 0o755,
    },
    dryRun: false,
  };
}
