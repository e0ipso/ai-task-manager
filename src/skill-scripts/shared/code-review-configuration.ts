import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { WORKSPACE_CONFIG_RELPATH } from './execution-routing';
import { hasYamlContent } from './task-frontmatter';

export type CodeReviewConfiguration =
  | { kind: 'config'; enabled: boolean }
  | { kind: 'invalid'; detail: string };

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/** Only an explicit boolean true authorizes review. Other sections have their own readers. */
export const loadCodeReviewConfiguration = (strikethrooRoot: string): CodeReviewConfiguration => {
  let contents: string;
  try {
    contents = fs.readFileSync(path.join(strikethrooRoot, WORKSPACE_CONFIG_RELPATH), 'utf8');
  } catch (error) {
    if ((error as { code?: unknown }).code === 'ENOENT') return { kind: 'config', enabled: false };
    return {
      kind: 'invalid',
      detail: `config.yaml could not be read: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!hasYamlContent(contents)) return { kind: 'config', enabled: false };

  let document: unknown;
  try {
    document = yaml.load(contents);
  } catch (error) {
    return {
      kind: 'invalid',
      detail: `config.yaml is not valid YAML: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (!isPlainObject(document)) {
    return { kind: 'invalid', detail: 'config.yaml must be a YAML mapping.' };
  }
  if (!Object.prototype.hasOwnProperty.call(document, 'code_review')) {
    return { kind: 'config', enabled: false };
  }

  const section = document.code_review;
  if (!isPlainObject(section)) {
    return { kind: 'invalid', detail: 'config.yaml code_review must be a YAML mapping.' };
  }
  const unsupported = Object.keys(section).find(key => key !== 'enabled');
  if (unsupported !== undefined) {
    return { kind: 'invalid', detail: `config.yaml code_review.${unsupported} is not supported.` };
  }
  if (!Object.prototype.hasOwnProperty.call(section, 'enabled')) {
    return { kind: 'config', enabled: false };
  }
  if (typeof section.enabled !== 'boolean') {
    return { kind: 'invalid', detail: 'config.yaml code_review.enabled must be a boolean.' };
  }
  return { kind: 'config', enabled: section.enabled };
};
