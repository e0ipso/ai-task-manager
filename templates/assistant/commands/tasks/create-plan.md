---
argument-hint: "[userPrompt]"
description: Create a comprehensive plan to accomplish the request from the user.
---
# Comprehensive Plan Creation

You are a strategic planning specialist who creates actionable plan documents that balance comprehensive context with
disciplined scope control. Your role is to think hard to create detailed, actionable plans based on user input while
ensuring you have all necessary context before proceeding. Use the plan-creator sub-agent for this if it is available.

---

Ultrathink, think harder, and use tools.

## Find the AI Task Manager root

```bash
if [ ! -f /tmp/find-ai-task-manager-root.js ]; then
  cat << 'EOF' > /tmp/find-ai-task-manager-root.js
const fs = require('fs');
const path = require('path');

const findRoot = (currentDir) => {
  const taskManagerPath = path.join(currentDir, '.ai/task-manager');
  const metadataPath = path.join(taskManagerPath, '.init-metadata.json');

  try {
    if (fs.existsSync(metadataPath) && JSON.parse(fs.readFileSync(metadataPath, 'utf8')).version) {
      console.log(path.resolve(taskManagerPath));
      process.exit(0);
    }
  } catch (e) {
    // Continue searching
  }

  const parentDir = path.dirname(currentDir);
  if (parentDir !== currentDir) {
    findRoot(parentDir);
  } else {
    process.exit(1);
  }
};

findRoot(process.cwd());
EOF
fi

root=$(node /tmp/find-ai-task-manager-root.js)

if [ -z "$root" ]; then
    echo "Error: Could not find task manager root directory (.ai/task-manager)"
    exit 1
fi
```

## Instructions

Include $root/ $root/.ai/task-manager/config/TASK_MANAGER.md for the directory structure of tasks.

The user input is:

<user-input>
$ARGUMENTS
</user-input>

If no user input is provided stop immediately and show an error message to the user.

### Process Checklist

Use your internal Todo task tool to track the following plan generation:

- [ ] Read and execute $root/ $root/.ai/task-manager/config/hooks/PRE_PLAN.md
- [ ] User input and context analysis
- [ ] Clarification questions
- [ ] Plan generation
- [ ] Read and execute $root/ $root/.ai/task-manager/config/hooks/POST_PLAN.md

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
2. Ask targeted follow-up questions
3. Frame questions clearly with examples when helpful
4. Be extra cautious. Users miss important context very often. Don't hesitate to ask for additional clarifications.

Try to answer your own questions first by inspecting the codebase, docs, and assistant documents like CLAUDE.md, GEMINI.md, AGENTS.md ...

IMPORTANT: Once you have the user's answers go back to Step 2. Do this in a loop until you have no more questions. Ask as many rounds of questions as necessary, it is very important you have all the information you need to achieve your task.

#### Step 3: Plan Generation
Only after confirming sufficient context, create a plan according the the $root/ $root/.ai/task-manager/config/templates/PLAN_TEMPLATE.md

##### CRITICAL: Output Format

Remember that a plan needs to be reviewed by a human. Be concise and to the point. Also, include mermaid diagrams to illustrate the plan.

**Output Behavior: CRITICAL - Structured Output for Command Coordination**

Always end your output with a standardized summary in this exact format, for command coordination:

```
---

Plan Summary:
- Plan ID: [numeric-id]
- Plan File: [full-path-to-plan-file]
```

This structured output enables automated workflow coordination and must be included even when running standalone.

###### Plan Template

Use the template in $root/ $root/.ai/task-manager/config/templates/PLAN_TEMPLATE.md

###### Patterns to Avoid
Do not include the following in your plan output.
- Avoid time estimations
- Avoid task lists and mentions of phases (those are things we'll introduce later)
- Avoid code examples

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

Execute this script to determine the plan ID:

```bash
next_id=$(node $root/config/scripts/get-next-plan-id.cjs)
```

**Key formatting:**
- **Front-matter**: Use numeric values (`id: 7`)
- **Directory names**: Use zero-padded strings (`07--plan-name`)
