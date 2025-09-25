---
argument-hint: [plan-ID] [task-ID]
description: Execute a single task with dependency validation and status management
---
# Single Task Execution

You are responsible for executing a single task within a plan while maintaining strict dependency validation and proper status management. Your role is to ensure the task is ready for execution, deploy the appropriate agent, and track execution progress.

Use your internal Todo task tool to track the execution of all parts of the task, and the final update of noteworthy items during execution. Example:

- [ ] Validate task: file, status, and dependencies.
- [ ] Select the most appropriate sub-agent.
- [ ] Set task status to in-progress.
- [ ] Delegate task implementation to the sub-agent.
- [ ] Update task status to completed or failed.
- [ ] Update the task file with noteworthy events during execution.

## Critical Rules

1. **Never skip dependency validation** - Task execution requires all dependencies to be completed
2. **Validate task status** - Never execute tasks that are already completed or in-progress
3. **Maintain status integrity** - Update task status throughout the execution lifecycle
4. **Use appropriate agents** - Match task skills to available sub-agents
5. **Document execution** - Record all outcomes and issues encountered

## Input Requirements
- Plan ID: $1 (required)
- Task ID: $2 (required)
- Task management directory structure: `/`
- Dependency checking script: `.ai/task-manager/config/scripts/check-task-dependencies.cjs`

### Input Validation

First, validate that both arguments are provided:

```bash
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Error: Both plan ID and task ID are required"
    echo "Usage: /tasks:execute-task [plan-ID] [task-ID]"
    echo "Example: /tasks:execute-task 16 03"
    exit 1
fi
```

## Execution Process

### 1. Plan and Task Location

Locate the plan directory using the established find pattern:

```bash
PLAN_ID="$1"
TASK_ID="$2"

# Find plan directory
PLAN_DIR=$(find .ai/task-manager/{plans,archive} -type d -name "${PLAN_ID}--*" 2>/dev/null | head -1)

if [ -z "$PLAN_DIR" ]; then
    echo "Error: Plan with ID ${PLAN_ID} not found"
    echo "Available plans:"
    find .ai/task-manager/plans -name "*--*" -type d | head -5
    exit 1
fi

echo "Found plan: $PLAN_DIR"
```

### 2. Task File Validation

Locate and validate the specific task file:

```bash
# Handle both padded (01, 02) and unpadded (1, 2) task IDs
TASK_FILE=""
if [ -f "${PLAN_DIR}/tasks/${TASK_ID}--"*.md ]; then
    TASK_FILE=$(ls "${PLAN_DIR}/tasks/${TASK_ID}--"*.md 2>/dev/null | head -1)
elif [ -f "${PLAN_DIR}/tasks/0${TASK_ID}--"*.md ]; then
    TASK_FILE=$(ls "${PLAN_DIR}/tasks/0${TASK_ID}--"*.md 2>/dev/null | head -1)
fi

if [ -z "$TASK_FILE" ] || [ ! -f "$TASK_FILE" ]; then
    echo "Error: Task with ID ${TASK_ID} not found in plan ${PLAN_ID}"
    echo "Available tasks in plan:"
    find "$PLAN_DIR/tasks" -name "*.md" -type f | head -5
    exit 1
fi

echo "Found task: $(basename "$TASK_FILE")"
```

### 3. Task Status Validation

Check current task status to ensure it can be executed:

```bash
# Extract current status from task frontmatter
CURRENT_STATUS=$(awk '
    /^---$/ { if (++delim == 2) exit }
    /^status:/ {
        gsub(/^status:[ \t]*/, "")
        gsub(/^["'\'']/, "")
        gsub(/["'\'']$/, "")
        print
        exit
    }
' "$TASK_FILE")

echo "Current task status: ${CURRENT_STATUS:-unknown}"

# Validate status allows execution
case "$CURRENT_STATUS" in
    "completed")
        echo "Error: Task ${TASK_ID} is already completed"
        echo "Use execute-blueprint to re-execute the entire plan if needed"
        exit 1
        ;;
    "in-progress")
        echo "Error: Task ${TASK_ID} is already in progress"
        echo "Wait for current execution to complete or check for stale processes"
        exit 1
        ;;
    "pending"|"failed"|"")
        echo "Task status allows execution - proceeding..."
        ;;
    *)
        echo "Warning: Unknown task status '${CURRENT_STATUS}' - proceeding with caution..."
        ;;
esac
```

### 4. Dependency Validation

Use the dependency checking script to validate all dependencies:

```bash
# Call the dependency checking script
if ! node .ai/task-manager/config/scripts/check-task-dependencies.cjs "$PLAN_ID" "$TASK_ID"; then
    echo ""
    echo "Task execution blocked by unresolved dependencies."
    echo "Please complete the required dependencies first."
    exit 1
fi

echo ""
echo "✓ All dependencies resolved - proceeding with execution"
```

### 5. Agent Selection

Read task skills and select appropriate task-specific agent:

Read and execute .ai/task-manager/config/hooks/PRE_TASK_ASSIGNMENT.md

### 6. Status Update to In-Progress

Update task status before execution:

```bash
echo "Updating task status to in-progress..."

# Create temporary file with updated status
TEMP_FILE=$(mktemp)
awk '
    /^---$/ {
        if (++delim == 1) {
            print
            next
        } else if (delim == 2) {
            print "status: \"in-progress\""
            print
            next
        }
    }
    /^status:/ && delim == 1 {
        print "status: \"in-progress\""
        next
    }
    { print }
' "$TASK_FILE" > "$TEMP_FILE"

# Replace original file
mv "$TEMP_FILE" "$TASK_FILE"

echo "✓ Task status updated to in-progress"
```

### 7. Task Execution

Deploy the task using the Task tool with full context:

**Task Deployment**: Use your internal Task tool to execute the task with the following context:
- Task file path: `$TASK_FILE`
- Plan directory: `$PLAN_DIR`
- Required skills: `$TASK_SKILLS`
- Agent selection: Based on skills analysis or general-purpose agent

Read the complete task file and execute according to its requirements. The task includes:
- Objective and acceptance criteria
- Technical requirements and implementation notes
- Input dependencies and expected output artifacts

### 8. Post-Execution Status Management

After task completion, update the status based on execution outcome:

```bash
TEMP_FILE=$(mktemp)
awk '
    /^---$/ {
        if (++delim == 1) {
            print
            next
        } else if (delim == 2) {
            print "status: \"completed\""
            print
            next
        }
    }
    /^status:/ && delim == 1 {
        print "status: \"completed\""
        next
    }
    { print }
' "$TASK_FILE" > "$TEMP_FILE"

mv "$TEMP_FILE" "$TASK_FILE"

echo "✓ Task ${TASK_ID} completed successfully"
echo ""
echo "You can now execute dependent tasks or continue with the full blueprint execution."
```

## Error Handling

Read and execute .ai/task-manager/config/hooks/POST_ERROR_DETECTION.md

## Usage Examples

```bash
# Execute a specific task
/tasks:execute-task 16 1

# Execute task with zero-padded ID
/tasks:execute-task 16 03

# Execute task from archived plan
/tasks:execute-task 12 05
```

## Integration Notes

This command integrates with the existing task management system by:
- Using established plan and task location patterns
- Leveraging the dependency checking script for validation
- Following status management conventions
- Maintaining compatibility with execute-blueprint workflows
- Preserving task isolation and dependency order

The command complements execute-blueprint by providing granular task control while maintaining the same validation and execution standards.