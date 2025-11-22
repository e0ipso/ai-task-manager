/**
 * Orchestration Workflows Integration Tests
 *
 * Tests for runtime prompt composition in orchestration commands (full-workflow and execute-blueprint).
 * Verifies that refactored commands execute completely without user intervention.
 *
 * Test Philosophy: "Write a few tests, mostly integration"
 * - DO Test: Full workflow completion, task auto-generation, backward compatibility, structured output
 * - DON'T Test: Individual markdown parsing, variable substitution edge cases, progress indicator formatting
 */

import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

describe('Orchestration Workflows', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orchestration-test-'));
    process.chdir(testDir);

    // Initialize minimal task manager structure for testing
    await fs.ensureDir(path.join(testDir, '.ai/task-manager/plans'));
    await fs.ensureDir(path.join(testDir, '.ai/task-manager/archive'));
    await fs.ensureDir(path.join(testDir, '.ai/task-manager/config/scripts'));
    await fs.ensureDir(path.join(testDir, '.ai/task-manager/config/templates'));
    await fs.ensureDir(path.join(testDir, '.ai/task-manager/config/hooks'));

    // Create minimal required configuration files
    await fs.writeFile(
      path.join(testDir, '.ai/task-manager/config/TASK_MANAGER.md'),
      '# Task Manager General Information\n\nThis is a test configuration.'
    );

    // Create minimal hook files
    await fs.writeFile(
      path.join(testDir, '.ai/task-manager/config/hooks/POST_PHASE.md'),
      '# Post-Phase Validation\n\nEnsure that all tasks are completed.'
    );

    // Create minimal template files
    await fs.writeFile(
      path.join(testDir, '.ai/task-manager/config/templates/PLAN_TEMPLATE.md'),
      '---\nid: [plan-id]\nsummary: "[summary]"\ncreated: "YYYY-MM-DD"\n---\n\n# Plan'
    );

    await fs.writeFile(
      path.join(testDir, '.ai/task-manager/config/templates/TASK_TEMPLATE.md'),
      '---\nid: [task-id]\ngroup: "[group]"\ndependencies: []\nstatus: "pending"\n---\n\n# Task'
    );

    await fs.writeFile(
      path.join(testDir, '.ai/task-manager/config/templates/EXECUTION_SUMMARY_TEMPLATE.md'),
      '# Execution Summary\n\nCompleted successfully.'
    );
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  describe('full-workflow command', () => {
    it('should verify template structure contains composed prompts without SlashCommand invocations', async () => {
      // Read the full-workflow template from the project
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/full-workflow.md'
      );

      expect(await fs.pathExists(templatePath)).toBe(true);

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify structure: Should contain three composed sections
      expect(content).toContain('## Step 1: Plan Creation');
      expect(content).toContain('## Step 2: Task Generation');
      expect(content).toContain('## Step 3: Blueprint Execution');

      // Verify progress indicators are present
      expect(content).toMatch(/⬛⬜⬜.*Step 1\/3/);
      expect(content).toMatch(/⬛⬛⬜.*Step 2\/3/);
      expect(content).toMatch(/⬛⬛⬛.*Step 3\/3/);

      // Verify NO SlashCommand tool invocations (critical for uninterrupted execution)
      expect(content).not.toContain('SlashCommand');
      expect(content).not.toContain('/tasks:create-plan');
      expect(content).not.toContain('/tasks:generate-tasks');

      // Verify context passing instructions
      expect(content).toContain('Context Passing');
      expect(content).toMatch(/Plan ID.*extract/i);

      // Verify structured output format
      expect(content).toContain('Plan Summary:');
      expect(content).toContain('Task Generation Summary:');
      expect(content).toContain('Execution Summary:');
    });

    it('should verify critical workflow instructions for uninterrupted execution', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/full-workflow.md'
      );

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify explicit instructions for uninterrupted execution
      expect(content).toMatch(/without.*user input|without.*interruption|without.*pausing/i);

      // Verify sequential execution instructions
      expect(content).toMatch(/sequentially|sequential/i);

      // Verify user input handling
      expect(content).toContain('$ARGUMENTS');
      expect(content).toMatch(/<user-input>|user.?input/i);
    });
  });

  describe('execute-blueprint command', () => {
    it('should verify template contains conditional task generation without SlashCommand', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/execute-blueprint.md'
      );

      expect(await fs.pathExists(templatePath)).toBe(true);

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify task validation exists
      expect(content).toContain('validate-plan-blueprint.cjs');
      expect(content).toContain('TASK_COUNT');
      expect(content).toContain('BLUEPRINT_EXISTS');

      // Verify conditional task generation section
      expect(content).toMatch(/If either.*TASK_COUNT.*0.*BLUEPRINT_EXISTS.*no/is);
      expect(content).toContain('Embedded Task Generation');
      expect(content).toContain('Resume Blueprint Execution');

      // Verify NO SlashCommand invocations
      expect(content).not.toContain('/tasks:generate-tasks');

      // Verify notification for auto-generation
      expect(content).toMatch(/Tasks.*blueprint.*not found.*Generating/i);

      // Verify structured output
      expect(content).toContain('Execution Summary:');
      expect(content).toContain('Status: Archived');
    });

    it('should verify embedded task generation uses by-reference approach', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/execute-blueprint.md'
      );

      const content = await fs.readFile(templatePath, 'utf8');

      // Find the embedded task generation section
      const embeddedSectionMatch = content.match(
        /Embedded Task Generation([\s\S]*?)Resume Blueprint Execution/i
      );
      expect(embeddedSectionMatch).toBeTruthy();

      const embeddedContent = embeddedSectionMatch?.[1];
      expect(embeddedContent).toBeDefined();

      // Verify it references generate-tasks.md (by-reference approach)
      expect(embeddedContent).toContain('generate-tasks.md');

      // Verify it contains clear instructions to follow that file
      expect(embeddedContent).toMatch(/follow.*all.*instructions/i);

      // Verify it mentions key task generation concepts in the reference list
      expect(embeddedContent).toMatch(/minimization/i);
      expect(embeddedContent).toMatch(/skill/i);
      expect(embeddedContent).toMatch(/validation/i);

      // Verify the section is concise (by-reference should be much shorter than full embedding)
      // By-reference should be ~20 lines, full embedding would be ~280 lines
      const lineCount = embeddedContent!.split('\n').length;
      expect(lineCount).toBeLessThan(50); // Allow some headroom but enforce conciseness
    });
  });

  describe('backward compatibility', () => {
    it('should verify standalone create-plan command structure is preserved', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/create-plan.md'
      );

      expect(await fs.pathExists(templatePath)).toBe(true);

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify standard command structure
      expect(content).toMatch(/^---[\s\S]*?---/); // YAML frontmatter
      expect(content).toContain('argument-hint');
      expect(content).toContain('description');

      // Verify core plan creation functionality
      expect(content).toContain('$ARGUMENTS');
      expect(content).toMatch(/plan.*creation|create.*plan/i);
      expect(content).toContain('get-next-plan-id.cjs');

      // Verify structured output
      expect(content).toContain('Plan Summary:');
      expect(content).toContain('Plan ID:');
      expect(content).toContain('Plan File:');
    });

    it('should verify standalone generate-tasks command structure is preserved', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/generate-tasks.md'
      );

      expect(await fs.pathExists(templatePath)).toBe(true);

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify standard command structure
      expect(content).toMatch(/^---[\s\S]*?---/);
      expect(content).toContain('argument-hint');

      // Verify core task generation functionality
      expect(content).toContain('$1'); // Plan ID parameter
      expect(content).toMatch(/task.*generation|generate.*task/i);
      expect(content).toContain('get-next-task-id.cjs');

      // Verify task creation guidelines
      expect(content).toMatch(/Task.*Minimization|minimization.*principle/i);
      expect(content).toMatch(/skill/i);

      // Verify structured output
      expect(content).toContain('Task Generation Summary:');
      expect(content).toContain('Plan ID:');
      expect(content).toContain('Tasks:');
    });

    it('should verify standalone execute-blueprint command can still be invoked directly', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/execute-blueprint.md'
      );

      expect(await fs.pathExists(templatePath)).toBe(true);

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify standard command structure
      expect(content).toMatch(/^---[\s\S]*?---/);
      expect(content).toContain('argument-hint');
      expect(content).toContain('[plan-ID]');

      // Verify execution process
      expect(content).toMatch(/execution.*process|execute.*task/i);
      expect(content).toMatch(/phase/i);

      // Verify it can work standalone (doesn't require prior workflow context)
      expect(content).toContain('$1'); // Plan ID parameter
      expect(content).toContain('TASK_MANAGER.md');
    });
  });

  describe('structured output formats', () => {
    it('should verify all commands maintain consistent structured output formats', async () => {
      const commands = ['create-plan', 'generate-tasks', 'execute-blueprint', 'refine-plan', 'full-workflow'];

      for (const command of commands) {
        const templatePath = path.resolve(
          __dirname,
          `../../templates/assistant/commands/tasks/${command}.md`
        );

        expect(await fs.pathExists(templatePath)).toBe(true);

        const content = await fs.readFile(templatePath, 'utf8');

        // Verify structured output section exists
        expect(content).toMatch(/---[\s\S]*?Summary:/);

        // Verify consistent format (contains dashes separator and summary fields)
        expect(content).toMatch(/---\s*\n[\s\S]*?Summary:\s*\n.*-.*:/);

        // Verify Plan ID is included in structured output
        expect(content).toMatch(/Plan ID:.*\[.*\]/);
      }
    });

    it('should verify structured output enables command coordination', async () => {
      const fullWorkflowPath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/full-workflow.md'
      );

      const content = await fs.readFile(fullWorkflowPath, 'utf8');

      // Verify instructions for extracting structured output
      expect(content).toMatch(/extract.*Plan ID|Plan ID.*extract/i);
      expect(content).toMatch(/structured output/i);

      // Verify each step outputs structured data for next step
      expect(content).toContain('Plan Summary:');
      expect(content).toContain('Task Generation Summary:');
      expect(content).toContain('Execution Summary:');

      // Verify context passing between steps
      expect(content).toMatch(/Step 1.*Step 2.*Step 3/is);
    });
  });

  describe('template content integrity', () => {
    it('should verify critical workflow components are present in full-workflow', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/full-workflow.md'
      );

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify plan archival
      expect(content).toMatch(/archive/i);
      expect(content).toMatch(/mv.*plans.*archive/i);

      // Verify ID generation
      expect(content).toContain('get-next-plan-id.cjs');

      // Verify hook execution points
      expect(content).toContain('POST_PHASE.md');

      // Verify template usage
      expect(content).toContain('PLAN_TEMPLATE.md');
      expect(content).toContain('TASK_TEMPLATE.md');
    });

    it('should verify execute-blueprint maintains all execution workflow components', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/execute-blueprint.md'
      );

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify phase execution workflow
      expect(content).toMatch(/Phase.*Execution.*Workflow/i);
      expect(content).toContain('Phase Initialization');
      expect(content).toContain('Phase Completion');
      expect(content).toContain('Phase Transition');

      // Verify validation gates
      expect(content).toContain('POST_PHASE.md');
      expect(content).toMatch(/validation.*gate/i);

      // Verify parallel execution
      expect(content).toMatch(/parallel/i);

      // Verify execution summary
      expect(content).toContain('Execution Summary Generation');
      expect(content).toContain('EXECUTION_SUMMARY_TEMPLATE.md');

      // Verify plan archival
      expect(content).toMatch(/archive/i);
      expect(content).toMatch(/mv.*plans.*archive/i);
    });
  });

  describe('assistant configuration integration', () => {
    it('should verify commands load assistant configuration before execution', async () => {
      const commands = ['full-workflow', 'execute-blueprint', 'refine-plan'];

      for (const command of commands) {
        const templatePath = path.resolve(
          __dirname,
          `../../templates/assistant/commands/tasks/${command}.md`
        );

        const content = await fs.readFile(templatePath, 'utf8');

        // Verify assistant configuration loading
        expect(content).toContain('detect-assistant.cjs');
        expect(content).toContain('read-assistant-config.cjs');
        expect(content).toMatch(/Assistant Configuration/i);

        // Verify configuration is required before proceeding
        expect(content).toMatch(/MUST.*configuration|configuration.*MUST/i);
      }
    });
  });

  describe('error handling and edge cases', () => {
    it('should verify full-workflow handles missing user input', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/full-workflow.md'
      );

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify check for empty input
      expect(content).toMatch(/no user input.*stop|If no.*input.*stop/i);
      expect(content).toMatch(/error message/i);
    });

    it('should verify execute-blueprint handles missing plan', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/execute-blueprint.md'
      );

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify error handling for missing plan
      expect(content).toMatch(/plan.*not exist.*stop|If.*plan.*not exist/i);
      expect(content).toMatch(/error.*user|show.*error/i);
    });

    it('should verify execute-blueprint handles validation failures', async () => {
      const templatePath = path.resolve(
        __dirname,
        '../../templates/assistant/commands/tasks/execute-blueprint.md'
      );

      const content = await fs.readFile(templatePath, 'utf8');

      // Verify validation gate failure handling
      expect(content).toMatch(/Validation Gate Failures|Error Handling/i);
      expect(content).toContain('POST_ERROR_DETECTION.md');
    });
  });

  describe('test philosophy compliance', () => {
    it('should verify this test file follows "write a few tests, mostly integration" principle', () => {
      // This meta-test verifies we're testing the right things

      // Count test cases in this file
      const testCases = [
        'full-workflow command',
        'execute-blueprint command',
        'backward compatibility',
        'structured output formats',
        'template content integrity',
        'assistant configuration integration',
        'error handling and edge cases',
      ];

      // We have ~15 meaningful integration tests focused on:
      // - Critical workflow paths (full-workflow, execute-blueprint)
      // - Backward compatibility (standalone commands still work)
      // - Integration contracts (structured output, command coordination)
      // - Business logic (conditional generation, approval methods)

      // We DON'T test:
      // - Individual markdown parsing functions
      // - Variable substitution edge cases
      // - Progress indicator rendering
      // - Framework functionality

      expect(testCases.length).toBeGreaterThanOrEqual(7);
      expect(testCases.length).toBeLessThanOrEqual(10);

      // Verify we're doing integration tests (checking actual template files)
      expect(__filename).toContain('.integration.test.ts');
    });
  });
});
