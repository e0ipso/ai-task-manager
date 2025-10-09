# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with this repository. It serves as the primary context source for AI-assisted development, following Anthropic's 2025 best practices for optimal Claude integration.

## Quick Start Guide

### Essential Commands
```bash
# Build and run
npm run build && npm start init --assistants claude

# Development workflow
npm run dev           # Watch mode compilation
npm test              # Run test suite (79 tests, ~6 seconds)
npm run lint:fix      # Auto-fix code style issues

# Post-implementation validation
/tasks:fix-broken-tests "npm test"    # Fix failing tests after changes
```

### Project Initialization
```bash
# Initialize AI task management for single assistant
npx . init --assistants claude --destination-directory /path/to/project

# Initialize for multiple assistants
npx . init --assistants claude,gemini,opencode --destination-directory /path/to/project

# Re-run init to update configuration files
# Your customizations are automatically detected and protected
npx . init --assistants claude --destination-directory /path/to/project

# Force overwrite all files (bypass conflict detection)
npx . init --assistants claude --destination-directory /path/to/project --force
```

### File Conflict Detection

The init command includes intelligent conflict detection to protect user customizations:

**How it works:**
- On first init, creates `.ai/task-manager/.init-metadata.json` tracking file hashes
- On subsequent inits, compares current file hashes against stored baseline
- Detects user-modified files and prompts for resolution with unified diff display
- Excludes `config/scripts/` directory (not meant for user modification)

**User experience:**
- **No modifications**: Files update automatically without prompts
- **User modifications detected**: Interactive prompts show diff and ask for resolution:
  - Keep my changes (skip update)
  - Overwrite with new version
  - Keep/Overwrite all remaining conflicts
- **Force flag**: Bypass all prompts and overwrite everything

**Metadata file:** `.ai/task-manager/.init-metadata.json`
```json
{
  "version": "1.12.0",
  "timestamp": "2025-10-09T10:30:00.000Z",
  "files": {
    "config/TASK_MANAGER.md": "a3b2c1d4e5f6...",
    "config/hooks/POST_PHASE.md": "f6e5d4c3b2a1..."
  }
}
```

**Troubleshooting:**
- **Corrupted metadata**: Treated as first-time init, files recreated
- **Missing metadata**: Treated as first-time init
- **Git conflicts**: Metadata file is local, not committed to git

---

## Project Overview

### Purpose and Scope

This CLI tool initializes AI-assisted development environments with hierarchical task management systems. It creates structured workflows that transform complex programming requests into manageable, validated implementations through progressive refinement and atomic task decomposition.

### Core Value Proposition

- **Cognitive Load Management**: Prevents AI context overload through staged processing
- **Scope Control**: Enforces YAGNI principles and prevents feature creep
- **Quality Assurance**: Ensures working code through integrity-focused testing
- **Multi-Assistant Support**: Unified workflow across Claude, Gemini, and Open Code platforms

---

## AI Task Management System

### Three-Phase Progressive Refinement

The system implements a specialized workflow optimized for AI cognitive constraints:

#### Phase 1: Strategic Planning (`/tasks:create-plan`)
- **Focus**: Context gathering and requirement clarification
- **Output**: Comprehensive plan with mandatory clarification gates
- **Prevents**: Assumption-based planning and scope ambiguity

#### Phase 2: Task Decomposition (`/tasks:generate-tasks`)  
- **Focus**: Breaking complexity into atomic units
- **Output**: Dependency-mapped tasks with skill assignments
- **Enforces**: 20-30% task reduction and 1-2 skill maximum per task

#### Phase 3: Execution (`/tasks:execute-blueprint`)
- **Focus**: Current task implementation with minimal context
- **Output**: Working functionality with validation gates
- **Implements**: Dependency-aware parallelism and quality control

### Key Design Principles

#### Atomic Task Decomposition
- **Maximum 2 skills per task**: Prevents over-complexity
- **Automatic skill inference**: Context-based task categorization  
- **Dependency mapping**: Clear prerequisite relationships
- **Subdivision triggers**: 3+ skills indicate need for task breakdown

