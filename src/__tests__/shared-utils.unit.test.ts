/**
 * Unit Tests for shared-utils.cjs
 *
 * Focus: Unit-level validation of the HTML-metadata-based shared utilities.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Use require to load the CommonJS module
const sharedUtils = require('../../templates/ai-task-manager/config/scripts/shared-utils.cjs');

/** Build a minimal HTML5 plan document with the given metadata. */
function planHtml(meta: { id?: number | string; created?: string; extra?: string } = {}): string {
  const idTag = meta.id !== undefined ? `<meta name="id" content="${meta.id}">` : '';
  const createdTag = meta.created
    ? `<meta name="created" content="${meta.created}">`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Plan</title>
  ${idTag}
  ${createdTag}
  ${meta.extra ?? ''}
</head>
<body><article><h1>Test Plan</h1></article></body>
</html>`;
}

describe('shared-utils.cjs Unit Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getHeadMeta', () => {
    it('should return all meta name/content pairs from <head>', () => {
      const meta = sharedUtils.getHeadMeta(
        planHtml({ id: 1, created: '2026-01-08', extra: '<meta name="summary" content="hi">' })
      );
      expect(meta.id).toBe('1');
      expect(meta.created).toBe('2026-01-08');
      expect(meta.summary).toBe('hi');
    });

    it('should return empty object when no head present', () => {
      expect(sharedUtils.getHeadMeta('<p>no head</p>')).toEqual({});
    });

    it('should support reversed attribute order', () => {
      const html = '<head><meta content="42" name="id"></head>';
      expect(sharedUtils.getHeadMeta(html).id).toBe('42');
    });
  });

  describe('getMetaList', () => {
    it('should parse comma-separated values', () => {
      const html =
        '<head><meta name="skills" content="react-components, authentication"></head>';
      expect(sharedUtils.getMetaList(html, 'skills')).toEqual([
        'react-components',
        'authentication',
      ]);
    });

    it('should return empty array if meta missing', () => {
      expect(sharedUtils.getMetaList('<head></head>', 'skills')).toEqual([]);
    });
  });

  describe('extractIdFromHead', () => {
    it('should extract numeric ID', () => {
      expect(sharedUtils.extractIdFromHead(planHtml({ id: 42 }))).toBe(42);
    });

    it('should return null if ID is missing', () => {
      expect(sharedUtils.extractIdFromHead(planHtml())).toBe(null);
    });

    it('should return null if no head present', () => {
      expect(sharedUtils.extractIdFromHead('<p>no head</p>')).toBe(null);
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
      const planFile = path.join(planDir, 'plan-01--test.html');

      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );

      expect(sharedUtils.checkStandardRootShortcut(planFile)).toBe(tmRoot);
    });

    it('should return null for non-standard path', () => {
      const planFile = path.join(tempDir, 'not', 'standard', 'plan.html');
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

      fs.writeFileSync(
        path.join(activeDir, 'plan-01--active.html'),
        planHtml({ id: 1, created: '2026-01-08' })
      );
      fs.writeFileSync(
        path.join(archiveDir, 'plan-02--archived.html'),
        planHtml({ id: 2, created: '2026-01-08' })
      );

      const plans = sharedUtils.getAllPlans(tmRoot);
      expect(plans).toHaveLength(2);
      expect(plans.map((p: { id: number }) => p.id).sort()).toEqual([1, 2]);
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
      fs.writeFileSync(
        path.join(activeDir, 'plan-42--test.html'),
        planHtml({ id: 42, created: '2026-01-08' })
      );

      const plan = sharedUtils.findPlanById(42, tmRoot);
      expect(plan).not.toBeNull();
      expect(plan.planFile).toContain('plan-42--test.html');
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
      const planFile = path.join(planDir, 'plan-01--test.html');

      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(planFile, planHtml({ id: 1, created: '2026-01-08' }));

      const resolved = sharedUtils.resolvePlan(planFile);
      expect(resolved).not.toBeNull();
      expect(resolved.planId).toBe(1);
      expect(resolved.taskManagerRoot).toBe(tmRoot);
    });

    it('should resolve plan by numeric ID with hierarchical search', () => {
      const projectRoot = path.join(tempDir, 'project');
      const tmRoot = path.join(projectRoot, '.ai', 'task-manager');
      const planDir = path.join(tmRoot, 'plans', '42--test');
      const planFile = path.join(planDir, 'plan-42--test.html');

      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmRoot, '.init-metadata.json'),
        JSON.stringify({ version: '1.0.0' })
      );
      fs.writeFileSync(planFile, planHtml({ id: 42, created: '2026-01-08' }));

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
      const planFile = path.join(tempDir, 'plan.html');
      fs.writeFileSync(planFile, planHtml({ id: 5, created: '2026-01-08' }));
      expect(sharedUtils.validatePlanFile(planFile)).toBe(5);
    });

    it('should return null for plan missing created field', () => {
      const planFile = path.join(tempDir, 'plan.html');
      fs.writeFileSync(planFile, planHtml({ id: 5 }));
      expect(sharedUtils.validatePlanFile(planFile)).toBe(null);
    });

    it('should return null for non-existent file', () => {
      expect(sharedUtils.validatePlanFile(path.join(tempDir, 'nope.html'))).toBe(null);
    });
  });
});
