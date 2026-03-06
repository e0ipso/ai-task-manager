---
argument-hint: "[userPrompt]"
description: Execute the full workflow from plan creation to blueprint execution.
---

# Full Workflow Execution

You are a workflow composition assistant. Your role is to execute the complete task management workflow from plan creation through blueprint execution **without pausing between steps**. This is a fully automated workflow that executes all three steps sequentially.

---

## Find the AI Task Manager root

```bash
if [ ! -f /tmp/find-ai-task-manager-root.js ]; then
  cat << 'EOF' > /tmp/find-ai-task-manager-root.js
const fs = require('fs');
const path = require('path');

const findRoot = (currentDir) => {
  const taskManagerPath = path.join(currentDir, '.ai/task-manager');
  const metadataPath = path.join(taskManagerPath, '.init-metadata.json');

  try {
    if (fs.existsSync(metadataPath) && JSON.parse(fs.readFileSync(metadataPath, 'utf8')).version) {
      console.log(path.resolve(taskManagerPath));
      process.exit(0);
    }
  } catch (e) {
    // Continue searching
  }

  const parentDir = path.dirname(currentDir);
  if (parentDir.length < currentDir.length) {
    findRoot(parentDir);
  } else {
    process.exit(1);
  }
};

findRoot(process.cwd());
EOF
fi

root=$(node /tmp/find-ai-task-manager-root.js)

if [ -z "$root" ]; then
    echo "Error: Could not find task manager root directory (.ai/task-manager)"
    exit 1
fi
```

## Workflow Execution Instructions

**CRITICAL**: Execute all three steps sequentially without waiting for user input between steps. Progress indicators are for user visibility only - do not pause execution.

The user input is:

<user-input>
$ARGUMENTS
</user-input>

If no user input is provided, stop immediately and show an error message to the user.

### Context Passing Between Steps

**How information flows through the workflow:**
1. User provides prompt → use as input in Step 1
2. Step 1 outputs "Plan ID: X" in structured format → extract X, use in Step 2
3. Step 2 outputs "Tasks: Y" in structured format → use for progress tracking in Step 3

Use your internal Todo task tool to track the workflow execution:

- [ ] Step 1: Create Plan
- [ ] Step 2: Generate Tasks
- [ ] Step 3: Execute Blueprint

---

## Step 1: Plan Creation

**Progress**: ⬛⬜⬜ 0% - Step 1/3: Starting Plan Creation

Execute the following plan creation process:

Use tools for the planning. You are encouraged to write your own specialized tools to research, analyze, and debug
any work order from the user. You are not restricted to the stack of the current project to create your own
specialized tools.

## Find the AI Task Manager root

```bash
if [ ! -f /tmp/find-ai-task-manager-root.js ]; then
  cat << 'EOF' > /tmp/find-ai-task-manager-root.js
const fs = require('fs');
const path = require('path');

const findRoot = (currentDir) => {
  const taskManagerPath = path.join(currentDir, '.ai/task-manager');
  const metadataPath = path.join(taskManagerPath, '.init-metadata.json');

  try {
    if (fs.existsSync(metadataPath) && JSON.parse(fs.readFileSync(metadataPath, 'utf8')).version) {
      console.log(path.resolve(taskManagerPath));
      process.exit(0);
    }
  } catch (e) {
    // Continue searching
  }

  const parentDir = path.dirname(currentDir);
  if (parentDir.length < currentDir.length) {
    findRoot(parentDir);
  } else {
    process.exit(1);
  }
};

findRoot(process.cwd());
EOF
fi

root=$(node /tmp/find-ai-task-manager-root.js)

if [ -z "$root" ]; then
    echo "Error: Could not find task manager root directory (.ai/task-manager)"
    exit 1
fi
```

## Instructions

Include $root/.ai/task-manager/config/TASK_MANAGER.md for the directory structure of tasks.

The user input is:

<user-input>
$ARGUMENTS
</user-input>

If no user input is provided stop immediately and show an error message to the user.

