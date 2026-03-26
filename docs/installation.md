---
layout: default
title: Installation & Setup
nav_order: 2
parent: Getting Started
description: "Installing and configuring AI Task Manager"
---

# 📦 Installation & Setup

AI Task Manager initializes quickly with a single command, creating all necessary configuration files and directory structure for your project.

## Prerequisites

- **Node.js**: Version 14.0 or higher
- **npm**: Comes with Node.js
- **AI Assistant**: Active subscription to Claude, Cursor, Gemini, GitHub Copilot, Codex, or access to Open Code

## Installation

No global installation required. Use `npx` to run AI Task Manager directly:

```bash
npx @e0ipso/ai-task-manager init --assistants claude
```

## Assistant Configuration

The `--assistants` flag is **required** when initializing. You must specify which AI assistant(s) you want to configure.

### Single Assistant Setup

```bash
# Claude only (for use with claude.ai/code)
npx @e0ipso/ai-task-manager init --assistants claude

# Cursor only (for use with Cursor IDE)
npx @e0ipso/ai-task-manager init --assistants cursor

# Gemini only (for use with Gemini CLI)
npx @e0ipso/ai-task-manager init --assistants gemini

# Open Code only (for open source assistants)
npx @e0ipso/ai-task-manager init --assistants opencode

# Codex only (for use with Codex CLI)
npx @e0ipso/ai-task-manager init --assistants codex

# GitHub Copilot only (for use in VS Code/JetBrains IDEs)
npx @e0ipso/ai-task-manager init --assistants github
```

### Multiple Assistants

Configure multiple assistants for team flexibility:

```bash
npx @e0ipso/ai-task-manager init --assistants claude,cursor,gemini,opencode,codex,github
```

All assistants share the same task management structure (plans, tasks, configurations) while using assistant-specific command formats.

