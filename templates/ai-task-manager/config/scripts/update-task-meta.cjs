#!/usr/bin/env node

/**
 * Script: update-task-meta.cjs
 * Purpose: Update or read a `<meta>` tag value inside the `<head>` of a
 *          plan or task HTML document. Used by execution prompts to flip
 *          task status (`pending` → `in-progress` → `completed`) without
 *          needing a real DOM parser in standalone scripts.
 *
 * Usage:
 *   node update-task-meta.cjs <file> <meta-name>            # read
 *   node update-task-meta.cjs <file> <meta-name> <value>    # write
 *
 * Examples:
 *   node update-task-meta.cjs task-01--example.html status
 *   node update-task-meta.cjs task-01--example.html status in-progress
 *
 * If the requested `<meta>` does not exist, the script inserts a new one
 * just before `</head>`.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getMetaValue } = require('./shared-utils.cjs');

function _encodeAttributeValue(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _readMode(filePath, metaName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const value = getMetaValue(content, metaName);
  if (value !== undefined) {
    process.stdout.write(value + '\n');
  }
}

function _writeMode(filePath, metaName, newValue) {
  const original = fs.readFileSync(filePath, 'utf8');
  const encoded = _encodeAttributeValue(newValue);
  const escapedName = metaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match a <meta> tag whose name attribute equals metaName (forward order).
  const forwardRegex = new RegExp(
    `(<meta\\b[^>]*?\\bname\\s*=\\s*["']${escapedName}["'][^>]*?\\bcontent\\s*=\\s*["'])[^"']*(["'][^>]*?\\/?>)`,
    'i'
  );
  // Reverse order (content before name).
  const reverseRegex = new RegExp(
    `(<meta\\b[^>]*?\\bcontent\\s*=\\s*["'])[^"']*(["'][^>]*?\\bname\\s*=\\s*["']${escapedName}["'][^>]*?\\/?>)`,
    'i'
  );

  let updated;
  if (forwardRegex.test(original)) {
    updated = original.replace(forwardRegex, `$1${encoded}$2`);
  } else if (reverseRegex.test(original)) {
    updated = original.replace(reverseRegex, `$1${encoded}$2`);
  } else {
    // Insert a new <meta> tag just before </head>.
    const insertion = `  <meta name="${metaName}" content="${encoded}">\n`;
    if (/<\/head>/i.test(original)) {
      updated = original.replace(/<\/head>/i, `${insertion}</head>`);
    } else {
      // No <head> at all — prepend the meta tag.
      updated = insertion + original;
    }
  }

  fs.writeFileSync(filePath, updated, 'utf8');
}

if (require.main === module) {
  const [, , rawPath, metaName, ...rest] = process.argv;
  if (!rawPath || !metaName) {
    console.error('Usage: node update-task-meta.cjs <file> <meta-name> [value]');
    process.exit(1);
  }

  const filePath = path.resolve(rawPath);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  if (rest.length === 0) {
    _readMode(filePath, metaName);
  } else {
    _writeMode(filePath, metaName, rest.join(' '));
  }
}

module.exports = {
  _readMode,
  _writeMode
};
