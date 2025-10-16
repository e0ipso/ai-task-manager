/**
 * Unit tests for status dashboard functionality
 */

// Mock chalk before importing status module
jest.mock('chalk', () => ({
  default: {
    cyan: jest.fn((str: string) => str),
    green: jest.fn((str: string) => str),
    blue: jest.fn((str: string) => str),
    magenta: jest.fn((str: string) => str),
    yellow: jest.fn((str: string) => str),
    gray: jest.fn((str: string) => str),
    white: jest.fn((str: string) => str),
    bold: {
      cyan: jest.fn((str: string) => str),
      white: jest.fn((str: string) => str),
    },
  },
}));

import { calculateStatistics, categorizePlanStatus, PlanMetadata, TaskMetadata } from '../status';

describe('Status Dashboard Statistics', () => {
  // Test data helpers
  const createPlan = (overrides: Partial<PlanMetadata>): PlanMetadata => ({
    id: 1,
    summary: 'Test plan',
    created: '2025-01-01',
    isArchived: false,
    directoryPath: '/test',
    tasks: [],
    ...overrides,
  });

  const createTask = (status: string, id: number = 1): TaskMetadata => ({
    id,
    status: status as TaskMetadata['status'],
  });

  describe('calculateStatistics with empty data', () => {
    it('should return zero counts for empty plans array', () => {
      const stats = calculateStatistics([]);

      expect(stats.totalPlans).toBe(0);
      expect(stats.activePlans).toBe(0);
      expect(stats.archivedPlans).toBe(0);
      expect(stats.taskCompletionRate).toBe(0);
      expect(stats.mostRecentPlan).toBeUndefined();
      expect(stats.oldestPlan).toBeUndefined();
    });
  });

  describe('calculateStatistics with mixed plans', () => {
    it('should correctly count active and archived plans', () => {
      const plans = [
        createPlan({ id: 1, isArchived: false }),
        createPlan({ id: 2, isArchived: false }),
        createPlan({ id: 3, isArchived: true }),
      ];

      const stats = calculateStatistics(plans);

      expect(stats.totalPlans).toBe(3);
      expect(stats.activePlans).toBe(2);
      expect(stats.archivedPlans).toBe(1);
    });

    it('should calculate task completion rate correctly', () => {
      const plans = [
        createPlan({
          id: 1,
          isArchived: false,
          tasks: [
            createTask('completed', 1),
            createTask('completed', 2),
            createTask('pending', 3),
            createTask('in-progress', 4),
          ],
        }),
      ];

      const stats = calculateStatistics(plans);
      expect(stats.taskCompletionRate).toBe(50); // 2/4 = 50%
    });

    it('should count both active and archived plans for completion rate', () => {
      const plans = [
        createPlan({
          id: 1,
          isArchived: false,
          tasks: [createTask('completed', 1), createTask('pending', 2)],
        }),
        createPlan({
          id: 2,
          isArchived: true,
          tasks: [createTask('completed', 1), createTask('completed', 2)],
        }),
      ];

      const stats = calculateStatistics(plans);
      expect(stats.taskCompletionRate).toBe(75); // 3 completed out of 4 total = 75%
    });
  });

  describe('categorizePlanStatus', () => {
    it('should categorize plan with no tasks as "noTasks"', () => {
      const plan = createPlan({ tasks: [] });
      expect(categorizePlanStatus(plan)).toBe('noTasks');
    });

    it('should categorize plan with all pending tasks as "notStarted"', () => {
      const plan = createPlan({
        tasks: [createTask('pending', 1), createTask('pending', 2)],
      });
      expect(categorizePlanStatus(plan)).toBe('notStarted');
    });

    it('should categorize plan with all completed tasks as "completed"', () => {
      const plan = createPlan({
        tasks: [createTask('completed', 1), createTask('completed', 2)],
      });
      expect(categorizePlanStatus(plan)).toBe('completed');
    });

    it('should categorize plan with mixed statuses as "inProgress"', () => {
      const plan = createPlan({
        tasks: [createTask('completed', 1), createTask('pending', 2), createTask('in-progress', 3)],
      });
      expect(categorizePlanStatus(plan)).toBe('inProgress');
    });
  });

  describe('timeline detection', () => {
    it('should identify most recent and oldest plans', () => {
      const plans = [
        createPlan({ id: 1, created: '2025-01-01' }),
        createPlan({ id: 2, created: '2025-03-15' }),
        createPlan({ id: 3, created: '2024-12-01' }),
      ];

      const stats = calculateStatistics(plans);

      expect(stats.mostRecentPlan?.id).toBe(2);
      expect(stats.oldestPlan?.id).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle plan with zero tasks for completion rate', () => {
      const plans = [createPlan({ tasks: [] })];
      const stats = calculateStatistics(plans);
      expect(stats.taskCompletionRate).toBe(0);
    });

    it('should handle all tasks completed', () => {
      const plans = [
        createPlan({
          tasks: [createTask('completed', 1), createTask('completed', 2)],
        }),
      ];
      const stats = calculateStatistics(plans);
      expect(stats.taskCompletionRate).toBe(100);
    });

    it('should calculate plan status distribution correctly', () => {
      const plans = [
        createPlan({ id: 1, tasks: [] }), // noTasks
        createPlan({ id: 2, tasks: [createTask('pending', 1)] }), // notStarted
        createPlan({ id: 3, tasks: [createTask('completed', 1)] }), // completed
        createPlan({
          id: 4,
          tasks: [createTask('completed', 1), createTask('pending', 2)],
        }), // inProgress
      ];

      const stats = calculateStatistics(plans);

      expect(stats.plansByStatus.noTasks).toBe(1);
      expect(stats.plansByStatus.notStarted).toBe(1);
      expect(stats.plansByStatus.completed).toBe(1);
      expect(stats.plansByStatus.inProgress).toBe(1);
    });
  });
});
