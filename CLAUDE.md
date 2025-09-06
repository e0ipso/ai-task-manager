# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
```bash
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode compilation
npm run clean        # Remove dist/ directory
npm start            # Run compiled CLI (requires build first)
```

### Testing and Quality
```bash
npm test             # Run Jest test suite (~3 seconds, 37 tests)
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint check (excludes test files)
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier formatting
```

### Security and Maintenance
```bash
npm run security:audit        # Security audit
npm run security:fix          # Fix security issues
npm run prepublishOnly        # Pre-publish build (auto-runs on publish)
```

### Local CLI Testing
```bash
# After building, test CLI locally:
node dist/cli.js init --assistants claude
npx . init --assistants gemini --destination-directory /tmp/test
```

## Task Manager Conceptual Model

This project implements a hierarchical task management system for AI-assisted development:

- **Work Orders**: Independent complex prompts for programming tasks
- **Plans**: Comprehensive documents breaking down work orders into structured approaches
- **Tasks**: Atomic units with dependencies and specific skill requirements

Workflow uses slash commands (`/tasks:create-plan`, `/tasks:generate-tasks`, `/tasks:execute-blueprint`) to guide users through the hierarchy. All artifacts are Markdown files with YAML front-matter under `.ai/task-manager/`. See `TASK_MANAGER.md` and `POST_PHASE.md` for specifications.

## Code Architecture

### Core Components

**CLI Entry Point (`src/cli.ts`)**
- Uses Commander.js for argument parsing
- Single command: `init` with required `--assistants` flag
- Handles error routing and exit codes
- Initializes logger for colored output

**Main Implementation (`src/index.ts`)**
- `init()` function: main business logic for project initialization
- Creates directory structures: `.ai/task-manager/`, `.claude/`, `.gemini/`
- Template processing workflow: reads Markdown templates, converts to appropriate format
- Assistant-specific directory creation and template copying

**Utilities (`src/utils.ts`)**
- File system operations: `ensureDir()`, `copyTemplate()`, `exists()`
- Assistant validation: `parseAssistants()`, `validateAssistants()`
- Template processing: `convertMdToToml()`, `readAndProcessTemplate()`
- Path utilities: `resolvePath()`, cross-platform path handling

**Type System (`src/types.ts`)**
- Core types: `Assistant` ('claude' | 'gemini'), `TemplateFormat` ('md' | 'toml')
- Custom error classes: `FileSystemError`, `ConfigError`, etc.
- Interface definitions for options, configs, and results

### Template System Architecture

**Single Source of Truth**
- All templates are authored in Markdown format (`templates/commands/tasks/*.md`)
- Dynamic conversion to TOML format for Gemini assistant
- Conversion handles variable substitution: `$ARGUMENTS` → `{{args}}`, `$1` → `{{plan_id}}`

**Template Processing Flow**
1. Read Markdown template from `templates/`
2. Parse frontmatter (YAML) and body content
3. For Gemini: convert to TOML format with escaped content
4. For Claude: use Markdown as-is
5. Write to assistant-specific directory (`.claude/` or `.gemini/`)

**Variable Transformations (MD→TOML)**
- `$ARGUMENTS` → `{{args}}`
- `$1` → `{{plan_id}}`
- `[plan-ID]` → `{{plan_id}}` (in frontmatter)
- `[user-prompt]` → `{{args}}` (in frontmatter)

### Directory Structure Created

```
project/
├── .ai/task-manager/           # Shared project configuration
│   ├── plans/                  # Generated plans with task subdirectories
│   ├── config/
│       ├── TASK_MANAGER.md    # Project context (user-editable)
│       └── hooks/
│           └── POST_PHASE.md  # Quality criteria (user-editable)
│   └── templates/              # Project-specific templates
│       ├── PLAN_TEMPLATE.md    # Customizable plan template
│       └── TASK_TEMPLATE.md    # Customizable task template
├── .claude/commands/tasks/     # Claude commands (Markdown format)
│   ├── create-plan.md
│   ├── execute-blueprint.md
│   └── generate-tasks.md
└── .gemini/commands/tasks/     # Gemini commands (TOML format)
    ├── create-plan.toml
    ├── execute-blueprint.toml
    └── generate-tasks.toml
```

