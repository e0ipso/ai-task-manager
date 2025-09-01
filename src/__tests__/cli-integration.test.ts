import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

describe('CLI Integration Tests', () => {
  const CLI_PATH = path.join(__dirname, '..', 'cli.ts');

  test('should show helpful error for invalid assistant', async () => {
    try {
      await execAsync(`npx ts-node ${CLI_PATH} init --assistants invalid`);
      throw new Error('Expected command to fail with invalid assistant');
    } catch (error: any) {
      expect(error.stderr).toContain('Invalid assistant name: invalid');
      expect(error.stderr).toContain('Supported assistants: claude, gemini');
      expect(error.stderr).toContain('Examples: --assistants claude');
    }
  });

  test('should show helpful error for misspelled assistant', async () => {
    try {
      await execAsync(`npx ts-node ${CLI_PATH} init --assistants claud`);
      throw new Error('Expected command to fail with misspelled assistant');
    } catch (error: any) {
      expect(error.stderr).toContain('Invalid assistant name: claud');
      expect(error.stderr).toContain('Did you mean "claude" instead of "claud"?');
    }
  });

  test('should show helpful error for empty assistant value', async () => {
    try {
      await execAsync(`npx ts-node ${CLI_PATH} init --assistants ""`);
      throw new Error('Expected command to fail with empty assistant');
    } catch (error: any) {
      expect(error.stderr).toContain('Assistant input cannot be empty or undefined');
      expect(error.stderr).toContain('Valid options: claude, gemini');
    }
  });

  test('should show helpful error for missing assistants flag', async () => {
    try {
      await execAsync(`npx ts-node ${CLI_PATH} init`);
      throw new Error('Expected command to fail with missing assistants flag');
    } catch (error: any) {
      expect(error.stderr).toContain("required option '--assistants <assistants>' not specified");
    }
  });

  test('should show help for unknown command', async () => {
    try {
      await execAsync(`npx ts-node ${CLI_PATH} unknown-command`);
      throw new Error('Expected command to fail with unknown command');
    } catch (error: any) {
      // The error might be in stdout or stderr depending on how the command is handled
      const output = error.stdout + error.stderr;
      expect(output).toContain('Unknown Command: unknown-command');
    }
  });

  test('should display help when requested', async () => {
    const { stdout } = await execAsync(`npx ts-node ${CLI_PATH} --help`);
    expect(stdout).toContain('AI-powered task management CLI tool');
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Commands:');
    expect(stdout).toContain('init');
  });

  test('should display init command help when requested', async () => {
    const { stdout } = await execAsync(`npx ts-node ${CLI_PATH} init --help`);
    expect(stdout).toContain('Initialize a new task management workspace');
    expect(stdout).toContain('--assistants <assistants>');
    expect(stdout).toContain('Select coding assistants (claude,gemini)');
    expect(stdout).toContain('Examples:');
  });
});
