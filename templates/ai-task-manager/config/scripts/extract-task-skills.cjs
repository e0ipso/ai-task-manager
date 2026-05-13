#!/usr/bin/env node

/**
 * Extract skills from a task file's head metadata.
 *
 * Usage: node extract-task-skills.cjs <task-file>
 * Output: One skill per line, trimmed, empty lines removed.
 *
 * Tasks are semantic HTML5 documents. Skills are stored as a comma-separated
 * value inside a single `<meta>` tag in `<head>`:
 *
 *   <meta name="skills" content="skill-a,skill-b">
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getMetaList } = require('./shared-utils.cjs');

const taskFile = process.argv[2];
if (!taskFile) {
  console.error('Usage: node extract-task-skills.cjs <task-file>');
  process.exit(1);
}

const content = fs.readFileSync(path.resolve(taskFile), 'utf8');
const skills = getMetaList(content, 'skills');

if (skills.length > 0) {
  console.log(skills.join('\n'));
}
