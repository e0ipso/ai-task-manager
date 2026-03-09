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

// Mock the Claude Agent SDK
jest.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: jest.fn(),
}));

import * as fs from 'fs-extra';
import * as path from 'path';
import { claudeExec } from '../exec';

// Access the mocked module
const mockQuery = jest.requireMock('@anthropic-ai/claude-agent-sdk').query;

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
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'test-token';

    // Default mock: query returns an async iterable with a result message
    mockQuery.mockImplementation(() => ({
      async *[Symbol.asyncIterator]() {
        yield { type: 'result', result: 'done' };
      },
    }));
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

    let content = `---\nid: ${id}\nsummary: "${title}"\ncreated: "2025-10-16"\n---\n\n# Plan: ${title}\n`;
    if (hasBlueprint) {
      content += '\n## Execution Blueprint\n\nPhases defined here.\n';
    }

    await fs.writeFile(path.join(planDir, `plan-${planDirName}.md`), content, 'utf-8');

    if (taskCount > 0) {
      const tasksDir = path.join(planDir, 'tasks');
      await fs.ensureDir(tasksDir);
      for (let i = 1; i <= taskCount; i++) {
        const taskContent = `---\nid: ${i}\ngroup: "test"\ndependencies: []\nstatus: "pending"\ncreated: "2025-10-16"\nskills: ["test"]\n---\n# Task ${i}\n`;
        await fs.writeFile(
          path.join(tasksDir, `${i.toString().padStart(2, '0')}--task-${i}.md`),
          taskContent,
          'utf-8'
        );
      }
    }
  }

  describe('Input validation', () => {
    it('should fail when no OAuth token is set', async () => {
      delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
      const result = await claudeExec([1]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('CLAUDE_CODE_OAUTH_TOKEN');
    });

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
      expect(mockQuery).toHaveBeenCalledTimes(1); // Only execute-blueprint, no remediation
    });
  });

  describe('Phase 2: Remediation batching', () => {
    it('should remediate plans needing tasks', async () => {
      // Plan with no tasks triggers remediation
      await createTestPlan(1, 'needs-tasks', { taskCount: 0, hasBlueprint: true });

      // After remediation mock, create tasks so re-validation passes
      mockQuery.mockImplementation(() => ({
        async *[Symbol.asyncIterator]() {
          // Simulate generate-tasks creating tasks and blueprint
          const planDir = path.join(plansDir, '01--needs-tasks');
          const tasksDir = path.join(planDir, 'tasks');
          await fs.ensureDir(tasksDir);
          await fs.writeFile(
            path.join(tasksDir, '01--task-1.md'),
            '---\nid: 1\ngroup: "test"\ndependencies: []\nstatus: "pending"\ncreated: "2025-10-16"\nskills: ["test"]\n---\n# Task 1\n',
            'utf-8'
          );
          // Add blueprint section
          const planFile = path.join(planDir, 'plan-01--needs-tasks.md');
          const content = await fs.readFile(planFile, 'utf-8');
          await fs.writeFile(planFile, content + '\n## Execution Blueprint\n\nPhases.\n', 'utf-8');
          yield { type: 'result', result: 'done' };
        },
      }));

      const result = await claudeExec([1]);
      expect(result.success).toBe(true);
    });

    it('should process remediation in parallel batches of 3', async () => {
      // Create 5 plans needing remediation to test batching (2 batches: 3 + 2)
      for (let i = 1; i <= 5; i++) {
        await createTestPlan(i, `plan-${i}`, { taskCount: 0, hasBlueprint: false });
      }

      const callOrder: number[] = [];
      let callIndex = 0;

      mockQuery.mockImplementation(() => ({
        async *[Symbol.asyncIterator]() {
          const currentCall = ++callIndex;
          callOrder.push(currentCall);

          // Determine which plan this is for based on the call sequence
          // Calls 1-5 are generate-tasks, calls 6-10 are execute-blueprint
          const planId = currentCall <= 5 ? currentCall : currentCall - 5;
          const planDirName = `${planId.toString().padStart(2, '0')}--plan-${planId}`;
          const planDir = path.join(plansDir, planDirName);

          // Simulate task generation
          const tasksDir = path.join(planDir, 'tasks');
          await fs.ensureDir(tasksDir);
          await fs.writeFile(
            path.join(tasksDir, '01--task-1.md'),
            `---\nid: 1\ngroup: "test"\ndependencies: []\nstatus: "pending"\ncreated: "2025-10-16"\nskills: ["test"]\n---\n# Task 1\n`,
            'utf-8'
          );
          const planFile = path.join(planDir, `plan-${planDirName}.md`);
          const content = await fs.readFile(planFile, 'utf-8');
          if (!content.includes('## Execution Blueprint')) {
            await fs.writeFile(
              planFile,
              content + '\n## Execution Blueprint\n\nPhases.\n',
              'utf-8'
            );
          }

          yield { type: 'result', result: 'done' };
        },
      }));

      const result = await claudeExec([1, 2, 3, 4, 5]);
      expect(result.success).toBe(true);
      // 5 remediation calls + 5 execution calls = 10 total
      expect(mockQuery).toHaveBeenCalledTimes(10);
    });

    it('should fail if remediation leaves plan without tasks', async () => {
      await createTestPlan(1, 'broken-plan', { taskCount: 0, hasBlueprint: false });

      // Mock that does nothing (doesn't create tasks)
      mockQuery.mockImplementation(() => ({
        async *[Symbol.asyncIterator]() {
          yield { type: 'result', result: 'done' };
        },
      }));

      const result = await claudeExec([1]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('still has no tasks after remediation');
    });

    it('should fail if remediation leaves plan without blueprint', async () => {
      await createTestPlan(1, 'no-blueprint', { taskCount: 0, hasBlueprint: false });

      // Mock that creates tasks but no blueprint
      mockQuery.mockImplementation(() => ({
        async *[Symbol.asyncIterator]() {
          const planDir = path.join(plansDir, '01--no-blueprint');
          const tasksDir = path.join(planDir, 'tasks');
          await fs.ensureDir(tasksDir);
          await fs.writeFile(
            path.join(tasksDir, '01--task-1.md'),
            '---\nid: 1\ngroup: "test"\ndependencies: []\nstatus: "pending"\ncreated: "2025-10-16"\nskills: ["test"]\n---\n# Task 1\n',
            'utf-8'
          );
          yield { type: 'result', result: 'done' };
        },
      }));

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
      mockQuery.mockImplementation(({ prompt }: { prompt: string }) => ({
        async *[Symbol.asyncIterator]() {
          executionOrder.push(prompt);
          yield { type: 'result', result: 'done' };
        },
      }));

      const result = await claudeExec([1, 2]);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ planIds: [1, 2] });
      expect(executionOrder).toEqual(['/tasks:execute-blueprint 1', '/tasks:execute-blueprint 2']);
    });

    it('should stop on execution failure', async () => {
      await createTestPlan(1, 'fail-plan', { taskCount: 1, hasBlueprint: true });
      await createTestPlan(2, 'never-run', { taskCount: 1, hasBlueprint: true });

      mockQuery.mockImplementation(() => ({
        async *[Symbol.asyncIterator]() {
          throw new Error('Execution error');
        },
      }));

      const result = await claudeExec([1, 2]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Execution failed for plan 1');
      // Only one call - stopped after first failure
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
});
