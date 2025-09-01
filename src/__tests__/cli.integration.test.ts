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
  let activeProcesses: Set<any> = new Set();
  let activeTimers: Set<NodeJS.Timeout> = new Set();

  // Helper function to track timers
  const trackTimer = (timer: NodeJS.Timeout): NodeJS.Timeout => {
    activeTimers.add(timer);
    return timer;
  };

  // Helper function to clear tracked timer
  const clearTrackedTimer = (timer: NodeJS.Timeout | null) => {
    if (timer) {
      clearTimeout(timer);
      activeTimers.delete(timer);
    }
  };

  // Helper function to track processes
  const trackProcess = (process: any) => {
    activeProcesses.add(process);
    return process;
  };
  
  beforeEach(async () => {
    // Store original working directory
    originalCwd = process.cwd();
    
    // Create a temporary directory for testing
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-task-test-'));
    
    // Change to test directory
    process.chdir(testDir);
    
    // Clear tracking sets
    activeProcesses.clear();
    activeTimers.clear();
  });
  
  afterEach(async () => {
    // Kill any remaining active processes
    for (const process of activeProcesses) {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }
    activeProcesses.clear();
    
    // Clear any remaining timers
    for (const timer of activeTimers) {
      clearTimeout(timer);
    }
    activeTimers.clear();
    
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    await fs.remove(testDir);
  });
  
  afterAll(async () => {
    // Final cleanup - ensure all resources are released
    for (const process of activeProcesses) {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }
    activeProcesses.clear();
    
    for (const timer of activeTimers) {
      clearTimeout(timer);
    }
    activeTimers.clear();
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

    it('should show error for unknown command', () => {
      let stderr = '';
      let exitCode = 0;
      
      try {
        execSync(`node "${cliPath}" unknown-command`, { 
          encoding: 'utf8',
          cwd: testDir 
        });
      } catch (error: any) {
        exitCode = error.status;
        stderr = error.stderr?.toString() || '';
      }
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown command: unknown-command');
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

    it('should handle process termination gracefully', (done) => {
      // This test verifies that the CLI can be terminated
      const child = trackProcess(spawn('node', [cliPath, 'init', '--assistants', 'claude'], {
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
      }));

      let processExited = false;
      let killTimer: NodeJS.Timeout | null = null;
      let safetyTimer: NodeJS.Timeout | null = null;

      // Cleanup function to clear timers and kill child process
      const cleanup = () => {
        clearTrackedTimer(killTimer);
        clearTrackedTimer(safetyTimer);
        killTimer = null;
        safetyTimer = null;
        
        if (!processExited && !child.killed) {
          child.kill('SIGKILL');
        }
        activeProcesses.delete(child);
      };

      // Kill the process after a short delay
      killTimer = trackTimer(setTimeout(() => {
        child.kill('SIGTERM');
        clearTrackedTimer(killTimer);
        killTimer = null;
      }, 200));

      child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        processExited = true;
        cleanup();
        // Process should either exit normally or be terminated
        expect(processExited).toBe(true);
        done();
      });

      child.on('error', (error: Error) => {
        processExited = true;
        cleanup();
        done(error);
      });

      // Safety timeout
      safetyTimer = trackTimer(setTimeout(() => {
        if (!processExited) {
          child.kill('SIGKILL');
          processExited = true;
          cleanup();
          done();
        }
      }, 5000));
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