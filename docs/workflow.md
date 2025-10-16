---
layout: default
title: Basic Workflow Guide
nav_order: 3
parent: Getting Started
description: "Day-to-day workflow with AI Task Manager"
---

# 🔄 Basic Workflow Guide

This guide covers the day-to-day development workflow using AI Task Manager. Follow these steps for consistent, high-quality implementations.

## One-Time Setup

Before creating your first plan, customize the configuration files for your project:

### 1. Review TASK_MANAGER.md

Edit `.ai/task-manager/config/TASK_MANAGER.md` to include:
- Your tech stack and frameworks
- Coding standards and style guides
- Architecture decisions and patterns
- Links to relevant documentation

### 2. Configure POST_PHASE.md

Edit `.ai/task-manager/config/hooks/POST_PHASE.md` to add quality gates:
- Linting requirements
- Test execution and coverage thresholds
- Security scans
- Documentation requirements

See the [Customization Guide]({% link customization.md %}) for detailed examples.

## Daily Development Workflow

### Step 1: Create a Plan

Start any new feature or project by creating a structured plan:

```bash
/tasks:create-plan Create user authentication with email/password and JWT tokens
```

**What happens:**
- AI asks clarifying questions about your requirements
- Creates comprehensive plan document with:
  - Clarified requirements
  - Technical approach
  - Risk considerations
  - Success criteria

**Plan location**: `.ai/task-manager/plans/01--user-authentication/plan-01--user-authentication.md`

### Step 2: Provide Additional Context (Optional)

If the AI needs more information:

```
The authentication should:
- Use bcrypt for password hashing
- Issue JWT tokens with 1-hour expiration
- Include refresh token mechanism
- Follow OAuth 2.0 best practices for token handling
```

AI updates the plan with this additional context.

### Step 3: ⚠️ Review the Plan (CRITICAL)

**Do not skip this step!**

Open the plan document and verify:
- ✅ All requirements accurately captured
- ✅ No unnecessary features added (scope creep check)
- ✅ Technical approach aligns with your architecture
- ✅ Success criteria are measurable

**Edit the plan directly** if anything needs adjustment. This is YOUR plan, not just the AI's.

### Step 4: Generate Tasks

Once the plan is reviewed and approved:

```bash
/tasks:generate-tasks 1
```

**What happens:**
- AI breaks plan into atomic tasks
- Each task assigned 1-2 technical skills
- Dependencies mapped automatically
- Execution blueprint generated with phases

**Tasks location**: `.ai/task-manager/plans/01--user-authentication/tasks/`

### Step 5: ⚠️ Review Tasks (CRITICAL)

**This step prevents scope creep and ensures quality.**

Review all generated tasks in `.ai/task-manager/plans/01--user-authentication/tasks/`:
- Check each task's acceptance criteria
- Verify dependencies make sense
- Remove any tasks outside core scope
- Adjust complexity if tasks are too large

**Common adjustments:**
- Delete "nice-to-have" tasks not in original requirements
- Split overly complex tasks (3+ skills = too complex)
- Clarify vague acceptance criteria
- Add project-specific validation steps

### Step 6: Execute the Blueprint

After reviewing and approving tasks:

```bash
/tasks:execute-blueprint 1
```

**What happens:**
- AI executes tasks phase by phase
- Independent tasks run in parallel within each phase
- POST_PHASE hook validates quality after each phase
- Commits created automatically for each phase
- You receive updates as phases complete

### Step 7: Monitor Progress

Check implementation status anytime:

```bash
npx @e0ipso/ai-task-manager status
```

**Dashboard shows:**
- Summary statistics (total plans, active/archived)
- Active plans with progress bars
- Task completion counts
- Warnings for archived plans with incomplete tasks

![Dashboard](img/dashboard.svg)

### Step 8: Fix Broken Tests (If Needed)

If tests fail after implementation:

```bash
/tasks:fix-broken-tests npm test
```

**Critical**: This command enforces test integrity. It will **NOT** allow:
- Skipping tests
- Modifying assertions to match broken code
- Adding environment checks to bypass tests
- Any workarounds that don't fix the actual bug

**What it WILL do:**
- Find root cause in implementation
- Fix the actual bug
- Ensure tests pass because code truly works

See [Customization Guide]({% link customization.md %}) for fix-broken-tests details.

