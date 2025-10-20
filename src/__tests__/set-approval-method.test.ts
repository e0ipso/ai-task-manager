/**
 * Integration Tests for set-approval-method.cjs
 *
 * Focus: Testing the script's ability to robustly update approval_method
 * in YAML frontmatter without brittle position-based assumptions.
 *
 * Tests cover: frontmatter parsing, field updates, field insertion,
 * error handling, and edge cases using real file system operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as os from 'os';

describe('set-approval-method Integration Tests', () => {
  let tempDir: string;
  let scriptPath: string;
  let testFilePath: string;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'approval-method-test-'));

    // Get script path relative to project root
    scriptPath = path.resolve(
      __dirname,
      '../../templates/ai-task-manager/config/scripts/set-approval-method.cjs'
    );

    // Default test file path
    testFilePath = path.join(tempDir, 'test-plan.md');

    // Verify script exists before running tests
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found at: ${scriptPath}`);
    }
  });

  afterEach(() => {
    // Clean up temporary directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to clean up test directory: ${tempDir}`);
    }
  });

  /**
   * Execute the set-approval-method script
   * @param filePath - Path to the file to update
   * @param approvalMethod - Approval method value
   * @returns { stdout, stderr, exitCode }
   */
  const executeScript = (
    filePath: string,
    approvalMethod: string
  ): { stdout: string; stderr: string; exitCode: number } => {
    const result = spawnSync('node', [scriptPath, filePath, approvalMethod], {
      encoding: 'utf8',
      env: {
        ...process.env,
      },
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status || 0,
    };
  };

  describe('Field Update (Existing approval_method)', () => {
    it('should update approval_method from manual to auto', () => {
      // Create plan with manual approval
      const content = `---
id: 1
summary: Test plan
created: 2025-10-20
approval_method: manual
---

# Test Plan

This is a test plan.
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully set approval_method to "auto"');

      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: auto');
      expect(updated).not.toContain('approval_method: manual');
      expect(updated).toContain('# Test Plan'); // Body preserved
    });

    it('should update approval_method from auto to manual', () => {
      const content = `---
id: 2
approval_method: auto
created: 2025-10-20
---

# Another Plan
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'manual');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: manual');
      expect(updated).not.toContain('approval_method: auto');
    });

    it('should preserve approval_method when setting to same value', () => {
      const content = `---
id: 3
approval_method: auto
---
Body content
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: auto');
    });
  });

  describe('Field Insertion (Missing approval_method)', () => {
    it('should add approval_method when it does not exist', () => {
      const content = `---
id: 10
summary: Plan without approval method
created: 2025-10-20
---

# Plan Content
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: auto');
      expect(updated).toContain('id: 10');
      expect(updated).toContain('# Plan Content');
    });

    it('should add approval_method regardless of created field position', () => {
      // Test that we don't rely on 'created:' being present or in a specific position
      const content = `---
id: 11
summary: Test
status: active
---

Body here
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'manual');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: manual');
    });
  });

  describe('Error Handling', () => {
    it('should fail with error when file does not exist', () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.md');

      const result = executeScript(nonExistentPath, 'auto');

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('File not found');
    });

    it('should fail when file has no frontmatter', () => {
      const content = `# Just a markdown file

No frontmatter here.
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No frontmatter found');
    });

    it('should fail when approval method is invalid', () => {
      const content = `---
id: 20
---
Body
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'invalid-value');

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('must be "auto" or "manual"');
    });

    it('should fail when no arguments provided', () => {
      const result = spawnSync('node', [scriptPath], {
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Usage:');
    });

    it('should fail when only one argument provided', () => {
      const result = spawnSync('node', [scriptPath, testFilePath], {
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Usage:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty frontmatter', () => {
      const content = `---

---

# Content
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: auto');
    });

    it('should handle frontmatter with comments', () => {
      const content = `---
# This is a comment
id: 30
# Another comment
created: 2025-10-20
---

Body
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'manual');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: manual');
      expect(updated).toContain('# This is a comment'); // Comments preserved
    });

    it('should handle file with Windows line endings', () => {
      const content = `---\r\nid: 40\r\napproval_method: manual\r\n---\r\n\r\nBody\r\n`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: auto');
    });

    it('should handle frontmatter with extra whitespace', () => {
      const content = `---
id:   50
approval_method:    manual
created:  2025-10-20
---

Content
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain('approval_method: auto');
    });

    it('should preserve body content exactly', () => {
      const bodyContent = `
# Important Content

- List item 1
- List item 2

## Section

More content here with **formatting**.
`;
      const content = `---
id: 60
---
${bodyContent}`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
      const updated = fs.readFileSync(testFilePath, 'utf8');
      expect(updated).toContain(bodyContent);
    });
  });

  describe('Path Resolution', () => {
    it('should handle relative paths', () => {
      const relativePath = path.relative(process.cwd(), testFilePath);
      const content = `---
id: 70
---
Test
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(relativePath, 'auto');

      expect(result.exitCode).toBe(0);
    });

    it('should handle absolute paths', () => {
      const content = `---
id: 80
---
Test
`;
      fs.writeFileSync(testFilePath, content, 'utf8');

      const result = executeScript(testFilePath, 'auto');

      expect(result.exitCode).toBe(0);
    });
  });
});
