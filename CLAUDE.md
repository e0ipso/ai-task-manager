# AI Task Manager - Development Guide

## Test Strategy: "Write a Few Tests, Mostly Integration"

### Philosophy

This project follows a **minimal, high-impact testing approach** based on the principle: "write a few tests, mostly integration." We deliberately under-test to avoid maintenance overhead while ensuring critical functionality remains reliable.

### Testing Statistics

- **Tests**: 37 tests across 2 files (vs 184 previously)
- **Lines of code**: 628 test lines (vs 3,185 previously) 
- **Reduction**: 80% fewer tests, 80% fewer code
- **Performance**: ~3 seconds execution time
- **Coverage**: Deliberately low (24% lines, 19% branches, 12% functions)

### What We Test

#### Critical Business Logic (`utils.test.ts`)
Tests functions that could silently fail or cause data corruption:

- **`parseAssistants`**: Input validation, normalization, duplicate handling
- **`validateAssistants`**: Assistant validation with proper error messages  
- **`escapeTomlString`**: String escaping for TOML format (prevents malformed output)
- **`parseFrontmatter`**: YAML parsing with error tolerance
- **`convertMdToToml`**: Complex format conversion with variable replacement

```typescript
// Example: Testing business logic that could fail silently
describe('parseAssistants', () => {
  it('should remove duplicates and empty entries', () => {
    expect(parseAssistants('claude,claude,gemini')).toEqual(['claude', 'gemini']);
    expect(parseAssistants('claude,,gemini,')).toEqual(['claude', 'gemini']);
  });
});
```

#### End-to-End Workflows (`cli.integration.test.ts`) 
Tests complete user journeys with real file system operations:

- **CLI command parsing and validation**
- **File system operations** (directory creation, template copying)
- **Template format conversion** (Markdown to TOML)
- **Cross-platform compatibility** 
- **Error handling scenarios**
- **Path resolution edge cases**

```typescript
// Example: Integration test covering complete workflow
it('should complete full workflow with all assistants', async () => {
  const result = executeCommand(`node "${cliPath}" init --assistants claude,gemini --destination-directory "${customDir}"`);

  expect(result.exitCode).toBe(0);
  await verifyDirectoryStructure(['claude', 'gemini'], customDir);
  await verifyFileContent(['claude', 'gemini'], customDir);
  // ... additional verifications
});
```

### What We Deliberately Don't Test

#### Framework and Library Code
- **File system operations** (`fs-extra`, `path`) - Well-tested libraries
- **Command line parsing** (`commander.js`) - Mature framework
- **TypeScript compilation** - Compiler handles type safety

#### Simple Functions
- **Basic getters/setters** - Too trivial to break
- **Simple string concatenation** - Obvious functionality
- **Direct Node.js API calls** - Platform-tested code

#### Obvious Code Paths
- **Console logging** (`logger.ts` - 0% coverage) - Visual verification sufficient
- **CLI entry point** (`cli.ts` - excluded from coverage) - Integration tests cover this
- **Simple type definitions** - TypeScript provides compile-time validation

### Testing Principles

#### 1. Integration Over Unit
Prefer testing complete workflows over isolated functions:

```typescript
// ✅ Good: Tests real user workflow
it('should handle multiple assistants with proper format conversion', async () => {
  const result = executeCommand(`node "${cliPath}" init --assistants claude,gemini`);
  await verifyDirectoryStructure(['claude', 'gemini']);
  await verifyFileContent(['claude', 'gemini']);
});

// ❌ Avoid: Testing trivial internal functions
it('should return correct file extension', () => {
  expect(getFileExtension('claude')).toBe('md');
});
```

#### 2. Real Dependencies, Minimal Mocking
Use actual file system, avoid excessive mocking:

```typescript
// ✅ Good: Real file system operations
beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-task-test-'));
  process.chdir(testDir);
});

// ❌ Avoid: Over-mocking
jest.mock('fs-extra');
jest.mock('path');
```

#### 3. Error Scenarios Matter
Test failure modes, not just happy paths:

