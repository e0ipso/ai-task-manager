/**
 * TOML Command Validation Tests
 *
 * Comprehensive test suite to validate that generated TOML command files work correctly
 * with Gemini CLI and handle arguments as expected. Tests the conversion rules from MD templates.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  convertMdToToml,
  readAndProcessTemplate,
  parseFrontmatter,
  escapeTomlString,
  getTemplatePath,
  resolvePath,
} from '../utils';

// Mock fs-extra for file operations
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('TOML Command Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MD to TOML Conversion Rules', () => {
    describe('Argument substitution', () => {
      it('should convert $ARGUMENTS to {{args}}', () => {
        const mdContent = `---
argument-hint: [user-prompt]
description: Test command
---
# Test Command

The user input is:
<user-input>
$ARGUMENTS
</user-input>

Process the $ARGUMENTS carefully.`;

        const result = convertMdToToml(mdContent);

        expect(result).toContain('{{args}}');
        expect(result).not.toContain('$ARGUMENTS');
        expect(result).toMatch(/The user input is:\s*<user-input>\s*{{args}}/);
        expect(result).toMatch(/Process the {{args}} carefully\./);
      });

      it('should convert $1 to {{plan_id}}', () => {
        const mdContent = `---
argument-hint: [plan-ID]
description: Execute plan
---
# Execute Plan

Execute plan with ID $1.
The plan ID is $1 and should be used throughout.`;

        const result = convertMdToToml(mdContent);

        expect(result).toContain('{{plan_id}}');
        expect(result).not.toContain('$1');
        expect(result).toMatch(/Execute plan with ID {{plan_id}}/);
        expect(result).toMatch(/The plan ID is {{plan_id}}/);
      });

      it('should convert $2, $3 to corresponding parameters', () => {
        const mdContent = `---
description: Multi-param command
---
# Multi-Parameter Command

First param: $1
Second param: $2  
Third param: $3`;

        const result = convertMdToToml(mdContent);

        expect(result).toContain('{{plan_id}}');
        expect(result).toContain('{{param2}}');
        expect(result).toContain('{{param3}}');
        expect(result).not.toContain('$1');
        expect(result).not.toContain('$2');
        expect(result).not.toContain('$3');
      });

      it('should handle mixed parameter types in same content', () => {
        const mdContent = `---
argument-hint: [user-prompt] and [plan-ID]
description: Mixed parameters
---
# Mixed Parameters

User provided: $ARGUMENTS
Plan ID: $1
Additional param: $2`;

        const result = convertMdToToml(mdContent);

        expect(result).toContain('{{args}}');
        expect(result).toContain('{{plan_id}}');
        expect(result).toContain('{{param2}}');
        expect(result).not.toContain('$ARGUMENTS');
        expect(result).not.toContain('$1');
        expect(result).not.toContain('$2');
      });
    });

    describe('Frontmatter processing', () => {
      it('should convert argument-hint placeholders', () => {
        const mdContent = `---
argument-hint: [user-prompt]
description: Test command
---
# Test Content`;

        const result = convertMdToToml(mdContent);

        expect(result).toMatch(/argument-hint = "{{args}}"/);
        expect(result).not.toContain('[user-prompt]');
      });

      it('should convert plan-ID placeholder in argument-hint', () => {
        const mdContent = `---
argument-hint: [plan-ID]
description: Plan command
---
# Test Content`;

        const result = convertMdToToml(mdContent);

        expect(result).toMatch(/argument-hint = "{{plan_id}}"/);
        expect(result).not.toContain('[plan-ID]');
      });

      it('should handle mixed placeholders in argument-hint', () => {
        const mdContent = `---
argument-hint: Use [user-prompt] for plan [plan-ID]
description: Mixed hint
---
# Test Content`;

        const result = convertMdToToml(mdContent);

        expect(result).toMatch(/argument-hint = "Use {{args}} for plan {{plan_id}}"/);
        expect(result).not.toContain('[user-prompt]');
        expect(result).not.toContain('[plan-ID]');
      });

      it('should preserve other frontmatter fields unchanged', () => {
        const mdContent = `---
description: Test command
version: 1.0
author: Test Author
custom-field: Custom value
---
# Test Content`;

        const result = convertMdToToml(mdContent);

        expect(result).toMatch(/description = "Test command"/);
        expect(result).toMatch(/version = "1.0"/);
        expect(result).toMatch(/author = "Test Author"/);
        expect(result).toMatch(/custom-field = "Custom value"/);
      });
    });

    describe('TOML structure generation', () => {
      it('should generate proper TOML structure with metadata and prompt sections', () => {
        const mdContent = `---
argument-hint: [user-prompt]
description: Test command
---
# Test Command

This is the prompt content.`;

        const result = convertMdToToml(mdContent);

        expect(result).toMatch(/^\[metadata\]/m);
        expect(result).toMatch(/^\[prompt\]/m);
        expect(result).toMatch(/argument-hint = "{{args}}"/);
        expect(result).toMatch(/description = "Test command"/);
        expect(result).toMatch(/content = """.*This is the prompt content\."""/s);
      });

      it('should handle empty frontmatter', () => {
        const mdContent = `# Test Command

Just prompt content without frontmatter.`;

        const result = convertMdToToml(mdContent);

        expect(result).toMatch(/^\[metadata\]/m);
        expect(result).toMatch(/^\[prompt\]/m);
        expect(result).toMatch(/content = """.*Just prompt content without frontmatter\."""/s);
      });
    });

    describe('String escaping', () => {
      it('should properly escape special characters in TOML strings', () => {
        const testCases = [
          { input: 'Simple string', expected: 'Simple string' },
          { input: 'String with "quotes"', expected: 'String with \\"quotes\\"' },
          { input: 'String\\with\\backslashes', expected: 'String\\\\with\\\\backslashes' },
          { input: 'Line\nbreak', expected: 'Line\\nbreak' },
          { input: 'Tab\there', expected: 'Tab\\there' },
          { input: 'Carriage\rreturn', expected: 'Carriage\\rreturn' },
        ];

        testCases.forEach(({ input, expected }) => {
          expect(escapeTomlString(input)).toBe(expected);
        });
      });

      it('should escape complex content properly', () => {
        const mdContent = `---
description: Command with "quotes" and \backslashes
---
# Test

Content with "quotes" and line breaks:
- Item 1
- Item 2

And some \\ backslashes.`;

        const result = convertMdToToml(mdContent);

        // Should not throw and should contain escaped content
        expect(result).toContain('\\"quotes\\"');
        expect(result).toContain('\\\\');
        expect(result).not.toContain('Content with "quotes" and line breaks:');
      });
    });
  });

  describe('Template Processing Integration', () => {
    describe('create-plan template', () => {
      beforeEach(() => {
        // Mock the create-plan.md template content
        const createPlanTemplate = `---
argument-hint: [user-prompt]
description: Create a comprehensive plan to accomplish the request from the user.
---
# Comprehensive Plan Creation

You are a comprehensive task planning assistant.

## Instructions

The user input is:

<user-input>
$ARGUMENTS
</user-input>

Create a plan based on the user's request.`;

        mockFs.readFile.mockResolvedValue(createPlanTemplate);
      });

      it('should process create-plan template for TOML format', async () => {
        const result = await readAndProcessTemplate('/mock/path/create-plan.md', 'toml');

        expect(result).toMatch(/^\[metadata\]/m);
        expect(result).toMatch(/argument-hint = "{{args}}"/);
        expect(result).toMatch(/description = ".*Create a comprehensive plan.*"/);
        expect(result).toMatch(/^\[prompt\]/m);
        expect(result).toMatch(/content = """.*You are a comprehensive task planning assistant.*"""/s);
        expect(result).toContain('{{args}}');
        expect(result).not.toContain('$ARGUMENTS');
      });

      it('should preserve MD format when requested', async () => {
        const result = await readAndProcessTemplate('/mock/path/create-plan.md', 'md');

        expect(result).toContain('$ARGUMENTS');
        expect(result).toContain('[user-prompt]');
        expect(result).not.toContain('{{args}}');
        expect(result).not.toMatch(/^\[metadata\]/m);
      });
    });

    describe('generate-tasks template', () => {
      beforeEach(() => {
        const generateTasksTemplate = `---
argument-hint: [plan-ID]
description: Generate tasks to implement the plan with the provided ID.
---
# Comprehensive Task List Creation

You will analyze the provided plan document.

### Input
- A plan document. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1
- The plan contains high-level objectives

Use plan ID $1 throughout the process.`;

        mockFs.readFile.mockResolvedValue(generateTasksTemplate);
      });

      it('should process generate-tasks template for TOML format', async () => {
        const result = await readAndProcessTemplate('/mock/path/generate-tasks.md', 'toml');

        expect(result).toMatch(/^\[metadata\]/m);
        expect(result).toMatch(/argument-hint = "{{plan_id}}"/);
        expect(result).toMatch(/description = ".*Generate tasks to implement.*"/);
        expect(result).toMatch(/^\[prompt\]/m);
        expect(result).toContain('{{plan_id}}');
        expect(result).not.toContain('$1');
        expect(result).not.toContain('[plan-ID]');
      });
    });

    describe('execute-blueprint template', () => {
      beforeEach(() => {
        const executeBlueprintTemplate = `---
argument-hint: [plan-ID]
description: Execute the task in the plan
---
# Task Execution

You are the orchestrator responsible for executing tasks.

## Input Requirements
- A plan document with execution blueprint. See @.ai/task-manager/TASK_MANAGER_INFO.md fo find the plan with ID $1

Execute plan $1 systematically.`;

        mockFs.readFile.mockResolvedValue(executeBlueprintTemplate);
      });

      it('should process execute-blueprint template for TOML format', async () => {
        const result = await readAndProcessTemplate('/mock/path/execute-blueprint.md', 'toml');

        expect(result).toMatch(/^\[metadata\]/m);
        expect(result).toMatch(/argument-hint = "{{plan_id}}"/);
        expect(result).toMatch(/description = ".*Execute the task in the plan.*"/);
        expect(result).toMatch(/^\[prompt\]/m);
        expect(result).toContain('{{plan_id}}');
        expect(result).not.toContain('$1');
        expect(result).not.toContain('[plan-ID]');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle templates with no frontmatter', () => {
      const mdContent = `# Simple Template

No frontmatter here.
Just content with $ARGUMENTS.`;

      const result = convertMdToToml(mdContent);

      expect(result).toMatch(/^\[metadata\]/m);
      expect(result).toMatch(/^\[prompt\]/m);
      expect(result).toContain('{{args}}');
      expect(result).not.toContain('$ARGUMENTS');
    });

    it('should handle empty template content', () => {
      const mdContent = '';

      const result = convertMdToToml(mdContent);

      expect(result).toMatch(/^\[metadata\]/m);
      expect(result).toMatch(/^\[prompt\]/m);
      expect(result).toMatch(/content = """.*"""/s);
    });

    it('should handle templates with only frontmatter', () => {
      const mdContent = `---
description: Only frontmatter
argument-hint: [user-prompt]
---`;

      const result = convertMdToToml(mdContent);

      expect(result).toMatch(/^\[metadata\]/m);
      expect(result).toMatch(/description = "Only frontmatter"/);
      expect(result).toMatch(/argument-hint = "{{args}}"/);
      expect(result).toMatch(/^\[prompt\]/m);
      expect(result).toMatch(/content = """.*"""/s);
    });

    it('should handle malformed frontmatter gracefully', () => {
      const mdContent = `---
invalid-yaml: 
  - this won't parse properly
  missing-quote: "unclosed
---
# Content

Template with malformed YAML frontmatter.`;

      // Should not throw, should parse what it can
      expect(() => convertMdToToml(mdContent)).not.toThrow();

      const result = convertMdToToml(mdContent);
      expect(result).toMatch(/^\[metadata\]/m);
      expect(result).toMatch(/^\[prompt\]/m);
    });

    it('should handle templates with multiple parameter occurrences', () => {
      const mdContent = `---
argument-hint: [user-prompt]
---
# Multiple Parameters

First: $ARGUMENTS
Second: $ARGUMENTS  
Third: $1
Fourth: $1
Mixed: Use $ARGUMENTS for plan $1`;

      const result = convertMdToToml(mdContent);

      expect(result).not.toContain('$ARGUMENTS');
      expect(result).not.toContain('$1');
      
      const argsCount = (result.match(/{{args}}/g) || []).length;
      const planIdCount = (result.match(/{{plan_id}}/g) || []).length;
      
      expect(argsCount).toBe(4); // 3 direct + 1 in argument-hint
      expect(planIdCount).toBe(3); // 2 direct + 1 in argument-hint
    });
  });

  describe('Semantic Equivalence Validation', () => {
    it('should maintain semantic meaning when converting arguments', () => {
      const mdContent = `---
argument-hint: [user-prompt]
description: Process user input
---
# User Input Processor

The user provided the following input:
$ARGUMENTS

Please process this input carefully and respond appropriately.`;

      const result = convertMdToToml(mdContent);

      // Key semantic elements should be preserved
      expect(result).toMatch(/argument-hint = "{{args}}"/);
      expect(result).toMatch(/user provided the following input:.*{{args}}/s);
      expect(result).toMatch(/process this input carefully/);
      
      // Structure should be maintained
      expect(result).toMatch(/^\[metadata\]/m);
      expect(result).toMatch(/^\[prompt\]/m);
      expect(result).toMatch(/content = """.*User Input Processor.*"""/s);
    });

    it('should preserve instruction flow and context', () => {
      const mdContent = `---
argument-hint: [plan-ID]
description: Execute specific plan
---
# Plan Execution

Execute the plan with ID $1.

Steps:
1. Load plan $1
2. Validate plan $1
3. Execute plan $1

The plan ID ($1) should be used throughout.`;

      const result = convertMdToToml(mdContent);

      // All plan ID references should be converted consistently
      expect(result).not.toContain('$1');
      const planIdCount = (result.match(/{{plan_id}}/g) || []).length;
      expect(planIdCount).toBe(5); // 4 in content + 1 in argument-hint

      // Instruction structure should be preserved
      expect(result).toMatch(/Load plan {{plan_id}}/);
      expect(result).toMatch(/Validate plan {{plan_id}}/);
      expect(result).toMatch(/Execute plan {{plan_id}}/);
      expect(result).toMatch(/plan ID \({{plan_id}}\) should be used/);
    });
  });

  describe('TOML Format Compliance', () => {
    it('should generate valid TOML structure', () => {
      const mdContent = `---
description: Test command
version: 1.0
---
# Test

Content here.`;

      const result = convertMdToToml(mdContent);

      // Should have proper TOML sections
      const lines = result.split('\n');
      const metadataLine = lines.findIndex(line => line === '[metadata]');
      const promptLine = lines.findIndex(line => line === '[prompt]');

      expect(metadataLine).toBeGreaterThanOrEqual(0);
      expect(promptLine).toBeGreaterThan(metadataLine);

      // Should have key-value pairs in metadata section
      const metadataSection = lines.slice(metadataLine + 1, promptLine);
      expect(metadataSection.some(line => line.includes('description = '))).toBe(true);
      expect(metadataSection.some(line => line.includes('version = '))).toBe(true);
    });

    it('should properly format multi-line content', () => {
      const mdContent = `---
description: Multi-line test
---
# Multi-line Content

This content spans
multiple lines with
various formatting.

- List item 1
- List item 2

## Section

More content here.`;

      const result = convertMdToToml(mdContent);

      // Should use triple quotes for multi-line content
      expect(result).toMatch(/content = """.*"""/s);
      expect(result).toMatch(/This content spans.*multiple lines/s);
      expect(result).toMatch(/List item 1.*List item 2/s);
    });
  });
});