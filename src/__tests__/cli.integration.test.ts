/**
 * CLI Integration Tests - Consolidated Edition
 *
 * Focused integration tests covering all critical CLI workflows with minimal mocking.
 * Tests real file system operations and CLI command execution in temporary directories.
 * Covers 8 core scenarios: basic functionality, single/multiple assistant init, path resolution,
 * conflict handling, error cases, template verification, and cross-platform compatibility.
 */

import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

describe('CLI Integration Tests - Consolidated', () => {
  let testDir: string;
  let originalCwd: string;
  const cliPath = path.resolve(__dirname, '../../dist/cli.js');

  beforeEach(async () => {
    // Store original working directory
    originalCwd = process.cwd();

    // Create a temporary directory for testing
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-task-test-'));

    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up test directory
    await fs.remove(testDir);
  });

  const executeCommand = (command: string): { stdout: string; stderr: string; exitCode: number } => {
    try {
      const stdout = execSync(command, {
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || '',
        exitCode: error.status || 1
      };
    }
  };

  const verifyDirectoryStructure = async (assistants: string[], customDir?: string): Promise<void> => {
    const baseDir = customDir ? path.join(testDir, customDir) : testDir;

    // Common directories
    expect(await fs.pathExists(path.join(baseDir, '.ai/task-manager'))).toBe(true);
    expect(await fs.pathExists(path.join(baseDir, '.ai/task-manager/plans'))).toBe(true);

    // Assistant-specific directories and files
    for (const assistant of assistants) {
      // Open Code uses 'command' (singular), others use 'commands' (plural)
      const commandsPath = assistant === 'opencode' ? 'command' : 'commands';
      const assistantDir = path.join(baseDir, `.${assistant}/${commandsPath}/tasks`);
      expect(await fs.pathExists(assistantDir)).toBe(true);

      const extension = assistant === 'gemini' ? 'toml' : 'md';
      const templateFiles = ['create-plan', 'execute-blueprint', 'generate-tasks'];

      for (const template of templateFiles) {
        const templatePath = path.join(assistantDir, `${template}.${extension}`);
        expect(await fs.pathExists(templatePath)).toBe(true);

        const content = await fs.readFile(templatePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      }
    }

    // Common template files
    expect(await fs.pathExists(path.join(baseDir, '.ai/task-manager/config/TASK_MANAGER.md'))).toBe(true);
    expect(await fs.pathExists(path.join(baseDir, '.ai/task-manager/config/hooks/POST_PHASE.md'))).toBe(true);
  };

  const verifyFileContent = async (assistants: string[], customDir?: string): Promise<void> => {
    const baseDir = customDir ? path.join(testDir, customDir) : testDir;

    for (const assistant of assistants) {
      if (assistant === 'claude') {
        const createPlan = await fs.readFile(
          path.join(baseDir, '.claude/commands/tasks/create-plan.md'), 'utf8'
        );
        expect(createPlan).toContain('$ARGUMENTS');
        expect(createPlan).toContain('---'); // YAML frontmatter
      } else if (assistant === 'gemini') {
        const createPlan = await fs.readFile(
          path.join(baseDir, '.gemini/commands/tasks/create-plan.toml'), 'utf8'
        );
        expect(createPlan).toContain('{{args}}');
        expect(createPlan).toContain('[metadata]');
        expect(createPlan).toContain('[prompt]');
      } else if (assistant === 'opencode') {
        const createPlan = await fs.readFile(
          path.join(baseDir, '.opencode/command/tasks/create-plan.md'), 'utf8'
        );
        expect(createPlan).toContain('$ARGUMENTS');
        expect(createPlan).toContain('---'); // YAML frontmatter
      }
    }
  };

  describe('Basic CLI Functionality', () => {
    it('should handle help, version, and error cases correctly', () => {
      // Test help output when no arguments provided - Commander.js exits with 1
      const noArgs = executeCommand(`node "${cliPath}"`);
      expect(noArgs.exitCode).toBe(1); // Commander.js behavior for missing command
      const noArgsOutput = noArgs.stdout + noArgs.stderr;
      expect(noArgsOutput).toContain('ai-task-manager');
      expect(noArgsOutput).toContain('Usage:');

      // Test explicit help flag
      const helpFlag = executeCommand(`node "${cliPath}" --help`);
      expect(helpFlag.exitCode).toBe(0);
      expect(helpFlag.stdout).toContain('ai-task-manager');
      expect(helpFlag.stdout).toContain('init');

      // Test version flag
      const versionFlag = executeCommand(`node "${cliPath}" --version`);
      expect(versionFlag.exitCode).toBe(0);
      expect(versionFlag.stdout.trim()).toBe('0.1.0');
    });
  });

  describe('Single Assistant Initialization', () => {
    it('should successfully initialize with claude and verify structure', async () => {
      const result = executeCommand(`node "${cliPath}" init --assistants claude`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      await verifyDirectoryStructure(['claude']);
      await verifyFileContent(['claude']);
    });

    it('should successfully initialize with gemini and verify TOML conversion', async () => {
      const result = executeCommand(`node "${cliPath}" init --assistants gemini`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      await verifyDirectoryStructure(['gemini']);
      await verifyFileContent(['gemini']);

      // Verify TOML-specific content structure
      const createPlan = await fs.readFile(path.join(testDir, '.gemini/commands/tasks/create-plan.toml'), 'utf8');
      expect(createPlan).toContain('content = """');
      expect(createPlan).toContain('argument-hint = "{{args}}"');
      expect(createPlan).not.toContain('$ARGUMENTS'); // Should be converted
    });

    it('should successfully initialize with opencode and verify Markdown format preservation', async () => {
      const result = executeCommand(`node "${cliPath}" init --assistants opencode`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      await verifyDirectoryStructure(['opencode']);
      await verifyFileContent(['opencode']);

      // Verify Open Code preserves Markdown format (like Claude)
      const createPlan = await fs.readFile(path.join(testDir, '.opencode/command/tasks/create-plan.md'), 'utf8');
      expect(createPlan).toContain('$ARGUMENTS'); // Should preserve original format
      expect(createPlan).toContain('---'); // YAML frontmatter
      expect(createPlan).toContain('argument-hint: [user-prompt]');
      expect(createPlan).not.toContain('{{args}}'); // Should NOT be converted to TOML format
      expect(createPlan).not.toContain('[metadata]'); // Should NOT have TOML sections
    });
  });

  describe('Multiple Assistant and Edge Cases', () => {
    it('should handle multiple assistants with proper format conversion', async () => {
      const result = executeCommand(`node "${cliPath}" init --assistants claude,gemini`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      await verifyDirectoryStructure(['claude', 'gemini']);
      await verifyFileContent(['claude', 'gemini']);

      // Verify no cross-contamination between formats
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.toml'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.md'))).toBe(false);
    });

    it('should handle mixed assistants including opencode with correct format isolation', async () => {
      const result = executeCommand(`node "${cliPath}" init --assistants claude,opencode,gemini`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      await verifyDirectoryStructure(['claude', 'opencode', 'gemini']);
      await verifyFileContent(['claude', 'opencode', 'gemini']);

      // Verify format isolation: each assistant gets its own format
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.opencode/command/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.toml'))).toBe(true);

      // Verify no cross-contamination
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.toml'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.opencode/command/tasks/create-plan.toml'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.md'))).toBe(false);
    });

    it('should handle opencode with other assistants and verify content integrity', async () => {
      const result = executeCommand(`node "${cliPath}" init --assistants opencode,gemini`);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      await verifyDirectoryStructure(['opencode', 'gemini']);
      await verifyFileContent(['opencode', 'gemini']);

      // Verify Open Code content format is preserved as Markdown
      const opencodeContent = await fs.readFile(path.join(testDir, '.opencode/command/tasks/create-plan.md'), 'utf8');
      expect(opencodeContent).toContain('$ARGUMENTS');
      expect(opencodeContent).not.toContain('{{args}}');

      // Verify Gemini content format is converted to TOML
      const geminiContent = await fs.readFile(path.join(testDir, '.gemini/commands/tasks/create-plan.toml'), 'utf8');
      expect(geminiContent).toContain('{{args}}');
      expect(geminiContent).not.toContain('$ARGUMENTS');
    });

    it('should handle input variations (whitespace, duplicates)', async () => {
      // Test whitespace handling
      const whitespace = executeCommand(`node "${cliPath}" init --assistants " claude , gemini "`);
      expect(whitespace.exitCode).toBe(0);
      await verifyDirectoryStructure(['claude', 'gemini']);

      // Clean up for next test
      await fs.remove(path.join(testDir, '.ai'));
      await fs.remove(path.join(testDir, '.claude'));
      await fs.remove(path.join(testDir, '.gemini'));

      // Test duplicate handling
      const duplicates = executeCommand(`node "${cliPath}" init --assistants claude,claude,gemini,gemini`);
      expect(duplicates.exitCode).toBe(0);
      await verifyDirectoryStructure(['claude', 'gemini']);
    });

    it('should handle opencode with whitespace and duplicates', async () => {
      // Test whitespace handling with Open Code
      const whitespace = executeCommand(`node "${cliPath}" init --assistants " opencode , claude "`);
      expect(whitespace.exitCode).toBe(0);
      await verifyDirectoryStructure(['opencode', 'claude']);

      // Clean up for next test
      await fs.remove(path.join(testDir, '.ai'));
      await fs.remove(path.join(testDir, '.opencode'));
      await fs.remove(path.join(testDir, '.claude'));

      // Test duplicate handling with Open Code
      const duplicates = executeCommand(`node "${cliPath}" init --assistants opencode,opencode,claude,opencode`);
      expect(duplicates.exitCode).toBe(0);
      await verifyDirectoryStructure(['opencode', 'claude']);
    });
  });

  describe('Path Resolution and Directory Handling', () => {
    it('should handle custom destination directories correctly', async () => {
      const customDir = 'custom-project';
      const result = executeCommand(`node "${cliPath}" init --assistants claude --destination-directory ${customDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      // Verify creation in custom directory
      await verifyDirectoryStructure(['claude'], customDir);

      // Verify NOT created in current directory
      expect(await fs.pathExists(path.join(testDir, '.ai'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(false);
    });

    it('should handle opencode with custom destination directories', async () => {
      const customDir = 'opencode-project';
      const result = executeCommand(`node "${cliPath}" init --assistants opencode --destination-directory ${customDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      // Verify creation in custom directory
      await verifyDirectoryStructure(['opencode'], customDir);

      // Verify NOT created in current directory
      expect(await fs.pathExists(path.join(testDir, '.ai'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.opencode'))).toBe(false);

      // Verify Open Code directory structure and format
      const baseDir = path.join(testDir, customDir);
      const opencodeDir = path.join(baseDir, '.opencode/command/tasks');
      expect(await fs.pathExists(opencodeDir)).toBe(true);

      const createPlan = await fs.readFile(path.join(opencodeDir, 'create-plan.md'), 'utf8');
      expect(createPlan).toContain('$ARGUMENTS');
      expect(createPlan).toContain('---');
    });

    it('should handle complex path scenarios', async () => {
      // Test nested paths
      const nestedDir = 'level1/level2/nested-project';
      const nestedResult = executeCommand(`node "${cliPath}" init --assistants claude --destination-directory ${nestedDir}`);
      expect(nestedResult.exitCode).toBe(0);
      await verifyDirectoryStructure(['claude'], nestedDir);

      // Test absolute paths
      const absoluteDir = path.join(testDir, 'absolute-project');
      const absoluteResult = executeCommand(`node "${cliPath}" init --assistants gemini --destination-directory "${absoluteDir}"`);
      expect(absoluteResult.exitCode).toBe(0);
      await verifyDirectoryStructure(['gemini'], 'absolute-project');

      // Test paths with spaces
      const spacedDir = 'project with spaces';
      const spacedResult = executeCommand(`node "${cliPath}" init --assistants claude --destination-directory "${spacedDir}"`);
      expect(spacedResult.exitCode).toBe(0);
      await verifyDirectoryStructure(['claude'], spacedDir);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle all input validation errors correctly', () => {
      // Missing --assistants flag - Commander handles this with exit code 1
      const missingFlag = executeCommand(`node "${cliPath}" init`);
      expect(missingFlag.exitCode).toBe(1); // Commander.js exits with 1 for missing required option
      expect(missingFlag.stderr).toContain('required option');
      expect(missingFlag.stderr).toContain('--assistants');

      // Invalid assistant
      const invalidAssistant = executeCommand(`node "${cliPath}" init --assistants invalid`);
      expect(invalidAssistant.exitCode).toBe(1);
      const errorOutput = invalidAssistant.stdout + invalidAssistant.stderr;
      expect(errorOutput).toContain('Invalid assistant');
      expect(errorOutput).toMatch(/claude|gemini|opencode/);

      // Partially invalid assistants
      const partiallyInvalid = executeCommand(`node "${cliPath}" init --assistants claude,invalid,gemini`);
      expect(partiallyInvalid.exitCode).toBe(1);
      const partialOutput = partiallyInvalid.stdout + partiallyInvalid.stderr;
      expect(partialOutput).toContain('Invalid assistant');
      expect(partialOutput).toContain('invalid');

      // Empty assistants value
      const emptyValue = executeCommand(`node "${cliPath}" init --assistants ""`);
      expect(emptyValue.exitCode).toBe(1);
      const emptyOutput = emptyValue.stdout + emptyValue.stderr;
      expect(emptyOutput).toContain('cannot be empty');
    });
  });

  describe('Template Content Verification', () => {
    it('should verify template files have correct structure and content', async () => {
      executeCommand(`node "${cliPath}" init --assistants claude,gemini`);

      // Verify common template files
      const taskManagerInfo = await fs.readFile(
        path.join(testDir, '.ai/task-manager/config/TASK_MANAGER.md'), 'utf8'
      );
      expect(taskManagerInfo).toContain('# Task Manager General Information');

      const validationGates = await fs.readFile(
        path.join(testDir, '.ai/task-manager/config/hooks/POST_PHASE.md'), 'utf8'
      );
      expect(validationGates).toContain('Ensure that:');

      // Verify Claude MD template structure
      const claudeCreatePlan = await fs.readFile(
        path.join(testDir, '.claude/commands/tasks/create-plan.md'), 'utf8'
      );
      expect(claudeCreatePlan).toContain('---'); // YAML frontmatter
      expect(claudeCreatePlan).toContain('$ARGUMENTS');
      expect(claudeCreatePlan).toContain('argument-hint: [user-prompt]');

      // Verify Gemini TOML template structure and conversion
      const geminiCreatePlan = await fs.readFile(
        path.join(testDir, '.gemini/commands/tasks/create-plan.toml'), 'utf8'
      );
      expect(geminiCreatePlan).toContain('[metadata]');
      expect(geminiCreatePlan).toContain('[prompt]');
      expect(geminiCreatePlan).toContain('{{args}}');
      expect(geminiCreatePlan).toContain('argument-hint = "{{args}}"');
      expect(geminiCreatePlan).not.toContain('$ARGUMENTS'); // Should be converted
      // Note: TOML can contain '---' in content, so we just check it has TOML structure

      // Verify TOML escaping and format
      expect(geminiCreatePlan).toContain('content = """');
      const contentStart = geminiCreatePlan.indexOf('content = """') + 'content = """'.length;
      const contentEnd = geminiCreatePlan.lastIndexOf('"""');
      const content = geminiCreatePlan.substring(contentStart, contentEnd);
      expect(content).not.toContain('"""'); // No nested triple quotes
    });

    it('should verify opencode template structure matches Markdown format', async () => {
      executeCommand(`node "${cliPath}" init --assistants opencode,claude`);

      // Verify Open Code MD template structure (same format as Claude)
      const opencodeCreatePlan = await fs.readFile(
        path.join(testDir, '.opencode/command/tasks/create-plan.md'), 'utf8'
      );
      expect(opencodeCreatePlan).toContain('---'); // YAML frontmatter
      expect(opencodeCreatePlan).toContain('$ARGUMENTS');
      expect(opencodeCreatePlan).toContain('argument-hint: [user-prompt]');

      // Verify Open Code template is identical to Claude template (both Markdown)
      const claudeCreatePlan = await fs.readFile(
        path.join(testDir, '.claude/commands/tasks/create-plan.md'), 'utf8'
      );
      expect(opencodeCreatePlan).toBe(claudeCreatePlan);

      // Verify all template files for Open Code
      const templates = ['create-plan', 'execute-blueprint', 'generate-tasks'];
      for (const template of templates) {
        const opencodeTemplatePath = path.join(testDir, `.opencode/command/tasks/${template}.md`);
        const claudeTemplatePath = path.join(testDir, `.claude/commands/tasks/${template}.md`);

        expect(await fs.pathExists(opencodeTemplatePath)).toBe(true);
        expect(await fs.pathExists(claudeTemplatePath)).toBe(true);

        const opencodeContent = await fs.readFile(opencodeTemplatePath, 'utf8');
        const claudeContent = await fs.readFile(claudeTemplatePath, 'utf8');

        // Both should be identical (Markdown format)
        expect(opencodeContent).toBe(claudeContent);
        expect(opencodeContent).toContain('---'); // YAML frontmatter
        expect(opencodeContent).not.toContain('[metadata]'); // Not TOML
      }
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle different path separators and cross-platform scenarios', async () => {
      executeCommand(`node "${cliPath}" init --assistants claude`);

      // Verify directories exist regardless of platform path separator
      const aiDir = path.join(testDir, '.ai', 'task-manager');
      const claudeDir = path.join(testDir, '.claude', 'commands', 'tasks');

      expect(await fs.pathExists(aiDir)).toBe(true);
      expect(await fs.pathExists(claudeDir)).toBe(true);

      // Check file accessibility with different path styles
      const taskFile = path.join(testDir, '.claude', 'commands', 'tasks', 'create-plan.md');
      expect(await fs.pathExists(taskFile)).toBe(true);

      const content = await fs.readFile(taskFile, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/); // No binary data
      expect(content).toMatch(/\n/); // Proper line endings
    });
  });

  describe('Conflict Resolution and Robustness', () => {
    it('should handle existing directories gracefully and verify successful execution', async () => {
      // First initialization
      const firstResult = executeCommand(`node "${cliPath}" init --assistants claude`);
      expect(firstResult.exitCode).toBe(0);
      expect(firstResult.stdout).toContain('AI Task Manager initialized successfully!');

      await verifyDirectoryStructure(['claude']);

      // Second initialization should also succeed (overwrite/merge scenario)
      const secondResult = executeCommand(`node "${cliPath}" init --assistants gemini`);
      expect(secondResult.exitCode).toBe(0);
      expect(secondResult.stdout).toContain('AI Task Manager initialized successfully!');

      // Should have both assistants now
      await verifyDirectoryStructure(['claude', 'gemini']);
    });

    it('should handle filesystem permission scenarios gracefully', async () => {
      // Test with non-existent parent directory (should create it)
      const result = executeCommand(`node "${cliPath}" init --assistants claude --destination-directory does-not-exist/child-dir`);
      expect(result.exitCode).toBe(0);

      // Verify parent directories were created
      expect(await fs.pathExists(path.join(testDir, 'does-not-exist'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, 'does-not-exist/child-dir'))).toBe(true);
      await verifyDirectoryStructure(['claude'], 'does-not-exist/child-dir');
    });
  });

  describe('Comprehensive End-to-End Workflow', () => {
    it('should complete full workflow with all assistants and verify comprehensive functionality', async () => {
      // Test complete workflow: multiple assistants + custom directory + comprehensive verification
      const customDir = 'complete-test-project';
      const result = executeCommand(`node "${cliPath}" init --assistants claude,gemini --destination-directory "${customDir}"`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      // Comprehensive directory structure verification
      await verifyDirectoryStructure(['claude', 'gemini'], customDir);
      await verifyFileContent(['claude', 'gemini'], customDir);

      const baseDir = path.join(testDir, customDir);

      // Verify template variable conversion works correctly across all files
      const templates = ['create-plan', 'execute-blueprint', 'generate-tasks'];
      const variableTests = [
        { template: 'create-plan', claudeVar: '$ARGUMENTS', geminiVar: '{{args}}' },
        { template: 'execute-blueprint', claudeVar: '$1', geminiVar: '{{plan_id}}' },
        { template: 'generate-tasks', claudeVar: '$1', geminiVar: '{{plan_id}}' }
      ];

      for (const test of variableTests) {
        const claudeContent = await fs.readFile(
          path.join(baseDir, `.claude/commands/tasks/${test.template}.md`), 'utf8'
        );
        const geminiContent = await fs.readFile(
          path.join(baseDir, `.gemini/commands/tasks/${test.template}.toml`), 'utf8'
        );

        expect(claudeContent).toContain(test.claudeVar);
        expect(geminiContent).toContain(test.geminiVar);
        expect(geminiContent).not.toContain(test.claudeVar);
      }

      // Verify no files were created in current directory
      expect(await fs.pathExists(path.join(testDir, '.ai'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.gemini'))).toBe(false);
    });

    it('should complete comprehensive workflow with all three assistants including opencode', async () => {
      // Test complete workflow with all assistants: claude, gemini, and opencode
      const customDir = 'all-assistants-project';
      const result = executeCommand(`node "${cliPath}" init --assistants claude,opencode,gemini --destination-directory "${customDir}"`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('AI Task Manager initialized successfully!');

      // Comprehensive directory structure verification for all three assistants
      await verifyDirectoryStructure(['claude', 'opencode', 'gemini'], customDir);
      await verifyFileContent(['claude', 'opencode', 'gemini'], customDir);

      const baseDir = path.join(testDir, customDir);

      // Verify template variable handling for all assistants
      const templates = ['create-plan', 'execute-blueprint', 'generate-tasks'];
      const variableTests = [
        { template: 'create-plan', markdownVar: '$ARGUMENTS', tomlVar: '{{args}}' },
        { template: 'execute-blueprint', markdownVar: '$1', tomlVar: '{{plan_id}}' },
        { template: 'generate-tasks', markdownVar: '$1', tomlVar: '{{plan_id}}' }
      ];

      for (const test of variableTests) {
        // Claude and Open Code should have identical Markdown format
        const claudeContent = await fs.readFile(
          path.join(baseDir, `.claude/commands/tasks/${test.template}.md`), 'utf8'
        );
        const opencodeContent = await fs.readFile(
          path.join(baseDir, `.opencode/command/tasks/${test.template}.md`), 'utf8'
        );
        const geminiContent = await fs.readFile(
          path.join(baseDir, `.gemini/commands/tasks/${test.template}.toml`), 'utf8'
        );

        // Claude and Open Code should be identical (both Markdown)
        expect(claudeContent).toBe(opencodeContent);
        expect(claudeContent).toContain(test.markdownVar);
        expect(opencodeContent).toContain(test.markdownVar);

        // Gemini should have converted variables (TOML format)
        expect(geminiContent).toContain(test.tomlVar);
        expect(geminiContent).not.toContain(test.markdownVar);
      }

      // Verify proper format isolation: no cross-contamination
      expect(await fs.pathExists(path.join(baseDir, '.claude/commands/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(baseDir, '.opencode/command/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(baseDir, '.gemini/commands/tasks/create-plan.toml'))).toBe(true);

      expect(await fs.pathExists(path.join(baseDir, '.claude/commands/tasks/create-plan.toml'))).toBe(false);
      expect(await fs.pathExists(path.join(baseDir, '.opencode/command/tasks/create-plan.toml'))).toBe(false);
      expect(await fs.pathExists(path.join(baseDir, '.gemini/commands/tasks/create-plan.md'))).toBe(false);

      // Verify no files were created in current directory
      expect(await fs.pathExists(path.join(testDir, '.ai'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.opencode'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.gemini'))).toBe(false);
    });
  });
});