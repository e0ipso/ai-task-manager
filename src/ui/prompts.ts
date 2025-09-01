import inquirer, { QuestionCollection, Answers } from 'inquirer';
import path from 'path';
import fs from 'fs/promises';

export interface ValidationRule {
  test: (value: any) => boolean | Promise<boolean>;
  message: string;
}

export interface PromptConfig {
  type: string;
  name: string;
  message: string;
  default?: any;
  choices?: any[];
  validation?: ValidationRule[];
  when?: (answers: Answers) => boolean;
  filter?: (value: any) => any;
  transformer?: (value: any) => any;
}

export class PromptValidator {
  static required(message: string = 'This field is required'): ValidationRule {
    return {
      test: (value: any) => value != null && value !== '',
      message,
    };
  }

  static minLength(min: number, message?: string): ValidationRule {
    return {
      test: (value: string) => Boolean(value && value.length >= min),
      message: message || `Must be at least ${min} characters long`,
    };
  }

  static maxLength(max: number, message?: string): ValidationRule {
    return {
      test: (value: string) => !value || value.length <= max,
      message: message || `Must be at most ${max} characters long`,
    };
  }

  static pattern(regex: RegExp, message: string): ValidationRule {
    return {
      test: (value: string) => !value || regex.test(value),
      message,
    };
  }

  static projectName(message: string = 'Invalid project name'): ValidationRule {
    const validPattern = /^[a-zA-Z0-9-_]+$/;
    return {
      test: (value: string) => validPattern.test(value),
      message: `${message}. Use only letters, numbers, hyphens, and underscores`,
    };
  }

  static directoryPath(message: string = 'Invalid directory path'): ValidationRule {
    return {
      test: (value: string) => {
        try {
          return path.isAbsolute(path.resolve(value));
        } catch {
          return false;
        }
      },
      message,
    };
  }

  static async directoryExists(
    message: string = 'Directory does not exist'
  ): Promise<ValidationRule> {
    return {
      test: async (value: string) => {
        try {
          const stats = await fs.stat(value);
          return stats.isDirectory();
        } catch {
          return false;
        }
      },
      message,
    };
  }
}

export class EnhancedPrompts {
  private nonInteractive: boolean;
  private defaults: Record<string, any>;

  constructor(nonInteractive: boolean = false, defaults: Record<string, any> = {}) {
    this.nonInteractive = nonInteractive;
    this.defaults = defaults;
  }

  async prompt(configs: PromptConfig[]): Promise<Answers> {
    if (this.nonInteractive) {
      return this.getNonInteractiveAnswers(configs);
    }

    const questions: QuestionCollection = configs.map(config => ({
      type: config.type as any,
      name: config.name,
      message: config.message,
      default: config.default,
      choices: config.choices,
      when: config.when,
      filter: config.filter,
      transformer: config.transformer,
      validate: config.validation ? this.createValidator(config.validation) : undefined,
    }));

    return inquirer.prompt(questions);
  }

  private createValidator(rules: ValidationRule[]) {
    return async (input: any): Promise<boolean | string> => {
      for (const rule of rules) {
        let isValid: boolean;
        if (typeof rule.test === 'function') {
          const result = rule.test(input);
          isValid = result instanceof Promise ? await result : result;
        } else {
          isValid = rule.test as boolean;
        }

        if (!isValid) {
          return rule.message;
        }
      }
      return true;
    };
  }

  private getNonInteractiveAnswers(configs: PromptConfig[]): Answers {
    const answers: Answers = {};

    for (const config of configs) {
      // Use provided default, command line default, or fallback
      answers[config.name] =
        this.defaults[config.name] || config.default || this.getTypeDefault(config.type);
    }

    return answers;
  }

  private getTypeDefault(type: string): any {
    switch (type) {
      case 'input':
        return '';
      case 'confirm':
        return false;
      case 'list':
      case 'rawlist':
        return null;
      case 'checkbox':
        return [];
      case 'number':
        return 0;
      default:
        return null;
    }
  }
}

// Pre-configured prompts for common scenarios
export class CommonPrompts {
  static projectInitialization(): PromptConfig[] {
    return [
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your project?',
        default: 'my-project',
        validation: [
          PromptValidator.required(),
          PromptValidator.projectName(),
          PromptValidator.minLength(2),
          PromptValidator.maxLength(50),
        ],
      },
      {
        type: 'input',
        name: 'description',
        message: 'Provide a brief description:',
        default: 'A new project managed by AI Task Manager',
        validation: [PromptValidator.maxLength(200)],
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose a project template:',
        choices: [
          { name: 'Basic Task Management', value: 'basic' },
          { name: 'Development Workflow', value: 'development' },
          { name: 'Research Project', value: 'research' },
          { name: 'Custom Setup', value: 'custom' },
        ],
        default: 'basic',
      },
      {
        type: 'confirm',
        name: 'includeExamples',
        message: 'Include example tasks?',
        default: true,
      },
    ];
  }

  static taskCreation(): PromptConfig[] {
    return [
      {
        type: 'input',
        name: 'title',
        message: 'Task title:',
        validation: [
          PromptValidator.required(),
          PromptValidator.minLength(3),
          PromptValidator.maxLength(100),
        ],
      },
      {
        type: 'input',
        name: 'description',
        message: 'Task description:',
        validation: [PromptValidator.maxLength(500)],
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Task priority:',
        choices: [
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' },
          { name: 'Critical', value: 'critical' },
        ],
        default: 'medium',
      },
      {
        type: 'input',
        name: 'dueDate',
        message: 'Due date (YYYY-MM-DD, optional):',
        validation: [
          PromptValidator.pattern(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
        ],
        filter: (input: string) => input.trim() || null,
      },
    ];
  }

  static confirmation(message: string, defaultValue: boolean = true): PromptConfig[] {
    return [
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue,
      },
    ];
  }

  static multiSelect(
    name: string,
    message: string,
    choices: Array<{ name: string; value: any }>,
    defaultSelections: any[] = []
  ): PromptConfig[] {
    return [
      {
        type: 'checkbox',
        name,
        message,
        choices,
        default: defaultSelections,
      },
    ];
  }
}

// Utility function to handle user interruption
export function setupGracefulExit(): void {
  process.on('SIGINT', () => {
    console.log('\n\n👋 Operation cancelled by user');
    process.exit(0);
  });
}

export { inquirer };
