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
export declare class TaskManager {
    private configPath;
    private tasksPath;
    constructor();
    initialize(projectName: string, description: string): Promise<void>;
    createTask(title: string, description: string): Promise<Task>;
    listTasks(statusFilter?: string): Promise<Task[]>;
    getStatus(): Promise<WorkspaceStatus>;
    private loadTasks;
    private saveTasks;
    private generateId;
}
//# sourceMappingURL=task-manager.d.ts.map