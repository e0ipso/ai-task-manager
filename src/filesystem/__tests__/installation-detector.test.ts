/**
 * Tests for InstallationDetector
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { InstallationDetector } from '../installation-detector';
import { FileSystemUtils } from '../utils';

describe('InstallationDetector', () => {
  let tempDir: string;
  let detector: InstallationDetector;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'detector-test-'));
    detector = new InstallationDetector();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('detectInstallation', () => {
    it('should detect no installation in empty directory', async () => {
      const result = await detector.detectInstallation(tempDir);

      expect(result.isInstalled).toBe(false);
      expect(result.partialInstallation).toBe(false);
      expect(result.version).toBeUndefined();
      expect(result.installationPath).toBeUndefined();
    });

    it('should detect complete installation', async () => {
      // Set up complete installation
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      await FileSystemUtils.createDirectory(aiDir);
      
      const versionFile = path.join(aiDir, 'VERSION');
      const configFile = path.join(aiDir, 'config.json');
      
      await fs.writeFile(versionFile, '1.0.0');
      await fs.writeFile(configFile, '{}');

      const result = await detector.detectInstallation(tempDir);

      expect(result.isInstalled).toBe(true);
      expect(result.partialInstallation).toBe(false);
      expect(result.version).toBe('1.0.0');
      expect(result.installationPath).toBe(tempDir);
    });

    it('should detect partial installation', async () => {
      // Set up partial installation (only version file)
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      await FileSystemUtils.createDirectory(aiDir);
      await fs.writeFile(path.join(aiDir, 'VERSION'), '1.0.0');

      const result = await detector.detectInstallation(tempDir);

      expect(result.isInstalled).toBe(false);
      expect(result.partialInstallation).toBe(true);
      expect(result.version).toBe('1.0.0');
    });

    it('should detect corrupted version file', async () => {
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      await FileSystemUtils.createDirectory(aiDir);
      
      // Create version file but make it inaccessible
      const versionFile = path.join(aiDir, 'VERSION');
      await fs.writeFile(versionFile, '1.0.0');
      
      // Simulate corruption by removing read permissions (Unix only)
      if (process.platform !== 'win32') {
        await fs.chmod(versionFile, 0o000);
        
        const result = await detector.detectInstallation(tempDir);
        
        expect(result.integrityIssues).toContainEqual(
          expect.objectContaining({
            path: versionFile,
            issue: 'corrupted',
            severity: 'high',
          })
        );
        
        // Restore permissions for cleanup
        await fs.chmod(versionFile, 0o644);
      }
    });
  });

  describe('analyzeConflicts', () => {
    it('should detect file conflicts', async () => {
      const existingFile = path.join(tempDir, 'existing.txt');
      await fs.writeFile(existingFile, 'existing content');

      const incomingFiles = new Map();
      incomingFiles.set('existing.txt', {
        path: 'existing.txt',
        size: 20, // Different size
        modified: new Date(),
        permissions: 0o644,
        type: 'file' as const,
        checksum: 'different-checksum',
      });

      const conflicts = await detector.analyzeConflicts(tempDir, incomingFiles);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]?.path).toBe('existing.txt');
      expect(conflicts[0]?.type).toBe('file');
    });

    it('should not detect conflicts for identical files', async () => {
      const existingFile = path.join(tempDir, 'identical.txt');
      const content = 'identical content';
      await fs.writeFile(existingFile, content);

      const fileInfo = await FileSystemUtils.getFileInfo(existingFile);
      const incomingFiles = new Map();
      incomingFiles.set('identical.txt', fileInfo);

      const conflicts = await detector.analyzeConflicts(tempDir, incomingFiles);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle inaccessible files as conflicts', async () => {
      const inaccessibleFile = path.join(tempDir, 'inaccessible.txt');
      await fs.writeFile(inaccessibleFile, 'content');
      
      // Make file inaccessible (Unix only)
      if (process.platform !== 'win32') {
        await fs.chmod(inaccessibleFile, 0o000);
      }

      const incomingFiles = new Map();
      incomingFiles.set('inaccessible.txt', {
        path: 'inaccessible.txt',
        size: 10,
        modified: new Date(),
        permissions: 0o644,
        type: 'file' as const,
      });

      const conflicts = await detector.analyzeConflicts(tempDir, incomingFiles);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]?.path).toBe('inaccessible.txt');

      // Restore permissions for cleanup
      if (process.platform !== 'win32') {
        await fs.chmod(inaccessibleFile, 0o644);
      }
    });
  });

  describe('verifyInstallationIntegrity', () => {
    it('should find missing files', async () => {
      const expectedFiles = new Map();
      expectedFiles.set('missing.txt', {
        path: 'missing.txt',
        size: 10,
        modified: new Date(),
        permissions: 0o644,
        type: 'file' as const,
      });

      detector.setExpectedFiles(expectedFiles);
      const issues = await detector.verifyInstallationIntegrity(tempDir);

      expect(issues).toHaveLength(1);
      expect(issues[0]?.path).toBe('missing.txt');
      expect(issues[0]?.issue).toBe('missing');
      expect(issues[0]?.severity).toBe('high');
    });

    it('should detect size mismatches', async () => {
      const testFile = path.join(tempDir, 'size-test.txt');
      await fs.writeFile(testFile, 'actual content');

      const expectedFiles = new Map();
      expectedFiles.set('size-test.txt', {
        path: 'size-test.txt',
        size: 999, // Wrong size
        modified: new Date(),
        permissions: 0o644,
        type: 'file' as const,
      });

      detector.setExpectedFiles(expectedFiles);
      const issues = await detector.verifyInstallationIntegrity(tempDir);

      const sizeIssue = issues.find(i => i.issue === 'size_mismatch');
      expect(sizeIssue).toBeDefined();
      expect(sizeIssue?.path).toBe('size-test.txt');
      expect(sizeIssue?.expected).toBe(999);
      expect(sizeIssue?.actual).toBe(Buffer.byteLength('actual content'));
    });

    it('should detect checksum mismatches', async () => {
      const testFile = path.join(tempDir, 'checksum-test.txt');
      const content = 'test content';
      await fs.writeFile(testFile, content);

      const actualChecksum = await FileSystemUtils.calculateChecksum(testFile);
      const expectedFiles = new Map();
      expectedFiles.set('checksum-test.txt', {
        path: 'checksum-test.txt',
        size: Buffer.byteLength(content),
        modified: new Date(),
        permissions: 0o644,
        type: 'file' as const,
        checksum: 'wrong-checksum',
      });

      detector.setExpectedFiles(expectedFiles);
      const issues = await detector.verifyInstallationIntegrity(tempDir);

      const checksumIssue = issues.find(i => i.issue === 'corrupted');
      expect(checksumIssue).toBeDefined();
      expect(checksumIssue?.expected).toBe('wrong-checksum');
      expect(checksumIssue?.actual).toBe(actualChecksum);
    });
  });

  describe('getInstallationStatus', () => {
    it('should return healthy status for good installation', async () => {
      // Set up complete, healthy installation
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      await FileSystemUtils.createDirectory(aiDir);
      await fs.writeFile(path.join(aiDir, 'VERSION'), '1.0.0');
      await fs.writeFile(path.join(aiDir, 'config.json'), '{}');

      const status = await detector.getInstallationStatus(tempDir);

      expect(status.hasInstallation).toBe(true);
      expect(status.version).toBe('1.0.0');
      expect(status.health).toBe('healthy');
      expect(status.issueCount).toBe(0);
      expect(status.lastModified).toBeInstanceOf(Date);
    });

    it('should return partial status for incomplete installation', async () => {
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      await FileSystemUtils.createDirectory(aiDir);
      await fs.writeFile(path.join(aiDir, 'VERSION'), '1.0.0');
      // Missing config.json

      const status = await detector.getInstallationStatus(tempDir);

      expect(status.hasInstallation).toBe(true);
      expect(status.health).toBe('partial');
    });

    it('should return unknown status for no installation', async () => {
      const status = await detector.getInstallationStatus(tempDir);

      expect(status.hasInstallation).toBe(false);
      expect(status.health).toBe('unknown');
      expect(status.issueCount).toBe(0);
    });
  });
});