---
id: 2
group: "testing"
dependencies: [1]
status: "completed"
created: "2025-10-16"
skills:
  - "integration-testing"
---
# Test Full Workflow Command Integration

## Objective

Validate that the `/tasks:full-workflow` command works correctly across all three assistants (Claude, Gemini, Open Code) by testing template conversion, command execution, and end-to-end workflow functionality.

## Skills Required

- **integration-testing**: For executing end-to-end tests that validate the complete workflow from template creation through final archival

## Acceptance Criteria

- [ ] Template successfully created in templates directory
- [ ] Init command creates command files for all three assistants
- [ ] Claude receives Markdown version (.claude/commands/tasks/full-workflow.md)
- [ ] Gemini receives TOML version (.gemini/commands/tasks/full-workflow.toml)
- [ ] Open Code receives Markdown version (.opencode/command/tasks/full-workflow.md)
- [ ] TOML conversion maintains functional equivalence (variable substitution works)
- [ ] Test execution of full workflow produces archived plan
- [ ] Error handling works (halts on failure with clear messages)
- [ ] Progress tracking displays correctly
- [ ] Execution summary generated with correct information

## Technical Requirements

**Test Environment Setup:**
- Create temporary test directory for init testing
- Build the project (`npm run build`)
- Run init command with all three assistants

**Template Conversion Validation:**
- Verify Markdown template copied correctly to Claude and Open Code
- Verify TOML conversion for Gemini maintains:
  - Correct frontmatter transformation
  - Variable substitution (`$ARGUMENTS` → `{{args}}`)
  - Proper TOML syntax and structure
  - Functional equivalence with Markdown version

**Functional Testing:**
- Execute `/tasks:full-workflow` with a simple test prompt
- Verify plan creation step completes
- Verify plan ID extraction works
- Verify task generation step completes
- Verify blueprint execution step completes
- Verify plan archival completes
- Check that all artifacts exist in expected locations

**Error Handling Testing:**
- Test with missing user input (should show error)
- Test with invalid plan ID scenarios
- Verify error messages are clear and actionable

## Input Dependencies

- Task 1 output: `templates/assistant/commands/tasks/full-workflow.md`
- Built CLI: `dist/cli.js` (from `npm run build`)
- Init process: Template conversion and assistant structure creation

## Output Artifacts

- Validation report confirming:
  - Template conversion success for all assistants
  - End-to-end workflow execution success
  - Error handling correctness
  - Multi-assistant parity
- Identified issues or bugs (if any) for immediate fixing

## Implementation Notes

<details>
<summary>Detailed Testing Guidance</summary>

### Test Phase 1: Template Conversion Validation

#### Step 1.1: Build and Init
```bash
# Build the project
npm run build

# Create test directory
mkdir -p /tmp/full-workflow-test
cd /tmp/full-workflow-test

# Run init for all assistants
node /workspace/worktrees/wt-2/dist/cli.js init --assistants claude,gemini,opencode --destination-directory .
```

#### Step 1.2: Verify File Creation
```bash
# Check Claude
ls -la .claude/commands/tasks/full-workflow.md

# Check Gemini
ls -la .gemini/commands/tasks/full-workflow.toml

# Check Open Code
ls -la .opencode/command/tasks/full-workflow.md
```

All three files should exist.

#### Step 1.3: Validate TOML Conversion
```bash
# Review Gemini TOML file
cat .gemini/commands/tasks/full-workflow.toml
```

Verify:
- `[command]` section exists
- `argument_hint = "{{args}}"` (not `[user-prompt]`)
- `description` field is present
- `prompt = """..."""` contains the main content
- Variable references use `{{args}}` instead of `$ARGUMENTS`
- Bash commands preserved correctly
- No syntax errors (valid TOML)

#### Step 1.4: Compare Functional Equivalence
Read both Markdown and TOML versions side-by-side:
```bash
# Markdown version
cat .claude/commands/tasks/full-workflow.md

# TOML version
cat .gemini/commands/tasks/full-workflow.toml
```

