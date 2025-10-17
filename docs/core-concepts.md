---
layout: default
title: Core Concepts
nav_order: 5
has_children: true
description: "Understanding AI Task Manager architecture, design principles, and features"
---

# Core Concepts

Understand how AI Task Manager works under the hood. This section covers the architecture, design principles, and comprehensive feature set.

## Architecture Overview

AI Task Manager uses **progressive refinement** with **validation gates** to transform chaotic AI development into structured, manageable workflows:

- **Context Isolation**: Each phase operates with focused context
- **Mandatory Human Review**: Control what gets built at each phase
- **Skill-Based Decomposition**: Specialized agents handle specific tasks
- **Parallel Execution**: Independent tasks run simultaneously

## What You'll Learn

In this section:

- **[How It Works](architecture.html)**: Understand the three-phase system and design principles
- **[Features](features.html)**: Comprehensive overview of all capabilities

## Key Principles

### Progressive Refinement
Break complex projects into manageable phases with human review gates between each stage.

### YAGNI Enforcement
Built-in scope control prevents feature creep through multiple validation checkpoints.

### Quality Assurance
Validation gates and hooks ensure quality at each phase, not just at the end.

## Next Steps

Start with [How It Works](architecture.html) to understand the architecture, then explore [Features](features.html) for a complete capability overview.
