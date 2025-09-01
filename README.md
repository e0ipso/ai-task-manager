# AI Task Manager

AI-powered task management CLI tool to improve your context. It supports multiple coding assistants including Claude and Gemini for comprehensive development workflow integration.

## Features

- **Multi-Assistant Support**: Configure support for Claude, Gemini, or both assistants simultaneously
- **Intelligent Directory Structure**: Organized file structure with assistant-specific directories
- **Interactive CLI**: Enhanced user interface with colored output and progress indicators
- **Template System**: Built-in templates for different project types (basic, development, research)
- **Task Management**: Create, list, and manage tasks with status tracking
- **Installation Management**: Comprehensive installation, verification, and repair capabilities
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Quick Start

### Installation
```bash
# Install globally
npm install -g @e0ipso/ai-task-manager

# Or use with npx (no installation required)
npx @e0ipso/ai-task-manager --help
```

### Initialize a New Workspace

The `--assistants` flag is **required** when initializing a workspace. You must specify which coding assistant(s) you want to configure support for.

The `--destination-directory` flag allows you to specify an alternative directory for the workspace. By default, the workspace is initialized in the current working directory.

```bash
# Quick start with Claude
npx @e0ipso/ai-task-manager init --assistants claude
```

If the script detects that any of the folders it needs to create already exist it merge the folder structures, but it will overwrite the files in them.

## Assistant Selection

AI Task Manager supports multiple coding assistants. You **must** specify which assistant(s) to use during initialization using the `--assistants` flag.

### Supported Assistants

- **Claude**: Anthropic's Claude AI assistant
- **Gemini**: Google's Gemini AI assistant

### Single Assistant Setup

```bash
# Claude only
npx @e0ipso/ai-task-manager init --assistants claude

# Gemini only  
npx @e0ipso/ai-task-manager init --assistants gemini
```

### Multiple Assistant Setup

```bash
# Both Claude and Gemini
npx @e0ipso/ai-task-manager init --assistants claude,gemini
```

### Directory Structure

When you initialize with assistant selection, the following directory structure is created:

```
project-root/
├── .ai/
│   └── task-manager/              # Claude-specific files (if selected)
│       ├── plans
│       ├── TASK_MANAGER_INFO.md   # General information to operate the task manager
│       └── VALIDATION_GATES.md    # Validation gates for phase completion
├── .claude/
│   └── commands/                  # Custom slash commands for Claude
│       └── tasks/
│           ├── create-plan.md
│           ├── execute-blueprint.md
│           └── generate-tasks.md
├── .gemini/
│   └── commands/                  # Custom slash commands for Gemini
│       └── tasks/
│           ├── create-plan.md
│           ├── execute-blueprint.md
│           └── generate-tasks.md
└── project files...
```

## Suggested Workflow

### One-time Setup

Review and tweak the `.ai/task-manager/TASK_MANAGER_INFO.md` and `.ai/task-manager/VALIDATION_GATES.md`. These files are yours to edit and should reflect your project's tech stack and goals.

### Regular Workflow

1. Create a plan: `/tasks:create-plan Create an authentication workflow for the application using ...`
2. Provide additional context if the assistant needs it.
3. Manually review the plan and make the necessary edits. You might be tempted to skip this step, **do not skip this step**. Find the plan document in `.ai/task-manager/plans/01--authentication-workflow/plan-01--authentication-workflow.md`
4. Create the tasks for the plan: `/tasks:generate-tasks 01`
5. Review the list of tasks. This step is important to avoid scope creep. Find the tasks in the folder `.ai/task-manager/plans/01--authentication-workflow/tasks/`
6. Execute the tasks: `/tasks:execute-blueprint 01`
7. Review the implementation and the generated tests.

### Troubleshooting

#### Permission Errors

**Error**: File system permission errors during initialization

**Solutions**:
- Ensure you have write permissions to the target directory
- On Unix systems, check directory ownership: `ls -la`
- Try running with appropriate permissions or in a user-owned directory

## License

Proprietary Software with Revocation Rights.

This software is free to use, run, and operate for any lawful purposes. The
author can revoke the license to use it at any time and by any reason. A license
revocation notice may be provided through:

- Direct communication to known users
- Public announcement on the project repository
- Update to the LICENSE file
