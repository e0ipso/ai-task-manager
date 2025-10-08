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
 * Detect the currently running AI assistant based on environment variables and directory presence
 * @returns {string} Assistant identifier: 'claude', 'gemini', 'opencode', 'cursor', or 'unknown'
 */
function detectAssistant() {
  debugLog('Starting assistant detection');

  // 1. Check environment variables (highest priority)
  debugLog('Checking environment variables...');

  if (process.env.CLAUDECODE) {
    debugLog('Detected Claude via CLAUDECODE environment variable');
    return 'claude';
  }

  if (process.env.GEMINI_CODE) {
    debugLog('Detected Gemini via GEMINI_CODE environment variable');
    return 'gemini';
  }

  if (process.env.OPENCODE) {
    debugLog('Detected OpenCode via OPENCODE environment variable');
    return 'opencode';
  }

  if (process.env.CURSOR) {
    debugLog('Detected Cursor via CURSOR environment variable');
    return 'cursor';
  }

  debugLog('No assistant detected via environment variables');

  // 2. Check directory presence (fallback)
  const cwd = process.cwd();
  debugLog(`Checking for assistant directories in: ${cwd}`);

  const assistantDirs = [
    { name: 'claude', dir: '.claude' },
    { name: 'gemini', dir: '.gemini' },
    { name: 'opencode', dir: '.opencode' },
    { name: 'cursor', dir: '.cursor' }
  ];

  for (const { name, dir } of assistantDirs) {
    const dirPath = path.join(cwd, dir);
    debugLog(`Checking for directory: ${dirPath}`);

    try {
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          debugLog(`Detected ${name} via ${dir}/ directory presence`);
          return name;
        } else {
          debugLog(`Path exists but is not a directory: ${dirPath}`);
        }
      } else {
        debugLog(`Directory does not exist: ${dirPath}`);
      }
    } catch (err) {
      // Handle filesystem errors gracefully (e.g., permission issues)
      debugLog(`Error checking ${dir}/: ${err.message}`);
    }
  }

  // 3. Default: unknown
  debugLog('No assistant detected via directory presence');
  debugLog('Returning default: unknown');
  return 'unknown';
}

// Main execution with error handling
try {
  const assistant = detectAssistant();
  console.log(assistant);
  process.exit(0);
} catch (error) {
  errorLog(`Failed to detect assistant: ${error.message}`);
  // Graceful degradation: output 'unknown' even on error
  console.log('unknown');
  process.exit(0); // Exit 0 for graceful degradation
}
