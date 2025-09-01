"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class TaskManager {
    constructor() {
        this.configPath = path_1.default.join(process.cwd(), '.ai-tasks', 'config.json');
        this.tasksPath = path_1.default.join(process.cwd(), '.ai-tasks', 'tasks.json');
    }
    async initialize(projectName, description) {
        const configDir = path_1.default.dirname(this.configPath);
        try {
            await promises_1.default.mkdir(configDir, { recursive: true });
            const config = {
                projectName,
                description,
                createdAt: new Date(),
            };
            await promises_1.default.writeFile(this.configPath, JSON.stringify(config, null, 2));
            await promises_1.default.writeFile(this.tasksPath, JSON.stringify([], null, 2));
        }
        catch (error) {
            throw new Error(`Failed to initialize workspace: ${error}`);
        }
    }
    async createTask(title, description) {
        const task = {
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
    async listTasks(statusFilter) {
        const tasks = await this.loadTasks();
        if (!statusFilter) {
            return tasks;
        }
        return tasks.filter(task => task.status === statusFilter);
    }
    async getStatus() {
        const tasks = await this.loadTasks();
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
        };
    }
    async loadTasks() {
        try {
            const data = await promises_1.default.readFile(this.tasksPath, 'utf-8');
            return JSON.parse(data).map((task) => ({
                ...task,
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
            }));
        }
        catch (error) {
            // If file doesn't exist, return empty array
            return [];
        }
    }
    async saveTasks(tasks) {
        const configDir = path_1.default.dirname(this.tasksPath);
        await promises_1.default.mkdir(configDir, { recursive: true });
        await promises_1.default.writeFile(this.tasksPath, JSON.stringify(tasks, null, 2));
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=task-manager.js.map