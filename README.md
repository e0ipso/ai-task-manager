# 🤖 AI Task Manager

[![npm version](https://img.shields.io/npm/v/@e0ipso/ai-task-manager.svg)](https://www.npmjs.com/package/@e0ipso/ai-task-manager)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

![Dashboard](./docs/img/dashboard.svg)

**Extensible AI-powered task management with customizable workflows and structured development processes.**

Transform complex AI prompts into organized, executable workflows through customizable hooks, templates, and progressive refinement. Works seamlessly within your existing AI subscriptions for Claude Code, Gemini CLI, and Open Code.

## 🚀 Quick Start

```bash
# Initialize for your preferred AI assistant
npx @e0ipso/ai-task-manager init --assistants claude
npx @e0ipso/ai-task-manager init --assistants gemini
npx @e0ipso/ai-task-manager init --assistants opencode
npx @e0ipso/ai-task-manager init --assistants github

# Or configure multiple assistants
npx @e0ipso/ai-task-manager init --assistants claude,gemini,opencode,github
```

## ✨ Key Benefits

- **🔧 Fully Customizable**: Tailor hooks, templates, and workflows to your project's specific needs
- **🎯 Extensible Architecture**: Add custom validation gates, quality checks, and workflow patterns
- **📋 Structured Workflows**: Three-phase progressive refinement with validation gates
- **🔄 Plan Mode Integration**: Enhance existing AI assistant features with structured task management
- **📊 Plan Inspection & Management**: View progress, archive completed work, and manage plans via CLI
- **💰 Works Within Subscriptions**: No additional API keys or costs required

## 📖 Documentation

### 🌐 **[Complete Documentation →](https://mateuaguilo.com/ai-task-manager/)**

Comprehensive guides covering:
- Installation and configuration
- Customization with hooks and templates
- Workflow patterns and best practices
- Architecture and design principles

## 🔄 Workflow Preview

**Automated Workflow (Recommended for Beginners):**
```bash
/tasks:full-workflow Create user authentication system
```

**Manual Workflow (Full Control):**
1. **📝 Create a plan** → `/tasks:create-plan Create user authentication system`
2. **🔍 Refine the plan** → `/tasks:refine-plan 1` (have a second assistant review the plan, ask clarifying questions, and update the document before tasks are created)
3. **📋 Generate tasks** → `/tasks:generate-tasks 1`
4. **🚀 Execute blueprint** → `/tasks:execute-blueprint 1`
5. **📊 Monitor progress** → `npx @e0ipso/ai-task-manager status`
6. **🗂️ Manage plans** → `npx @e0ipso/ai-task-manager plan show 1`

## 🤖 Supported Assistants

| Assistant | Interface | Setup Time |
|-----------|-----------|------------|
| 🎭 **Claude** | [claude.ai/code](https://claude.ai/code) | < 30 seconds |
| 💎 **Gemini** | Gemini CLI | < 30 seconds |
| 📝 **Open Code** | Open source | < 30 seconds |
| 🐙 **GitHub Copilot** | VS Code / JetBrains IDEs | < 30 seconds |

## 📄 License

MIT License - Open source and free to use.
