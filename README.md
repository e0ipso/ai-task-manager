# 🤖 AI Task Manager

[![npm version](https://img.shields.io/npm/v/@e0ipso/ai-task-manager.svg)](https://www.npmjs.com/package/@e0ipso/ai-task-manager)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

AI-powered task management that creates structured workflows within your existing AI subscriptions. Supports Claude Code, Gemini CLI, and Open Code through custom slash commands.

💰 Unlike projects such as **Plandex**, **Claude Task Master**, and **Conductor Tasks** that require API keys with pay-per-token pricing, **AI Task Manager** works within your existing AI subscription interface. Simply log in to your Claude or Gemini account and use the slash commands - **no API keys or additional costs required**.

## How It Works

This tool creates custom slash commands (like `/tasks:create-plan`, `/tasks:generate-tasks`) that integrate directly into:
- **Claude Code**: Works with your Claude Pro/Max subscription via [claude.ai/code](https://claude.ai/code)
- **Gemini CLI**: Uses your existing Gemini subscription  
- **Open Code**: Leverages your preferred open-source setup

## ✨ Features

- 🤝 **Multi-Assistant Support**: Configure support for Claude, Gemini, and Open Code
- 📋 **Template System**: Built-in templates for different project types (basic, development, research)


## 🚀 Quick Start

### 🏗️ Initialize a New Workspace

The `--assistants` flag is **required** when initializing a workspace. You must specify which coding assistant(s) you want to configure support for.

AI Task Manager supports multiple coding assistants. You **must** specify which assistant(s) to use during initialization using the `--assistants` flag.

🤖 Supported Assistants are

- 🎭 **Claude**: Anthropic's Claude AI assistant
- 💎 **Gemini**: Google's Gemini AI assistant
- 📝 **Open Code**: Open source code assistant

The `--destination-directory` flag allows you to specify an alternative directory for the workspace. By default, the workspace is initialized in the current working directory.

```bash
# Claude only
npx @e0ipso/ai-task-manager init --assistants claude

# Gemini only
npx @e0ipso/ai-task-manager init --assistants gemini

# Open Code only
npx @e0ipso/ai-task-manager init --assistants opencode

# Multiple assistants
npx @e0ipso/ai-task-manager init --assistants claude,gemini
npx @e0ipso/ai-task-manager init --assistants claude,opencode
npx @e0ipso/ai-task-manager init --assistants claude,gemini,opencode
```

If the script detects that any of the folders it needs to create already exist it merge the folder structures, but it will overwrite the files in them.

### 📂 Directory Structure

When you initialize with assistant selection, the following directory structure is created:

```
project-root/
├── .ai/
│   └── task-manager/              # Shared configuration files
│       ├── plans
│       ├── TASK_MANAGER.md   # General information to operate the task manager
│       └── POST_PHASE.md    # Validation gates for phase completion
├── .claude/                       # Claude files (if selected)
│   └── commands/                  # Custom slash commands for Claude
│       └── tasks/
│           ├── create-plan.md
│           ├── execute-blueprint.md
│           └── generate-tasks.md
├── .gemini/                       # Gemini files (if selected)
│   └── commands/                  # Custom slash commands for Gemini
│       └── tasks/
│           ├── create-plan.toml
│           ├── execute-blueprint.toml
│           └── generate-tasks.toml
├── .opencode/                     # Open Code files (if selected)
│   └── commands/                  # Custom slash commands for Open Code
│       └── tasks/
│           ├── create-plan.md
│           ├── execute-blueprint.md
│           └── generate-tasks.md
└── project files...
```

## 💡 Suggested Workflow

### 📋 One-time Setup

Review and tweak the `.ai/task-manager/TASK_MANAGER.md` and `.ai/task-manager/config/hooks/POST_PHASE.md`. These files are yours to edit and should reflect your project's tech stack and goals.

### 🔄 Day-to-day Workflow

1. 📝 Create a plan: `/tasks:create-plan Create an authentication workflow for the application using ...`
2. 💬 Provide additional context if the assistant needs it.
3. ⚠️ Manually review the plan and make the necessary edits. You might be tempted to skip this step, **do not skip this step**. Find the plan document in `.ai/task-manager/plans/01--authentication-workflow/plan-01--authentication-workflow.md`
4. 📋 Create the tasks for the plan: `/tasks:generate-tasks 1`
5. 👀 Review the list of tasks. This step is important to avoid scope creep and ensure the right things are to be built. Again, **do not skip this step**. Find the tasks in the folder `.ai/task-manager/plans/01--authentication-workflow/tasks/`
6. 🚀 Execute the tasks: `/tasks:execute-blueprint 1`
7. ✅ Review the implementation and the generated tests.

## 🔧 Troubleshooting

<details>
<summary>🚫 Permission Errors</summary>

**Error**: File system permission errors during initialization

**Solutions**:
- Ensure you have write permissions to the target directory
- On Unix systems, check directory ownership: `ls -la`
- Try running with appropriate permissions or in a user-owned directory

</details>

## 📄 License

⚖️ **Open Source MIT License**
