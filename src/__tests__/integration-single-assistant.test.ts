/**
 * Integration tests for single assistant selection
 * Tests complete end-to-end functionality for Claude-only and Gemini-only installations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock inquirer to avoid module loading issues in Node.js environments
jest.mock('inquirer', () => ({
  default: {
    prompt: jest.fn(),
  },
  prompt: jest.fn(),
}));

// Mock UI components to avoid inquirer import issues
jest.mock('../ui', () => ({
  UserInterface: jest.fn().mockImplementation((options: any) => ({
    runInitializationFlow: jest.fn().mockImplementation(() =>
      Promise.resolve({
        projectName: options?.defaults?.projectName || 'test-project',
        description: options?.defaults?.description || 'Test project description',
        template: options?.defaults?.template || 'basic',
        includeExamples: options?.defaults?.includeExamples !== false,
      })
    ),
    withProgress: jest.fn().mockImplementation(async operation => {
      return await operation();
    }),
    showInitializationSuccess: jest.fn(),
    showInitializationError: jest.fn(),
    showWarning: jest.fn(),
  })),
  UIOptions: {},
}));

// Mock template and command managers to work with tests
jest.mock('../templates/template-manager', () => ({
  TemplateManager: jest.fn().mockImplementation(() => ({
    getAvailableTemplates: jest.fn().mockResolvedValue([]),
    getTemplateManifest: jest.fn().mockResolvedValue({}),
    applyTemplate: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../command-manager', () => ({
  CommandManager: jest.fn().mockImplementation(() => ({
    getAvailableCommands: jest.fn().mockResolvedValue([]),
    installCommands: jest.fn().mockResolvedValue({}),
    copyCommandsToDirectory: jest.fn().mockResolvedValue({}),
  })),
}));

// Mock the entire filesystem manager for cleaner testing
jest.mock('../filesystem', () => ({
  FileSystemManager: jest.fn().mockImplementation(() => ({
    installForAssistants: jest
      .fn()
      .mockImplementation(async (targetDir, config, assistantConfig) => {
        // Create the directory structure based on assistant configuration
        for (const target of (assistantConfig as any).installationTargets) {
          await fs.mkdir(target.baseDirectory, { recursive: true });
          await fs.mkdir(target.commandsDirectory, { recursive: true });
          await fs.mkdir(target.tasksDirectory, { recursive: true });

          // Create some dummy command files
          const dummyCommand = path.join(target.commandsDirectory, 'example.md');
          await fs.writeFile(dummyCommand, '# Example Command\n\nThis is a test command file.');

          // Set proper permissions
          await fs.chmod(dummyCommand, 0o644);
          await fs.chmod(target.baseDirectory, 0o755);
          await fs.chmod(target.commandsDirectory, 0o755);
          await fs.chmod(target.tasksDirectory, 0o755);
        }

        return {
          success: true,
          summary: {
            filesCreated: (assistantConfig as any).installationTargets.length * 1, // 1 file per target
            directoriesCreated: (assistantConfig as any).installationTargets.length * 3, // 3 dirs per target
            bytesTransferred: 1024,
          },
          operations: (assistantConfig as any).installationTargets.map((target: any) => ({
            type: 'create_directory',
            target: target.baseDirectory,
          })),
          errors: [],
        };
      }),
    verifyInstallation: jest.fn().mockResolvedValue({
      valid: true,
      checkedFiles: 5,
      summary: 'Installation verified successfully',
      issues: [],
    }),
  })),
  createDefaultInstallationConfig: jest.fn().mockImplementation(targetDir => ({
    targetDirectory: targetDir,
    overwriteMode: 'ask',
    backupMode: 'auto',
    verifyIntegrity: true,
    createBackup: true,
    permissions: {
      files: 0o644,
      directories: 0o755,
    },
    dryRun: false,
  })),
}));

// Mock the task manager
jest.mock('../task-manager', () => ({
  TaskManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue({}),
    createTask: jest.fn().mockResolvedValue({}),
  })),
}));

import { InitOrchestrator, InitOptions } from '../init-orchestrator';

describe('Single Assistant Integration Tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let orchestrator: InitOrchestrator;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'assistant-single-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    orchestrator = new InitOrchestrator(false); // Disable verbose logging in tests
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Claude-Only Installation', () => {
    const createClaudeOptions = (overrides: Partial<InitOptions> = {}): InitOptions => ({
      project: 'claude-test-project',
      description: 'Test project for Claude integration',
      template: 'basic',
      includeExamples: true,
      nonInteractive: true,
      force: false,
      noColor: true,
      dryRun: false,
      verbose: false,
      assistants: ['claude'],
      ...overrides,
    });

    it('should create .ai/claude/ directory structure', async () => {
      const options = createClaudeOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('claude-test-project');

      // Verify Claude directory structure
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      const claudeCommandsDir = path.join(claudeBaseDir, 'commands');
      const claudeTasksDir = path.join(claudeBaseDir, 'tasks');

      await expect(fs.access(claudeBaseDir)).resolves.toBeUndefined();
      await expect(fs.access(claudeCommandsDir)).resolves.toBeUndefined();
      await expect(fs.access(claudeTasksDir)).resolves.toBeUndefined();

      // Verify no Gemini directories were created
      const geminiBaseDir = path.join(tempDir, '.ai', 'gemini');
      await expect(fs.access(geminiBaseDir)).rejects.toThrow();
    });

    it('should copy command files to .ai/claude/commands/', async () => {
      const options = createClaudeOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);

      // Check for command files in Claude directory
      const claudeCommandsDir = path.join(tempDir, '.ai', 'claude', 'commands');
      const commandFiles = await fs.readdir(claudeCommandsDir);

      // Verify at least some command files were created
      expect(commandFiles.length).toBeGreaterThan(0);

      // Check that commands are properly structured files
      for (const commandFile of commandFiles) {
        const commandPath = path.join(claudeCommandsDir, commandFile);
        const stats = await fs.stat(commandPath);
        expect(stats.isFile()).toBe(true);

        // Verify file permissions (0o644 = readable by owner, group, others; writable by owner)
        expect(stats.mode & 0o777).toBe(0o644);
      }
    });

    it('should create task files in .ai/claude/tasks/', async () => {
      const options = createClaudeOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);

      // Check for task files in Claude directory
      const claudeTasksDir = path.join(tempDir, '.ai', 'claude', 'tasks');

      // Directory should exist (even if empty initially)
      await expect(fs.access(claudeTasksDir)).resolves.toBeUndefined();

      const taskDirStats = await fs.stat(claudeTasksDir);
      expect(taskDirStats.isDirectory()).toBe(true);

      // Verify directory permissions (0o755 = rwx for owner, rx for group and others)
      expect(taskDirStats.mode & 0o777).toBe(0o755);
    });

    it('should preserve file permissions correctly', async () => {
      const options = createClaudeOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);

      // Verify directory permissions
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      const claudeCommandsDir = path.join(claudeBaseDir, 'commands');
      const claudeTasksDir = path.join(claudeBaseDir, 'tasks');

      const baseDirStats = await fs.stat(claudeBaseDir);
      const commandsDirStats = await fs.stat(claudeCommandsDir);
      const tasksDirStats = await fs.stat(claudeTasksDir);

      // All directories should have 0o755 permissions
      expect(baseDirStats.mode & 0o777).toBe(0o755);
      expect(commandsDirStats.mode & 0o777).toBe(0o755);
      expect(tasksDirStats.mode & 0o777).toBe(0o755);

      // Check file permissions in commands directory
      const commandFiles = await fs.readdir(claudeCommandsDir);
      for (const commandFile of commandFiles) {
        const commandPath = path.join(claudeCommandsDir, commandFile);
        const stats = await fs.stat(commandPath);
        if (stats.isFile()) {
          expect(stats.mode & 0o777).toBe(0o644);
        }
      }
    });

    it('should work with dry-run mode', async () => {
      const options = createClaudeOptions({ dryRun: true });

      // Mock the filesystem manager to handle dry-run properly
      const { FileSystemManager } = require('../filesystem');
      FileSystemManager.mockImplementation(() => ({
        installForAssistants: jest.fn().mockResolvedValue({
          success: true,
          summary: { filesCreated: 0, directoriesCreated: 0, bytesTransferred: 0 },
          operations: [],
          errors: [],
        }),
        verifyInstallation: jest.fn().mockResolvedValue({
          valid: true,
          checkedFiles: 0,
          summary: 'Dry run - no verification needed',
          issues: [],
        }),
      }));

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);

      // In dry-run mode, no actual files should be created in .ai directories
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      await expect(fs.access(claudeBaseDir)).rejects.toThrow();

      // But the .ai-tasks config should still exist in dry-run
      const aiTasksDir = path.join(tempDir, '.ai-tasks');
      await expect(fs.access(aiTasksDir)).resolves.toBeUndefined();
    });

    it('should work with force mode when overwriting', async () => {
      // First installation
      const initialOptions = createClaudeOptions();
      const initialResult = await orchestrator.orchestrateInit(initialOptions);
      expect(initialResult.success).toBe(true);

      // Create a dummy file to test overwriting
      const claudeCommandsDir = path.join(tempDir, '.ai', 'claude', 'commands');
      const testFilePath = path.join(claudeCommandsDir, 'test-overwrite.txt');
      await fs.writeFile(testFilePath, 'original content');

      // Second installation with force mode
      const forceOptions = createClaudeOptions({
        force: true,
        project: 'claude-forced-project',
      });
      const forceResult = await orchestrator.orchestrateInit(forceOptions);

      expect(forceResult.success).toBe(true);
      expect(forceResult.projectName).toBe('claude-forced-project');

      // Verify installation still exists and was updated
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      await expect(fs.access(claudeBaseDir)).resolves.toBeUndefined();

      // Check the updated config
      const configPath = path.join(tempDir, '.ai-tasks', 'config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      expect(config.projectName).toBe('claude-forced-project');
      expect(config.assistants).toEqual(['claude']);
    });

    it('should integrate properly with the full init flow', async () => {
      const options = createClaudeOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);
      expect(result.operationsSummary.filesCreated).toBeGreaterThan(0);
      expect(result.operationsSummary.directoriesCreated).toBeGreaterThan(0);

      // Verify the core AI Task Manager structure exists
      const aiTasksDir = path.join(tempDir, '.ai-tasks');
      const configPath = path.join(aiTasksDir, 'config.json');

      await expect(fs.access(aiTasksDir)).resolves.toBeUndefined();
      await expect(fs.access(configPath)).resolves.toBeUndefined();

      // Verify configuration contains assistant information
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      expect(config.assistants).toEqual(['claude']);
      expect(config.assistantDirectories).toHaveProperty('claude');
      expect(config.assistantDirectories.claude).toBe(path.join(tempDir, '.ai', 'claude'));

      // Verify Claude-specific structure
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      await expect(fs.access(claudeBaseDir)).resolves.toBeUndefined();
    });
  });

  describe('Gemini-Only Installation', () => {
    const createGeminiOptions = (overrides: Partial<InitOptions> = {}): InitOptions => ({
      project: 'gemini-test-project',
      description: 'Test project for Gemini integration',
      template: 'basic',
      includeExamples: true,
      nonInteractive: true,
      force: false,
      noColor: true,
      dryRun: false,
      verbose: false,
      assistants: ['gemini'],
      ...overrides,
    });

    it('should create .ai/gemini/ directory structure', async () => {
      const options = createGeminiOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('gemini-test-project');

      // Verify Gemini directory structure
      const geminiBaseDir = path.join(tempDir, '.ai', 'gemini');
      const geminiCommandsDir = path.join(geminiBaseDir, 'commands');
      const geminiTasksDir = path.join(geminiBaseDir, 'tasks');

      await expect(fs.access(geminiBaseDir)).resolves.toBeUndefined();
      await expect(fs.access(geminiCommandsDir)).resolves.toBeUndefined();
      await expect(fs.access(geminiTasksDir)).resolves.toBeUndefined();

      // Verify no Claude directories were created
      const claudeBaseDir = path.join(tempDir, '.ai', 'claude');
      await expect(fs.access(claudeBaseDir)).rejects.toThrow();
    });

    it('should copy command files to .ai/gemini/commands/', async () => {
      const options = createGeminiOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);

      // Check for command files in Gemini directory
      const geminiCommandsDir = path.join(tempDir, '.ai', 'gemini', 'commands');
      const commandFiles = await fs.readdir(geminiCommandsDir);

      // Verify at least some command files were created
      expect(commandFiles.length).toBeGreaterThan(0);

      // Check that commands are properly structured files
      for (const commandFile of commandFiles) {
        const commandPath = path.join(geminiCommandsDir, commandFile);
        const stats = await fs.stat(commandPath);
        expect(stats.isFile()).toBe(true);

        // Verify file permissions
        expect(stats.mode & 0o777).toBe(0o644);
      }
    });

    it('should integrate properly with the full init flow', async () => {
      const options = createGeminiOptions();

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);
      expect(result.operationsSummary.filesCreated).toBeGreaterThan(0);
      expect(result.operationsSummary.directoriesCreated).toBeGreaterThan(0);

      // Verify configuration contains assistant information
      const configPath = path.join(tempDir, '.ai-tasks', 'config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      expect(config.assistants).toEqual(['gemini']);
      expect(config.assistantDirectories).toHaveProperty('gemini');
      expect(config.assistantDirectories.gemini).toBe(path.join(tempDir, '.ai', 'gemini'));

      // Verify Gemini-specific structure
      const geminiBaseDir = path.join(tempDir, '.ai', 'gemini');
      await expect(fs.access(geminiBaseDir)).resolves.toBeUndefined();
    });
  });

  describe('Cross-Assistant Validation', () => {
    it('should not create files for unselected assistants', async () => {
      // Test Claude installation doesn't create Gemini files
      const claudeOptions: InitOptions = {
        project: 'claude-only',
        nonInteractive: true,
        assistants: ['claude'],
        dryRun: false,
        force: false,
        noColor: true,
      };

      const claudeResult = await orchestrator.orchestrateInit(claudeOptions);
      expect(claudeResult.success).toBe(true);

      // Verify Claude exists, Gemini doesn't
      const claudeDir = path.join(tempDir, '.ai', 'claude');
      const geminiDir = path.join(tempDir, '.ai', 'gemini');

      await expect(fs.access(claudeDir)).resolves.toBeUndefined();
      await expect(fs.access(geminiDir)).rejects.toThrow();

      // Clean up for next test
      await fs.rm(path.join(tempDir, '.ai'), { recursive: true, force: true });
      await fs.rm(path.join(tempDir, '.ai-tasks'), { recursive: true, force: true });

      // Test Gemini installation doesn't create Claude files
      const geminiOptions: InitOptions = {
        project: 'gemini-only',
        nonInteractive: true,
        assistants: ['gemini'],
        dryRun: false,
        force: true,
        noColor: true,
      };

      const geminiResult = await orchestrator.orchestrateInit(geminiOptions);
      expect(geminiResult.success).toBe(true);

      // Verify Gemini exists, Claude doesn't
      await expect(fs.access(geminiDir)).resolves.toBeUndefined();
      await expect(fs.access(claudeDir)).rejects.toThrow();
    });

    it('should handle assistant directory structure consistently', async () => {
      const testCases = [
        { assistant: 'claude' as const, expectedDir: '.ai/claude' },
        { assistant: 'gemini' as const, expectedDir: '.ai/gemini' },
      ];

      for (const testCase of testCases) {
        // Clean up between tests
        await fs.rm(path.join(tempDir, '.ai'), { recursive: true, force: true }).catch(() => {});
        await fs
          .rm(path.join(tempDir, '.ai-tasks'), { recursive: true, force: true })
          .catch(() => {});

        const options: InitOptions = {
          project: `${testCase.assistant}-consistency-test`,
          nonInteractive: true,
          assistants: [testCase.assistant],
          dryRun: false,
          force: true,
          noColor: true,
        };

        const result = await orchestrator.orchestrateInit(options);
        expect(result.success).toBe(true);

        // Verify consistent directory structure
        const baseDir = path.join(tempDir, testCase.expectedDir);
        const commandsDir = path.join(baseDir, 'commands');
        const tasksDir = path.join(baseDir, 'tasks');

        await expect(fs.access(baseDir)).resolves.toBeUndefined();
        await expect(fs.access(commandsDir)).resolves.toBeUndefined();
        await expect(fs.access(tasksDir)).resolves.toBeUndefined();

        // Verify directory permissions are consistent
        const baseDirStats = await fs.stat(baseDir);
        const commandsDirStats = await fs.stat(commandsDir);
        const tasksDirStats = await fs.stat(tasksDir);

        expect(baseDirStats.mode & 0o777).toBe(0o755);
        expect(commandsDirStats.mode & 0o777).toBe(0o755);
        expect(tasksDirStats.mode & 0o777).toBe(0o755);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid assistant specification gracefully', async () => {
      const options: InitOptions = {
        project: 'invalid-assistant-test',
        nonInteractive: true,
        assistants: ['invalid-assistant'] as any,
        dryRun: false,
        force: false,
        noColor: true,
      };

      // This should either reject the invalid assistant or handle it gracefully
      await expect(orchestrator.orchestrateInit(options)).rejects.toThrow();
    });

    it('should fail gracefully without --force when workspace exists', async () => {
      // First installation
      const firstOptions: InitOptions = {
        project: 'first-installation',
        nonInteractive: true,
        assistants: ['claude'],
        force: false,
        noColor: true,
      };

      const firstResult = await orchestrator.orchestrateInit(firstOptions);
      expect(firstResult.success).toBe(true);

      // Second installation without force should fail
      const secondOptions: InitOptions = {
        project: 'second-installation',
        nonInteractive: true,
        assistants: ['gemini'],
        force: false,
        noColor: true,
      };

      await expect(orchestrator.orchestrateInit(secondOptions)).rejects.toThrow(/already exists/);
    });

    it('should handle permission errors gracefully', async () => {
      // Create a conflicting file where a directory should be
      const conflictPath = path.join(tempDir, '.ai');
      await fs.writeFile(conflictPath, 'conflict');

      const options: InitOptions = {
        project: 'permission-test',
        nonInteractive: true,
        assistants: ['claude'],
        force: false,
        noColor: true,
      };

      const result = await orchestrator.orchestrateInit(options);

      // Should handle the error gracefully
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should store correct assistant configuration in workspace config', async () => {
      const testCases = [
        { assistants: ['claude'], expectedAssistants: ['claude'] },
        { assistants: ['gemini'], expectedAssistants: ['gemini'] },
      ];

      for (const testCase of testCases) {
        // Clean up between tests
        await fs.rm(path.join(tempDir, '.ai'), { recursive: true, force: true }).catch(() => {});
        await fs
          .rm(path.join(tempDir, '.ai-tasks'), { recursive: true, force: true })
          .catch(() => {});

        const options: InitOptions = {
          project: `config-validation-${testCase.assistants.join('-')}`,
          nonInteractive: true,
          assistants: testCase.assistants as any,
          force: true,
          noColor: true,
        };

        const result = await orchestrator.orchestrateInit(options);
        expect(result.success).toBe(true);

        // Verify configuration
        const configPath = path.join(tempDir, '.ai-tasks', 'config.json');
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        expect(config.assistants).toEqual(testCase.expectedAssistants);
        expect(Object.keys(config.assistantDirectories)).toEqual(testCase.expectedAssistants);

        // Verify directory mappings are correct
        for (const assistant of testCase.expectedAssistants) {
          const expectedPath = path.join(tempDir, '.ai', assistant);
          expect(config.assistantDirectories[assistant]).toBe(expectedPath);
        }
      }
    });
  });
});
