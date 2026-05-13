/**
 * Tests for Claude Exec Command Module
 * Tests validation, remediation batching, and sequential execution logic.
 */

// Mock chalk before imports
jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    green: Object.assign(
      jest.fn((str: string) => str),
      { bold: jest.fn((str: string) => str) }
    ),
    blue: jest.fn((str: string) => str),
    yellow: jest.fn((str: string) => str),
    gray: jest.fn((str: string) => str),
    red: jest.fn((str: string) => str),
    white: jest.fn((str: string) => str),
    bold: jest.fn((str: string) => str),
    cyan: Object.assign(
      jest.fn((str: string) => str),
      { bold: jest.fn((str: string) => str) }
    ),
  },
}));

// Mock child_process.spawn so tests don't invoke the real claude CLI
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { claudeExec } from '../exec';

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

type SpawnSideEffect = (args: {
  command: string;
  args: readonly string[];
  prompt: string;
}) => void | Promise<void>;

interface FakeChildOptions {
  exitCode?: number;
  sideEffect?: SpawnSideEffect;
  emitError?: NodeJS.ErrnoException;
}

/**
 * Create a minimal ChildProcess-like EventEmitter with stdout/stderr streams.
 * Emits close (or error) asynchronously, optionally running a side effect first.
 */
function createFakeChild(
  command: string,
  args: readonly string[],
  options: FakeChildOptions
): EventEmitter {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter & { setEncoding: jest.Mock };
    stderr: EventEmitter & { setEncoding: jest.Mock };
  };
  const stdout = Object.assign(new EventEmitter(), { setEncoding: jest.fn() });
  const stderr = Object.assign(new EventEmitter(), { setEncoding: jest.fn() });
  child.stdout = stdout;
  child.stderr = stderr;

  const promptIdx = args.indexOf('-p');
  const prompt = promptIdx >= 0 ? args[promptIdx + 1] ?? '' : '';

  // Run side effects and emit close/error asynchronously so the caller can
  // attach listeners first.
  setImmediate(async () => {
    if (options.emitError) {
      child.emit('error', options.emitError);
      return;
    }
    try {
      if (options.sideEffect) {
        await options.sideEffect({ command, args, prompt });
      }
    } catch (err) {
      child.emit('error', err);
      return;
    }
    child.emit('close', options.exitCode ?? 0, null);
  });

  return child;
}

