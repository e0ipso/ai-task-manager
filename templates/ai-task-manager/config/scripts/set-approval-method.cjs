#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update or add approval_method field in a plan file's YAML frontmatter
 * @param {string} filePath - Path to the plan file
 * @param {string} approvalMethod - Approval method value ('auto' or 'manual')
 * @returns {boolean} True if successful, false otherwise
 */
function setApprovalMethod(filePath, approvalMethod) {
  // Validate inputs
  if (!filePath) {
    throw new Error('File path is required');
  }

  if (!approvalMethod || !['auto', 'manual'].includes(approvalMethod)) {
    throw new Error('Approval method must be "auto" or "manual"');
  }

  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse frontmatter - handle both empty and non-empty frontmatter
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('No frontmatter found in file');
  }

  const frontmatterContent = match[1] || '';
  const bodyContent = match[2] || '';
  const frontmatterLines = frontmatterContent ? frontmatterContent.split('\n') : [];

  // Update or add approval_method field
  let approvalMethodFound = false;
  const updatedFrontmatter = frontmatterLines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('approval_method:')) {
      approvalMethodFound = true;
      return `approval_method: ${approvalMethod}`;
    }
    return line;
  });

  // Add approval_method if not found
  if (!approvalMethodFound) {
    updatedFrontmatter.push(`approval_method: ${approvalMethod}`);
  }

  // Reconstruct file
  const updated = '---\n' + updatedFrontmatter.join('\n') + '\n---\n' + bodyContent;

  // Write back to file
  fs.writeFileSync(filePath, updated, 'utf8');

  return true;
}

// Main execution with error handling
try {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: set-approval-method.cjs <file-path> <approval-method>');
    console.error('  file-path: Path to the plan file');
    console.error('  approval-method: "auto" or "manual"');
    process.exit(1);
  }

  const [filePath, approvalMethod] = args;

  // Resolve relative paths
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  setApprovalMethod(resolvedPath, approvalMethod);

  console.log(`✓ Successfully set approval_method to "${approvalMethod}" in ${path.basename(resolvedPath)}`);
  process.exit(0);
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
  process.exit(1);
}