Verify the TOML prompt content matches the Markdown content (accounting for variable substitution).

### Test Phase 2: Functional Workflow Testing

#### Step 2.1: Execute Full Workflow
From within the test directory, execute the command with a simple test prompt:

```bash
# Simple test case
/tasks:full-workflow "Create a simple hello world function in TypeScript"
```

**Expected Behavior:**
1. Plan creation starts
2. Plan ID is extracted (e.g., "Plan 1 created")
3. Task generation completes
4. Blueprint execution begins
5. All tasks execute (may be quick for simple prompt)
6. Plan is archived
7. Summary is displayed with plan location

#### Step 2.2: Validate Artifacts
After execution completes:

```bash
# Check that plan was archived (not in plans/)
ls .ai/task-manager/plans/
# Should be empty or not contain the new plan

# Check that plan is in archive
ls .ai/task-manager/archive/
# Should contain directory like "01--hello-world-function/"

# Verify plan document exists
find .ai/task-manager/archive -name "plan-*.md" -type f

# Verify tasks were created
ls .ai/task-manager/archive/01--*/tasks/
# Should contain task files
```

#### Step 2.3: Verify Execution Summary
Check that the final summary includes:
- ✅ Success indicator
- Plan ID and name
- Archive location path
- Status (Archived)
- Review instructions
- Direct link to plan document

### Test Phase 3: Error Handling Validation

#### Step 3.1: Test Missing Input
```bash
/tasks:full-workflow ""
```

**Expected:** Error message indicating no user input provided.

#### Step 3.2: Test Partial Execution Recovery
If you need to test error recovery:
1. Manually create a plan
2. Delete it before task generation
3. Verify clear error message about missing plan

**Note:** Don't break existing commands for testing. Error handling should be validated through code review and logical analysis.

### Test Phase 4: Multi-Assistant Parity

#### Step 4.1: Test on Different Platforms
If possible, test the command on:
- Claude Code (primary testing environment)
- Gemini (if available)
- Open Code (if available)

Verify identical behavior across platforms (accounting for platform-specific UI differences).

### Validation Checklist

After completing all tests, confirm:

**Template Conversion:**
- [ ] Markdown file created for Claude
- [ ] Markdown file created for Open Code
- [ ] TOML file created for Gemini
- [ ] TOML syntax is valid
- [ ] Variable substitution correct in TOML
- [ ] Functional equivalence maintained

**Workflow Execution:**
- [ ] Plan creation step works
- [ ] Plan ID extraction works
- [ ] Task generation step works
- [ ] Blueprint execution step works
- [ ] Archival completes successfully
- [ ] All artifacts in correct locations

**Progress and Output:**
- [ ] Todo tracking updates correctly
- [ ] Progress messages display ("Step 1/4", etc.)
- [ ] Summary generated with correct info
- [ ] Error messages clear and actionable

**DRY Compliance:**
- [ ] No logic duplication from existing commands
- [ ] Sub-commands invoked via SlashCommand tool
- [ ] Existing scripts used for ID generation
- [ ] Existing validation gates preserved

### Fixing Issues

If you discover issues during testing:

**Template Issues:**
- Fix syntax in `templates/assistant/commands/tasks/full-workflow.md`
- Re-run init to regenerate assistant-specific files
- Re-test conversion

**Orchestration Issues:**
- Review SlashCommand tool invocations
- Check plan ID extraction logic
- Verify error handling paths
- Update template and re-test

**Conversion Issues:**
- Review variable substitution in `src/utils.ts`
- Check TOML generation logic
- May need to adjust template structure
- Coordinate with existing conversion patterns

### Success Criteria

Testing is complete when:
1. Init creates correct files for all assistants
2. TOML conversion is functionally equivalent to Markdown
3. End-to-end workflow executes successfully
4. Plan is archived in correct location
5. Error handling works as specified
6. No logic duplication from existing commands
7. Multi-assistant parity achieved (where testable)

</details>
