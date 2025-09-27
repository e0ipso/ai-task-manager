---
layout: default
title: Templates System
nav_order: 4
description: "Guide to the AI Task Manager templates system"
---

# 📄 Templates System

The AI Task Manager uses a templates system to provide consistent structure for plans, tasks, and execution artifacts. Templates are stored in `.ai/task-manager/config/templates/` and can be customized for project-specific needs.

## Available Templates

The system includes 5 core templates:

### 1. PLAN_TEMPLATE.md

**Purpose**: Provides the structure for comprehensive project plans.

**Sections**:
- **Frontmatter** (YAML):
  - `id`: Unique plan identifier (e.g., "plan-001")
  - `summary`: Brief description of the plan
  - `created`: Timestamp of creation

- **Content Sections**:
  - Original Work Order
  - Plan Clarifications (Q&A format)
  - Executive Summary
  - Context
  - Technical Implementation Approach
  - Risk Considerations
  - Success Criteria
  - Resource Requirements

**Usage**: Automatically used by `/tasks:create-plan` command when generating new plans.

### 2. TASK_TEMPLATE.md

**Purpose**: Defines the structure for individual task documents.

**Sections**:
- **Frontmatter** (YAML):
  - `id`: Unique task identifier (e.g., "task-001")
  - `group`: Logical grouping for related tasks
  - `dependencies`: Array of task IDs this task depends on
  - `status`: Current status (pending/in-progress/completed/failed)
  - `created`: Timestamp of creation
  - `skills`: Required technical skills

- **Content Sections**:
  - Objective
  - Acceptance Criteria (checkbox list)
  - Technical Requirements
  - Input Dependencies
  - Output Artifacts
  - Implementation Notes

**Special Note**: Tasks remind agents to use their internal Todo tool for tracking acceptance criteria.

### 3. BLUEPRINT_TEMPLATE.md

**Purpose**: Structures the phase-based execution blueprint within plans.

**Sections**:
- **Validation Gates Reference**: Points to `/config/hooks/POST_PHASE.md`
- **Phase Definitions**: Each phase includes:
  - Descriptive phase name
  - List of parallel tasks
  - Dependency annotations
- **Post-phase Actions**: Additional steps after phase completion
- **Execution Summary**:
  - Total phases count
  - Total tasks count
  - Maximum parallelism metric
  - Critical path length

**Usage**: Applied during `/tasks:generate-tasks` when creating the execution blueprint.

### 4. EXECUTION_SUMMARY_TEMPLATE.md

**Purpose**: Documents the final execution results after blueprint completion.

**Sections**:
- **Status**: Completion status with emoji indicator (✅)
- **Completed Date**: YYYY-MM-DD format
- **Results**: Brief summary of deliverables
- **Noteworthy Events**: Challenges, findings, or "No significant issues"
- **Recommendations**: Follow-up actions or optimizations

**Usage**: Appended to plans by `/tasks:execute-blueprint` upon successful completion.

### 5. fix-broken-tests.md

**Purpose**: Provides a systematic approach to fixing tests that break after implementation.

**Key Features**:
- **Integrity Requirements**: Emphasizes fixing actual bugs rather than test manipulation
- **Anti-Cheating Measures**: Explicitly prohibits test skipping, assertion modification, or conditional workarounds
- **Proper Process**: Step-by-step approach to identify, diagnose, and fix root causes
- **Test Command Integration**: Accepts test command as parameter or reads from CLAUDE.md

**Usage**: Called with `/tasks:fix-broken-tests [test-command]` when tests fail after task execution.

**Critical Philosophy**:
- Green tests must reflect actual working code
- Fixing tests means fixing the underlying implementation issues
- No shortcuts or workarounds that mask real problems

## Template Customization

### How to Customize

1. **Navigate to templates directory**:
   ```bash
   cd .ai/task-manager/config/templates/
   ```

2. **Edit the template files** directly with your preferred editor

3. **Maintain required fields** - Keep all YAML frontmatter fields even if adding new ones

4. **Add project-specific sections** as needed while preserving core structure

### Customization Guidelines

**DO**:
- Add domain-specific sections relevant to your project
- Include additional metadata fields in frontmatter
- Customize acceptance criteria templates
- Add project-specific checklists or validation steps
- Include references to your organization's standards

**DON'T**:
- Remove required frontmatter fields (id, status, created)
- Delete core structural elements
- Change field types (e.g., dependencies must remain an array)
- Modify the template file names

### Example Customizations

#### Adding Security Review to Task Template

```markdown
## Security Considerations
- [ ] No hardcoded credentials
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection in place
```

#### Adding Performance Metrics to Plan Template

```markdown
## Performance Requirements
- Response time: < 200ms for 95th percentile
- Throughput: 1000 requests/second minimum
- Memory usage: < 512MB under normal load
```

#### Enhancing Blueprint Template with Testing Phases

```markdown
### Testing Phase: [Test Type]
**Parallel Test Suites**:
- Unit Tests: Full coverage for new code
- Integration Tests: API contract validation
- Performance Tests: Load and stress testing
```

## Template Processing

### Variable Substitution

Templates support variable substitution in slash commands:

- `{{plan_id}}` - Current plan identifier
- `{{task_id}}` - Current task identifier
- `{{args}}` - User-provided arguments
- `{{timestamp}}` - Current timestamp

### Format Conversion

Templates are:
- Authored in Markdown format
- Automatically converted to TOML for Gemini assistant
- Preserved as Markdown for Claude and OpenCode assistants

## Best Practices

1. **Version Control**: Include customized templates in your repository
2. **Documentation**: Document any custom fields or sections you add
3. **Consistency**: Ensure all team members use the same templates
4. **Validation**: Test template changes with small tasks first
5. **Backwards Compatibility**: Preserve existing field structures when updating

## Integration with Hooks

Templates work in conjunction with hooks:

- **PRE_PLAN** hook validates before using PLAN_TEMPLATE
- **POST_TASK_GENERATION_ALL** uses BLUEPRINT_TEMPLATE for organization
- **POST_PHASE** references status fields from TASK_TEMPLATE
- **Execute completion** applies EXECUTION_SUMMARY_TEMPLATE

This integration ensures consistent structure while allowing flexible validation and processing through hooks.