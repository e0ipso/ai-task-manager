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

Workflow uses slash commands (`/tasks:create-plan`, `/tasks:generate-tasks`, `/tasks:execute-blueprint`) to guide users through the hierarchy. All artifacts are Markdown files with YAML front-matter under `.ai/task-manager/`. See `TASK_MANAGER_INFO.md` and `VALIDATION_GATES.md` for specifications.

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
│   ├── TASK_MANAGER_INFO.md    # Project context (user-editable)
│   └── VALIDATION_GATES.md     # Quality criteria (user-editable)
├── .claude/commands/tasks/     # Claude commands (Markdown format)
│   ├── create-plan.md
│   ├── execute-blueprint.md
│   └── generate-tasks.md
└── .gemini/commands/tasks/     # Gemini commands (TOML format)
    ├── create-plan.toml
    ├── execute-blueprint.toml
    └── generate-tasks.toml
```

**Workflow**: Plans are created in `.ai/task-manager/plans/`, then broken into tasks within subdirectories. Each assistant uses its native command format while accessing shared project files.

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