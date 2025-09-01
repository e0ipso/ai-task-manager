import fs from 'fs/promises';
import path from 'path';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceConfig {
  projectName: string;
  description: string;
  createdAt: Date;
}

export interface WorkspaceStatus {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export class TaskManager {
  private configPath: string;
  private tasksPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), '.ai-tasks', 'config.json');
    this.tasksPath = path.join(process.cwd(), '.ai-tasks', 'tasks.json');
  }

  async initialize(projectName: string, description: string): Promise<void> {
    const configDir = path.dirname(this.configPath);

    try {
      await fs.mkdir(configDir, { recursive: true });

      const config: WorkspaceConfig = {
        projectName,
        description,
        createdAt: new Date(),
      };

      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      await fs.writeFile(this.tasksPath, JSON.stringify([], null, 2));
    } catch (error) {
      throw new Error(`Failed to initialize workspace: ${error}`);
    }
  }

  async createTask(title: string, description: string): Promise<Task> {
    const task: Task = {
      id: this.generateId(),
      title,
      description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tasks = await this.loadTasks();
    tasks.push(task);
    await this.saveTasks(tasks);

    return task;
  }

  async listTasks(statusFilter?: string): Promise<Task[]> {
    const tasks = await this.loadTasks();

    if (!statusFilter) {
      return tasks;
    }

    return tasks.filter(task => task.status === statusFilter);
  }

  async getStatus(): Promise<WorkspaceStatus> {
    const tasks = await this.loadTasks();

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }

  private async loadTasks(): Promise<Task[]> {
    try {
      const data = await fs.readFile(this.tasksPath, 'utf-8');
      return JSON.parse(data).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    } catch (error) {
      // If file doesn't exist, return empty array
      return [];
    }
  }

  private async saveTasks(tasks: Task[]): Promise<void> {
    const configDir = path.dirname(this.tasksPath);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(this.tasksPath, JSON.stringify(tasks, null, 2));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
