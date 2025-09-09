# 🤖 AI Task Manager

[![npm version](https://img.shields.io/npm/v/@e0ipso/ai-task-manager.svg)](https://www.npmjs.com/package/@e0ipso/ai-task-manager)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

## 🔥 **Use Your Existing AI Subscription**

**Unlike Aider, Taskmaster, and Cursor**, AI Task Manager works **within** your existing AI subscription interfaces (Claude Pro/Max, Gemini, etc.). This is NOT another AI agent that requires API keys - it creates slash commands that run inside your AI tools you already pay for.

### 🏗️ **How This Actually Works**

This tool creates **custom slash commands** (like `/tasks:create-plan`, `/tasks:generate-tasks`) that integrate directly into:
- **Claude Code**: Works with your Claude Pro/Max subscription via [claude.ai/code](https://claude.ai/code)
- **Gemini CLI**: Uses your existing Gemini subscription
- **Open Code**: Leverages your preferred open-source setup

### 💰 **Billing Model Comparison**

| Tool  | Additional API Costs | Total for Subscription Users |
|------|---------------------|------------------------------|
| **AI Task Manager**  | **$0** | **$0** (uses existing subscription) |
| **Plandex Cloud**  | Included credits | *$45/month* |
| **Plandex (BYOK)**  | Unpredictable (API usage) | *Unpredictable costs* |
| **Claude Task Master** | Unpredictable (API usage) | *Unpredictable costs* |
| **Conductor Tasks**  | Unpredictable (API usage) | *Unpredictable costs* |
| **Shrimp Task Manager**  | Unpredictable (API usage) | *Unpredictable costs* |

<details>
<summary>📋 More Details</summary>

| Tool | Stars | Type | Key Features | Documentation |
|------|-------|------|--------------|---------------|
| **AI Task Manager** | New | Task Management System | ✅ Plans→Tasks→Execution workflow<br>✅ Native slash commands<br>✅ No API keys needed | This README |
| **[Plandex](https://github.com/plandex-ai/plandex)** | 14k+ | AI Coding Agent | ✅ Handles 2M token context<br>✅ Multi-file editing<br>⚠️ Terminal-based (not in IDE) | [Docs](https://docs.plandex.ai/) |
| **[Claude Task Master](https://github.com/eyaltoledano/claude-task-master)** | 4.2k+ | Task Management  | ✅ PRD→Tasks workflow<br>✅ MCP integration<br>⚠️ Requires API keys | [Tutorial](https://github.com/eyaltoledano/claude-task-master/blob/main/docs/tutorial.md) |
| **[Conductor Tasks](https://github.com/hridaya423/conductor-tasks)** | 38 | Visual Task Manager  | ✅ Kanban boards<br>✅ Dependency trees<br>⚠️ Requires API keys | [GitHub](https://github.com/hridaya423/conductor-tasks) |
| **[Shrimp Task Manager](https://github.com/cjo4m06/mcp-shrimp-task-manager)** | 70+ | Chain-of-Thought Tasks  | ✅ Chain-of-thought focus<br>✅ Persistent memory<br>⚠️ Requires API keys | [Docs](https://github.com/cjo4m06/mcp-shrimp-task-manager/tree/main/docs) |

</details>

### ⚡ **Predictable Costs**

Because this works within your existing AI interface:
- **No surprise API bills** - you already know what your AI subscription costs
- **No rate limiting issues** - uses your subscription's limits
- **No API key management** - just type slash commands
- **Full model access** - get the latest models as soon as they're available in your subscription

AI-powered task management that creates structured workflows within your existing AI subscriptions. Supports Claude Code, Gemini CLI, and Open Code through custom slash commands.

### 🎯 Key Differentiators

**1. Zero Additional Costs**: AI Task Manager is the **only tool** that works within your existing AI subscriptions (Claude Pro/Max, Gemini, etc.) without any API fees or additional subscriptions.

**2. Native Integration**: Unlike terminal-based tools (Plandex) or MCP servers requiring complex setup, AI Task Manager creates simple slash commands that work directly in your AI interface (claude.ai/code, Gemini CLI, etc.).

**3. Complete Workflow**: Full planning → task generation → execution workflow, matching enterprise tools like Claude Task Master but without the API key requirement.

**4. Predictable Costs**: No surprise API bills. You already know what your AI subscription costs - there's nothing extra to pay.

## ✨ Features

- 🤝 **Multi-Assistant Support**: Configure support for Claude, Gemini, and Open Code
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
