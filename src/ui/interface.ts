import { EnhancedPrompts, CommonPrompts, PromptConfig, setupGracefulExit } from './prompts';
import { ProgressIndicator, Spinner, createSpinner } from './progress';
import { SystemMessages, MessageFormatter } from './messages';
import { Answers } from 'inquirer';

export interface UIOptions {
  nonInteractive?: boolean;
  colors?: boolean;
  defaults?: Record<string, any>;
}

export class UserInterface {
  private prompts: EnhancedPrompts;
  private messages: SystemMessages;
  private formatter: MessageFormatter;
  private options: UIOptions;

  constructor(options: UIOptions = {}) {
    this.options = {
      nonInteractive: false,
      colors: true,
      ...options,
    };

    this.prompts = new EnhancedPrompts(
      this.options.nonInteractive || false,
      this.options.defaults || {}
    );
    this.messages = new SystemMessages(this.options.colors);
    this.formatter = new MessageFormatter(this.options.colors);

    // Setup graceful exit handling
    setupGracefulExit();
  }

  // Prompt Methods
  async promptProjectInitialization(): Promise<{
    projectName: string;
    description: string;
    template: string;
    includeExamples: boolean;
  }> {
    if (this.options.nonInteractive) {
      this.messages.nonInteractiveMode(this.options.defaults || {});
    } else {
      this.messages.welcomeMessage();
    }

    const answers = await this.prompts.prompt(CommonPrompts.projectInitialization());
    return {
      projectName: answers.projectName,
      description: answers.description,
      template: answers.template,
      includeExamples: answers.includeExamples,
    };
  }

  async promptTaskCreation(): Promise<{
    title: string;
    description: string;
    priority: string;
    dueDate: string | null;
  }> {
    const answers = await this.prompts.prompt(CommonPrompts.taskCreation());
    return {
      title: answers.title,
      description: answers.description,
      priority: answers.priority,
      dueDate: answers.dueDate,
    };
  }

  async promptConfirmation(message: string, defaultValue: boolean = true): Promise<boolean> {
    if (this.options.nonInteractive) {
      return defaultValue;
    }

    const answers = await this.prompts.prompt(CommonPrompts.confirmation(message, defaultValue));
    return answers.confirmed;
  }

  async promptCustom(configs: PromptConfig[]): Promise<Answers> {
    return this.prompts.prompt(configs);
  }

  // Progress Indicators
  createProgressBar(total: number, message: string): ProgressIndicator {
    return new ProgressIndicator({ total, message });
  }

  createSpinner(message: string): Spinner {
    return createSpinner({ message });
  }

  async withProgress<T>(
    operation: () => Promise<T>,
    message: string,
    successMessage?: string
  ): Promise<T> {
    const spinner = this.createSpinner(message);
    spinner.start();

    try {
      const result = await operation();
      spinner.succeed(successMessage || `${message} completed`);
      return result;
    } catch (error) {
      spinner.fail(`${message} failed: ${error}`);
      throw error;
    }
  }

  async simulateInstallation(steps: Array<{ name: string; duration: number }>): Promise<void> {
    const totalSteps = steps.length;
    const progress = this.createProgressBar(totalSteps, 'Installing components');

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step) {
        progress.update(i, `Installing: ${step.name}`);

        // Simulate work
        await new Promise(resolve => setTimeout(resolve, step.duration));

        progress.update(i + 1, `Installed: ${step.name}`);
      }
    }

    progress.complete('Installation complete');
  }

  // Message Methods
  showWelcome(projectName?: string): void {
    this.messages.welcomeMessage(projectName);
  }

  showSuccess(message: string, details?: string[], nextSteps?: string[]): void {
    this.formatter.success(message, {
      ...(details && { details }),
      ...(nextSteps && { nextSteps }),
    });
  }

  showError(message: string, details?: string[], nextSteps?: string[]): void {
    this.formatter.error(message, {
      ...(details && { details }),
      ...(nextSteps && { nextSteps }),
    });
  }

  showWarning(message: string, details?: string[], nextSteps?: string[]): void {
    this.formatter.warning(message, {
      ...(details && { details }),
      ...(nextSteps && { nextSteps }),
    });
  }

  showInfo(message: string, details?: string[], nextSteps?: string[]): void {
    this.formatter.info(message, {
      ...(details && { details }),
      ...(nextSteps && { nextSteps }),
    });
  }

  showInitializationSuccess(projectName: string, workspaceDir: string): void {
    this.messages.initializationSuccess(projectName, workspaceDir);
  }

  showInitializationError(error: string, troubleshooting?: string[]): void {
    this.messages.initializationError(error, troubleshooting);
  }

  showTaskCreationSuccess(taskTitle: string, taskId: string): void {
    this.messages.taskCreationSuccess(taskTitle, taskId);
  }

  showWorkspaceStatus(status: any, projectName?: string): void {
    this.messages.workspaceStatus(status, projectName);
  }

  showNoWorkspaceFound(): void {
    this.messages.noWorkspaceFound();
  }

  showCommandHelp(command: string): void {
    this.messages.commandHelp(command);
  }

  // Interactive Setup Flows
  async runInitializationFlow(): Promise<{
    projectName: string;
    description: string;
    template: string;
    includeExamples: boolean;
  }> {
    try {
      const config = await this.promptProjectInitialization();

      // Simulate installation process
      await this.simulateInstallation(
        [
          { name: 'Project structure', duration: 800 },
          { name: 'Configuration files', duration: 500 },
          { name: 'Task templates', duration: 600 },
          { name: 'Example tasks', duration: config.includeExamples ? 400 : 0 },
        ].filter(step => step.duration > 0)
      );

      return config;
    } catch (error) {
      if (error instanceof Error && error.message.includes('User force closed')) {
        this.messages.interruptionMessage();
        process.exit(0);
      }
      throw error;
    }
  }

  async runTaskCreationFlow(): Promise<{
    title: string;
    description: string;
    priority: string;
    dueDate: string | null;
  }> {
    try {
      return await this.promptTaskCreation();
    } catch (error) {
      if (error instanceof Error && error.message.includes('User force closed')) {
        this.messages.interruptionMessage();
        process.exit(0);
      }
      throw error;
    }
  }

  // Utility Methods
  isNonInteractive(): boolean {
    return this.options.nonInteractive || false;
  }

  setDefaults(defaults: Record<string, any>): void {
    this.options.defaults = { ...this.options.defaults, ...defaults };
    this.prompts = new EnhancedPrompts(
      this.options.nonInteractive || false,
      this.options.defaults || {}
    );
  }

  // Static factory methods
  static create(options: UIOptions = {}): UserInterface {
    return new UserInterface(options);
  }

  static createNonInteractive(defaults: Record<string, any> = {}): UserInterface {
    return new UserInterface({
      nonInteractive: true,
      defaults,
    });
  }
}

// Export singleton for convenience
export const ui = UserInterface.create();
