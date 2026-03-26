# PRE_PHASE Hook

## Phase Pre-Execution

### Feature Branch Creation

Create a feature branch for this plan execution (only runs from main/master with a clean working tree):

```bash
# Create feature branch (handles all edge cases automatically)
node $root/config/scripts/create-feature-branch.cjs $1

# Exit codes:
#   0 = Success (branch created, already exists, or not on main/master)
#   1 = Error (not git repo, uncommitted changes, or plan not found)
```

**Behavior**:
- From `main`/`master` with clean tree: Creates `feature/{planId}--{plan-name}` branch
- From `main`/`master` with uncommitted changes: Exits with error (exit 1)
- From feature branch: Proceeds without creating a new branch
- Branch already exists: Proceeds normally

## Phase Execution Workflow

1. **Phase Initialization**
    - Identify current phase from the execution blueprint
    - List all tasks scheduled for parallel execution in this phase
    - **Validate Task Dependencies**: For each task in the current phase, use the dependency checking script:
        ```bash
        # For each task in current phase
        for TASK_ID in $PHASE_TASKS; do
            if ! node .ai/task-manager/config/scripts/check-task-dependencies.cjs "$1" "$TASK_ID"; then
                echo "ERROR: Task $TASK_ID has unresolved dependencies - cannot proceed with phase execution"
                echo "Please resolve dependencies before continuing with blueprint execution"
                exit 1
            fi
        done
        ```
    - Confirm no tasks are marked "needs-clarification"
    - If any phases are marked as completed, verify they are actually completed and continue from the next phase.
