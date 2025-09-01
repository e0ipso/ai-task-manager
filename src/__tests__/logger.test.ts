/**
 * Simplified Unit Tests for logger.ts
 * 
 * Focus on testing the core logging functionality without complex mocking
 */

import * as logger from '../logger';

// Mock console
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

describe('logger.ts (simplified)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    logger.setDebugMode(false);
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('debug mode', () => {
    it('should set debug mode to true', () => {
      logger.setDebugMode(true);
      expect(logger.isDebugMode).toBe(true);
    });

    it('should set debug mode to false', () => {
      logger.setDebugMode(false);
      expect(logger.isDebugMode).toBe(false);
    });
  });

  describe('async logging methods', () => {
    it('should call console.log for info messages', async () => {
      await logger.info('Test info message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('ℹ Test info message');
    });

    it('should call console.log for success messages', async () => {
      await logger.success('Test success message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('✓ Test success message');
    });

    it('should call console.error for error messages', async () => {
      await logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.error.mock.calls[0]?.[0];
      expect(callArg).toContain('✗ Test error message');
    });

    it('should call console.log for warning messages', async () => {
      await logger.warning('Test warning message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('⚠ Test warning message');
    });

    it('should log debug message when debug mode is enabled', async () => {
      logger.setDebugMode(true);
      await logger.debug('Test debug message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('🐛 DEBUG: Test debug message');
    });

    it('should not log debug message when debug mode is disabled', async () => {
      logger.setDebugMode(false);
      await logger.debug('Test debug message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('sync logging methods', () => {
    it('should call console.log for sync info messages', () => {
      logger.sync.info('Test sync info message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('ℹ Test sync info message');
    });

    it('should call console.log for sync success messages', () => {
      logger.sync.success('Test sync success message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('✓ Test sync success message');
    });

    it('should call console.error for sync error messages', () => {
      logger.sync.error('Test sync error message');
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.error.mock.calls[0]?.[0];
      expect(callArg).toContain('✗ Test sync error message');
    });

    it('should call console.log for sync warning messages', () => {
      logger.sync.warning('Test sync warning message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('⚠ Test sync warning message');
    });

    it('should log sync debug message when debug mode is enabled', () => {
      logger.setDebugMode(true);
      logger.sync.debug('Test sync debug message');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('🐛 DEBUG: Test sync debug message');
    });

    it('should not log sync debug message when debug mode is disabled', () => {
      logger.setDebugMode(false);
      logger.sync.debug('Test sync debug message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('initLogger', () => {
    it('should initialize logger without errors', async () => {
      await expect(logger.initLogger()).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty messages', async () => {
      await logger.info('');
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain('ℹ ');
    });

    it('should handle messages with special characters', async () => {
      const specialMessage = 'Test with special chars: !@#$%^&*()[]{}|;:,.<>?';
      await logger.info(specialMessage);
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain(`ℹ ${specialMessage}`);
    });

    it('should handle unicode characters', async () => {
      const unicodeMessage = 'Test with unicode: 🚀 ✨ 🎉 中文 العربية';
      await logger.info(unicodeMessage);
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0];
      expect(callArg).toContain(`ℹ ${unicodeMessage}`);
    });
  });

  describe('debug mode state persistence', () => {
    it('should maintain debug state across multiple calls', async () => {
      logger.setDebugMode(true);
      
      await logger.debug('Debug 1');
      await logger.debug('Debug 2');
      
      expect(consoleSpy.log).toHaveBeenCalledTimes(2);
      expect(logger.isDebugMode).toBe(true);
      
      logger.setDebugMode(false);
      
      await logger.debug('Debug 3');
      
      expect(consoleSpy.log).toHaveBeenCalledTimes(2); // Should not have logged the third debug message
      expect(logger.isDebugMode).toBe(false);
    });
  });
});