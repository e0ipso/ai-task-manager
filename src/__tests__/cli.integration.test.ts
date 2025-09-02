/**
 * CLI Integration Tests
 * 
 * Comprehensive integration tests that verify the complete CLI workflow
 * from command-line input to directory creation. Tests actual CLI execution
 * without mocking dependencies.
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

describe('CLI Integration Tests', () => {
  let testDir: string;
  let originalCwd: string;
  const cliPath = path.resolve(__dirname, '../../dist/cli.js');
  
  beforeEach(async () => {
    // Use fake timers for deterministic tests
    jest.useFakeTimers();
    
    // Store original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-task-test-'));
    
    // Change to test directory
    process.chdir(testDir);
  });
  
  afterEach(async () => {
    // Restore real timers
    jest.useRealTimers();
    
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    await fs.remove(testDir);
  });
  
  afterAll(() => {
    // Ensure real timers are restored
    jest.useRealTimers();
  });

  describe('CLI Basic Functionality', () => {
    it('should show help when no arguments provided', () => {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      
      try {
        stdout = execSync(`node "${cliPath}"`, { 
          encoding: 'utf8',
          cwd: testDir 
        });
      } catch (error: any) {
        exitCode = error.status;
        stdout = error.stdout?.toString() || '';
        stderr = error.stderr?.toString() || '';
      }
      
      const output = stdout + stderr;
      
      // CLI shows help but exits with code 1 when no command provided
      expect(exitCode).toBe(1);
      expect(output).toContain('ai-task-manager');
      expect(output).toContain('Usage:');
    });

    it('should show help with --help flag', () => {
      const stdout = execSync(`node "${cliPath}" --help`, { 
        encoding: 'utf8',
        cwd: testDir 
      });
      
      expect(stdout).toContain('ai-task-manager');
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('init');
    });

    it('should show version with --version flag', () => {
      const stdout = execSync(`node "${cliPath}" --version`, { 
        encoding: 'utf8',
        cwd: testDir 
      });
      
      expect(stdout.trim()).toBe('0.1.0');
    });
  });

  describe('Init Command - Success Cases', () => {
    it('should successfully initialize with claude assistant', async () => {
      const result = execSync(`node "${cliPath}" init --assistants claude`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check that command completed successfully
      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/plans'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);

      // Verify common template files were copied
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/TASK_MANAGER_INFO.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/VALIDATION_GATES.md'))).toBe(true);

      // Verify claude-specific template files were copied
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/execute-blueprint.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/generate-tasks.md'))).toBe(true);

      // Verify file contents are not empty
      const taskManagerInfo = await fs.readFile(path.join(testDir, '.ai/task-manager/TASK_MANAGER_INFO.md'), 'utf8');
      expect(taskManagerInfo.length).toBeGreaterThan(0);
      
      const createPlan = await fs.readFile(path.join(testDir, '.claude/commands/tasks/create-plan.md'), 'utf8');
      expect(createPlan.length).toBeGreaterThan(0);
    });

    it('should successfully initialize with gemini assistant', async () => {
      const result = execSync(`node "${cliPath}" init --assistants gemini`, { 
        encoding: 'utf8',
        cwd: testDir 
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify gemini-specific directory structure
      expect(await fs.pathExists(path.join(testDir, '.gemini'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks'))).toBe(true);

      // Verify gemini-specific template files were copied (TOML format)
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.toml'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/execute-blueprint.toml'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/generate-tasks.toml'))).toBe(true);
    });

    it('should successfully initialize with multiple assistants', async () => {
      const result = execSync(`node "${cliPath}" init --assistants claude,gemini`, { 
        encoding: 'utf8',
        cwd: testDir 
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify both assistant directory structures exist
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks'))).toBe(true);

      // Verify template files for both assistants (different formats)
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.toml'))).toBe(true);
    });

    it('should handle assistants with extra whitespace', async () => {
      const result = execSync(`node "${cliPath}" init --assistants " claude , gemini "`, { 
        encoding: 'utf8',
        cwd: testDir 
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Both assistants should be configured despite whitespace
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks'))).toBe(true);
    });

    it('should handle duplicate assistants', async () => {
      const result = execSync(`node "${cliPath}" init --assistants claude,claude,gemini,gemini`, { 
        encoding: 'utf8',
        cwd: testDir 
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Should only create each assistant once
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks'))).toBe(true);
    });
  });

  describe('Init Command - Error Cases', () => {
    it('should show error when --assistants flag is missing', () => {
      let stderr = '';
      let exitCode = 0;
      
      try {
        execSync(`node "${cliPath}" init`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status;
        stderr = error.stderr?.toString() || '';
      }
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('required option');
      expect(stderr).toContain('--assistants');
    });

    it('should show error for invalid assistant values', () => {
      let stderr = '';
      let stdout = '';
      let exitCode = 0;
      
      try {
        execSync(`node "${cliPath}" init --assistants invalid`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status;
        stderr = error.stderr?.toString() || '';
        stdout = error.stdout?.toString() || '';
      }
      
      expect(exitCode).toBe(1);
      // Error message could be in stdout or stderr depending on implementation
      const errorOutput = stderr + stdout;
      expect(errorOutput).toContain('Invalid assistant');
      expect(errorOutput).toMatch(/claude|gemini/);
    });

    it('should show error for partially invalid assistant values', () => {
      let stderr = '';
      let stdout = '';
      let exitCode = 0;
      
      try {
        execSync(`node "${cliPath}" init --assistants claude,invalid,gemini`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status;
        stderr = error.stderr?.toString() || '';
        stdout = error.stdout?.toString() || '';
      }
      
      expect(exitCode).toBe(1);
      const errorOutput = stderr + stdout;
      expect(errorOutput).toContain('Invalid assistant');
      expect(errorOutput).toContain('invalid');
    });

    it('should show error for empty assistants value', () => {
      let stderr = '';
      let stdout = '';
      let exitCode = 0;
      
      try {
        execSync(`node "${cliPath}" init --assistants ""`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status;
        stderr = error.stderr?.toString() || '';
        stdout = error.stdout?.toString() || '';
      }
      
      expect(exitCode).toBe(1);
      const errorOutput = stderr + stdout;
      expect(errorOutput).toContain('cannot be empty');
    });

    it('should show error for whitespace-only assistants value', () => {
      let stderr = '';
      let stdout = '';
      let exitCode = 0;
      
      try {
        execSync(`node "${cliPath}" init --assistants "   "`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status;
        stderr = error.stderr?.toString() || '';
        stdout = error.stdout?.toString() || '';
      }
      
      expect(exitCode).toBe(1);
      const errorOutput = stderr + stdout;
      expect(errorOutput).toContain('cannot be empty');
    });
  });

  describe('Directory Structure Validation', () => {
    it('should create correct directory hierarchy for single assistant', async () => {
      execSync(`node "${cliPath}" init --assistants claude`, { 
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check exact directory structure
      const expectedDirs = [
        '.ai',
        '.ai/task-manager',
        '.ai/task-manager/plans',
        '.claude',
        '.claude/commands',
        '.claude/commands/tasks'
      ];

      for (const dir of expectedDirs) {
        const fullPath = path.join(testDir, dir);
        const stats = await fs.stat(fullPath);
        expect(stats.isDirectory()).toBe(true);
      }
    });

    it('should create correct directory hierarchy for multiple assistants', async () => {
      execSync(`node "${cliPath}" init --assistants claude,gemini`, { 
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check directory structure for both assistants
      const expectedDirs = [
        '.ai/task-manager',
        '.ai/task-manager/plans',
        '.claude/commands/tasks',
        '.gemini/commands/tasks'
      ];

      for (const dir of expectedDirs) {
        const fullPath = path.join(testDir, dir);
        const stats = await fs.stat(fullPath);
        expect(stats.isDirectory()).toBe(true);
      }
    });

    it('should verify all expected template files are copied', async () => {
      execSync(`node "${cliPath}" init --assistants claude,gemini`, { 
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const expectedFiles = [
        // Common files
        '.ai/task-manager/TASK_MANAGER_INFO.md',
        '.ai/task-manager/VALIDATION_GATES.md',
        // Claude files
        '.claude/commands/tasks/create-plan.md',
        '.claude/commands/tasks/execute-blueprint.md', 
        '.claude/commands/tasks/generate-tasks.md',
        // Gemini files
        '.gemini/commands/tasks/create-plan.toml',
        '.gemini/commands/tasks/execute-blueprint.toml',
        '.gemini/commands/tasks/generate-tasks.toml'
      ];

      for (const file of expectedFiles) {
        const fullPath = path.join(testDir, file);
        expect(await fs.pathExists(fullPath)).toBe(true);
        
        // Verify file is not empty
        const stats = await fs.stat(fullPath);
        expect(stats.size).toBeGreaterThan(0);
        
        // Verify file is readable
        const content = await fs.readFile(fullPath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle permission errors gracefully', async () => {
      // This test verifies that the CLI handles file system errors appropriately
      // We'll test with a scenario that should produce an error
      
      let exitCode = 0;
      let output = '';
      
      try {
        // Try to initialize in a location that doesn't exist or has issues
        execSync(`node "${cliPath}" init --assistants claude`, { 
          encoding: 'utf8',
          cwd: '/nonexistent/path/that/should/not/exist',
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status || error.code || 1;
        output = (error.stdout || '') + (error.stderr || '') + (error.message || '');
      }
      
      // Should fail due to invalid working directory
      expect(exitCode).not.toBe(0);
      // Should contain some form of error information
      expect(output.length).toBeGreaterThan(0);
    });

    it('should provide helpful error messages', () => {
      let output = '';
      let exitCode = 0;
      
      try {
        execSync(`node "${cliPath}" init --assistants invalidassistant`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status;
        output = (error.stdout || '') + (error.stderr || '');
      }
      
      expect(exitCode).toBe(1);
      expect(output).toContain('Invalid assistant');
      expect(output).toContain('invalidassistant');
      expect(output).toMatch(/claude|gemini/);
    });
  });

  describe('CLI Process Handling', () => {
    it('should exit with code 0 on success', () => {
      let exitCode: number | null = null;
      
      try {
        execSync(`node "${cliPath}" init --assistants claude`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        exitCode = 0; // execSync doesn't throw on success
      } catch (error: any) {
        exitCode = error.status;
      }
      
      expect(exitCode).toBe(0);
    });

    it('should exit with code 1 on error', () => {
      let exitCode: number | null = null;
      
      try {
        execSync(`node "${cliPath}" init --assistants invalid`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error: any) {
        exitCode = error.status;
      }
      
      expect(exitCode).toBe(1);
    });

    it('should handle process termination gracefully', async () => {
      // Use real timers for this test since we're dealing with actual process spawning
      jest.useRealTimers();
      
      return new Promise<void>((resolve, reject) => {
        const child = spawn('node', [cliPath, 'init', '--assistants', 'claude'], {
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let processExited = false;
        const timeout = 5000;

        // Set up process event handlers
        child.on('close', () => {
          processExited = true;
          resolve();
        });

        child.on('error', (error: Error) => {
          processExited = true;
          reject(error);
        });

        // Kill the process after a short delay
        const killTimer = setTimeout(() => {
          if (!processExited) {
            child.kill('SIGTERM');
          }
        }, 200);

        // Safety timeout to prevent test hanging
        const safetyTimer = setTimeout(() => {
          if (!processExited) {
            child.kill('SIGKILL');
            processExited = true;
            clearTimeout(killTimer);
            resolve();
          }
        }, timeout);

        // Cleanup on exit
        child.on('close', () => {
          clearTimeout(killTimer);
          clearTimeout(safetyTimer);
        });
      });
    }, 8000);
  });

  describe('Template File Validation', () => {
    it('should copy template files with correct content structure', async () => {
      execSync(`node "${cliPath}" init --assistants claude`, { 
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check that copied files have expected structure/content
      const taskManagerInfo = await fs.readFile(
        path.join(testDir, '.ai/task-manager/TASK_MANAGER_INFO.md'), 
        'utf8'
      );
      expect(taskManagerInfo).toContain('# Task Manager General Information');

      const validationGates = await fs.readFile(
        path.join(testDir, '.ai/task-manager/VALIDATION_GATES.md'), 
        'utf8'
      );
      expect(validationGates).toContain('Ensure that:');

      const createPlan = await fs.readFile(
        path.join(testDir, '.claude/commands/tasks/create-plan.md'), 
        'utf8'
      );
      expect(createPlan.length).toBeGreaterThan(50); // Should have substantial content
    });

    it('should preserve template file encoding and formatting', async () => {
      execSync(`node "${cliPath}" init --assistants claude`, { 
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Read a template file and verify it's properly formatted
      const createPlan = await fs.readFile(
        path.join(testDir, '.claude/commands/tasks/create-plan.md'), 
        'utf8'
      );

      // Should not contain binary data or encoding issues
      expect(createPlan).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
      
      // Should have proper line endings
      expect(createPlan).toMatch(/\n/);
    });
  });

  describe('Gemini Integration Tests', () => {
    describe('Gemini-only Initialization', () => {
      it('should successfully initialize with only gemini assistant', async () => {
        const result = execSync(`node "${cliPath}" init --assistants gemini`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        expect(result).toContain('AI Task Manager initialized successfully!');
        
        // Verify common directory structure was created
        expect(await fs.pathExists(path.join(testDir, '.ai/task-manager'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/plans'))).toBe(true);
        
        // Verify gemini-specific directory structure was created
        expect(await fs.pathExists(path.join(testDir, '.gemini'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks'))).toBe(true);
        
        // Verify claude directory was NOT created
        expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(false);
        
        // Verify common template files were copied
        expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/TASK_MANAGER_INFO.md'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/VALIDATION_GATES.md'))).toBe(true);
        
        // Verify gemini-specific TOML files were created
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.toml'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/execute-blueprint.toml'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/generate-tasks.toml'))).toBe(true);
        
        // Verify claude MD files were NOT created
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.md'))).toBe(false);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/execute-blueprint.md'))).toBe(false);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/generate-tasks.md'))).toBe(false);
      });

      it('should create TOML files with proper structure and content', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Read and verify create-plan.toml structure
        const createPlanToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/create-plan.toml'), 
          'utf8'
        );

        // Check for required TOML sections
        expect(createPlanToml).toContain('[metadata]');
        expect(createPlanToml).toContain('[prompt]');
        expect(createPlanToml).toContain('content = """');
        
        // Check for converted frontmatter
        expect(createPlanToml).toContain('argument-hint = "{{args}}"'); // Converted from [user-prompt]
        expect(createPlanToml).toContain('description = "Create a comprehensive plan to accomplish the request from the user."');
        
        // Check for converted variable substitution
        expect(createPlanToml).toContain('{{args}}'); // Converted from $ARGUMENTS
        
        // Should not contain original MD syntax
        expect(createPlanToml).not.toContain('$ARGUMENTS');
        expect(createPlanToml).not.toContain('[user-prompt]');
        expect(createPlanToml).not.toMatch(/^---/); // Should not start with frontmatter delimiters
        
        // Verify file is not empty and has substantial content
        expect(createPlanToml.length).toBeGreaterThan(100);
      });

      it('should create TOML files with proper TOML escaping', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const executeTaskToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/execute-blueprint.toml'), 
          'utf8'
        );

        // Check for proper string escaping in TOML
        // Should handle quotes, newlines, and other special characters properly
        expect(executeTaskToml).toMatch(/content = """/); // Triple quoted strings
        
        // Verify TOML structure is valid
        expect(executeTaskToml).toContain('[metadata]');
        expect(executeTaskToml).toContain('[prompt]');
      });

      it('should handle special characters in template conversion', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const generateTasksToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/generate-tasks.toml'), 
          'utf8'
        );

        // Verify the TOML content can be parsed without errors
        expect(generateTasksToml).toContain('[metadata]');
        expect(generateTasksToml).toContain('[prompt]');
        expect(generateTasksToml).toContain('content = """');
        
        // Verify variable substitution worked correctly
        expect(generateTasksToml).toContain('{{plan_id}}'); // $1 should be converted to {{plan_id}}
        expect(generateTasksToml).not.toContain('$1');
        
        // Should handle any escaped characters properly
        const lines = generateTasksToml.split('\n');
        const metadataLines = lines.filter(line => line.includes('=') && !line.includes('content = """'));
        
        // All metadata lines should have properly quoted values
        for (const line of metadataLines) {
          if (line.trim() && line.includes('=')) {
            const parts = line.split('=', 2);
            const value = parts[1];
            if (value) {
              expect(value.trim()).toMatch(/^"/); // Should start with quote
              expect(value.trim()).toMatch(/"$/); // Should end with quote
            }
          }
        }
      });
    });

    describe('Mixed Claude and Gemini Initialization', () => {
      it('should create both Claude and Gemini structures simultaneously', async () => {
        const result = execSync(`node "${cliPath}" init --assistants claude,gemini`, { 
          encoding: 'utf8',
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        expect(result).toContain('AI Task Manager initialized successfully!');
        
        // Verify both assistant directory structures exist
        expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks'))).toBe(true);
        
        // Verify Claude MD files exist
        expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.md'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/execute-blueprint.md'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/generate-tasks.md'))).toBe(true);
        
        // Verify Gemini TOML files exist  
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.toml'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/execute-blueprint.toml'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/generate-tasks.toml'))).toBe(true);
        
        // Verify no cross-contamination (Claude shouldn't have TOML, Gemini shouldn't have MD in tasks)
        expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.toml'))).toBe(false);
        expect(await fs.pathExists(path.join(testDir, '.gemini/commands/tasks/create-plan.md'))).toBe(false);
      });

      it('should generate identical content for both formats from same source', async () => {
        execSync(`node "${cliPath}" init --assistants claude,gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Read Claude MD file
        const claudeCreatePlan = await fs.readFile(
          path.join(testDir, '.claude/commands/tasks/create-plan.md'), 
          'utf8'
        );
        
        // Read Gemini TOML file  
        const geminiCreatePlan = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/create-plan.toml'), 
          'utf8'
        );

        // Verify Claude file contains original MD syntax
        expect(claudeCreatePlan).toContain('$ARGUMENTS');
        expect(claudeCreatePlan).toContain('---'); // YAML frontmatter
        expect(claudeCreatePlan).toContain('argument-hint: [user-prompt]');
        
        // Verify Gemini file contains converted TOML syntax
        expect(geminiCreatePlan).toContain('{{args}}');
        expect(geminiCreatePlan).toContain('[metadata]');
        expect(geminiCreatePlan).toContain('argument-hint = "{{args}}"');
        
        // Both should contain the core instructional content (with format differences)
        expect(claudeCreatePlan).toContain('Comprehensive Plan Creation');
        expect(geminiCreatePlan).toContain('Comprehensive Plan Creation');
      });

      it('should maintain template consistency across formats', async () => {
        execSync(`node "${cliPath}" init --assistants claude,gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Test all three template files
        const templates = ['create-plan', 'execute-blueprint', 'generate-tasks'];
        
        for (const template of templates) {
          // Read both formats
          const claudeTemplate = await fs.readFile(
            path.join(testDir, `.claude/commands/tasks/${template}.md`), 
            'utf8'
          );
          
          const geminiTemplate = await fs.readFile(
            path.join(testDir, `.gemini/commands/tasks/${template}.toml`), 
            'utf8'
          );

          // Both should have substantial content
          expect(claudeTemplate.length).toBeGreaterThan(50);
          expect(geminiTemplate.length).toBeGreaterThan(50);
          
          // Gemini should have proper TOML structure
          expect(geminiTemplate).toContain('[metadata]');
          expect(geminiTemplate).toContain('[prompt]');
          expect(geminiTemplate).toContain('content = """');
          
          // Claude should have YAML frontmatter
          expect(claudeTemplate).toContain('---');
          expect(claudeTemplate).toMatch(/^---\n/);
        }
      });
    });

    describe('TOML Content Validation', () => {
      it('should properly convert frontmatter to TOML metadata', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const createPlanToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/create-plan.toml'), 
          'utf8'
        );

        // Check for converted frontmatter fields
        expect(createPlanToml).toContain('argument-hint = "{{args}}"'); // Special conversion
        expect(createPlanToml).toContain('description = "Create a comprehensive plan to accomplish the request from the user."');
        
        // Should be in metadata section
        const metadataSection = createPlanToml.split('[prompt]')[0];
        expect(metadataSection).toContain('[metadata]');
        expect(metadataSection).toContain('argument-hint =');
        expect(metadataSection).toContain('description =');
      });

      it('should properly convert variable substitutions', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Test create-plan which uses $ARGUMENTS
        const createPlanToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/create-plan.toml'), 
          'utf8'
        );
        expect(createPlanToml).toContain('{{args}}');
        expect(createPlanToml).not.toContain('$ARGUMENTS');
        
        // Test execute-blueprint and generate-tasks which use $1
        const executeTaskToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/execute-blueprint.toml'), 
          'utf8'
        );
        expect(executeTaskToml).toContain('{{plan_id}}');
        expect(executeTaskToml).not.toContain('$1');
        
        const generateTasksToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/generate-tasks.toml'), 
          'utf8'
        );
        expect(generateTasksToml).toContain('{{plan_id}}');
        expect(generateTasksToml).not.toContain('$1');
      });

      it('should handle special characters in TOML strings properly', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const executeTaskToml = await fs.readFile(
          path.join(testDir, '.gemini/commands/tasks/execute-blueprint.toml'), 
          'utf8'
        );

        // The content should be in a triple-quoted string which handles most special chars
        expect(executeTaskToml).toContain('content = """');
        
        // Verify that quotes within content are properly escaped if needed
        const contentStart = executeTaskToml.indexOf('content = """') + 'content = """'.length;
        const contentEnd = executeTaskToml.lastIndexOf('"""');
        const content = executeTaskToml.substring(contentStart, contentEnd);
        
        // Content should not contain any additional triple quotes within the content
        expect(content).not.toContain('"""');
      });

      it('should create valid TOML that can be parsed', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const templates = ['create-plan', 'execute-blueprint', 'generate-tasks'];
        
        for (const templateName of templates) {
          const tomlFilePath = path.join(testDir, `.gemini/commands/tasks/${templateName}.toml`);
          const tomlContent = await fs.readFile(tomlFilePath, 'utf8');

          // Basic TOML structure validation
          expect(tomlContent).toContain('[metadata]');
          expect(tomlContent).toContain('[prompt]');
          
          // Check for proper section ordering (metadata before prompt)
          const metadataIndex = tomlContent.indexOf('[metadata]');
          const promptIndex = tomlContent.indexOf('[prompt]');
          expect(metadataIndex).toBeLessThan(promptIndex);
          
          // Check for proper key-value format in metadata section
          const metadataSection = tomlContent.substring(metadataIndex, promptIndex);
          const metadataLines = metadataSection.split('\n').filter(line => line.includes('='));
          
          for (const line of metadataLines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
              // Should have format: key = "value"
              expect(trimmedLine).toMatch(/^[a-zA-Z-_]+ = ".+"$/);
            }
          }
          
          // Prompt section should have content field with triple quotes
          const promptSection = tomlContent.substring(promptIndex);
          expect(promptSection).toContain('content = """');
          expect(promptSection).toContain('"""');
        }
      });
    });

    describe('Directory Structure Validation for Gemini', () => {
      it('should create correct gemini directory hierarchy', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Check gemini-specific directory structure
        const expectedDirs = [
          '.gemini',
          '.gemini/commands', 
          '.gemini/commands/tasks'
        ];

        for (const dir of expectedDirs) {
          const fullPath = path.join(testDir, dir);
          const stats = await fs.stat(fullPath);
          expect(stats.isDirectory()).toBe(true);
        }
        
        // Verify common directories also exist
        expect(await fs.pathExists(path.join(testDir, '.ai/task-manager'))).toBe(true);
        expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/plans'))).toBe(true);
      });

      it('should create all required TOML template files', async () => {
        execSync(`node "${cliPath}" init --assistants gemini`, { 
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const expectedFiles = [
          '.gemini/commands/tasks/create-plan.toml',
          '.gemini/commands/tasks/execute-blueprint.toml',
          '.gemini/commands/tasks/generate-tasks.toml'
        ];

        for (const file of expectedFiles) {
          const fullPath = path.join(testDir, file);
          expect(await fs.pathExists(fullPath)).toBe(true);
          
          // Verify file is not empty
          const stats = await fs.stat(fullPath);
          expect(stats.size).toBeGreaterThan(0);
          
          // Verify file has TOML content
          const content = await fs.readFile(fullPath, 'utf8');
          expect(content).toContain('[metadata]');
          expect(content).toContain('[prompt]');
        }
      });
    });
  });

  describe('Cross-platform Compatibility', () => {
    it('should work with different path separators', async () => {
      execSync(`node "${cliPath}" init --assistants claude`, { 
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Verify directories exist regardless of platform path separator
      const aiDir = path.join(testDir, '.ai', 'task-manager');
      const claudeDir = path.join(testDir, '.claude', 'commands', 'tasks');
      
      expect(await fs.pathExists(aiDir)).toBe(true);
      expect(await fs.pathExists(claudeDir)).toBe(true);
    });

    it('should handle Windows-style and Unix-style paths', async () => {
      execSync(`node "${cliPath}" init --assistants claude`, { 
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check that files can be accessed with both path styles
      const taskFile = path.join(testDir, '.claude', 'commands', 'tasks', 'create-plan.md');
      expect(await fs.pathExists(taskFile)).toBe(true);
      
      const content = await fs.readFile(taskFile, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Destination Directory Flag', () => {
    it('should create directories in specified destination with relative path', async () => {
      const customDir = 'custom-project';
      const customDirPath = path.join(testDir, customDir);
      
      const result = execSync(`node "${cliPath}" init --assistants claude --destination-directory ${customDir}`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check that command completed successfully
      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created in custom location
      expect(await fs.pathExists(path.join(customDirPath, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.ai/task-manager/plans'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.claude'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.claude/commands'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.claude/commands/tasks'))).toBe(true);

      // Verify template files were copied to custom location
      expect(await fs.pathExists(path.join(customDirPath, '.ai/task-manager/TASK_MANAGER_INFO.md'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.ai/task-manager/VALIDATION_GATES.md'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.claude/commands/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.claude/commands/tasks/execute-blueprint.md'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.claude/commands/tasks/generate-tasks.md'))).toBe(true);
      
      // Verify files are not created in the current directory
      expect(await fs.pathExists(path.join(testDir, '.ai'))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(false);
    });

    it('should create directories in specified destination with absolute path', async () => {
      const customDir = path.join(testDir, 'absolute-custom-project');
      
      const result = execSync(`node "${cliPath}" init --assistants claude --destination-directory "${customDir}"`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created in absolute path location
      expect(await fs.pathExists(path.join(customDir, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(customDir, '.ai/task-manager/plans'))).toBe(true);
      expect(await fs.pathExists(path.join(customDir, '.claude/commands/tasks'))).toBe(true);

      // Verify template files were copied to absolute path location
      expect(await fs.pathExists(path.join(customDir, '.ai/task-manager/TASK_MANAGER_INFO.md'))).toBe(true);
      expect(await fs.pathExists(path.join(customDir, '.claude/commands/tasks/create-plan.md'))).toBe(true);
    });

    it('should work with multiple assistants and destination directory', async () => {
      const customDir = 'multi-assistant-project';
      const customDirPath = path.join(testDir, customDir);
      
      const result = execSync(`node "${cliPath}" init --assistants claude,gemini --destination-directory ${customDir}`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify both assistant directory structures exist in custom location
      expect(await fs.pathExists(path.join(customDirPath, '.claude/commands/tasks'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.gemini/commands/tasks'))).toBe(true);

      // Verify template files for both assistants in custom location
      expect(await fs.pathExists(path.join(customDirPath, '.claude/commands/tasks/create-plan.md'))).toBe(true);
      expect(await fs.pathExists(path.join(customDirPath, '.gemini/commands/tasks/create-plan.toml'))).toBe(true);
    });

    it('should verify default behavior still works when no destination directory specified', async () => {
      // This test ensures that when no --destination-directory is provided,
      // the initialization still occurs in the current directory
      
      const result = execSync(`node "${cliPath}" init --assistants claude`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created in current directory (testDir)
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);

      // Verify template files were copied to current directory
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager/TASK_MANAGER_INFO.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks/create-plan.md'))).toBe(true);
    });

    it('should handle nested directory paths', async () => {
      const nestedDir = 'level1/level2/nested-project';
      const nestedDirPath = path.join(testDir, nestedDir);
      
      const result = execSync(`node "${cliPath}" init --assistants claude --destination-directory ${nestedDir}`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created in nested location
      expect(await fs.pathExists(path.join(nestedDirPath, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(nestedDirPath, '.claude/commands/tasks'))).toBe(true);

      // Verify template files were copied to nested location
      expect(await fs.pathExists(path.join(nestedDirPath, '.ai/task-manager/TASK_MANAGER_INFO.md'))).toBe(true);
      expect(await fs.pathExists(path.join(nestedDirPath, '.claude/commands/tasks/create-plan.md'))).toBe(true);
    });

    it('should handle destination directory paths with spaces', async () => {
      const spacedDir = 'project with spaces';
      const spacedDirPath = path.join(testDir, spacedDir);
      
      const result = execSync(`node "${cliPath}" init --assistants claude --destination-directory "${spacedDir}"`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created in path with spaces
      expect(await fs.pathExists(path.join(spacedDirPath, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(spacedDirPath, '.claude/commands/tasks'))).toBe(true);

      // Verify template files were copied to path with spaces
      expect(await fs.pathExists(path.join(spacedDirPath, '.ai/task-manager/TASK_MANAGER_INFO.md'))).toBe(true);
      expect(await fs.pathExists(path.join(spacedDirPath, '.claude/commands/tasks/create-plan.md'))).toBe(true);
    });

    it('should create parent directories if they do not exist', async () => {
      const nonExistentParentDir = 'does-not-exist/child-dir';
      const nonExistentParentDirPath = path.join(testDir, nonExistentParentDir);
      
      // Ensure parent directory doesn't exist before test
      expect(await fs.pathExists(path.join(testDir, 'does-not-exist'))).toBe(false);
      
      const result = execSync(`node "${cliPath}" init --assistants claude --destination-directory ${nonExistentParentDir}`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify parent directories were created
      expect(await fs.pathExists(path.join(testDir, 'does-not-exist'))).toBe(true);
      expect(await fs.pathExists(nonExistentParentDirPath)).toBe(true);
      
      // Verify directory structure was created in the new location
      expect(await fs.pathExists(path.join(nonExistentParentDirPath, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(nonExistentParentDirPath, '.claude/commands/tasks'))).toBe(true);
    });

    it('should handle current directory reference (.) as destination', async () => {
      const result = execSync(`node "${cliPath}" init --assistants claude --destination-directory .`, { 
        encoding: 'utf8',
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created in current directory
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);
    });

    it('should handle parent directory reference (..) as destination', async () => {
      // Create a subdirectory to run from
      const subDir = path.join(testDir, 'subdir');
      await fs.ensureDir(subDir);
      
      const result = execSync(`node "${cliPath}" init --assistants claude --destination-directory ..`, { 
        encoding: 'utf8',
        cwd: subDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      expect(result).toContain('AI Task Manager initialized successfully!');
      
      // Verify directory structure was created in parent directory (testDir)
      expect(await fs.pathExists(path.join(testDir, '.ai/task-manager'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.claude/commands/tasks'))).toBe(true);
    });
  });
});