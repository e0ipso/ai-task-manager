#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validate that a task manager root is correctly initialized
 * @internal
 * @param {string} taskManagerPath - Path to .ai/task-manager
 * @returns {boolean} True if root is valid, false otherwise
 */
function isValidTaskManagerRoot(taskManagerPath) {
  try {
    if (!fs.existsSync(taskManagerPath)) return false;
    if (!fs.lstatSync(taskManagerPath).isDirectory()) return false;

    // Must contain .init-metadata.json with valid version prop
    const metadataPath = path.join(taskManagerPath, '.init-metadata.json');
    if (!fs.existsSync(metadataPath)) return false;

    const metadataContent = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);

    return metadata && typeof metadata === 'object' && 'version' in metadata;
  } catch (err) {
    return false;
  }
}

/**
 * Check if a directory contains a valid task manager root
 * @internal
 * @param {string} directory - Directory to check
 * @returns {string|null} Task manager path if valid, otherwise null
 */
function getTaskManagerAt(directory) {
  const taskManagerPath = path.join(directory, '.ai', 'task-manager');
  return isValidTaskManagerRoot(taskManagerPath) ? taskManagerPath : null;
}

/**
 * Get all parent directories from a start path up to the filesystem root (recursive)
 * @private
 * @param {string} currentPath - Path to start from
 * @param {string[]} [acc=[]] - Accumulator for paths
 * @returns {string[]} Array of paths from start to root
 */
function _getParentPaths(currentPath, acc = []) {
  const absolutePath = path.resolve(currentPath);
  const nextAcc = [...acc, absolutePath];
  const parentPath = path.dirname(absolutePath);

  if (parentPath === absolutePath) {
    return nextAcc;
  }

  return _getParentPaths(parentPath, nextAcc);
}

/**
 * Find the task manager root directory by traversing up from an optional start path
 * @param {string} [startPath=process.cwd()] - Starting path for root discovery (defaults to current working directory)
 * @returns {string|null} Path to task manager root or null if not found
 */
function findTaskManagerRoot(startPath = process.cwd()) {
  const paths = _getParentPaths(startPath);
  const foundPath = paths.find(p => getTaskManagerAt(p));
  return foundPath ? getTaskManagerAt(foundPath) : null;
}

/**
 * Check if the path matches the standard .ai/task-manager structure
 * @param {string} filePath - Path to plan file
 * @returns {string|null} The possible root path if matches, otherwise null
 */
function checkStandardRootShortcut(filePath) {
  const planDir = path.dirname(filePath);
  const parentDir = path.dirname(planDir);
  const possibleRoot = path.dirname(parentDir);

  const parentBase = path.basename(parentDir);
  const isPlansOrArchive = parentBase === 'plans' || parentBase === 'archive';
  if (!isPlansOrArchive) return null;

  if (path.basename(possibleRoot) !== 'task-manager') return null;

  const dotAiDir = path.dirname(possibleRoot);
  if (path.basename(dotAiDir) !== '.ai') return null;

  return isValidTaskManagerRoot(possibleRoot) ? possibleRoot : null;
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

  // Try each pattern in order using functional find
  const foundPattern = patterns
    .map(regex => ({ regex, match: frontmatterText.match(regex) }))
    .find(({ match }) => match);

  if (!foundPattern) return null;

  const { match, regex } = foundPattern;
  const rawId = match[1];
  const id = parseInt(rawId, 10);

  // Validate the parsed ID
  if (isNaN(id)) {
    console.error(`[ERROR] Invalid ID value "${rawId}" in ${filePath} - not a valid number`);
    return null;
  }

  if (id < 0) {
    console.error(`[ERROR] Invalid ID value ${id} in ${filePath} - ID must be non-negative`);
    return null;
  }

  if (id > Number.MAX_SAFE_INTEGER) {
    console.error(`[ERROR] Invalid ID value ${id} in ${filePath} - ID exceeds maximum safe integer`);
    return null;
  }

  return id;
}

/**
 * Parse YAML frontmatter from markdown content
 * Returns the frontmatter text as a string (not parsed as YAML)
 * @param {string} content - The markdown content with frontmatter
 * @returns {string} Frontmatter text or empty string if not found
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');

  const result = lines.reduce((acc, line) => {
    if (acc.done) return acc;

    if (line.trim() === '---') {
      const nextDelimiterCount = acc.delimiterCount + 1;
      if (nextDelimiterCount === 2) {
        return { ...acc, delimiterCount: nextDelimiterCount, done: true };
      }
      return { ...acc, delimiterCount: nextDelimiterCount };
    }

    if (acc.delimiterCount === 1) {
      return { ...acc, frontmatterLines: [...acc.frontmatterLines, line] };
    }

    return acc;
  }, { delimiterCount: 0, frontmatterLines: [], done: false });

  return result.frontmatterLines.join('\n');
}

/**
 * Find plan file and directory for a given plan ID
 * @param {string|number} planId - Plan ID to search for
 * @param {string} [taskManagerRoot] - Optional task manager root path (uses findTaskManagerRoot() if not provided)
 * @returns {Object|null} Object with planFile and planDir, or null if not found
 */
function findPlanById(planId, taskManagerRoot) {
  const numericPlanId = parseInt(planId, 10);
  if (isNaN(numericPlanId)) return null;

  const plans = getAllPlans(taskManagerRoot);
  const plan = plans.find(p => p.id === numericPlanId);

  if (!plan) return null;

  return {
    planFile: plan.file,
    planDir: plan.dir,
    isArchive: plan.isArchive
  };
}

