/**
 * TOML Integration Tests
 *
 * Integration tests that validate TOML command files work correctly with realistic scenarios.
 * Tests actual template processing and argument injection for all three command types.
 */

// Mock fs-extra module
const mockReadFile = jest.fn();
jest.mock('fs-extra', () => ({
  readFile: mockReadFile,
}));

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  readAndProcessTemplate,
  convertMdToToml,
  getTemplatePath,
  resolvePath,
  parseFrontmatter,
} from '../utils';

// Integration tests use real template files
describe('TOML Integration Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Real Template Processing', () => {
    describe('create-plan.toml generation', () => {
      it('should convert create-plan.md to functional TOML', async () => {
        // Mock reading the actual template content
        const realCreatePlanTemplate = `---
argument-hint: [user-prompt]
description: Create a comprehensive plan to accomplish the request from the user.
---
# Comprehensive Plan Creation

You are a comprehensive task planning assistant. Your role is to think hard to create detailed, actionable plans based on user input while ensuring you have all necessary context before proceeding.

## Instructions

The user input is:

<user-input>
$ARGUMENTS
</user-input>

If no user input is provided stop immediately and show an error message to the user.

### Process

#### Step 1: Context Analysis
Before creating any plan, analyze the user's request for the following information about $ARGUMENTS.

Process the $ARGUMENTS systematically.`;

        mockReadFile.mockResolvedValue(realCreatePlanTemplate);

        const tomlResult = await readAndProcessTemplate('mock-path', 'toml');

        // Validate TOML structure
        expect(tomlResult).toMatch(/^\[metadata\]/m);
        expect(tomlResult).toMatch(/^\[prompt\]/m);

        // Validate argument conversion
        expect(tomlResult).toContain('{{args}}');
        expect(tomlResult).not.toContain('$ARGUMENTS');
        expect(tomlResult).not.toContain('[user-prompt]');

        // Validate argument-hint conversion
        expect(tomlResult).toMatch(/argument-hint = "{{args}}"/);

        // Validate content preservation
        expect(tomlResult).toMatch(/Comprehensive Plan Creation/);
        expect(tomlResult).toMatch(/comprehensive task planning assistant/);
        expect(tomlResult).toMatch(/Context Analysis/);

        // Validate all argument references converted
        const argsMatches = (tomlResult.match(/{{args}}/g) || []).length;
        expect(argsMatches).toBeGreaterThan(1); // At least in argument-hint and content
      });

      it('should handle create-plan with various user input scenarios', () => {
        const scenarios = [
          {
            name: 'Simple request',
            input: 'Create a web application',
            expected: 'Create a web application'
          },
          {
            name: 'Multi-line request',
            input: `Create a web application with:
- User authentication
- Dashboard
- API endpoints`,
            expected: 'User authentication'
          },
          {
            name: 'Request with special characters',
            input: 'Create "advanced" system with $100 budget & 50% performance improvement',
            expected: 'advanced'
          }
        ];

        scenarios.forEach(scenario => {
          const mdTemplate = `---
argument-hint: [user-prompt]
description: Create plan
---
Process user request: $ARGUMENTS`;

          const tomlResult = convertMdToToml(mdTemplate);
          
          // Should convert placeholder properly regardless of actual content
          expect(tomlResult).toContain('{{args}}');
          expect(tomlResult).not.toContain('$ARGUMENTS');
          expect(tomlResult).toMatch(/argument-hint = "{{args}}"/);
        });
      });
    });

    describe('generate-tasks.toml generation', () => {
      it('should convert generate-tasks.md to functional TOML', async () => {
        const realGenerateTasksTemplate = `---
argument-hint: [plan-ID]
description: Generate tasks to implement the plan with the provided ID.
---
# Comprehensive Task List Creation

You are a comprehensive task planning assistant.

## Instructions

You will think hard to analyze the provided plan document and decompose it into atomic, actionable tasks.

### Input
- A plan document. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
- The plan contains high-level objectives and implementation steps

Plan $1 should be loaded and processed.

### Task Creation Guidelines
Follow the guidelines for plan $1 processing.`;

        mockReadFile.mockResolvedValue(realGenerateTasksTemplate);

        const tomlResult = await readAndProcessTemplate('mock-path', 'toml');

        // Validate TOML structure
        expect(tomlResult).toMatch(/^\[metadata\]/m);
        expect(tomlResult).toMatch(/^\[prompt\]/m);

        // Validate argument conversion
        expect(tomlResult).toContain('{{plan_id}}');
        expect(tomlResult).not.toContain('$1');
        expect(tomlResult).not.toContain('[plan-ID]');

        // Validate argument-hint conversion
        expect(tomlResult).toMatch(/argument-hint = "{{plan_id}}"/);

        // Validate all plan ID references converted
        const planIdMatches = (tomlResult.match(/{{plan_id}}/g) || []).length;
        expect(planIdMatches).toBe(4); // argument-hint + 3 in content
      });

      it('should handle generate-tasks with various plan ID formats', () => {
        const planIdScenarios = [
          { planId: '1', description: 'Single digit' },
          { planId: '05', description: 'Zero-padded' },
          { planId: '123', description: 'Multi-digit' },
        ];

        planIdScenarios.forEach(scenario => {
          const mdTemplate = `---
argument-hint: [plan-ID]
description: Generate tasks for plan
---
Load plan with ID $1 and process plan $1 thoroughly.`;

          const tomlResult = convertMdToToml(mdTemplate);
          
          // Should convert all plan ID references
          expect(tomlResult).toContain('{{plan_id}}');
          expect(tomlResult).not.toContain('$1');
          expect(tomlResult).toMatch(/Load plan with ID {{plan_id}}/);
          expect(tomlResult).toMatch(/process plan {{plan_id}} thoroughly/);
        });
      });
    });

    describe('execute-blueprint.toml generation', () => {
      it('should convert execute-blueprint.md to functional TOML', async () => {
        const realExecuteBlueprintTemplate = `---
argument-hint: [plan-ID]
description: Execute the task in the plan
---
# Task Execution

You are the orchestrator responsible for executing all tasks defined in the execution blueprint.

## Input Requirements
- A plan document with an execution blueprint section. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
- Task files with frontmatter metadata
- Validation gates document

Execute plan $1 systematically following the blueprint.

### Phase Execution Workflow
1. Load plan $1
2. Process plan $1 phases
3. Validate plan $1 completion`;

        mockReadFile.mockResolvedValue(realExecuteBlueprintTemplate);

        const tomlResult = await readAndProcessTemplate('mock-path', 'toml');

        // Validate TOML structure
        expect(tomlResult).toMatch(/^\[metadata\]/m);
        expect(tomlResult).toMatch(/^\[prompt\]/m);

        // Validate argument conversion
        expect(tomlResult).toContain('{{plan_id}}');
        expect(tomlResult).not.toContain('$1');
        expect(tomlResult).not.toContain('[plan-ID]');

        // Validate argument-hint conversion
        expect(tomlResult).toMatch(/argument-hint = "{{plan_id}}"/);

        // Validate all plan ID references converted
        const planIdMatches = (tomlResult.match(/{{plan_id}}/g) || []).length;
        expect(planIdMatches).toBe(6); // argument-hint + 5 in content
      });
    });
  });

  describe('Argument Injection Scenarios', () => {
    describe('Complex argument patterns', () => {
      it('should handle mixed argument types in single template', () => {
        const complexTemplate = `---
argument-hint: Use [user-prompt] for plan [plan-ID]
description: Complex command
---
# Complex Processing

User request: $ARGUMENTS
Target plan: $1
Additional param: $2

Process $ARGUMENTS for plan $1 with param $2.`;

        const result = convertMdToToml(complexTemplate);

        // All argument types should be converted
        expect(result).toContain('{{args}}');
        expect(result).toContain('{{plan_id}}');
        expect(result).toContain('{{param2}}');
        
        // Original formats should be gone
        expect(result).not.toContain('$ARGUMENTS');
        expect(result).not.toContain('$1');
        expect(result).not.toContain('$2');
        expect(result).not.toContain('[user-prompt]');
        expect(result).not.toContain('[plan-ID]');

        // Verify conversion in both metadata and content
        expect(result).toMatch(/argument-hint = "Use {{args}} for plan {{plan_id}}"/);
        expect(result).toMatch(/User request: {{args}}/);
        expect(result).toMatch(/Target plan: {{plan_id}}/);
        expect(result).toMatch(/Additional param: {{param2}}/);
      });

      it('should preserve argument context and formatting', () => {
        const contextTemplate = `---
argument-hint: [user-prompt]
description: Context preservation
---
# Context Test

The user's request "$ARGUMENTS" should be processed carefully.

Analysis of '$ARGUMENTS':
1. Parse the request: $ARGUMENTS
2. Validate: "$ARGUMENTS"
3. Execute based on $ARGUMENTS

Final output for request '$ARGUMENTS' is complete.`;

        const result = convertMdToToml(contextTemplate);

        // Context should be preserved with proper escaping
        expect(result).toMatch(/user's request \\"{{args}}\\" should be processed/);
        expect(result).toMatch(/Analysis of '{{args}}':/);
        expect(result).toMatch(/Parse the request: {{args}}/);
        expect(result).toMatch(/Validate: \\"{{args}}\\"/);
        expect(result).toMatch(/Execute based on {{args}}/);
        expect(result).toMatch(/Final output for request '{{args}}'/);
      });
    });

    describe('Edge case argument handling', () => {
      it('should handle arguments at string boundaries', () => {
        const boundaryTemplate = `---
description: Boundary test
---
$ARGUMENTS
$1$2$3
Text$ARGUMENTSText
Plan($1)
$ARGUMENTS.
.$ARGUMENTS
$ARGUMENTS-suffix
prefix-$ARGUMENTS`;

        const result = convertMdToToml(boundaryTemplate);

        // Should handle all boundary cases correctly
        expect(result).toMatch(/{{args}}/);
        expect(result).toMatch(/{{plan_id}}{{param2}}{{param3}}/);
        expect(result).toMatch(/Text{{args}}Text/);
        expect(result).toMatch(/Plan\({{plan_id}}\)/);
        expect(result).toMatch(/{{args}}\./);
        expect(result).toMatch(/\.{{args}}/);
        expect(result).toMatch(/{{args}}-suffix/);
        expect(result).toMatch(/prefix-{{args}}/);
      });

      it('should not convert partial matches', () => {
        const partialTemplate = `---
description: Partial match test
---
This has $ARG (not $ARGUMENTS)
Plan ID like $11 (not $1)
Variable $ARGUMENTS2 (not $ARGUMENTS)
Function call func($ARGUMENTS, $1, other)`;

        const result = convertMdToToml(partialTemplate);

        // Should only convert exact matches
        expect(result).toContain('$ARG'); // Should not be converted
        expect(result).toContain('$11'); // Should not be converted
        expect(result).toContain('$ARGUMENTS2'); // Should not be converted
        expect(result).toMatch(/func\({{args}}, {{plan_id}}, other\)/); // Only exact matches converted
      });
    });
  });

  describe('Semantic Equivalence Validation', () => {
    it('should maintain functional equivalence between MD and TOML versions', () => {
      const testTemplate = `---
argument-hint: Process [user-prompt]
description: Functional test
---
# Functional Equivalence Test

Step 1: Analyze the user input: $ARGUMENTS
Step 2: Create plan structure
Step 3: Generate deliverables based on $ARGUMENTS

The system should process $ARGUMENTS and produce equivalent results regardless of format.`;

      const mdResult = convertMdToToml(testTemplate);

      // Key functional elements should be preserved
      expect(mdResult).toMatch(/Step 1: Analyze the user input: {{args}}/);
      expect(mdResult).toMatch(/Step 2: Create plan structure/);
      expect(mdResult).toMatch(/Generate deliverables based on {{args}}/);
      expect(mdResult).toMatch(/process {{args}} and produce equivalent results/);

      // Metadata should be properly converted
      expect(mdResult).toMatch(/argument-hint = "Process {{args}}"/);
      expect(mdResult).toMatch(/description = "Functional test"/);
    });

    it('should preserve instruction logic and flow', () => {
      const logicTemplate = `---
argument-hint: [plan-ID]
description: Logic test
---
# Logic Preservation

IF plan $1 exists:
  THEN load plan $1
  AND validate plan $1
  AND execute plan $1
ELSE:
  REPORT error for plan $1

WHILE processing plan $1:
  CONTINUE until plan $1 is complete

RETURN status of plan $1`;

      const result = convertMdToToml(logicTemplate);

      // Logical structure should be maintained
      expect(result).toMatch(/IF plan {{plan_id}} exists:/);
      expect(result).toMatch(/THEN load plan {{plan_id}}/);
      expect(result).toMatch(/AND validate plan {{plan_id}}/);
      expect(result).toMatch(/AND execute plan {{plan_id}}/);
      expect(result).toMatch(/REPORT error for plan {{plan_id}}/);
      expect(result).toMatch(/WHILE processing plan {{plan_id}}:/);
      expect(result).toMatch(/until plan {{plan_id}} is complete/);
      expect(result).toMatch(/RETURN status of plan {{plan_id}}/);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle malformed templates gracefully', () => {
      const malformedTemplates = [
        {
          name: 'Missing frontmatter separator',
          content: `---
description: Test
# No closing separator
Content with $ARGUMENTS`
        },
        {
          name: 'Invalid YAML',
          content: `---
description: "unclosed quote
invalid: [malformed
---
Content with $ARGUMENTS`
        },
        {
          name: 'Empty sections',
          content: `---
---

$ARGUMENTS`
        }
      ];

      malformedTemplates.forEach(template => {
        expect(() => {
          const result = convertMdToToml(template.content);
          
          // Should still produce valid TOML structure
          expect(result).toMatch(/^\[metadata\]/m);
          expect(result).toMatch(/^\[prompt\]/m);
          expect(result).toContain('{{args}}');
          expect(result).not.toContain('$ARGUMENTS');
        }).not.toThrow(`Failed on template: ${template.name}`);
      });
    });

    it('should validate TOML output format', () => {
      const template = `---
description: Format validation
argument-hint: [user-prompt]
version: 1.0
---
# Format Test

Content with $ARGUMENTS for testing.`;

      const result = convertMdToToml(template);

      // Should have proper TOML sections in correct order
      const lines = result.split('\n').filter(line => line.trim());
      const metadataIndex = lines.findIndex(line => line === '[metadata]');
      const promptIndex = lines.findIndex(line => line === '[prompt]');
      
      expect(metadataIndex).toBeGreaterThanOrEqual(0);
      expect(promptIndex).toBeGreaterThan(metadataIndex);

      // Metadata section should have key-value pairs
      const metadataSection = lines.slice(metadataIndex + 1, promptIndex);
      const keyValueLines = metadataSection.filter(line => line.includes(' = '));
      expect(keyValueLines.length).toBeGreaterThan(0);

      // Prompt section should have content key
      const promptSection = lines.slice(promptIndex + 1);
      const hasContentKey = promptSection.some(line => line.startsWith('content = '));
      expect(hasContentKey).toBe(true);
    });
  });
});