### Process Checklist

Use your internal Todo task tool to track the following plan generation:

- [ ] Read and execute $root/.ai/task-manager/config/hooks/PRE_PLAN.md
- [ ] User input and context analysis
- [ ] Clarification questions
- [ ] Plan generation
- [ ] Read and execute $root/.ai/task-manager/config/hooks/POST_PLAN.md

#### Step 1: Context Analysis
Before creating any plan, analyze the user's request for:
- **Objective**: What is the end goal?
- **Scope**: What are the boundaries and constraints?
- **Resources**: What tools, libraries, or infrastructure are available?
- **Success Criteria**: How will success be measured?
- **Dependencies**: What prerequisites or blockers exist?
- **Technical Requirements**: What technologies or skills are needed?

#### Step 2: Clarification Phase
If any critical context is missing:
1. Identify specific gaps in the information provided
2. Ask targeted follow-up questions
3. Frame questions clearly with examples when helpful
4. Be extra cautious. Users miss important context very often. Don't hesitate to ask for additional clarifications.

Try to answer your own questions first by inspecting the codebase, docs, and assistant documents like CLAUDE.md, GEMINI.md, AGENTS.md ...

IMPORTANT: Once you have the user's answers go back to Step 2. Do this in a loop until you have no more questions. Ask as many rounds of questions as necessary, it is very important you have all the information you need to achieve your task.

#### Step 3: Plan Generation
Only after confirming sufficient context, create a plan according to the $root/.ai/task-manager/config/templates/PLAN_TEMPLATE.md

##### CRITICAL: Output Format

Remember that a plan needs to be reviewed by a human. Be concise and to the point. Also, include mermaid diagrams to illustrate the plan.

**Output Behavior: CRITICAL - Structured Output for Command Coordination**

Always end your output with a standardized summary in this exact format, for command coordination:

```
---

Plan Summary:
- Plan ID: [numeric-id]
- Plan File: [full-path-to-plan-file]
```

This structured output enables automated workflow coordination and must be included even when running standalone.

