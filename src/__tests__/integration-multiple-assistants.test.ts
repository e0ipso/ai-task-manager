/**
 * Integration tests for multiple assistant selection
 * Verifies command duplication across assistant directories
 * Tests comprehensive scenarios including rollback, performance, and isolation
 */

import { FileSystemManager } from '../filesystem/filesystem-manager';
import { createDefaultInstallationConfig } from '../filesystem';
import { CommandManager } from '../command-manager';
import { createAssistantConfig, AssistantConfig } from '../types/assistant-config';
import { SupportedAssistant } from '../utils/assistant-validator';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { performance } from 'perf_hooks';

describe('Multiple Assistant Integration Tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let fsManager: FileSystemManager;
  let commandManager: CommandManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'assistant-multi-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    fsManager = new FileSystemManager({ verificationEnabled: false });
    commandManager = new CommandManager();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Multiple Assistant Installation', () => {
    it('should create both Claude and Gemini structures', async () => {
      const assistantConfig = createAssistantConfig(['claude', 'gemini'], tempDir);
      const config = createDefaultInstallationConfig(tempDir);

      const result = await fsManager.installForAssistants(tempDir, config, assistantConfig);

      expect(result.success).toBe(true);

      // Verify both directory structures exist
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      const geminiBaseDir = path.join(tempDir, '.ai', 'gemini');

      expect(await pathExists(claudeBaseDir)).toBe(true);
      expect(await pathExists(geminiBaseDir)).toBe(true);

      // Verify subdirectories
      const claudeCommandsDir = path.join(claudeBaseDir, 'commands');
      const claudeTasksDir = path.join(claudeBaseDir, 'tasks');
      const geminiCommandsDir = path.join(geminiBaseDir, 'commands');
      const geminiTasksDir = path.join(geminiBaseDir, 'tasks');

      expect(await pathExists(claudeCommandsDir)).toBe(true);
      expect(await pathExists(claudeTasksDir)).toBe(true);
      expect(await pathExists(geminiCommandsDir)).toBe(true);
      expect(await pathExists(geminiTasksDir)).toBe(true);

      // Verify shared .ai directory structure
      const sharedTaskManagerDir = path.join(tempDir, '.ai', 'task-manager');
      expect(await pathExists(sharedTaskManagerDir)).toBe(true);

      // Verify assistant configuration structure
      expect(assistantConfig.assistants).toEqual(['claude', 'gemini']);
      expect(assistantConfig.installationTargets).toHaveLength(2);
    });

    it('should create structures for different order combinations', async () => {
      // Test first order
      const assistantConfig1 = createAssistantConfig(['gemini', 'claude'], tempDir);
      const config1 = createDefaultInstallationConfig(tempDir);

      const result1 = await fsManager.installForAssistants(tempDir, config1, assistantConfig1);
      expect(result1.success).toBe(true);
      expect(assistantConfig1.assistants).toEqual(['gemini', 'claude']);

      // Clear and test reverse order
      await fs.rm(path.join(tempDir, '.ai'), { recursive: true, force: true });

      const assistantConfig2 = createAssistantConfig(['claude', 'gemini'], tempDir);
      const config2 = createDefaultInstallationConfig(tempDir);

      const result2 = await fsManager.installForAssistants(tempDir, config2, assistantConfig2);
      expect(result2.success).toBe(true);
      expect(assistantConfig2.assistants).toEqual(['claude', 'gemini']);
    });

    it('should handle single assistant for backwards compatibility', async () => {
      const assistantConfig = createAssistantConfig(['claude'], tempDir);
      const config = createDefaultInstallationConfig(tempDir);

      const result = await fsManager.installForAssistants(tempDir, config, assistantConfig);
      expect(result.success).toBe(true);

      // Verify only Claude structure exists
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      const geminiBaseDir = path.join(tempDir, '.ai', 'gemini');

      expect(await pathExists(claudeBaseDir)).toBe(true);
      expect(await pathExists(geminiBaseDir)).toBe(false);
    });
  });

  describe('Command Duplication', () => {
    beforeEach(async () => {
      // Create test command files
      const sourceDir = path.join(tempDir, 'source-commands');
      await fs.mkdir(sourceDir, { recursive: true });

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

    it('should duplicate commands to both assistant directories', async () => {
      const sourceDir = path.join(tempDir, 'source-commands');
      const assistantConfig = createAssistantConfig(['claude', 'gemini'], tempDir);

      // First install the basic structure
      const config = createDefaultInstallationConfig(tempDir);
      await fsManager.installForAssistants(tempDir, config, assistantConfig);

      // Then install commands
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
      expect(result.results.claude!.errors.length).toBe(0);

      // Check Gemini installation
      expect(result.results.gemini).toBeDefined();
      expect(result.results.gemini!.installed.length).toBe(2);
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

    it('should maintain identical file contents across directories', async () => {
      const sourceDir = path.join(tempDir, 'source-commands');
      const assistantConfig = createAssistantConfig(['claude', 'gemini'], tempDir);

      // Install structure and commands
      const config = createDefaultInstallationConfig(tempDir);
      await fsManager.installForAssistants(tempDir, config, assistantConfig);
      
      await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        assistantConfig,
        { overwrite: false, validate: true }
      );

      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');

      const claudeFiles = await fs.readdir(claudeTasksDir);

      // Compare content of each file
      for (const fileName of claudeFiles) {
        const claudeFilePath = path.join(claudeTasksDir, fileName);
        const geminiFilePath = path.join(geminiTasksDir, fileName);

        const claudeContent = await fs.readFile(claudeFilePath, 'utf8');
        const geminiContent = await fs.readFile(geminiFilePath, 'utf8');

        expect(claudeContent).toEqual(geminiContent);
        expect(claudeContent.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Independent Directory Operations', () => {
    beforeEach(async () => {
      const sourceDir = path.join(tempDir, 'source-commands');
      await fs.mkdir(sourceDir, { recursive: true });

      const testCommand = `---
description: Base command
argumentHint: arg
---

# Base Command

This is a base command for testing.`;

      await fs.writeFile(path.join(sourceDir, 'base-command.md'), testCommand);

      const assistantConfig = createAssistantConfig(['claude', 'gemini'], tempDir);
      const config = createDefaultInstallationConfig(tempDir);
      
      await fsManager.installForAssistants(tempDir, config, assistantConfig);
      await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        assistantConfig,
        { overwrite: false, validate: true }
      );
    });

    it('should allow independent file modifications in each directory', async () => {
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');

      // Modify a file in Claude directory only
      const claudeCommandPath = path.join(claudeTasksDir, 'base-command.md');
      const originalContent = await fs.readFile(claudeCommandPath, 'utf8');
      const modifiedContent = originalContent + '\n\n<!-- Modified in Claude directory -->';
      
      await fs.writeFile(claudeCommandPath, modifiedContent);

      // Verify Claude directory has modified content
      const claudeContent = await fs.readFile(claudeCommandPath, 'utf8');
      expect(claudeContent).toContain('Modified in Claude directory');

      // Verify Gemini directory is unchanged
      const geminiCommandPath = path.join(geminiTasksDir, 'base-command.md');
      const geminiContent = await fs.readFile(geminiCommandPath, 'utf8');
      expect(geminiContent).not.toContain('Modified in Claude directory');
      expect(geminiContent).toEqual(originalContent);
    });

    it('should allow independent file additions in each directory', async () => {
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');

      // Add a file to Claude directory only
      const customClaudeFile = path.join(claudeTasksDir, 'claude-specific.md');
      await fs.writeFile(customClaudeFile, '# Claude-specific command\n\nThis command is only for Claude.');

      // Verify file exists in Claude directory
      expect(await pathExists(customClaudeFile)).toBe(true);

      // Verify file does not exist in Gemini directory
      const customGeminiFile = path.join(geminiTasksDir, 'claude-specific.md');
      expect(await pathExists(customGeminiFile)).toBe(false);

      // Verify directory contents are different
      const claudeFiles = await fs.readdir(claudeTasksDir);
      const geminiFiles = await fs.readdir(geminiTasksDir);

      expect(claudeFiles).toContain('claude-specific.md');
      expect(geminiFiles).not.toContain('claude-specific.md');
    });

    it('should allow independent file deletions in each directory', async () => {
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');

      // Delete a file from Claude directory only
      const claudeCommandPath = path.join(claudeTasksDir, 'base-command.md');
      const geminiCommandPath = path.join(geminiTasksDir, 'base-command.md');

      // Verify both files exist initially
      expect(await pathExists(claudeCommandPath)).toBe(true);
      expect(await pathExists(geminiCommandPath)).toBe(true);

      // Delete from Claude directory
      await fs.unlink(claudeCommandPath);

      // Verify file is deleted from Claude but still exists in Gemini
      expect(await pathExists(claudeCommandPath)).toBe(false);
      expect(await pathExists(geminiCommandPath)).toBe(true);
    });
  });

  describe('Performance Impact', () => {
    it('should measure duplication performance impact', async () => {
      // Create test command files
      const sourceDir = path.join(tempDir, 'perf-commands');
      await fs.mkdir(sourceDir, { recursive: true });

      const commandCount = 10;
      for (let i = 1; i <= commandCount; i++) {
        const commandContent = `---
description: Performance test command ${i}
argumentHint: arg${i}
---

# Performance Test Command ${i}

This is test command number ${i} for performance testing.
`;
        await fs.writeFile(path.join(sourceDir, `perf-command-${i}.md`), commandContent);
      }

      // Measure single assistant installation
      const singleConfig = createAssistantConfig(['claude'], tempDir);
      const config1 = createDefaultInstallationConfig(tempDir);

      const singleStart = performance.now();
      await fsManager.installForAssistants(tempDir, config1, singleConfig);
      await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        singleConfig,
        { overwrite: false, validate: true }
      );
      const singleDuration = performance.now() - singleStart;

      // Clean up for next test
      await fs.rm(path.join(tempDir, '.ai'), { recursive: true, force: true });

      // Measure multiple assistant installation
      const multipleConfig = createAssistantConfig(['claude', 'gemini'], tempDir);
      const config2 = createDefaultInstallationConfig(tempDir);

      const multipleStart = performance.now();
      await fsManager.installForAssistants(tempDir, config2, multipleConfig);
      await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        multipleConfig,
        { overwrite: false, validate: true }
      );
      const multipleDuration = performance.now() - multipleStart;

      // Performance assertions
      expect(singleDuration).toBeGreaterThan(0);
      expect(multipleDuration).toBeGreaterThan(0);
      
      // Multiple assistant installation should take longer but not excessively so
      // Allow up to 3x the time for reasonable overhead
      expect(multipleDuration).toBeLessThan(singleDuration * 3);

      // Log performance metrics for analysis
      console.log(`Single assistant: ${singleDuration.toFixed(2)}ms`);
      console.log(`Multiple assistants: ${multipleDuration.toFixed(2)}ms`);
      console.log(`Performance ratio: ${(multipleDuration / singleDuration).toFixed(2)}x`);
    });
  });

  describe('Directory Isolation', () => {
    beforeEach(async () => {
      const sourceDir = path.join(tempDir, 'isolation-commands');
      await fs.mkdir(sourceDir, { recursive: true });

      const testCommand = `---
description: Isolation test command
argumentHint: arg
---

# Isolation Test Command

This is a command for testing directory isolation.`;

      await fs.writeFile(path.join(sourceDir, 'isolation-command.md'), testCommand);

      const assistantConfig = createAssistantConfig(['claude', 'gemini'], tempDir);
      const config = createDefaultInstallationConfig(tempDir);
      
      await fsManager.installForAssistants(tempDir, config, assistantConfig);
      await commandManager.installCommandsForAssistants(
        sourceDir,
        tempDir,
        assistantConfig,
        { overwrite: false, validate: true }
      );
    });

    it('should maintain separate file permissions', async () => {
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');

      const claudeCommandPath = path.join(claudeTasksDir, 'isolation-command.md');
      const geminiCommandPath = path.join(geminiTasksDir, 'isolation-command.md');

      // Change permissions on Claude file only
      await fs.chmod(claudeCommandPath, 0o600);

      const claudeStats = await fs.stat(claudeCommandPath);
      const geminiStats = await fs.stat(geminiCommandPath);

      // Permissions should be different
      expect(claudeStats.mode).not.toEqual(geminiStats.mode);
      
      // Restore permissions for cleanup
      await fs.chmod(claudeCommandPath, 0o644);
    });

    it('should handle concurrent access to different directories', async () => {
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');
      const geminiTasksDir = path.join(tempDir, '.ai', 'gemini', 'tasks');

      // Concurrent file operations on different directories
      const promises = [
        fs.writeFile(path.join(claudeTasksDir, 'concurrent-claude.md'), 'Claude concurrent test'),
        fs.writeFile(path.join(geminiTasksDir, 'concurrent-gemini.md'), 'Gemini concurrent test'),
        fs.readdir(claudeTasksDir),
        fs.readdir(geminiTasksDir)
      ];

      const results = await Promise.all(promises);
      
      // Should complete without errors
      expect(results).toHaveLength(4);

      // Verify files were created in correct directories
      expect(await pathExists(path.join(claudeTasksDir, 'concurrent-claude.md'))).toBe(true);
      expect(await pathExists(path.join(geminiTasksDir, 'concurrent-gemini.md'))).toBe(true);
      
      // Verify no cross-contamination
      expect(await pathExists(path.join(claudeTasksDir, 'concurrent-gemini.md'))).toBe(false);
      expect(await pathExists(path.join(geminiTasksDir, 'concurrent-claude.md'))).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle duplicate assistants in configuration', async () => {
      // createAssistantConfig should handle duplicates automatically
      const assistantConfig = createAssistantConfig(['claude', 'claude', 'gemini', 'gemini'], tempDir);
      
      // Verify only unique assistants are configured
      expect(assistantConfig.assistants).toEqual(['claude', 'gemini']);
      expect(assistantConfig.installationTargets).toHaveLength(2);
    });

    it('should validate assistant configuration integrity', async () => {
      const assistantConfig = createAssistantConfig(['claude', 'gemini'], tempDir);
      const config = createDefaultInstallationConfig(tempDir);

      const result = await fsManager.installForAssistants(tempDir, config, assistantConfig);
      expect(result.success).toBe(true);

      // Verify assistant configuration integrity
      expect(assistantConfig.assistants).toEqual(['claude', 'gemini']);
      expect(assistantConfig.installationTargets).toHaveLength(2);
      
      for (const target of assistantConfig.installationTargets) {
        expect(['claude', 'gemini']).toContain(target.assistant);
        expect(await pathExists(target.baseDirectory)).toBe(true);
        expect(await pathExists(target.commandsDirectory)).toBe(true);
        expect(await pathExists(target.tasksDirectory)).toBe(true);
      }
    });
  });
});

// Helper function to check if path exists
async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}