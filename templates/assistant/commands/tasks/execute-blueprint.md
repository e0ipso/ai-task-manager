---
argument-hint: [plan-ID]
description: Execute the task in the plan
---
# Task Execution

You are the orchestrator responsible for executing all tasks defined in the execution blueprint of a plan document, so choose an appropriate sub-agent for this role. Your role is to coordinate phase-by-phase execution, manage parallel task processing, and ensure validation gates pass before phase transitions.

## Critical Rules

1. **Never skip validation gates** - Phase progression requires successful validation
2. **Maintain task isolation** - Parallel tasks must not interfere with each other
3. **Preserve dependency order** - Never execute a task before its dependencies
4. **Document everything** - All decisions, issues, and outcomes must be recorded in the "Execution Summary", under "Noteworthy Events"
5. **Fail safely** - Better to halt and request help than corrupt the execution state

## Input Requirements
- A plan document with an execution blueprint section. See @.ai/task-manager/TASK_MANAGER.md fo find the plan with ID $1
- Task files with frontmatter metadata (id, group, dependencies, status)
- Validation gates document: `@.ai/task-manager/config/hooks/POST_PHASE.md`

### Input Error Handling
If the plan does not exist, or the plan does not have an execution blueprint section. Stop immediately and show an error to the user.

## Execution Process

Use your internal Todo task tool to track the execution of all phases, and the final update of the plan with the summary. Example:

- [ ] Create feature branch from the main branch.
- [ ] Phase 1: Execute 1 task(s) in parallel.
- [ ] Execute POST_PHASE.md hook after Phase 1.
- [ ] Phase 2: Execute 3 task(s) in parallel.
- [ ] Execute POST_PHASE.md hook after Phase 2.
- [ ] Phase 3: Execute 1 task(s) in parallel.
- [ ] Execute POST_PHASE.md hook after Phase 3.
- [ ] Update the Plan 7 with execution summary, and the archive it.

### Phase Pre-Execution

Read and execute @.ai/task-manager/config/hooks/PRE_PHASE.md

### Phase Execution Workflow

1. **Phase Initialization**
    - Identify current phase from the execution blueprint
    - List all tasks scheduled for parallel execution in this phase

2. **Agent Selection and Task Assignment**
Read and execute @.ai/task-manager/config/hooks/PRE_TASK_ASSIGNMENT.md

3. **Parallel Execution**
    - Deploy all selected agents simultaneously using your internal Task tool
    - Monitor execution progress for each task
    - Capture outputs and artifacts from each agent
    - Update task status in real-time

4. **Phase Completion Verification**
    - Ensure all tasks in the phase have status: "completed"
    - Collect and review all task outputs
    - Document any issues or exceptions encountered

5. **Validation Gate Execution**
    - Reference validation criteria from `@.ai/task-manager/config/hooks/POST_PHASE.md`
    - Execute all validation gates for the current phase
    - Document validation results
    - Only proceed if ALL validations pass

6. **Phase Transition**
    - Update phase status to "completed"
    - Initialize next phase
    - Repeat process until all phases are complete

### Execution Monitoring

#### Progress Tracking

Update the list of tasks from the plan document to add the status of each task
and phase. Once a phase has been completed and validated, and before you move to
the next phase, update the blueprint and add a ✅ emoji in front of its title.
Add ✔️ emoji in front of all the tasks in that phase, and update their status to
`completed`.

#### Task Status Updates
Valid status transitions:
- `pending` → `in-progress` (when agent starts)
- `in-progress` → `completed` (successful execution)
- `in-progress` → `failed` (execution error)
- `failed` → `in-progress` (retry attempt)

### Error Handling

#### Validation Gate Failures
Read and execute @.ai/task-manager/config/hooks/POST_ERROR_DETECTION.md

### Output Requirements

## Optimization Guidelines

- **Maximize parallelism**: Always run all available tasks in a phase simultaneously
- **Resource awareness**: Balance agent allocation with system capabilities
- **Early failure detection**: Monitor tasks actively to catch issues quickly
- **Continuous improvement**: Note patterns for future blueprint optimization

## Post-Execution Processing

Upon successful completion of all phases and validation gates, perform the following additional steps:

### 1. Execution Summary Generation

Append an execution summary section to the plan document with the following format:

```markdown
## Execution Summary

**Status**: ✅ Completed Successfully
**Completed Date**: [YYYY-MM-DD]

### Results
[Brief summary of execution results and key deliverables]

### Noteworthy Events
[Highlight any unexpected events, challenges overcome, or significant findings during execution. If none occurred, state "No significant issues encountered."]

### Recommendations
[Any follow-up actions or optimizations identified]
```

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
