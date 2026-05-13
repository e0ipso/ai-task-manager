/**
 * Plan Utilities Module
 *
 * Provides functions for locating plans, loading plan data, and extracting content
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { PlanMetadata, parseTaskFiles } from './status';
import { getHeadMeta, parseHtmlDocument } from './html-meta';

/**
 * Location information for a plan
 */
export interface PlanLocation {
  planId: number;
  directoryPath: string;
  filePath: string;
  isArchived: boolean;
}

/**
 * Extended plan data including body content
 */
export interface PlanData extends PlanMetadata {
  bodyContent: string;
  executiveSummary: string;
}

const PLAN_FILE_EXTENSION = '.html';

/**
 * Find a plan by ID in either plans/ or archive/ directories
 */
export async function findPlanById(planId: number): Promise<PlanLocation | null> {
  const baseDir = process.cwd();
  const searchDirs = [
    { path: path.join(baseDir, '.ai/task-manager/plans'), archived: false },
    { path: path.join(baseDir, '.ai/task-manager/archive'), archived: true },
  ];

  for (const searchDir of searchDirs) {
    if (!(await fs.pathExists(searchDir.path))) continue;

    const entries = await fs.readdir(searchDir.path, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const planDir = path.join(searchDir.path, entry.name);
      const files = await fs.readdir(planDir);
      const planFile = files.find(f => f.startsWith('plan-') && f.endsWith(PLAN_FILE_EXTENSION));

      if (!planFile) continue;

      const filePath = path.join(planDir, planFile);
      const content = await fs.readFile(filePath, 'utf-8');
      const meta = getHeadMeta(content);
      const id = meta.id ? Number(meta.id) : NaN;

      if (id === planId) {
        return {
          planId,
          directoryPath: planDir,
          filePath,
          isArchived: searchDir.archived,
        };
      }
    }
  }

  return null;
}

/**
 * Extract the Executive Summary section from a plan HTML document.
 * Looks for the `<section aria-labelledby="executive-summary">` block
 * defined by PLAN_TEMPLATE.html.
 */
export function extractExecutiveSummary(html: string): string {
  const root = parseHtmlDocument(html);
  if (!root) return 'No Executive Summary found.';

  const section =
    root.querySelector('section[aria-labelledby="executive-summary"]') ??
    root.querySelector('#executive-summary')?.parentNode;

  if (!section || !(section instanceof Object) || !('textContent' in section)) {
    return 'No Executive Summary found.';
  }

  const heading = (section as { querySelector(s: string): unknown }).querySelector(
    '#executive-summary'
  );
  if (heading && typeof (heading as { remove?: () => void }).remove === 'function') {
    (heading as { remove: () => void }).remove();
  }

  const text = String((section as { textContent: string }).textContent).trim();
  return text || 'No Executive Summary found.';
}

/**
 * Load complete plan data including metadata, tasks, and content
 */
export async function loadPlanData(planId: number): Promise<PlanData | null> {
  const location = await findPlanById(planId);
  if (!location) return null;

  const content = await fs.readFile(location.filePath, 'utf-8');
  const meta = getHeadMeta(content);

  const tasks = await parseTaskFiles(location.directoryPath);
  const executiveSummary = extractExecutiveSummary(content);

  return {
    id: meta.id ? Number(meta.id) : NaN,
    summary: meta.summary ?? '',
    created: meta.created ?? '',
    approval_method: meta.approval_method,
    isArchived: location.isArchived,
    directoryPath: location.directoryPath,
    tasks,
    bodyContent: content,
    executiveSummary,
  };
}
