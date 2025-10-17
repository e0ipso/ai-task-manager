---
layout: default
title: Reference
nav_order: 9
has_children: true
description: "Comparisons, technical details, and reference documentation"
---

# Reference

Technical reference and comparison documentation for AI Task Manager.

## Understanding AI Task Manager

This section provides detailed comparisons and technical context to help you understand when and how to use AI Task Manager effectively.

## What You'll Learn

In this section:

- **[Comparison with Other Tools](comparison.html)**: Understand the differences between plan mode and structured task management, and how AI Task Manager compares to other tools

## Key Differentiators

### Progressive Refinement with Validation Gates
AI Task Manager introduces **mandatory human review gates** between distinct phases, giving you control over scope and quality at each step.

### Subscription-Based Model
Works within your existing AI assistant subscriptions (Claude Pro/Max, Gemini). No additional API keys, no pay-per-token charges, no external service dependencies.

### Extensibility Architecture
Fully customizable through hooks, templates, and configuration files. Every aspect of the workflow can be tailored to your project's specific needs.

### Skill-Based Agent Deployment
Tasks are automatically assigned to specialized agents based on their skill requirements, enabling parallel execution and domain expertise.

## CLI Commands

### Plan Management

Command-line interface for inspecting and managing plans:

```bash
npx @e0ipso/ai-task-manager plan <subcommand> <plan-id>
```

**Subcommands:**

**`plan show <plan-id>`** or **`plan <plan-id>`** (shorthand)
Display plan metadata, executive summary, and task progress.

```bash
npx @e0ipso/ai-task-manager plan show 41
npx @e0ipso/ai-task-manager plan 41  # shorthand
```

**`plan archive <plan-id>`**
Move a completed plan from `plans/` directory to `archive/` directory.

```bash
npx @e0ipso/ai-task-manager plan archive 41
```

**`plan delete <plan-id>`**
Permanently delete a plan and all associated tasks. Cannot be undone.

```bash
npx @e0ipso/ai-task-manager plan delete 41
```

**Usage Notes:**
- Plan ID must be numeric
- Commands work on both active plans (in `plans/`) and archived plans (in `archive/`)
- Shorthand `plan <id>` defaults to `plan show <id>` for convenience

See [Workflow Guide](workflow.html) for integrated workflow usage examples.

## When to Use AI Task Manager

Use AI Task Manager when you need:
- Complex multi-step projects (3+ features)
- Tight scope control and YAGNI enforcement
- Multiple implementation approaches to evaluate
- Review before execution
- Multi-session projects spanning days/weeks
- Parallel task execution benefits
- Clear task tracking and progress visibility

## Next Steps

Explore [Comparison with Other Tools](comparison.html) to understand when to use AI Task Manager versus traditional plan mode or other task management tools.
