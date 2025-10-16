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
- **AI Assistant**: Active subscription to Claude, Gemini, or access to Open Code

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

# Gemini only (for use with Gemini CLI)
npx @e0ipso/ai-task-manager init --assistants gemini

# Open Code only (for open source assistants)
npx @e0ipso/ai-task-manager init --assistants opencode
```

### Multiple Assistants

Configure multiple assistants for team flexibility:

```bash
npx @e0ipso/ai-task-manager init --assistants claude,gemini,opencode
```

All assistants share the same task management structure (plans, tasks, configurations) while using assistant-specific command formats.

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
│       │   │   └── POST_ERROR_DETECTION.md
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
│       ├── generate-tasks.md
│       ├── execute-blueprint.md
│       ├── execute-task.md
│       └── fix-broken-tests.md
├── .gemini/                       # Gemini files (if --assistants gemini)
│   └── commands/tasks/
│       ├── create-plan.toml       # TOML format for Gemini
│       ├── generate-tasks.toml
│       ├── execute-blueprint.toml
│       ├── execute-task.toml
│       └── fix-broken-tests.toml
└── .opencode/                     # Open Code files (if --assistants opencode)
    └── commands/tasks/
        ├── create-plan.md
        ├── generate-tasks.md
        ├── execute-blueprint.md
        ├── execute-task.md
        └── fix-broken-tests.md
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

**For Gemini:**
```bash
ls -la .gemini/commands/tasks/
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

See the [Customization Guide]({% link customization.md %}) for:
- Template modifications
- Hook customization examples
- Real-world scenarios (React projects, API projects, monorepos)

## Next Steps

- **[Basic Workflow Guide]({% link workflow.md %})**: Learn the day-to-day development workflow
- **[How It Works]({% link architecture.md %})**: Understand the three-phase system
- **[Customization Guide]({% link customization.md %})**: Tailor AI Task Manager to your project

Ready to create your first plan:

```bash
# In your AI assistant (Claude, Gemini, or Open Code):
/tasks:create-plan "Your project description here"
```
