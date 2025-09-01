/**
 * Integration tests for the init orchestrator
 * Demonstrates complete end-to-end functionality
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { InitOrchestrator, InitOptions } from '../init-orchestrator';

describe('InitOrchestrator Integration Tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let orchestrator: InitOrchestrator;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'ai-task-manager-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Create verbose orchestrator for testing
    orchestrator = new InitOrchestrator(true);
  });

  afterEach(async () => {
    // Cleanup
    process.chdir(originalCwd);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  });

  describe('Complete Integration Workflow', () => {
    it('should complete full initialization flow in non-interactive mode', async () => {
      const options: InitOptions = {
        project: 'Test Project',
        description: 'A test project for integration testing',
        template: 'basic',
        includeExamples: true,
        nonInteractive: true,
        force: false,
        noColor: true,
        dryRun: false,
        verbose: true,
      };

      const result = await orchestrator.orchestrateInit(options);

      // Verify successful completion
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('Test Project');
      expect(result.workspaceDirectory).toBe(tempDir);

      // Verify operations summary
      expect(result.operationsSummary.duration).toBeGreaterThan(0);
      expect(result.operationsSummary.tasksCreated).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // Verify file structure was created
      const aiTasksDir = path.join(tempDir, '.ai-tasks');
      const aiTasksExists = await fs.access(aiTasksDir).then(() => true).catch(() => false);
      expect(aiTasksExists).toBe(true);

      // Verify configuration file
      const configPath = path.join(aiTasksDir, 'config.json');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      if (configExists) {
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        expect(config.projectName).toBe('Test Project');
        expect(config.description).toBe('A test project for integration testing');
      }
    }, 30000);

    it('should handle dry-run mode correctly', async () => {
      const options: InitOptions = {
        project: 'Dry Run Test',
        nonInteractive: true,
        dryRun: true,
        verbose: true,
      };

      const result = await orchestrator.orchestrateInit(options);

      // Verify dry-run completion
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('Dry Run Test');

      // Verify no actual files were created
      const aiTasksDir = path.join(tempDir, '.ai-tasks');
      const aiTasksExists = await fs.access(aiTasksDir).then(() => true).catch(() => false);
      expect(aiTasksExists).toBe(false);
    }, 15000);

    it('should handle existing workspace with force flag', async () => {
      // Create existing workspace
      const workspaceDir = path.join(tempDir, '.ai-tasks');
      await fs.mkdir(workspaceDir, { recursive: true });
      await fs.writeFile(
        path.join(workspaceDir, 'config.json'),
        JSON.stringify({ projectName: 'Existing Project' }, null, 2)
      );

      const options: InitOptions = {
        project: 'New Project',
        nonInteractive: true,
        force: true,
        verbose: true,
      };

      const result = await orchestrator.orchestrateInit(options);

      // Verify successful overwrite
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('New Project');

      // Verify configuration was updated
      const configPath = path.join(workspaceDir, 'config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      expect(config.projectName).toBe('New Project');
    }, 20000);

    it('should provide comprehensive logging and metrics', async () => {
      const options: InitOptions = {
        project: 'Logging Test',
        nonInteractive: true,
        verbose: true,
      };

      const result = await orchestrator.orchestrateInit(options);

      // Verify logging functionality
      const logs = orchestrator.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Check for key log entries
      const logMessages = logs.map(log => log.message);
      expect(logMessages).toContain(expect.stringContaining('Starting init orchestration'));
      expect(logMessages).toContain(expect.stringContaining('Init orchestration completed successfully'));

      // Verify operation tracking
      const operations = orchestrator.getLogs().filter(log => log.context === 'OPERATION');
      expect(operations.length).toBeGreaterThan(0);

      // Verify phase tracking
      const phases = orchestrator.getLogs().filter(log => log.context === 'PHASE');
      expect(phases.length).toBeGreaterThan(0);
    }, 20000);

    it('should handle rollback on failure gracefully', async () => {
      // Create a scenario that will fail during workspace preparation
      // by making the directory read-only
      await fs.chmod(tempDir, 0o444);

      const options: InitOptions = {
        project: 'Failure Test',
        nonInteractive: true,
        verbose: true,
      };

      let result;
      try {
        result = await orchestrator.orchestrateInit(options);
      } catch (error) {
        // Expected to fail
      }

      // Restore permissions for cleanup
      await fs.chmod(tempDir, 0o755);

      if (result) {
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }

      // Verify rollback occurred - no partial workspace should remain
      const aiTasksDir = path.join(tempDir, '.ai-tasks');
      const aiTasksExists = await fs.access(aiTasksDir).then(() => true).catch(() => false);
      expect(aiTasksExists).toBe(false);
    }, 15000);

    it('should track progress accurately throughout execution', async () => {
      const options: InitOptions = {
        project: 'Progress Test',
        nonInteractive: true,
        verbose: true,
      };

      const result = await orchestrator.orchestrateInit(options);

      expect(result.success).toBe(true);

      // Verify progress was tracked
      const logs = orchestrator.getLogs();
      const progressLogs = logs.filter(log => log.context === 'PROGRESS');
      expect(progressLogs.length).toBeGreaterThan(0);

      // Verify all expected phases were completed
      const phaseLogs = logs.filter(log => 
        log.context === 'PHASE' && log.message.includes('completed')
      );
      expect(phaseLogs.length).toBeGreaterThanOrEqual(6); // 6 phases
    }, 20000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid options gracefully', async () => {
      const options: InitOptions = {
        project: '', // Invalid empty project name
        nonInteractive: true,
      };

      const result = await orchestrator.orchestrateInit(options);

      // Should either succeed with default name or fail gracefully
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle insufficient permissions gracefully', async () => {
      // This test might not work on all systems, so we'll make it conditional
      if (process.getuid && process.getuid() !== 0) { // Not running as root
        // Create directory with restrictive permissions
        const restrictedDir = path.join(tempDir, 'restricted');
        await fs.mkdir(restrictedDir);
        await fs.chmod(restrictedDir, 0o000);

        process.chdir(restrictedDir);

        const options: InitOptions = {
          project: 'Permission Test',
          nonInteractive: true,
        };

        let result;
        try {
          result = await orchestrator.orchestrateInit(options);
        } catch (error) {
          // Expected to fail
        }

        // Restore permissions for cleanup
        await fs.chmod(restrictedDir, 0o755);
        process.chdir(tempDir);

        if (result) {
          expect(result.success).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Logging and Metrics', () => {
    it('should provide detailed operation metrics', async () => {
      const options: InitOptions = {
        project: 'Metrics Test',
        nonInteractive: true,
        verbose: true,
      };

      await orchestrator.orchestrateInit(options);

      // Clear logs to isolate the test
      const logs = orchestrator.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Verify different log levels are present
      const logLevels = new Set(logs.map(log => log.level));
      expect(logLevels.has('info')).toBe(true);
      expect(logLevels.has('debug')).toBe(true);

      // Verify contexts are properly set
      const contexts = new Set(logs.map(log => log.context).filter(Boolean));
      expect(contexts.size).toBeGreaterThan(1);
      expect(contexts.has('ORCHESTRATOR')).toBe(true);
    });

    it('should track operation timing accurately', async () => {
      const options: InitOptions = {
        project: 'Timing Test',
        nonInteractive: true,
        verbose: true,
      };

      const startTime = Date.now();
      const result = await orchestrator.orchestrateInit(options);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.operationsSummary.duration).toBeGreaterThan(0);
      expect(result.operationsSummary.duration).toBeLessThan(endTime - startTime + 1000); // Allow some buffer
    });
  });
});