#### Scope Control (YAGNI Enforcement)
- **Anti-pattern enumeration**: Identifies common scope expansion behaviors
- **Question-based validation**: "Is this explicitly mentioned?" decision framework
- **Quantified minimization**: 20-30% reduction targets from comprehensive lists
- **Requirement traceability**: Every task links to explicit user requirements

#### Test Philosophy: "Write a Few Tests, Mostly Integration"
- **Selective coverage**: 24% lines, 79 meaningful tests (12 new for conflict detection)
- **Integration-heavy**: Real filesystem operations over mocking
- **Business logic focus**: Custom logic, critical workflows, edge cases
- **Framework avoidance**: Don't test third-party library features

---

## Architecture Overview

### Core Components

#### CLI Entry Point (`src/cli.ts`)
```typescript
// Key responsibilities:
- Commander.js argument parsing
- Single `init` command with required `--assistants` flag  
- Error routing and exit code management
- Colored logging initialization
```

#### Main Implementation (`src/index.ts`)
```typescript
// Core business logic:
- init() function for project initialization
- Directory structure creation (.ai/task-manager/, .claude/, etc.)
- Template processing workflow (Markdown → format conversion)
- Assistant-specific setup and template copying
```

#### Utilities (`src/utils.ts`)
```typescript
// Supporting operations:
- File system: ensureDir(), copyTemplate(), exists()
- Validation: parseAssistants(), validateAssistants()  
- Template processing: convertMdToToml(), readAndProcessTemplate()
- Path handling: resolvePath() with cross-platform support
```

#### Type System (`src/types.ts`)
```typescript
// Type definitions:
- Assistant type: 'claude' | 'gemini' | 'opencode'
- TemplateFormat: 'md' | 'toml'
- Custom error classes: FileSystemError, ConfigError
- Interface definitions for configurations and results
```

### Template System Architecture

#### Single Source of Truth Approach
- **Markdown authoring**: All templates written in Markdown format
- **Dynamic conversion**: TOML generation for Gemini assistant
- **Variable transformation**: Format-specific syntax conversion
- **Consistency validation**: Functionality parity across formats

#### Template Processing Flow
1. **Source**: Read Markdown template from `templates/commands/tasks/`
2. **Parse**: Extract YAML frontmatter and body content
3. **Convert**: Transform to TOML for Gemini (Markdown for others)
4. **Substitute**: Apply variable transformations (`$ARGUMENTS` → `{{args}}`)
5. **Output**: Write to assistant-specific directories

#### Variable Transformation Mapping
```
Markdown → TOML
$ARGUMENTS → {{args}}
$1 → {{plan_id}}
[plan-ID] → {{plan_id}} (frontmatter)
[user-prompt] → {{args}} (frontmatter)
```

---

## Directory Structure and Organization

### Generated Project Structure
```
project/
├── .ai/task-manager/              # Shared project configuration
│   ├── plans/                     # Active plans with task subdirectories
│   │   └── 28--current-plan/
│   │       ├── plan-28--current-plan.md
│   │       └── tasks/
│   │           ├── 01--task-one.md
│   │           └── 02--task-two.md
│   ├── archive/                   # Completed plans (preserved history)
│   │   └── 25--archived-plan/     # Full structure maintained
│   ├── config/
│   │   ├── TASK_MANAGER.md        # Project context (user-editable)
│   │   ├── scripts/               # Enhanced ID generation
│   │   │   ├── get-next-plan-id.cjs
│   │   │   └── get-next-task-id.cjs
│   │   └── hooks/
│   │       └── POST_PHASE.md      # Quality criteria (user-editable)
│   └── templates/                 # Project-specific templates
│       ├── PLAN_TEMPLATE.md       # Customizable plan template
│       └── TASK_TEMPLATE.md       # Customizable task template
├── .claude/commands/tasks/        # Claude commands (Markdown)
│   ├── create-plan.md
│   ├── generate-tasks.md
│   ├── execute-blueprint.md
│   └── fix-broken-tests.md        # NEW: Test integrity command
├── .gemini/commands/tasks/        # Gemini commands (TOML)
│   ├── create-plan.toml
│   ├── generate-tasks.toml
│   ├── execute-blueprint.toml
│   └── fix-broken-tests.toml      # NEW: Test integrity command
└── .opencode/command/tasks/       # Open Code commands (Markdown)
    ├── create-plan.md
    ├── generate-tasks.md
    ├── execute-blueprint.md
    └── fix-broken-tests.md        # NEW: Test integrity command
```

