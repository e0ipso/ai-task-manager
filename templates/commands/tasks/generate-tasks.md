---
argument-hint: [plan-ID]
description: Generate tasks to implement the plan with the provided ID.
---
# Comprehensive Task List Creation
You are a comprehensive task planning assistant. Your role is to create detailed, actionable plans based on user input while ensuring you have all necessary context before proceeding.

Include @.ai/task-manager/TASK_MANAGER_INFO.md for the directory structure of tasks.

## Instructions

You will think hard to analyze the provided plan document and decompose it into atomic, actionable tasks with clear dependencies and groupings.

### Input
- A plan document. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
- The plan contains high-level objectives and implementation steps

### Input Error Handling
If the plan does not exist. Stop immediately and show an error to the user.

### Task Creation Guidelines

#### Task Minimization Principles
**Core Constraint:** Create only the minimum number of tasks necessary to satisfy the plan requirements. Target a 20-30% reduction from comprehensive task lists by questioning the necessity of each component.

**Minimization Rules:**
- **Direct Implementation Only**: Create tasks for explicitly stated requirements, not "nice-to-have" features
- **DRY Task Principle**: Each task should have a unique, non-overlapping purpose
- **Question Everything**: For each task, ask "Is this absolutely necessary to meet the plan objectives?"
- **Avoid Gold-plating**: Resist the urge to add comprehensive features not explicitly required

**Antipatterns to Avoid:**
- Creating separate tasks for "error handling" when it can be included in the main implementation
- Breaking simple operations into multiple tasks (e.g., separate "validate input" and "process input" tasks)
- Adding tasks for "future extensibility" or "best practices" not mentioned in the plan
- Creating comprehensive test suites for trivial functionality

#### Task Granularity
Each task must be:
- **Single-purpose**: One clear deliverable or outcome
- **Atomic**: Cannot be meaningfully split further
- **Skill-specific**: Executable by a single skill agent (examples below)
- **Time-bounded**: Completable in a reasonable timeframe by a skilled developer
- **Verifiable**: Has clear completion criteria

#### Skill Selection and Technical Requirements

**Core Principle**: Each task should require 1-2 specific technical skills that can be handled by specialized agents. Skills should be automatically inferred from the task's technical requirements and objectives.

**Skill Selection Criteria**:
1. **Technical Specificity**: Choose skills that directly match the technical work required
2. **Agent Specialization**: Select skills that allow a single skilled agent to complete the task
3. **Minimal Overlap**: Avoid combining unrelated skill domains in a single task
4. **Creative Inference**: Derive skills from task objectives and implementation context

**Inspirational Skill Examples** (use kebab-case format):
- Frontend: `react-components`, `css`, `js`, `vue-components`, `html`
- Backend: `api-endpoints`, `database`, `authentication`, `server-config`
- Testing: `jest`, `playwright`, `unit-testing`, `e2e-testing`
- DevOps: `docker`, `github-actions`, `deployment`, `ci-cd`
- Languages: `typescript`, `python`, `php`, `bash`, `sql`
- Frameworks: `nextjs`, `express`, `drupal-backend`, `wordpress-plugins`

**Automatic Skill Inference Examples**:
- "Create user login form" → `["react-components", "authentication"]`
- "Build REST API for orders" → `["api-endpoints", "database"]`
- "Add Docker deployment" → `["docker", "deployment"]`
- "Write Jest tests for utils" → `["jest"]`

**Assignment Guidelines**:
- **1 skill**: Focused, single-domain tasks
- **2 skills**: Tasks requiring complementary domains
- **Split if 3+**: Indicates task should be broken down

```
# Examples
skills: ["css"]  # Pure styling
skills: ["api-endpoints", "database"]  # API with persistence
skills: ["react-components", "jest"]  # Implementation + testing
```

#### Meaningful Test Strategy Guidelines

**IMPORTANT** Make sure to copy this _Meaningful Test Strategy Guidelines_ section into all the tasks focused on testing, and **also** keep them in mind when generating tasks.