### Step 9: Review Implementation

After execution completes:
- Review generated code for quality
- Run full test suite locally
- Check git commits (one per phase)
- Verify success criteria from plan are met

## Advanced Workflows

For more sophisticated patterns, see [Workflow Patterns]({% link workflows.md %}):
- **Plan Mode Integration**: Combine AI brainstorming with structured execution
- **Iterative Refinement**: Multiple feedback rounds
- **Multi-Session Projects**: Large projects spanning days/weeks
- **Parallel Development**: Team coordination with dependency graphs

## Troubleshooting

### Permission Errors During Initialization

**Error**: File system permission errors when running `init`

**Solutions**:
- Ensure write permissions to target directory
- On Unix systems: `ls -la` to check directory ownership
- Try running in user-owned directory
- Avoid system directories (/usr, /etc, etc.)

### ID Generation Issues

**Error**: Plan or task ID conflicts or missing IDs

**Debugging**:
```bash
DEBUG=true node .ai/task-manager/config/scripts/get-next-plan-id.cjs
```

**Solutions**:
- Verify directory structure intact (.ai/task-manager/plans/)
- Check file permissions on plans directory
- Ensure plan documents have proper frontmatter with `id:` field
- Align directory names with plan IDs (e.g., `01--name` matches `id: 1`)

### Jekyll Build Errors in Documentation

**Error**: Documentation site won't build locally

**Solutions**:
```bash
cd docs
bundle install           # Install dependencies
bundle exec jekyll build # Test build
bundle exec jekyll serve # Run locally
```

- Check for broken internal links
- Verify all frontmatter is valid YAML
- Ensure no duplicate nav_order values

### Tasks Not Executing in Expected Order

**Issue**: Dependencies not respected during execution

**Solutions**:
- Review dependency graph in plan's execution blueprint
- Check task frontmatter for `dependencies: [list]`
- Verify circular dependencies don't exist
- Run dependency validation:
  ```bash
  node .ai/task-manager/config/scripts/check-task-dependencies.cjs 1 2
  ```

### Customization Not Applied

**Issue**: Hook or template changes not reflected in execution

**Solutions**:
- Verify file locations (.ai/task-manager/config/hooks/, .ai/task-manager/config/templates/)
- Check file permissions (files must be readable)
- Review hook syntax (must be valid Markdown)
- Restart AI assistant session after major customization changes

## Tips for Success

### 1. Always Review Plans and Tasks

The review steps exist to catch:
- Scope creep (AI adding unnecessary features)
- Missing requirements (AI missing important details)
- Technical misalignment (AI choosing wrong approach)

**Five minutes of review saves hours of rework.**

### 2. Start Small

For your first few plans:
- Choose simple, well-defined features
- Create 3-5 tasks, not 30-50
- Get comfortable with the workflow
- Learn which hooks to customize

### 3. Commit After Each Phase

AI Task Manager creates commits automatically, but you can:
- Review commit messages before pushing
- Squash commits if desired
- Create pull requests per phase or per plan

### 4. Use Status Command Frequently

```bash
npx @e0ipso/ai-task-manager status
```

Helps you:
- Track progress across multiple plans
- Identify stalled tasks
- Find plans that need attention
- Monitor team activity (if shared repository)

### 5. Archive Completed Plans

Keep active workspace clean:

```bash
mv .ai/task-manager/plans/01--completed-feature .ai/task-manager/archive/
```

Archived plans:
- Remain fully accessible
- Don't clutter status dashboard
- Preserve implementation history
- Can be referenced for future work

## Keyboard Shortcuts (In AI Assistants)

**Claude Code:**
- `/tasks:create-plan` - Start new plan
- `/tasks:generate-tasks [id]` - Generate tasks for plan
- `/tasks:execute-blueprint [id]` - Execute plan
- `/tasks:fix-broken-tests [command]` - Fix test failures

**Gemini CLI:**
Same commands, TOML format configuration

**Open Code:**
Same commands, Markdown format configuration

## Next Steps

- **[How It Works]({% link architecture.md %})**: Understand the three-phase system and design principles
- **[Customization Guide]({% link customization.md %})**: Tailor hooks and templates for your project
- **[Workflow Patterns]({% link workflows.md %})**: Advanced patterns for complex projects
- **[Features]({% link features.md %})**: Full feature overview and capabilities
