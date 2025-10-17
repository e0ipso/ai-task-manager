---
layout: default
title: Customization & Extension
nav_order: 6
has_children: true
description: "Customizing hooks, templates, and workflows for your project needs"
---

# Customization & Extension

AI Task Manager is built for extensibility. **Every aspect of the task management workflow can be tailored to your project's specific needs** through customizable hooks, templates, and configuration files.

## Why Customize?

Out-of-the-box, AI Task Manager provides a solid foundation for structured AI-assisted development. Customization unlocks its full potential:

- **Project-Specific Quality Gates**: Add TypeScript compilation, test coverage thresholds, security scans, or performance benchmarks
- **Domain-Specific Templates**: Include acceptance criteria relevant to your industry (HIPAA compliance, GDPR requirements, accessibility standards)
- **Team Consistency**: Encode your organization's best practices into templates and hooks
- **Tool Integration**: Connect with existing CI/CD pipelines, testing frameworks, or documentation systems
- **Workflow Patterns**: Create reusable patterns for common project types (React apps, REST APIs, data pipelines)

## What You'll Learn

In this section:

- **[Customization Guide](customization.html)**: Tailor hooks and templates to your project
- **[Workflow Patterns](workflows.html)**: Advanced patterns for complex projects

## Customization Points

### Hooks System
Seven lifecycle hooks inject custom logic at key points in the workflow. All hooks are Markdown files in `.ai/task-manager/config/hooks/`:

- **PRE_PLAN**: Pre-planning guidance
- **PRE_PHASE**: Phase preparation logic
- **POST_PHASE**: Validation gates after each phase
- **POST_PLAN**: Plan validation
- **POST_TASK_GENERATION_ALL**: Task complexity analysis and blueprint generation
- **PRE_TASK_ASSIGNMENT**: Agent selection based on skills
- **POST_ERROR_DETECTION**: Error handling procedures

### Templates System
Five customizable templates structure artifacts in `.ai/task-manager/config/templates/`:

- **PLAN_TEMPLATE.md**: Strategic planning structure
- **TASK_TEMPLATE.md**: Individual task documents
- **BLUEPRINT_TEMPLATE.md**: Phase-based execution plans
- **EXECUTION_SUMMARY_TEMPLATE.md**: Post-completion documentation
- **fix-broken-tests.md**: Test integrity enforcement

### Configuration Files
- **TASK_MANAGER.md**: Project context for AI assistants
- **Scripts**: Custom ID generation logic

## Next Steps

Start with the [Customization Guide](customization.html) for detailed examples and real-world scenarios, then explore [Workflow Patterns](workflows.html) for advanced usage.