### Archive System and Lifecycle Management

#### Purpose and Benefits
- **Organization**: Clean active workspace with historical preservation
- **Reference**: Past implementations available for pattern reuse
- **ID Management**: Prevents conflicts through continuous numbering
- **Compliance**: Maintains audit trail of project evolution

#### Archival Process
```bash
# Manual archival after completion
mv .ai/task-manager/plans/25--completed-plan .ai/task-manager/archive/

# Validation of archive integrity
DEBUG=true node .ai/task-manager/config/scripts/get-next-plan-id.cjs
```

---

## Enhanced Features and Commands

### Fix-Broken-Tests Command

#### Critical Integrity Requirements

The fix-broken-tests command enforces strict integrity standards to prevent "test cheating":

**❌ Absolutely Forbidden Practices**:
- Adding environment checks to bypass test execution
- Modifying test assertions to match broken implementation  
- Implementing test-environment-specific code in source
- Disabling or commenting out failing tests
- ANY workaround that doesn't fix the actual bug

**✅ Required Approach**:
- Find root cause in source code
- Fix the actual bug in implementation
- Ensure tests pass because code truly works

#### Usage Examples
```bash
# Fix tests after feature implementation
/tasks:fix-broken-tests "npm test"

# Fix specific test file
/tasks:fix-broken-tests "jest src/__tests__/user-auth.test.ts"

# Auto-detect test command from CLAUDE.md
/tasks:fix-broken-tests ""

# Integration with development workflow
git commit -m "feat: implement feature"
/tasks:fix-broken-tests "npm test"
git commit -m "fix: resolve test failures from implementation"
```

### Enhanced ID Generation Scripts

#### get-next-plan-id.cjs
**Features**:
- Comprehensive directory traversal from any subdirectory
- Multi-source ID validation (directories, filenames, frontmatter)
- Enhanced error handling with graceful degradation
- Debug logging via `DEBUG=true` environment variable
- Consistency validation with mismatch reporting

```bash
# Generate next plan ID with debug info
DEBUG=true node .ai/task-manager/config/scripts/get-next-plan-id.cjs
```

#### get-next-task-id.cjs  
**Features**:
- Performance optimization for empty directories (90% case)
- Flexible ID format support (padded and unpadded)
- Resilient YAML parsing with multiple regex patterns
- Graceful error handling for corrupted files

```bash
# Generate next task ID for specific plan
node .ai/task-manager/config/scripts/get-next-task-id.cjs 28
```

---

## Development Workflow

### Standard Development Commands

#### Build and Development
```bash
npm run build        # TypeScript compilation to dist/
npm run dev          # Watch mode with automatic recompilation  
npm run clean        # Remove dist/ directory
npm start            # Execute compiled CLI (requires build first)
```

#### Testing and Quality Assurance
```bash
npm test             # Run Jest test suite (67 tests, ~3 seconds)
npm run test:watch   # Tests in watch mode for development
npm run lint         # ESLint validation (excludes test files)
npm run lint:fix     # Automated lint fixes
npm run format       # Prettier code formatting
```

#### Security and Maintenance
```bash
npm run security:audit        # Standard security audit
npm run security:audit-json   # JSON formatted audit output  
npm run security:fix          # Automated security fixes
npm run security:fix-force    # Force fixes for critical issues
npm run prepublishOnly        # Pre-publish validation (auto-runs)
```

### Testing Philosophy Implementation

#### Current Test Statistics
- **Test Suites**: 3 passed, 3 total
- **Tests**: 67 passed, 67 total
- **Execution Time**: ~3 seconds
- **Coverage**: 24% lines (deliberately selective)

