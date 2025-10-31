---
argument-hint: [user-prompt]
description: Execute the full workflow from plan creation to blueprint execution
---
# Full Workflow Execution

## Assistant Configuration

Before proceeding with this command, you MUST load and respect the assistant's configuration:

**Run the following scripts:**
```bash
ASSISTANT=$(node .ai/task-manager/config/scripts/detect-assistant.cjs)
node .ai/task-manager/config/scripts/read-assistant-config.cjs "$ASSISTANT"
```

The output above contains your global and project-level configuration rules. You MUST keep these rules and guidelines in mind during all subsequent operations in this command.

---

You are a workflow orchestration assistant. Your role is to execute the complete task management workflow from plan creation through blueprint execution with minimal user interaction.

## Instructions

The user input is:

<user-input>
$ARGUMENTS
</user-input>

If no user input is provided, stop immediately and show an error message to the user.

### Workflow Execution Process

Use your internal Todo task tool to track the workflow execution:

- [ ] Execute /tasks:create-plan
- [ ] Extract plan ID from created plan
- [ ] Execute /tasks:generate-tasks
- [ ] Execute /tasks:execute-blueprint

#### Step 1: Execute Plan Creation

Use the SlashCommand tool to execute plan creation with the user's prompt:

```
/tasks:create-plan $ARGUMENTS
```

**Important**: The plan creation command may ask clarification questions. Wait for user responses before continuing. This is expected behavior and maintains quality control.

**CRITICAL**: Do not wait for user approval or review of the plan. In full-workflow mode, plan validation is automated (Step 2 performs file existence checking only). Proceed immediately to Step 2 without waiting for user input.

#### Step 2: Extract Plan ID and Set Approval Method

After the plan is created, extract the Plan ID from the structured output in the conversation context.

**Instructions for the LLM:**

The create-plan command outputs a structured summary in this format:
```
---
Plan Summary:
- Plan ID: [numeric-id]
- Plan File: [full-path-to-plan-file]
```

1. Look at the output from the previous step (create-plan) in your conversation context
2. Extract the Plan ID from the "Plan Summary" section
3. Extract the Plan File path
4. Set the approval method to auto using that file path

**Example approach:**

```bash
# Use the Plan File path from the create-plan output above
PLAN_FILE="[extracted-from-context]"

# Set approval_method to auto for automated workflow execution
# This ensures generate-tasks and execute-blueprint run without interruption
node .ai/task-manager/config/scripts/set-approval-method.cjs "$PLAN_FILE" auto
```

**Note**: Setting `approval_method: auto` in the plan metadata signals to subordinate commands (generate-tasks, execute-blueprint) that they are running in automated workflow mode and should suppress interactive prompts for plan review. This metadata persists in the plan document and is reliably read by subsequent commands.

#### Step 3: Execute Task Generation

Use the Plan ID extracted from Step 2 and execute the generate-tasks command.

**Instructions for the LLM:**

Use the Plan ID that you extracted in Step 2 from the conversation context.

```
/tasks:generate-tasks [plan-id-from-step-2]
```

After task generation completes, the command will output a structured summary:
```
---
Task Generation Summary:
- Plan ID: [numeric-id]
- Tasks: [count]
- Status: Ready for execution
```

Provide a progress update: "Step 2/3: Task generation completed"

#### Step 4: Execute Blueprint

Use the Plan ID from previous steps and execute the blueprint.

**Instructions for the LLM:**

Use the same Plan ID that you've been using in previous steps.

```
/tasks:execute-blueprint [plan-id]
```

After blueprint execution completes, the command will output a structured summary:
```
---
Execution Summary:
- Plan ID: [numeric-id]
- Status: Archived
- Location: .ai/task-manager/archive/[plan-id]--[plan-name]/
```

Provide a progress update: "Step 3/3: Blueprint execution completed"

Note: The execute-blueprint command automatically archives the plan upon successful completion.

### Output Requirements

The execute-blueprint command outputs a structured summary with the archive location. Use that information to generate the extremely concise final summary.
