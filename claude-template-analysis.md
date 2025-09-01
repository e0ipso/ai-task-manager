# Claude Markdown Templates Analysis for Gemini TOML Conversion

## Executive Summary

This document provides a comprehensive analysis of three Claude markdown templates and defines specifications for converting them to Gemini TOML format. The analysis covers template structure, argument handling patterns, frontmatter mapping, and specific conversion requirements.

## Template Analysis

### 1. create-plan.md

**Purpose**: Create comprehensive plans based on user input with context analysis and structured planning phases.

**Structure Analysis**:
- **Frontmatter**: Simple YAML with `argument-hint` and `description`
- **Argument Pattern**: Single `$ARGUMENTS` placeholder for user input
- **Content Sections**: Instructions, Process (3 steps), Output Format, Schema Definition, Guidelines
- **Key Features**: Context analysis, clarification phase, detailed plan generation

**Argument Usage**:
```markdown
<user-input>
$ARGUMENTS
</user-input>
```

**Frontmatter Schema**:
```yaml
---
argument-hint: [user-prompt]
description: Create a comprehensive plan to accomplish the request from the user.
---
```

**Complex Features**:
- Multi-step process with conditional logic
- JSON schema definition for output structure
- Extensive guidelines (scope control, simplicity principles)
- Include directive: `@.ai/task-manager/TASK_MANAGER_INFO.md`

### 2. generate-tasks.md

**Purpose**: Generate detailed task lists from plan documents with dependency analysis and execution blueprints.

**Structure Analysis**:
- **Frontmatter**: Simple YAML with `argument-hint` and `description`
- **Argument Pattern**: Uses `$1` for plan ID reference
- **Content Sections**: Instructions, Guidelines, Process (4 steps), Schema Definition, Blueprint Updates
- **Key Features**: Task minimization, dependency analysis, parallel execution planning

**Argument Usage**:
```markdown
- A plan document. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
```

**Frontmatter Schema**:
```yaml
---
argument-hint: [plan-ID]
description: Generate tasks to implement the plan with the provided ID.
---
```

**Complex Features**:
- Advanced task decomposition rules
- Dependency graph validation
- Mermaid diagram generation
- Phase-based execution blueprint creation
- Multiple JSON schemas (plan and task frontmatter)

### 3. execute-blueprint.md

**Purpose**: Execute tasks defined in plan execution blueprints with phase management and agent coordination.

**Structure Analysis**:
- **Frontmatter**: Simple YAML with `argument-hint` and `description`
- **Argument Pattern**: Uses `$1` for plan ID reference
- **Content Sections**: Input Requirements, Execution Process, Agent Selection, Monitoring, Error Handling
- **Key Features**: Phase execution, parallel task management, validation gates

**Argument Usage**:
```markdown
- A plan document with an execution blueprint section. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
```

**Frontmatter Schema**:
```yaml
---
argument-hint: [plan-ID]
description: Execute the task in the plan
---
```

**Complex Features**:
- Multi-phase workflow execution
- Agent selection algorithms
- Real-time status updates
- Error handling protocols
- Structured reporting format

## Argument Pattern Analysis

### Pattern Types Identified

1. **Full Arguments Pattern**: `$ARGUMENTS` (create-plan.md)
   - Usage: Direct insertion of all user input
   - Context: User input validation and processing
   - Conversion Target: `{{args}}`

2. **Positional Parameter Pattern**: `$1` (generate-tasks.md, execute-blueprint.md)
   - Usage: Reference to specific argument (plan ID)
   - Context: Resource lookup and validation
   - Conversion Target: `{{arg1}}` or specific named parameter

### Argument Contexts

1. **Input Validation Context**:
   ```markdown
   <user-input>
   $ARGUMENTS
   </user-input>
   
   If no user input is provided stop immediately and show an error message...
   ```

2. **Resource Reference Context**:
   ```markdown
   See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
   ```

3. **Error Handling Context**:
   ```markdown
   If the plan does not exist. Stop immediately and show an error to the user.
   ```

## Frontmatter Mapping Specifications

### Current Claude Format
```yaml
---
argument-hint: [descriptive-hint]
description: Brief description of the command
---
```

### Target Gemini TOML Format
```toml
[metadata]
name = "command-name"
description = "Brief description of the command"
argument_hint = "descriptive-hint"
version = "1.0.0"

[parameters]
# Parameter definitions based on argument patterns
```

### Mapping Rules

1. **Field Mapping**:
   - `argument-hint` → `argument_hint` (snake_case conversion)
   - `description` → `description` (direct mapping)
   - Add `name` field derived from filename
   - Add `version` field (default: "1.0.0")

2. **Parameter Extraction**:
   - `$ARGUMENTS` → `args` parameter with type "string" and required=true
   - `$1` → `arg1` parameter or named parameter based on hint
   - Parameter types inferred from usage context

## TOML Conversion Specifications

### 1. create-plan.md → create-plan.toml

