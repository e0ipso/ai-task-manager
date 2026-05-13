#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PLAN_FILE_EXTENSION = '.html';
const TASK_FILE_EXTENSION = '.html';

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
 * Decode common HTML entities in an attribute value
 * @private
 * @param {string} value - The raw attribute value
 * @returns {string} Decoded value
 */
function _decodeHtmlEntities(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Inspect HTML content and return all `<meta>` tags inside `<head>` as an
 * object keyed by the `name` attribute. The lookup deliberately mimics a
 * DOM access pattern (`document.head.querySelector('meta[name=...]')`)
 * without requiring an HTML parser dependency in standalone scripts.
 *
 * @param {string} htmlContent - The HTML document content
 * @returns {Object<string, string>} Map of meta name to content value
 */
function getHeadMeta(htmlContent) {
  if (typeof htmlContent !== 'string') return {};

  // Restrict to <head>...</head> if present; otherwise fall back to whole doc.
  const headMatch = htmlContent.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : htmlContent;

  const result = {};

  // Two regexes cover both <meta name="x" content="y"> and the reversed order.
  const metaForwardRegex = /<meta\b[^>]*?\bname\s*=\s*["']([^"']+)["'][^>]*?\bcontent\s*=\s*["']([^"']*)["'][^>]*?\/?>/gi;
  const metaReverseRegex = /<meta\b[^>]*?\bcontent\s*=\s*["']([^"']*)["'][^>]*?\bname\s*=\s*["']([^"']+)["'][^>]*?\/?>/gi;

  let match;
  while ((match = metaForwardRegex.exec(headContent)) !== null) {
    result[match[1]] = _decodeHtmlEntities(match[2]);
  }
  while ((match = metaReverseRegex.exec(headContent)) !== null) {
    if (!(match[2] in result)) {
      result[match[2]] = _decodeHtmlEntities(match[1]);
    }
  }

  return result;
}

/**
 * Get a single `<meta name="...">` content value from an HTML document.
 * @param {string} htmlContent - The HTML document content
 * @param {string} name - The meta name to retrieve
 * @returns {string|undefined} The content value, or undefined if not present
 */
function getMetaValue(htmlContent, name) {
  return getHeadMeta(htmlContent)[name];
}

/**
 * Get a comma-separated `<meta>` content value as a trimmed array.
 * @param {string} htmlContent - The HTML document content
 * @param {string} name - The meta name to retrieve
 * @returns {string[]} Array of trimmed, non-empty values
 */
function getMetaList(htmlContent, name) {
  const raw = getMetaValue(htmlContent, name);
  if (!raw) return [];
  return raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * Extract a non-negative integer ID from a plan/task HTML document's
 * `<meta name="id">` tag.
 * @param {string} content - File content (HTML)
 * @param {string} [filePath] - Optional file path for error context
 * @returns {number|null} Extracted ID or null
 */
function extractIdFromHead(content, filePath = 'unknown') {
  const raw = getMetaValue(content, 'id');
  if (raw === undefined || raw === null || raw === '') return null;

  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    console.error(`[ERROR] Invalid ID value "${raw}" in ${filePath} - not a valid number`);
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

    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith(TASK_FILE_EXTENSION));
    return files.length;
  } catch (err) {
    return 0;
  }
}

/**
 * Check if an execution blueprint section exists in a plan HTML document.
 * Matches the semantic marker `id="execution-blueprint"` placed on the
 * `<section>` wrapping the blueprint, as defined in BLUEPRINT_TEMPLATE.html.
 * @param {string} planFile - Path to plan file
 * @returns {boolean} True if blueprint section exists, false otherwise
 */
function checkBlueprintExists(planFile) {
  try {
    const planContent = fs.readFileSync(planFile, 'utf8');
    return /\bid\s*=\s*["']execution-blueprint["']/i.test(planContent);
  } catch (err) {
    return false;
  }
}

/**
 * Validate a plan file by inspecting its `<head>` metadata.
 * @param {string} filePath - Path to plan file
 * @returns {number|null} Plan ID from head metadata or null if invalid
 */
function validatePlanFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const meta = getHeadMeta(content);

    // Required: a `created` meta entry must exist.
    if (!meta.created) {
      return null;
    }

    return extractIdFromHead(content, filePath);
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
            .filter(planEntry => planEntry.isFile() && planEntry.name.endsWith(PLAN_FILE_EXTENSION))
            .flatMap(planEntry => {
              const filePath = path.join(planDirPath, planEntry.name);
              try {
                const content = fs.readFileSync(filePath, 'utf8');
                const id = extractIdFromHead(content, filePath);

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
  PLAN_FILE_EXTENSION,
  TASK_FILE_EXTENSION,
  findTaskManagerRoot,
  isValidTaskManagerRoot,
  getTaskManagerAt,
  checkStandardRootShortcut,
  validatePlanFile,
  getHeadMeta,
  getMetaValue,
  getMetaList,
  extractIdFromHead,
  findPlanById,
  countTasks,
  checkBlueprintExists,
  getAllPlans,
  _getParentPaths,
  resolvePlan
};
