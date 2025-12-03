/**
 * Minimal Utils Tests - Critical Business Logic Only
 *
 * Tests only functions with actual business logic that could fail silently
 * or cause data corruption. Skips simple wrappers and obvious functionality.
 */

import {
  parseAssistants,
  validateAssistants,
  convertMdToToml,
  parseFrontmatter,
  escapeTomlString,
  getTemplateFormat,
} from '../utils';
import { Assistant } from '../types';

describe('Critical Utils Business Logic', () => {
  describe('parseAssistants', () => {
    it('should parse and normalize single assistant', () => {
      expect(parseAssistants('claude')).toEqual(['claude']);
      expect(parseAssistants(' CLAUDE ')).toEqual(['claude']);
    });

    it('should parse multiple assistants with normalization', () => {
      expect(parseAssistants('claude,gemini')).toEqual(['claude', 'gemini']);
      expect(parseAssistants(' Claude , GEMINI ')).toEqual(['claude', 'gemini']);
      expect(parseAssistants('claude,gemini,opencode')).toEqual(['claude', 'gemini', 'opencode']);
      expect(parseAssistants(' OPENCODE ')).toEqual(['opencode']);
    });

    it('should remove duplicates and empty entries', () => {
      expect(parseAssistants('claude,claude,gemini')).toEqual(['claude', 'gemini']);
      expect(parseAssistants('claude,,gemini,')).toEqual(['claude', 'gemini']);
    });

    it('should reject empty input', () => {
      expect(() => parseAssistants('')).toThrow('Assistants parameter cannot be empty');
      expect(() => parseAssistants('   ')).toThrow('Assistants parameter cannot be empty');
    });

    it('should reject invalid assistants', () => {
      expect(() => parseAssistants('invalid')).toThrow(
        'Invalid assistant(s): invalid. Valid options are: claude, codex, cursor, gemini, github, opencode'
      );
      expect(() => parseAssistants('claude,invalid,unknown')).toThrow(
        'Invalid assistant(s): invalid, unknown. Valid options are: claude, codex, cursor, gemini, github, opencode'
      );
    });
  });

  describe('validateAssistants', () => {
    it('should accept valid assistants', () => {
      expect(() => validateAssistants(['claude'])).not.toThrow();
      expect(() => validateAssistants(['claude', 'gemini'])).not.toThrow();
      expect(() => validateAssistants(['opencode'])).not.toThrow();
      expect(() => validateAssistants(['claude', 'gemini', 'opencode'])).not.toThrow();
    });

    it('should reject empty array', () => {
      expect(() => validateAssistants([])).toThrow('At least one assistant must be specified');
    });

    it('should reject invalid assistants', () => {
      expect(() => validateAssistants(['invalid' as Assistant])).toThrow(
        'Invalid assistant: invalid. Supported assistants: claude, codex, cursor, gemini, github, opencode'
      );
    });
  });

  describe('escapeTomlString', () => {
    it('should escape backslashes', () => {
      expect(escapeTomlString('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should escape double quotes', () => {
      expect(escapeTomlString('say "hello"')).toBe('say \\"hello\\"');
    });

    it('should escape control characters', () => {
      expect(escapeTomlString('line1\nline2\r\tindented')).toBe('line1\\nline2\\r\\tindented');
    });

    it('should handle complex mixed escaping', () => {
      const input = 'path\\file\n"quoted"\tvalue';
      const expected = 'path\\\\file\\n\\"quoted\\"\\tvalue';
      expect(escapeTomlString(input)).toBe(expected);
    });
  });

  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
title: Test
description: A test file
---
Body content here`;

      const result = parseFrontmatter(content);
      expect(result.frontmatter).toEqual({
        title: 'Test',
        description: 'A test file',
      });
      expect(result.body).toBe('Body content here');
    });

    it('should handle quoted values', () => {
      const content = `---
title: "Quoted Title"
description: 'Single quoted'
---
Body`;

      const result = parseFrontmatter(content);
      expect(result.frontmatter).toEqual({
        title: 'Quoted Title',
        description: 'Single quoted',
      });
    });

    it('should handle content without frontmatter', () => {
      const content = 'Just body content';
      const result = parseFrontmatter(content);
      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe('Just body content');
    });

    it('should handle frontmatter without body', () => {
      const content = `---
title: Test
---`;

      const result = parseFrontmatter(content);
      expect(result.frontmatter).toEqual({ title: 'Test' });
      expect(result.body).toBe('');
    });

    it('should ignore comments and empty lines', () => {
      const content = `---
# This is a comment
title: Test

description: With empty line above
# Another comment
---
Body`;

      const result = parseFrontmatter(content);
      expect(result.frontmatter).toEqual({
        title: 'Test',
        description: 'With empty line above',
      });
    });

    it('should handle malformed YAML gracefully', () => {
      const content = `---
title Test without colon
valid: value
invalid-line-no-colon
---
Body`;

      const result = parseFrontmatter(content);
      expect(result.frontmatter).toEqual({ valid: 'value' });
      expect(result.body).toBe('Body');
    });
  });

  describe('convertMdToToml', () => {
    it('should convert basic markdown with frontmatter', () => {
      const md = `---
title: Test Command
description: A test command
---
This is the command content.`;

      const result = convertMdToToml(md);
      expect(result).toContain('[metadata]');
      expect(result).toContain('title = "Test Command"');
      expect(result).toContain('description = "A test command"');
      expect(result).toContain('[prompt]');
      expect(result).toContain('content = """This is the command content."""');
    });

    it('should transform variable placeholders correctly', () => {
      const md = `---
title: Test
---
Use $ARGUMENTS for input and plan $1 for ID.
Also $2 and $3 parameters.
But $10 should not be transformed.`;

      const result = convertMdToToml(md);
      expect(result).toContain('Use {{args}} for input and plan {{plan_id}} for ID.');
      expect(result).toContain('Also {{param2}} and {{param3}} parameters.');
      expect(result).toContain('But $10 should not be transformed.');
    });

    it('should handle argument-hint field specially', () => {
      const md = `---
title: Test
argument-hint: "[planId] [userPrompt]"
---
Content`;

      const result = convertMdToToml(md);
      expect(result).toContain('argument-hint = "{{plan_id}} {{args}}"');
    });

    it('should escape special characters in TOML', () => {
      const md = `---
title: Title with "quotes" and \\backslashes
---
Content with "quotes" and \\ backslashes
Newlines\nand\ttabs.`;

      const result = convertMdToToml(md);
      expect(result).toContain('title = "Title with \\"quotes\\" and \\\\backslashes"');
      expect(result).toContain(
        'Content with \\"quotes\\" and \\\\ backslashes\\nNewlines\\nand\\ttabs.'
      );
    });

    it('should handle content without frontmatter', () => {
      const md = 'Just content without frontmatter.';
      const result = convertMdToToml(md);

      expect(result).toContain('[metadata]');
      expect(result).toContain('[prompt]');
      expect(result).toContain('content = """Just content without frontmatter."""');
    });

    it('should preserve exact variable replacement boundaries', () => {
      const md = `---
title: Test
---
$ARGUMENTS but not $ARGUMENTS123
$1 but not $12
Variables: $ARGUMENTS, $1, $2, $3`;

      const result = convertMdToToml(md);
      expect(result).toContain('{{args}} but not $ARGUMENTS123');
      expect(result).toContain('{{plan_id}} but not $12');
      expect(result).toContain('Variables: {{args}}, {{plan_id}}, {{param2}}, {{param3}}');
    });
  });

  describe('getTemplateFormat', () => {
    it('should return correct template format for each assistant', () => {
      expect(getTemplateFormat('claude')).toBe('md');
      expect(getTemplateFormat('gemini')).toBe('toml');
      expect(getTemplateFormat('opencode')).toBe('md');
    });

    it('should map opencode to markdown format like claude', () => {
      const claudeFormat = getTemplateFormat('claude');
      const opencodeFormat = getTemplateFormat('opencode');
      expect(opencodeFormat).toBe(claudeFormat);
      expect(opencodeFormat).toBe('md');
    });
  });
});