## Customizing Plan and Task Templates

### Template Structure

**Plan Template Sections:**
- YAML Frontmatter (id, summary, created)
- Original Work Order
- Plan Clarifications
- Executive Summary
- Context
- Technical Implementation Approach
- Risk Considerations
- Success Criteria
- Resource Requirements

**Task Template Sections:**
- YAML Frontmatter (id, group, dependencies, status, created, skills)
- Objective
- Skills Required
- Acceptance Criteria
- Technical Requirements
- Input Dependencies
- Output Artifacts
- Implementation Notes

### Modification Guidelines

1. **Source Templates:**
   - Located in `/workspace/templates/ai-task-manager/templates/`
   - Modify `PLAN_TEMPLATE.md` and `TASK_TEMPLATE.md`

2. **Customization Limits:**
   - Maintain YAML frontmatter structure
   - Keep core sections intact
   - Add project-specific sections as needed
   - Avoid removing critical metadata fields

3. **Best Practices:**
   - Add context-specific guidance
   - Include project-specific validation criteria
   - Create sections that capture unique workflow requirements
   - Keep templates concise and focused

**Workflow**: Plans are created in `.ai/task-manager/plans/`, then broken into tasks within subdirectories. Each assistant uses its native command format while accessing shared project files.

## AI Task Management System Architecture

### Overview

The AI task management system implements a specialized multi-agent architecture designed to address fundamental limitations in AI-assisted complex feature development. Through progressive refinement, atomic task decomposition, and skill-based agent matching, the system transforms general user requests into reliable, high-quality implementations while maintaining cognitive load balance and preventing scope creep.

### Three-Command Workflow: Progressive Refinement

The system's core innovation lies in its **three-phase progressive refinement strategy** that mirrors classical software engineering patterns (Analysis → Design → Implementation) but optimized for AI cognitive constraints:

**Phase 1: create-plan** - Context gathering and strategic planning
- Focuses entirely on understanding and clarifying user intent
- Implements mandatory clarification gates to prevent assumption-based planning
- Uses broad analysis with open-ended questions to establish comprehensive requirements

**Phase 2: generate-tasks** - Decomposition and dependency mapping
- Concentrates on breaking down complexity without execution details
- Applies strict minimization rules (20-30% reduction target) and atomic decomposition
- Creates dependency graphs and skill-based task assignment

**Phase 3: execute-blueprint** - Parallel execution and validation
- Handles current task execution with minimal extraneous context
- Implements dependency-aware parallelism within phases
- Applies external validation gates for quality control

This **staged context isolation** prevents the common AI problem of simultaneous multi-context confusion while enabling sophisticated task coordination through persistent artifacts (YAML frontmatter + Markdown).

### Key Design Patterns

#### Atomic Task Decomposition
The system enforces **1-2 skill maximum per task** with automatic skill inference based on contextual analysis. This approach addresses research findings showing that AI agents achieve 55% accuracy with sequential task processing compared to significantly lower performance with one-step approaches. Tasks requiring 3+ skills indicate over-complexity and trigger automatic subdivision.

#### Scope Control (YAGNI Enforcement)
Multiple complementary mechanisms prevent scope creep:
- **Explicit anti-pattern enumeration** identifying common scope expansion behaviors
- **Question-based validation** providing decision frameworks ("Is this explicitly mentioned?")
- **Quantified minimization targets** (20-30% reduction from comprehensive task lists)
- **Requirement traceability** ensuring every task links to explicit user requirements

#### Test Minimization: "Write a Few Tests, Mostly Integration"
The system challenges conventional test-driven development through selective testing philosophy:
- **Test only meaningful validation**: Custom business logic, critical workflows, edge cases, integration points
- **Avoid testing framework features**: Third-party libraries, simple CRUD operations, obvious getters/setters
- **Consolidate related scenarios**: Single tasks for related test scenarios rather than fragmented individual tests

#### Simplicity Enforcement
Codified simplicity principles prevent over-engineering:
- **Favor maintainability over cleverness** with explicit complexity red flags
- **Standard pattern preference** defaulting to established patterns rather than novel approaches
- **Minimal dependency policy** adding external dependencies only when essential
- **Complexity detection** through skill count thresholds and dependency cycle analysis

### Theoretical Foundations

