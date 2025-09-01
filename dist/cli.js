#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const task_manager_1 = require("./task-manager");
const program = new commander_1.Command();
program.name('ai-task-manager').description('AI-powered task management CLI tool').version('0.1.0');
program
    .command('init')
    .description('Initialize a new task management workspace')
    .action(async () => {
    console.log('🚀 Initializing AI Task Manager...');
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'What is the name of your project?',
            default: 'my-project',
        },
        {
            type: 'input',
            name: 'description',
            message: 'Provide a brief description:',
            default: 'A new project managed by AI Task Manager',
        },
    ]);
    const taskManager = new task_manager_1.TaskManager();
    await taskManager.initialize(answers.projectName, answers.description);
    console.log('✅ Task management workspace initialized successfully!');
});
program
    .command('create')
    .description('Create a new task')
    .option('-t, --title <title>', 'Task title')
    .option('-d, --description <description>', 'Task description')
    .action(async (options) => {
    const taskManager = new task_manager_1.TaskManager();
    let title = options.title;
    let description = options.description;
    if (!title || !description) {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Task title:',
                when: !title,
            },
            {
                type: 'input',
                name: 'description',
                message: 'Task description:',
                when: !description,
            },
        ]);
        title = title || answers.title;
        description = description || answers.description;
    }
    await taskManager.createTask(title, description);
    console.log(`✅ Task "${title}" created successfully!`);
});
program
    .command('list')
    .description('List all tasks')
    .option('-s, --status <status>', 'Filter by status (pending, in_progress, completed)')
    .action(async (options) => {
    const taskManager = new task_manager_1.TaskManager();
    const tasks = await taskManager.listTasks(options.status);
    if (tasks.length === 0) {
        console.log('No tasks found.');
        return;
    }
    console.log('\n📋 Tasks:');
    tasks.forEach((task, index) => {
        const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳';
        console.log(`${index + 1}. ${statusEmoji} ${task.title} [${task.status}]`);
        if (task.description) {
            console.log(`   ${task.description}`);
        }
    });
});
program
    .command('status')
    .description('Show workspace status')
    .action(async () => {
    const taskManager = new task_manager_1.TaskManager();
    const status = await taskManager.getStatus();
    console.log('\n📊 Workspace Status:');
    console.log(`Total tasks: ${status.total}`);
    console.log(`Pending: ${status.pending}`);
    console.log(`In progress: ${status.inProgress}`);
    console.log(`Completed: ${status.completed}`);
});
// Handle unknown commands
program.on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
});
// Parse command line arguments
program.parse(process.argv);
// Show help if no arguments provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map