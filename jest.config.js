
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\.ts$': 'ts-jest',
    // Transform all JS files, including those in node_modules
    '^.+\.js$': 'babel-jest',
  },
  // Remove transformIgnorePatterns to ensure all node_modules are transformed
  // transformIgnorePatterns: [], // This would transform everything, which is slow.
  // Let's try to be more specific if this works.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  // Enhanced reporting for CI
  verbose: true,
  testResultsProcessor: undefined,
  // Fail tests on console errors/warnings in CI
  setupFilesAfterEnv: process.env.CI ? ['<rootDir>/jest.setup.js'] : [],
  // Optimize for CI environment
  maxWorkers: process.env.CI ? '50%' : '100%',
  // Better error reporting
  errorOnDeprecated: true,
  bail: false, // Continue running tests even if some fail
  forceExit: true // Ensure Jest exits after tests complete
};
