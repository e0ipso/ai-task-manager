/**
 * Tests for FileSystemUtils
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { FileSystemUtils } from '../utils';

describe('FileSystemUtils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-utils-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('pathExists', () => {
    it('should return true for existing files', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const exists = await FileSystemUtils.pathExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing files', async () => {
      const testFile = path.join(tempDir, 'nonexistent.txt');

      const exists = await FileSystemUtils.pathExists(testFile);
      expect(exists).toBe(false);
    });
  });

  describe('calculateChecksum', () => {
    it('should calculate consistent checksums', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      const content = 'test content for checksum';
      await fs.writeFile(testFile, content);

      const checksum1 = await FileSystemUtils.calculateChecksum(testFile);
      const checksum2 = await FileSystemUtils.calculateChecksum(testFile);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(64); // SHA256 hex length
    });

    it('should produce different checksums for different content', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      
      await fs.writeFile(file1, 'content 1');
      await fs.writeFile(file2, 'content 2');

      const checksum1 = await FileSystemUtils.calculateChecksum(file1);
      const checksum2 = await FileSystemUtils.calculateChecksum(file2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('getFileInfo', () => {
    it('should get comprehensive file information', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      const content = 'test content';
      await fs.writeFile(testFile, content);

      const info = await FileSystemUtils.getFileInfo(testFile);

      expect(info.path).toBe(testFile);
      expect(info.size).toBe(Buffer.byteLength(content));
      expect(info.type).toBe('file');
      expect(info.checksum).toBeDefined();
      expect(info.modified.getTime()).toBeGreaterThan(0);
    });

    it('should get directory information', async () => {
      const testDir = path.join(tempDir, 'test-dir');
      await fs.mkdir(testDir);

      const info = await FileSystemUtils.getFileInfo(testDir);

      expect(info.path).toBe(testDir);
      expect(info.type).toBe('directory');
      expect(info.checksum).toBeUndefined(); // Directories don't have checksums
    });
  });

  describe('createDirectory', () => {
    it('should create directories recursively', async () => {
      const nestedDir = path.join(tempDir, 'nested', 'deep', 'directory');

      await FileSystemUtils.createDirectory(nestedDir);

      const exists = await FileSystemUtils.pathExists(nestedDir);
      expect(exists).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const testDir = path.join(tempDir, 'existing');
      await fs.mkdir(testDir);

      await expect(FileSystemUtils.createDirectory(testDir))
        .resolves
        .not.toThrow();
    });
  });

  describe('copyFileWithVerification', () => {
    it('should copy files with integrity verification', async () => {
      const source = path.join(tempDir, 'source.txt');
      const dest = path.join(tempDir, 'dest.txt');
      const content = 'test content for copying';
      
      await fs.writeFile(source, content);

      await FileSystemUtils.copyFileWithVerification(source, dest, {
        verifyIntegrity: true,
      });

      const exists = await FileSystemUtils.pathExists(dest);
      expect(exists).toBe(true);

      const copiedContent = await fs.readFile(dest, 'utf-8');
      expect(copiedContent).toBe(content);

      // Verify checksums match
      const sourceChecksum = await FileSystemUtils.calculateChecksum(source);
      const destChecksum = await FileSystemUtils.calculateChecksum(dest);
      expect(sourceChecksum).toBe(destChecksum);
    });

    it('should preserve timestamps when requested', async () => {
      const source = path.join(tempDir, 'source.txt');
      const dest = path.join(tempDir, 'dest.txt');
      
      await fs.writeFile(source, 'content');
      const originalStats = await fs.stat(source);

      await FileSystemUtils.copyFileWithVerification(source, dest, {
        preserveTimestamps: true,
      });

      const copiedStats = await fs.stat(dest);
      expect(copiedStats.mtime.getTime()).toBe(originalStats.mtime.getTime());
    });
  });

  describe('copyDirectory', () => {
    it('should copy directory structure recursively', async () => {
      const sourceDir = path.join(tempDir, 'source');
      const destDir = path.join(tempDir, 'dest');
      
      // Create source directory structure
      await fs.mkdir(sourceDir);
      await fs.mkdir(path.join(sourceDir, 'subdir'));
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content 1');
      await fs.writeFile(path.join(sourceDir, 'subdir', 'file2.txt'), 'content 2');

      await FileSystemUtils.copyDirectory(sourceDir, destDir);

      // Verify structure was copied
      expect(await FileSystemUtils.pathExists(destDir)).toBe(true);
      expect(await FileSystemUtils.pathExists(path.join(destDir, 'subdir'))).toBe(true);
      expect(await FileSystemUtils.pathExists(path.join(destDir, 'file1.txt'))).toBe(true);
      expect(await FileSystemUtils.pathExists(path.join(destDir, 'subdir', 'file2.txt'))).toBe(true);

      // Verify content
      const content1 = await fs.readFile(path.join(destDir, 'file1.txt'), 'utf-8');
      const content2 = await fs.readFile(path.join(destDir, 'subdir', 'file2.txt'), 'utf-8');
      expect(content1).toBe('content 1');
      expect(content2).toBe('content 2');
    });
  });

  describe('createBackup', () => {
    it('should create timestamped backup', async () => {
      const sourceFile = path.join(tempDir, 'source.txt');
      const backupDir = path.join(tempDir, 'backups');
      
      await fs.writeFile(sourceFile, 'original content');

      const backupPath = await FileSystemUtils.createBackup(sourceFile, backupDir, {
        timestamp: true,
      });

      expect(await FileSystemUtils.pathExists(backupPath)).toBe(true);
      expect(backupPath).toMatch(/\.backup\.\d+$/);

      const backupContent = await fs.readFile(backupPath, 'utf-8');
      expect(backupContent).toBe('original content');
    });
  });

  describe('atomic operations', () => {
    it('should create and manage atomic context', async () => {
      const operationId = 'test-operation';

      const context = await FileSystemUtils.createAtomicContext(operationId);

      expect(context.operationId).toBe(operationId);
      expect(context.tempDirectory).toBeDefined();
      expect(await FileSystemUtils.pathExists(context.tempDirectory)).toBe(true);
      expect(context.operations).toEqual([]);
      expect(context.committed).toBe(false);

      // Cleanup
      await FileSystemUtils.remove(context.tempDirectory, { recursive: true });
    });

    it('should add operations to context', async () => {
      const context = await FileSystemUtils.createAtomicContext('test');

      FileSystemUtils.addAtomicOperation(context, {
        type: 'copy_file',
        source: '/source/path',
        target: '/target/path',
      });

      expect(context.operations).toHaveLength(1);
      expect(context.operations[0]?.type).toBe('copy_file');
      expect(context.operations[0]?.id).toBeDefined();
      expect(context.operations[0]?.completed).toBe(false);

      // Cleanup
      await FileSystemUtils.remove(context.tempDirectory, { recursive: true });
    });
  });

  describe('remove', () => {
    it('should remove files', async () => {
      const testFile = path.join(tempDir, 'to-remove.txt');
      await fs.writeFile(testFile, 'content');

      await FileSystemUtils.remove(testFile);

      expect(await FileSystemUtils.pathExists(testFile)).toBe(false);
    });

    it('should remove directories recursively', async () => {
      const testDir = path.join(tempDir, 'to-remove');
      await fs.mkdir(testDir);
      await fs.writeFile(path.join(testDir, 'file.txt'), 'content');

      await FileSystemUtils.remove(testDir, { recursive: true });

      expect(await FileSystemUtils.pathExists(testDir)).toBe(false);
    });
  });
});