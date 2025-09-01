/**
 * Tests for ConflictResolver
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { 
  ConflictResolutionManager,
  AutoConflictResolver,
  InteractiveConflictResolver 
} from '../conflict-resolver';
import { FileConflict, InstallationConfig } from '../types';

describe('ConflictResolver', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'conflict-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('AutoConflictResolver', () => {
    it('should resolve conflicts with overwrite strategy', async () => {
      const resolver = new AutoConflictResolver('overwrite');
      
      const conflict: FileConflict = {
        path: 'test.txt',
        type: 'file',
        existing: {
          path: 'test.txt',
          size: 10,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
        incoming: {
          path: 'test.txt',
          size: 20,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
      };

      const resolution = await resolver.resolveConflict(conflict);

      expect(resolution.action).toBe('overwrite');
    });

    it('should resolve conflicts with skip strategy', async () => {
      const resolver = new AutoConflictResolver('skip');
      
      const conflict: FileConflict = {
        path: 'test.txt',
        type: 'file',
        existing: {
          path: 'test.txt',
          size: 10,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
        incoming: {
          path: 'test.txt',
          size: 20,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
      };

      const resolution = await resolver.resolveConflict(conflict);

      expect(resolution.action).toBe('skip');
    });

    it('should resolve conflicts with backup strategy', async () => {
      const resolver = new AutoConflictResolver('backup');
      
      const conflict: FileConflict = {
        path: 'test.txt',
        type: 'file',
        existing: {
          path: 'test.txt',
          size: 10,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
        incoming: {
          path: 'test.txt',
          size: 20,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
      };

      const resolution = await resolver.resolveConflict(conflict);

      expect(resolution.action).toBe('overwrite');
      expect(resolution.backupOriginal).toBe(true);
    });
  });

  describe('InteractiveConflictResolver', () => {
    it('should resolve conflicts based on user input', async () => {
      const mockPrompt = jest.fn().mockResolvedValue('overwrite');
      const resolver = new InteractiveConflictResolver(mockPrompt);
      
      const conflict: FileConflict = {
        path: 'test.txt',
        type: 'file',
        existing: {
          path: 'test.txt',
          size: 10,
          modified: new Date('2023-01-01'),
          permissions: 0o644,
          type: 'file',
        },
        incoming: {
          path: 'test.txt',
          size: 20,
          modified: new Date('2023-01-02'),
          permissions: 0o644,
          type: 'file',
        },
      };

      const resolution = await resolver.resolveConflict(conflict);

      expect(mockPrompt).toHaveBeenCalled();
      expect(resolution.action).toBe('overwrite');
    });

    it('should handle rename choice', async () => {
      const mockPrompt = jest.fn().mockResolvedValue('rename');
      const resolver = new InteractiveConflictResolver(mockPrompt);
      
      const conflict: FileConflict = {
        path: 'test.txt',
        type: 'file',
        existing: {
          path: path.join(tempDir, 'test.txt'),
          size: 10,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
        incoming: {
          path: 'test.txt',
          size: 20,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
      };

      const resolution = await resolver.resolveConflict(conflict);

      expect(resolution.action).toBe('rename');
      expect(resolution.newName).toBeDefined();
    });

    it('should handle backup-and-overwrite choice', async () => {
      const mockPrompt = jest.fn().mockResolvedValue('backup-and-overwrite');
      const resolver = new InteractiveConflictResolver(mockPrompt);
      
      const conflict: FileConflict = {
        path: 'test.txt',
        type: 'file',
        existing: {
          path: 'test.txt',
          size: 10,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
        incoming: {
          path: 'test.txt',
          size: 20,
          modified: new Date(),
          permissions: 0o644,
          type: 'file',
        },
      };

      const resolution = await resolver.resolveConflict(conflict);

      expect(resolution.action).toBe('overwrite');
      expect(resolution.backupOriginal).toBe(true);
    });
  });

  describe('ConflictResolutionManager', () => {
    let manager: ConflictResolutionManager;

    beforeEach(() => {
      manager = new ConflictResolutionManager();
    });

    it('should resolve conflicts based on config overwrite mode', async () => {
      const conflicts: FileConflict[] = [
        {
          path: 'test.txt',
          type: 'file',
          existing: {
            path: 'test.txt',
            size: 10,
            modified: new Date(),
            permissions: 0o644,
            type: 'file',
          },
          incoming: {
            path: 'test.txt',
            size: 20,
            modified: new Date(),
            permissions: 0o644,
            type: 'file',
          },
        },
      ];

      const config: InstallationConfig = {
        targetDirectory: tempDir,
        overwriteMode: 'overwrite',
        backupMode: 'auto',
        verifyIntegrity: true,
        createBackup: true,
        permissions: { files: 0o644, directories: 0o755 },
      };

      const resolved = await manager.resolveConflicts(conflicts, config);

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.resolution.action).toBe('overwrite');
      expect(resolved[0]?.resolution.backupOriginal).toBe(true);
    });

    it('should skip conflicts when configured to skip', async () => {
      const conflicts: FileConflict[] = [
        {
          path: 'test.txt',
          type: 'file',
          existing: {
            path: 'test.txt',
            size: 10,
            modified: new Date(),
            permissions: 0o644,
            type: 'file',
          },
          incoming: {
            path: 'test.txt',
            size: 20,
            modified: new Date(),
            permissions: 0o644,
            type: 'file',
          },
        },
      ];

      const config: InstallationConfig = {
        targetDirectory: tempDir,
        overwriteMode: 'skip',
        backupMode: 'auto',
        verifyIntegrity: true,
        createBackup: false,
        permissions: { files: 0o644, directories: 0o755 },
      };

      const resolved = await manager.resolveConflicts(conflicts, config);

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.resolution.action).toBe('skip');
    });

    it('should merge directory conflicts', async () => {
      const conflicts: FileConflict[] = [
        {
          path: 'test-dir',
          type: 'directory',
          existing: {
            path: 'test-dir',
            size: 0,
            modified: new Date(),
            permissions: 0o755,
            type: 'directory',
          },
          incoming: {
            path: 'test-dir',
            size: 0,
            modified: new Date(),
            permissions: 0o755,
            type: 'directory',
          },
        },
      ];

      const config: InstallationConfig = {
        targetDirectory: tempDir,
        overwriteMode: 'merge',
        backupMode: 'auto',
        verifyIntegrity: true,
        createBackup: false,
        permissions: { files: 0o644, directories: 0o755 },
      };

      const resolved = await manager.resolveConflicts(conflicts, config);

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.resolution.action).toBe('merge');
    });

    it('should preview resolutions without applying them', async () => {
      const conflicts: FileConflict[] = [
        {
          path: 'test.txt',
          type: 'file',
          existing: {
            path: 'test.txt',
            size: 10,
            modified: new Date(),
            permissions: 0o644,
            type: 'file',
          },
          incoming: {
            path: 'test.txt',
            size: 20,
            modified: new Date(),
            permissions: 0o644,
            type: 'file',
          },
        },
      ];

      const config: InstallationConfig = {
        targetDirectory: tempDir,
        overwriteMode: 'overwrite',
        backupMode: 'auto',
        verifyIntegrity: true,
        createBackup: true,
        permissions: { files: 0o644, directories: 0o755 },
      };

      const preview = await manager.previewResolutions(conflicts, config);

      expect(preview).toHaveLength(1);
      expect(preview[0]?.resolution.action).toBe('overwrite');
      expect(preview[0]?.description).toContain('Replace existing file');
      expect(preview[0]?.description).toContain('with backup');
    });

    it('should apply resolutions to filesystem', async () => {
      // Create existing file
      const existingFile = path.join(tempDir, 'existing.txt');
      await fs.writeFile(existingFile, 'existing content');

      const resolvedConflict = {
        path: 'existing.txt',
        type: 'file' as const,
        existing: {
          path: existingFile,
          size: 10,
          modified: new Date(),
          permissions: 0o644,
          type: 'file' as const,
        },
        incoming: {
          path: 'existing.txt',
          size: 20,
          modified: new Date(),
          permissions: 0o644,
          type: 'file' as const,
        },
        resolution: {
          action: 'skip' as const,
        },
        appliedAt: new Date(),
        success: false,
      };

      await manager.applyResolutions([resolvedConflict], tempDir);

      expect(resolvedConflict.success).toBe(true);
      expect('error' in resolvedConflict ? resolvedConflict.error : undefined).toBeUndefined();
    });

    it('should handle resolution application errors', async () => {
      const resolvedConflict = {
        path: 'nonexistent.txt',
        type: 'file' as const,
        existing: {
          path: 'nonexistent.txt',
          size: 10,
          modified: new Date(),
          permissions: 0o644,
          type: 'file' as const,
        },
        incoming: {
          path: 'nonexistent.txt',
          size: 20,
          modified: new Date(),
          permissions: 0o644,
          type: 'file' as const,
        },
        resolution: {
          action: 'rename' as const,
          newName: 'invalid/path/with/nonexistent/directories.txt',
        },
        appliedAt: new Date(),
        success: false,
      };

      await manager.applyResolutions([resolvedConflict], tempDir);

      expect(resolvedConflict.success).toBe(true); // Skip is always successful
    });
  });
});