import { validateAssistants, SupportedAssistant } from '../assistant-validator';

describe('Assistant Validation', () => {
  describe('validateAssistants', () => {
    describe('Valid inputs', () => {
      it('should accept valid single assistant - claude', () => {
        const result = validateAssistants('claude');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude'],
          errors: []
        });
      });

      it('should accept valid single assistant - gemini', () => {
        const result = validateAssistants('gemini');
        expect(result).toEqual({
          valid: true,
          assistants: ['gemini'],
          errors: []
        });
      });

      it('should accept valid multiple assistants', () => {
        const result = validateAssistants('claude,gemini');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });

      it('should accept valid multiple assistants with spaces', () => {
        const result = validateAssistants('claude, gemini');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });

      it('should accept valid multiple assistants with extra spaces', () => {
        const result = validateAssistants('  claude  ,  gemini  ');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });
    });

    describe('Case insensitivity', () => {
      it('should handle uppercase assistant names', () => {
        const result = validateAssistants('CLAUDE');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude'],
          errors: []
        });
      });

      it('should handle mixed case assistant names', () => {
        const result = validateAssistants('Claude');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude'],
          errors: []
        });
      });

      it('should handle mixed case multiple assistants', () => {
        const result = validateAssistants('CLAUDE,Gemini');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });

      it('should handle various case combinations', () => {
        const result = validateAssistants('ClAuDe,GEMINI');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });
    });

    describe('Invalid inputs', () => {
      it('should reject unknown single assistant', () => {
        const result = validateAssistants('gpt');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant name: gpt. Supported assistants: claude, gemini');
      });

      it('should reject multiple unknown assistants', () => {
        const result = validateAssistants('gpt,invalid');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant names: gpt, invalid. Supported assistants: claude, gemini');
      });

      it('should reject mixed valid and invalid assistants', () => {
        const result = validateAssistants('claude,gpt');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual(['claude']);
        expect(result.errors).toContain('Invalid assistant name: gpt. Supported assistants: claude, gemini');
      });

      it('should reject multiple mixed valid and invalid assistants', () => {
        const result = validateAssistants('claude,gpt,gemini,invalid');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual(['claude', 'gemini']);
        expect(result.errors).toContain('Invalid assistant names: gpt, invalid. Supported assistants: claude, gemini');
      });
    });

    describe('Empty input handling', () => {
      it('should reject empty string', () => {
        const result = validateAssistants('');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot be empty or undefined');
      });

      it('should reject whitespace-only string', () => {
        const result = validateAssistants('   ');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot be empty or contain only whitespace');
      });

      it('should reject tabs and newlines', () => {
        const result = validateAssistants('\t\n  ');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot be empty or contain only whitespace');
      });

      it('should handle undefined input', () => {
        const result = validateAssistants(undefined as any);
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot be empty or undefined');
      });

      it('should handle null input', () => {
        const result = validateAssistants(null as any);
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot be empty or undefined');
      });

      it('should handle non-string input', () => {
        const result = validateAssistants(123 as any);
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot be empty or undefined');
      });
    });

    describe('Whitespace and edge cases', () => {
      it('should handle commas with only whitespace between', () => {
        const result = validateAssistants('claude,  ,gemini');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });

      it('should handle multiple consecutive commas', () => {
        const result = validateAssistants('claude,,gemini');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });

      it('should handle leading and trailing commas', () => {
        const result = validateAssistants(',claude,gemini,');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude', 'gemini'],
          errors: []
        });
      });

      it('should handle string with only commas and whitespace', () => {
        const result = validateAssistants(',  ,  ,');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('No valid assistant names found in input (only commas and whitespace detected)');
      });

      it('should handle single comma', () => {
        const result = validateAssistants(',');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot contain only commas');
      });

      it('should handle tabs as separators (not supported)', () => {
        const result = validateAssistants('claude\tgemini');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant name: claude	gemini. Supported assistants: claude, gemini');
      });
    });

    describe('Duplicate handling', () => {
      it('should remove duplicate assistants', () => {
        const result = validateAssistants('claude,claude');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude'],
          errors: []
        });
      });

      it('should remove duplicate assistants with different cases', () => {
        const result = validateAssistants('claude,CLAUDE');
        expect(result).toEqual({
          valid: true,
          assistants: ['claude'],
          errors: []
        });
      });

      it('should remove duplicates while preserving order', () => {
        const result = validateAssistants('gemini,claude,gemini,claude');
        expect(result).toEqual({
          valid: true,
          assistants: ['gemini', 'claude'],
          errors: []
        });
      });

      it('should remove duplicates with mixed valid and invalid', () => {
        const result = validateAssistants('claude,gpt,claude,gpt');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual(['claude']);
        expect(result.errors).toContain('Invalid assistant name: gpt. Supported assistants: claude, gemini');
      });
    });

    describe('Special characters and edge cases', () => {
      it('should reject assistant names with special characters', () => {
        const result = validateAssistants('claude!,gemini@');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant names: claude!, gemini@. Supported assistants: claude, gemini');
      });

      it('should reject assistant names with numbers', () => {
        const result = validateAssistants('claude3,gemini2');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant names: claude3, gemini2. Supported assistants: claude, gemini');
      });

      it('should reject assistant names with underscores', () => {
        const result = validateAssistants('claude_ai,gemini_pro');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant names: claude_ai, gemini_pro. Supported assistants: claude, gemini');
      });

      it('should handle very long invalid names', () => {
        const longName = 'a'.repeat(1000);
        const result = validateAssistants(longName);
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Invalid assistant name');
        expect(result.errors[0]).toContain('Supported assistants: claude, gemini');
      });

      it('should handle Unicode characters', () => {
        const result = validateAssistants('claude™,gemini®');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant names: claude™, gemini®. Supported assistants: claude, gemini');
      });
    });

    describe('Smart suggestions for common misspellings', () => {
      it('should suggest "claude" for common misspellings', () => {
        const result = validateAssistants('claud');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Did you mean "claude" instead of "claud"?');
      });

      it('should suggest "claude" for "claude-ai"', () => {
        const result = validateAssistants('claude-ai');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Did you mean "claude" instead of "claude-ai"?');
      });

      it('should suggest "claude" for "anthropic"', () => {
        const result = validateAssistants('anthropic');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Did you mean "claude" instead of "anthropic"?');
      });

      it('should suggest "gemini" for "bard"', () => {
        const result = validateAssistants('bard');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Did you mean "gemini" instead of "bard"?');
      });

      it('should suggest "gemini" for "gemeni"', () => {
        const result = validateAssistants('gemeni');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Did you mean "gemini" instead of "gemeni"?');
      });

      it('should suggest "gemini" for "google"', () => {
        const result = validateAssistants('google');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Did you mean "gemini" instead of "google"?');
      });

      it('should provide multiple suggestions for multiple misspellings', () => {
        const result = validateAssistants('claud,bard');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Did you mean "claude" instead of "claud"?');
        expect(result.errors[0]).toContain('Did you mean "gemini" instead of "bard"?');
      });

      it('should not provide suggestions for completely unrelated names', () => {
        const result = validateAssistants('random');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).not.toContain('Did you mean');
      });
    });

    describe('Error message structure', () => {
      it('should use singular form for single invalid assistant', () => {
        const result = validateAssistants('invalid');
        expect(result.errors[0]).toMatch(/^Invalid assistant name: invalid\. Supported assistants:/);
      });

      it('should use plural form for multiple invalid assistants', () => {
        const result = validateAssistants('invalid1,invalid2');
        expect(result.errors[0]).toMatch(/^Invalid assistant names: invalid1, invalid2\. Supported assistants:/);
      });

      it('should always include supported assistants list in error', () => {
        const result = validateAssistants('invalid');
        expect(result.errors[0]).toContain('Supported assistants: claude, gemini');
      });

      it('should only have one error for multiple invalid assistants', () => {
        const result = validateAssistants('invalid1,invalid2,invalid3');
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('invalid1, invalid2, invalid3');
      });
    });

    describe('Performance tests', () => {
      it('should handle large input strings efficiently', () => {
        const largeInput = Array(1000).fill('claude,gemini').join(',');
        const start = performance.now();
        const result = validateAssistants(largeInput);
        const end = performance.now();
        
        expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
        expect(result.valid).toBe(true);
        expect(result.assistants).toEqual(['claude', 'gemini']);
      });

      it('should handle many duplicates efficiently', () => {
        const manyDuplicates = Array(1000).fill('claude').concat(Array(1000).fill('gemini')).join(',');
        const start = performance.now();
        const result = validateAssistants(manyDuplicates);
        const end = performance.now();
        
        expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
        expect(result.valid).toBe(true);
        expect(result.assistants).toEqual(['claude', 'gemini']);
      });

      it('should handle large invalid input efficiently', () => {
        const largeInvalidInput = Array(1000).fill('invalid').join(',');
        const start = performance.now();
        const result = validateAssistants(largeInvalidInput);
        const end = performance.now();
        
        expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toHaveLength(1);
      });
    });

    describe('Type safety and return structure', () => {
      it('should return proper AssistantValidationResult structure', () => {
        const result = validateAssistants('claude');
        
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('assistants');
        expect(result).toHaveProperty('errors');
        expect(typeof result.valid).toBe('boolean');
        expect(Array.isArray(result.assistants)).toBe(true);
        expect(Array.isArray(result.errors)).toBe(true);
      });

      it('should return SupportedAssistant types in assistants array', () => {
        const result = validateAssistants('claude,gemini');
        
        result.assistants.forEach(assistant => {
          expect(['claude', 'gemini']).toContain(assistant);
        });
      });

      it('should return strings in errors array', () => {
        const result = validateAssistants('invalid');
        
        result.errors.forEach(error => {
          expect(typeof error).toBe('string');
        });
      });

      it('should have consistent valid flag with errors and assistants', () => {
        // Valid case
        const validResult = validateAssistants('claude');
        expect(validResult.valid).toBe(true);
        expect(validResult.errors).toHaveLength(0);
        expect(validResult.assistants.length).toBeGreaterThan(0);

        // Invalid case
        const invalidResult = validateAssistants('invalid');
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors.length).toBeGreaterThan(0);
        expect(invalidResult.assistants).toHaveLength(0);

        // Mixed case
        const mixedResult = validateAssistants('claude,invalid');
        expect(mixedResult.valid).toBe(false);
        expect(mixedResult.errors.length).toBeGreaterThan(0);
        expect(mixedResult.assistants.length).toBeGreaterThan(0);
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('should handle empty array-like input', () => {
        const result = validateAssistants('');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Assistant input cannot be empty or undefined');
      });

      it('should handle single character input', () => {
        const result = validateAssistants('c');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors).toContain('Invalid assistant name: c. Supported assistants: claude, gemini');
      });

      it('should handle input with only punctuation', () => {
        const result = validateAssistants('!@#$%^&*()');
        expect(result.valid).toBe(false);
        expect(result.assistants).toEqual([]);
        expect(result.errors[0]).toContain('Invalid assistant name: !@#$%^&*(). Supported assistants: claude, gemini');
      });

      it('should be case-insensitive for exact matches only', () => {
        // Should not match partial strings
        const result = validateAssistants('claud'); // Missing 'e'
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid assistant name: claud. Supported assistants: claude, gemini');
      });
    });

    describe('Functional requirements compliance', () => {
      it('should support exactly the required assistants', () => {
        // Test that only claude and gemini are supported
        const supportedAssistants = ['claude', 'gemini'];
        
        supportedAssistants.forEach(assistant => {
          const result = validateAssistants(assistant);
          expect(result.valid).toBe(true);
          expect(result.assistants).toContain(assistant as SupportedAssistant);
        });

        // Test that other common assistants are not supported
        const unsupportedAssistants = ['gpt', 'chatgpt', 'bard', 'copilot', 'assistant'];
        
        unsupportedAssistants.forEach(assistant => {
          const result = validateAssistants(assistant);
          expect(result.valid).toBe(false);
          expect(result.assistants).not.toContain(assistant as any);
        });
      });

      it('should maintain immutability of input processing', () => {
        const input = 'CLAUDE,gemini';
        const result1 = validateAssistants(input);
        const result2 = validateAssistants(input);
        
        expect(result1).toEqual(result2);
        expect(result1).not.toBe(result2); // Different objects
        expect(result1.assistants).not.toBe(result2.assistants); // Different arrays
      });
    });
  });
});