import { WorkspaceStatus } from '../task-manager';

export interface MessageOptions {
  title?: string;
  details?: string[];
  nextSteps?: string[];
  timestamp?: boolean;
  colors?: boolean;
}

export interface NextStep {
  action: string;
  command?: string;
  description?: string;
}

export class MessageFormatter {
  private colors: boolean;

  constructor(colors: boolean = true) {
    this.colors = colors && process.stdout.isTTY;
  }

  // Color utility methods
  private green = (text: string): string => {
    return this.colors ? `\x1b[32m${text}\x1b[0m` : text;
  };

  private red = (text: string): string => {
    return this.colors ? `\x1b[31m${text}\x1b[0m` : text;
  };

  private yellow = (text: string): string => {
    return this.colors ? `\x1b[33m${text}\x1b[0m` : text;
  };

  private blue = (text: string): string => {
    return this.colors ? `\x1b[34m${text}\x1b[0m` : text;
  };

  private cyan = (text: string): string => {
    return this.colors ? `\x1b[36m${text}\x1b[0m` : text;
  };

  private bold = (text: string): string => {
    return this.colors ? `\x1b[1m${text}\x1b[0m` : text;
  };

  private dim = (text: string): string => {
    return this.colors ? `\x1b[2m${text}\x1b[0m` : text;
  };

  success(message: string, options: MessageOptions = {}): void {
    this.printMessage('✅', 'SUCCESS', message, this.green, options);
  }

  error(message: string, options: MessageOptions = {}): void {
    this.printMessage('❌', 'ERROR', message, this.red, options);
  }

  warning(message: string, options: MessageOptions = {}): void {
    this.printMessage('⚠️', 'WARNING', message, this.yellow, options);
  }

  info(message: string, options: MessageOptions = {}): void {
    this.printMessage('ℹ️', 'INFO', message, this.blue, options);
  }

  private printMessage(
    emoji: string,
    type: string,
    message: string,
    colorFn: (text: string) => string,
    options: MessageOptions
  ): void {
    console.log(); // Empty line for spacing

    // Header
    const timestamp = options.timestamp ? this.dim(`[${new Date().toLocaleTimeString()}]`) : '';
    const title = options.title || message;
    console.log(`${emoji} ${colorFn(this.bold(type))}: ${title} ${timestamp}`);

    // Details
    if (options.details && options.details.length > 0) {
      console.log();
      options.details.forEach(detail => {
        console.log(`   ${detail}`);
      });
    }

    // Next steps
    if (options.nextSteps && options.nextSteps.length > 0) {
      console.log();
      console.log(this.bold('Next steps:'));
      options.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
    }

    console.log(); // Empty line for spacing
  }

  printBox(title: string, content: string[], width: number = 60): void {
    const horizontalLine = '─'.repeat(width - 2);
    const topLine = `┌${horizontalLine}┐`;
    const bottomLine = `└${horizontalLine}┘`;

    console.log();
    console.log(this.cyan(topLine));
    console.log(this.cyan(`│ ${this.bold(title.padEnd(width - 3))}│`));
    console.log(this.cyan(`├${horizontalLine}┤`));

    content.forEach(line => {
      const paddedLine = line.padEnd(width - 3);
      console.log(this.cyan(`│ ${paddedLine}│`));
    });

    console.log(this.cyan(bottomLine));
    console.log();
  }
}

export class SystemMessages {
  private formatter: MessageFormatter;

  constructor(colors: boolean = true) {
    this.formatter = new MessageFormatter(colors);
  }

  welcomeMessage(projectName?: string): void {
    const title = projectName
      ? `Welcome to AI Task Manager - ${projectName}`
      : 'Welcome to AI Task Manager';

    this.formatter.printBox(title, [
      'AI-powered task management for your projects',
      '',
      '🚀 Get started with intelligent task organization',
      '📊 Track progress with visual indicators',
      '🤖 Let AI help optimize your workflow',
    ]);
  }

  initializationSuccess(projectName: string, workspaceDir: string): void {
    this.formatter.success('Workspace initialized successfully!', {
      title: `Project "${projectName}" is ready`,
      details: [
        `📁 Workspace created in: ${workspaceDir}`,
        '📋 Task management system is active',
        '⚙️  Configuration files created',
      ],
      nextSteps: this.getInitializationNextSteps(projectName),
    });
  }

