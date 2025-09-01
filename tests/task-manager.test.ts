import { TaskManager } from '../src/task-manager';
import fs from 'fs/promises';
import path from 'path';

describe('TaskManager', () => {
  const testDir = path.join(__dirname, '.test-ai-tasks');
  let taskManager: TaskManager;

  beforeEach(async () => {
    taskManager = new TaskManager();
    // Override paths for testing
    (taskManager as any).configPath = path.join(testDir, 'config.json');
    (taskManager as any).tasksPath = path.join(testDir, 'tasks.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should initialize a new workspace', async () => {
    await taskManager.initialize('Test Project', 'A test project');
    
    const configExists = await fs.access((taskManager as any).configPath).then(() => true).catch(() => false);
    const tasksExists = await fs.access((taskManager as any).tasksPath).then(() => true).catch(() => false);
    
    expect(configExists).toBe(true);
    expect(tasksExists).toBe(true);
  });

  it('should create a new task', async () => {
    await taskManager.initialize('Test Project', 'A test project');
    
    const task = await taskManager.createTask('Test Task', 'Test Description');
    
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test Description');
    expect(task.status).toBe('pending');
    expect(task.id).toBeDefined();
  });

  it('should list tasks', async () => {
    await taskManager.initialize('Test Project', 'A test project');
    await taskManager.createTask('Task 1', 'Description 1');
    await taskManager.createTask('Task 2', 'Description 2');
    
    const tasks = await taskManager.listTasks();
    
    expect(tasks).toHaveLength(2);
    expect(tasks[0]?.title).toBe('Task 1');
    expect(tasks[1]?.title).toBe('Task 2');
  });

  it('should get workspace status', async () => {
    await taskManager.initialize('Test Project', 'A test project');
    await taskManager.createTask('Task 1', 'Description 1');
    await taskManager.createTask('Task 2', 'Description 2');
    
    const status = await taskManager.getStatus();
    
    expect(status.total).toBe(2);
    expect(status.pending).toBe(2);
    expect(status.inProgress).toBe(0);
    expect(status.completed).toBe(0);
  });
});