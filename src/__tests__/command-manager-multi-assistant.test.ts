import { CommandManager } from '../command-manager';
import { createAssistantConfig } from '../types/assistant-config';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

describe('CommandManager Multi-Assistant Support', () => {
  let tempDir: string;
  let commandManager: CommandManager;
  let sourceDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'command-manager-test-'));
    commandManager = new CommandManager();

    // Create source directory with test commands
    sourceDir = path.join(tempDir, 'source');
    await fs.mkdir(sourceDir, { recursive: true });

    // Create test command files
    const testCommand1 = `---
description: Test command 1
argumentHint: arg1
---

# Test Command 1

This is a test command for multi-assistant installation.`;

    const testCommand2 = `---
description: Test command 2
argumentHint: arg2
---

# Test Command 2

This is another test command for multi-assistant installation.`;

    await fs.writeFile(path.join(sourceDir, 'test-command-1.md'), testCommand1);
    await fs.writeFile(path.join(sourceDir, 'test-command-2.md'), testCommand2);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('installCommandsForAssistants', () => {
    it('should install commands to multiple assistants', async () => {
      const assistantConfig = createAssistantConfig(['claude', 'gemini'], tempDir);

      const result = await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        assistantConfig,
        { overwrite: false, validate: true }
      );

      expect(result.success).toBe(true);
      expect(Object.keys(result.results)).toEqual(['claude', 'gemini']);

      // Check Claude installation
      expect(result.results.claude).toBeDefined();
      expect(result.results.claude!.installed.length).toBe(2);
      expect(result.results.claude!.skipped.length).toBe(0);
      expect(result.results.claude!.errors.length).toBe(0);

      // Check Gemini installation
      expect(result.results.gemini).toBeDefined();
      expect(result.results.gemini!.installed.length).toBe(2);
      expect(result.results.gemini!.skipped.length).toBe(0);
      expect(result.results.gemini!.errors.length).toBe(0);

      // Verify files exist in both directories
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');

      const claudeFiles = await fs.readdir(claudeTasksDir);
      const geminiFiles = await fs.readdir(geminiTasksDir);

      expect(claudeFiles).toContain('test-command-1.md');
      expect(claudeFiles).toContain('test-command-2.md');
      expect(geminiFiles).toContain('test-command-1.md');
      expect(geminiFiles).toContain('test-command-2.md');
    });

    it('should handle validation errors', async () => {
      // Create invalid command file
      await fs.writeFile(
        path.join(sourceDir, 'invalid-command.md'),
        'Invalid command without frontmatter'
      );

      const assistantConfig = createAssistantConfig(['claude'], tempDir);

      const result = await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        assistantConfig,
        { overwrite: false, validate: true }
      );

      expect(result.success).toBe(false);
      expect(result.results.claude).toBeDefined();
      expect(result.results.claude!.installed.length).toBe(2); // Valid commands still installed
      expect(result.results.claude!.errors.length).toBe(1); // Invalid command error
    });

    it('should skip existing files when overwrite is false', async () => {
      const assistantConfig = createAssistantConfig(['claude'], tempDir);

      // First installation
      await commandManager.installCommandsForAssistants(sourceDir, tempDir, assistantConfig, {
        overwrite: false,
        validate: true,
      });

      // Second installation - should skip existing files
      const result = await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        assistantConfig,
        { overwrite: false, validate: true }
      );

      expect(result.success).toBe(true);
      expect(result.results.claude).toBeDefined();
      expect(result.results.claude!.installed.length).toBe(0);
      expect(result.results.claude!.skipped.length).toBe(2);
    });

    it('should overwrite existing files when overwrite is true', async () => {
      const assistantConfig = createAssistantConfig(['claude'], tempDir);

      // First installation
      await commandManager.installCommandsForAssistants(sourceDir, tempDir, assistantConfig, {
        overwrite: false,
        validate: true,
      });

      // Second installation with overwrite
      const result = await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        assistantConfig,
        { overwrite: true, validate: true }
      );

      expect(result.success).toBe(true);
      expect(result.results.claude).toBeDefined();
      expect(result.results.claude!.installed.length).toBe(2);
      expect(result.results.claude!.skipped.length).toBe(0);
    });

    it('should validate paths before installation', async () => {
      const assistantConfig = createAssistantConfig(['claude'], tempDir);

      const result = await commandManager.installCommandsForAssistants(
        '/nonexistent/directory',
        tempDir,
        assistantConfig,
        { overwrite: false, validate: true }
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Path validation failed');
    });
  });

  describe('installCommandsForSingleAssistant', () => {
    it('should install commands to single assistant', async () => {
      const result = await commandManager.installCommandsForSingleAssistant(
        sourceDir,
        tempDir,
        'claude',
        { overwrite: false, validate: true }
      );

      expect(result.installed.length).toBe(2);
      expect(result.skipped.length).toBe(0);
      expect(result.errors.length).toBe(0);

      // Verify files exist in Claude directory only
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const claudeFiles = await fs.readdir(claudeTasksDir);

      expect(claudeFiles).toContain('test-command-1.md');
      expect(claudeFiles).toContain('test-command-2.md');

      // Verify Gemini directory doesn't exist
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');
      await expect(fs.access(geminiTasksDir)).rejects.toThrow();
    });

    it('should handle invalid assistant type', async () => {
      await expect(
        commandManager.installCommandsForSingleAssistant(sourceDir, tempDir, 'invalid' as any, {
          overwrite: false,
          validate: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('getCommandFiles', () => {
    it('should load command files from directory', async () => {
      const commands = await commandManager.getCommandFiles(sourceDir);

      expect(commands.length).toBe(2);
      expect(commands[0]!.filename).toBe('test-command-1.md');
      expect(commands[0]!.frontmatter.description).toBe('Test command 1');
      expect(commands[0]!.filePath).toBe(path.join(sourceDir, 'test-command-1.md'));
      expect(commands[1]!.filename).toBe('test-command-2.md');
      expect(commands[1]!.frontmatter.description).toBe('Test command 2');
      expect(commands[1]!.filePath).toBe(path.join(sourceDir, 'test-command-2.md'));
    });

    it('should return empty array for directory with no markdown files', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fs.mkdir(emptyDir);

      const commands = await commandManager.getCommandFiles(emptyDir);
      expect(commands.length).toBe(0);
    });

    it('should handle non-existent directory', async () => {
      await expect(commandManager.getCommandFiles('/nonexistent/directory')).rejects.toThrow(
        'Failed to load commands from'
      );
    });
  });
});
