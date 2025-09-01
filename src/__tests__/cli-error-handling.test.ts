import { validateAssistants } from '../utils/assistant-validator';
import { InvalidArgumentError } from 'commander';

describe('CLI Error Handling', () => {
  describe('Assistant Validation', () => {
    test('should reject empty string input', () => {
      const result = validateAssistants('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Assistant input cannot be empty or undefined');
    });

    test('should reject whitespace-only input', () => {
      const result = validateAssistants('   ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Assistant input cannot be empty or contain only whitespace');
    });

    test('should reject comma-only input', () => {
      const result = validateAssistants(',,,');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Assistant input cannot contain only commas');
    });

    test('should reject input with only whitespace and commas', () => {
      const result = validateAssistants(' , , ,  ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'No valid assistant names found in input (only commas and whitespace detected)'
      );
    });

    test('should validate correct single assistant', () => {
      const result = validateAssistants('claude');
      expect(result.valid).toBe(true);
      expect(result.assistants).toEqual(['claude']);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate correct multiple assistants', () => {
      const result = validateAssistants('claude,gemini');
      expect(result.valid).toBe(true);
      expect(result.assistants).toEqual(['claude', 'gemini']);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle assistants with extra whitespace', () => {
      const result = validateAssistants(' claude , gemini ');
      expect(result.valid).toBe(true);
      expect(result.assistants).toEqual(['claude', 'gemini']);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid assistant names', () => {
      const result = validateAssistants('invalid');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid assistant name: invalid');
      expect(result.errors[0]).toContain('Supported assistants: claude, gemini');
    });

    test('should provide suggestions for common misspellings', () => {
      const result = validateAssistants('claud');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Did you mean "claude" instead of "claud"?');
    });

    test('should provide suggestions for gemini misspellings', () => {
      const result = validateAssistants('gemeni');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Did you mean "gemini" instead of "gemeni"?');
    });

    test('should handle mixed valid and invalid assistants', () => {
      const result = validateAssistants('claude,invalid,gemini');
      expect(result.valid).toBe(false);
      expect(result.assistants).toEqual(['claude', 'gemini']);
      expect(result.errors[0]).toContain('Invalid assistant name: invalid');
    });

    test('should remove duplicates', () => {
      const result = validateAssistants('claude,claude,gemini');
      expect(result.valid).toBe(true);
      expect(result.assistants).toEqual(['claude', 'gemini']);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle case insensitive input', () => {
      const result = validateAssistants('CLAUDE,Gemini');
      expect(result.valid).toBe(true);
      expect(result.assistants).toEqual(['claude', 'gemini']);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Commander.js Integration', () => {
    test('should throw InvalidArgumentError for invalid assistants', () => {
      // Simulate the option callback behavior
      const optionCallback = (value: string) => {
        const result = validateAssistants(value);
        if (!result.valid) {
          const errorMsg = result.errors.join(', ');
          throw new InvalidArgumentError(
            `${errorMsg}. Valid options: claude, gemini. Examples: --assistants claude or --assistants claude,gemini`
          );
        }
        return result.assistants;
      };

      expect(() => optionCallback('invalid')).toThrow(InvalidArgumentError);
      expect(() => optionCallback('invalid')).toThrow('Valid options: claude, gemini');
      expect(() => optionCallback('invalid')).toThrow('Examples: --assistants claude');
    });

    test('should return valid assistants for correct input', () => {
      const optionCallback = (value: string) => {
        const result = validateAssistants(value);
        if (!result.valid) {
          const errorMsg = result.errors.join(', ');
          throw new InvalidArgumentError(
            `${errorMsg}. Valid options: claude, gemini. Examples: --assistants claude or --assistants claude,gemini`
          );
        }
        return result.assistants;
      };

      expect(optionCallback('claude')).toEqual(['claude']);
      expect(optionCallback('claude,gemini')).toEqual(['claude', 'gemini']);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null or undefined inputs gracefully', () => {
      // @ts-expect-error Testing runtime behavior
      const result = validateAssistants(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Assistant input cannot be empty or undefined');
    });

    test('should handle non-string inputs', () => {
      // @ts-expect-error Testing runtime behavior
      const result = validateAssistants(123);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Assistant input cannot be empty or undefined');
    });

    test('should handle empty array-like input', () => {
      const result = validateAssistants(' , , ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'No valid assistant names found in input (only commas and whitespace detected)'
      );
    });

    test('should handle single comma', () => {
      const result = validateAssistants(',');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Assistant input cannot contain only commas');
    });

    test('should handle trailing commas', () => {
      const result = validateAssistants('claude,');
      expect(result.valid).toBe(true);
      expect(result.assistants).toEqual(['claude']);
    });

    test('should handle leading commas', () => {
      const result = validateAssistants(',claude');
      expect(result.valid).toBe(true);
      expect(result.assistants).toEqual(['claude']);
    });
  });
});
