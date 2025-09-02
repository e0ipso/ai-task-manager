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
  return path.join(__dirname, '..', '..', 'templates', templateFile);
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

/**
 * Interface for parsed markdown frontmatter
 */
export interface MarkdownFrontmatter {
  [key: string]: unknown;
}

/**
 * Parse YAML frontmatter from markdown content
 * @param content - The markdown content with frontmatter
 * @returns Object containing frontmatter and body content
 */
export function parseFrontmatter(content: string): {
  frontmatter: MarkdownFrontmatter;
  body: string;
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      body: content,
    };
  }

  const frontmatterContent = match[1] || '';
  const bodyContent = match[2] || '';

  // Simple YAML parser for our specific use case
  const frontmatter: MarkdownFrontmatter = {};
  const lines = frontmatterContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    // Remove quotes if present
    frontmatter[key] = value.replace(/^["']|["']$/g, '');
  }

  return {
    frontmatter,
    body: bodyContent,
  };
}

/**
 * Escape a string for TOML format
 * @param str - The string to escape
 * @returns The escaped string suitable for TOML
 */
export function escapeTomlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Convert markdown template content to TOML format for Gemini
 * @param mdContent - The markdown template content
 * @returns The converted TOML content
 */
export function convertMdToToml(mdContent: string): string {
  const { frontmatter, body } = parseFrontmatter(mdContent);

  // Process the body content for Gemini format
  let processedBody = body
    // Transform $ARGUMENTS → {{args}}
    .replace(/\$ARGUMENTS/g, '{{args}}')
    // Transform $1 → {{plan_id}} (and other numbered parameters if needed)
    .replace(/\$1/g, '{{plan_id}}')
    .replace(/\$2/g, '{{param2}}')
    .replace(/\$3/g, '{{param3}}');

  // Build TOML content
  let tomlContent = '[metadata]\n';

  // Add frontmatter fields to metadata section
  for (const [key, value] of Object.entries(frontmatter)) {
    if (key === 'argument-hint') {
      // Special handling for argument-hint - convert to {{}} format
      const convertedHint = String(value)
        .replace(/\[plan-ID\]/g, '{{plan_id}}')
        .replace(/\[user-prompt\]/g, '{{args}}');
      tomlContent += `argument-hint = "${escapeTomlString(convertedHint)}"\n`;
    } else {
      tomlContent += `${key} = "${escapeTomlString(String(value))}"\n`;
    }
  }

  // Add the prompt section with escaped content
  tomlContent += '\n[prompt]\n';
  tomlContent += `content = """${escapeTomlString(processedBody)}"""\n`;

  return tomlContent;
}

/**
 * Read a markdown template file and optionally convert to TOML
 * @param templatePath - Path to the markdown template
 * @param targetFormat - Target format ('md' or 'toml')
 * @returns The template content in the requested format
 */
export async function readAndProcessTemplate(
  templatePath: string,
  targetFormat: TemplateFormat
): Promise<string> {
  try {
    const mdContent = await fs.readFile(templatePath, 'utf-8');

    if (targetFormat === 'md') {
      return mdContent;
    } else if (targetFormat === 'toml') {
      return convertMdToToml(mdContent);
    } else {
      throw new Error(`Unsupported template format: ${targetFormat}`);
    }
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to read and process template: ${templatePath}`, {
      originalError: errorMessage,
      path: templatePath,
      targetFormat,
    });
  }
}

/**
 * Write processed template content to destination
 * @param content - The template content to write
 * @param destPath - Destination file path
 */
export async function writeProcessedTemplate(content: string, destPath: string): Promise<void> {
  try {
    // Ensure destination directory exists
    await fs.ensureDir(path.dirname(destPath));

    // Write the content
    await fs.writeFile(destPath, content, 'utf-8');
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to write processed template: ${destPath}`, {
      originalError: errorMessage,
      path: destPath,
    });
  }
}

/**
 * Get the names of all markdown template files in a given subdirectory of /workspace/templates.
 * @param templateSubdir - The subdirectory within /workspace/templates (e.g., 'commands/tasks')
 * @returns An array of template names (filenames without .md extension)
 * @throws FileSystemError if the directory cannot be read
 */
export async function getMarkdownTemplateNames(templateSubdir: string): Promise<string[]> {
  const fullPath = path.join(__dirname, '..', '..', 'templates', templateSubdir);
  try {
    const files = await fs.readdir(fullPath);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => path.basename(file, '.md'));
  } catch (_error) {
    const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
    throw new FileSystemError(`Failed to read template directory: ${fullPath}`, {
      originalError: errorMessage,
      path: fullPath,
    });
  }
}