#### Test File Organization
- `src/__tests__/utils.test.ts`: Business logic validation
- `src/__tests__/cli.integration.test.ts`: End-to-end workflows
- `src/__tests__/get-next-plan-id.test.ts`: ID generation validation

#### Testing Guidelines
**DO Test**:
- Data transformation and validation logic
- Complex business rules and algorithms
- Error scenarios and edge cases
- Integration points and workflows
- Critical path functionality

**DON'T Test**:
- Simple getters/setters
- Third-party library features
- Framework-provided functionality
- Obvious utility functions
- Trivial CRUD operations

### Adding New Assistant Support

1. **Type System**: Update `Assistant` type in `src/types.ts`
2. **Format Mapping**: Add template format in `getTemplateFormat()` (`src/utils.ts`)
3. **Conversion Logic**: Extend `convertMdToToml()` if needed
4. **Directory Structure**: Create template directories
5. **Testing**: Add integration tests for new assistant

### Template Development Workflow

1. **Source Creation**: Author Markdown templates in `templates/commands/tasks/`
2. **Metadata**: Use standard YAML frontmatter format
3. **Variable Testing**: Verify substitution across all formats
4. **Output Validation**: Check Claude (.md), Gemini (.toml), Open Code (.md)
5. **Integration Testing**: Validate end-to-end template processing

---

## Template Customization Guide

### Plan Template Structure

**YAML Frontmatter**:
```yaml
id: [plan-ID]
summary: "[user-prompt]"
created: "YYYY-MM-DD"
```

**Core Sections**:
- Original Work Order
- Plan Clarifications  
- Executive Summary
- Context and Background
- Technical Implementation Approach
- Risk Considerations
- Success Criteria
- Resource Requirements

### Task Template Structure

**YAML Frontmatter**:
```yaml
id: [task-number]
group: "[logical-grouping]"
dependencies: [list-of-task-ids]
status: "pending"
created: "YYYY-MM-DD"
skills: ["skill-1", "skill-2"]
```

**Core Sections**:
- Objective
- Skills Required
- Acceptance Criteria
- Technical Requirements
- Input Dependencies
- Output Artifacts
- Implementation Notes

### Customization Guidelines

#### Source Templates Location
```bash
# Edit base templates
/workspace/templates/ai-task-manager/config/templates/PLAN_TEMPLATE.md
/workspace/templates/ai-task-manager/config/templates/TASK_TEMPLATE.md
```

#### Customization Best Practices
- **Maintain Structure**: Keep YAML frontmatter format
- **Preserve Core Sections**: Don't remove critical metadata fields
- **Add Context**: Include project-specific guidance
- **Stay Focused**: Keep templates concise and actionable

#### Template Processing Validation
```bash
# Test template processing for all formats
npm run build
node dist/cli.js init --assistants claude,gemini,opencode --destination-directory /tmp/test
```

---

## Error Handling and Troubleshooting

### Common Issues and Solutions

#### ID Generation Problems
**Symptoms**: ID conflicts, missing plans, inconsistent numbering
**Debugging**:
```bash
# Enable comprehensive debug logging
DEBUG=true node .ai/task-manager/config/scripts/get-next-plan-id.cjs
```
**Solutions**: Verify directory structure, check file permissions, align ID sources

#### Template Processing Errors
**Symptoms**: Malformed TOML, missing variables, conversion failures
**Debugging**: Check template syntax, validate frontmatter format, verify variable names
**Solutions**: Use standard frontmatter, test variable substitution, validate against schema

#### Assistant Integration Issues
**Symptoms**: Commands not found, format errors, execution failures
**Debugging**: Verify assistant directory creation, check template format conversion
**Solutions**: Rebuild templates, validate format mapping, check file permissions

### Error Handling Architecture

#### Custom Error Classes
```typescript
// From src/types.ts
FileSystemError    // File operation failures
ConfigError        // Configuration validation issues  
TemplateError      // Template processing problems
AssistantError     // Assistant validation failures
```

