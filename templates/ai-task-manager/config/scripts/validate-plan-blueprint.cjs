#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharedUtils = require('./shared-utils.cjs');
const {
  findTaskManagerRoot,
  findPlanById,
  countTasks,
  checkBlueprintExists,
  getAllPlans,
  validatePlanFile,
  checkStandardRootShortcut,
  resolvePlan
} = sharedUtils;

/**
 * Error logging utility
 * @private
 * @param {string} message - Error message
 * @param {...any} args - Additional arguments to log
 */
function _errorLog(message, ...args) {
  console.error(`[ERROR] ${message}`, ...args);
}

/**
 * List available plans for error messaging
 * @private
 * @param {string} [taskManagerRoot] - Optional task manager root path
 * @returns {string[]} Array of plan directory names
 */
function _listAvailablePlans(taskManagerRoot) {
  const plans = getAllPlans(taskManagerRoot);
  return plans
    .map(p => p.name)
    .sort((a, b) => {
      const aIdMatch = a.match(/^(\d+)--/);
      const bIdMatch = b.match(/^(\d+)--/);
      if (!aIdMatch || !bIdMatch) return 0;
      return parseInt(aIdMatch[1], 10) - parseInt(bIdMatch[1], 10);
    });
}

/**
 * Validate plan blueprint and output JSON or specific field
 * @private
 * @param {string|number} inputId - Plan ID or absolute path to validate
 * @param {string} [fieldName] - Optional field name to extract (planFile, planDir, taskCount, blueprintExists, taskManagerRoot, planId)
 * @param {string} [startPath] - Optional start path for finding task manager root
 */
function _validatePlanBlueprint(inputId, fieldName, startPath = process.cwd()) {
  if (!inputId) {
    _errorLog('Plan ID or absolute path is required');
    _errorLog('');
    _errorLog('Usage: node validate-plan-blueprint.cjs <plan-id-or-path> [field-name]');
    _errorLog('');
    _errorLog('Examples:');
    _errorLog('  node validate-plan-blueprint.cjs 47                  # Output full JSON');
    _errorLog('  node validate-plan-blueprint.cjs /path/to/plan.md    # Output full JSON for specific file');
    _errorLog('  node validate-plan-blueprint.cjs 47 planFile         # Output just the plan file path');
    _errorLog('  node validate-plan-blueprint.cjs 47 blueprintExists  # Output yes/no');
    process.exit(1);
  }

  // Check if input is numeric (allowing padded zeros) - if not a number or path, it's invalid
  const numericInput = parseInt(inputId, 10);
  const isNumeric = !isNaN(numericInput);
  const isAbsolutePath = inputId.startsWith('/');

  if (!isNumeric && !isAbsolutePath) {
    _errorLog(`Invalid plan ID: "${inputId}" is not a valid number`);
    process.exit(1);
  }

  const resolved = resolvePlan(inputId, startPath);

  if (!resolved) {
    _errorLog(`Plan ID ${inputId} not found or invalid`);
    _errorLog('');

    const tmRoot = findTaskManagerRoot(startPath);
    const availablePlans = _listAvailablePlans(tmRoot);
    if (availablePlans.length > 0) {
      _errorLog('Available plans:');
      availablePlans.forEach(plan => {
        _errorLog(`  ${plan}`);
      });
    }

    process.exit(1);
  }

  const {
    planFile,
    planDir,
    taskManagerRoot,
    planId
  } = resolved;

  const taskCount = countTasks(planDir);
  const blueprintExists = checkBlueprintExists(planFile);

  const result = {
    planFile,
    planDir,
    taskManagerRoot,
    planId,
    taskCount,
    blueprintExists: blueprintExists ? 'yes' : 'no'
  };

  // If field name is provided, output just that field
  if (fieldName) {
    const validFields = ['planFile', 'planDir', 'taskCount', 'blueprintExists', 'taskManagerRoot', 'planId'];
    if (!validFields.includes(fieldName)) {
      _errorLog(`Invalid field name: ${fieldName}`);
      _errorLog(`Valid fields: ${validFields.join(', ')}`);
      process.exit(1);
    }
    // Use process.stdout.write to avoid util.inspect colorization
    process.stdout.write(String(result[fieldName]) + '\n');
  } else {
    // Output full JSON
    console.log(JSON.stringify(result, null, 2));
  }
}

// Main execution
if (require.main === module) {
  const planId = process.argv[2];
  const fieldName = process.argv[3];
  _validatePlanBlueprint(planId, fieldName);
}

module.exports = {
  _validatePlanBlueprint
};
