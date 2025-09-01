/**
 * Unit Tests for index.ts
 *
 * Comprehensive test suite for init command logic with mocked dependencies
 */

import { init, isInitialized, getInitInfo } from '../index';
import { InitOptions, FileSystemError, CommandResult } from '../types';
import * as logger from '../logger';
import * as utils from '../utils';

// Mock logger
jest.mock('../logger');
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock utils
jest.mock('../utils');
const mockUtils = utils as jest.Mocked<typeof utils>;

describe('index.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockLogger.info.mockResolvedValue(undefined);
    mockLogger.success.mockResolvedValue(undefined);
    mockLogger.error.mockResolvedValue(undefined);
    mockLogger.debug.mockResolvedValue(undefined);

    mockUtils.parseAssistants.mockReturnValue(['claude']);
    mockUtils.validateAssistants.mockImplementation(() => {});
    mockUtils.ensureDir.mockResolvedValue(undefined);
    mockUtils.copyTemplate.mockResolvedValue(undefined);
    mockUtils.getTemplatePath.mockImplementation((file: string) => `/workspace/templates/${file}`);
    mockUtils.getCreatedDirectories.mockReturnValue(['.ai/task-manager', '.claude']);
    mockUtils.exists.mockResolvedValue(true);
    mockUtils.getTemplateFormat.mockImplementation((assistant) => assistant === 'claude' ? 'md' : 'toml');
    mockUtils.resolvePath.mockImplementation((baseDir, ...segments) => {
      const base = baseDir || '.';
      const resolved = base === '.' ? '/workspace' : base;
      return `${resolved}/${segments.join('/')}`;
    });
  });

  afterEach(() => {
    // Clear all mocks and reset to clean state
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    // Final cleanup
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  describe('init', () => {
    const defaultOptions: InitOptions = {
      assistants: 'claude',
    };

    it('should successfully initialize with single assistant', async () => {
      const result = await init(defaultOptions);

      expect(result.success).toBe(true);
      expect(result.message).toBe('AI Task Manager initialized successfully!');
      expect(result.data).toEqual({ assistants: ['claude'] });
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing AI Task Manager in: /workspace/...');
      expect(mockLogger.success).toHaveBeenCalledWith('AI Task Manager initialized successfully!');
    });

    it('should successfully initialize with multiple assistants', async () => {
      mockUtils.parseAssistants.mockReturnValue(['claude', 'gemini']);
      mockUtils.getCreatedDirectories.mockReturnValue([
        '.ai/task-manager',
        '.ai/task-manager/plans',
        '.claude',
        '.claude/commands',
        '.claude/commands/tasks',
        '.gemini',
        '.gemini/commands',
        '.gemini/commands/tasks',
      ]);

      const options: InitOptions = { assistants: 'claude,gemini' };
      const result = await init(options);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ assistants: ['claude', 'gemini'] });
      expect(mockUtils.ensureDir).toHaveBeenCalledWith('/workspace/.ai/task-manager/plans');
    });

    it('should create directory structure correctly', async () => {
      await init(defaultOptions);

      expect(mockUtils.ensureDir).toHaveBeenCalledWith('/workspace/.ai/task-manager/plans');
    });

    it('should copy common templates', async () => {
      await init(defaultOptions);

      expect(mockUtils.copyTemplate).toHaveBeenCalledWith(
        '/workspace/templates/ai-task-manager/TASK_MANAGER_INFO.md',
        '/workspace/.ai/task-manager/TASK_MANAGER_INFO.md'
      );
      expect(mockUtils.copyTemplate).toHaveBeenCalledWith(
        '/workspace/templates/ai-task-manager/VALIDATION_GATES.md',
        '/workspace/.ai/task-manager/VALIDATION_GATES.md'
      );
    });

    it('should copy assistant-specific templates', async () => {
      await init(defaultOptions);

      expect(mockUtils.copyTemplate).toHaveBeenCalledWith(
        '/workspace/templates/commands/tasks/create-plan.md',
        '/workspace/.claude/commands/tasks/create-plan.md'
      );
      expect(mockUtils.copyTemplate).toHaveBeenCalledWith(
        '/workspace/templates/commands/tasks/execute-blueprint.md',
        '/workspace/.claude/commands/tasks/execute-blueprint.md'
      );
      expect(mockUtils.copyTemplate).toHaveBeenCalledWith(
        '/workspace/templates/commands/tasks/generate-tasks.md',
        '/workspace/.claude/commands/tasks/generate-tasks.md'
      );
    });

    it('should handle parse assistants error', async () => {
      const error = new Error('Invalid assistant: invalid');
      mockUtils.parseAssistants.mockImplementation(() => {
        throw error;
      });

      const result = await init(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid assistant: invalid');
      expect(result.error).toBe(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Configuration Error: Invalid assistant: invalid'
      );
    });

    it('should handle validate assistants error', async () => {
      const error = new Error('At least one assistant must be specified');
      mockUtils.validateAssistants.mockImplementation(() => {
        throw error;
      });

      const result = await init(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.message).toBe('At least one assistant must be specified');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Initialization failed: At least one assistant must be specified'
      );
    });

    it('should handle FileSystemError', async () => {
      const error = new FileSystemError('Failed to create directory', {});
      mockUtils.ensureDir.mockRejectedValue(error);

      const result = await init(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create directory');
      expect(result.error).toBe(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'File System Error: Failed to create directory'
      );
    });

    it('should handle generic errors', async () => {
      const error = new Error('Some unexpected error');
      mockUtils.ensureDir.mockRejectedValue(error);

      const result = await init(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Some unexpected error');
      expect(result.error).toBe(error);
      expect(mockLogger.error).toHaveBeenCalledWith('Initialization failed: Some unexpected error');
    });

    it('should handle non-Error exceptions', async () => {
      const error = 'String error';
      mockUtils.ensureDir.mockRejectedValue(error);

      const result = await init(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Initialization failed with unknown error');
      expect(result.error?.message).toBe('String error');
      expect(mockLogger.error).toHaveBeenCalledWith('Initialization failed with unknown error');
    });

    it('should handle missing common template files', async () => {
      mockUtils.exists.mockResolvedValueOnce(false); // First template doesn't exist

      const result = await init(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(FileSystemError);
      expect(result.message).toContain('Template file not found');
    });

    it('should handle missing assistant template files', async () => {
      mockUtils.exists
        .mockResolvedValueOnce(true) // Common template 1 exists
        .mockResolvedValueOnce(true) // Common template 2 exists
        .mockResolvedValueOnce(false); // Assistant template doesn't exist

      const result = await init(defaultOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(FileSystemError);
      expect(result.message).toContain('Command template not found');
    });

    it('should log debug information', async () => {
      await init(defaultOptions);

      expect(mockLogger.debug).toHaveBeenCalledWith('Parsed assistants: claude');
      expect(mockLogger.debug).toHaveBeenCalledWith('Assistant validation passed');
    });

    it('should log detailed success information', async () => {
      mockUtils.getCreatedDirectories.mockReturnValue([
        '.ai/task-manager',
        '.ai/task-manager/plans',
        '.claude',
        '.claude/commands',
        '.claude/commands/tasks',
      ]);

      await init(defaultOptions);

      expect(mockLogger.info).toHaveBeenCalledWith('Created directory structure:');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ .ai/task-manager');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ .ai/task-manager/plans');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ .claude');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ .claude/commands');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ .claude/commands/tasks');

      expect(mockLogger.info).toHaveBeenCalledWith('Template files copied:');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ /workspace/.ai/task-manager/TASK_MANAGER_INFO.md');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ /workspace/.ai/task-manager/VALIDATION_GATES.md');
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ /workspace/.claude/commands/tasks/create-plan.md');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '  ✓ /workspace/.claude/commands/tasks/execute-blueprint.md'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('  ✓ /workspace/.claude/commands/tasks/generate-tasks.md');

      expect(mockLogger.success).toHaveBeenCalledWith(
        'Project is ready for AI-powered task management!'
      );
    });

    it('should handle multiple assistants correctly', async () => {
      mockUtils.parseAssistants.mockReturnValue(['claude', 'gemini']);
      mockUtils.getCreatedDirectories.mockReturnValue([
        '.ai/task-manager',
        '.ai/task-manager/plans',
        '.claude',
        '.claude/commands',
        '.claude/commands/tasks',
        '.gemini',
        '.gemini/commands',
        '.gemini/commands/tasks',
      ]);

      const options: InitOptions = { assistants: 'claude,gemini' };
      await init(options);

      // Verify that ensureDir is called for both assistants
      expect(mockUtils.ensureDir).toHaveBeenCalledWith('/workspace/.claude/commands/tasks');
      expect(mockUtils.ensureDir).toHaveBeenCalledWith('/workspace/.gemini/commands/tasks');

      // Verify that templates are copied for both assistants
      expect(mockUtils.copyTemplate).toHaveBeenCalledWith(
        '/workspace/templates/commands/tasks/create-plan.md',
        '/workspace/.claude/commands/tasks/create-plan.md'
      );
      expect(mockUtils.copyTemplate).toHaveBeenCalledWith(
        '/workspace/templates/commands/tasks/create-plan.toml',
        '/workspace/.gemini/commands/tasks/create-plan.toml'
      );
    });
  });

  describe('isInitialized', () => {
    it('should return true when .ai/task-manager exists', async () => {
      mockUtils.exists.mockResolvedValue(true);

      const result = await isInitialized();

      expect(result).toBe(true);
      expect(mockUtils.exists).toHaveBeenCalledWith('/workspace/.ai/task-manager');
    });

    it('should return false when .ai/task-manager does not exist', async () => {
      mockUtils.exists.mockResolvedValue(false);

      const result = await isInitialized();

      expect(result).toBe(false);
      expect(mockUtils.exists).toHaveBeenCalledWith('/workspace/.ai/task-manager');
    });
  });

  describe('getInitInfo', () => {
    it('should return correct info when nothing is initialized', async () => {
      mockUtils.exists.mockResolvedValue(false);

      const result = await getInitInfo();

      expect(result).toEqual({
        hasAiTaskManager: false,
        hasClaudeConfig: false,
        hasGeminiConfig: false,
        assistants: [],
      });
    });

    it('should return correct info when only AI Task Manager is initialized', async () => {
      mockUtils.exists
        .mockResolvedValueOnce(true) // .ai/task-manager exists
        .mockResolvedValueOnce(false) // .claude/commands/tasks doesn't exist
        .mockResolvedValueOnce(false); // .gemini/commands/tasks doesn't exist

      const result = await getInitInfo();

      expect(result).toEqual({
        hasAiTaskManager: true,
        hasClaudeConfig: false,
        hasGeminiConfig: false,
        assistants: [],
      });
    });

    it('should return correct info when Claude is configured', async () => {
      mockUtils.exists
        .mockResolvedValueOnce(true) // .ai/task-manager exists
        .mockResolvedValueOnce(true) // .claude/commands/tasks exists
        .mockResolvedValueOnce(false); // .gemini/commands/tasks doesn't exist

      const result = await getInitInfo();

      expect(result).toEqual({
        hasAiTaskManager: true,
        hasClaudeConfig: true,
        hasGeminiConfig: false,
        assistants: ['claude'],
      });
    });

    it('should return correct info when Gemini is configured', async () => {
      mockUtils.exists
        .mockResolvedValueOnce(true) // .ai/task-manager exists
        .mockResolvedValueOnce(false) // .claude/commands/tasks doesn't exist
        .mockResolvedValueOnce(true); // .gemini/commands/tasks exists

      const result = await getInitInfo();

      expect(result).toEqual({
        hasAiTaskManager: true,
        hasClaudeConfig: false,
        hasGeminiConfig: true,
        assistants: ['gemini'],
      });
    });

    it('should return correct info when both assistants are configured', async () => {
      mockUtils.exists
        .mockResolvedValueOnce(true) // .ai/task-manager exists
        .mockResolvedValueOnce(true) // .claude/commands/tasks exists
        .mockResolvedValueOnce(true); // .gemini/commands/tasks exists

      const result = await getInitInfo();

      expect(result).toEqual({
        hasAiTaskManager: true,
        hasClaudeConfig: true,
        hasGeminiConfig: true,
        assistants: ['claude', 'gemini'],
      });
    });

    it('should check correct paths', async () => {
      mockUtils.exists.mockResolvedValue(false);

      await getInitInfo();

      expect(mockUtils.exists).toHaveBeenCalledWith('/workspace/.ai/task-manager');
      expect(mockUtils.exists).toHaveBeenCalledWith('/workspace/.claude/commands/tasks');
      expect(mockUtils.exists).toHaveBeenCalledWith('/workspace/.gemini/commands/tasks');
      expect(mockUtils.exists).toHaveBeenCalledTimes(3);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete successful initialization flow', async () => {
      mockUtils.parseAssistants.mockReturnValue(['claude', 'gemini']);
      mockUtils.getCreatedDirectories.mockReturnValue([
        '.ai/task-manager',
        '.ai/task-manager/plans',
        '.claude',
        '.claude/commands',
        '.claude/commands/tasks',
        '.gemini',
        '.gemini/commands',
        '.gemini/commands/tasks',
      ]);

      const options: InitOptions = { assistants: 'claude,gemini' };
      const result = await init(options);

      expect(result.success).toBe(true);
      expect(mockUtils.parseAssistants).toHaveBeenCalledWith('claude,gemini');
      expect(mockUtils.validateAssistants).toHaveBeenCalledWith(['claude', 'gemini']);
      expect(mockUtils.ensureDir).toHaveBeenCalledWith('/workspace/.ai/task-manager/plans');
      expect(mockLogger.success).toHaveBeenCalledWith('AI Task Manager initialized successfully!');
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Project is ready for AI-powered task management!'
      );
    });

    it('should handle initialization failure and cleanup logging', async () => {
      const error = new FileSystemError('Directory creation failed', { path: '/test' });
      mockUtils.ensureDir.mockRejectedValue(error);

      const result = await init({ assistants: 'claude' });

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(mockLogger.error).toHaveBeenCalledWith('File System Error: Directory creation failed');
      expect(mockLogger.success).not.toHaveBeenCalled();
    });
  });
});
