---
layout: default
title: Hooks System
nav_order: 3
description: "Guide to the AI Task Manager hooks system"
---

# 🎣 Hooks System

The AI Task Manager uses a hooks system to inject custom logic at specific points in the task management workflow. Hooks are Markdown files containing instructions that AI assistants execute during the workflow.

## Available Hooks

The system includes 7 hooks located in `.ai/task-manager/config/hooks/`:

### 1. PRE_PLAN Hook

**File**: `PRE_PLAN.md`

**Purpose**: Pre-planning guidance executed before creating a comprehensive plan.

**Key Functions**:
- **Scope Control Guidelines** - Enforces YAGNI principle and prevents feature creep
- **Simplicity Principles** - Promotes maintainable, straightforward solutions
- **Critical Validation** - Ensures adequate context before plan generation

**Common Anti-Patterns to Avoid**:
- Adding extra features "for completeness"
- Creating infrastructure for future features not requested
- Building abstractions when simple solutions suffice
- Adding configuration options not specifically mentioned
- Implementing excessive error handling beyond core requirements

### 2. PRE_PHASE Hook

**File**: `PRE_PHASE.md`

**Purpose**: Phase preparation logic executed before starting any phase execution.

**Key Functions**:
- Git branch management (creates feature branch from main if on main branch)
- Validates current repository state (checks for unstaged changes)
- Task dependency validation using `check-task-dependencies.js` script
- Confirms no tasks are marked "needs-clarification"
- Verifies completed phases are actually complete

**Implementation Details**:
```bash
# Dependency checking logic from the hook
for TASK_ID in $PHASE_TASKS; do
    if ! node .ai/task-manager/config/scripts/check-task-dependencies.js "$1" "$TASK_ID"; then
        echo "ERROR: Task $TASK_ID has unresolved dependencies"
        exit 1
    fi
done
```

### 3. POST_PHASE Hook

**File**: `POST_PHASE.md`

**Purpose**: Validation gates executed after phase completion.

**Current Implementation**:
- Ensure code passes linting requirements
- Create descriptive commit using conventional commits format

**Execution Monitoring Features**:
- **Progress Tracking** - Updates task status and adds completion emojis (✅ for phases, ✔️ for tasks)
- **Task Status Updates** - Valid transitions between `pending`, `in-progress`, `completed`, and `failed`
- Real-time blueprint updates with visual status indicators

This hook can be customized by users to add project-specific validation.

### 4. POST_PLAN Hook

**File**: `POST_PLAN.md`

**Purpose**: Simplified plan validation after initial plan creation.

**Current Implementation**: This hook now contains minimal validation and update procedures, as the main validation logic has been moved to the PRE_PLAN hook and the blueprint generation has been moved to POST_TASK_GENERATION_ALL.

### 5. POST_TASK_GENERATION_ALL Hook

**File**: `POST_TASK_GENERATION_ALL.md`

**Purpose**: Task complexity analysis, refinement, and blueprint generation after all tasks are created.

**Main Functions**:

1. **Complexity Analysis & Refinement**
   - Uses complexity scoring matrix (Technical, Decision, Integration, Scope, Uncertainty)
   - Composite score formula: `MAX(Technical×1.0, Decision×0.9, Integration×0.8, Scope×0.7, Uncertainty×1.1)`
   - Tasks with score ≥6 considered for decomposition
   - Maximum 3 decomposition rounds per task

2. **Blueprint Generation** (moved from POST_PLAN)
   - Creates dependency visualization using Mermaid diagrams
   - Generates phase-based execution blueprint
   - Organizes tasks into parallel execution phases
   - Ensures acyclic dependency graph

**Blueprint Structure**:
- Phase 1: All tasks with zero dependencies
- Phase N: Tasks whose dependencies are satisfied by phases 1 through N-1
- Maximizes parallel execution within each phase
- References validation gates from POST_PHASE hook

### 6. PRE_TASK_ASSIGNMENT Hook

**File**: `PRE_TASK_ASSIGNMENT.md`

**Purpose**: Agent selection based on task skills and available sub-agents.

**Process**:
1. Extracts `skills` array from task frontmatter
2. Checks for available sub-agents in assistant directories (`.claude/agents`, `.gemini/agents`, `.opencode/agents`)
3. Matches task skills to agent capabilities
4. Falls back to general-purpose agent if no match found

**Skills Extraction Script** (from the actual hook):
```bash
TASK_SKILLS=$(awk '
    /^---$/ { if (++delim == 2) exit }
    /^skills:/ {
        # Extract skills from YAML frontmatter
    }
' "$TASK_FILE")

# Check for sub-agents
for assistant_dir in .claude .gemini .opencode; do
    if [ -d "$assistant_dir/agents" ]; then
        echo "Available sub-agents detected"
    fi
done
```

### 7. POST_ERROR_DETECTION Hook

**File**: `POST_ERROR_DETECTION.md`

**Purpose**: Error handling procedures for task execution failures.

**Functions**:
- Updates task status to "failed" in frontmatter
- Documents validation gate failures
- Provides remediation steps
- Re-executes affected tasks after fixes
- Escalates persistent errors to users

**Task Status Update Script** (from the actual hook):
```bash
# Update task status to failed
awk '
    /^status:/ && delim == 1 {
        print "status: \"failed\""
        next
    }
    { print }
' "$TASK_FILE" > "$TEMP_FILE"
```

## How Hooks Work in Practice

### Workflow Integration

The hooks are referenced and executed at specific points in the slash commands:

1. **`/tasks:create-plan`** → Executes:
   - **PRE_PLAN** hook for scope control and simplicity guidelines
   - **POST_PLAN** hook for minimal validation

2. **`/tasks:generate-tasks`** → Executes:
   - **POST_TASK_GENERATION_ALL** for complexity analysis and blueprint generation

3. **`/tasks:execute-blueprint`** → Executes:
   - **PRE_PHASE** before each phase
   - **PRE_TASK_ASSIGNMENT** before assigning tasks
   - **POST_PHASE** after phase completion
   - **POST_ERROR_DETECTION** on failures

### Customization

All hooks are editable Markdown files in your project's `.ai/task-manager/config/hooks/` directory. Users can modify them to:

- Add project-specific validation rules
- Include custom quality gates
- Integrate with existing tools
- Implement organization standards

### Example Customization

For example, you could enhance the `POST_PHASE.md` hook for a React project:

```markdown
Ensure that:

- The code base is passing the linting requirements
- All tests are run locally, and they are passing
- TypeScript compilation succeeds with no errors
- Test coverage is above 80%
- No high-severity npm audit vulnerabilities
- A descriptive commit for the phase was successfully created
```

## Important Notes

1. **Hooks are instructions, not executable scripts** - They contain instructions that the AI assistant interprets and executes
2. **Project-specific customization** - Hooks are copied to your project and can be modified
3. **Version control** - Include hooks in your repository to maintain consistency across the team
4. **Simplicity by design** - Hooks are intentionally simple to allow easy customization

The hooks system provides a balance between structure and flexibility, allowing teams to implement their specific requirements while maintaining the core workflow of the AI Task Manager.