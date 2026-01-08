#!/usr/bin/env node

/**
 * Script: check-task-dependencies.cjs
 * Purpose: Check if a task has all of its dependencies resolved (completed)
 * Usage: node check-task-dependencies.cjs <plan-id> <task-id>
 * Returns: 0 if all dependencies are resolved, 1 if not
 */

const fs = require('fs-extra');
const path = require('path');
const {
  resolvePlan,
  parseFrontmatter
} = require('./shared-utils.cjs');

// Chalk instance - loaded dynamically to handle ESM module
let chalkInstance = null;

// Initialize chalk instance dynamically
async function _initChalk() {
  if (chalkInstance) return chalkInstance;

  try {
    const {
      default: chalk
    } = await import('chalk');
    chalkInstance = chalk;
  } catch (_error) {
    // Chalk not available, will fall back to plain console output
    chalkInstance = null;
  }

  return chalkInstance;
}

// Color functions for output
const _printError = (message, chalk) => {
  const formattedMessage = chalk?.red(`ERROR: ${message}`) || `ERROR: ${message}`;
  console.error(formattedMessage);
};

const _printSuccess = (message, chalk) => {
  const formattedMessage = chalk?.green(`✓ ${message}`) || `✓ ${message}`;
  console.log(formattedMessage);
};

const _printWarning = (message, chalk) => {
  const formattedMessage = chalk?.yellow(`⚠ ${message}`) || `⚠ ${message}`;
  console.log(formattedMessage);
};

const _printInfo = (message) => {
  console.log(message);
};

// Function to find task file with padded/unpadded ID handling
const _findTaskFile = (planDir, taskId) => {
  const taskDir = path.join(planDir, 'tasks');

  if (!fs.existsSync(taskDir)) {
    return null;
  }

  const variations = [
    taskId,
    taskId.padStart(2, '0'),
    taskId.replace(/^0+/, '') || '0'
  ];

  const uniqueVariations = [...new Set(variations)];

  try {
    const files = fs.readdirSync(taskDir);
    const found = uniqueVariations.reduce((acc, v) => {
      if (acc) return acc;
      const match = files.find(f => f.startsWith(`${v}--`) && f.endsWith('.md'));
      return match ? path.join(taskDir, match) : null;
    }, null);
    return found;
  } catch (err) {
    return null;
  }
};


// Function to extract dependencies from frontmatter
const _extractDependencies = (frontmatter) => {
  const lines = frontmatter.split('\n');
  const dependencies = [];
  let inDependenciesSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for dependencies line
    if (line.match(/^dependencies:/)) {
      inDependenciesSection = true;

      // Check if dependencies are on the same line (array syntax)
      const arrayMatch = line.match(/\[(.*)\]/);
      if (arrayMatch) {
        const deps = arrayMatch[1]
          .split(',')
          .map(dep => dep.trim().replace(/['"]/g, ''))
          .filter(dep => dep.length > 0);
        dependencies.push(...deps);
        inDependenciesSection = false;
      }
      continue;
    }

    // If we're in dependencies section and hit a non-indented line that's not a list item, exit
    if (inDependenciesSection && line.match(/^[^ ]/) && !line.match(/^[ \t]*-/)) {
      inDependenciesSection = false;
    }

    // Parse list format dependencies
    if (inDependenciesSection && line.match(/^[ \t]*-/)) {
      const dep = line.replace(/^[ \t]*-[ \t]*/, '').replace(/[ \t]*$/, '').replace(/['"]/g, '');
      if (dep.length > 0) {
        dependencies.push(dep);
      }
    }
  }

  return dependencies;
};

// Function to extract status from frontmatter
const _extractStatus = (frontmatter) => {
  const lines = frontmatter.split('\n');

  for (const line of lines) {
    if (line.match(/^status:/)) {
      return line.replace(/^status:[ \t]*/, '').replace(/^["']/, '').replace(/["']$/, '').trim();
    }
  }

  return null;
};

// Main function
const _main = async (startPath = process.cwd()) => {
  // Initialize chalk
  const chalk = await _initChalk();

  // Check arguments
  if (process.argv.length !== 4) {
    _printError('Invalid number of arguments', chalk);
    console.log('Usage: node check-task-dependencies.cjs <plan-id-or-path> <task-id>');
    console.log('Example: node check-task-dependencies.cjs 16 03');
    process.exit(1);
  }

  const inputId = process.argv[2];
  const taskId = process.argv[3];

  const resolved = resolvePlan(inputId, startPath);

  if (!resolved) {
    _printError(`Plan "${inputId}" not found or invalid`, chalk);
    process.exit(1);
  }

  const {
    planDir,
    planId
  } = resolved;
  _printInfo(`Found plan directory: ${planDir}`);

  // Find task file
  const taskFile = _findTaskFile(planDir, taskId);

  if (!taskFile || !fs.existsSync(taskFile)) {
    _printError(`Task with ID ${taskId} not found in plan ${planId}`, chalk);
    process.exit(1);
  }

  _printInfo(`Checking task: ${path.basename(taskFile)}`);
  console.log('');

  // Read and parse task file
  const taskContent = fs.readFileSync(taskFile, 'utf8');
  const frontmatter = parseFrontmatter(taskContent);
  const dependencies = _extractDependencies(frontmatter);

  // Check if there are any dependencies
  if (dependencies.length === 0) {
    _printSuccess('Task has no dependencies - ready to execute!', chalk);
    process.exit(0);
  }

  // Display dependencies
  _printInfo('Task dependencies found:');
  dependencies.forEach(dep => {
    console.log(`  - Task ${dep}`);
  });
  console.log('');

  // Check each dependency
  let allResolved = true;
  let unresolvedDeps = [];
  let resolvedCount = 0;
  const totalDeps = dependencies.length;

  _printInfo('Checking dependency status...');
  console.log('');

  for (const depId of dependencies) {
    // Find dependency task file
    const depFile = _findTaskFile(planDir, depId);

    if (!depFile || !fs.existsSync(depFile)) {
      _printError(`Dependency task ${depId} not found`, chalk);
      allResolved = false;
      unresolvedDeps.push(`${depId} (not found)`);
      continue;
    }

    // Extract status from dependency task
    const depContent = fs.readFileSync(depFile, 'utf8');
    const depFrontmatter = parseFrontmatter(depContent);
    const status = _extractStatus(depFrontmatter);

    // Check if status is completed
    if (status === 'completed') {
      _printSuccess(`Task ${depId} - Status: completed ✓`, chalk);
      resolvedCount++;
    } else {
      _printWarning(`Task ${depId} - Status: ${status || 'unknown'} ✗`, chalk);
      allResolved = false;
      unresolvedDeps.push(`${depId} (${status || 'unknown'})`);
    }
  }

  console.log('');
  _printInfo('=========================================');
  _printInfo('Dependency Check Summary');
  _printInfo('=========================================');
  _printInfo(`Total dependencies: ${totalDeps}`);
  _printInfo(`Resolved: ${resolvedCount}`);
  _printInfo(`Unresolved: ${totalDeps - resolvedCount}`);
  console.log('');

  if (allResolved) {
    _printSuccess(`All dependencies are resolved! Task ${taskId} is ready to execute.`, chalk);
    process.exit(0);
  } else {
    _printError(`Task ${taskId} has unresolved dependencies:`, chalk);
    unresolvedDeps.forEach(dep => {
      console.log(dep);
    });
    _printInfo('Please complete the dependencies before executing this task.');
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  _main().catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  _main
};