###### Patterns to Avoid
Do not include the following in your plan output.
- Avoid time estimations
- Avoid task lists and mentions of phases (those are things we'll introduce later)
- Avoid code examples

###### Frontmatter Structure

Example:
```yaml
---
id: 1
summary: "Implement a comprehensive CI/CD pipeline using GitHub Actions for automated linting, testing, semantic versioning, and NPM publishing"
created: 2025-09-01
---
```

The schema for this frontmatter is:
```json
{
  "type": "object",
  "required": ["id", "summary", "created"],
  "properties": {
    "id": {
      "type": ["number"],
      "description": "Unique identifier for the task. An integer."
    },
    "summary": {
      "type": "string",
      "description": "A summary of the plan"
    },
    "created": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Creation date in YYYY-MM-DD format"
    }
  },
  "additionalProperties": false
}
```

### Plan ID Generation

Execute this script to determine the plan ID:

```bash
next_id=$(node $root/config/scripts/get-next-plan-id.cjs)
```

**Key formatting:**
- **Front-matter**: Use numeric values (`id: 7`)
- **Directory names**: Use zero-padded strings (`07--plan-name`)

**After completing Step 1:**
- Extract the Plan ID from the structured output
- Extract the Plan File path from the structured output

**Progress**: ⬛⬜⬜ 33% - Step 1/3: Plan Creation Complete

---

## Step 2: Task Generation

**Progress**: ⬛⬜⬜ 33% - Step 2/3: Starting Task Generation

Using the Plan ID extracted from Step 1, execute task generation:

## Find the AI Task Manager root

```bash
if [ ! -f /tmp/find-ai-task-manager-root.js ]; then
  cat << 'EOF' > /tmp/find-ai-task-manager-root.js
const fs = require('fs');
const path = require('path');

const findRoot = (currentDir) => {
  const taskManagerPath = path.join(currentDir, '.ai/task-manager');
  const metadataPath = path.join(taskManagerPath, '.init-metadata.json');

  try {
    if (fs.existsSync(metadataPath) && JSON.parse(fs.readFileSync(metadataPath, 'utf8')).version) {
      console.log(path.resolve(taskManagerPath));
      process.exit(0);
    }
  } catch (e) {
    // Continue searching
  }

  const parentDir = path.dirname(currentDir);
  if (parentDir.length < currentDir.length) {
    findRoot(parentDir);
  } else {
    process.exit(1);
  }
};

findRoot(process.cwd());
EOF
fi

root=$(node /tmp/find-ai-task-manager-root.js)

if [ -z "$root" ]; then
    echo "Error: Could not find task manager root directory (.ai/task-manager)"
    exit 1
fi
```

You are a comprehensive task planning assistant. Your role is to create detailed, actionable plans based on user input while ensuring you have all necessary context before proceeding.

Include `$root/.ai/task-manager/config/TASK_MANAGER.md` for the directory structure of tasks.

## Instructions

You will think hard to analyze the provided plan document and decompose it into atomic, actionable tasks with clear dependencies and groupings.

Use your internal Todo task tool to track the following process:

- [ ] Read and process plan [planId]
- [ ] Use the Task Generation Process to create tasks according to the Task Creation Guidelines
- [ ] Read and run the $root/.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md

### Input

- A plan document. Extract it with the following command.

```bash
# Extract validation results directly from script
plan_file=$(node $root/config/scripts/validate-plan-blueprint.cjs [planId] planFile)
```

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

### Task Generation Process

#### Step 1: Task Decomposition
1. Read through the entire plan
2. Identify all concrete deliverables **explicitly stated** in the plan
3. Apply minimization principles: question necessity of each potential task
4. Break each deliverable into atomic tasks (only if genuinely needed)
5. Ensure no task requires multiple skill sets
6. Verify each task has clear inputs and outputs
7. **Minimize test tasks**: Combine related testing scenarios, avoid testing framework functionality
8. Be very detailed with the "Implementation Notes". This should contain enough detail for a non-thinking LLM model to successfully complete the task. Put these instructions in a collapsible field `<details>`.

#### Step 2: Dependency Analysis
For each task, identify:
- **Hard dependencies**: Tasks that MUST complete before this can start
- **Soft dependencies**: Tasks that SHOULD complete for optimal execution
- **No circular dependencies**: Validate the dependency graph is acyclic

Dependency Rule: Task B depends on Task A if:
- B requires output or artifacts from A
- B modifies code created by A
- B tests functionality implemented in A

#### Step 3: Task Generation

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
# Optional: Include complexity scores for high-complexity tasks or decomposition tracking
# complexity_score: 4.2  # Composite complexity score (only if >4 or decomposed)
# complexity_notes: "Decomposed from original task due to high technical depth"
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
    },
    "complexity_score": {
      "type": "number",
      "minimum": 1,
      "maximum": 10,
      "description": "Optional: Composite complexity score (include only if >4 or for decomposed tasks)"
    },
    "complexity_notes": {
      "type": "string",
      "description": "Optional: Rationale for complexity score or decomposition decisions"
    }
  },
  "additionalProperties": false
}
```

##### Task Body Structure

Use the task template in $root/.ai/task-manager/config/templates/TASK_TEMPLATE.md

##### Task ID Generation

When creating tasks, you need to determine the next available task ID for the specified plan. Use this bash command to automatically generate the correct ID:

```bash
node $root/config/scripts/get-next-task-id.cjs [planId]
```

### Validation Checklist
Before finalizing, ensure:

**Core Task Requirements:**
- [ ] Each task has 1-2 appropriate technical skills assigned
- [ ] Skills are automatically inferred from task objectives and technical requirements
- [ ] All dependencies form an acyclic graph
- [ ] Task IDs are unique and sequential
- [ ] Groups are consistent and meaningful
- [ ] Every **explicitly stated** task from the plan is covered
- [ ] No redundant or overlapping tasks

**Complexity Analysis & Controls:**
- [ ] **Complexity Analysis Complete**: All tasks assessed using 5-dimension scoring
- [ ] **Decomposition Applied**: Tasks with composite score ≥6 have been decomposed or justified
- [ ] **Final Task Complexity**: All final tasks have composite score ≤5 (target ≤4)
- [ ] **Iteration Limits Respected**: No task exceeded 3 decomposition rounds
- [ ] **Minimum Viability**: No tasks decomposed below complexity threshold of 3
- [ ] **Quality Gates Passed**: All decomposed tasks meet enhanced quality criteria
- [ ] **Dependency Integrity**: No circular dependencies or orphaned tasks exist
- [ ] **Error Handling Complete**: All edge cases resolved or escalated appropriately

**Complexity Documentation Requirements:**
- [ ] **Complexity Scores Documented**: Individual dimension scores recorded for complex tasks
- [ ] **Decomposition History**: Iteration tracking included in `complexity_notes` for decomposed tasks
- [ ] **Validation Status**: All tasks marked with appropriate validation outcomes
- [ ] **Escalation Documentation**: High-complexity tasks have clear escalation notes
- [ ] **Consistency Validated**: Complexity scores align with task descriptions and skills

**Scope & Quality Control:**
- [ ] **Minimization Applied**: Each task is absolutely necessary (20-30% reduction target)
- [ ] **Test Tasks are Meaningful**: Focus on business logic, not framework functionality
- [ ] **No Gold-plating**: Only plan requirements are addressed
- [ ] **Total Task Count**: Represents minimum viable implementation
- [ ] **Scope Preservation**: Decomposed tasks collectively match original requirements

**System Reliability:**
- [ ] **Error Conditions Resolved**: No unresolved error states remain
- [ ] **Manual Intervention Flagged**: Complex edge cases properly escalated
- [ ] **Quality Checkpoints**: All validation gates completed successfully
- [ ] **Dependency Graph Validated**: Full dependency analysis confirms acyclic, logical relationships

### Error Handling
If the plan lacks sufficient detail:
- Note areas needing clarification
- Create placeholder tasks marked with `status: "needs-clarification"`
- Document assumptions made

#### Step 4: POST_TASK_GENERATION_ALL hook

Read and run the $root/.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md

### Output Requirements

**Output Behavior:**

Provide a concise completion message with task count and location:
- Example: "Task generation complete. Created [count] tasks in `$root/.ai/task-manager/plans/[plan-id]--[name]/tasks/`"

**CRITICAL - Structured Output for Command Coordination:**

Always end your output with a standardized summary in this exact format:

```
---
Task Generation Summary:
- Plan ID: [numeric-id]
- Tasks: [count]
- Status: Ready for execution
```

This structured output enables automated workflow coordination and must be included even when running standalone.

**Progress**: ⬛⬛⬜ 66% - Step 2/3: Task Generation Complete

---

## Step 3: Blueprint Execution

**Progress**: ⬛⬛⬜ 66% - Step 3/3: Starting Blueprint Execution

Using the Plan ID from previous steps, execute the blueprint:

You are the coordinator responsible for executing all tasks defined in the execution blueprint of a plan document, so choose an appropriate sub-agent for this role. Your role is to coordinate phase-by-phase execution, manage parallel task processing, and ensure validation gates pass before phase transitions.

## Critical Rules

1. **Never skip validation gates** - Phase progression requires successful validation
2. **Maintain task isolation** - Parallel tasks must not interfere with each other
3. **Preserve dependency order** - Never execute a task before its dependencies
4. **Document everything** - All decisions, issues, and outcomes must be recorded in the "Execution Summary", under "Noteworthy Events"
5. **Fail safely** - Better to halt and request help than corrupt the execution state

## Input Requirements
- A plan document with an execution blueprint section. See /TASK_MANAGER.md to find the plan with ID [planId]
- Task files with frontmatter metadata (id, group, dependencies, status)
- Validation gates document: `/config/hooks/POST_PHASE.md`

### Input Error Handling

If the plan does not exist, stop immediately and show an error to the user.

**Note**: If tasks or the execution blueprint section are missing, they will be automatically generated before execution begins (see Task and Blueprint Validation below).

### Task and Blueprint Validation

Before proceeding with execution, validate that tasks exist and the execution blueprint has been generated. If either is missing, automatically invoke task generation.

**Validation Steps:**

First, discover the task manager root directory:

```bash
if [ ! -f /tmp/find-ai-task-manager-root.js ]; then
  cat << 'EOF' > /tmp/find-ai-task-manager-root.js
