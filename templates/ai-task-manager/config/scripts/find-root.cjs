#!/usr/bin/env node

const { findTaskManagerRoot } = require('./shared-utils.cjs');

try {
  const root = findTaskManagerRoot();
  process.exit(root ? 0 : 1);
} catch (err) {
  process.exit(1);
}
