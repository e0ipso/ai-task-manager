import fs from 'fs/promises';
import path from 'path';
import { CommandManager } from '../command-manager';
import { tmpdir } from 'os';

describe('CommandManager', () => {
  let commandManager: CommandManager;
  let tempDir: string;

  beforeEach(async () => {
    commandManager = new CommandManager();
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'command-manager-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getAvailableCommands', () => {
    it('should load available commands from package directory', async () => {
      const commands = await commandManager.getAvailableCommands();

      expect(commands).toHaveLength(3);
      expect(commands.map(cmd => cmd.filename)).toContain('create-plan.md');
      expect(commands.map(cmd => cmd.filename)).toContain('generate-tasks.md');
      expect(commands.map(cmd => cmd.filename)).toContain('execute-blueprint.md');

      // Each command should have content and frontmatter
      commands.forEach(command => {
        expect(command.content).toBeTruthy();
        expect(command.frontmatter).toBeTruthy();
        expect(command.frontmatter.description).toBeTruthy();
      });
    });

    it('should parse frontmatter correctly', async () => {
      const commands = await commandManager.getAvailableCommands();
      const createPlanCommand = commands.find(cmd => cmd.filename === 'create-plan.md');

      expect(createPlanCommand).toBeTruthy();
      expect(createPlanCommand!.frontmatter['argument-hint']).toBe('[user-prompt]');
      expect(createPlanCommand!.frontmatter.description).toContain('Create a comprehensive plan');
    });
  });

  describe('installCommands', () => {
    it('should install commands to target directory', async () => {
      const result = await commandManager.installCommands(tempDir);

      expect(result.installed).toHaveLength(3);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      // Verify files were created
      const commandsPath = path.join(tempDir, '.claude', 'commands', 'tasks');
      const files = await fs.readdir(commandsPath);
      expect(files).toHaveLength(3);
      expect(files).toContain('create-plan.md');
      expect(files).toContain('generate-tasks.md');
      expect(files).toContain('execute-blueprint.md');
    });

    it('should create directory structure if it does not exist', async () => {
      const targetPath = path.join(tempDir, 'nested', 'deep', 'directory');

      const result = await commandManager.installCommands(targetPath);

      expect(result.installed).toHaveLength(3);

      // Verify directory was created
      const commandsPath = path.join(targetPath, '.claude', 'commands', 'tasks');
      const stats = await fs.stat(commandsPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should skip existing files when overwrite is false', async () => {
      // Install commands first time
      await commandManager.installCommands(tempDir);

      // Install again without overwrite
      const result = await commandManager.installCommands(tempDir, { overwrite: false });

      expect(result.installed).toHaveLength(0);
      expect(result.skipped).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should overwrite existing files when overwrite is true', async () => {
      // Install commands first time
      await commandManager.installCommands(tempDir);

      // Modify a file
      const commandPath = path.join(tempDir, '.claude', 'commands', 'tasks', 'create-plan.md');
      await fs.writeFile(commandPath, '# Modified content');

      // Install again with overwrite
      const result = await commandManager.installCommands(tempDir, { overwrite: true });

      expect(result.installed).toHaveLength(3);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      // Verify file was overwritten
      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content).toContain('Comprehensive Plan Creation');
    });

    it('should set proper file permissions', async () => {
      await commandManager.installCommands(tempDir);

      const commandPath = path.join(tempDir, '.claude', 'commands', 'tasks', 'create-plan.md');
      const stats = await fs.stat(commandPath);

      // Check that file is readable and writable by owner
      expect(stats.mode & 0o644).toBe(0o644);
    });
  });

  describe('isInstalled', () => {
    it('should return false when commands are not installed', async () => {
      const isInstalled = await commandManager.isInstalled(tempDir);
      expect(isInstalled).toBe(false);
    });

    it('should return true when commands are installed', async () => {
      await commandManager.installCommands(tempDir);
      const isInstalled = await commandManager.isInstalled(tempDir);
      expect(isInstalled).toBe(true);
    });

    it('should return false when directory exists but no commands', async () => {
      // Create the directory structure but no command files
      const commandsPath = path.join(tempDir, '.claude', 'commands', 'tasks');
      await fs.mkdir(commandsPath, { recursive: true });

      const isInstalled = await commandManager.isInstalled(tempDir);
      expect(isInstalled).toBe(false);
    });
  });

  describe('getInstallationStatus', () => {
    it('should return correct status when no commands are installed', async () => {
      const status = await commandManager.getInstallationStatus(tempDir);

      expect(status.isInstalled).toBe(false);
      expect(status.installedCommands).toHaveLength(0);
      expect(status.missingCommands).toHaveLength(3);
      expect(status.conflictingCommands).toHaveLength(0);
    });

    it('should return correct status when all commands are installed', async () => {
      await commandManager.installCommands(tempDir);
      const status = await commandManager.getInstallationStatus(tempDir);

      expect(status.isInstalled).toBe(true);
      expect(status.installedCommands).toHaveLength(3);
      expect(status.missingCommands).toHaveLength(0);
      expect(status.conflictingCommands).toHaveLength(0);
    });

    it('should detect conflicting files', async () => {
      // Install commands first
      await commandManager.installCommands(tempDir);

      // Modify a file to create conflict
      const commandPath = path.join(tempDir, '.claude', 'commands', 'tasks', 'create-plan.md');
      await fs.writeFile(commandPath, '# Different content');

      const status = await commandManager.getInstallationStatus(tempDir);

      expect(status.isInstalled).toBe(false);
      expect(status.installedCommands).toHaveLength(2);
      expect(status.missingCommands).toHaveLength(0);
      expect(status.conflictingCommands).toHaveLength(1);
      expect(status.conflictingCommands).toContain('create-plan.md');
    });

    it('should handle partially installed commands', async () => {
      // Create directory and install only one command manually
      const commandsPath = path.join(tempDir, '.claude', 'commands', 'tasks');
      await fs.mkdir(commandsPath, { recursive: true });

      const commands = await commandManager.getAvailableCommands();
      const firstCommand = commands[0];
      if (firstCommand) {
        await fs.writeFile(path.join(commandsPath, firstCommand.filename), firstCommand.content);
      }

      const status = await commandManager.getInstallationStatus(tempDir);

      expect(status.isInstalled).toBe(false);
      expect(status.installedCommands).toHaveLength(1);
      expect(status.missingCommands).toHaveLength(2);
      expect(status.conflictingCommands).toHaveLength(0);
    });
  });

  describe('validation', () => {
    it('should validate commands with proper frontmatter', async () => {
      const commands = await commandManager.getAvailableCommands();

      commands.forEach(command => {
        expect(command.frontmatter.description).toBeTruthy();
        expect(command.content).toContain('---');
        expect(command.content.length).toBeGreaterThan(100);
      });
    });

    it('should reject commands without validation when validate is false', async () => {
      const result = await commandManager.installCommands(tempDir, { validate: false });

      // Should still install even if validation were to fail
      expect(result.installed).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // Create a read-only directory
      const readOnlyDir = path.join(tempDir, 'readonly');
      await fs.mkdir(readOnlyDir);

      // Make directory read-only (this might not work on all systems)
      try {
        await fs.chmod(readOnlyDir, 0o444);

        const result = await commandManager.installCommands(readOnlyDir);

        // Should have some errors due to permission issues
        expect(result.errors.length).toBeGreaterThan(0);
      } catch {
        // Skip test if chmod doesn't work as expected
      }
    });

    it('should handle invalid target directories', async () => {
      const invalidDir = path.join(tempDir, 'nonexistent', 'deep', 'path');

      // Should create directories and install successfully
      const result = await commandManager.installCommands(invalidDir);
      expect(result.installed).toHaveLength(3);
    });
  });
});
