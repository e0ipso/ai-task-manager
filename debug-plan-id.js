#!/usr/bin/env node

// Debug script to help diagnose plan ID detection issues

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== Plan ID Debug Script ===');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', os.platform());
console.log('Temp dir base:', os.tmpdir());

// Create a test scenario similar to the failing tests
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debug-plan-id-'));
console.log('Created temp directory:', tempDir);

try {
  // Create basic task manager structure
  const taskManagerDir = path.join(tempDir, '.ai', 'task-manager');
  const plansDir = path.join(taskManagerDir, 'plans');
  fs.mkdirSync(plansDir, { recursive: true });

  // Create a test plan
  const planDirName = '01--test-plan';
  const planDir = path.join(plansDir, planDirName);
  fs.mkdirSync(planDir, { recursive: true });

  const planContent = `---
id: 1
summary: "Test plan for debugging"
created: 2025-09-26
---

# Test Plan

This is a test plan for debugging.
`;

  const planFile = path.join(planDir, 'plan-01--test-plan.md');
  fs.writeFileSync(planFile, planContent, 'utf8');

  console.log('Created test structure:');
  console.log('- Plans dir:', plansDir);
  console.log('- Plan dir:', planDir);
  console.log('- Plan file:', planFile);
  console.log('- Plan file exists:', fs.existsSync(planFile));
  console.log('- Plan file size:', fs.statSync(planFile).size, 'bytes');

  // Run the script
  const scriptPath = path.resolve(__dirname, 'templates/ai-task-manager/config/scripts/get-next-plan-id.cjs');
  console.log('Script path:', scriptPath);
  console.log('Script exists:', fs.existsSync(scriptPath));

  console.log('\n=== Running script ===');
  const result = spawnSync('node', [scriptPath], {
    cwd: tempDir,
    encoding: 'utf8',
    env: { ...process.env, DEBUG: 'true' }
  });

  console.log('Exit code:', result.status);
  console.log('Stdout length:', (result.stdout || '').length);
  console.log('Stderr length:', (result.stderr || '').length);
  console.log('Raw stdout:', JSON.stringify(result.stdout));
  console.log('Raw stderr:', JSON.stringify(result.stderr));

  if (result.stdout) {
    const trimmed = result.stdout.trim();
    console.log('Trimmed stdout:', JSON.stringify(trimmed));
    const parsed = parseInt(trimmed);
    console.log('Parsed as int:', parsed);
    console.log('Is NaN:', isNaN(parsed));
  }

} catch (error) {
  console.error('Error during test:', error);
} finally {
  // Cleanup
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('\nCleaned up temp directory');
  } catch (err) {
    console.warn('Failed to clean up:', err.message);
  }
}