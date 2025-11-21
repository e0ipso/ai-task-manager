import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

describe('validate-plan-blueprint.cjs - flexible ID matching', () => {
  let testDir: string;
  let scriptPath: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = path.join(tmpdir(), `test-validate-${Date.now()}`);
    fs.mkdirpSync(testDir);

    // Copy the script from templates to the test directory
    const sourceScriptPath = path.join(__dirname, '../../templates/ai-task-manager/config/scripts/validate-plan-blueprint.cjs');
    const targetScriptDir = path.join(testDir, '.ai/task-manager/config/scripts');
    fs.mkdirpSync(targetScriptDir);
    scriptPath = path.join(targetScriptDir, 'validate-plan-blueprint.cjs');
    fs.copyFileSync(sourceScriptPath, scriptPath);
  });

  afterEach(() => {
    // Cleanup
    fs.removeSync(testDir);
  });

  /**
   * Helper function to create a plan fixture
   */
  function createPlanFixture(planId: string, planName: string, hasTasks = false, hasBlueprint = false) {
    const planDir = path.join(testDir, '.ai/task-manager/plans', `${planId}--${planName}`);
    fs.mkdirpSync(planDir);

    const planFile = path.join(planDir, `plan-${planId}--${planName}.md`);
    let content = `---\nid: ${parseInt(planId, 10)}\n---\n\n# Plan ${planName}\n`;

    if (hasBlueprint) {
      content += '\n## Execution Blueprint\n\nPhases defined here...\n';
    }

    fs.writeFileSync(planFile, content);

    if (hasTasks) {
      const tasksDir = path.join(planDir, 'tasks');
      fs.mkdirpSync(tasksDir);
      fs.writeFileSync(path.join(tasksDir, '01--task.md'), '# Task 1');
    }

    return { planDir, planFile };
  }

  /**
   * Helper function to run the validation script
   */
  function runScript(planId: string, field?: string): { stdout: string; stderr: string; exitCode: number } {
    try {
      const cmd = field
        ? `node "${scriptPath}" ${planId} ${field}`
        : `node "${scriptPath}" ${planId}`;

      const stdout = execSync(cmd, { cwd: testDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || '',
        exitCode: error.status || 1
      };
    }
  }

  describe('flexible ID matching', () => {
    test('accepts non-padded ID "2" for zero-padded directory "02--name"', () => {
      createPlanFixture('02', 'test-plan', true, true);
      const result = runScript('2', 'planFile');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('02--test-plan');
      expect(result.stdout).toContain('plan-02--test-plan.md');
    });

    test('accepts padded ID "02" for zero-padded directory "02--name"', () => {
      createPlanFixture('02', 'test-plan', true, true);
      const result = runScript('02', 'planFile');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('02--test-plan');
      expect(result.stdout).toContain('plan-02--test-plan.md');
    });

    test('accepts non-padded ID "54" for non-padded directory "54--name"', () => {
      createPlanFixture('54', 'test-plan', true, true);
      const result = runScript('54', 'planFile');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('54--test-plan');
      expect(result.stdout).toContain('plan-54--test-plan.md');
    });

    test('accepts padded ID "054" for non-padded directory "54--name"', () => {
      createPlanFixture('54', 'test-plan', true, true);
      const result = runScript('054', 'planFile');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('54--test-plan');
      expect(result.stdout).toContain('plan-54--test-plan.md');
    });
  });

  describe('error handling', () => {
    test('rejects invalid non-numeric ID "abc" with error', () => {
      createPlanFixture('02', 'test-plan', true, true);
      const result = runScript('abc', 'planFile');

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid plan ID');
    });

    test('provides helpful error message when plan not found', () => {
      createPlanFixture('05', 'existing-plan', true, true);
      const result = runScript('99', 'planFile');

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Plan ID 99 not found');
      expect(result.stderr).toContain('Available plans:');
      expect(result.stderr).toContain('05--existing-plan');
    });
  });

  describe('field outputs', () => {
    test('outputs correct values for all field types', () => {
      createPlanFixture('05', 'multi-field-test', true, true);

      // Test planFile field
      const planFileResult = runScript('5', 'planFile');
      expect(planFileResult.exitCode).toBe(0);
      expect(planFileResult.stdout).toContain('plan-05--multi-field-test.md');

      // Test planDir field
      const planDirResult = runScript('5', 'planDir');
      expect(planDirResult.exitCode).toBe(0);
      expect(planDirResult.stdout).toContain('05--multi-field-test');

      // Test taskCount field
      const taskCountResult = runScript('5', 'taskCount');
      expect(taskCountResult.exitCode).toBe(0);
      expect(taskCountResult.stdout.trim()).toBe('1');

      // Test blueprintExists field
      const blueprintResult = runScript('5', 'blueprintExists');
      expect(blueprintResult.exitCode).toBe(0);
      expect(blueprintResult.stdout.trim()).toBe('yes');
    });

    test('outputs "0" for taskCount when no tasks exist', () => {
      createPlanFixture('10', 'no-tasks', false, true);

      const result = runScript('10', 'taskCount');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('0');
    });

    test('outputs "no" for blueprintExists when blueprint missing', () => {
      createPlanFixture('15', 'no-blueprint', true, false);

      const result = runScript('15', 'blueprintExists');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('no');
    });
  });

  describe('JSON output mode', () => {
    test('outputs valid JSON when no field specified', () => {
      createPlanFixture('20', 'json-test', true, true);

      const result = runScript('20');
      expect(result.exitCode).toBe(0);

      const json = JSON.parse(result.stdout);
      expect(json).toHaveProperty('planFile');
      expect(json).toHaveProperty('planDir');
      expect(json).toHaveProperty('taskCount');
      expect(json).toHaveProperty('blueprintExists');
      expect(json.planFile).toContain('plan-20--json-test.md');
      expect(json.planDir).toContain('20--json-test');
      expect(json.taskCount).toBe(1);
      expect(json.blueprintExists).toBe('yes');
    });
  });

  describe('backward compatibility', () => {
    test('still works with explicitly padded IDs (existing behavior)', () => {
      createPlanFixture('03', 'backward-compat', true, true);

      const result = runScript('03', 'planFile');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('plan-03--backward-compat.md');
    });

    test('handles three-digit padding correctly', () => {
      createPlanFixture('007', 'bond', true, true);

      // Test with various padding levels
      const result1 = runScript('7', 'planFile');
      expect(result1.exitCode).toBe(0);
      expect(result1.stdout).toContain('plan-007--bond.md');

      const result2 = runScript('07', 'planFile');
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain('plan-007--bond.md');

      const result3 = runScript('007', 'planFile');
      expect(result3.exitCode).toBe(0);
      expect(result3.stdout).toContain('plan-007--bond.md');
    });
  });
});
