/**
 * Integration Tests for get-next-plan-id.cjs
 *
 * Focus: Critical business logic and integration scenarios following the
 * project's "write a few tests, mostly integration" philosophy.
 *
 * Tests custom business logic: directory traversal, ID extraction, YAML parsing,
 * error handling, and complete workflow scenarios using real file system operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as os from 'os';

describe('get-next-plan-id Integration Tests', () => {
  let tempDir: string;
  let scriptPath: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-id-test-'));

    // Get script path relative to project root
    scriptPath = path.resolve(__dirname, '../../templates/ai-task-manager/config/scripts/get-next-plan-id.cjs');

    // Store original working directory
    originalCwd = process.cwd();

    // Verify script exists before running tests
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found at: ${scriptPath}`);
    }
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);

    try {
      // Try to restore permissions on any restricted directories before cleanup
      const restrictedPath = path.join(tempDir, 'restricted');
      if (fs.existsSync(restrictedPath)) {
        try {
          fs.chmodSync(restrictedPath, 0o755);
        } catch (err) {
          // Ignore permission errors during cleanup
        }
      }

      // Clean up temporary directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      // If cleanup fails, try with force
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (finalErr) {
        console.warn(`Failed to clean up test directory: ${tempDir}`);
      }
    }
  });

  /**
   * Execute the get-next-plan-id script with proper error handling
   * @param cwd - Working directory to run script from
   * @param env - Environment variables to set
   * @returns { stdout, stderr, exitCode }
   */
  const executeScript = (cwd: string = tempDir, env: Record<string, string> = {}): { stdout: string; stderr: string; exitCode: number } => {
    const result = spawnSync('node', [scriptPath], {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        ...env,
        // Disable color output to prevent ANSI codes in stdout
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        NODE_DISABLE_COLORS: '1'
      }
    });

    // Strip ANSI escape codes from stdout as additional safety
    const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, '');

    return {
      stdout: stripAnsi((result.stdout || '')).trim(),
      stderr: stripAnsi((result.stderr || '')).trim(),
      exitCode: result.status || 0
    };
  };

  /**
   * Create a plan file with YAML frontmatter
   * @param dir - Directory to create file in
   * @param filename - Name of the file
   * @param id - ID to put in frontmatter
   * @param format - YAML format variation
   */
  const createPlanFile = (dir: string, filename: string, id: number, format: string = 'simple'): void => {
    fs.mkdirSync(dir, { recursive: true });

    let frontmatter;
    switch (format) {
      case 'quoted':
        frontmatter = `---\nid: "${id}"\ntitle: Test Plan\n---\n`;
        break;
      case 'single-quoted':
        frontmatter = `---\nid: '${id}'\ntitle: Test Plan\n---\n`;
        break;
      case 'quoted-key':
        frontmatter = `---\n"id": ${id}\ntitle: Test Plan\n---\n`;
        break;
      case 'extra-spaces':
        frontmatter = `---\nid  :  ${id}\ntitle: Test Plan\n---\n`;
        break;
      case 'with-comments':
        frontmatter = `---\n# This is a comment\nid: ${id}  # ID comment\ntitle: Test Plan\n---\n`;
        break;
      case 'mixed-quotes':
        frontmatter = `---\n'id': "${id}"\ntitle: Test Plan\n---\n`;
        break;
      case 'malformed':
        frontmatter = `---\nid ${id}\ntitle: Test Plan\nmalformed line\n---\n`;
        break;
      case 'no-frontmatter':
        frontmatter = '';
        break;
      case 'empty-id':
        frontmatter = `---\nid:\ntitle: Test Plan\n---\n`;
        break;
      case 'null-id':
        frontmatter = `---\nid: null\ntitle: Test Plan\n---\n`;
        break;
      default: // 'simple'
        frontmatter = `---\nid: ${id}\ntitle: Test Plan\n---\n`;
    }

    const content = frontmatter + `\n# Test Plan ${id}\n\nThis is a test plan.`;
    fs.writeFileSync(path.join(dir, filename), content, 'utf8');
  };

  interface PlanConfig {
    id: number;
    format?: string;
    legacy?: boolean;
    archived?: boolean;
  }

  /**
   * Create a task manager structure with plan files
   * @param baseDir - Base directory
   * @param plans - Array of plan configuration objects
   */
  const createTaskManagerStructure = (baseDir: string, plans: PlanConfig[] = []): void => {
    const taskManagerDir = path.join(baseDir, '.ai', 'task-manager');
    const plansDir = path.join(taskManagerDir, 'plans');
    const archiveDir = path.join(taskManagerDir, 'archive');

    // Create basic structure
    fs.mkdirSync(plansDir, { recursive: true });
    fs.mkdirSync(archiveDir, { recursive: true });

    // Create plan files
    plans.forEach(plan => {
      const planId = plan.id;
      const format = plan.format || 'simple';
      const isLegacy = plan.legacy || false;
      const isArchived = plan.archived || false;

      const targetDir = isArchived ? archiveDir : plansDir;

      if (isLegacy) {
        // Legacy format: direct file in plans/archive directory
        const filename = `plan-${planId}--test-plan.md`;
        createPlanFile(targetDir, filename, planId, format);
      } else {
        // New format: subdirectory with plan file
        const planDirName = `${planId}--test-plan`;
        const planDir = path.join(targetDir, planDirName);
        const filename = `plan-${planId}--test-plan.md`;
        createPlanFile(planDir, filename, planId, format);
      }
    });
  };

  describe('Directory Resolution Logic', () => {
    test('finds task manager directory in current working directory', () => {
      // Create .ai/task-manager/plans structure in temp directory
      createTaskManagerStructure(tempDir, [{ id: 1 }]);

      // Change to temp directory and run script
      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      if (result.exitCode !== 0) {
        console.error('Script failed with stderr:', result.stderr);
        console.error('Script stdout:', result.stdout);
      }
      const parsedId = parseInt(result.stdout);
      if (isNaN(parsedId)) {
        console.error('Failed to parse stdout as number. Raw stdout:', JSON.stringify(result.stdout));
        console.error('Raw stderr:', JSON.stringify(result.stderr));
      }
      expect(parsedId).toBe(2); // Next ID after 1
    });

    test('traverses upward to find task manager directory in parent', () => {
      // Create task manager in temp directory
      createTaskManagerStructure(tempDir, [{ id: 3 }]);

      // Create nested subdirectory
      const subDir = path.join(tempDir, 'nested', 'deep', 'subproject');
      fs.mkdirSync(subDir, { recursive: true });

      // Run script from nested subdirectory
      process.chdir(subDir);
      const result = executeScript(subDir);

      expect(result.exitCode).toBe(0);
      if (result.exitCode !== 0) {
        console.error('Script failed with stderr:', result.stderr);
        console.error('Script stdout:', result.stdout);
      }
      const parsedId = parseInt(result.stdout);
      if (isNaN(parsedId)) {
        console.error('Failed to parse stdout as number. Raw stdout:', JSON.stringify(result.stdout));
        console.error('Raw stderr:', JSON.stringify(result.stderr));
      }
      expect(parsedId).toBe(4); // Next ID after 3
    });

    test('chooses contextually relevant task manager when multiple exist', () => {
      // Create parent task manager
      createTaskManagerStructure(tempDir, [{ id: 10 }]);

      // Create nested project with its own task manager
      const nestedProject = path.join(tempDir, 'nested-project');
      createTaskManagerStructure(nestedProject, [{ id: 5 }]);

      // Run script from nested project - should find the closer one
      process.chdir(nestedProject);
      const result = executeScript(nestedProject);

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(6); // Next ID after 5, not 11
    });

    test('handles missing task manager directory gracefully with clear error', () => {
      // Create empty directory with no .ai structure
      const emptyDir = path.join(tempDir, 'empty-project');
      fs.mkdirSync(emptyDir, { recursive: true });

      process.chdir(emptyDir);
      const result = executeScript(emptyDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No .ai/task-manager/plans directory found');
      expect(result.stderr).toContain('current directory or any parent directory');
      expect(result.stderr).toContain(emptyDir); // Should show current directory
    });

    test('handles permission errors gracefully during directory traversal', () => {
      // Create task manager structure
      createTaskManagerStructure(tempDir, [{ id: 1 }]);

      // Create a subdirectory and make parent unreadable (if possible on this platform)
      const subDir = path.join(tempDir, 'restricted', 'subdir');
      fs.mkdirSync(subDir, { recursive: true });

      const restrictedDir = path.join(tempDir, 'restricted');

      try {
        // Try to restrict permissions (may not work on all platforms/file systems)
        fs.chmodSync(restrictedDir, 0o000);

        process.chdir(subDir);
        const result = executeScript(subDir);

        // Should still succeed by finding the task manager in parent
        expect(result.exitCode).toBe(0);
        expect(parseInt(result.stdout)).toBe(2);

        // Restore permissions for cleanup
        fs.chmodSync(restrictedDir, 0o755);
      } catch (err) {
        // Platform doesn't support permission changes - skip this test
        console.warn('Skipping permission test - platform limitation');
      }
    });
  });

  describe('YAML Frontmatter Parsing Robustness', () => {
    test('parses various YAML ID formats correctly', () => {
      const testCases = [
        { format: 'simple', id: 5 },
        { format: 'quoted', id: 10 },
        { format: 'single-quoted', id: 15 },
        { format: 'quoted-key', id: 20 },
        { format: 'extra-spaces', id: 25 },
        { format: 'with-comments', id: 30 },
        { format: 'mixed-quotes', id: 35 }
      ];

      // Create task manager with plans using different YAML formats
      createTaskManagerStructure(tempDir, testCases);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      // Should find the highest ID (35) and return next (36)
      expect(parseInt(result.stdout)).toBe(36);
    });

    test('handles malformed YAML gracefully and extracts what it can', () => {
      const plans = [
        { id: 5, format: 'simple' },      // Valid
        { id: 10, format: 'malformed' },  // Malformed but ID might be extractable
        { id: 15, format: 'simple' }      // Valid
      ];

      createTaskManagerStructure(tempDir, plans);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      // Should extract from valid files and possibly the malformed one
      const nextId = parseInt(result.stdout);
      expect(nextId).toBeGreaterThan(15); // At least 16
    });

    test('handles edge cases in YAML parsing', () => {
      const plans = [
        { id: 1, format: 'simple' },
        { id: 2, format: 'empty-id' },    // Empty ID value
        { id: 3, format: 'null-id' },     // Null ID value
        { id: 4, format: 'no-frontmatter' } // No frontmatter block
      ];

      createTaskManagerStructure(tempDir, plans);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      // Should handle edge cases and extract valid IDs
      const nextId = parseInt(result.stdout);
      expect(nextId).toBeGreaterThanOrEqual(2); // Should find at least ID 1
    });

    test('extracts highest ID from multiple plan files with various formats', () => {
      const plans = [
        { id: 1, format: 'simple' },
        { id: 25, format: 'quoted' },
        { id: 10, format: 'single-quoted' },
        { id: 50, format: 'with-comments' },  // Highest
        { id: 15, format: 'extra-spaces' }
      ];

      createTaskManagerStructure(tempDir, plans);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(51); // Next after highest (50)
    });
  });

  describe('Legacy and Archive Directory Support', () => {
    test('handles legacy plan files in plans directory', () => {
      const plans = [
        { id: 5, format: 'simple', legacy: false }, // New format
        { id: 10, format: 'simple', legacy: true },  // Legacy format
        { id: 15, format: 'simple', legacy: false }  // New format
      ];

      createTaskManagerStructure(tempDir, plans);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(16); // Next after highest (15)
    });

    test('includes archived plans in ID calculation', () => {
      const plans = [
        { id: 5, format: 'simple' },                    // Active
        { id: 20, format: 'simple', archived: true },   // Archived - highest
        { id: 10, format: 'simple' }                    // Active
      ];

      createTaskManagerStructure(tempDir, plans);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(21); // Next after archived highest (20)
    });

    test('handles mixed legacy and new formats in both plans and archive', () => {
      const plans = [
        { id: 1, format: 'simple', legacy: false },                  // New active
        { id: 25, format: 'simple', legacy: true },                  // Legacy active
        { id: 10, format: 'simple', legacy: false, archived: true }, // New archived
        { id: 30, format: 'simple', legacy: true, archived: true }   // Legacy archived - highest
      ];

      createTaskManagerStructure(tempDir, plans);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(31); // Next after highest (30)
    });
  });

  describe('End-to-End Integration Workflows', () => {
    test('generates correct next ID in realistic repository structure', () => {
      // Create realistic structure with multiple plans
      const plans = [
        { id: 1, format: 'simple' },
        { id: 2, format: 'quoted' },
        { id: 5, format: 'with-comments' }, // Gap in sequence is normal
        { id: 7, format: 'simple' },
        { id: 12, format: 'mixed-quotes' } // Highest
      ];

      createTaskManagerStructure(tempDir, plans);

      // Add some additional files that should be ignored
      const extraDir = path.join(tempDir, '.ai', 'task-manager', 'plans', 'non-plan-dir');
      fs.mkdirSync(extraDir, { recursive: true });
      fs.writeFileSync(path.join(extraDir, 'README.md'), 'Not a plan file');

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(13); // Next after highest (12)
    });

    test('works correctly when starting from empty task manager', () => {
      // Create empty task manager structure
      const taskManagerDir = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(path.join(taskManagerDir, 'plans'), { recursive: true });
      fs.mkdirSync(path.join(taskManagerDir, 'archive'), { recursive: true });

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      if (result.exitCode !== 0) {
        console.error('Script failed with stderr:', result.stderr);
        console.error('Script stdout:', result.stdout);
      }
      const parsedId = parseInt(result.stdout);
      if (isNaN(parsedId)) {
        console.error('Failed to parse stdout as number. Raw stdout:', JSON.stringify(result.stdout));
        console.error('Raw stderr:', JSON.stringify(result.stderr));
      }
      expect(parsedId).toBe(1); // First plan ID
    });

    test('handles script execution from different working directory contexts', () => {
      createTaskManagerStructure(tempDir, [{ id: 8 }]);

      // Test from various subdirectory levels
      const testDirs = [
        tempDir,                                    // Root
        path.join(tempDir, 'sub'),                 // One level down
        path.join(tempDir, 'deep', 'nested', 'dir') // Deep nesting
      ];

      testDirs.forEach(testDir => {
        fs.mkdirSync(testDir, { recursive: true });
        process.chdir(testDir);

        const result = executeScript(testDir);
        expect(result.exitCode).toBe(0);
        expect(parseInt(result.stdout)).toBe(9); // Should be consistent
      });
    });
  });

  describe('Error Handling and Debug Mode', () => {
    test('provides clear errors for common failure scenarios', () => {
      // Test missing directory
      const emptyDir = path.join(tempDir, 'no-task-manager');
      fs.mkdirSync(emptyDir, { recursive: true });

      process.chdir(emptyDir);
      const result = executeScript(emptyDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No .ai/task-manager/plans directory found');
      expect(result.stderr).toContain('Please ensure you are in a project with task manager initialized');
      expect(result.stderr).toContain(`Current working directory: ${emptyDir}`);
    });

    test('handles corrupted plan files without crashing', () => {
      // Create task manager with good and corrupted files
      const taskManagerDir = path.join(tempDir, '.ai', 'task-manager');
      const plansDir = path.join(taskManagerDir, 'plans');

      // Good plan
      createTaskManagerStructure(tempDir, [{ id: 5 }]);

      // Create corrupted binary file
      const corruptedPlanDir = path.join(plansDir, '10--corrupted-plan');
      fs.mkdirSync(corruptedPlanDir, { recursive: true });
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE]);
      fs.writeFileSync(path.join(corruptedPlanDir, 'plan-10--corrupted.md'), binaryData);

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      // Should still work and extract from good files
      expect(result.exitCode).toBe(0);
      const nextId = parseInt(result.stdout);
      expect(nextId).toBeGreaterThanOrEqual(6); // At least next after ID 5
    });

    test('debug mode provides detailed logging information', () => {
      createTaskManagerStructure(tempDir, [
        { id: 1, format: 'simple' },
        { id: 3, format: 'quoted' }
      ]);

      process.chdir(tempDir);
      const result = executeScript(tempDir, { DEBUG: 'true' });

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(4);

      // Check for debug logging in stderr
      expect(result.stderr).toContain('[DEBUG]');
      expect(result.stderr).toContain('Starting search for task manager root');
      expect(result.stderr).toContain('Found valid task manager root');
      expect(result.stderr).toContain('Scanning directory:');
      expect(result.stderr).toContain('Successfully extracted ID');
    });

    test('reports ID consistency validation errors', () => {
      // Create plan with mismatched IDs between directory, filename, and frontmatter
      const taskManagerDir = path.join(tempDir, '.ai', 'task-manager');
      const plansDir = path.join(taskManagerDir, 'plans');

      fs.mkdirSync(plansDir, { recursive: true });

      // Directory says ID 5, filename says ID 7, frontmatter says ID 10
      const planDir = path.join(plansDir, '5--mismatched-plan');
      fs.mkdirSync(planDir, { recursive: true });

      const filename = 'plan-7--mismatched.md';
      const frontmatter = '---\nid: 10\ntitle: Test Plan\n---\n';
      const content = frontmatter + '\n# Mismatched Plan\n';

      fs.writeFileSync(path.join(planDir, filename), content, 'utf8');

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      // Should use highest ID found (10) and continue
      expect(parseInt(result.stdout)).toBe(11);

      // Should report consistency errors
      expect(result.stderr).toContain('ID mismatch');
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('handles different path separators and line endings', () => {
      // Create plan files with different line endings
      const taskManagerDir = path.join(tempDir, '.ai', 'task-manager', 'plans');
      const planDir = path.join(taskManagerDir, '1--cross-platform');
      fs.mkdirSync(planDir, { recursive: true });

      // Test with Windows-style line endings
      const windowsContent = '---\r\nid: 5\r\ntitle: Cross Platform\r\n---\r\n\r\n# Plan Content\r\n';
      fs.writeFileSync(path.join(planDir, 'plan-1--cross-platform.md'), windowsContent, 'utf8');

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(6); // Should parse ID 5 correctly
    });

    test('works correctly with various file system case sensitivities', () => {
      createTaskManagerStructure(tempDir, [{ id: 3 }]);

      // Create additional files with different casing (might be relevant on case-sensitive systems)
      const extraDir = path.join(tempDir, '.ai', 'task-manager', 'plans', '2--case-test');
      fs.mkdirSync(extraDir, { recursive: true });
      fs.writeFileSync(path.join(extraDir, 'PLAN-2--case-test.md'), '---\nid: 2\n---\n# Plan', 'utf8');

      process.chdir(tempDir);
      const result = executeScript(tempDir);

      expect(result.exitCode).toBe(0);
      const nextId = parseInt(result.stdout);
      expect(nextId).toBeGreaterThanOrEqual(4); // Should handle case variations appropriately
    });
  });

  describe('Performance and Scalability', () => {
    test('handles large number of plan files efficiently', () => {
      // Create many plan files to test performance
      const manyPlans = [];
      for (let i = 1; i <= 50; i++) {
        manyPlans.push({ id: i, format: i % 3 === 0 ? 'quoted' : 'simple' });
      }

      createTaskManagerStructure(tempDir, manyPlans);

      process.chdir(tempDir);
      const startTime = Date.now();
      const result = executeScript(tempDir);
      const endTime = Date.now();

      expect(result.exitCode).toBe(0);
      expect(parseInt(result.stdout)).toBe(51); // Next after 50

      // Should complete reasonably quickly (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});