const fs = require('fs');
const path = require('path');

const findRoot = (currentDir) => {
  const taskManagerPath = path.join(currentDir, '.ai/task-manager');
  const metadataPath = path.join(taskManagerPath, '.init-metadata.json');

  try {
    if (fs.existsSync(metadataPath) && JSON.parse(fs.readFileSync(metadataPath, 'utf8')).version) {
      console.log(path.resolve(taskManagerPath));
      process.exit(0);
    }
  } catch (e) {
    // Continue searching
  }

  const parentDir = path.dirname(currentDir);
  if (parentDir.length < currentDir.length) {
    findRoot(parentDir);
  } else {
    process.exit(1);
  }
};

findRoot(process.cwd());
EOF
fi

root=$(node /tmp/find-ai-task-manager-root.js)

if [ -z "$root" ]; then
    echo "Error: Could not find task manager root directory (.ai/task-manager)"
    exit 1
fi
```

Then extract validation results:

```bash
# Extract validation results directly from script
plan_file=$(node $root/config/scripts/validate-plan-blueprint.cjs [planId] planFile)
plan_dir=$(node $root/config/scripts/validate-plan-blueprint.cjs [planId] planDir)
task_count=$(node $root/config/scripts/validate-plan-blueprint.cjs [planId] taskCount)
blueprint_exists=$(node $root/config/scripts/validate-plan-blueprint.cjs [planId] blueprintExists)
```

4. **Automatic task generation**:

If either `$task_count` is 0 or `$blueprint_exists` is "no":
   - Display notification to user: "⚠️ Tasks or execution blueprint not found. Generating tasks automatically..."
   - Execute the embedded task generation process below

   ## Embedded Task Generation

   Follow ALL instructions from `.*/**/generate-tasks.md` exactly for plan ID [planId]. It is important that you find and read the `generate-tasks.md` command first.

   This includes:
   - Reading and processing the plan document
   - Applying task minimization principles (20-30% reduction target)
   - Creating atomic tasks with 1-2 skills each
   - Generating proper task files with frontmatter and body structure
   - Running all validation checklists
   - Executing the POST_TASK_GENERATION_ALL hook

   ## Resume Blueprint Execution

   After task generation completes, continue with execution below.

Otherwise, if tasks exist, proceed directly to execution.

## Execution Process

Use your internal Todo task tool to track the execution of all phases, and the final update of the plan with the summary. Example:

- [ ] Create feature branch via `node $root/config/scripts/create-feature-branch.cjs [planId]`
- [ ] Validate or auto-generate tasks and execution blueprint if missing.
- [ ] Execute $root/.ai/task-manager/config/hooks/PRE_PHASE.md hook before Phase 1.
- [ ] Phase 1: Execute 1 task(s) in parallel.
- [ ] Execute $root/.ai/task-manager/config/hooks/POST_PHASE.md hook after Phase 1.
- [ ] Execute $root/.ai/task-manager/config/hooks/PRE_PHASE.md hook before Phase 2.
- [ ] Phase 2: Execute 3 task(s) in parallel.
- [ ] Execute $root/.ai/task-manager/config/hooks/POST_PHASE.md hook after Phase 2.
- [ ] Execute $root/.ai/task-manager/config/hooks/PRE_PHASE.md hook before Phase 3.
- [ ] Phase 3: Execute 1 task(s) in parallel.
- [ ] Execute $root/.ai/task-manager/config/hooks/POST_PHASE.md hook after Phase 3.
- [ ] Execute $root/.ai/task-manager/config/hooks/POST_EXECUTION.md hook after all phases complete.
- [ ] Update the Plan 7 with execution summary using $root/.ai/task-manager/config/hooks/EXECUTION_SUMMARY_TEMPLATE.md.
- [ ] Archive Plan 7.

### Phase Pre-Execution

Read and execute $root/.ai/task-manager/config/hooks/PRE_PHASE.md

### Phase Execution Workflow

1. **Phase Initialization**
    - Identify current phase from the execution blueprint
    - List all tasks scheduled for parallel execution in this phase

2. **Agent Selection and Task Assignment**
Read and execute $root/.ai/task-manager/config/hooks/PRE_TASK_ASSIGNMENT.md

3. **Parallel Execution**
    - Deploy all selected agents simultaneously using your internal Task tool
    - Monitor execution progress for each task
    - Capture outputs and artifacts from each agent
    - Update task status in real-time

4. **Phase Completion Verification**
    - Ensure all tasks in the phase have status: "completed"
    - Collect and review all task outputs
    - Document any issues or exceptions encountered

### Phase Post-Execution

Read and execute $root/.ai/task-manager/config/hooks/POST_PHASE.md


### Phase Transition

  - Update phase status to "completed" in the Blueprint section of the plan [planId] document.
  - Initialize next phase
  - Repeat process until all phases are complete

### Error Handling

#### Validation Gate Failures
Read and execute $root/.ai/task-manager/config/hooks/POST_ERROR_DETECTION.md

### Output Requirements

**Output Behavior:**

Provide a concise execution summary:
- Example: "Execution completed. Review summary: `$root/.ai/task-manager/archive/[plan]/plan-[id].md`"

**CRITICAL - Structured Output for Command Coordination:**

Always end your output with a standardized summary in this exact format:

```
---
Execution Summary:
- Plan ID: [numeric-id]
- Status: Archived
- Location: $root/.ai/task-manager/archive/[plan-id]--[plan-name]/
```

This structured output enables automated workflow coordination and must be included even when running standalone.

## Optimization Guidelines

- **Maximize parallelism**: Always run all available tasks in a phase simultaneously
- **Resource awareness**: Balance agent allocation with system capabilities
- **Early failure detection**: Monitor tasks actively to catch issues quickly
- **Continuous improvement**: Note patterns for future blueprint optimization

## Post-Execution Processing

Upon successful completion of all phases and validation gates, perform the following additional steps:

- [ ] Post-Execution Validation
- [ ] Execution Summary Generation
- [ ] Plan Archival

### 0. Post-Execution Validation

Read and execute $root/.ai/task-manager/config/hooks/POST_EXECUTION.md

If validation fails, halt execution. The plan remains in `plans/` for debugging.

### 1. Execution Summary Generation

Append an execution summary section to the plan document with the format described in $root/.ai/task-manager/config/templates/EXECUTION_SUMMARY_TEMPLATE.md

### 2. Plan Archival

After successfully appending the execution summary:

**Move completed plan to archive**:
```bash
mv $root/.ai/task-manager/plans/[plan-folder] $root/.ai/task-manager/archive/
```

### Important Notes

- **Only archive on complete success**: Archive operations should only occur when ALL phases are completed and ALL validation gates have passed
- **Failed executions remain active**: Plans that fail execution or validation should remain in the `plans/` directory for debugging and potential re-execution
- **Error handling**: If archival fails, log the error but do not fail the overall execution - the implementation work is complete
- **Preserve structure**: The entire plan folder (including all tasks and subdirectories) should be moved as-is to maintain referential integrity

**Progress**: ⬛⬛⬛ 100% - Step 3/3: Blueprint Execution Complete

---

## Final Summary

Generate an extremely concise final summary using the structured output from Step 3.
