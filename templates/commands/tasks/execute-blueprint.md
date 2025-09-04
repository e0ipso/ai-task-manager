---
argument-hint: [plan-ID]
description: Execute the task in the plan
---
# Task Execution

You are the orchestrator responsible for executing all tasks defined in the execution blueprint of a plan document. Your role is to coordinate phase-by-phase execution, manage parallel task processing, and ensure validation gates pass before phase transitions.

## Input Requirements
- A plan document with an execution blueprint section. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
- Task files with frontmatter metadata (id, group, dependencies, status)
- Validation gates document: `@.ai/task-manager/VALIDATION_GATES.md`

### Input Error Handling
If the plan does not exist, or the plan does not have an execution blueprint section. Stop immediately and show an error to the user.

## Execution Process

### Phase Pre-Execution

Before starting execution check if you are in the `main` branch. If so, create a git worktree to work on this blueprint the worktree should be created in the .ai/task-manager/worktrees folder.

### Phase Execution Workflow

1. **Phase Initialization**
    - Identify current phase from the execution blueprint
    - List all tasks scheduled for parallel execution in this phase
    - Verify all task dependencies from previous phases are marked "completed"
    - Confirm no tasks are marked "needs-clarification"
    - If any phases are marked as completed, verify they are actually completed and continue from the next phase.

2. **Agent Selection and Task Assignment**
    - For each task in the current phase:
        - Read task frontmatter to extract the `skills` property (array of technical skills)
        - Analyze task requirements and technical domain from description
        - Match task skills against available sub-agent capabilities
        - Select the most appropriate Claude Code sub-agent (if any are available). If no sub-agent is appropriate, use the generic one.
        - Consider task-specific requirements from the task document

3. **Parallel Execution**
    - Deploy all selected agents simultaneously
    - Monitor execution progress for each task
    - Capture outputs and artifacts from each agent
    - Update task status in real-time

4. **Phase Completion Verification**
    - Ensure all tasks in the phase have status: "completed"
    - Collect and review all task outputs
    - Document any issues or exceptions encountered

5. **Validation Gate Execution**
    - Reference validation criteria from `@.ai/task-manager/VALIDATION_GATES.md`
    - Execute all validation checks for the current phase
    - Document validation results
    - Only proceed if ALL validations pass

6. **Phase Transition**
    - Update phase status to "completed"
    - Initialize next phase
    - Repeat process until all phases are complete

### Agent Selection Guidelines

#### Available Claude Code Sub-Agents
Analyze the sub-agents available under `.claude/agents`. If none are available
or the available ones do not match the task's requirements, then use a generic
agent.

#### Matching Criteria
Select agents based on:
1. **Primary skill match**: Task technical requirements from the `skills` array in task frontmatter
2. **Domain expertise**: Specific frameworks or libraries mentioned in task descriptions
3. **Task complexity**: Senior vs. junior agent capabilities
4. **Resource efficiency**: Avoid over-provisioning for simple tasks

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

#### Task Failure Protocol
1. **Immediate Actions:**
    - Pause the failed task's agent
    - Document the error with full context
    - Assess impact on other parallel tasks

2. **Recovery Strategy:**
    - Attempt automatic retry with same agent (max 2 retries)
    - If persistent failure, escalate for manual intervention
    - Consider alternative agent selection
    - Update task status to reflect issues

3. **Phase-Level Failures:**
    - If any task in a phase fails after retries:
        - Halt phase progression
        - Complete any still-running parallel tasks
        - Generate failure report with recommendations
        - Request human intervention before continuing

#### Validation Gate Failures
If validation gates fail:
1. Document which specific validations failed
2. Identify which tasks may have caused the failure
3. Generate remediation plan
4. Re-execute affected tasks after fixes
5. Re-run validation gates

### Output Requirements

#### Final Execution Report
Upon blueprint completion respond with the following to the user:

```
✅ Execution Complete

📊 Summary Statistics

- Total Phases Executed: X
- Total Tasks Completed: Y
- Total Execution Time: [duration]
- Parallel Efficiency: X% (tasks run in parallel vs. sequential)

📋 Phase-by-Phase Results

[Concise summary of each phase]

📦 Artifacts Generated

[List of all outputs and deliverables]

💡 Recommendations

[Any follow-up actions or optimizations identified]
```

## Critical Rules

1. **Never skip validation gates** - Phase progression requires successful validation
2. **Maintain task isolation** - Parallel tasks must not interfere with each other
3. **Preserve dependency order** - Never execute a task before its dependencies
4. **Document everything** - All decisions, issues, and outcomes must be recorded
5. **Fail safely** - Better to halt and request help than corrupt the execution state

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
**Total Execution Time**: [duration]

### Results
[Brief summary of execution results and key deliverables]

### Noteworthy Events
[Highlight any unexpected events, challenges overcome, or significant findings during execution. If none occurred, state "No significant issues encountered."]

### Final Validation
✅ All validation gates passed
✅ All tasks completed successfully
```

### 2. Plan Archival

After successfully appending the execution summary:

1. **Create archive directory if needed**:
   ```bash
   mkdir -p .ai/task-manager/archive
   ```

2. **Move completed plan to archive**:
   ```bash
   mv .ai/task-manager/plans/[plan-folder] .ai/task-manager/archive/
   ```

### Important Notes

- **Only archive on complete success**: Archive operations should only occur when ALL phases are completed and ALL validation gates have passed
- **Failed executions remain active**: Plans that fail execution or validation should remain in the `plans/` directory for debugging and potential re-execution
- **Error handling**: If archival fails, log the error but do not fail the overall execution - the implementation work is complete
- **Preserve structure**: The entire plan folder (including all tasks and subdirectories) should be moved as-is to maintain referential integrity
