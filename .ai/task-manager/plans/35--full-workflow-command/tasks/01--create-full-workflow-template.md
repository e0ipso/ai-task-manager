---
id: 1
group: "template-creation"
dependencies: []
status: "completed"
created: "2025-10-16"
skills:
  - "markdown"
  - "ai-prompt-engineering"
---
# Create Full Workflow Command Template

## Objective

Create the source Markdown template file (`templates/assistant/commands/tasks/full-workflow.md`) that orchestrates the three existing commands (`/tasks:create-plan`, `/tasks:generate-tasks`, `/tasks:execute-blueprint`) in sequence with proper error handling and progress tracking.

## Skills Required

- **markdown**: For authoring the template file structure and formatting
- **ai-prompt-engineering**: For crafting effective orchestration instructions that guide the AI through the multi-step workflow

## Acceptance Criteria

- [ ] Template file created at `templates/assistant/commands/tasks/full-workflow.md`
- [ ] Frontmatter includes correct `argument-hint` and `description` fields
- [ ] Assistant configuration loading section included
- [ ] Orchestration instructions guide AI through all workflow steps
- [ ] Plan ID extraction logic uses `get-next-plan-id.cjs` script
- [ ] SlashCommand tool invocations for all three sub-commands
- [ ] Todo tracking template for progress visibility
- [ ] Error handling specifications for each step
- [ ] Minimal progress updates and comprehensive summary generation
- [ ] Template follows DRY principles (no logic duplication)

## Technical Requirements

**Template Structure:**
- YAML frontmatter with `argument-hint: [user-prompt]` and appropriate description
- Assistant configuration loading via `detect-assistant.cjs` and `read-assistant-config.cjs`
- Input validation (error if no user prompt provided)
- Todo tracking list with 5 items (execute plan, extract ID, generate tasks, execute blueprint, summary)

**Orchestration Flow:**
1. Get next plan ID using `node .ai/task-manager/config/scripts/get-next-plan-id.cjs`
2. Execute `/tasks:create-plan $ARGUMENTS` via SlashCommand tool
3. Validate plan was created using filesystem check
4. Execute `/tasks:generate-tasks [plan-id]` via SlashCommand tool
5. Execute `/tasks:execute-blueprint [plan-id]` via SlashCommand tool
6. Generate execution summary with plan location, status, and review instructions

**Error Handling:**
- Halt immediately on any step failure
- Clear error messages indicating which step failed
- Preserve partial progress (don't delete created artifacts)
- Provide manual recovery guidance

**Variable Substitution:**
- Use `$ARGUMENTS` for the user prompt (will convert to `{{args}}` for Gemini)
- No need for `$1` variable references (this command doesn't take plan ID as input)

## Input Dependencies

- Existing command templates in `templates/assistant/commands/tasks/`:
  - `create-plan.md`
  - `generate-tasks.md`
  - `execute-blueprint.md`
- ID generation script: `.ai/task-manager/config/scripts/get-next-plan-id.cjs`
- Understanding of SlashCommand tool usage in Claude Code

## Output Artifacts

- `templates/assistant/commands/tasks/full-workflow.md` - Source template file that will be:
  - Copied as-is to `.claude/commands/tasks/full-workflow.md`
  - Copied as-is to `.opencode/command/tasks/full-workflow.md`
  - Converted to TOML for `.gemini/commands/tasks/full-workflow.toml`

## Implementation Notes

<details>
<summary>Detailed Implementation Guidance</summary>

### Step 1: Create the Template File

Create `templates/assistant/commands/tasks/full-workflow.md` with the following structure:

```markdown
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

#### Step 3: Validate Plan Creation

Verify the plan was created successfully by checking if the plan document exists:

```bash
find .ai/task-manager/plans -name "plan-[0-9][0-9]*--*.md" -type f -exec grep -l "^id: \?[plan-id]$" {} \;
```

If the plan is not found, halt with error:
"❌ Error: Plan creation failed. Expected plan with ID [plan-id] not found."

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
```

### Step 2: Follow Existing Patterns

Reference the existing command templates to ensure consistency:
- Use the same frontmatter structure as `create-plan.md`, `generate-tasks.md`, `execute-blueprint.md`
- Include the standard assistant configuration loading section
- Follow the same Markdown formatting conventions

### Step 3: Ensure DRY Compliance

**DO:**
- Use SlashCommand tool to invoke existing commands
- Rely on existing ID generation scripts
- Leverage existing error handling in sub-commands
- Reference existing documentation and validation gates

**DON'T:**
- Duplicate plan creation logic
- Duplicate task generation logic
- Duplicate blueprint execution logic
- Create new ID generation mechanisms
- Implement custom validation that already exists in sub-commands

### Step 4: Test Template Syntax

After creating the template:
1. Verify YAML frontmatter is valid
2. Check that all bash code blocks are properly formatted
3. Ensure variable references use correct syntax (`$ARGUMENTS`)
4. Confirm Markdown structure is clean and readable

### Key Considerations

**Plan ID Extraction:**
- Use `get-next-plan-id.cjs` BEFORE plan creation to predict the ID
- Validate plan exists AFTER creation using `find` command
- This approach avoids parsing command output

**SlashCommand Tool Usage:**
- The SlashCommand tool is available in Claude Code
- It executes commands by expanding their templates
- Natural pauses occur when sub-commands ask for user input
- No special handling needed for clarification questions

**Multi-Assistant Compatibility:**
- Write template in Markdown with `$ARGUMENTS` variable
- Init process automatically handles TOML conversion for Gemini
- Variable substitution happens automatically (`$ARGUMENTS` → `{{args}}`)
- No platform-specific logic needed in template

**Progress Tracking:**
- Use TodoWrite tool to show progress through 5-step workflow
- Provide "Step X/4" updates to user at key milestones
- Generate comprehensive summary only at the end

**Error Recovery:**
- Partial execution is acceptable (don't clean up on failure)
- Users can manually continue from any step
- Clear error messages help users understand where to resume

</details>