Your critical mantra for test generation is: "write a few tests, mostly integration".

**Definition of "Meaningful Tests":**
Tests that verify custom business logic, critical paths, and edge cases specific to the application. Focus on testing YOUR code, not the framework or library functionality.

**When TO Write Tests:**
- Custom business logic and algorithms
- Critical user workflows and data transformations
- Edge cases and error conditions for core functionality
- Integration points between different system components
- Complex validation logic or calculations

**When NOT to Write Tests:**
- Third-party library functionality (already tested upstream)
- Framework features (React hooks, Express middleware, etc.)
- Simple CRUD operations without custom logic
- Getter/setter methods or basic property access
- Configuration files or static data
- Obvious functionality that would break immediately if incorrect

**Test Task Creation Rules:**
- Combine related test scenarios into single tasks (e.g., "Test user authentication flow" not separate tasks for login, logout, validation)
- Focus on integration and critical path testing over unit test coverage
- Avoid creating separate tasks for testing each CRUD operation individually
- Question whether simple functions need dedicated test tasks

### Process

#### Step 1: Task Decomposition
1. Read through the entire plan
2. Identify all concrete deliverables **explicitly stated** in the plan
3. Apply minimization principles: question necessity of each potential task
4. Break each deliverable into atomic tasks (only if genuinely needed)
5. Ensure no task requires multiple skill sets
6. Verify each task has clear inputs and outputs
7. **Minimize test tasks**: Combine related testing scenarios, avoid testing framework functionality

#### Step 2: Dependency Analysis
For each task, identify:
- **Hard dependencies**: Tasks that MUST complete before this can start
- **Soft dependencies**: Tasks that SHOULD complete for optimal execution
- **No circular dependencies**: Validate the dependency graph is acyclic

Dependency Rule: Task B depends on Task A if:
- B requires output or artifacts from A
- B modifies code created by A
- B tests functionality implemented in A

#### Step 3: Task Grouping
Organize tasks into logical groups based on feature areas (e.g., "user-authentication", "payment-processing", "dashboard", "reporting", "notifications")

#### Step 4: Output Generation

##### Frontmatter Structure

Example:
```yaml
---
id: 1
group: "user-authentication"
dependencies: []  # List of task IDs, e.g., [2, 3]
status: "pending"  # pending | in-progress | completed | needs-clarification
created: "2024-01-15"
skills: ["react-components", "authentication"]  # Technical skills required for this task
---
```

The schema for this frontmatter is:
```json
{
  "type": "object",
  "required": ["id", "group", "dependencies", "status", "created", "skills"],
  "properties": {
    "id": {
      "type": ["number"],
      "description": "Unique identifier for the task. An integer."
    },
    "group": {
      "type": "string",
      "description": "Group or category the task belongs to"
    },
    "dependencies": {
      "type": "array",
      "description": "List of task IDs this task depends on",
      "items": {
        "type": ["number"]
      }
    },
    "status": {
      "type": "string",
      "enum": ["pending", "in-progress", "completed", "needs-clarification"],
      "description": "Current status of the task"
    },
    "created": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Creation date in YYYY-MM-DD format"
    },
    "skills": {
      "type": "array",
      "description": "Technical skills required for this task (1-2 skills recommended)",
      "items": {
        "type": "string",
        "pattern": "^[a-z][a-z0-9-]*$"
      },
      "minItems": 1,
      "uniqueItems": true
    }
  },
  "additionalProperties": false
}
```

##### Task Body Structure
```markdown
## Objective
[Clear statement of what this task accomplishes]

## Skills Required
[Reference to the skills listed in frontmatter - these should align with the technical work needed]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

Use your internal TODO tool to track these and keep on track.

## Technical Requirements
[Specific technical details, APIs, libraries, etc. - use this to infer appropriate skills]

## Input Dependencies
[What artifacts/code from other tasks are needed]

## Output Artifacts
[What this task produces for other tasks to consume]

## Implementation Notes
[Any helpful context or suggestions, including skill-specific guidance]
```

