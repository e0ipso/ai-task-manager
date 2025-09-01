/**
 * Tests for FileSystemManager integration
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { FileSystemManager } from '../filesystem-manager';
import { TemplateManager } from '../../templates/template-manager';
import { CommandManager } from '../../command-manager';

// Mock the modules that might not have all files available in test environment
jest.mock('../../templates/template-manager');
jest.mock('../../command-manager');

describe('FileSystemManager', () => {
  let tempDir: string;
  let fsManager: FileSystemManager;
  let mockTemplateManager: jest.Mocked<TemplateManager>;
  let mockCommandManager: jest.Mocked<CommandManager>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fsmanager-test-'));
    
    // Create mock managers
    mockTemplateManager = new TemplateManager() as jest.Mocked<TemplateManager>;
    mockCommandManager = new CommandManager() as jest.Mocked<CommandManager>;

    // Mock template manager methods
    mockTemplateManager.getAvailableTemplates = jest.fn().mockResolvedValue(['test-template']);
    mockTemplateManager.getTemplateConfig = jest.fn().mockResolvedValue({
      name: 'test-template',
      description: 'Test template',
      files: [{
        source: path.join(__dirname, '../../../templates/test-template/test.md'),
        destination: 'test.md',
        name: 'test',
      }],
    });

    // Mock command manager methods  
    mockCommandManager.getAvailableCommands = jest.fn().mockResolvedValue([
      {
        filename: 'test-command.md',
        content: '---\ndescription: Test command\n---\n\n# Test Command',
        frontmatter: { description: 'Test command' },
      },
    ]);
    mockCommandManager.installCommands = jest.fn().mockResolvedValue({
      installed: [],
      skipped: [],
      errors: [],
    });
    mockCommandManager.getInstallationStatus = jest.fn().mockResolvedValue({
      isInstalled: true,
      installedCommands: ['test-command.md'],
      missingCommands: [],
      conflictingCommands: [],
    });

    // Add sourceCommandsPath property mock
    (mockCommandManager as any).sourceCommandsPath = path.join(__dirname, '../../../commands/tasks');

    fsManager = new FileSystemManager({
      templateManager: mockTemplateManager,
      commandManager: mockCommandManager,
      verificationEnabled: false, // Disable for simpler testing
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('detectInstallation', () => {
    it('should detect no installation in empty directory', async () => {
      const result = await fsManager.detectInstallation(tempDir);

      expect(result.isInstalled).toBe(false);
      expect(result.partialInstallation).toBe(false);
      expect(result.missingFiles).toContain('.ai/task-manager/config.json');
      expect(result.missingFiles).toContain('.ai/task-manager/VERSION');
    });

    it('should detect existing installation', async () => {
      // Set up existing installation
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      await fs.mkdir(aiDir, { recursive: true });
      await fs.writeFile(path.join(aiDir, 'VERSION'), '1.0.0');
      await fs.writeFile(path.join(aiDir, 'config.json'), '{}');

      const result = await fsManager.detectInstallation(tempDir);

      expect(result.isInstalled).toBe(true);
      expect(result.version).toBe('1.0.0');
      expect(result.installationPath).toBe(tempDir);
    });
  });

  describe('getInstallationStatus', () => {
    it('should return comprehensive installation status', async () => {
      // Set up partial installation
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      await fs.mkdir(aiDir, { recursive: true });
      await fs.writeFile(path.join(aiDir, 'VERSION'), '1.0.0');
      await fs.writeFile(path.join(aiDir, 'config.json'), '{}');

      const status = await fsManager.getInstallationStatus(tempDir);

      expect(status.isInstalled).toBe(true);
      expect(status.version).toBe('1.0.0');
      expect(status.health).toBe('healthy');
      expect(status.details.templates).toBe(true);
      expect(status.details.commands).toBe(true);
      expect(status.details.config).toBe(true);
    });

    it('should handle installation status errors gracefully', async () => {
      // Test with directory that doesn't exist or is inaccessible
      const invalidDir = '/nonexistent/directory';

      const status = await fsManager.getInstallationStatus(invalidDir);

      expect(status.isInstalled).toBe(false);
      expect(status.health).toBe('unknown');
      expect(status.details.templates).toBe(false);
      expect(status.details.commands).toBe(false);
      expect(status.details.config).toBe(false);
    });
  });

  describe('uninstallAITaskManager', () => {
    it('should remove installation files', async () => {
      // Set up installation
      const aiDir = path.join(tempDir, '.ai', 'task-manager');
      const claudeDir = path.join(tempDir, '.claude', 'commands', 'tasks');
      
      await fs.mkdir(aiDir, { recursive: true });
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(aiDir, 'VERSION'), '1.0.0');
      await fs.writeFile(path.join(claudeDir, 'test-command.md'), '# Test');

      const success = await fsManager.uninstallAITaskManager(tempDir);

      expect(success).toBe(true);
      
      // Verify directories are removed
      const aiExists = await fs.access(aiDir).then(() => true).catch(() => false);
      const claudeExists = await fs.access(claudeDir).then(() => true).catch(() => false);
      
      expect(aiExists).toBe(false);
      expect(claudeExists).toBe(false);
    });

    it('should handle uninstall errors gracefully', async () => {
      // Try to uninstall from directory we can't write to
      const readOnlyDir = path.join(tempDir, 'readonly');
      await fs.mkdir(readOnlyDir);
      
      if (process.platform !== 'win32') {
        await fs.chmod(readOnlyDir, 0o444); // Read-only
      }

      const success = await fsManager.uninstallAITaskManager(readOnlyDir);

      // Should still return true since there was nothing to uninstall
      expect(success).toBe(true);

      // Restore permissions for cleanup
      if (process.platform !== 'win32') {
        await fs.chmod(readOnlyDir, 0o755);
      }
    });
  });

  describe('event handling', () => {
    it('should support event handlers', async () => {
      const eventHandler = jest.fn();
      fsManager.addEventListener(eventHandler);

      // Mock template files existence for the installation
      const templateDir = path.join(__dirname, '../../../templates/test-template');
      await fs.mkdir(templateDir, { recursive: true });
      await fs.writeFile(path.join(templateDir, 'test.md'), '# Test Template');

      try {
        // This would normally trigger events, but since we're mocking extensively,
        // we'll just verify the handler was registered
        expect(fsManager['eventHandlers']).toContain(eventHandler);
      } finally {
        // Cleanup
        await fs.rm(templateDir, { recursive: true, force: true });
      }
    });

    it('should remove event handlers', async () => {
      const eventHandler = jest.fn();
      fsManager.addEventListener(eventHandler);
      fsManager.removeEventListener(eventHandler);

      expect(fsManager['eventHandlers']).not.toContain(eventHandler);
    });
  });

  describe('error handling', () => {
    it('should handle template manager errors gracefully', async () => {
      mockTemplateManager.getAvailableTemplates.mockRejectedValue(new Error('Template error'));

      // Should not throw, but log warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await fsManager['planTemplateInstallation'](tempDir);
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Template planning failed'));
      
      consoleSpy.mockRestore();
    });

    it('should handle command manager errors gracefully', async () => {
      mockCommandManager.getAvailableCommands.mockRejectedValue(new Error('Command error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await fsManager['planCommandInstallation'](tempDir);
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Command planning failed'));
      
      consoleSpy.mockRestore();
    });
  });
});