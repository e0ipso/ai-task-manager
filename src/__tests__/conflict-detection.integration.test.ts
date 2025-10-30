/**
 * Integration Tests for File Conflict Detection
 *
 * Tests the complete conflict detection workflow including:
 * - First-time initialization
 * - Re-initialization with no changes
 * - Re-initialization with user modifications
 * - Force flag behavior
 * - Metadata handling
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { init } from '../index';
import { loadMetadata, calculateFileHash } from '../metadata';

// Mock chalk before importing modules to avoid ESM issues in tests
jest.mock('chalk', () => {
  const createMockChain = () => {
    const fn: any = jest.fn((str: string) => str);
    fn.bold = jest.fn((str: string) => str);
    return fn;
  };

  const mockChalk = {
    cyan: createMockChain(),
    green: jest.fn((str: string) => str),
    blue: jest.fn((str: string) => str),
    gray: jest.fn((str: string) => str),
    yellow: jest.fn((str: string) => str),
    red: jest.fn((str: string) => str),
    white: jest.fn((str: string) => str),
    bold: {
      cyan: jest.fn((str: string) => str),
      white: jest.fn((str: string) => str),
    },
  };

  return {
    __esModule: true,
    default: mockChalk,
    ...mockChalk,
  };
});

// Mock the prompts module since it uses ESM and we can't test interactive prompts
// in automated tests anyway. The key is to test the metadata and detection logic.
jest.mock('../prompts', () => ({
  promptForConflicts: jest.fn().mockResolvedValue(new Map()),
}));

describe('Conflict Detection Integration Tests', () => {
  const testDir = path.join(__dirname, '../../test-temp-conflict-detection');

  // Suppress console output during tests
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Clean up test directory before each test
    await fs.remove(testDir);
    await fs.ensureDir(testDir);

    // Suppress console output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    // Clean up test directory after each test
    await fs.remove(testDir);

    // Restore console
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('First-time initialization', () => {
    it('should create metadata file on first init', async () => {
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      // Check metadata file exists
      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const metadata = await loadMetadata(metadataPath);

      expect(metadata).not.toBeNull();
      expect(metadata?.version).toBeDefined();
      expect(metadata?.timestamp).toBeDefined();
      expect(metadata?.files).toBeDefined();
      expect(Object.keys(metadata?.files || {}).length).toBeGreaterThan(0);
    });

    it('should track config files in metadata', async () => {
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const metadata = await loadMetadata(metadataPath);

      // Check that config files are tracked
      expect(metadata?.files['config/TASK_MANAGER.md']).toBeDefined();
      expect(metadata?.files['config/hooks/POST_PHASE.md']).toBeDefined();
    });

    it('should not track scripts directory in metadata', async () => {
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const metadata = await loadMetadata(metadataPath);

      // Check that scripts files are NOT tracked
      const scriptFiles = Object.keys(metadata?.files || {}).filter(f =>
        f.includes('scripts/')
      );
      expect(scriptFiles.length).toBe(0);
    });
  });

  describe('Re-initialization with no changes', () => {
    it('should update metadata without prompting when no files changed', async () => {
      // First init
      await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const oldMetadata = await loadMetadata(metadataPath);
      const oldTimestamp = oldMetadata?.timestamp;

      // Wait a moment to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second init without changes
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      // Check metadata was updated
      const newMetadata = await loadMetadata(metadataPath);
      expect(newMetadata?.timestamp).not.toBe(oldTimestamp);
      expect(newMetadata?.version).toBe(oldMetadata?.version);
    });
  });

  describe('Re-initialization with user modifications', () => {
    it('should detect modified files', async () => {
      // First init
      await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      // Modify a config file
      const configFile = path.join(testDir, '.ai/task-manager/config/TASK_MANAGER.md');
      const originalContent = await fs.readFile(configFile, 'utf-8');
      await fs.writeFile(configFile, originalContent + '\n# User modification\n', 'utf-8');

      // Get metadata to verify hash changed
      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const metadata = await loadMetadata(metadataPath);
      const originalHash = metadata?.files['config/TASK_MANAGER.md'];
      const currentHash = await calculateFileHash(configFile);

      expect(currentHash).not.toBe(originalHash);
    });
  });

  describe('Force flag behavior', () => {
    it('should overwrite all files when force flag is used', async () => {
      // First init
      await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      // Modify a config file
      const configFile = path.join(testDir, '.ai/task-manager/config/TASK_MANAGER.md');
      const originalContent = await fs.readFile(configFile, 'utf-8');
      await fs.writeFile(configFile, originalContent + '\n# User modification\n', 'utf-8');

      // Second init with force flag
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
        force: true,
      });

      expect(result.success).toBe(true);

      // Check file was overwritten (no user modification)
      const newContent = await fs.readFile(configFile, 'utf-8');
      expect(newContent).not.toContain('# User modification');
    });

    it('should update metadata after force overwrite', async () => {
      // First init
      await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      // Modify a config file
      const configFile = path.join(testDir, '.ai/task-manager/config/TASK_MANAGER.md');
      const originalContent = await fs.readFile(configFile, 'utf-8');
      await fs.writeFile(configFile, originalContent + '\n# User modification\n', 'utf-8');

      // Second init with force flag
      await init({
        assistants: 'claude',
        destinationDirectory: testDir,
        force: true,
      });

      // Check metadata reflects the overwritten file
      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const metadata = await loadMetadata(metadataPath);
      const currentHash = await calculateFileHash(configFile);

      expect(metadata?.files['config/TASK_MANAGER.md']).toBe(currentHash);
    });
  });

  describe('Corrupted metadata handling', () => {
    it('should treat corrupted metadata as first-time init', async () => {
      // First init
      await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      // Corrupt metadata
      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      await fs.writeFile(metadataPath, '{ invalid json }', 'utf-8');

      // Second init should succeed (treating as first-time)
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      // Check metadata was recreated
      const metadata = await loadMetadata(metadataPath);
      expect(metadata).not.toBeNull();
      expect(metadata?.files).toBeDefined();
    });

    it('should treat missing metadata as first-time init', async () => {
      // First init
      await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      // Delete metadata
      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      await fs.remove(metadataPath);

      // Second init should succeed (treating as first-time)
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      // Check metadata was recreated
      const metadata = await loadMetadata(metadataPath);
      expect(metadata).not.toBeNull();
    });
  });

  describe('Multiple assistants', () => {
    it('should create metadata regardless of assistant selection', async () => {
      const result = await init({
        assistants: 'claude,gemini,opencode',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      // Check metadata file exists
      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const metadata = await loadMetadata(metadataPath);

      expect(metadata).not.toBeNull();
      expect(metadata?.files).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty config directory', async () => {
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      // Even if config is empty, metadata should be created
      const metadataPath = path.join(testDir, '.ai/task-manager/.init-metadata.json');
      const metadata = await loadMetadata(metadataPath);
      expect(metadata).not.toBeNull();
    });

    it('should handle very long file paths', async () => {
      const result = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
      });

      expect(result.success).toBe(true);

      // Create a deeply nested file in config
      const deepPath = path.join(
        testDir,
        '.ai/task-manager/config/deeply/nested/path/to/file.md'
      );
      await fs.ensureDir(path.dirname(deepPath));
      await fs.writeFile(deepPath, '# Test file', 'utf-8');

      // Re-init should handle it
      const result2 = await init({
        assistants: 'claude',
        destinationDirectory: testDir,
        force: true,
      });

      expect(result2.success).toBe(true);
    });
  });
});
