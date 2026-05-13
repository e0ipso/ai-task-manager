/**
 * Unit Tests for script files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const getNextPlanIdScript = require('../../templates/ai-task-manager/config/scripts/get-next-plan-id.cjs');
const getNextTaskIdScript = require('../../templates/ai-task-manager/config/scripts/get-next-task-id.cjs');
const checkTaskDepsScript = require('../../templates/ai-task-manager/config/scripts/check-task-dependencies.cjs');
const validateBlueprintScript = require('../../templates/ai-task-manager/config/scripts/validate-plan-blueprint.cjs');

/** Build a minimal plan HTML document. */
function planHtml(id: number, created = '2026-01-08'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Plan ${id}</title>
  <meta name="id" content="${id}">
  <meta name="created" content="${created}">
</head>
<body><article><h1>Test Plan</h1></article></body>
</html>`;
}

/** Build a minimal task HTML document. */
function taskHtml(id: number, status = 'pending', dependencies = '', skills = 'test'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Task ${id}</title>
  <meta name="id" content="${id}">
  <meta name="group" content="test">
  <meta name="dependencies" content="${dependencies}">
  <meta name="status" content="${status}">
  <meta name="created" content="2026-01-08">
  <meta name="skills" content="${skills}">
</head>
<body><article><h1>Task ${id}</h1></article></body>
</html>`;
}

describe('Script Unit Tests', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scripts-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('get-next-plan-id.cjs', () => {
    it('should return 1 for empty task manager', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(path.join(tmRoot, 'plans'), { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      expect(getNextPlanIdScript._getNextPlanId()).toBe(1);
    });

    it('should return next ID based on existing plans', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '05--test');
      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(path.join(planDir, 'plan-05--test.html'), planHtml(5));

      expect(getNextPlanIdScript._getNextPlanId()).toBe(6);
    });
  });

  describe('get-next-task-id.cjs', () => {
    it('should support plan ID or absolute path', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '01--test');
      const planFile = path.join(planDir, 'plan-01--test.html');
      const tasksDir = path.join(planDir, 'tasks');

      fs.mkdirSync(tasksDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(planFile, planHtml(1));

      // Test with ID
      expect(getNextTaskIdScript._getNextTaskId('1')).toBe(1);

      // Test with absolute path
      expect(getNextTaskIdScript._getNextTaskId(planFile)).toBe(1);

      // Add a task
      fs.writeFileSync(path.join(tasksDir, '01--task.html'), taskHtml(1));
      expect(getNextTaskIdScript._getNextTaskId('1')).toBe(2);
    });
  });

  describe('validate-plan-blueprint.cjs', () => {
    it('should extract blueprint data from absolute path', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '01--test');
      const planFile = path.join(planDir, 'plan-01--test.html');

      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(planFile, planHtml(1));

      // We need to capture stdout
      let output = '';
      const logSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation((str: string | Uint8Array) => {
          output += str.toString();
          return true;
        });

      try {
        validateBlueprintScript._validatePlanBlueprint(planFile, 'planId');
        expect(output.trim()).toBe('1');
      } finally {
        logSpy.mockRestore();
      }
    });
  });

  describe('check-task-dependencies.cjs', () => {
    it('should successfully resolve plan and check deps', async () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '01--test');
      const tasksDir = path.join(planDir, 'tasks');

      fs.mkdirSync(tasksDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      // Create plan file
      const planFile = path.join(planDir, 'plan-01--test.html');
      fs.writeFileSync(planFile, planHtml(1));

      // Create a task with no deps
      const taskFile = path.join(tasksDir, '01--task.html');
      fs.writeFileSync(taskFile, taskHtml(1));

      // We need to mock process.exit to test the main function
      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((code?: string | number | null | undefined) => {
          throw new Error(`Process exited with code ${code}`);
        });

      // Override process.argv for the test
      const originalArgv = process.argv;
      process.argv = ['node', 'check-task-dependencies.cjs', '1', '1'];

      try {
        await checkTaskDepsScript._main(tempDir);
      } catch (e: unknown) {
        expect((e as Error).message).toContain('Process exited with code 0');
      } finally {
        process.argv = originalArgv;
        exitSpy.mockRestore();
      }
    });
  });
});
