/**
 * Unit Tests for shared-utils.cjs
 *
 * Focus: Unit-level validation of functional logic in shared utilities.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Use require to load the CommonJS module
const sharedUtils = require('../../templates/ai-task-manager/config/scripts/shared-utils.cjs');

describe('shared-utils.cjs Unit Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('parseFrontmatter', () => {
    it('should extract content between delimiters', () => {
      const content = '---\nid: 1\ncreated: 2026-01-08\n---\n# Title';
      expect(sharedUtils.parseFrontmatter(content)).toBe('id: 1\ncreated: 2026-01-08');
    });

    it('should return empty string if no delimiters found', () => {
      const content = '# No frontmatter';
      expect(sharedUtils.parseFrontmatter(content)).toBe('');
    });

    it('should handle multiple delimiters correctly (only first block)', () => {
      const content = '---\nid: 1\n---\n# Title\n---\nother: stuff\n---';
      expect(sharedUtils.parseFrontmatter(content)).toBe('id: 1');
    });
  });

  describe('extractIdFromFrontmatter', () => {
    it('should extract numeric ID', () => {
      const content = '---\nid: 42\n---';
      expect(sharedUtils.extractIdFromFrontmatter(content)).toBe(42);
    });

    it('should extract quoted ID', () => {
      const content = '---\nid: "42"\n---';
      expect(sharedUtils.extractIdFromFrontmatter(content)).toBe(42);
    });

    it('should return null if ID is missing', () => {
      const content = '---\nno_id: here\n---';
      expect(sharedUtils.extractIdFromFrontmatter(content)).toBe(null);
    });

    it('should return null if frontmatter is missing', () => {
      const content = '# No frontmatter';
      expect(sharedUtils.extractIdFromFrontmatter(content)).toBe(null);
    });
  });

  describe('isValidTaskManagerRoot', () => {
    it('should return true for valid root with metadata', () => {
      const root = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(root, { recursive: true });
      fs.writeFileSync(
        path.join(root, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      expect(sharedUtils.isValidTaskManagerRoot(root)).toBe(true);
    });

    it('should return false if directory does not exist', () => {
      expect(sharedUtils.isValidTaskManagerRoot('/non/existent')).toBe(false);
    });

    it('should return false if metadata file is missing', () => {
      const root = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(root, { recursive: true });

      expect(sharedUtils.isValidTaskManagerRoot(root)).toBe(false);
    });

    it('should return false if metadata is missing version', () => {
      const root = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(root, { recursive: true });
      fs.writeFileSync(path.join(root, '.init-metadata.json'), JSON.stringify({ foo: 'bar' }));

      expect(sharedUtils.isValidTaskManagerRoot(root)).toBe(false);
    });
  });

  describe('checkStandardRootShortcut', () => {
    it('should return root for standard plan path', () => {
      const projectRoot = path.join(tempDir, 'project');
      const tmRoot = path.join(projectRoot, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '01--test');
      const planFile = path.join(planDir, 'plan-01--test.md');

      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      expect(sharedUtils.checkStandardRootShortcut(planFile)).toBe(tmRoot);
    });

    it('should return null for non-standard path', () => {
      const planFile = path.join(tempDir, 'not', 'standard', 'plan.md');
      expect(sharedUtils.checkStandardRootShortcut(planFile)).toBe(null);
    });
  });

  describe('findTaskManagerRoot', () => {
    it('should find root in current directory', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(tmRoot, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      expect(sharedUtils.findTaskManagerRoot(tempDir)).toBe(tmRoot);
    });

    it('should find root by traversing upward', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(tmRoot, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      const nested = path.join(tempDir, 'a', 'b', 'c');
      fs.mkdirSync(nested, { recursive: true });

      expect(sharedUtils.findTaskManagerRoot(nested)).toBe(tmRoot);
    });

    it('should return null if no root found', () => {
      expect(sharedUtils.findTaskManagerRoot(tempDir)).toBe(null);
    });
  });

  describe('getAllPlans', () => {
    it('should return all active and archived plans', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      const activeDir = path.join(tmRoot, 'plans', '01--active');
      const archiveDir = path.join(tmRoot, 'archive', '02--archived');

      fs.mkdirSync(activeDir, { recursive: true });
      fs.mkdirSync(archiveDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      fs.writeFileSync(path.join(activeDir, 'plan-01--active.md'), '---\nid: 1\n---');
      fs.writeFileSync(path.join(archiveDir, 'plan-02--archived.md'), '---\nid: 2\n---');

      const plans = sharedUtils.getAllPlans(tmRoot);
      expect(plans).toHaveLength(2);
      expect(plans.map((p: any) => p.id).sort()).toEqual([1, 2]);
    });
  });

  describe('findPlanById', () => {
    it('should find plan by its ID', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      const activeDir = path.join(tmRoot, 'plans', '42--test');
      fs.mkdirSync(activeDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(path.join(activeDir, 'plan-42--test.md'), '---\nid: 42\n---');

      const plan = sharedUtils.findPlanById(42, tmRoot);
      expect(plan).not.toBeNull();
      expect(plan.planFile).toContain('plan-42--test.md');
    });

    it('should return null if plan not found', () => {
      const tmRoot = path.join(tempDir, '.ai', 'task-manager');
      fs.mkdirSync(tmRoot, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      expect(sharedUtils.findPlanById(99, tmRoot)).toBeNull();
    });
  });

  describe('resolvePlan', () => {
    it('should resolve plan by absolute path', () => {
      const projectRoot = path.join(tempDir, 'project');
      const tmRoot = path.join(projectRoot, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '01--test');
      const planFile = path.join(planDir, 'plan-01--test.md');

      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(planFile, '---\nid: 1\ncreated: 2026-01-08\n---');

      const resolved = sharedUtils.resolvePlan(planFile);
      expect(resolved).not.toBeNull();
      expect(resolved.planId).toBe(1);
      expect(resolved.taskManagerRoot).toBe(tmRoot);
    });

    it('should resolve plan by numeric ID with hierarchical search', () => {
      const projectRoot = path.join(tempDir, 'project');
      const tmRoot = path.join(projectRoot, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '42--test');
      const planFile = path.join(planDir, 'plan-42--test.md');

      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(planFile, '---\nid: 42\n---');

      const nestedDir = path.join(projectRoot, 'src', 'components');
      fs.mkdirSync(nestedDir, { recursive: true });

      const resolved = sharedUtils.resolvePlan(42, nestedDir);
      expect(resolved).not.toBeNull();
      expect(resolved.planId).toBe(42);
      expect(resolved.taskManagerRoot).toBe(tmRoot);
    });

    it('should return null if plan cannot be resolved', () => {
      expect(sharedUtils.resolvePlan(999, tempDir)).toBeNull();
    });
  });

  describe('validatePlanFile', () => {
    it('should return ID for valid plan file', () => {
      const planFile = path.join(tempDir, 'plan.md');
      fs.writeFileSync(planFile, '---\nid: 5\ncreated: 2026-01-08\n---');
      expect(sharedUtils.validatePlanFile(planFile)).toBe(5);
    });

    it('should return null for plan missing created field', () => {
      const planFile = path.join(tempDir, 'plan.md');
      fs.writeFileSync(planFile, '---\nid: 5\n---');
      expect(sharedUtils.validatePlanFile(planFile)).toBe(null);
    });

    it('should return null for non-existent file', () => {
      expect(sharedUtils.validatePlanFile(path.join(tempDir, 'nope.md'))).toBe(null);
    });
  });
});
