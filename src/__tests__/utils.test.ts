/**
 * Unit Tests for utils.ts
 *
 * Comprehensive test suite for utility functions with mocked dependencies
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  ensureDir,
  directoryExists,
  fileExists,
  exists,
  copyTemplate,
  writeJsonFile,
  readJsonFile,
  parseAssistants,
  validateAssistants,
  getAbsolutePath,
  getRelativePath,
  joinPath,
  getDirName,
  getBaseName,
  getExtension,
  getTemplatePath,
  getCreatedDirectories,
  ensureTrailingSlash,
  sanitizeFilename,
  getHomeDirectory,
  remove,
  move,
  getTemplateFormat,
} from '../utils';
import { FileSystemError, Assistant } from '../types';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<any>;

// Mock os
jest.mock('os');
const mockOs = os as jest.Mocked<typeof os>;

// Mock path module - keep real implementations for most functions but mock resolve
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    resolve: jest.fn().mockImplementation((...args: string[]) => 
      actualPath.resolve(...args)
    )
  };
});
const mockPath = path as jest.Mocked<typeof path> & { resolve: jest.MockedFunction<typeof path.resolve> };

describe('utils.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset path.resolve to default behavior
    mockPath.resolve.mockImplementation((...args: string[]) => 
      jest.requireActual('path').resolve(...args)
    );
  });

  afterEach(() => {
    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    // Final cleanup
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  describe('ensureDir', () => {
    it('should create directory successfully', async () => {
      mockFs.ensureDir.mockResolvedValue(undefined);

      await ensureDir('/test/dir');

      expect(mockFs.ensureDir).toHaveBeenCalledWith('/test/dir');
    });

    it('should throw FileSystemError when directory creation fails', async () => {
      const error = new Error('Permission denied');
      mockFs.ensureDir.mockRejectedValue(error);

      await expect(ensureDir('/test/dir')).rejects.toThrow(FileSystemError);
      await expect(ensureDir('/test/dir')).rejects.toThrow('Failed to create directory: /test/dir');
    });

    it('should handle unknown error types', async () => {
      mockFs.ensureDir.mockRejectedValue('unknown error');

      await expect(ensureDir('/test/dir')).rejects.toThrow(FileSystemError);
    });
  });

  describe('directoryExists', () => {
    it('should return true for existing directory', async () => {
      const mockStats = { isDirectory: jest.fn().mockReturnValue(true) };
      mockFs.stat.mockResolvedValue(mockStats as any);

      const result = await directoryExists('/test/dir');

      expect(result).toBe(true);
      expect(mockFs.stat).toHaveBeenCalledWith('/test/dir');
      expect(mockStats.isDirectory).toHaveBeenCalled();
    });

    it('should return false for non-directory', async () => {
      const mockStats = { isDirectory: jest.fn().mockReturnValue(false) };
      mockFs.stat.mockResolvedValue(mockStats as any);

      const result = await directoryExists('/test/file.txt');

      expect(result).toBe(false);
    });

    it('should return false when stat fails', async () => {
      mockFs.stat.mockRejectedValue(new Error('ENOENT'));

      const result = await directoryExists('/nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const mockStats = { isFile: jest.fn().mockReturnValue(true) };
      mockFs.stat.mockResolvedValue(mockStats as any);

      const result = await fileExists('/test/file.txt');

      expect(result).toBe(true);
      expect(mockFs.stat).toHaveBeenCalledWith('/test/file.txt');
      expect(mockStats.isFile).toHaveBeenCalled();
    });

    it('should return false for non-file', async () => {
      const mockStats = { isFile: jest.fn().mockReturnValue(false) };
      mockFs.stat.mockResolvedValue(mockStats as any);

      const result = await fileExists('/test/dir');

      expect(result).toBe(false);
    });

    it('should return false when stat fails', async () => {
      mockFs.stat.mockRejectedValue(new Error('ENOENT'));

      const result = await fileExists('/nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when path is accessible', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await exists('/test/path');

      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith('/test/path');
    });

    it('should return false when path is not accessible', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await exists('/nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('copyTemplate', () => {
    it('should copy file successfully with default options', async () => {
      mockFs.copy.mockResolvedValue(undefined);

      await copyTemplate('/src/template', '/dest/file');

      expect(mockFs.copy).toHaveBeenCalledWith('/src/template', '/dest/file', { overwrite: true });
    });

    it('should copy file with custom options', async () => {
      mockFs.copy.mockResolvedValue(undefined);

      await copyTemplate('/src/template', '/dest/file', { overwrite: false });

      expect(mockFs.copy).toHaveBeenCalledWith('/src/template', '/dest/file', { overwrite: false });
    });

    it('should throw FileSystemError when copy fails', async () => {
      const error = new Error('Permission denied');
      mockFs.copy.mockRejectedValue(error);

      await expect(copyTemplate('/src/template', '/dest/file')).rejects.toThrow(FileSystemError);
      await expect(copyTemplate('/src/template', '/dest/file')).rejects.toThrow(
        'Failed to copy from /src/template to /dest/file'
      );
    });

    it('should handle unknown error types', async () => {
      mockFs.copy.mockRejectedValue('unknown error');

      await expect(copyTemplate('/src/template', '/dest/file')).rejects.toThrow(FileSystemError);
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON file successfully', async () => {
      mockFs.writeJson.mockResolvedValue(undefined);
      const data = { test: 'data' };

      await writeJsonFile('/test/file.json', data);

      expect(mockFs.writeJson).toHaveBeenCalledWith('/test/file.json', data, { spaces: 2 });
    });

    it('should throw FileSystemError when write fails', async () => {
      const error = new Error('Permission denied');
      mockFs.writeJson.mockRejectedValue(error);

      await expect(writeJsonFile('/test/file.json', {})).rejects.toThrow(FileSystemError);
      await expect(writeJsonFile('/test/file.json', {})).rejects.toThrow(
        'Failed to write JSON file: /test/file.json'
      );
    });

    it('should handle unknown error types', async () => {
      mockFs.writeJson.mockRejectedValue('unknown error');

      await expect(writeJsonFile('/test/file.json', {})).rejects.toThrow(FileSystemError);
    });
  });

  describe('readJsonFile', () => {
    it('should read JSON file successfully', async () => {
      const data = { test: 'data' };
      mockFs.readJson.mockResolvedValue(data);

      const result = await readJsonFile('/test/file.json');

      expect(result).toEqual(data);
      expect(mockFs.readJson).toHaveBeenCalledWith('/test/file.json');
    });

    it('should read JSON file with type parameter', async () => {
      const data = { name: 'test', value: 123 };
      mockFs.readJson.mockResolvedValue(data);

      const result = await readJsonFile<{ name: string; value: number }>('/test/file.json');

      expect(result).toEqual(data);
    });

    it('should throw FileSystemError when read fails', async () => {
      const error = new Error('File not found');
      mockFs.readJson.mockRejectedValue(error);

      await expect(readJsonFile('/test/file.json')).rejects.toThrow(FileSystemError);
      await expect(readJsonFile('/test/file.json')).rejects.toThrow(
        'Failed to read JSON file: /test/file.json'
      );
    });

    it('should handle unknown error types', async () => {
      mockFs.readJson.mockRejectedValue('unknown error');

      await expect(readJsonFile('/test/file.json')).rejects.toThrow(FileSystemError);
    });
  });

  describe('parseAssistants', () => {
    it('should parse single assistant', () => {
      const result = parseAssistants('claude');
      expect(result).toEqual(['claude']);
    });

    it('should parse multiple assistants', () => {
      const result = parseAssistants('claude,gemini');
      expect(result).toEqual(['claude', 'gemini']);
    });

    it('should handle spaces and case variations', () => {
      const result = parseAssistants(' Claude , GEMINI ');
      expect(result).toEqual(['claude', 'gemini']);
    });

    it('should remove duplicates', () => {
      const result = parseAssistants('claude,claude,gemini');
      expect(result).toEqual(['claude', 'gemini']);
    });

    it('should handle empty strings in list', () => {
      const result = parseAssistants('claude,,gemini,');
      expect(result).toEqual(['claude', 'gemini']);
    });

    it('should throw error for empty input', () => {
      expect(() => parseAssistants('')).toThrow('Assistants parameter cannot be empty');
      expect(() => parseAssistants('   ')).toThrow('Assistants parameter cannot be empty');
    });

    it('should throw error for invalid assistants', () => {
      expect(() => parseAssistants('invalid')).toThrow(
        'Invalid assistant(s): invalid. Valid options are: claude, gemini'
      );
      expect(() => parseAssistants('claude,invalid,gemini')).toThrow(
        'Invalid assistant(s): invalid. Valid options are: claude, gemini'
      );
    });

    it('should throw error for multiple invalid assistants', () => {
      expect(() => parseAssistants('invalid1,invalid2')).toThrow(
        'Invalid assistant(s): invalid1, invalid2. Valid options are: claude, gemini'
      );
    });
  });

  describe('validateAssistants', () => {
    it('should validate valid assistants', () => {
      expect(() => validateAssistants(['claude'])).not.toThrow();
      expect(() => validateAssistants(['gemini'])).not.toThrow();
      expect(() => validateAssistants(['claude', 'gemini'])).not.toThrow();
    });

    it('should throw error for empty array', () => {
      expect(() => validateAssistants([])).toThrow('At least one assistant must be specified');
    });

    it('should throw error for invalid assistant', () => {
      expect(() => validateAssistants(['invalid' as Assistant])).toThrow(
        'Invalid assistant: invalid. Supported assistants: claude, gemini'
      );
    });

    it('should throw error for mixed valid and invalid assistants', () => {
      expect(() => validateAssistants(['claude', 'invalid' as Assistant])).toThrow(
        'Invalid assistant: invalid. Supported assistants: claude, gemini'
      );
    });
  });

  describe('path helper functions', () => {
    describe('getAbsolutePath', () => {
      it('should return absolute path as-is', () => {
        const absolutePath = '/absolute/path';
        const result = getAbsolutePath(absolutePath);
        expect(result).toBe(absolutePath);
      });

      it('should resolve relative path to absolute', () => {
        // Test with actual path behavior - no need for complex mocking
        const relativePath = 'relative/path';
        const result = getAbsolutePath(relativePath);
        
        // Should be an absolute path (starts with /)
        expect(result).toMatch(/^\/.*relative\/path$/);
        expect(result).toContain('relative/path');
        expect(result).not.toBe(relativePath); // Should be different from input
      });
    });

    describe('getRelativePath', () => {
      it('should return relative path between two paths', () => {
        const from = '/from/path';
        const to = '/from/path/to/file';
        const result = getRelativePath(from, to);
        expect(result).toBe('to/file'); // Relative path from source to destination
      });
    });

    describe('joinPath', () => {
      it('should join multiple path segments', () => {
        const result = joinPath('path', 'to', 'file.txt');
        expect(result).toBe('path/to/file.txt');
      });

      it('should handle single segment', () => {
        const result = joinPath('file.txt');
        expect(result).toBe('file.txt');
      });
    });

    describe('getDirName', () => {
      it('should return directory name', () => {
        const result = getDirName('/path/to/file.txt');
        expect(result).toBe('/path/to');
      });
    });

    describe('getBaseName', () => {
      it('should return base name without extension', () => {
        const result = getBaseName('/path/to/file.txt');
        expect(result).toBe('file.txt');
      });

      it('should return base name removing specified extension', () => {
        const result = getBaseName('/path/to/file.txt', '.txt');
        expect(result).toBe('file');
      });
    });

    describe('getExtension', () => {
      it('should return file extension', () => {
        const result = getExtension('/path/to/file.txt');
        expect(result).toBe('.txt');
      });

      it('should return empty string for files without extension', () => {
        const result = getExtension('/path/to/file');
        expect(result).toBe('');
      });
    });

    describe('ensureTrailingSlash', () => {
      it('should add trailing slash if missing', () => {
        const result = ensureTrailingSlash('/path/to/dir');
        expect(result).toBe('/path/to/dir/');
      });

      it('should not modify path with existing trailing slash', () => {
        const result = ensureTrailingSlash('/path/to/dir/');
        expect(result).toBe('/path/to/dir/');
      });
    });
  });

  describe('getTemplatePath', () => {
    it('should return template path', () => {
      mockPath.resolve.mockReturnValue('/workspace/templates/test.md');
      const result = getTemplatePath('test.md');
      expect(mockPath.resolve).toHaveBeenCalledWith('/workspace/templates', 'test.md');
      expect(result).toBe('/workspace/templates/test.md');
    });

    it('should handle nested template paths', () => {
      mockPath.resolve.mockReturnValue('/workspace/templates/commands/tasks/create-plan.md');
      const result = getTemplatePath('commands/tasks/create-plan.md');
      expect(mockPath.resolve).toHaveBeenCalledWith('/workspace/templates', 'commands/tasks/create-plan.md');
      expect(result).toBe('/workspace/templates/commands/tasks/create-plan.md');
    });
  });

  describe('getCreatedDirectories', () => {
    it('should return directories for single assistant', () => {
      const result = getCreatedDirectories(['claude']);
      expect(result).toEqual([
        '/workspace/.ai/task-manager',
        '/workspace/.ai/task-manager/plans',
        '/workspace/.claude',
        '/workspace/.claude/commands',
        '/workspace/.claude/commands/tasks',
      ]);
    });

    it('should return directories for multiple assistants', () => {
      const result = getCreatedDirectories(['claude', 'gemini']);
      expect(result).toEqual([
        '/workspace/.ai/task-manager',
        '/workspace/.ai/task-manager/plans',
        '/workspace/.claude',
        '/workspace/.claude/commands',
        '/workspace/.claude/commands/tasks',
        '/workspace/.gemini',
        '/workspace/.gemini/commands',
        '/workspace/.gemini/commands/tasks',
      ]);
    });

    it('should handle empty assistant array', () => {
      const result = getCreatedDirectories([]);
      expect(result).toEqual(['/workspace/.ai/task-manager', '/workspace/.ai/task-manager/plans']);
    });
  });

  describe('getTemplateFormat', () => {
    it('should return md format for Claude', () => {
      const result = getTemplateFormat('claude');
      expect(result).toBe('md');
    });

    it('should return toml format for Gemini', () => {
      const result = getTemplateFormat('gemini');
      expect(result).toBe('toml');
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace invalid characters with underscores', () => {
      const result = sanitizeFilename('invalid<>:"/\\|?*filename');
      expect(result).toBe('invalid_filename');
    });

    it('should replace spaces with underscores', () => {
      const result = sanitizeFilename('file with spaces.txt');
      expect(result).toBe('file_with_spaces.txt');
    });

    it('should collapse multiple underscores', () => {
      const result = sanitizeFilename('file___with___multiple___spaces');
      expect(result).toBe('file_with_multiple_spaces');
    });

    it('should remove leading and trailing underscores', () => {
      const result = sanitizeFilename('_filename_');
      expect(result).toBe('filename');
    });

    it('should handle already safe filenames', () => {
      const result = sanitizeFilename('safe_filename.txt');
      expect(result).toBe('safe_filename.txt');
    });
  });

  describe('getHomeDirectory', () => {
    it('should return home directory', () => {
      mockOs.homedir.mockReturnValue('/home/user');
      const result = getHomeDirectory();
      expect(result).toBe('/home/user');
      expect(mockOs.homedir).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove file or directory successfully', async () => {
      mockFs.remove.mockResolvedValue(undefined);

      await remove('/test/path');

      expect(mockFs.remove).toHaveBeenCalledWith('/test/path');
    });

    it('should throw FileSystemError when removal fails', async () => {
      const error = new Error('Permission denied');
      mockFs.remove.mockRejectedValue(error);

      await expect(remove('/test/path')).rejects.toThrow(FileSystemError);
      await expect(remove('/test/path')).rejects.toThrow('Failed to remove: /test/path');
    });

    it('should handle unknown error types', async () => {
      mockFs.remove.mockRejectedValue('unknown error');

      await expect(remove('/test/path')).rejects.toThrow(FileSystemError);
    });
  });

  describe('move', () => {
    it('should move file or directory successfully', async () => {
      mockFs.move.mockResolvedValue(undefined);

      await move('/src/path', '/dest/path');

      expect(mockFs.move).toHaveBeenCalledWith('/src/path', '/dest/path');
    });

    it('should throw FileSystemError when move fails', async () => {
      const error = new Error('Permission denied');
      mockFs.move.mockRejectedValue(error);

      await expect(move('/src/path', '/dest/path')).rejects.toThrow(FileSystemError);
      await expect(move('/src/path', '/dest/path')).rejects.toThrow(
        'Failed to move from /src/path to /dest/path'
      );
    });

    it('should handle unknown error types', async () => {
      mockFs.move.mockRejectedValue('unknown error');

      await expect(move('/src/path', '/dest/path')).rejects.toThrow(FileSystemError);
    });
  });
});