  initializationError(error: string, troubleshooting?: string[]): void {
    this.formatter.error('Failed to initialize workspace', {
      details: [`Error: ${error}`],
      nextSteps: troubleshooting || this.getInitializationTroubleshooting(),
    });
  }

  taskCreationSuccess(taskTitle: string, taskId: string): void {
    this.formatter.success(`Task created: "${taskTitle}"`, {
      details: [
        `📝 Task ID: ${taskId}`,
        '📊 Status: Pending',
        `⏰ Created: ${new Date().toLocaleString()}`,
      ],
      nextSteps: this.getTaskCreationNextSteps(),
    });
  }

  workspaceStatus(status: WorkspaceStatus, projectName?: string): void {
    const title = projectName ? `${projectName} - Workspace Status` : 'Workspace Status';

    const content = [
      `📊 Total Tasks: ${status.total}`,
      '',
      `⏳ Pending: ${status.pending}`,
      `🔄 In Progress: ${status.inProgress}`,
      `✅ Completed: ${status.completed}`,
      '',
      `📈 Progress: ${status.total > 0 ? Math.round((status.completed / status.total) * 100) : 0}%`,
    ];

    this.formatter.printBox(title, content);

    if (status.total === 0) {
      this.formatter.info('No tasks found', {
        nextSteps: ['Create your first task with: ai-task-manager create'],
      });
    }
  }

  commandHelp(command: string): void {
    const helpContent = this.getCommandHelp(command);
    if (helpContent) {
      this.formatter.printBox(`Command Help: ${command}`, helpContent);
    }
  }

  noWorkspaceFound(): void {
    this.formatter.warning('No AI Task Manager workspace found', {
      details: [
        'You need to initialize a workspace first',
        'Run the initialization command to get started',
      ],
      nextSteps: [
        'Run: ai-task-manager init',
        'Follow the interactive prompts',
        'Start creating and managing tasks',
      ],
    });
  }

  interruptionMessage(): void {
    console.log('\n');
    this.formatter.info('Operation cancelled', {
      details: ['👋 Thanks for using AI Task Manager!'],
    });
  }

  nonInteractiveMode(defaults: Record<string, any>): void {
    this.formatter.info('Running in non-interactive mode', {
      details: ['Using default values for prompts', 'Configuration applied automatically'],
    });

    if (Object.keys(defaults).length > 0) {
      console.log('Applied defaults:');
      Object.entries(defaults).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      console.log();
    }
  }

  private getInitializationNextSteps(projectName: string): string[] {
    return [
      'Create your first task with: ai-task-manager create',
      'View all tasks with: ai-task-manager list',
      'Check workspace status: ai-task-manager status',
      `Start organizing "${projectName}" efficiently!`,
    ];
  }

  private getInitializationTroubleshooting(): string[] {
    return [
      'Check that you have write permissions in the current directory',
      'Ensure you have enough disk space available',
      'Try running with elevated permissions if necessary',
      'Report issues at: https://github.com/e0ipso/ai-task-manager/issues',
    ];
  }

  private getTaskCreationNextSteps(): string[] {
    return [
      'View your tasks: ai-task-manager list',
      'Update task status when you start working on it',
      'Add more tasks to build your workflow',
      'Check progress: ai-task-manager status',
    ];
  }

  private getCommandHelp(command: string): string[] | null {
    const helpMap: Record<string, string[]> = {
      init: [
        'Initialize a new AI Task Manager workspace',
        '',
        'Usage: ai-task-manager init [options]',
        '',
        'Options:',
        '  --non-interactive    Skip interactive prompts',
        '  --project <name>     Set project name',
        '  --description <desc> Set project description',
      ],
      create: [
        'Create a new task',
        '',
        'Usage: ai-task-manager create [options]',
        '',
        'Options:',
        '  -t, --title <title>        Task title',
        '  -d, --description <desc>   Task description',
        '  --non-interactive          Skip interactive prompts',
      ],
      list: [
        'List all tasks in the workspace',
        '',
        'Usage: ai-task-manager list [options]',
        '',
        'Options:',
        '  -s, --status <status>  Filter by status',
        '                        (pending, in_progress, completed)',
      ],
      status: ['Show workspace status and task statistics', '', 'Usage: ai-task-manager status'],
    };

    return helpMap[command] || null;
  }
}

export const systemMessages = new SystemMessages();
