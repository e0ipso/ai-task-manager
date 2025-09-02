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
  copyTemplate,
  writeJsonFile,
  readJsonFile,
  parseAssistants,
  validateAssistants,
  getTemplatePath,
  getCreatedDirectories,
  ensureTrailingSlash,
  sanitizeFilename,
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

// Mock path module - keep real implementations for most functions but mock resolve and join
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    resolve: jest.fn().mockImplementation((...args: string[]) => 
      actualPath.resolve(...args)
    ),
    join: jest.fn().mockImplementation((...args: string[]) =>
      actualPath.join(...args)
    )
  };
});
const mockPath = path as jest.Mocked<typeof path> & {
  resolve: jest.MockedFunction<typeof path.resolve>;
  join: jest.MockedFunction<typeof path.join>;
};

describe('utils.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset path.resolve to default behavior
    mockPath.resolve.mockImplementation((...args: string[]) => 
      jest.requireActual('path').resolve(...args)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  // ensureDir tests kept - includes custom error handling logic
  describe('ensureDir', () => {
    it('should throw FileSystemError when directory creation fails', async () => {
      const error = new Error('Permission denied');
      mockFs.ensureDir.mockRejectedValue(error);

      await expect(ensureDir('/test/dir')).rejects.toThrow(FileSystemError);
      await expect(ensureDir('/test/dir')).rejects.toThrow('Failed to create directory: /test/dir');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'string error';
      mockFs.ensureDir.mockRejectedValue(unknownError);

      await expect(ensureDir('/test/dir')).rejects.toThrow(FileSystemError);
      await expect(ensureDir('/test/dir')).rejects.toThrow('Failed to create directory: /test/dir');
    });
  });

  // directoryExists tests removed - simple fs.stat wrapper

  // fileExists tests removed - simple fs.stat wrapper

  // exists tests removed - simple fs.access wrapper

  // copyTemplate tests kept - includes custom error handling logic
  describe('copyTemplate', () => {
    it('should throw FileSystemError when copy fails', async () => {
      const error = new Error('Permission denied');
      mockFs.copy.mockRejectedValue(error);

      await expect(copyTemplate('/src/template', '/dest/file')).rejects.toThrow(FileSystemError);
      await expect(copyTemplate('/src/template', '/dest/file')).rejects.toThrow('Failed to copy from /src/template to /dest/file');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'string error';
      mockFs.copy.mockRejectedValue(unknownError);

      await expect(copyTemplate('/src/template', '/dest/file')).rejects.toThrow(FileSystemError);
      await expect(copyTemplate('/src/template', '/dest/file')).rejects.toThrow('Failed to copy from /src/template to /dest/file');
    });
  });

  // writeJsonFile tests kept - includes custom error handling logic
  describe('writeJsonFile', () => {
    it('should throw FileSystemError when write fails', async () => {
      const error = new Error('Permission denied');
      mockFs.writeJson.mockRejectedValue(error);

      await expect(writeJsonFile('/test/file.json', {})).rejects.toThrow(FileSystemError);
      await expect(writeJsonFile('/test/file.json', {})).rejects.toThrow('Failed to write JSON file: /test/file.json');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'string error';
      mockFs.writeJson.mockRejectedValue(unknownError);

      await expect(writeJsonFile('/test/file.json', {})).rejects.toThrow(FileSystemError);
      await expect(writeJsonFile('/test/file.json', {})).rejects.toThrow('Failed to write JSON file: /test/file.json');
    });
  });

  // readJsonFile tests kept - includes custom error handling logic
  describe('readJsonFile', () => {
    it('should throw FileSystemError when read fails', async () => {
      const error = new Error('File not found');
      mockFs.readJson.mockRejectedValue(error);

      await expect(readJsonFile('/test/file.json')).rejects.toThrow(FileSystemError);
      await expect(readJsonFile('/test/file.json')).rejects.toThrow('Failed to read JSON file: /test/file.json');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'string error';
      mockFs.readJson.mockRejectedValue(unknownError);

      await expect(readJsonFile('/test/file.json')).rejects.toThrow(FileSystemError);
      await expect(readJsonFile('/test/file.json')).rejects.toThrow('Failed to read JSON file: /test/file.json');
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

  // Path helper functions tests removed - testing Node.js built-in path methods
  // Keep custom business logic: ensureTrailingSlash
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

  describe('getTemplatePath', () => {
    it('should return template path', () => {
      mockPath.join.mockReturnValue('/workspace/templates/test.md');
      const result = getTemplatePath('test.md');
      expect(mockPath.join).toHaveBeenCalledWith(expect.any(String), '..', 'templates', 'test.md');
      expect(result).toBe('/workspace/templates/test.md');
    });

    it('should handle nested template paths', () => {
      mockPath.join.mockReturnValue('/workspace/templates/commands/tasks/create-plan.md');
      const result = getTemplatePath('commands/tasks/create-plan.md');
      expect(mockPath.join).toHaveBeenCalledWith(expect.any(String), '..', 'templates', 'commands/tasks/create-plan.md');
      expect(result).toBe('/workspace/templates/commands/tasks/create-plan.md');
    });
  });

  describe('getCreatedDirectories', () => {
    it('should return directories for single assistant', () => {
      const result = getCreatedDirectories(['claude']);
      expect(result.length).toBe(5);
      expect(result).toEqual(expect.arrayContaining([
        expect.stringMatching(/\.ai\/task-manager$/),
        expect.stringMatching(/\.ai\/task-manager\/plans$/),
        expect.stringMatching(/\.claude$/),
        expect.stringMatching(/\.claude\/commands$/),
        expect.stringMatching(/\.claude\/commands\/tasks$/),
      ]));
    });

    it('should return directories for multiple assistants', () => {
      const result = getCreatedDirectories(['claude', 'gemini']);
      expect(result.length).toBe(8);
      expect(result).toEqual(expect.arrayContaining([
        expect.stringMatching(/\.ai\/task-manager$/),
        expect.stringMatching(/\.ai\/task-manager\/plans$/),
        expect.stringMatching(/\.claude\/commands\/tasks$/),
        expect.stringMatching(/\.gemini\/commands\/tasks$/),
      ]));
    });

    it('should handle empty assistant array', () => {
      const result = getCreatedDirectories([]);
      expect(result.length).toBe(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.stringMatching(/\.ai\/task-manager$/),
        expect.stringMatching(/\.ai\/task-manager\/plans$/),
      ]));
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

  // getHomeDirectory tests removed - testing Node.js built-in os.homedir()

  // remove tests kept - includes custom error handling logic
  describe('remove', () => {
    it('should throw FileSystemError when removal fails', async () => {
      const error = new Error('Permission denied');
      mockFs.remove.mockRejectedValue(error);

      await expect(remove('/test/path')).rejects.toThrow(FileSystemError);
      await expect(remove('/test/path')).rejects.toThrow('Failed to remove: /test/path');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'string error';
      mockFs.remove.mockRejectedValue(unknownError);

      await expect(remove('/test/path')).rejects.toThrow(FileSystemError);
      await expect(remove('/test/path')).rejects.toThrow('Failed to remove: /test/path');
    });
  });

  // move tests kept - includes custom error handling logic
  describe('move', () => {
    it('should throw FileSystemError when move fails', async () => {
      const error = new Error('Permission denied');
      mockFs.move.mockRejectedValue(error);

      await expect(move('/src/path', '/dest/path')).rejects.toThrow(FileSystemError);
      await expect(move('/src/path', '/dest/path')).rejects.toThrow('Failed to move from /src/path to /dest/path');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'string error';
      mockFs.move.mockRejectedValue(unknownError);

      await expect(move('/src/path', '/dest/path')).rejects.toThrow(FileSystemError);
      await expect(move('/src/path', '/dest/path')).rejects.toThrow('Failed to move from /src/path to /dest/path');
    });
  });
});
