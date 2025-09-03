// Jest setup file for CI environment
// This file is only loaded when running in CI (when process.env.CI is set)

// Catch unhandled promise rejections and console errors in CI
if (process.env.CI) {
  // Override console methods to track errors/warnings
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  let hasConsoleErrors = false;
  let hasConsoleWarnings = false;

  console.error = (...args) => {
    hasConsoleErrors = true;
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    hasConsoleWarnings = true;
    originalConsoleWarn.apply(console, args);
  };

  // After each test, check for console errors/warnings
  afterEach(() => {
    if (hasConsoleErrors) {
      throw new Error('Test produced console.error() calls. Please fix these issues.');
    }
    if (hasConsoleWarnings && process.env.FAIL_ON_CONSOLE_WARNINGS === 'true') {
      throw new Error('Test produced console.warn() calls. Please fix these issues.');
    }

    // Reset flags for next test
    hasConsoleErrors = false;
    hasConsoleWarnings = false;
  });

  // Set longer timeout for CI environment
  jest.setTimeout(30000);
}

// Global test utilities can be added here
global.testUtils = {
  // Helper to suppress expected console errors in tests
  suppressConsoleError: (fn) => {
    const originalConsoleError = console.error;
    console.error = jest.fn();
    try {
      return fn();
    } finally {
      console.error = originalConsoleError;
    }
  }
};