#### Error Recovery Strategies
- **Graceful Degradation**: Continue operation when possible
- **Detailed Logging**: Provide context for debugging
- **User-Friendly Messages**: Clear guidance for resolution
- **Fail-Fast**: Stop early for critical errors

---

## Quality Assurance and Best Practices

### Code Quality Standards

#### Formatting Requirements
- **No trailing spaces**: Enforced by Prettier
- **File endings**: Always include newline at end
- **Indentation**: Match existing code patterns
- **Naming**: Use meaningful variable and function names

#### Architecture Principles
- **Modularity**: Write reusable, focused components
- **Single Responsibility**: Keep functions small and focused
- **Standard Patterns**: Prefer established patterns over novel approaches
- **Minimal Dependencies**: Add external dependencies only when essential

### Security Guidelines

#### Critical Security Practices
- **No hardcoded secrets**: Use environment variables
- **Input validation**: Sanitize all user inputs
- **Error handling**: Don't expose internal system details
- **Least privilege**: Minimize permission requirements
- **Audit integration**: Regular security scanning

### Performance Considerations

#### Optimization Strategies
- **Fast test execution**: 3-second test suite for quick feedback
- **Efficient ID generation**: Early returns for common cases
- **Template caching**: Minimize redundant file operations
- **Memory management**: Clean up temporary resources

---

## Theoretical Foundations and Research Context

### Cognitive Load Theory Application

The system applies established Cognitive Load Theory principles:
- **Intrinsic Load Minimization**: Atomic task decomposition
- **Extraneous Load Reduction**: Context isolation and progressive disclosure  
- **Germane Load Optimization**: Structured templates and decision frameworks

Research demonstrates 25% improvement in task completion accuracy through proper cognitive load management in AI systems.

### Multi-Agent System Coordination

Implementation of proven coordination patterns:
- **Task Allocation**: Skill-based matching and domain expertise
- **Communication Protocol**: Structured artifacts vs. direct parameter passing
- **Conflict Resolution**: Validation gates and dependency management
- **Collaborative Enhancement**: Specialized agents outperforming generalist approaches

### Mixture of Agents (MoA) Framework

Leverages "collaborativeness" phenomenon where LLMs generate better responses when presented with outputs from other models. The three-phase approach builds progressive refinement through layered artifact creation.

### Research Validation

- **Sequential Processing**: 55% accuracy vs. lower one-step performance
- **Specialized Agents**: 30.4% task completion for clear goals vs. 0% for broad context
- **Context Window Optimization**: Phase-based processing prevents information overload
- **Quality Assurance**: Multi-layer validation ensures reliable execution

---

## Integration with Claude Code Workflow

### Context Utilization Optimization

This CLAUDE.md is structured to provide Claude Code with:
- **Immediate Access**: Essential commands and quick start information
- **Progressive Detail**: Hierarchical information disclosure
- **Cross-References**: Clear navigation between related sections
- **Workflow Integration**: Seamless connection to task management system

### Claude Code Specific Features

#### Enhanced Context Understanding
- **Purpose-Driven Sections**: Each section serves specific development workflow needs
- **Cross-Reference Navigation**: Links between related concepts and procedures
- **Implementation Guidance**: Step-by-step instructions for complex operations
- **Error Recovery**: Comprehensive troubleshooting and debugging guidance

#### AI-Optimized Information Architecture
- **Logical Grouping**: Related information clustered for efficient processing
- **Consistent Structure**: Predictable section organization for reliable navigation
- **Clear Hierarchies**: Well-defined information levels for appropriate detail selection
- **Actionable Content**: Focus on implementable guidance over theoretical explanation

### Workflow Integration Points

1. **Project Initialization**: Seamless setup of AI task management
2. **Development Process**: Integrated commands for build, test, and validation
3. **Quality Assurance**: Built-in testing and integrity validation
4. **Collaboration**: Multi-assistant support with consistent workflows
5. **Documentation**: Self-maintaining documentation through structured templates

This comprehensive guide ensures Claude Code has optimal context for effective collaboration on this AI task management CLI project.