#!/usr/bin/env node

/**
 * Script: check-task-dependencies.cjs
 * Purpose: Check if a task has all of its dependencies resolved (completed)
 * Usage: node check-task-dependencies.cjs <plan-id> <task-id>
 * Returns: 0 if all dependencies are resolved, 1 if not
 */

const fs = require('fs');
const path = require('path');
const {
  resolvePlan,
  getMetaList,
  getMetaValue,
  TASK_FILE_EXTENSION
} = require('./shared-utils.cjs');

const _printError = (message) => {
  console.error(`ERROR: ${message}`);
};

const _printSuccess = (message) => {
  console.log(`✓ ${message}`);
};

const _printWarning = (message) => {
  console.log(`⚠ ${message}`);
};

const _printInfo = (message) => {
  console.log(message);
};

/**
 * Locate a task file in the plan's tasks directory, accepting both padded
 * (`01`) and unpadded (`1`) numeric IDs.
 */
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
      const match = files.find(f => f.startsWith(`${v}--`) && f.endsWith(TASK_FILE_EXTENSION));
      return match ? path.join(taskDir, match) : null;
    }, null);
    return found;
  } catch (err) {
    return null;
  }
};

const _main = (startPath = process.cwd()) => {
  if (process.argv.length !== 4) {
    _printError('Invalid number of arguments');
    console.log('Usage: node check-task-dependencies.cjs <plan-id-or-path> <task-id>');
    console.log('Example: node check-task-dependencies.cjs 16 03');
    process.exit(1);
  }

  const inputId = process.argv[2];
  const taskId = process.argv[3];

  const resolved = resolvePlan(inputId, startPath);

  if (!resolved) {
    _printError(`Plan "${inputId}" not found or invalid`);
    process.exit(1);
  }

  const { planDir, planId } = resolved;
  _printInfo(`Found plan directory: ${planDir}`);

  const taskFile = _findTaskFile(planDir, taskId);

  if (!taskFile || !fs.existsSync(taskFile)) {
    _printError(`Task with ID ${taskId} not found in plan ${planId}`);
    process.exit(1);
  }

  _printInfo(`Checking task: ${path.basename(taskFile)}`);
  console.log('');

  const taskContent = fs.readFileSync(taskFile, 'utf8');
  const dependencies = getMetaList(taskContent, 'dependencies');

  if (dependencies.length === 0) {
    _printSuccess('Task has no dependencies - ready to execute!');
    process.exit(0);
  }

  _printInfo('Task dependencies found:');
  dependencies.forEach(dep => {
    console.log(`  - Task ${dep}`);
  });
  console.log('');

  let allResolved = true;
  const unresolvedDeps = [];
  let resolvedCount = 0;
  const totalDeps = dependencies.length;

  _printInfo('Checking dependency status...');
  console.log('');

  for (const depId of dependencies) {
    const depFile = _findTaskFile(planDir, depId);

    if (!depFile || !fs.existsSync(depFile)) {
      _printError(`Dependency task ${depId} not found`);
      allResolved = false;
      unresolvedDeps.push(`${depId} (not found)`);
      continue;
    }

    const depContent = fs.readFileSync(depFile, 'utf8');
    const status = getMetaValue(depContent, 'status');

    if (status === 'completed') {
      _printSuccess(`Task ${depId} - Status: completed ✓`);
      resolvedCount++;
    } else {
      _printWarning(`Task ${depId} - Status: ${status || 'unknown'} ✗`);
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
    _printSuccess(`All dependencies are resolved! Task ${taskId} is ready to execute.`);
    process.exit(0);
  } else {
    _printError(`Task ${taskId} has unresolved dependencies:`);
    unresolvedDeps.forEach(dep => {
      console.log(dep);
    });
    _printInfo('Please complete the dependencies before executing this task.');
    process.exit(1);
  }
};

if (require.main === module) {
  _main();
}

module.exports = {
  _main
};
