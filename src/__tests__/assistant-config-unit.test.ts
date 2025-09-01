/**
 * Unit tests for assistant configuration functionality
 */

import { createAssistantConfig, validateAssistantConfig } from '../types/assistant-config';
import * as path from 'path';

describe('Assistant Configuration', () => {
  const tempDir = '/tmp/test-project';

  describe('createAssistantConfig', () => {
    it('should create configuration for single assistant', () => {
      const config = createAssistantConfig(['claude'], tempDir);

      expect(config.assistants).toEqual(['claude']);
      expect(config.directories).toHaveProperty('claude');
      expect(config.directories.claude).toBe(path.join(tempDir, '.ai', 'claude'));
      expect(config.installationTargets).toHaveLength(1);
      expect(config.installationTargets[0]?.assistant).toBe('claude');
    });

    it('should create configuration for multiple assistants', () => {
      const config = createAssistantConfig(['claude', 'gemini'], tempDir);

      expect(config.assistants).toEqual(['claude', 'gemini']);
      expect(config.directories).toHaveProperty('claude');
      expect(config.directories).toHaveProperty('gemini');
      expect(config.directories.claude).toBe(path.join(tempDir, '.ai', 'claude'));
      expect(config.directories.gemini).toBe(path.join(tempDir, '.ai', 'gemini'));
      expect(config.installationTargets).toHaveLength(2);
    });

    it('should remove duplicates while preserving order', () => {
      const config = createAssistantConfig(['claude', 'gemini', 'claude'], tempDir);

      expect(config.assistants).toEqual(['claude', 'gemini']);
      expect(config.installationTargets).toHaveLength(2);
    });

    it('should throw error for empty assistants list', () => {
      expect(() => createAssistantConfig([], tempDir)).toThrow(
        'At least one assistant must be specified'
      );
    });
  });

  describe('validateAssistantConfig', () => {
    it('should validate correct configuration', () => {
      const config = createAssistantConfig(['claude'], tempDir);
      const result = validateAssistantConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing directories', () => {
      const config = createAssistantConfig(['claude'], tempDir);
      // @ts-ignore - Intentionally break the config for testing
      delete config.directories.claude;

      const result = validateAssistantConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing directory mapping for assistant: claude');
    });

    it('should detect missing installation targets', () => {
      const config = createAssistantConfig(['claude', 'gemini'], tempDir);
      config.installationTargets = config.installationTargets.filter(t => t.assistant !== 'gemini');

      const result = validateAssistantConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing installation target for assistant: gemini');
    });
  });
});
