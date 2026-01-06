#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { findTaskManagerRoot, extractIdFromFrontmatter } = require('./shared-utils.cjs');

/**
 * Error logging utility
 * @param {string} message - Error message
 * @param {...any} args - Additional arguments to log
 */
function errorLog(message, ...args) {
  console.error(`[ERROR] ${message}`, ...args);
}

/**
 * Get the next available plan ID by scanning existing plan files
 * @returns {number} Next available plan ID
 */
function getNextPlanId() {
  const taskManagerRoot = findTaskManagerRoot();

  if (!taskManagerRoot) {
    errorLog('No .ai/task-manager/plans directory found in current directory or any parent directory.');
    errorLog('');
    errorLog('Please ensure you are in a project with task manager initialized, or navigate to the correct');
    errorLog('project directory. The task manager looks for the .ai/task-manager/plans structure starting');
    errorLog('from the current working directory and traversing upward through parent directories.');
    errorLog('');
    errorLog(`Current working directory: ${process.cwd()}`);
    process.exit(1);
  }

  const plansDir = path.join(taskManagerRoot, 'plans');
  const archiveDir = path.join(taskManagerRoot, 'archive');

  let maxId = 0;

  // Scan both plans and archive directories
  [plansDir, archiveDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      return;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isDirectory() && entry.name.match(/^\d+--/)) {
          // This is a plan directory, look for plan files inside
          const planDirPath = path.join(dir, entry.name);

          try {
            const planDirEntries = fs.readdirSync(planDirPath, { withFileTypes: true });

            planDirEntries.forEach(planEntry => {
              if (planEntry.isFile() && planEntry.name.match(/^plan-\d+--.*\.md$/)) {
                const filePath = path.join(planDirPath, planEntry.name);

                try {
                  const content = fs.readFileSync(filePath, 'utf8');
                  const frontmatterId = extractIdFromFrontmatter(content, filePath);

                  if (frontmatterId !== null && frontmatterId > maxId) {
                    maxId = frontmatterId;
                  }
                } catch (err) {
                  errorLog(`Failed to read file ${filePath}: ${err.message}`);
                }
              }
            });
          } catch (err) {
            errorLog(`Failed to read plan directory ${planDirPath}: ${err.message}`);
          }
        }
      });
    } catch (err) {
      errorLog(`Failed to read directory ${dir}: ${err.message}`);
    }
  });

  return maxId + 1;
}

// Output the next plan ID
console.log(getNextPlanId());