describe('Claude Exec Command', () => {
  const testDir = path.join(__dirname, 'test-exec');
  const plansDir = path.join(testDir, '.ai/task-manager/plans');
  const archiveDir = path.join(testDir, '.ai/task-manager/archive');
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    await fs.ensureDir(plansDir);
    await fs.ensureDir(archiveDir);
    process.chdir(testDir);

    // Default mock: successful exit with no side effects
    mockSpawn.mockImplementation(((command: string, args: readonly string[]) =>
      createFakeChild(command, args, { exitCode: 0 })) as unknown as typeof spawn);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    await fs.remove(testDir);
    jest.clearAllMocks();
  });

  async function createTestPlan(
    id: number,
    title: string,
    options: { archived?: boolean; taskCount?: number; hasBlueprint?: boolean } = {}
  ) {
    const { archived = false, taskCount = 0, hasBlueprint = false } = options;
    const planDirName = `${id.toString().padStart(2, '0')}--${title.toLowerCase().replace(/\s+/g, '-')}`;
    const planDir = path.join(archived ? archiveDir : plansDir, planDirName);
    await fs.ensureDir(planDir);

    const blueprintMarkup = hasBlueprint
      ? '\n      <section aria-labelledby="execution-blueprint"><h2 id="execution-blueprint">Execution Blueprint</h2><p>Phases defined here.</p></section>\n'
      : '';

    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Plan: ${title}</title>
  <meta name="id" content="${id}">
  <meta name="summary" content="${title}">
  <meta name="created" content="2025-10-16">
</head>
<body>
  <article>
    <header><h1>Plan: ${title}</h1></header>${blueprintMarkup}
  </article>
</body>
</html>
`;

    await fs.writeFile(path.join(planDir, `plan-${planDirName}.html`), content, 'utf-8');

    if (taskCount > 0) {
      const tasksDir = path.join(planDir, 'tasks');
      await fs.ensureDir(tasksDir);
      for (let i = 1; i <= taskCount; i++) {
        const taskContent = renderTaskHtml(i, 'test', 'pending', ['test']);
        await fs.writeFile(
          path.join(tasksDir, `${i.toString().padStart(2, '0')}--task-${i}.html`),
          taskContent,
          'utf-8'
        );
      }
    }
  }

  function renderTaskHtml(
    id: number,
    group: string,
    status: string,
    skills: string[]
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Task ${id}</title>
  <meta name="id" content="${id}">
  <meta name="group" content="${group}">
  <meta name="dependencies" content="">
  <meta name="status" content="${status}">
  <meta name="created" content="2025-10-16">
  <meta name="skills" content="${skills.join(',')}">
</head>
<body>
  <article><header><h1>Task ${id}</h1></header></article>
</body>
</html>
`;
  }

  describe('Input validation', () => {
    it('should fail when no plan IDs are provided', async () => {
      const result = await claudeExec([]);
      expect(result.success).toBe(false);
      expect(result.message).toBe('No plan IDs provided.');
    });
  });

  describe('Phase 1: Validation', () => {
    it('should fail for non-existent plan', async () => {
      const result = await claudeExec([999]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Plan 999 not found');
    });

    it('should fail for archived plan', async () => {
      await createTestPlan(1, 'archived-plan', { archived: true });
      const result = await claudeExec([1]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('archived');
    });

    it('should identify plan as ready when it has tasks and blueprint', async () => {
      await createTestPlan(1, 'ready-plan', { taskCount: 2, hasBlueprint: true });
      const result = await claudeExec([1]);
      expect(result.success).toBe(true);
      // Only execute-blueprint, no remediation
      expect(mockSpawn).toHaveBeenCalledTimes(1);
      const call = mockSpawn.mock.calls[0];
      expect(call).toBeDefined();
      const cmd = call![0];
      const spawnArgs = call![1] as readonly string[];
      expect(cmd).toBe('claude');
      expect(spawnArgs).toContain('-p');
      expect(spawnArgs).toContain('/tasks:execute-blueprint 1');
      expect(spawnArgs).toContain('--dangerously-skip-permissions');
      expect(spawnArgs).toContain('--output-format');
      expect(spawnArgs).toContain('stream-json');
    });
  });

  describe('Phase 2: Remediation batching', () => {
    it('should remediate plans needing tasks', async () => {
      await createTestPlan(1, 'needs-tasks', { taskCount: 0, hasBlueprint: true });

      mockSpawn.mockImplementation(((command: string, args: readonly string[]) =>
        createFakeChild(command, args, {
          exitCode: 0,
          sideEffect: async ({ prompt }) => {
            if (prompt.startsWith('/tasks:generate-tasks')) {
              const planDir = path.join(plansDir, '01--needs-tasks');
              const tasksDir = path.join(planDir, 'tasks');
              await fs.ensureDir(tasksDir);
              await fs.writeFile(
                path.join(tasksDir, '01--task-1.html'),
                renderTaskHtml(1, 'test', 'pending', ['test']),
                'utf-8'
              );
            }
          },
        })) as unknown as typeof spawn);

      const result = await claudeExec([1]);
      expect(result.success).toBe(true);
    });

    it('should process remediation in parallel batches of 3', async () => {
      for (let i = 1; i <= 5; i++) {
        await createTestPlan(i, `plan-${i}`, { taskCount: 0, hasBlueprint: false });
      }

      mockSpawn.mockImplementation(((command: string, args: readonly string[]) =>
        createFakeChild(command, args, {
          exitCode: 0,
          sideEffect: async ({ prompt }) => {
            const match = prompt.match(/\s(\d+)$/);
            if (!match || !match[1]) return;
            const planId = parseInt(match[1], 10);
            const planDirName = `${planId.toString().padStart(2, '0')}--plan-${planId}`;
            const planDir = path.join(plansDir, planDirName);

            if (prompt.startsWith('/tasks:generate-tasks')) {
              const tasksDir = path.join(planDir, 'tasks');
              await fs.ensureDir(tasksDir);
              await fs.writeFile(
                path.join(tasksDir, '01--task-1.html'),
                renderTaskHtml(1, 'test', 'pending', ['test']),
                'utf-8'
              );
              const planFile = path.join(planDir, `plan-${planDirName}.html`);
              const content = await fs.readFile(planFile, 'utf-8');
              if (!/id\s*=\s*["']execution-blueprint["']/i.test(content)) {
                const blueprintFragment =
                  '<section aria-labelledby="execution-blueprint"><h2 id="execution-blueprint">Execution Blueprint</h2><p>Phases.</p></section>';
                const updated = content.replace(
                  /<\/article>/i,
                  `${blueprintFragment}</article>`
                );
                await fs.writeFile(planFile, updated, 'utf-8');
              }
            }
          },
        })) as unknown as typeof spawn);

      const result = await claudeExec([1, 2, 3, 4, 5]);
      expect(result.success).toBe(true);
      // 5 remediation calls + 5 execution calls = 10 total
      expect(mockSpawn).toHaveBeenCalledTimes(10);
    });

    it('should fail if remediation leaves plan without tasks', async () => {
      await createTestPlan(1, 'broken-plan', { taskCount: 0, hasBlueprint: false });

      // Default mock does nothing (no tasks created)
      const result = await claudeExec([1]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('still has no tasks after remediation');
    });

    it('should fail if remediation leaves plan without blueprint', async () => {
      await createTestPlan(1, 'no-blueprint', { taskCount: 0, hasBlueprint: false });

      mockSpawn.mockImplementation(((command: string, args: readonly string[]) =>
        createFakeChild(command, args, {
          exitCode: 0,
          sideEffect: async ({ prompt }) => {
            if (prompt.startsWith('/tasks:generate-tasks')) {
              const planDir = path.join(plansDir, '01--no-blueprint');
              const tasksDir = path.join(planDir, 'tasks');
              await fs.ensureDir(tasksDir);
              await fs.writeFile(
                path.join(tasksDir, '01--task-1.html'),
                renderTaskHtml(1, 'test', 'pending', ['test']),
                'utf-8'
              );
            }
          },
        })) as unknown as typeof spawn);

      const result = await claudeExec([1]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('still missing Execution Blueprint');
    });
  });

  describe('Phase 3: Sequential execution', () => {
    it('should execute plans sequentially', async () => {
      await createTestPlan(1, 'plan-a', { taskCount: 2, hasBlueprint: true });
      await createTestPlan(2, 'plan-b', { taskCount: 1, hasBlueprint: true });

      const executionOrder: string[] = [];
      mockSpawn.mockImplementation(((command: string, args: readonly string[]) =>
        createFakeChild(command, args, {
          exitCode: 0,
          sideEffect: ({ prompt }) => {
            executionOrder.push(prompt);
          },
        })) as unknown as typeof spawn);

      const result = await claudeExec([1, 2]);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ planIds: [1, 2] });
      expect(executionOrder).toEqual(['/tasks:execute-blueprint 1', '/tasks:execute-blueprint 2']);
    });

    it('should stop on execution failure', async () => {
      await createTestPlan(1, 'fail-plan', { taskCount: 1, hasBlueprint: true });
      await createTestPlan(2, 'never-run', { taskCount: 1, hasBlueprint: true });

      mockSpawn.mockImplementation(((command: string, args: readonly string[]) =>
        createFakeChild(command, args, { exitCode: 1 })) as unknown as typeof spawn);

      const result = await claudeExec([1, 2]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Execution failed for plan 1');
      expect(mockSpawn).toHaveBeenCalledTimes(1);
    });

    it('should surface a helpful error when the claude CLI is not installed', async () => {
      await createTestPlan(1, 'ready-plan', { taskCount: 1, hasBlueprint: true });

      const enoent: NodeJS.ErrnoException = Object.assign(new Error('spawn claude ENOENT'), {
        code: 'ENOENT',
      });
      mockSpawn.mockImplementation(((command: string, args: readonly string[]) =>
        createFakeChild(command, args, { emitError: enoent })) as unknown as typeof spawn);

      const result = await claudeExec([1]);
      expect(result.success).toBe(false);
      expect(result.message).toContain("'claude' CLI");
      expect(result.message).toContain('not found');
    });
  });
});
