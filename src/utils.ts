/**
 * Helper Functions for File Operations
 *
 * This file contains utility functions for file system operations,
 * path manipulation, and other common tasks used by the CLI
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Assistant, TemplateFormat } from './types';

/**
 * Parse comma-separated assistant values into an array
 * @param value - Comma-separated string of assistant names
 * @returns Array of assistant names
 * @throws Error if invalid assistant names are provided
 */
export function parseAssistants(value: string): Assistant[] {
  const validAssistants: Assistant[] = ['claude', 'codex', 'gemini', 'github', 'opencode'];

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
  const validAssistants: Assistant[] = ['claude', 'codex', 'gemini', 'github', 'opencode'];

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
 * Get the template format for a specific assistant
 * @param assistant - The assistant type
 * @returns The template format to use ('md' for Claude/Open Code, 'toml' for Gemini)
 */
export function getTemplateFormat(assistant: Assistant): TemplateFormat {
  switch (assistant) {
    case 'claude':
      return 'md';
    case 'codex':
      return 'md';
    case 'gemini':
      return 'toml';
    case 'github':
      return 'md'; // GitHub prompt files use Markdown
    case 'opencode':
      return 'md';
    default:
      // This should never happen due to type safety, but adding for completeness
      throw new Error(`Unknown assistant type: ${assistant}`);
  }
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
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      body: content,
    };
  }

  const frontmatterContent = match[1] || '';
  const bodyContent = match[2] || ''; // match[2] is now undefined when no body exists

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
  const processedBody = body
    // Transform $ARGUMENTS → {{args}} (not followed by alphanumeric that would make it an identifier)
    .replace(/\$ARGUMENTS(?![0-9])/g, '{{args}}')
    // Transform $1 → {{plan_id}} (exact match, not part of longer number)
    .replace(/\$1(?![0-9])/g, '{{plan_id}}')
    .replace(/\$2(?![0-9])/g, '{{param2}}')
    .replace(/\$3(?![0-9])/g, '{{param3}}');

  // Build TOML content
  let tomlContent = '[metadata]\n';

  // Add frontmatter fields to metadata section
  for (const [key, value] of Object.entries(frontmatter)) {
    if (key === 'argument-hint') {
      // Special handling for argument-hint - convert to {{}} format
      const convertedHint = String(value)
        .replace(/\[planId\]/g, '{{plan_id}}')
        .replace(/\[taskId\]/g, '{{task_id}}')
        .replace(/\[userPrompt\]/g, '{{args}}')
        .replace(/\[testCommand\]/g, '{{test_command}}');
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
 * Convert markdown template content to GitHub Copilot prompt file format
 * @param mdContent - The markdown template content
 * @returns The converted prompt file content
 */
export function convertMdToGitHubPrompt(mdContent: string): string {
  const { frontmatter, body } = parseFrontmatter(mdContent);

  // Build GitHub prompt frontmatter
  let promptContent = '---\n';
  promptContent += `description: ${frontmatter.description || 'Task management command'}\n`;
  promptContent += '---\n\n';

  // Add $ARGUMENTS placeholder
  promptContent += '$ARGUMENTS\n\n';

  // Add template body (no variable conversion needed - GitHub supports $ARGUMENTS natively)
  promptContent += body;

  return promptContent;
}

/**
 * Read a markdown template file and optionally convert to TOML or GitHub prompt format
 * @param templatePath - Path to the markdown template
 * @param targetFormat - Target format ('md' or 'toml')
 * @param assistant - Optional assistant type for format-specific processing
 * @returns The template content in the requested format
 */
export async function readAndProcessTemplate(
  templatePath: string,
  targetFormat: TemplateFormat,
  assistant?: Assistant
): Promise<string> {
  const mdContent = await fs.readFile(templatePath, 'utf-8');

  if (targetFormat === 'md') {
    // Check if GitHub assistant needs special processing
    if (assistant === 'github') {
      return convertMdToGitHubPrompt(mdContent);
    }
    return mdContent; // Claude and OpenCode use raw Markdown
  } else if (targetFormat === 'toml') {
    return convertMdToToml(mdContent); // Gemini conversion
  } else {
    throw new Error(`Unsupported template format: ${targetFormat}`);
  }
}

/**
 * Write processed template content to destination
 * @param content - The template content to write
 * @param destPath - Destination file path
 */
export async function writeProcessedTemplate(content: string, destPath: string): Promise<void> {
  // Ensure destination directory exists
  await fs.ensureDir(path.dirname(destPath));

  // Write the content
  await fs.writeFile(destPath, content, 'utf-8');
}
