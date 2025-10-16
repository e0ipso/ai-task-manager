/**
 * Integration tests for plan command functionality
 * Focuses on business logic - plan lookup, archival operations, data integrity
 */

// Mock chalk to avoid ESM issues
jest.mock('chalk', () => ({
  default: (str: string) => str,
}));

import * as fs from 'fs-extra';
import * as path from 'path';
import { loadPlanData, findPlanById } from '../plan-utils';

describe('Plan Command Integration Tests', () => {
  const testDir = path.join(__dirname, 'test-plans');
  const plansDir = path.join(testDir, '.ai/task-manager/plans');
  const archiveDir = path.join(testDir, '.ai/task-manager/archive');
  const originalCwd = process.cwd();

  beforeEach(async () => {
    // Create test directory structure
    await fs.ensureDir(plansDir);
    await fs.ensureDir(archiveDir);

    // Change working directory for tests
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore working directory
    process.chdir(originalCwd);

    // Clean up test directories
    await fs.remove(testDir);
  });

  /**
   * Create a test plan with tasks
   */
  async function createTestPlan(
    id: number,
    title: string,
    isArchived: boolean,
    tasks: Array<{ id: number; status: string }> = []
  ) {
    const planDirName = `${id.toString().padStart(2, '0')}--${title.toLowerCase().replace(/\s+/g, '-')}`;
    const planDir = path.join(isArchived ? archiveDir : plansDir, planDirName);

    await fs.ensureDir(planDir);

    // Create plan file
    const planContent = `---
id: ${id}
summary: "${title}"
created: "2025-10-16"
---

# Plan: ${title}

## Executive Summary

This is a test plan for integration testing.

## Context

Test content.
`;

    await fs.writeFile(path.join(planDir, `plan-${planDirName}.md`), planContent, 'utf-8');

    // Create tasks
    if (tasks.length > 0) {
      const tasksDir = path.join(planDir, 'tasks');
      await fs.ensureDir(tasksDir);

      for (const task of tasks) {
        const taskContent = `---
id: ${task.id}
group: "test"
dependencies: []
status: "${task.status}"
created: "2025-10-16"
skills: ["test"]
---
# Test Task ${task.id}

Test content.
`;

        await fs.writeFile(
          path.join(tasksDir, `${task.id.toString().padStart(2, '00')}--test-task.md`),
          taskContent,
          'utf-8'
        );
      }
    }
  }

  describe('Plan Lookup and Loading', () => {
    it('should find and load active plan', async () => {
      await createTestPlan(1, 'Test Plan', false, [{ id: 1, status: 'pending' }]);

      const planData = await loadPlanData(1);

      expect(planData).not.toBeNull();
      expect(planData?.id).toBe(1);
      expect(planData?.summary).toBe('Test Plan');
      expect(planData?.isArchived).toBe(false);
      expect(planData?.tasks.length).toBe(1);
    });

    it('should find and load archived plan', async () => {
      await createTestPlan(2, 'Archived Plan', true);

      const planData = await loadPlanData(2);

      expect(planData).not.toBeNull();
      expect(planData?.isArchived).toBe(true);
    });

    it('should return null for non-existent plan', async () => {
      const planData = await loadPlanData(999);

      expect(planData).toBeNull();
    });

    it('should load plan with task statistics', async () => {
      await createTestPlan(4, 'Plan with Tasks', false, [
        { id: 1, status: 'completed' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'completed' },
      ]);

      const planData = await loadPlanData(4);

      expect(planData?.tasks.length).toBe(3);
      expect(planData?.tasks.filter(t => t.status === 'completed').length).toBe(2);
    });

    it('should extract executive summary', async () => {
      await createTestPlan(5, 'Plan with Summary', false);

      const planData = await loadPlanData(5);

      expect(planData?.executiveSummary).toContain('test plan for integration testing');
    });
  });

  describe('Plan Location Detection', () => {
    it('should detect active plan location', async () => {
      await createTestPlan(6, 'Active Plan', false);

      const location = await findPlanById(6);

      expect(location).not.toBeNull();
      expect(location?.isArchived).toBe(false);
      expect(location?.directoryPath).toContain('/plans/');
    });

    it('should detect archived plan location', async () => {
      await createTestPlan(7, 'Archived Plan', true);

      const location = await findPlanById(7);

      expect(location).not.toBeNull();
      expect(location?.isArchived).toBe(true);
      expect(location?.directoryPath).toContain('/archive/');
    });

    it('should return null for missing plan', async () => {
      const location = await findPlanById(999);

      expect(location).toBeNull();
    });
  });
});
