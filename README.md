# 🤖 AI Task Manager

[![npm version](https://img.shields.io/npm/v/@e0ipso/ai-task-manager.svg)](https://www.npmjs.com/package/@e0ipso/ai-task-manager)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

AI-powered task management CLI tool to improve your context. It supports multiple coding assistants including Claude and Gemini for comprehensive development workflow integration.

## ✨ Features

- 🤝 **Multi-Assistant Support**: Configure support for Claude, and Gemini
- 📋 **Template System**: Built-in templates for different project types (basic, development, research)

## 💰 Intelligent Token Usage

**One of the key benefits of this project is dramatically reducing AI costs by using the right model for the right task.**

The AI Task Manager leverages a **staged refinement approach** that maximizes the value of expensive, high-capability models while delegating execution to faster, cheaper models:

### 🧠 Use Premium Models for Complex Analysis
- **Planning Phase** (`/tasks:create-plan`): Deploy your most capable models (Claude Opus, GPT-5, etc.) for deep requirement analysis, architecture decisions, and strategic planning
- **Task Generation** (`/tasks:generate-tasks`): Leverage advanced reasoning for complex decomposition, dependency mapping, and scope optimization

### ⚡ Use Fast Models for Execution
- **Blueprint Execution** (`/tasks:execute-blueprint`): Switch to faster, cost-effective models (Gemini 2.0 Flash, Claude Haiku) for task execution
- **Individual Tasks**: Sub-agents can also choose to use simpler models since most complexity is resolved during planning

### 💡 Why This Works
The heavy cognitive lifting happens during plan creation and task generation. By the time you reach execution, the blueprint documents are detailed and specific enough that simpler models can reliably implement them. This approach can **reduce your AI costs** and be **significantly faster** compared to using premium models for all phases.

_The more complex your project, the greater the savings._

## 🚀 Quick Start

### 🏗️ Initialize a New Workspace

The `--assistants` flag is **required** when initializing a workspace. You must specify which coding assistant(s) you want to configure support for.

AI Task Manager supports multiple coding assistants. You **must** specify which assistant(s) to use during initialization using the `--assistants` flag.

🤖 Supported Assistants are

- 🎭 **Claude**: Anthropic's Claude AI assistant
- 💎 **Gemini**: Google's Gemini AI assistant

The `--destination-directory` flag allows you to specify an alternative directory for the workspace. By default, the workspace is initialized in the current working directory.

```bash
# Claude only
npx @e0ipso/ai-task-manager init --assistants claude

# Gemini only
npx @e0ipso/ai-task-manager init --assistants gemini

# Both Claude and Gemini
npx @e0ipso/ai-task-manager init --assistants claude,gemini
```

If the script detects that any of the folders it needs to create already exist it merge the folder structures, but it will overwrite the files in them.

### 📂 Directory Structure

When you initialize with assistant selection, the following directory structure is created:

```
project-root/
├── .ai/
│   └── task-manager/              # Claude-specific files (if selected)
│       ├── plans
│       ├── TASK_MANAGER.md   # General information to operate the task manager
│       └── POST_PHASE.md    # Validation gates for phase completion
├── .claude/
│   └── commands/                  # Custom slash commands for Claude
│       └── tasks/
│           ├── create-plan.md
│           ├── execute-blueprint.md
│           └── generate-tasks.md
├── .gemini/
│   └── commands/                  # Custom slash commands for Gemini
│       └── tasks/
│           ├── create-plan.toml
│           ├── execute-blueprint.toml
│           └── generate-tasks.toml
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

⚖️ **Proprietary Software with Revocation Rights.**

This software is free to use, run, and operate for any lawful purposes. The
author can revoke the license to use it at any time and by any reason. A license
revocation notice may be provided through:

- 📧 Direct communication to known users
- 📢 Public announcement on the project repository
- 📝 Update to the LICENSE file
