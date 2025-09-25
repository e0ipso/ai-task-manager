---
argument-hint: [user-prompt]
description: Create a comprehensive plan to accomplish the request from the user.
---
# Comprehensive Plan Creation

You are a comprehensive task planning assistant. Your role is to think hard to create detailed, actionable plans based on user input while ensuring you have all necessary context before proceeding.

Include .ai/task-manager/config/TASK_MANAGER.md for the directory structure of tasks.

## Instructions

The user input is:

<user-input>
$ARGUMENTS
</user-input>

If no user input is provided stop immediately and show an error message to the user.

### Process

Use your internal Todo task tool to track the plan generation:

- [ ] Read and execute .ai/task-manager/config/hooks/PRE_PLAN.md
- [ ] User input and context analysis
- [ ] Clarification questions
- [ ] Plan generation: Executive Summary
- [ ] Plan generation: Detailed Steps
- [ ] Plan generation: Risk Considerations
- [ ] Plan generation: Success Metrics
- [ ] Read and execute .ai/task-manager/config/hooks/POST_PLAN.md

#### Step 1: Context Analysis
Before creating any plan, analyze the user's request for:
- **Objective**: What is the end goal?
- **Scope**: What are the boundaries and constraints?
- **Resources**: What tools, budget, or team are available?
- **Success Criteria**: How will success be measured?
- **Dependencies**: What prerequisites or blockers exist?
- **Technical Requirements**: What technologies or skills are needed?

#### Step 2: Clarification Phase
If any critical context is missing:
1. Identify specific gaps in the information provided
2. Ask targeted follow-up questions grouped by category
3. Wait for user responses before proceeding to planning
4. Frame questions clearly with examples when helpful
5. Be extra cautious. Users miss important context very often. Don't hesitate to ask for clarifications.

Example clarifying questions:
- "Q: What is your primary goal with [specific aspect]?"
- "Q: Do you have any existing [resources/code/infrastructure] I should consider?"
- "Q: What is your timeline for completing this?"
- "Q: Are there specific constraints I should account for?"
- "Q: Do you want me to write tests for this?"
- "Q: Are there other systems, projects, or modules that perform a similar task?"

Try to answer your own questions first by inspecting the codebase, docs, and assistant documents like CLAUDE.md, GEMINI.md, AGENTS.md ...

#### Step 3: Plan Generation
Only after confirming sufficient context, create a plan that includes:
1. **Executive Summary**: Brief overview of the approach
2. **Detailed Steps**: Numbered, actionable tasks with clear outcomes
3. **Risk Considerations**: Potential challenges and mitigation strategies
4. **Success Metrics**: How to measure completion and quality

Remember that a plan needs to be reviewed by a human. Be concise and to the point. Also, include mermaid diagrams to illustrate the plan.

##### Output Format
Structure your response as follows:
- If context is insufficient: List specific clarifying questions
- If context is sufficient: Provide the comprehensive plan using the structure above. Use the information in @TASK_MANAGER.md for the directory structure and additional information about plans.

Outside the plan document, be **extremely** concise. Just tell the user that you are done, and instruct them to review the plan document.

###### Plan Template

Use the template in .ai/task-manager/config/templates/PLAN_TEMPLATE.md

###### Patterns to Avoid
Do not include the following in your plan output.
- Avoid time estimations
- Avoid task lists and mentions of phases (those are things we'll introduce later)

###### Frontmatter Structure

Example:
```yaml
---
id: 1
summary: "Implement a comprehensive CI/CD pipeline using GitHub Actions for automated linting, testing, semantic versioning, and NPM publishing"
created: 2025-09-01
---
```

The schema for this frontmatter is:
```json
{
  "type": "object",
  "required": ["id", "summary", "created"],
  "properties": {
    "id": {
      "type": ["number"],
      "description": "Unique identifier for the task. An integer."
    },
    "summary": {
      "type": "string",
      "description": "A summary of the plan"
    },
    "created": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Creation date in YYYY-MM-DD format"
    }
  },
  "additionalProperties": false
}
```

### Plan ID Generation

**Auto-generate the next plan ID:**
```bash
node .ai/task-manager/config/scripts/get-next-plan-id.cjs
```

**Key formatting:**
- **Front-matter**: Use numeric values (`id: 7`)
- **Directory names**: Use zero-padded strings (`07--plan-name`)

This Node.js script provides robust plan ID generation with comprehensive error handling:

**Features:**
- **Flexible Whitespace Handling**: Supports various frontmatter patterns
- **Validation Layer**: Only processes files with valid numeric ID fields in YAML frontmatter
- **Error Resilience**: Gracefully handles empty directories, corrupted files, and parsing failures
- **Fallback Logic**: Returns ID 1 when no valid plans found, ensuring script never fails
- **Dual ID Detection**: Checks both filename patterns and frontmatter for maximum reliability

**Handles Edge Cases:**
- Empty plans/archive directories → Returns 1
- Corrupted or malformed YAML frontmatter → Skips invalid files
- Non-numeric ID values → Filters out automatically
- Missing frontmatter → Uses filename fallback
- File system errors → Gracefully handled
