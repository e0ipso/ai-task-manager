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

Before creating the plan, determine what the next plan ID will be and store it persistently:

```bash
PLAN_ID=$(node .ai/task-manager/config/scripts/get-next-plan-id.cjs)
echo "$PLAN_ID" > /tmp/full-workflow-plan-id-$$.txt
echo "Next plan ID: $PLAN_ID"
```

This stores the plan ID in a temporary file that persists across all workflow steps.

#### Step 2: Execute Plan Creation

Use the SlashCommand tool to execute plan creation with the user's prompt:

```
/tasks:create-plan $ARGUMENTS
```

**Important**: The plan creation command may ask clarification questions. Wait for user responses before continuing. This is expected behavior and maintains quality control.

After plan creation completes, retrieve the plan ID and provide a progress update:

```bash
PLAN_ID=$(cat /tmp/full-workflow-plan-id-$$.txt)
echo "Step 1/4: Plan created (ID: $PLAN_ID)"
```

**CRITICAL**: Do not wait for user approval or review of the plan. In full-workflow mode, plan validation is automated (Step 3 performs file existence checking only). Proceed immediately to Step 3 without waiting for user input.

#### Step 3: Validate Plan Creation and Set Approval Method

Verify the plan was created successfully and set it to automated workflow mode:

```bash
# Retrieve the plan ID from temp file
PLAN_ID=$(cat /tmp/full-workflow-plan-id-$$.txt)

# Find the created plan file
PLAN_FILE=$(find .ai/task-manager/plans -name "plan-[0-9][0-9]*--*.md" -type f -exec grep -l "^id: \?${PLAN_ID}$" {} \;)

# Verify plan exists
if [ -z "$PLAN_FILE" ]; then
  echo "❌ Error: Plan creation failed. Expected plan with ID ${PLAN_ID} not found."
  exit 1
fi

# Set approval_method to auto for automated workflow execution
# This ensures generate-tasks and execute-blueprint run without interruption
node .ai/task-manager/config/scripts/set-approval-method.cjs "$PLAN_FILE" auto
```

**Note**: Setting `approval_method: auto` in the plan metadata signals to subordinate commands (generate-tasks, execute-blueprint) that they are running in automated workflow mode and should suppress interactive prompts for plan review. This metadata persists in the plan document and is reliably read by subsequent commands, eliminating dependency on environment variables.

#### Step 4: Execute Task Generation

Retrieve the plan ID and use the SlashCommand tool to generate tasks:

```bash
PLAN_ID=$(cat /tmp/full-workflow-plan-id-$$.txt)
echo "Generating tasks for plan $PLAN_ID"
```

Now use the SlashCommand tool with the plan ID from above:

```
/tasks:generate-tasks [plan-id-from-above]
```

After task generation completes, provide minimal progress update referencing the plan ID.

#### Step 5: Execute Blueprint

Retrieve the plan ID and use the SlashCommand tool to execute the blueprint:

```bash
PLAN_ID=$(cat /tmp/full-workflow-plan-id-$$.txt)
echo "Executing blueprint for plan $PLAN_ID"
```

Now use the SlashCommand tool with the plan ID from above:

```
/tasks:execute-blueprint [plan-id-from-above]
```

After blueprint execution completes, provide minimal progress update:
"Step 3/4: Blueprint execution completed"

Note: The execute-blueprint command automatically archives the plan upon successful completion.

#### Step 6: Generate Execution Summary

After all steps complete successfully, retrieve the plan details and generate a summary:

```bash
PLAN_ID=$(cat /tmp/full-workflow-plan-id-$$.txt)
PLAN_DIR=$(find .ai/task-manager/archive -type d -name "${PLAN_ID}--*" 2>/dev/null | head -n 1)
PLAN_NAME=$(basename "$PLAN_DIR")

echo "✅ Full workflow completed successfully!"
echo ""
echo "Plan: $PLAN_NAME"
echo "Location: .ai/task-manager/archive/$PLAN_NAME/"
echo ""
echo "Status: Archived and ready for review"
echo ""
echo "📋 Next Steps:"
echo "- Review the implementation in the archived plan"
echo "- Check the execution summary in the plan document"
echo "- Verify all validation gates passed"
echo ""
echo "Plan document: .ai/task-manager/archive/$PLAN_NAME/plan-$PLAN_NAME.md"

# Clean up temp file
rm -f /tmp/full-workflow-plan-id-$$.txt
```

### Error Handling

If any step fails:
1. Halt execution immediately
2. Report clear error message indicating which step failed
3. Preserve all created artifacts (plan, tasks) for manual review
4. Read the plan ID from temp file if needed: `cat /tmp/full-workflow-plan-id-$$.txt`
5. Provide guidance for manual continuation:
   - If plan creation failed: Review error and retry
   - If task generation failed: Run `/tasks:generate-tasks [plan-id]` manually after reviewing plan
   - If blueprint execution failed: Review tasks and run `/tasks:execute-blueprint [plan-id]` manually
6. Clean up temp file: `rm -f /tmp/full-workflow-plan-id-$$.txt`

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