#### Cognitive Load Theory Application
The architecture applies established Cognitive Load Theory principles:
- **Intrinsic load minimization** through atomic task decomposition
- **Extraneous load reduction** via context isolation and progressive disclosure
- **Germane load optimization** using structured templates and decision frameworks

Research demonstrates that proper cognitive load management in AI systems leads to 25% improvement in task completion accuracy when processing multiple parallel workstreams.

#### Multi-Agent System Coordination
The system implements proven multi-agent coordination patterns:
- **Task allocation** based on skill matching and domain expertise
- **Communication protocol** through structured artifacts rather than direct parameter passing
- **Conflict resolution** through validation gates and dependency management
- **Collaborative enhancement** where specialized agents outperform generalist approaches

Microsoft's Magentic-One and Anthropic's multi-agent research systems validate this approach, demonstrating statistically competitive performance through specialized agent architectures.

#### Mixture of Agents (MoA) Framework
The architecture leverages the "collaborativeness" phenomenon where LLMs generate better responses when presented with outputs from other models. This supports the three-phase approach where each phase builds upon artifacts from previous phases, creating a layered architecture of progressive refinement.

### Practical Benefits for AI Agent Accuracy

The system addresses specific AI cognitive limitations with measurable improvements:

**Context Window Optimization**: Phase-based processing prevents information overload while maintaining task relationships through persistent artifact storage.

**Scope Boundary Management**: Explicit constraints and anti-pattern recognition reduce the common AI tendency toward feature creep and over-engineering.

**Sequential Task Benefits**: Research shows sequential agents achieve 55% accuracy compared to lower one-step performance, with benefits from richer contextual understanding and error correction between steps.

**Specialized Agent Performance**: Domain-specific agents demonstrate superior performance (30.4% task completion for clear software development goals vs. 0% for broad business context tasks), supporting the skill-based matching approach.

**Quality Assurance Integration**: Multi-layer quality control through template constraints, validation gates, dependency verification, and status tracking ensures reliable execution.

The system's emphasis on progressive refinement, atomic decomposition, and parallel execution demonstrates deep understanding of both AI capabilities and software development best practices, creating an effective framework for managing AI-assisted development at scale.

## Testing Philosophy: "Write a Few Tests, Mostly Integration"

**Current Stats**: 37 tests, 628 lines, ~3 seconds execution time

**Test Coverage Strategy**
- Integration tests over unit tests (real file system operations)
- Focus on business logic that could silently fail
- Test complete workflows end-to-end
- Deliberately low coverage (24% lines) - only critical paths

**Key Test Files**
- `src/__tests__/utils.test.ts` - Business logic validation
- `src/__tests__/cli.integration.test.ts` - End-to-end CLI workflows

**Testing Guidelines**
- DO test: data transformation, validation, complex parsing, error scenarios
- DON'T test: simple utilities, framework code, obvious getters/setters
- Use real file system, minimal mocking
- Test error paths and edge cases

## Development Workflow

### Adding New Assistant Support
1. Update `Assistant` type in `src/types.ts`
2. Add template format mapping in `getTemplateFormat()` (`src/utils.ts`)
3. Add conversion logic in `convertMdToToml()` if needed
4. Create template directory structure
5. Add integration tests for new assistant

### Template Development
1. Create/edit Markdown templates in `templates/commands/tasks/`
2. Use standard frontmatter format for metadata
3. Test variable substitution for both formats
4. Verify both Claude (.md) and Gemini (.toml) outputs

### Error Handling
- Use custom error classes from `src/types.ts`
- File system operations wrapped with descriptive errors
- CLI provides user-friendly error messages with colored output
- Exit codes: 0 (success), 1 (failure)

## Key Implementation Details

**Assistant Validation**
- Strict validation of assistant names via `parseAssistants()`
- Duplicate removal and normalization
- Clear error messages for invalid options

**Path Resolution**
- Cross-platform path handling via `resolvePath()`
- Supports both relative and absolute destination directories
- Safe filename sanitization for generated files

**Template Format Conversion**
- TOML string escaping for special characters
- Frontmatter preservation and transformation
- Body content variable substitution

**Logging System**
- Colored output via Chalk library
- Multiple log levels: info, debug, error, success
- Progress indicators during initialization
