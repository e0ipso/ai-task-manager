/**
 * Helper Functions for File Operations
 *
 * This file contains utility functions for file system operations,
 * path manipulation, and other common tasks used by the CLI
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { FileSystemError, Assistant, TemplateFormat } from './types';

/**
 * Create a directory recursively if it doesn't exist
 * @param dirPath - The directory path to create
 * @throws FileSystemError if directory creation fails
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath);
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to create directory: ${dirPath}`, {
      originalError: errorMessage,
      path: dirPath,
    });
  }
}

/**
 * Check if a directory exists
 * @param dirPath - The directory path to check
 * @returns Promise<boolean> - True if directory exists, false otherwise
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch (_error) {
    // If file doesn't exist or any other error, return false
    return false;
  }
}

/**
 * Check if a file exists
 * @param filePath - The file path to check
 * @returns Promise<boolean> - True if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch (_error) {
    // If file doesn't exist or any other error, return false
    return false;
  }
}

/**
 * Check if a file or directory exists (generic)
 * @param filepath - The path to check
 * @returns Promise<boolean> - True if path exists, false otherwise
 */
export async function exists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy a file or directory from source to destination
 * @param src - Source path (file or directory)
 * @param dest - Destination path
 * @param options - Copy options
 * @throws FileSystemError if copy operation fails
 */
export async function copyTemplate(
  src: string,
  dest: string,
  options: { overwrite?: boolean } = { overwrite: true }
): Promise<void> {
  try {
    await fs.copy(src, dest, options);
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to copy from ${src} to ${dest}`, {
      originalError: errorMessage,
      source: src,
      destination: dest,
    });
  }
}

/**
 * Write JSON data to a file with proper formatting
 * @param filePath - The file path to write to
 * @param data - The data to write as JSON
 * @throws FileSystemError if write operation fails
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  try {
    await fs.writeJson(filePath, data, { spaces: 2 });
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to write JSON file: ${filePath}`, {
      originalError: errorMessage,
      path: filePath,
    });
  }
}

/**
 * Read and parse a JSON file
 * @param filePath - The file path to read from
 * @returns The parsed JSON data
 * @throws FileSystemError if read operation fails
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  try {
    return await fs.readJson(filePath);
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to read JSON file: ${filePath}`, {
      originalError: errorMessage,
      path: filePath,
    });
  }
}

/**
 * Parse comma-separated assistant values into an array
 * @param value - Comma-separated string of assistant names
 * @returns Array of assistant names
 * @throws Error if invalid assistant names are provided
 */
export function parseAssistants(value: string): Assistant[] {
  const validAssistants: Assistant[] = ['claude', 'gemini'];

  if (!value.trim()) {
    throw new Error('Assistants parameter cannot be empty');
  }

  const assistants = value
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(a => a.length > 0);

  // Validate that all assistants are valid
  const invalidAssistants = assistants.filter(
    (assistant): assistant is string => !validAssistants.includes(assistant as Assistant)
  );

  if (invalidAssistants.length > 0) {
    throw new Error(
      `Invalid assistant(s): ${invalidAssistants.join(', ')}. Valid options are: ${validAssistants.join(', ')}`
    );
  }

  // Remove duplicates and return
  return Array.from(new Set(assistants)) as Assistant[];
}

/**
 * Validate that all assistants are supported
 * @param assistants - Array of assistants to validate
 * @throws Error if any assistant is invalid or array is empty
 */
export function validateAssistants(assistants: Assistant[]): void {
  const validAssistants: Assistant[] = ['claude', 'gemini'];

  if (assistants.length === 0) {
    throw new Error('At least one assistant must be specified');
  }

  for (const assistant of assistants) {
    if (!validAssistants.includes(assistant)) {
      throw new Error(
        `Invalid assistant: ${assistant}. Supported assistants: ${validAssistants.join(', ')}`
      );
    }
  }
}

/**
 * Get the absolute path for a given path, resolving it relative to the current working directory
 * @param inputPath - The input path (can be relative or absolute)
 * @returns The absolute path
 */
export function getAbsolutePath(inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
}

