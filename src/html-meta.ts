/**
 * HTML metadata utilities.
 *
 * Plan and task documents in v2 are semantic HTML5 documents. Their
 * metadata lives in `<head>` as `<meta name="..." content="...">` tags
 * instead of YAML frontmatter. This module provides DOM-style helpers for
 * reading and updating those values via `node-html-parser`.
 */

import { parse, HTMLElement } from 'node-html-parser';

/**
 * Map of meta name to meta content value extracted from `<head>`.
 */
export type HeadMeta = Record<string, string>;

/**
 * Parse an HTML document and return a node-html-parser root node.
 * Returns null if parsing fails or yields nothing.
 */
export function parseHtmlDocument(content: string): HTMLElement | null {
  if (typeof content !== 'string' || content.length === 0) return null;
  try {
    return parse(content, { comment: true });
  } catch {
    return null;
  }
}

/**
 * Extract all `<meta name="..." content="...">` entries from a document's
 * `<head>` (or, if no `<head>` is present, from the root). Tags without
 * both `name` and `content` are ignored.
 */
export function getHeadMeta(content: string): HeadMeta {
  const root = parseHtmlDocument(content);
  if (!root) return {};

  const scope = root.querySelector('head') ?? root;
  const result: HeadMeta = {};

  for (const meta of scope.querySelectorAll('meta')) {
    const name = meta.getAttribute('name');
    const value = meta.getAttribute('content');
    if (name && value !== undefined) {
      result[name] = value;
    }
  }

  return result;
}

/**
 * Read a single `<meta name="...">` content value.
 */
export function getMetaValue(content: string, name: string): string | undefined {
  return getHeadMeta(content)[name];
}

/**
 * Read a comma-separated `<meta>` content value as a trimmed array.
 */
export function getMetaList(content: string, name: string): string[] {
  const raw = getMetaValue(content, name);
  if (!raw) return [];
  return raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function escapeAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Return a new copy of `content` with the `<meta name="...">` content
 * attribute set to `value`. Inserts a new `<meta>` tag if one does not
 * already exist.
 */
export function setMetaValue(content: string, name: string, value: string): string {
  const root = parseHtmlDocument(content);
  if (!root) {
    // Fall back: no parse possible — prepend a fresh head with the meta.
    const insertion = `<head>\n  <meta name="${name}" content="${escapeAttributeValue(value)}">\n</head>\n`;
    return insertion + content;
  }

  const head = root.querySelector('head');
  const scope = head ?? root;

  const existing = scope.querySelector(`meta[name="${name}"]`);
  if (existing) {
    existing.setAttribute('content', value);
  } else if (head) {
    head.insertAdjacentHTML(
      'beforeend',
      `\n  <meta name="${name}" content="${escapeAttributeValue(value)}">`
    );
  } else {
    // No <head> in document — prepend a new one.
    return `<head>\n  <meta name="${name}" content="${escapeAttributeValue(value)}">\n</head>\n${content}`;
  }

  return root.toString();
}
