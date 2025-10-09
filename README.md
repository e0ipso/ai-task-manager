# 🤖 AI Task Manager

[![npm version](https://img.shields.io/npm/v/@e0ipso/ai-task-manager.svg)](https://www.npmjs.com/package/@e0ipso/ai-task-manager)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**AI-powered task management that creates structured workflows within your existing AI subscriptions.**

Transform chaotic AI prompts into organized, executable development workflows through custom slash commands for Claude Code, Gemini CLI, and Open Code.

## 💰 No Additional Costs

Unlike Plandex, Claude Task Master, and Conductor Tasks that require API keys with pay-per-token pricing, **AI Task Manager works within your existing AI subscriptions** - no API keys or additional costs required.

## 🚀 Quick Start

```bash
# Initialize for your preferred AI assistant
npx @e0ipso/ai-task-manager init --assistants claude
npx @e0ipso/ai-task-manager init --assistants gemini
npx @e0ipso/ai-task-manager init --assistants opencode

# Or configure multiple assistants
npx @e0ipso/ai-task-manager init --assistants claude,gemini,opencode

# Re-run init to update configuration files
# Your customizations are protected with conflict detection
npx @e0ipso/ai-task-manager init --assistants claude

# Force overwrite all files (bypass conflict detection)
npx @e0ipso/ai-task-manager init --assistants claude --force
```

## 📖 Documentation

**For complete setup instructions, features, and workflow guides, visit:**

### 🌐 **[Documentation Site →](https://mateuaguilo.com/ai-task-manager/)**

The documentation includes:
- Detailed installation and setup instructions
- Complete workflow guides with examples
- Feature overview and capabilities
- Troubleshooting and best practices
- Architecture and customization details

## 💡 Quick Workflow Preview

1. **📝 Create a plan**: `/tasks:create-plan Create user authentication system`
2. **📋 Generate tasks**: `/tasks:generate-tasks 1`
3. **🚀 Execute blueprint**: `/tasks:execute-blueprint 1`

## 🤖 Supported Assistants

| Assistant | Interface | Cost Model |
|-----------|-----------|------------|
| 🎭 **Claude** | [claude.ai/code](https://claude.ai/code) | Your existing subscription |
| 💎 **Gemini** | Gemini CLI | Your existing subscription |
| 📝 **Open Code** | Open source | Free |

## 📄 License

MIT License - Open source and free to use.
