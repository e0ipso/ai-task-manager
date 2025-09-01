/**
 * Integration orchestrator for the init command
 * Coordinates CLI interface, user interaction, and file system operations
 * Provides comprehensive error handling, rollback capabilities, and progress tracking
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { UserInterface, UIOptions } from './ui';
import { FileSystemManager, createDefaultInstallationConfig, InstallationConfig } from './filesystem';
import { TaskManager } from './task-manager';
import { TemplateManager } from './templates';
import { CommandManager } from './command-manager';
import { EnhancedLogger, createVerboseLogger, ProgressTracker, LogEntry } from './logging';
import { SupportedAssistant } from './utils/assistant-validator';
import { AssistantConfig, createAssistantConfig } from './types/assistant-config';

/**
 * Configuration options for initializing a new AI Task Manager project
 */
export interface InitOptions {
  /** Project name override */
  project?: string;
  /** Project description */
  description?: string;
  /** Template to use for initialization */
  template?: string;
  /** Whether to include example tasks and configurations */
  includeExamples?: boolean;
  /** Run in non-interactive mode using defaults */
  nonInteractive?: boolean;
  /** Force overwrite existing files and directories */
  force?: boolean;
  /** Disable colored output */
  noColor?: boolean;
  /** Perform dry run without making actual changes */
  dryRun?: boolean;
  /** Enable verbose logging output */
  verbose?: boolean;
  /** List of AI assistants to configure support for */
  assistants?: SupportedAssistant[];
}

export interface InitContext {
  targetDirectory: string;
  options: InitOptions;
  assistantConfig: AssistantConfig;
  ui: UserInterface;
  fsManager: FileSystemManager;
  taskManager: TaskManager;
  templateManager: TemplateManager;
  commandManager: CommandManager;
  logger: EnhancedLogger;
  progressTracker: ProgressTracker;
}

export interface InitResult {
  success: boolean;
  projectName: string;
  workspaceDirectory: string;
  operationsSummary: {
    filesCreated: number;
    directoriesCreated: number;
    templatesInstalled: number;
    commandsInstalled: number;
    tasksCreated: number;
    duration: number;
  };
  errors: string[];
  warnings: string[];
}

// The Logger class has been moved to the logging module

export class InitOrchestrator {
  private readonly logger: EnhancedLogger;
  private readonly progressTracker: ProgressTracker;

  constructor(verbose: boolean = false) {
    this.logger = createVerboseLogger();
    this.progressTracker = new ProgressTracker({
      logger: this.logger,
      enableDetailedLogging: verbose,
    });
  }

