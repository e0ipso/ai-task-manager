---
argument-hint: [plan-ID]
description: Execute the task in the plan
---
# Task Execution

## Assistant Configuration

Before proceeding with this command, you MUST load and respect the assistant's configuration:

**Run the following scripts:**
```bash
ASSISTANT=$(node .ai/task-manager/config/scripts/detect-assistant.cjs)
node .ai/task-manager/config/scripts/read-assistant-config.cjs "$ASSISTANT"
```

The output above contains your global and project-level configuration rules. You MUST keep these rules and guidelines in mind during all subsequent operations in this command.

---

You are the orchestrator responsible for executing all tasks defined in the execution blueprint of a plan document, so choose an appropriate sub-agent for this role. Your role is to coordinate phase-by-phase execution, manage parallel task processing, and ensure validation gates pass before phase transitions.

## Critical Rules

1. **Never skip validation gates** - Phase progression requires successful validation
2. **Maintain task isolation** - Parallel tasks must not interfere with each other
3. **Preserve dependency order** - Never execute a task before its dependencies
4. **Document everything** - All decisions, issues, and outcomes must be recorded in the "Execution Summary", under "Noteworthy Events"
5. **Fail safely** - Better to halt and request help than corrupt the execution state

## Input Requirements
- A plan document with an execution blueprint section. See /TASK_MANAGER.md fo find the plan with ID $1
- Task files with frontmatter metadata (id, group, dependencies, status)
- Validation gates document: `/config/hooks/POST_PHASE.md`

### Input Error Handling

If the plan does not exist, stop immediately and show an error to the user.

**Note**: If tasks or the execution blueprint section are missing, they will be automatically generated before execution begins (see Task and Blueprint Validation below).

### Task and Blueprint Validation

Before proceeding with execution, validate that tasks exist and the execution blueprint has been generated. If either is missing, automatically invoke task generation.

**Validation Steps:**

```bash
# Validate plan exists and check for tasks/blueprint
VALIDATION=$(node .ai/task-manager/config/scripts/validate-plan-blueprint.cjs $1)

# Parse validation results
PLAN_FILE=$(echo "$VALIDATION" | grep -o '"planFile": "[^"]*"' | cut -d'"' -f4)
PLAN_DIR=$(echo "$VALIDATION" | grep -o '"planDir": "[^"]*"' | cut -d'"' -f4)
TASK_COUNT=$(echo "$VALIDATION" | grep -o '"taskCount": [0-9]*' | awk '{print $2}')
BLUEPRINT_EXISTS=$(echo "$VALIDATION" | grep -o '"blueprintExists": [a-z]*' | awk '{print $2}')
```

4. **Automatic task generation**:

If either `$TASK_COUNT` is 0 or `$BLUEPRINT_EXISTS` is "no":
   - Display notification to user: "⚠️ Tasks or execution blueprint not found. Generating tasks automatically..."
   - Use the SlashCommand tool to invoke task generation:
   ```
   /tasks:generate-tasks $1
   ```
   - **NEW STEP**: Immediately after task generation succeeds, set the approval_method_tasks field to auto:
     ```bash
     node .ai/task-manager/config/scripts/set-approval-method.cjs "$PLAN_FILE" auto tasks
     ```
   - This signals that tasks were auto-generated in workflow context and execution should continue without pause.
   - **CRITICAL**: After setting the field, you MUST immediately proceed with blueprint execution without waiting for user input. The workflow should continue seamlessly.
   - If generation fails: Halt execution with clear error message:
     ```
     ❌ Error: Automatic task generation failed.

     Please run the following command manually to generate tasks:
     /tasks:generate-tasks $1
     ```

**After successful validation or generation**, immediately proceed with the execution process below without pausing.

## Execution Process

Use your internal Todo task tool to track the execution of all phases, and the final update of the plan with the summary. Example:

- [ ] Create feature branch from the main branch.
- [ ] Validate or auto-generate tasks and execution blueprint if missing.
- [ ] Execute .ai/task-manager/config/hooks/PRE_PHASE.md hook before Phase 1.
- [ ] Phase 1: Execute 1 task(s) in parallel.
- [ ] Execute .ai/task-manager/config/hooks/POST_PHASE.md hook after Phase 1.
- [ ] Execute .ai/task-manager/config/hooks/PRE_PHASE.md hook before Phase 2.
- [ ] Phase 2: Execute 3 task(s) in parallel.
- [ ] Execute .ai/task-manager/config/hooks/POST_PHASE.md hook after Phase 2.
- [ ] Execute .ai/task-manager/config/hooks/PRE_PHASE.md hook before Phase 3.
- [ ] Phase 3: Execute 1 task(s) in parallel.
- [ ] Execute .ai/task-manager/config/hooks/POST_PHASE.md hook after Phase 3.
- [ ] Update the Plan 7 with execution summary using .ai/task-manager/config/hooks/EXECUTION_SUMMARY_TEMPLATE.md.
- [ ] Archive Plan 7.