/**
 * Count task files in a plan's tasks directory
 * @param {string} planDir - Plan directory path
 * @returns {number} Number of task files found
 */
function countTasks(planDir) {
  const tasksDir = path.join(planDir, 'tasks');

  if (!fs.existsSync(tasksDir)) {
    return 0;
  }

  try {
    const stats = fs.lstatSync(tasksDir);
    if (!stats.isDirectory()) {
      return 0;
    }

    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
    return files.length;
  } catch (err) {
    return 0;
  }
}

/**
 * Check if execution blueprint section exists in plan file
 * @param {string} planFile - Path to plan file
 * @returns {boolean} True if blueprint section exists, false otherwise
 */
function checkBlueprintExists(planFile) {
  try {
    const planContent = fs.readFileSync(planFile, 'utf8');
    const blueprintExists = /^## Execution Blueprint/m.test(planContent);
    return blueprintExists;
  } catch (err) {
    return false;
  }
}

/**
 * Validate plan file frontmatter
 * @param {string} filePath - Path to plan file
 * @returns {number|null} Plan ID from frontmatter or null if invalid
 */
function validatePlanFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    // Check for required fields
    if (!frontmatter) {
      return null;
    }

    // Check for 'created' field
    if (!/\bcreated\b/i.test(frontmatter)) {
      return null;
    }

    // Extract and return ID
    const id = extractIdFromFrontmatter(content, filePath);
    return id;
  } catch (err) {
    return null;
  }
}

/**
 * Get all plans (active and archived) in a task manager root
 * @param {string} [taskManagerRoot] - Task manager root path
 * @returns {Array<Object>} Array of plan objects { id, file, dir, isArchive }
 */
function getAllPlans(taskManagerRoot) {
  const root = taskManagerRoot || findTaskManagerRoot();
  if (!root) return [];

  const types = [
    { dir: path.join(root, 'plans'), isArchive: false },
    { dir: path.join(root, 'archive'), isArchive: true }
  ];

  return types.flatMap(({ dir, isArchive }) => {
    if (!fs.existsSync(dir)) return [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries.flatMap(entry => {
        if (!entry.isDirectory()) return [];

        const planDirPath = path.join(dir, entry.name);

        try {
          const planDirEntries = fs.readdirSync(planDirPath, { withFileTypes: true });
          return planDirEntries
            .filter(planEntry => planEntry.isFile() && planEntry.name.endsWith('.md'))
            .flatMap(planEntry => {
              const filePath = path.join(planDirPath, planEntry.name);
              try {
                const content = fs.readFileSync(filePath, 'utf8');
                const id = extractIdFromFrontmatter(content, filePath);

                if (id !== null) {
                  return {
                    id,
                    file: filePath,
                    dir: planDirPath,
                    isArchive,
                    name: entry.name
                  };
                }
              } catch (err) {
                // Skip files that can't be read
              }
              return [];
            });
        } catch (err) {
          return [];
        }
      });
    } catch (err) {
      return [];
    }
  });
}

/**
 * Resolve plan information from either a numeric ID or an absolute path
 * @param {string|number} input - Numeric ID or absolute path
 * @param {string} [startPath=process.cwd()] - Starting path for hierarchical search
 * @returns {Object|null} { planFile, planDir, taskManagerRoot, planId } or null if not found
 */
function resolvePlan(input, startPath = process.cwd()) {
  if (!input) return null;
  const inputStr = String(input);

  // 1. Handle Absolute Path
  if (inputStr.startsWith('/')) {
    const planId = validatePlanFile(inputStr);
    if (planId === null) return null;

    const tmRoot = checkStandardRootShortcut(inputStr) || findTaskManagerRoot(path.dirname(inputStr));
    if (!tmRoot) return null;

    return {
      planFile: inputStr,
      planDir: path.dirname(inputStr),
      taskManagerRoot: tmRoot,
      planId
    };
  }

  // 2. Handle Numeric ID with Hierarchical Search
  const planId = parseInt(inputStr, 10);
  if (isNaN(planId)) return null;

  const findInAncestry = (currentPath, searched = new Set()) => {
    const tmRoot = findTaskManagerRoot(currentPath);
    if (!tmRoot) return null;

    const normalized = path.normalize(tmRoot);
    if (searched.has(normalized)) {
      return null;
    }
    searched.add(normalized);

    const plan = findPlanById(planId, tmRoot);
    if (plan) {
      return {
        planFile: plan.planFile,
        planDir: plan.planDir,
        taskManagerRoot: tmRoot,
        planId
      };
    }

    // Move to parent directory (parent of the directory containing task-manager)
    const parentOfRoot = path.dirname(path.dirname(tmRoot));
    if (parentOfRoot === tmRoot) return null;
    return findInAncestry(parentOfRoot, searched);
  };

  return findInAncestry(startPath);
}

module.exports = {
  findTaskManagerRoot,
  isValidTaskManagerRoot,
  getTaskManagerAt,
  checkStandardRootShortcut,
  validatePlanFile,
  extractIdFromFrontmatter,
  parseFrontmatter,
  findPlanById,
  countTasks,
  checkBlueprintExists,
  getAllPlans,
  _getParentPaths,
  resolvePlan
};