  /**
   * Main orchestration method for the init command
   * Coordinates all components through the complete setup process
   */
  async orchestrateInit(options: InitOptions): Promise<InitResult> {
    const startTime = Date.now();
    const targetDirectory = process.cwd();

    const operationId = this.logger.startOperation('INIT_ORCHESTRATION', { options, targetDirectory });
    this.logger.info('Starting init orchestration', 'ORCHESTRATOR', { options, targetDirectory });

    // Initialize context
    const context = await this.createContext(targetDirectory, options);
    
    // Set up progress tracking
    this.progressTracker.addSteps([
      { id: 'preflight', name: 'Pre-flight Checks', weight: 1 },
      { id: 'user-config', name: 'User Configuration', weight: 2 },
      { id: 'workspace', name: 'Workspace Preparation', weight: 1 },
      { id: 'filesystem', name: 'File System Installation', weight: 3 },
      { id: 'tasks', name: 'Task Management Setup', weight: 2 },
      { id: 'verification', name: 'Verification', weight: 1 },
    ]);
    
    this.progressTracker.start();
    
    try {
      // Phase 1: Pre-flight checks and validation
      this.progressTracker.startStep('preflight');
      await this.executePhase('Pre-flight Checks', context, async () => {
        await this.performPreflightChecks(context);
      });
      this.progressTracker.completeStep('preflight');

      // Phase 2: User interaction and configuration
      this.progressTracker.startStep('user-config');
      let projectConfig: any;
      await this.executePhase('User Configuration', context, async () => {
        projectConfig = await this.handleUserInteraction(context);
      });
      this.progressTracker.completeStep('user-config');

      // Phase 3: Workspace preparation
      this.progressTracker.startStep('workspace');
      await this.executePhase('Workspace Preparation', context, async () => {
        await this.prepareWorkspace(context, projectConfig);
      });
      this.progressTracker.completeStep('workspace');

      // Phase 4: File system operations
      this.progressTracker.startStep('filesystem');
      let installationResult: any;
      await this.executePhase('File System Installation', context, async () => {
        installationResult = await this.executeInstallation(context);
      });
      this.progressTracker.completeStep('filesystem');

      // Phase 5: Task management setup
      this.progressTracker.startStep('tasks');
      let tasksCreated = 0;
      await this.executePhase('Task Management Setup', context, async () => {
        tasksCreated = await this.setupTaskManagement(context, projectConfig);
      });
      this.progressTracker.completeStep('tasks');

      // Phase 6: Verification and finalization
      this.progressTracker.startStep('verification');
      await this.executePhase('Verification', context, async () => {
        await this.performVerification(context, installationResult);
      });
      this.progressTracker.completeStep('verification');

      // Success
      this.progressTracker.finish(true);
      const duration = Date.now() - startTime;
      this.logger.completeOperation(operationId, true);
      
      const progressMetrics = this.progressTracker.getMetrics();
      const result: InitResult = {
        success: true,
        projectName: projectConfig.projectName,
        workspaceDirectory: targetDirectory,
        operationsSummary: {
          filesCreated: installationResult.summary.filesCreated,
          directoriesCreated: installationResult.summary.directoriesCreated,
          templatesInstalled: installationResult.operations.filter((op: any) => 
            op.target.includes('templates')).length,
          commandsInstalled: installationResult.operations.filter((op: any) => 
            op.target.includes('.claude')).length,
          tasksCreated,
          duration,
        },
        errors: [],
        warnings: [],
      };

      context.ui.showInitializationSuccess(projectConfig.projectName, targetDirectory);
      this.logger.info('Init orchestration completed successfully', 'ORCHESTRATOR', {
        ...result,
        progressMetrics,
        operationStats: this.logger.getOperationStats(),
      });

      return result;

    } catch (error) {
      this.progressTracker.finish(false);
      this.logger.completeOperation(operationId, false, error instanceof Error ? error.message : String(error));
      this.logger.error('Init orchestration failed', 'ORCHESTRATOR', error);
      
      // Attempt rollback
      try {
        await this.performRollback(context, error);
      } catch (rollbackError) {
        this.logger.error('Rollback failed', 'ORCHESTRATOR', rollbackError);
      }

      const duration = Date.now() - startTime;
      const result: InitResult = {
        success: false,
        projectName: options.project || 'Unknown',
        workspaceDirectory: targetDirectory,
        operationsSummary: {
          filesCreated: 0,
          directoriesCreated: 0,
          templatesInstalled: 0,
          commandsInstalled: 0,
          tasksCreated: 0,
          duration,
        },
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
      };

      context.ui.showInitializationError(
        result.errors[0] || 'Unknown error occurred',
        [
          'Check that you have write permissions in the current directory',
          'Ensure you have enough disk space available',
          'Try running with --verbose flag for detailed logs',
          'Use --force flag to overwrite existing installations'
        ]
      );

      return result;
    }
  }

  /**
   * Create initialization context with all required components
   */
  private async createContext(targetDirectory: string, options: InitOptions): Promise<InitContext> {
    this.logger.debug('Creating initialization context', 'ORCHESTRATOR');

    // Create assistant configuration with default to 'claude' for backwards compatibility
    const assistantConfig = createAssistantConfig(options.assistants || ['claude'], targetDirectory);

    const uiOptions: UIOptions = {
      nonInteractive: options.nonInteractive ?? false,
      colors: !options.noColor,
      defaults: {
        projectName: options.project || path.basename(targetDirectory),
        description: options.description || 'A new project managed by AI Task Manager',
        template: options.template || 'basic',
        includeExamples: options.includeExamples !== false,
      },
    };

    const context: InitContext = {
      targetDirectory,
      options,
      assistantConfig,
      ui: new UserInterface(uiOptions),
      fsManager: new FileSystemManager({
        verificationEnabled: !options.dryRun,
      }),
      taskManager: new TaskManager(),
      templateManager: new TemplateManager(),
      commandManager: new CommandManager(),
      logger: this.logger,
      progressTracker: this.progressTracker,
    };

    this.logger.debug('Context created successfully', 'ORCHESTRATOR', { 
      targetDirectory, 
      options, 
      assistants: assistantConfig.assistants 
    });
    return context;
  }

