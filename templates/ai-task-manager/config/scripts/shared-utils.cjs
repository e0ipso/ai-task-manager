#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Find the task manager root directory by traversing up from current working directory
 * @returns {string|null} Path to task manager root or null if not found
 */
function findTaskManagerRoot() {
  let currentPath = process.cwd();
  const filesystemRoot = path.parse(currentPath).root;

  // Traverse upward through parent directories until we reach the filesystem root
  while (currentPath !== filesystemRoot) {
    const taskManagerPlansPath = path.join(currentPath, '.ai', 'task-manager', 'plans');

    try {
      // Check if this is a valid task manager directory
      if (fs.existsSync(taskManagerPlansPath)) {
        // Verify it's a directory, not a file
        const stats = fs.lstatSync(taskManagerPlansPath);
        if (stats.isDirectory()) {
          const taskManagerRoot = path.join(currentPath, '.ai', 'task-manager');
          return taskManagerRoot;
        }
      }
    } catch (err) {
      // Handle permission errors or other filesystem issues gracefully
      // Continue searching in parent directories
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        // Silently continue - permission errors are expected in some directories
      }
    }

    // Move up to parent directory
    const parentPath = path.dirname(currentPath);

    // Safety check: if path.dirname returns the same path, we've reached the root
    if (parentPath === currentPath) {
      break;
    }

    currentPath = parentPath;
  }

  // Check the filesystem root as the final attempt
  try {
    const rootTaskManagerPlans = path.join(filesystemRoot, '.ai', 'task-manager', 'plans');
    if (fs.existsSync(rootTaskManagerPlans)) {
      const stats = fs.lstatSync(rootTaskManagerPlans);
      if (stats.isDirectory()) {
        const taskManagerRoot = path.join(filesystemRoot, '.ai', 'task-manager');
        return taskManagerRoot;
      }
    }
  } catch (err) {
    // Silently continue
  }

  return null;
}

/**
 * Parse YAML frontmatter for ID
 * @param {string} content - File content
 * @param {string} [filePath] - Optional file path for error context
 * @returns {number|null} Extracted ID or null
 */
function extractIdFromFrontmatter(content, filePath = 'unknown') {
  // Check for frontmatter block existence
  const frontmatterMatch = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatterText = frontmatterMatch[1];

  // Enhanced patterns to handle various YAML formats:
  // - id: 5                    (simple numeric)
  // - id: "5"                  (double quoted)
  // - id: '5'                  (single quoted)
  // - "id": 5                  (quoted key)
  // - 'id': 5                  (single quoted key)
  // - id : 5                   (extra spaces)
  // - id: 05                   (zero-padded)
  // - id: +5                   (explicit positive)
  // - Mixed quotes: 'id': "5"  (different quote types)
  const patterns = [
    // Most flexible pattern - handles quoted/unquoted keys and values with optional spaces
    /^\s*["']?id["']?\s*:\s*["']?([+-]?\d+)["']?\s*(?:#.*)?$/mi,
    // Simple numeric with optional whitespace and comments
    /^\s*id\s*:\s*([+-]?\d+)\s*(?:#.*)?$/mi,
    // Double quoted values
    /^\s*["']?id["']?\s*:\s*"([+-]?\d+)"\s*(?:#.*)?$/mi,
    // Single quoted values
    /^\s*["']?id["']?\s*:\s*'([+-]?\d+)'\s*(?:#.*)?$/mi,
    // Mixed quotes - quoted key, unquoted value
    /^\s*["']id["']\s*:\s*([+-]?\d+)\s*(?:#.*)?$/mi,
    // YAML-style with pipe or greater-than indicators (edge case)
    /^\s*id\s*:\s*[|>]\s*([+-]?\d+)\s*$/mi
  ];

  // Try each pattern in order
  for (const regex of patterns) {
    const match = frontmatterText.match(regex);
    if (match) {
      const rawId = match[1];
      const id = parseInt(rawId, 10);

      // Validate the parsed ID
      if (isNaN(id)) {
        console.error(`[ERROR] Invalid ID value "${rawId}" in ${filePath} - not a valid number`);
        continue;
      }

      if (id < 0) {
        console.error(`[ERROR] Invalid ID value ${id} in ${filePath} - ID must be non-negative`);
        continue;
      }

      if (id > Number.MAX_SAFE_INTEGER) {
        console.error(`[ERROR] Invalid ID value ${id} in ${filePath} - ID exceeds maximum safe integer`);
        continue;
      }

      return id;
    }
  }

  return null;
}

/**
 * Parse YAML frontmatter from markdown content
 * Returns the frontmatter text as a string (not parsed as YAML)
 * @param {string} content - The markdown content with frontmatter
 * @returns {string} Frontmatter text or empty string if not found
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterEnd = false;
  let delimiterCount = 0;
  const frontmatterLines = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      delimiterCount++;
      if (delimiterCount === 1) {
        inFrontmatter = true;
        continue;
      } else if (delimiterCount === 2) {
        frontmatterEnd = true;
        break;
      }
    }

    if (inFrontmatter && !frontmatterEnd) {
      frontmatterLines.push(line);
    }
  }

  return frontmatterLines.join('\n');
}

module.exports = {
  findTaskManagerRoot,
  extractIdFromFrontmatter,
  parseFrontmatter
};
