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
- [ ] Extract plan ID
- [ ] Execute /tasks:generate-tasks
- [ ] Execute /tasks:execute-blueprint
- [ ] Generate execution summary

#### Step 1: Determine Next Plan ID

Before creating the plan, determine what the next plan ID will be:

```bash
node .ai/task-manager/config/scripts/get-next-plan-id.cjs
```

Store this ID for later validation and use.

#### Step 2: Execute Plan Creation

Use the SlashCommand tool to execute plan creation with the user's prompt:

```
/tasks:create-plan $ARGUMENTS
```

**Important**: The plan creation command may ask clarification questions. Wait for user responses before continuing. This is expected behavior and maintains quality control.

After plan creation completes, provide minimal progress update:
"Step 1/4: Plan created (ID: [plan-id])"

**CRITICAL**: Do not wait for user approval or review of the plan. In full-workflow mode, plan validation is automated (Step 3 performs file existence checking only). Proceed immediately to Step 3 without waiting for user input.

#### Step 3: Validate Plan Creation and Set Approval Method

Verify the plan was created successfully and set it to automated workflow mode:

```bash
# Find the created plan file
PLAN_FILE=$(find .ai/task-manager/plans -name "plan-[0-9][0-9]*--*.md" -type f -exec grep -l "^id: \?[plan-id]$" {} \;)

# Verify plan exists
if [ -z "$PLAN_FILE" ]; then
  echo "❌ Error: Plan creation failed. Expected plan with ID [plan-id] not found."
  exit 1
fi

# Set approval_method to auto for automated workflow execution
# This ensures generate-tasks and execute-blueprint run without interruption
if ! grep -q "^approval_method:" "$PLAN_FILE"; then
  # Insert approval_method after the created: line in frontmatter
  sed -i.bak '/^created:/a\
approval_method: auto' "$PLAN_FILE" && rm -f "${PLAN_FILE}.bak"
else
  # Update existing approval_method to auto
  sed -i.bak 's/^approval_method:.*/approval_method: auto/' "$PLAN_FILE" && rm -f "${PLAN_FILE}.bak"
fi
```

**Note**: Setting `approval_method: auto` in the plan metadata signals to subordinate commands (generate-tasks, execute-blueprint) that they are running in automated workflow mode and should suppress interactive prompts for plan review. This metadata persists in the plan document and is reliably read by subsequent commands, eliminating dependency on environment variables.

#### Step 4: Execute Task Generation

Use the SlashCommand tool to generate tasks for the plan:

```
/tasks:generate-tasks [plan-id]
```

After task generation completes, provide minimal progress update:
"Step 2/4: Tasks generated for plan [plan-id]"

#### Step 5: Execute Blueprint

Use the SlashCommand tool to execute the blueprint:

```
/tasks:execute-blueprint [plan-id]
```

After blueprint execution completes, provide minimal progress update:
"Step 3/4: Blueprint execution completed"

Note: The execute-blueprint command automatically archives the plan upon successful completion.

#### Step 6: Generate Execution Summary

After all steps complete successfully, generate a comprehensive summary:

```
✅ Full workflow completed successfully!

Plan: [plan-id]--[plan-name]
Location: .ai/task-manager/archive/[plan-id]--[plan-name]/

Status: Archived and ready for review

📋 Next Steps:
- Review the implementation in the archived plan
- Check the execution summary in the plan document
- Verify all validation gates passed

Plan document: .ai/task-manager/archive/[plan-id]--[plan-name]/plan-[plan-id]--[plan-name].md
```

### Error Handling

If any step fails:
1. Halt execution immediately
2. Report clear error message indicating which step failed
3. Preserve all created artifacts (plan, tasks) for manual review
4. Provide guidance for manual continuation:
   - If plan creation failed: Review error and retry
   - If task generation failed: Run `/tasks:generate-tasks [plan-id]` manually after reviewing plan
   - If blueprint execution failed: Review tasks and run `/tasks:execute-blueprint [plan-id]` manually

### Output Requirements

**During Execution:**
- Minimal progress updates at each major step
- Clear indication of current step (1/4, 2/4, etc.)

**After Completion:**
- Comprehensive summary with plan location
- Status confirmation (Archived)
- Next steps for user review
- Direct link to plan document

**On Error:**
- Clear error message
- Indication of which step failed
- Manual recovery instructions