### Task ID Generation

When creating tasks, you need to determine the next available task ID for the specified plan. Use this bash command to automatically generate the correct ID:

#### Command
```bash
PLAN_ID=$1; echo $(($(find .ai/task-manager/plans/$(printf "%02d" $PLAN_ID)--*/tasks -name "*.md" -exec grep "^id:" {} \; 2>/dev/null | sed 's/id: *//' | sort -n | tail -1 | sed 's/^$/0/') + 1))
```

#### How It Works
1. **Finds task files** using the pattern `*.md` in the specific plan's tasks directory
2. **Extracts front-matter IDs** using grep to find `id:` lines from all task files
3. **Strips the `id:` prefix** using sed to get numeric values only
4. **Sorts numerically** to find the highest existing task ID
5. **Handles empty results** by defaulting to 0 if no tasks exist
6. **Adds 1** to get the next available task ID

This command reads the actual `id:` values from task front-matter, making it the definitive source of truth.

#### Parameter Usage
- `$1` is the plan ID parameter passed to this template
- The command accepts the raw plan ID (e.g., `6` for plan `06`)
- It automatically handles zero-padding for directory lookup

#### Front-matter vs Filename Format
**IMPORTANT:** There is a distinction between numeric and zero-padded formats:

- **Front-matter ID**: Use numeric values: `id: 3` (not `id: "03"`)
- **Filename**: Use zero-padded format: `03--task-name.md`

#### Usage Examples

**Example 1: Plan 6 with existing tasks**
```bash
# Command execution (plan ID = 6)
PLAN_ID=6; echo $(($(find .ai/task-manager/plans/$(printf "%02d" $PLAN_ID)--*/tasks -name "*.md" -exec grep "^id:" {} \; 2>/dev/null | sed 's/id: *//' | sort -n | tail -1 | sed 's/^$/0/') + 1))
# Output: 5 (if highest task front-matter has id: 4)

# Front-matter usage:
---
id: 4
group: "implementation"
dependencies: [1, 2]
status: "pending"
created: "2024-01-15"
skills: ["api-endpoints", "database"]
---
```

**Example 2: Plan 1 with no existing tasks**
```bash
# Command execution (plan ID = 1)
PLAN_ID=1; echo $(($(find .ai/task-manager/plans/$(printf "%02d" $PLAN_ID)--*/tasks -name "*.md" -exec grep "^id:" {} \; 2>/dev/null | sed 's/id: *//' | sort -n | tail -1 | sed 's/^$/0/') + 1))
# Output: 1 (empty tasks directory, no front-matter to read)

# Front-matter usage:
---
id: 1
group: "setup"
dependencies: []
status: "pending"
created: "2024-01-15"
skills: ["docker", "ci-cd"]
---
```

#### Edge Case Handling
The command handles several edge cases automatically:
- **Empty tasks directory**: Returns `1` as the first task ID
- **Non-sequential task IDs**: Returns the maximum existing ID + 1
- **Missing plan directory**: Returns `1` (graceful fallback)
- **Mixed numbering**: Correctly finds the highest numeric ID regardless of gaps

#### Command Execution Context
- Run this command from the repository root directory
- The command works with the current file system state
- It searches within the plan directory structure: `.ai/task-manager/plans/##--plan-name/tasks/`

#### Manual Fallback
If the command fails or returns unexpected results:
1. Navigate to `.ai/task-manager/plans/##--plan-name/tasks/`
2. List existing task files: `ls -1 *.md 2>/dev/null | sort`
3. Identify the highest numbered task file
4. Add 1 to get the next ID
5. Use numeric format in front-matter, zero-padded format for filename