  /**
   * Execute a phase with proper error handling and progress tracking
   */
  private async executePhase(
    phaseName: string,
    context: InitContext,
    operation: () => Promise<void>
  ): Promise<void> {
    const phaseOperationId = this.logger.startOperation(`PHASE_${phaseName.toUpperCase().replace(/\s+/g, '_')}`, { phase: phaseName });
    this.logger.info(`Starting phase: ${phaseName}`, 'PHASE');
    
    try {
      await context.ui.withProgress(
        operation,
        phaseName,
        `${phaseName} completed successfully`
      );
      
      this.logger.completeOperation(phaseOperationId, true);
      this.logger.info(`Phase completed: ${phaseName}`, 'PHASE');
    } catch (error) {
      this.logger.completeOperation(phaseOperationId, false, error instanceof Error ? error.message : String(error));
      this.logger.error(`Phase failed: ${phaseName}`, 'PHASE', error);
      throw new Error(`${phaseName} failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Phase 1: Pre-flight checks and validation
   */
  private async performPreflightChecks(context: InitContext): Promise<void> {
    this.logger.debug('Performing pre-flight checks', 'PREFLIGHT');

    // Check write permissions
    try {
      const testFile = path.join(context.targetDirectory, '.init-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch (error) {
      throw new Error(`No write permission in target directory: ${context.targetDirectory}`);
    }

    // Check existing workspace
    const configPath = path.join(context.targetDirectory, '.ai-tasks', 'config.json');
    const workspaceExists = await fs.access(configPath).then(() => true).catch(() => false);

    if (workspaceExists && !context.options.force) {
      throw new Error('Workspace already exists. Use --force to overwrite.');
    }

    // Check available space (basic check)
    try {
      const stats = await fs.stat(context.targetDirectory);
      if (!stats.isDirectory()) {
        throw new Error('Target is not a directory');
      }
    } catch (error) {
      throw new Error(`Cannot access target directory: ${error}`);
    }

    this.logger.debug('Pre-flight checks completed', 'PREFLIGHT');
  }

  /**
   * Phase 2: User interaction and configuration
   */
  private async handleUserInteraction(context: InitContext): Promise<any> {
    this.logger.debug('Handling user interaction', 'USER_INTERACTION');

    const projectConfig = await context.ui.runInitializationFlow();
    
    this.logger.debug('User configuration obtained', 'USER_INTERACTION', projectConfig);
    return projectConfig;
  }

  /**
   * Phase 3: Workspace preparation
   */
  private async prepareWorkspace(context: InitContext, projectConfig: any): Promise<void> {
    this.logger.debug('Preparing workspace', 'WORKSPACE', {
      ...projectConfig,
      assistants: context.assistantConfig.assistants
    });

    // Create basic directory structure
    const workspaceDir = path.join(context.targetDirectory, '.ai-tasks');
    await fs.mkdir(workspaceDir, { recursive: true });

    // Create configuration file with assistant information
    const config = {
      projectName: projectConfig.projectName,
      description: projectConfig.description,
      template: projectConfig.template,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      includeExamples: projectConfig.includeExamples,
      assistants: context.assistantConfig.assistants,
      assistantDirectories: context.assistantConfig.directories,
    };

    await fs.writeFile(
      path.join(workspaceDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    this.logger.debug('Workspace prepared successfully', 'WORKSPACE', {
      assistants: context.assistantConfig.assistants
    });
  }

  /**
   * Phase 4: Execute installation using FileSystemManager
   */
  private async executeInstallation(context: InitContext): Promise<any> {
    this.logger.debug('Executing installation', 'INSTALLATION', {
      assistants: context.assistantConfig.assistants
    });

    const config = createDefaultInstallationConfig(context.targetDirectory);
    config.dryRun = context.options.dryRun || false;
    config.overwriteMode = context.options.force ? 'overwrite' : 'ask';

    const result = await context.fsManager.installForAssistants(
      context.targetDirectory, 
      config, 
      context.assistantConfig
    );

    if (!result.success) {
      const errorMessages = result.errors.map(e => e.error).join('; ');
      throw new Error(`Installation failed: ${errorMessages}`);
    }

    this.logger.debug('Installation executed successfully', 'INSTALLATION', {
      filesCreated: result.summary.filesCreated,
      directoriesCreated: result.summary.directoriesCreated,
      assistants: context.assistantConfig.assistants,
    });

    return result;
  }

  /**
   * Phase 5: Set up task management and create example tasks
   */
  private async setupTaskManagement(context: InitContext, projectConfig: any): Promise<number> {
    this.logger.debug('Setting up task management', 'TASK_MANAGEMENT');

    await context.taskManager.initialize(projectConfig.projectName, projectConfig.description);

    let tasksCreated = 0;

    if (projectConfig.includeExamples) {
      await context.taskManager.createTask(
        'Welcome to AI Task Manager',
        'This is your first example task. You can edit or delete it anytime.'
      );
      tasksCreated++;

      await context.taskManager.createTask(
        'Explore the CLI features',
        'Try running list, status, and create commands to get familiar with the tool.'
      );
      tasksCreated++;

      await context.taskManager.createTask(
        'Set up your project workflow',
        'Configure the task templates and commands to match your project needs.'
      );
      tasksCreated++;
    }

    this.logger.debug(`Task management setup completed, created ${tasksCreated} tasks`, 'TASK_MANAGEMENT');
    return tasksCreated;
  }

  /**
   * Phase 6: Verification and finalization
   */
  private async performVerification(context: InitContext, installationResult: any): Promise<void> {
    this.logger.debug('Performing verification', 'VERIFICATION');

    if (context.options.dryRun) {
      this.logger.info('Skipping verification in dry-run mode', 'VERIFICATION');
      return;
    }

    // Verify installation integrity
    const verification = await context.fsManager.verifyInstallation(context.targetDirectory);
    
    if (!verification.valid) {
      this.logger.warn('Installation verification found issues', 'VERIFICATION', {
        issues: verification.issues.length,
        summary: verification.summary,
      });
      
      // Non-critical verification issues are warnings, not failures
      context.ui.showWarning('Installation verification found minor issues', 
        [verification.summary], 
        ['Run "ai-task-manager verify --repair" to fix issues if needed']
      );
    }

    // Verify task manager setup
    const configPath = path.join(context.targetDirectory, '.ai-tasks', 'config.json');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (!configExists) {
      throw new Error('Task manager configuration was not created properly');
    }

    this.logger.debug('Verification completed successfully', 'VERIFICATION');
  }

  /**
   * Attempt to rollback changes in case of failure
   */
  private async performRollback(context: InitContext, error: any): Promise<void> {
    this.logger.info('Attempting rollback due to error', 'ROLLBACK', error);

    try {
      // Remove .ai-tasks directory if it was created
      const workspaceDir = path.join(context.targetDirectory, '.ai-tasks');
      const workspaceExists = await fs.access(workspaceDir).then(() => true).catch(() => false);
      
      if (workspaceExists) {
        await fs.rm(workspaceDir, { recursive: true, force: true });
        this.logger.debug('Removed .ai-tasks directory', 'ROLLBACK');
      }

      // Remove .ai directory if it was created and is empty
      const aiDir = path.join(context.targetDirectory, '.ai');
      try {
        const aiContents = await fs.readdir(aiDir);
        if (aiContents.length === 0) {
          await fs.rmdir(aiDir);
          this.logger.debug('Removed empty .ai directory', 'ROLLBACK');
        }
      } catch (error) {
        // Directory doesn't exist or is not empty, ignore
      }

      // Remove .claude commands if they were created
      const claudeCommandsDir = path.join(context.targetDirectory, '.claude', 'commands', 'tasks');
      const claudeExists = await fs.access(claudeCommandsDir).then(() => true).catch(() => false);
      
      if (claudeExists) {
        await fs.rm(claudeCommandsDir, { recursive: true, force: true });
        this.logger.debug('Removed Claude commands directory', 'ROLLBACK');
      }

      this.logger.info('Rollback completed successfully', 'ROLLBACK');
    } catch (rollbackError) {
      this.logger.error('Rollback failed', 'ROLLBACK', rollbackError);
      throw rollbackError;
    }
  }

  /**
   * Get detailed logs from the orchestration process
   */
  getLogs(): LogEntry[] {
    return this.logger.getLogs();
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logger.clear();
  }
}