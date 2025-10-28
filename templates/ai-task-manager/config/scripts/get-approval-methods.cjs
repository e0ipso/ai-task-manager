#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Enable debug logging via environment variable
const DEBUG = process.env.DEBUG === 'true';

/**
 * Debug logging utility
 * @param {string} message - Debug message
 * @param {...any} args - Additional arguments to log
 */
function debugLog(message, ...args) {
  if (DEBUG) {
    console.error(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Error logging utility
 * @param {string} message - Error message
 * @param {...any} args - Additional arguments to log
 */
function errorLog(message, ...args) {
  console.error(`[ERROR] ${message}`, ...args);
}

/**
 * Find the task manager root directory by traversing up from current working directory
 * @returns {string|null} Path to task manager root or null if not found
 */
function findTaskManagerRoot() {
  let currentPath = process.cwd();
  const filesystemRoot = path.parse(currentPath).root;

  debugLog(`Starting search for task manager root from: ${currentPath}`);

  while (currentPath !== filesystemRoot) {
    const taskManagerPlansPath = path.join(currentPath, '.ai', 'task-manager', 'plans');
    debugLog(`Checking for task manager at: ${taskManagerPlansPath}`);

    try {
      if (fs.existsSync(taskManagerPlansPath)) {
        const stats = fs.lstatSync(taskManagerPlansPath);
        if (stats.isDirectory()) {
          const taskManagerRoot = path.join(currentPath, '.ai', 'task-manager');
          debugLog(`Found valid task manager root at: ${taskManagerRoot}`);
          return taskManagerRoot;
        }
      }
    } catch (err) {
      debugLog(`Filesystem error checking ${taskManagerPlansPath}: ${err.message}`);
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      break;
    }

    currentPath = parentPath;
  }

  debugLog(`Task manager root not found in any parent directory`);
  return null;
}

/**
 * Find plan file by ID in plans or archive directories
 * @param {string} taskManagerRoot - Path to task manager root
 * @param {string} planId - Plan ID to find
 * @returns {string|null} Path to plan file or null if not found
 */
function findPlanFile(taskManagerRoot, planId) {
  const plansDir = path.join(taskManagerRoot, 'plans');
  const archiveDir = path.join(taskManagerRoot, 'archive');

  debugLog(`Searching for plan ${planId} in ${plansDir} and ${archiveDir}`);

  for (const dir of [plansDir, archiveDir]) {
    if (!fs.existsSync(dir)) {
      debugLog(`Directory does not exist: ${dir}`);
      continue;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.match(/^\d+--/)) {
          // Check if directory matches plan ID
          const dirMatch = entry.name.match(/^(\d+)--/);
          if (dirMatch && dirMatch[1] === planId) {
            const planDirPath = path.join(dir, entry.name);
            debugLog(`Found plan directory: ${planDirPath}`);

            // Look for plan file inside directory
            try {
              const planDirEntries = fs.readdirSync(planDirPath, { withFileTypes: true });

              for (const planEntry of planDirEntries) {
                if (planEntry.isFile() && planEntry.name.match(/^plan-\d+--.*\.md$/)) {
                  const planFilePath = path.join(planDirPath, planEntry.name);
                  debugLog(`Found plan file: ${planFilePath}`);
                  return planFilePath;
                }
              }
            } catch (err) {
              debugLog(`Failed to read plan directory ${planDirPath}: ${err.message}`);
            }
          }
        } else if (entry.isFile() && entry.name.match(/^plan-\d+--.*\.md$/)) {
          // Legacy: direct plan file in plans/archive directory
          const filenameMatch = entry.name.match(/^plan-(\d+)--/);
          if (filenameMatch && filenameMatch[1] === planId) {
            const planFilePath = path.join(dir, entry.name);
            debugLog(`Found legacy plan file: ${planFilePath}`);
            return planFilePath;
          }
        }
      }
    } catch (err) {
      errorLog(`Failed to read directory ${dir}: ${err.message}`);
    }
  }

  return null;
}

/**
 * Extract a field value from YAML frontmatter
 * @param {string} frontmatter - YAML frontmatter text
 * @param {string} fieldName - Field name to extract
 * @param {string} defaultValue - Default value if field not found
 * @returns {string} Field value or default
 */
function extractField(frontmatter, fieldName, defaultValue = 'manual') {
  debugLog(`Extracting field: ${fieldName}`);

  // Pattern to match field with various formatting:
  // - field: value
  // - field: "value"
  // - field: 'value'
  // - "field": value
  // - field : value (extra spaces)
  const regex = new RegExp(`^\\s*["']?${fieldName}["']?\\s*:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);

  if (!match) {
    debugLog(`Field ${fieldName} not found, using default: ${defaultValue}`);
    return defaultValue;
  }

  // Clean up value: remove quotes and trim
  let value = match[1].trim();
  value = value.replace(/^['"]|['"]$/g, '');

  debugLog(`Extracted ${fieldName}: ${value}`);
  return value || defaultValue;
}

/**
 * Main function to get approval methods from plan file
 */
function main() {
  // Get plan ID from command line
  const planId = process.argv[2];
  if (!planId) {
    errorLog('Error: Plan ID is required');
    console.error('Usage: node get-approval-methods.cjs <plan-id>');
    process.exit(1);
  }

  debugLog(`Looking for plan ID: ${planId}`);

  // Find task manager root
  const taskManagerRoot = findTaskManagerRoot();
  if (!taskManagerRoot) {
    errorLog('No .ai/task-manager directory found in current directory or any parent directory.');
    errorLog('Please ensure you are in a project with task manager initialized.');
    errorLog(`Current working directory: ${process.cwd()}`);
    process.exit(1);
  }

  // Find plan file
  const planFile = findPlanFile(taskManagerRoot, planId);
  if (!planFile) {
    errorLog(`Plan file for ID ${planId} not found in plans or archive directories.`);
    process.exit(1);
  }

  debugLog(`Reading plan file: ${planFile}`);

  // Read plan file
  let content;
  try {
    content = fs.readFileSync(planFile, 'utf8');
  } catch (err) {
    errorLog(`Failed to read plan file ${planFile}: ${err.message}`);
    process.exit(1);
  }

  // Extract YAML frontmatter
  const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    errorLog('No YAML frontmatter found in plan file');
    process.exit(1);
  }

  const frontmatter = match[1];
  debugLog(`Found frontmatter:\n${frontmatter}`);

  // Extract approval method fields
  const approvalMethodPlan = extractField(frontmatter, 'approval_method_plan');
  const approvalMethodTasks = extractField(frontmatter, 'approval_method_tasks');

  // Output JSON
  const result = {
    approval_method_plan: approvalMethodPlan,
    approval_method_tasks: approvalMethodTasks
  };

  console.log(JSON.stringify(result, null, 2));
}

// Run main function
main();