**Note**: For Codex-specific workflow and GitHub Copilot IDE requirements, see [AGENTS.md](https://github.com/e0ipso/ai-task-manager/blob/main/AGENTS.md) in the repository.

### Custom Destination Directory

By default, AI Task Manager initializes in the current working directory. Use `--destination-directory` to specify an alternative location:

```bash
npx @e0ipso/ai-task-manager init \
  --assistants claude \
  --destination-directory /path/to/project
```

## Directory Structure

When you initialize, the following structure is created:

```
project-root/
├── .ai/
│   └── task-manager/              # Shared configuration files
│       ├── plans/                 # Active plans (empty initially)
│       ├── archive/               # Completed plans (empty initially)
│       ├── config/
│       │   ├── TASK_MANAGER.md   # Project context (customize this!)
│       │   ├── hooks/             # Lifecycle hooks
│       │   │   ├── PRE_PLAN.md
│       │   │   ├── PRE_PHASE.md
│       │   │   ├── POST_PHASE.md
│       │   │   ├── POST_PLAN.md
│       │   │   ├── POST_TASK_GENERATION_ALL.md
│       │   │   ├── PRE_TASK_ASSIGNMENT.md
│       │   │   ├── PRE_TASK_EXECUTION.md
│       │   │   ├── POST_ERROR_DETECTION.md
│       │   │   └── POST_EXECUTION.md
│       │   ├── templates/         # Customizable templates
│       │   │   ├── PLAN_TEMPLATE.md
│       │   │   ├── TASK_TEMPLATE.md
│       │   │   ├── BLUEPRINT_TEMPLATE.md
│       │   │   └── EXECUTION_SUMMARY_TEMPLATE.md
│       │   └── scripts/           # ID generation scripts
│       │       ├── get-next-plan-id.cjs
│       │       └── get-next-task-id.cjs
│       └── .init-metadata.json    # File conflict detection tracking
├── .claude/                       # Claude files (if --assistants claude)
│   └── commands/tasks/
│       ├── create-plan.md
│       ├── refine-plan.md
│       ├── generate-tasks.md
│       ├── execute-blueprint.md
│       ├── execute-task.md
│       └── fix-broken-tests.md
├── .cursor/                       # Cursor files (if --assistants cursor)
│   └── commands/tasks/
│       ├── create-plan.md
│       ├── refine-plan.md
│       ├── generate-tasks.md
│       ├── execute-blueprint.md
│       ├── execute-task.md
│       └── fix-broken-tests.md
├── .gemini/                       # Gemini files (if --assistants gemini)
│   └── commands/tasks/
│       ├── create-plan.toml       # TOML format for Gemini
│       ├── refine-plan.toml
│       ├── generate-tasks.toml
│       ├── execute-blueprint.toml
│       ├── execute-task.toml
│       └── fix-broken-tests.toml
├── .opencode/                     # Open Code files (if --assistants opencode)
│   └── commands/tasks/
│       ├── create-plan.md
│       ├── refine-plan.md
│       ├── generate-tasks.md
│       ├── execute-blueprint.md
│       ├── execute-task.md
│       └── fix-broken-tests.md
├── .codex/                        # Codex files (if --assistants codex)
│   └── prompts/
│       ├── tasks-create-plan.md
│       ├── tasks-refine-plan.md
│       ├── tasks-generate-tasks.md
│       ├── tasks-execute-blueprint.md
│       ├── tasks-execute-task.md
│       ├── tasks-fix-broken-tests.md
│       └── tasks-full-workflow.md
└── .github/                       # GitHub Copilot files (if --assistants github)
    └── prompts/
        ├── tasks-create-plan.prompt.md
        ├── tasks-refine-plan.prompt.md
        ├── tasks-generate-tasks.prompt.md
        ├── tasks-execute-blueprint.prompt.md
        ├── tasks-execute-task.prompt.md
        ├── tasks-fix-broken-tests.prompt.md
        └── tasks-full-workflow.prompt.md
```

## Updating Configuration

### Re-running init

Re-run the init command to update configuration files to the latest version:

```bash
npx @e0ipso/ai-task-manager init --assistants claude
```

**File Conflict Detection** automatically:
- Compares current files to original versions using SHA-256 hashes
- Prompts if you've customized files (shows unified diff)
- Updates unchanged files automatically
- Preserves your customizations

### Force Mode

Bypass conflict detection prompts (useful for automation):

```bash
npx @e0ipso/ai-task-manager init --assistants claude --force
```

**Warning**: Force mode overwrites ALL files, including your customizations. Back up custom hooks and templates first!

### Protected Files

The `config/scripts/` directory is **never** overwritten by init, even in force mode. Your custom ID generation logic is always preserved.

## Verification

Verify successful installation:

### 1. Check Directory Structure

```bash
ls -la .ai/task-manager/
```

You should see: `plans/`, `archive/`, `config/`

### 2. Check Assistant Commands

**For Claude:**
```bash
ls -la .claude/commands/tasks/
```

**For Cursor:**
```bash
ls -la .cursor/commands/tasks/
```

**For Gemini:**
```bash
ls -la .gemini/commands/tasks/
```

**For Codex:**
```bash
ls -la .codex/prompts/
```

**For GitHub Copilot:**
```bash
ls -la .github/prompts/
```

### 3. Test Status Command

```bash
npx @e0ipso/ai-task-manager status
```

Should show: "No active plans found" (until you create your first plan)

## Customizing for Your Project

After installation, customize these files for your specific needs:

### Essential Customizations

1. **`.ai/task-manager/config/TASK_MANAGER.md`**
   - Add project context (tech stack, coding standards, architecture decisions)
   - Include links to design docs, API specs, or style guides
   - Document project-specific conventions

2. **`.ai/task-manager/config/hooks/POST_PHASE.md`**
   - Add your quality gates (linting, tests, coverage thresholds)
   - Include deployment steps (staging, production)
   - Add notification steps (Slack, email, dashboard updates)

### Advanced Customizations

See the [Customization Guide](customization.html) for:
- Template modifications
- Hook customization examples
- Real-world scenarios (React projects, API projects, monorepos)

## Next Steps

- **[Basic Workflow Guide](workflow.html)**: Learn the day-to-day development workflow
- **[How It Works](architecture.html)**: Understand the three-phase system
- **[Customization Guide](customization.html)**: Tailor AI Task Manager to your project

Ready to create your first plan:

```bash
# In Claude, Gemini, or Open Code:
/tasks:create-plan "Your project description here"

# In Cursor:
/tasks/create-plan Your project description here

# In Codex:
/prompts:tasks-create-plan "Your project description here"

# In GitHub Copilot (VS Code/JetBrains):
/tasks-create-plan Your project description here
```
