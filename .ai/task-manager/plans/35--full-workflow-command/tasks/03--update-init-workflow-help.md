---
id: 3
group: "documentation"
dependencies: [2]
status: "completed"
created: "2025-10-16"
skills:
  - "typescript"
---
# Update Init Workflow Help Text

## Objective

Update the workflow help text displayed after successful `init` command execution to include the new `/tasks:full-workflow` command as an alternative to the manual three-step process, providing users with both workflow options.

## Skills Required

- **typescript**: For editing the `displayWorkflowHelp()` function in `src/index.ts`

## Acceptance Criteria

- [ ] Help text updated in `src/index.ts` file (function `displayWorkflowHelp()`)
- [ ] New section added describing the automated workflow option
- [ ] Existing manual workflow section preserved
- [ ] Clear guidance on when to use each workflow
- [ ] Formatting consistent with existing help text
- [ ] Box drawing characters properly aligned
- [ ] Both workflows clearly distinguished

## Technical Requirements

**File to Modify:**
- `src/index.ts` - Function `displayWorkflowHelp()` (lines 384-429)

**Content Changes:**
Add a new section after "DAY-TO-DAY WORKFLOW" that describes the automated workflow option:

```
┌─ AUTOMATED WORKFLOW (RECOMMENDED FOR SIMPLE TASKS) ─┐
│                                                      │
│  Run the full workflow in one command:              │
│    /tasks:full-workflow Create an authentication... │
│                                                      │
│  This automatically:                                 │
│    • Creates the plan (with clarification prompts)  │
│    • Generates tasks                                │
│    • Executes the blueprint                         │
│    • Archives the completed plan                    │
│                                                      │
│  Best for: Straightforward implementations          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Update the existing "DAY-TO-DAY WORKFLOW" header to clarify it's the manual option:

```
┌─ MANUAL WORKFLOW (RECOMMENDED FOR COMPLEX TASKS) ───┐
```

Add guidance at the bottom suggesting which workflow to use:

```
Choose your workflow:
• Use /tasks:full-workflow for straightforward implementations
• Use manual workflow when you need to review/modify plans or tasks
```

**Formatting Requirements:**
- Maintain consistent box width (currently 60 characters)
- Use existing box drawing characters (┌─┐│└┘)
- Preserve spacing and alignment
- Keep professional, concise tone

## Input Dependencies

- Task 2 validation: Confirms `/tasks:full-workflow` command works correctly
- Current `src/index.ts` file with existing `displayWorkflowHelp()` function
- Understanding of the new command's capabilities and use cases

## Output Artifacts

- Modified `src/index.ts` with updated help text
- Updated workflow guidance that users see after running init
- Clear documentation of both workflow options

## Implementation Notes

<details>
<summary>Detailed Implementation Guidance</summary>

### Step 1: Locate the Function

Open `src/index.ts` and find the `displayWorkflowHelp()` function (starts around line 384).

Current structure:
```typescript
async function displayWorkflowHelp(): Promise<void> {
  // ONE-TIME SETUP section
  // DAY-TO-DAY WORKFLOW section
  // Pro tip at the end
}
```

### Step 2: Add Automated Workflow Section

After the ONE-TIME SETUP section and before the DAY-TO-DAY WORKFLOW section, add:

```typescript
  console.log(`┌─ AUTOMATED WORKFLOW (RECOMMENDED FOR SIMPLE TASKS) ${thinSeparator.slice(51)}┐`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  Run the full workflow in one command:${' '.repeat(22)}│`);
  console.log(`│      /tasks:full-workflow Create an authentication...${' '.repeat(8)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  This automatically:${' '.repeat(39)}│`);
  console.log(`│    • Creates the plan (with clarification prompts)${' '.repeat(10)}│`);
  console.log(`│    • Generates tasks${' '.repeat(38)}│`);
  console.log(`│    • Executes the blueprint${' '.repeat(31)}│`);
  console.log(`│    • Archives the completed plan${' '.repeat(26)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`│  Best for: Straightforward implementations${' '.repeat(18)}│`);
  console.log(`│${' '.repeat(width)}│`);
  console.log(`└${thinSeparator}┘`);
  console.log('');
```

### Step 3: Update Manual Workflow Header

Change the existing DAY-TO-DAY WORKFLOW header line:

**From:**
```typescript
  console.log(`┌─ DAY-TO-DAY WORKFLOW ${thinSeparator.slice(22)}┐`);
```

**To:**
```typescript
  console.log(`┌─ MANUAL WORKFLOW (RECOMMENDED FOR COMPLEX TASKS) ${thinSeparator.slice(51)}┐`);
```

### Step 4: Add Workflow Selection Guidance

Before the final "Pro tip" line, add:

```typescript
  console.log('Choose your workflow:');
  console.log('  • Use /tasks:full-workflow for straightforward implementations');
  console.log('  • Use manual workflow when you need to review/modify plans or tasks');
  console.log('');
```

### Step 5: Verify Spacing and Alignment

The box width is 60 characters. Each content line should follow this pattern:
```
│  [content][spaces to pad to 58 chars]  │
```

For lines with content, count characters and ensure total is exactly 60:
- Opening `│  ` = 3 chars
- Content = variable
- Padding spaces = (58 - content length)
- Closing `  │` = 3 chars (note: 2 spaces before `│`)

Example verification:
```
│      /tasks:full-workflow Create an authentication...        │
```
Count: `│` + 6 spaces + content (46 chars) + 6 spaces + `│` = 60 total ✓

### Step 6: Test the Output

After making changes:

```bash
# Build the project
npm run build

# Run init to see the updated help text
npm start init --assistants claude --destination-directory /tmp/test-help
```

Review the output to ensure:
- Box drawing characters align correctly
- No lines overflow or have jagged edges
- Spacing looks professional
- Both workflows are clearly distinguished
- Guidance is helpful and concise

### Step 7: Handle Edge Cases

**If box width needs adjustment:**
The current width is defined as:
```typescript
const width = 60;
```

If content doesn't fit, consider:
1. Shortening text (preferred)
2. Increasing width (affects all sections)
3. Breaking into multiple lines

**Preferred approach:** Keep width at 60, shorten text if needed.

### Complete Modified Function Structure

After all changes, the function should have this flow:

1. Header box ("SUGGESTED WORKFLOW")
2. ONE-TIME SETUP section (unchanged)
3. **NEW:** AUTOMATED WORKFLOW section
4. **UPDATED:** MANUAL WORKFLOW section (was "DAY-TO-DAY WORKFLOW")
5. **NEW:** Workflow selection guidance
6. Pro tip (unchanged)

### Example Final Output

```
╔════════════════════════════════════════════════════════════╗
║                      SUGGESTED WORKFLOW                    ║
╚════════════════════════════════════════════════════════════╝

┌─ ONE-TIME SETUP ───────────────────────────────────────────┐
│  ...existing content...                                    │
└────────────────────────────────────────────────────────────┘

┌─ AUTOMATED WORKFLOW (RECOMMENDED FOR SIMPLE TASKS) ────────┐
│                                                            │
│  Run the full workflow in one command:                     │
│      /tasks:full-workflow Create an authentication...      │
│                                                            │
│  This automatically:                                       │
│    • Creates the plan (with clarification prompts)        │
│    • Generates tasks                                      │
│    • Executes the blueprint                               │
│    • Archives the completed plan                          │
│                                                            │
│  Best for: Straightforward implementations                │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─ MANUAL WORKFLOW (RECOMMENDED FOR COMPLEX TASKS) ──────────┐
│  ...existing manual workflow steps...                      │
└────────────────────────────────────────────────────────────┘

Choose your workflow:
  • Use /tasks:full-workflow for straightforward implementations
  • Use manual workflow when you need to review/modify plans or tasks

Pro tip: The manual review steps are crucial for success!
```

### Key Considerations

**Clarity:**
- Make it obvious that there are two workflow options
- Clearly state when to use each one
- Avoid overwhelming users with too many choices

**Consistency:**
- Match existing formatting style exactly
- Use same box drawing characters
- Maintain professional tone
- Keep spacing uniform

**Accuracy:**
- Ensure command names are correct (`/tasks:full-workflow`)
- Accurately describe what the automated workflow does
- Don't oversell or undersell either option

**User Guidance:**
- Help users make informed choice between workflows
- Emphasize that manual workflow is still recommended for complex tasks
- Maintain the importance of review steps (existing pro tip)

</details>