```typescript
// ✅ Good: Testing error handling
it('should reject invalid assistants', () => {
  expect(() => parseAssistants('invalid')).toThrow(
    'Invalid assistant(s): invalid. Valid options are: claude, gemini'
  );
});
```

#### 4. Focus on Data Integrity
Test functions that transform or validate data:

```typescript
// ✅ Good: Testing data transformation
it('should transform variable placeholders correctly', () => {
  const md = 'Use $ARGUMENTS for input and plan $1 for ID.';
  const result = convertMdToToml(md);
  expect(result).toContain('Use {{args}} for input and plan {{plan_id}} for ID.');
});
```

### Coverage Philosophy

#### Intentionally Low Coverage
- **24% line coverage** - Covers critical business logic only
- **19% branch coverage** - Error paths and edge cases
- **12% function coverage** - Most important functions only

#### Coverage Exclusions
```javascript
// jest.config.js coverage exclusions
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.d.ts',
  '!src/cli.ts',              // Integration tests cover this
  '!src/**/*.test.ts',        // Test files themselves
  '!src/**/__tests__/**'      // Test directories
]
```

### Adding New Tests

#### When to Add a Test

**DO add tests for:**
- New business logic functions
- Data transformation/validation
- Complex parsing or conversion
- Error handling scenarios
- New CLI commands or options

**DON'T add tests for:**
- Simple utility functions
- Direct API calls to well-tested libraries  
- Obvious getter/setter methods
- Console output formatting
- Type-only changes

#### Test Structure Template

```typescript
describe('FeatureName', () => {
  describe('specificFunction', () => {
    it('should handle normal case', () => {
      // Test happy path
    });

    it('should handle edge cases', () => {
      // Test boundary conditions
    });

    it('should reject invalid input', () => {
      // Test error scenarios
    });
  });
});
```

#### Integration Test Pattern

```typescript
describe('Feature Integration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  it('should complete end-to-end workflow', async () => {
    // Test complete user journey
    // Verify file system state
    // Check error conditions
  });
});
```

### Performance Considerations

#### Fast Execution
```javascript
// jest.config.js optimizations
maxWorkers: '50%',           // Parallel execution
cache: true,                 // Cache test results  
cacheDirectory: '.jest-cache', // Fast subsequent runs
verbose: false,              // Minimal output
```

#### Efficient Test Structure
- **Shared setup/teardown** - Minimize repeated operations
- **Focused assertions** - Test specific behaviors, not everything
- **Early exits** - Use `bail: false` to see all failures

### Test Maintenance

#### Regular Review
- Remove tests that provide little value
- Consolidate similar test cases
- Update tests when requirements change
- Keep test descriptions current

#### Refactoring Guidelines  
- When refactoring code, update only affected tests
- Don't add tests just to increase coverage
- Focus on maintaining critical path coverage
- Remove tests for deleted functionality

### Examples from Codebase

#### Excellent Test (High Value)
```typescript
it('should handle complex mixed escaping', () => {
  const input = 'path\\file\n"quoted"\tvalue';
  const expected = 'path\\\\file\\n\\"quoted\\"\\tvalue';
  expect(escapeTomlString(input)).toBe(expected);
});
```
**Why good**: Tests complex logic that could silently fail and corrupt output.

#### Integration Test (End-to-End Value)  
```typescript
it('should handle existing directories gracefully and verify successful execution', async () => {
  // First initialization
  const firstResult = executeCommand(`node "${cliPath}" init --assistants claude`);
  expect(firstResult.exitCode).toBe(0);
  await verifyDirectoryStructure(['claude']);

  // Second initialization should also succeed
  const secondResult = executeCommand(`node "${cliPath}" init --assistants gemini`);  
  expect(secondResult.exitCode).toBe(0);
  await verifyDirectoryStructure(['claude', 'gemini']);
});
```
**Why good**: Tests real conflict resolution scenarios that users will encounter.

---

This test strategy prioritizes **maintainability over coverage**, **integration over isolation**, and **real scenarios over theoretical completeness**. The result is a lean, fast, reliable test suite that catches real problems without burdening development.