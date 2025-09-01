/**
 * File system operations types and interfaces
 */

export interface FileSystemError extends Error {
  code: string;
  path?: string;
  operation?: string;
}

export interface InstallationConfig {
  targetDirectory: string;
  overwriteMode: 'ask' | 'overwrite' | 'skip' | 'merge';
  backupMode: 'auto' | 'manual' | 'none';
  verifyIntegrity: boolean;
  createBackup: boolean;
  permissions: {
    files: number;
    directories: number;
  };
  dryRun?: boolean;
}

export interface FileConflict {
  path: string;
  type: 'file' | 'directory';
  existing: FileInfo;
  incoming: FileInfo;
  resolution?: ConflictResolution;
}

export interface FileInfo {
  path: string;
  size: number;
  modified: Date;
  permissions: number;
  checksum?: string;
  type: 'file' | 'directory' | 'symlink';
}

export interface ConflictResolution {
  action: 'overwrite' | 'skip' | 'merge' | 'rename';
  newName?: string;
  backupOriginal?: boolean;
}

export interface InstallationPlan {
  targetDirectory: string;
  operations: InstallationOperation[];
  conflicts: FileConflict[];
  totalSize: number;
  estimatedTime: number;
  requiresBackup: boolean;
}

export interface InstallationOperation {
  type: 'create_directory' | 'copy_file' | 'create_symlink' | 'set_permissions';
  source?: string;
  target: string;
  backup?: string;
  permissions?: number;
  skipOnError?: boolean;
}

export interface InstallationResult {
  success: boolean;
  operations: CompletedOperation[];
  conflicts: ResolvedConflict[];
  errors: InstallationError[];
  rollbackData?: RollbackData;
  summary: InstallationSummary;
}

export interface CompletedOperation extends InstallationOperation {
  completed: boolean;
  error?: string;
  timestamp: Date;
  checksum?: string;
}

export interface ResolvedConflict extends FileConflict {
  resolution: ConflictResolution;
  appliedAt: Date;
  success: boolean;
  error?: string;
}

export interface InstallationError {
  operation: InstallationOperation;
  error: string;
  code: string;
  recoverable: boolean;
  timestamp: Date;
}

export interface RollbackData {
  operations: RollbackOperation[];
  backups: BackupInfo[];
  timestamp: Date;
}

export interface RollbackOperation {
  type: 'delete_file' | 'restore_backup' | 'remove_directory' | 'restore_permissions';
  path: string;
  backupPath?: string;
  originalPermissions?: number;
}

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: Date;
  size: number;
  checksum: string;
}

export interface InstallationSummary {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  skippedOperations: number;
  filesCreated: number;
  directoriesCreated: number;
  conflictsResolved: number;
  bytesTransferred: number;
  duration: number;
}

export interface InstallationDetectionResult {
  isInstalled: boolean;
  installationPath?: string;
  version?: string;
  partialInstallation: boolean;
  conflictingFiles: string[];
  missingFiles: string[];
  integrityIssues: IntegrityIssue[];
}

export interface IntegrityIssue {
  path: string;
  issue: 'missing' | 'corrupted' | 'permission_mismatch' | 'size_mismatch';
  expected?: any;
  actual?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VerificationResult {
  valid: boolean;
  checkedFiles: number;
  validFiles: number;
  issues: IntegrityIssue[];
  summary: string;
}

export interface AtomicOperationContext {
  operationId: string;
  tempDirectory: string;
  operations: AtomicOperation[];
  committed: boolean;
  rollbackData: RollbackData;
}

export interface AtomicOperation {
  id: string;
  type: string;
  source?: string;
  target: string;
  tempTarget?: string;
  completed: boolean;
}

export type FileSystemEventType =
  | 'operation_start'
  | 'operation_complete'
  | 'operation_error'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'backup_created'
  | 'rollback_start'
  | 'rollback_complete'
  | 'verification_start'
  | 'verification_complete';

export interface FileSystemEvent {
  type: FileSystemEventType;
  timestamp: Date;
  operation?: InstallationOperation;
  error?: Error;
  data?: any;
}

export interface FileSystemEventHandler {
  (event: FileSystemEvent): void | Promise<void>;
}
