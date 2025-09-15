---
layout: default
title: Home
nav_order: 1
description: "Transform chaotic AI prompts into structured, executable workflows"
---

# 🤖 AI Task Manager

**Transform chaotic AI prompts into structured, executable workflows.**

AI Task Manager creates custom slash commands that work within your existing Claude, Gemini, or Open Code subscriptions. No API keys, no additional costs—just better organization.

## The 3-Step Workflow

```mermaid
flowchart LR
    A[Complex User Request] --> B[📝 create-plan]
    B --> C[📋 generate-tasks]  
    C --> D[🚀 execute-blueprint]
    D --> E[Structured Implementation]
    
    style A fill:#ffebee
    style E fill:#e8f5e8
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e3f2fd
```

## Problem & Solution

**Before**: Overwhelming AI with complex prompts leads to incomplete, inconsistent results.

**After**: Systematic breakdown ensures thorough planning, organized execution, and quality outcomes.

```mermaid
flowchart TD
    subgraph "❌ Chaotic Approach"
        A1[Complex 500-word prompt] --> B1[Confused AI response]
        B1 --> C1[Missing requirements]
        C1 --> D1[Incomplete implementation]
    end
    
    subgraph "✅ Structured Approach"  
        A2[User request] --> B2[create-plan: Analysis & clarification]
        B2 --> C2[generate-tasks: Atomic breakdown]
        C2 --> D2[execute-blueprint: Focused execution]
        D2 --> E2[Complete, quality implementation]
    end
    
    style A1 fill:#ffebee
    style D1 fill:#ffebee
    style E2 fill:#e8f5e8
```

## Quick Start

Install and initialize for your preferred AI assistant:

```bash
# Claude Pro/Max users
npx @e0ipso/ai-task-manager init --assistants claude

# Gemini users  
npx @e0ipso/ai-task-manager init --assistants gemini

# Open Code users
npx @e0ipso/ai-task-manager init --assistants opencode

# Multiple assistants
npx @e0ipso/ai-task-manager init --assistants claude,gemini,opencode
```

## What It Creates

The tool generates this organized structure:

```mermaid
graph TD
    A[project-root/] --> B[.ai/task-manager/]
    A --> C[.claude/commands/tasks/]
    A --> D[.gemini/commands/tasks/]
    A --> E[.opencode/commands/tasks/]
    
    B --> B1[plans/ - Generated project plans]
    B --> B2[config/ - Project context & validation]
    
    C --> C1[create-plan.md]
    C --> C2[generate-tasks.md] 
    C --> C3[execute-blueprint.md]
    
    D --> D1[create-plan.toml]
    D --> D2[generate-tasks.toml]
    D --> D3[execute-blueprint.toml]
    
    E --> E1[create-plan.md]
    E --> E2[generate-tasks.md]
    E --> E3[execute-blueprint.md]
    
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e3f2fd
```

### Supported Assistants

| Assistant | Format | Interface | Cost Model |
|-----------|--------|-----------|------------|
| 🎭 **Claude** | Markdown | claude.ai/code | Subscription-based |
| 💎 **Gemini** | TOML | Gemini CLI | Subscription-based |  
| 📝 **Open Code** | Markdown | Open source setup | Free |

## Usage Examples

### 1. Create a Plan
```bash
/tasks:create-plan Build user authentication with OAuth2 and JWT tokens
```

### 2. Generate Tasks  
```bash
/tasks:generate-tasks 1
```

### 3. Execute Implementation
```bash
/tasks:execute-blueprint 1
```

## Value Proposition

```mermaid
flowchart LR
    A[Complex Project Requirements] --> B[AI Task Manager]
    B --> C[📋 Organized Execution]
    B --> D[⏰ Time Savings]  
    B --> E[✅ Quality Assurance]
    B --> F[🔄 Consistent Process]
    
    style A fill:#ffebee
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style D fill:#e8f5e8
    style E fill:#e8f5e8
    style F fill:#e8f5e8
```

**Benefits:**
- **Organized Execution**: Break complex projects into manageable, traceable tasks
- **Time Savings**: Eliminate back-and-forth clarifications and rework  
- **Quality Assurance**: Built-in validation gates and success criteria
- **Consistent Process**: Standardized workflow across all projects

## Frequently Asked Questions

**Q: Does this require API keys or additional costs?**
A: No. It works within your existing Claude Pro, Gemini, or Open Code subscriptions.

**Q: What file formats does it support?**  
A: Markdown for Claude/Open Code, TOML for Gemini. All converted automatically.

**Q: Can I customize the workflow?**
A: Yes. Edit the generated templates in `.ai/task-manager/config/` to match your project needs.

**Q: Does it work with existing projects?**
A: Yes. Initialize in any directory—it merges with existing structure without breaking anything.

**Q: How long does setup take?**
A: Under 30 seconds. One command creates all necessary files and slash commands.

---

**Ready to transform your AI development workflow?**

```bash
npx @e0ipso/ai-task-manager init --assistants claude
```

*Works with Claude Pro/Max, Gemini subscriptions, and Open Code setups.*