```toml
[metadata]
name = "create-plan"
description = "Create a comprehensive plan to accomplish the request from the user."
argument_hint = "user-prompt"
version = "1.0.0"

[parameters]
user_prompt = { type = "string", required = true, description = "The user's request to create a plan for" }

[template]
content = """
# Comprehensive Plan Creation

You are a comprehensive task planning assistant...

The user input is:

<user-input>
{{user_prompt}}
</user-input>

[Rest of template content with {{user_prompt}} substitution]
"""
```

### 2. generate-tasks.md → generate-tasks.toml

```toml
[metadata]
name = "generate-tasks"
description = "Generate tasks to implement the plan with the provided ID."
argument_hint = "plan-ID"
version = "1.0.0"

[parameters]
plan_id = { type = "string", required = true, description = "The ID of the plan to generate tasks for" }

[template]
content = """
# Comprehensive Task List Creation

[Template content with {{plan_id}} substitution]

- A plan document. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID {{plan_id}}
"""
```

### 3. execute-blueprint.md → execute-blueprint.toml

```toml
[metadata]
name = "execute-blueprint"
description = "Execute the task in the plan"
argument_hint = "plan-ID"
version = "1.0.0"

[parameters]
plan_id = { type = "string", required = true, description = "The ID of the plan to execute" }

[template]
content = """
# Task Execution

[Template content with {{plan_id}} substitution]

- A plan document with an execution blueprint section. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID {{plan_id}}
"""
```

## Conversion Rules and Requirements

### 1. Argument Handling Conversion

| Claude Pattern | Gemini Equivalent | Notes |
|----------------|-------------------|-------|
| `$ARGUMENTS` | `{{args}}` or `{{user_prompt}}` | Use named parameter for clarity |
| `$1` | `{{arg1}}` or `{{plan_id}}` | Use descriptive names when possible |
| `$2` | `{{arg2}}` or named param | Continue pattern for additional args |

### 2. Content Structure Preservation

**Requirements**:
- Preserve all instructional content exactly
- Maintain JSON schema definitions
- Keep include directives (`@.ai/task-manager/TASK_MANAGER_INFO.md`)
- Preserve markdown formatting and structure

### 3. Parameter Type Inference

**Type Detection Rules**:
- Plan ID references → `string` type with validation pattern
- User prompts → `string` type, required
- Numeric references → `integer` type where appropriate
- Boolean flags → `boolean` type

### 4. Default Value Handling

**Default Assignment**:
- No defaults for required user input
- Empty string defaults for optional parameters
- Default validation: required=true for essential parameters

## Implementation Considerations

### 1. Complex Template Features

**JSON Schema Preservation**:
- Keep embedded JSON schemas intact
- Consider extracting to separate schema files if beneficial
- Maintain schema validation requirements

**Mermaid Diagrams**:
- Preserve diagram generation logic
- Maintain formatting requirements
- Keep dependency visualization intact

**Multi-step Processes**:
- Maintain step numbering and structure
- Preserve conditional logic flows
- Keep validation checkpoints

### 2. Include Directives

**Current Pattern**:
```markdown
Include @.ai/task-manager/TASK_MANAGER_INFO.md for the directory structure of tasks.
```

**Preservation Strategy**:
- Keep include directives as-is in TOML content
- Consider adding metadata for include dependencies
- Maintain file path references exactly

### 3. Error Handling Patterns

**Standardization**:
- Preserve error condition checks
- Maintain user feedback messages
- Keep validation failure responses

## Validation Requirements

### 1. Template Conversion Validation

- [ ] All argument placeholders correctly converted
- [ ] Frontmatter fields properly mapped
- [ ] Content structure preserved
- [ ] Include directives maintained
- [ ] Error handling patterns intact

### 2. Parameter Validation

- [ ] Required parameters properly marked
- [ ] Parameter types correctly inferred
- [ ] Default values appropriately assigned
- [ ] Validation rules preserved

### 3. Semantic Preservation

- [ ] Original functionality maintained
- [ ] Instructions clarity preserved
- [ ] Process flows intact
- [ ] Output format requirements unchanged

## Potential Conversion Issues

### 1. Complex Argument References

**Issue**: Multiple argument patterns in single template
**Solution**: Use descriptive parameter names instead of positional

### 2. Conditional Logic Dependencies

**Issue**: Arguments used in conditional statements
**Solution**: Preserve conditional structure with parameter substitution

### 3. Schema Definition Integration

**Issue**: Embedded JSON schemas may need special handling
**Solution**: Keep schemas as literal content blocks in TOML

### 4. Include File Dependencies

**Issue**: Templates reference external files
**Solution**: Document dependencies in metadata, preserve references

## Conclusion

The three Claude markdown templates follow consistent patterns but have varying complexity levels. The conversion to Gemini TOML format should:

1. **Preserve semantic meaning** through accurate parameter mapping
2. **Maintain structural integrity** by keeping all instructional content
3. **Enhance clarity** through descriptive parameter names
4. **Support validation** through proper type definitions

The most complex template (generate-tasks.md) requires careful handling of its multi-phase process and dependency analysis features, while the simpler templates (create-plan.md, execute-blueprint.md) are more straightforward to convert.

Key success factors:
- Accurate argument pattern conversion
- Complete content preservation
- Proper parameter type inference
- Validation rule maintenance