### Validation Checklist
Before finalizing, ensure:
- [ ] Each task has 1-2 appropriate technical skills assigned
- [ ] Skills are automatically inferred from task objectives and technical requirements
- [ ] All dependencies form an acyclic graph
- [ ] Task IDs are unique and sequential
- [ ] Groups are consistent and meaningful
- [ ] Every **explicitly stated** task from the plan is covered
- [ ] No redundant or overlapping tasks
- [ ] **Minimization applied**: Each task is absolutely necessary
- [ ] **Test tasks are meaningful**: Focus on business logic, not framework functionality
- [ ] **No gold-plating**: Only plan requirements are addressed
- [ ] Total task count represents minimum viable implementation

### Error Handling
If the plan lacks sufficient detail:
- Note areas needing clarification
- Create placeholder tasks marked with `status: "needs-clarification"`
- Document assumptions made

## Update the plan document

After creating all tasks with their dependencies, update the original plan document with two critical sections: a task dependency visualization and a phase-based execution blueprint.

### Section 1: Dependency Visualization

If any tasks have dependencies, create a Mermaid diagram showing the dependency graph:

```mermaid
graph TD
    001[Task 001: Database Schema] --> 002[Task 002: API Endpoints]
    001 --> 003[Task 003: Data Models]
    002 --> 004[Task 004: Frontend Integration]
    003 --> 004
```

Note: Ensure the graph is acyclic (no circular dependencies).

### Section 2: Phase-Based Execution Blueprint

#### Core Concept
The execution blueprint organizes tasks into sequential phases where:
- **Within a phase**: All tasks execute in parallel
- **Between phases**: Execution is strictly sequential
- **Phase progression**: Requires all tasks in current phase to complete AND validation gates to pass

#### Phase Definition Rules
1. **Phase 1**: Contains all tasks with zero dependencies
2. **Phase N**: Contains tasks whose dependencies are ALL satisfied by tasks in phases 1 through N-1
3. **Parallelism Priority**: Maximize the number of tasks that can run simultaneously in each phase
4. **Completeness**: Every task must be assigned to exactly one phase

#### Blueprint Structure

```markdown
## Execution Blueprint

**Validation Gates:**
- Reference: `@.ai/task-manager/VALIDATION_GATES.md`

### Phase 1: [Descriptive Phase Name]
**Parallel Tasks:**
- Task 001: [Description]
- Task 005: [Description]
- Task 009: [Description]

### Phase 2: [Descriptive Phase Name]
**Parallel Tasks:**
- Task 002: [Description] (depends on: 001)
- Task 003: [Description] (depends on: 001)
- Task 006: [Description] (depends on: 005)

[Continue for all phases...]

### Post-phase Actions

### Execution Summary
- Total Phases: X
- Total Tasks: Y
- Maximum Parallelism: Z tasks (in Phase N)
- Critical Path Length: X phases
```

### Validation Requirements

#### Phase Transition Rules
1. All tasks in the current phase must have status: "completed"
2. All validation gates defined in `@.ai/task-manager/VALIDATION_GATES.md` for the current phase must pass
3. No task in a future phase can begin until these conditions are met

#### Blueprint Verification
Before finalizing, ensure:
- [ ] Every task appears in exactly one phase
- [ ] No task appears in a phase before all its dependencies
- [ ] Phase 1 contains only tasks with no dependencies
- [ ] Each phase maximizes parallel execution opportunities
- [ ] All phases reference their validation gates
- [ ] The execution summary accurately reflects the blueprint

### Important Notes

#### Parallel Execution
- Tasks within a phase have no interdependencies and can run simultaneously
- This enables efficient resource utilization and faster completion
- AI agents can be assigned to multiple tasks within the same phase

#### Sequential Phases
- Phases execute in strict numerical order
- Phase N+1 cannot begin until Phase N is fully complete and validated
- This ensures dependency integrity and systematic progress
- 

#### Validation Gates
- Each phase has associated validation criteria defined externally
- Gates ensure quality and correctness before progression
- Failed validations require task remediation before phase completion

### Error Handling

If dependency analysis reveals issues:
- **Circular dependencies**: Document the cycle and mark affected tasks for review
- **Orphaned tasks**: Tasks that cannot be scheduled due to missing dependencies
- **Ambiguous dependencies**: Note assumptions made and flag for clarification