### Phase Pre-Execution

Read and execute .ai/task-manager/config/hooks/PRE_PHASE.md

### Phase Execution Workflow

1. **Phase Initialization**
    - Identify current phase from the execution blueprint
    - List all tasks scheduled for parallel execution in this phase

2. **Agent Selection and Task Assignment**
Read and execute .ai/task-manager/config/hooks/PRE_TASK_ASSIGNMENT.md

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

Read and execute .ai/task-manager/config/hooks/POST_PHASE.md


### Phase Transition

  - Update phase status to "completed" in the Blueprint section of the plan $1 document.
  - Initialize next phase
  - Repeat process until all phases are complete

### Error Handling

#### Validation Gate Failures
Read and execute .ai/task-manager/config/hooks/POST_ERROR_DETECTION.md

### Output Requirements

**Context-Aware Output Behavior:**

**Extract approval method from plan metadata:**

First, extract both approval method fields from the plan document:

```bash
# Extract approval methods from plan metadata
APPROVAL_METHODS=$(node .ai/task-manager/config/scripts/get-approval-methods.cjs $1)

APPROVAL_METHOD_PLAN=$(echo "$APPROVAL_METHODS" | grep -o '"approval_method_plan": "[^"]*"' | cut -d'"' -f4)
APPROVAL_METHOD_TASKS=$(echo "$APPROVAL_METHODS" | grep -o '"approval_method_tasks": "[^"]*"' | cut -d'"' -f4)

# Defaults to "manual" if fields don't exist
APPROVAL_METHOD_PLAN=${APPROVAL_METHOD_PLAN:-manual}
APPROVAL_METHOD_TASKS=${APPROVAL_METHOD_TASKS:-manual}
```

Then adjust output based on the extracted approval methods:

- **If `APPROVAL_METHOD_PLAN="auto"` (automated workflow mode)**:
  - During task auto-generation phase: Provide minimal progress updates
  - Do NOT instruct user to review the plan or tasks being generated
  - Do NOT add any prompts that would pause execution

- **If `APPROVAL_METHOD_TASKS="auto"` (tasks auto-generated in workflow)**:
  - During task execution phase: Provide minimal progress updates at phase boundaries
  - Do NOT instruct user to review implementation details
  - Example output: "Phase 1/3 completed. Proceeding to Phase 2."

- **If `APPROVAL_METHOD_PLAN="manual"` or `APPROVAL_METHOD_TASKS="manual"` (standalone mode)**:
  - Provide detailed execution summary with phase results
  - List completed tasks and any noteworthy events
  - Instruct user to review the execution summary in the plan document
  - Example output: "Execution completed. Review summary: `.ai/task-manager/archive/[plan]/plan-[id].md`"

**Note**: This command respects both approval method fields:
- `approval_method_plan`: Used during auto-generation to determine if we're in automated workflow
- `approval_method_tasks`: Used during execution to determine output verbosity

**CRITICAL - Structured Output for Command Coordination:**

Always end your output with a standardized summary in this exact format:

```
---
Execution Summary:
- Plan ID: [numeric-id]
- Status: Archived
- Location: .ai/task-manager/archive/[plan-id]--[plan-name]/
```

This structured output enables automated workflow coordination and must be included even when running standalone.

## Optimization Guidelines

- **Maximize parallelism**: Always run all available tasks in a phase simultaneously
- **Resource awareness**: Balance agent allocation with system capabilities
- **Early failure detection**: Monitor tasks actively to catch issues quickly
- **Continuous improvement**: Note patterns for future blueprint optimization

## Post-Execution Processing

Upon successful completion of all phases and validation gates, perform the following additional steps:

- [ ] Execution Summary Generation
- [ ] Plan Archival

### 1. Execution Summary Generation

Append an execution summary section to the plan document with the format described in .ai/task-manager/config/templates/[EXECUTION_SUMMARY_TEMPLATE.md

### 2. Plan Archival

After successfully appending the execution summary:

**Move completed plan to archive**:
```bash
mv .ai/task-manager/plans/[plan-folder] .ai/task-manager/archive/
```

### Important Notes

- **Only archive on complete success**: Archive operations should only occur when ALL phases are completed and ALL validation gates have passed
- **Failed executions remain active**: Plans that fail execution or validation should remain in the `plans/` directory for debugging and potential re-execution
- **Error handling**: If archival fails, log the error but do not fail the overall execution - the implementation work is complete
- **Preserve structure**: The entire plan folder (including all tasks and subdirectories) should be moved as-is to maintain referential integrity