/**
 * Get the relative path from one path to another
 * @param from - The source path
 * @param to - The target path
 * @returns The relative path
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * Join multiple path segments into a single path
 * @param segments - Path segments to join
 * @returns The joined path
 */
export function joinPath(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Get the directory name from a file path
 * @param filePath - The file path
 * @returns The directory name
 */
export function getDirName(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Get the base name (filename) from a file path
 * @param filePath - The file path
 * @param ext - Optional extension to remove
 * @returns The base name
 */
export function getBaseName(filePath: string, ext?: string): string {
  return path.basename(filePath, ext);
}

/**
 * Get the file extension from a file path
 * @param filePath - The file path
 * @returns The file extension (including the dot)
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath);
}

/**
 * Get the template format for a specific assistant
 * @param assistant - The assistant type
 * @returns The template format to use ('md' for Claude, 'toml' for Gemini)
 */
export function getTemplateFormat(assistant: Assistant): TemplateFormat {
  switch (assistant) {
    case 'claude':
      return 'md';
    case 'gemini':
      return 'toml';
    default:
      // This should never happen due to type safety, but adding for completeness
      throw new Error(`Unknown assistant type: ${assistant}`);
  }
}

/**
 * Get the absolute path to a template file
 * @param templateFile - The template filename
 * @returns The absolute path to the template
 */
export function getTemplatePath(templateFile: string): string {
  return path.resolve(__dirname, '../templates', templateFile);
}

/**
 * Get list of directories that will be created for given assistants
 * @param assistants - Array of assistants
 * @param baseDir - Base directory to resolve paths against (defaults to current directory)
 * @returns Array of directory paths to create
 */
export function getCreatedDirectories(assistants: Assistant[], baseDir?: string): string[] {
  const base = baseDir || '.';
  const dirs: string[] = [
    resolvePath(base, '.ai/task-manager'),
    resolvePath(base, '.ai/task-manager/plans'),
  ];

  for (const assistant of assistants) {
    dirs.push(resolvePath(base, `.${assistant}`));
    dirs.push(resolvePath(base, `.${assistant}/commands`));
    dirs.push(resolvePath(base, `.${assistant}/commands/tasks`));
  }

  return dirs;
}

/**
 * Ensure a directory path ends with a path separator
 * @param dirPath - The directory path
 * @returns The directory path with trailing separator
 */
export function ensureTrailingSlash(dirPath: string): string {
  return dirPath.endsWith(path.sep) ? dirPath : dirPath + path.sep;
}

/**
 * Create a safe filename by removing or replacing invalid characters
 * @param filename - The input filename
 * @returns A safe filename for the current platform
 */
export function sanitizeFilename(filename: string): string {
  // Replace invalid characters with underscores
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Get the home directory path
 * @returns The user's home directory path
 */
export function getHomeDirectory(): string {
  return require('os').homedir();
}

/**
 * Remove a file or directory recursively
 * @param targetPath - The path to remove
 * @throws FileSystemError if removal fails
 */
export async function remove(targetPath: string): Promise<void> {
  try {
    await fs.remove(targetPath);
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to remove: ${targetPath}`, {
      originalError: errorMessage,
      path: targetPath,
    });
  }
}

/**
 * Move a file or directory from source to destination
 * @param src - Source path
 * @param dest - Destination path
 * @throws FileSystemError if move operation fails
 */
export async function move(src: string, dest: string): Promise<void> {
  try {
    await fs.move(src, dest);
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to move from ${src} to ${dest}`, {
      originalError: errorMessage,
      source: src,
      destination: dest,
    });
  }
}

/**
 * Resolve path segments relative to a base directory with cross-platform compatibility
 * @param baseDir - The base directory (defaults to '.' if not provided, null, or undefined)
 * @param segments - Additional path segments to resolve
 * @returns The resolved absolute path
 */
export function resolvePath(baseDir: string | undefined, ...segments: string[]): string {
  // Handle edge cases: null, undefined, or empty strings
  const base = baseDir || '.';

  // Filter out any null, undefined, or empty string segments
  const validSegments = segments.filter(
    segment => segment !== null && segment !== undefined && segment !== ''
  );

  return path.resolve(base, ...validSegments);
}
