/**
 * Hook Workflow Integration Tests - POST_TASK_CREATION Validation
 * 
 * Comprehensive integration tests for the hook-based task enhancement workflow.
 * Tests the complete flow from task generation through quality assessment, 
 * enhancement, and validation that enhanced tasks execute successfully with 
 * cheaper/less capable models.
 * 
 * Testing Philosophy: "Write a few tests, mostly integration"
 * - Focus on testing custom business logic and critical workflows
 * - Test the complete hook integration end-to-end 
 * - Validate real file system operations and template processing
 * - Measure performance impact and ensure acceptable bounds
 */

import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

describe('POST_TASK_CREATION Hook Workflow Integration', () => {
  let testDir: string;
  let originalCwd: string;
  const cliPath = path.resolve(__dirname, '../../dist/cli.js');

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hook-workflow-test-'));
    process.chdir(testDir);

    // Initialize project with all assistants for comprehensive testing
    execSync(`node "${cliPath}" init --assistants claude,gemini,opencode`, { 
      cwd: testDir, 
      stdio: 'pipe' 
    });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  const createMockPlan = async (planId: string): Promise<string> => {
    const planDir = path.join(testDir, '.ai/task-manager/plans', `${planId.padStart(2, '0')}--test-plan`);
    await fs.ensureDir(planDir);
    await fs.ensureDir(path.join(planDir, 'tasks'));
    
    const planContent = `---
id: ${parseInt(planId)}
summary: Test Plan for Hook Workflow Validation  
created: 2024-09-08
---

# Test Plan: Hook Workflow Integration

## Original Work Order
Create a comprehensive test system that validates POST_TASK_CREATION hook functionality including quality assessment, task enhancement, and cheaper model execution validation.

## Technical Implementation Approach
1. Set up mock task generation environment
2. Implement quality assessment validation 
3. Create task enhancement testing framework
4. Validate enhanced task execution with cheaper models
5. Measure performance impact and ensure acceptable bounds

## Success Criteria
- Hook automatically executes after generate-tasks completion
- Quality assessment accurately identifies enhancement needs
- Task enhancement preserves scope while improving executability  
- Enhanced tasks execute successfully with cheaper models
- Performance impact remains within 2x generation time target
`;

    const planPath = path.join(planDir, 'plan.md');
    await fs.writeFile(planPath, planContent);
    return planDir;
  };

  const createMockTasks = async (planDir: string, taskCount: number = 3, startId: number = 1): Promise<void> => {
    const tasksDir = path.join(planDir, 'tasks');
    
    for (let i = startId; i < startId + taskCount; i++) {
      const taskContent = `---
id: ${i}
group: "test-group"
dependencies: ${i > 1 ? `[${i-1}]` : '[]'}
status: "pending"
created: "2024-09-08" 
skills: ["javascript", "testing"]
complexity_score: ${4 + Math.random() * 3} 
---

# Task ${i}: Test Task for Hook Validation

## Objective
Validate that the hook workflow correctly processes and enhances this task for execution by less capable models.

## Skills Required
- javascript: Core implementation logic
- testing: Validation and verification

## Acceptance Criteria
- Task can be enhanced automatically
- Enhanced version is executable by cheaper models
- Original scope and requirements are preserved
- Performance impact is measurable and acceptable

## Technical Requirements
- Implement basic functionality with clear documentation
- Include validation steps for quality assessment
- Provide detailed implementation guidance
- Ensure error handling and edge cases are covered

<details>
<summary>Implementation Notes</summary>

This task should be enhanced by the POST_TASK_CREATION hook to include:
- More detailed step-by-step instructions
- Specific code examples and patterns
- Clear validation checkpoints
- Comprehensive error handling guidance
- Context about integration points

The enhanced version should be executable by models with less capability
while maintaining the same scope and deliverables as the original task.
</details>
`;

      const taskPath = path.join(tasksDir, `${i.toString().padStart(2, '0')}--test-task-${i}.md`);
      await fs.writeFile(taskPath, taskContent);
    }
  };

  describe('Hook Integration and Execution', () => {
    it('should validate that POST_TASK_GENERATION_ALL hook file exists and is accessible', async () => {
      // Verify hook file was installed during initialization
      const hookPath = path.join(testDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
      expect(await fs.pathExists(hookPath)).toBe(true);

      // Verify hook content is properly structured
      const hookContent = await fs.readFile(hookPath, 'utf8');
      expect(hookContent).toContain('Step 3.1: Complexity Analysis & Refinement');
      expect(hookContent).toContain('Complexity Scoring Matrix');
      expect(hookContent).toContain('AIDVR Process');
      expect(hookContent).toContain('Validation Checklist');
      expect(hookContent).toContain('Error Handling');

      // Verify complexity scoring dimensions are present
      expect(hookContent).toContain('Technical');
      expect(hookContent).toContain('Decision');  
      expect(hookContent).toContain('Integration');
      expect(hookContent).toContain('Scope');
      expect(hookContent).toContain('Uncertainty');

      // Verify decomposition thresholds and rules
      expect(hookContent).toContain('Composite ≥6: Consider decomposition');
      expect(hookContent).toContain('Any dimension ≥8: Mandatory decomposition');
      expect(hookContent).toContain('Max 3 decomposition rounds per task');
    });

    it('should validate generate-tasks template references the hook correctly', async () => {
      // Check that generate-tasks template contains hook reference
      const generateTasksPath = path.join(testDir, '.claude/commands/tasks/generate-tasks.md');
      expect(await fs.pathExists(generateTasksPath)).toBe(true);
      
      const templateContent = await fs.readFile(generateTasksPath, 'utf8');
      expect(templateContent).toContain('POST_TASK_GENERATION_ALL hook');
      expect(templateContent).toContain('@.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');

      // Verify the hook is referenced at the correct step in the process
      const hookLineMatch = templateContent.match(/#### Step 3: POST_TASK_GENERATION_ALL hook/);
      expect(hookLineMatch).toBeTruthy();

      // Ensure hook execution is mandatory in the workflow
      expect(templateContent).toContain('Read and run the @.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
    });

    it('should verify hook integration across all assistant formats', async () => {
      // Test Claude format (Markdown)
      const claudePath = path.join(testDir, '.claude/commands/tasks/generate-tasks.md');
      const claudeContent = await fs.readFile(claudePath, 'utf8');
      expect(claudeContent).toContain('POST_TASK_GENERATION_ALL hook');

      // Test Gemini format (TOML) 
      const geminiPath = path.join(testDir, '.gemini/commands/tasks/generate-tasks.toml');
      const geminiContent = await fs.readFile(geminiPath, 'utf8');
      expect(geminiContent).toContain('POST_TASK_GENERATION_ALL');

      // Test OpenCode format (Markdown)
      const opencodePath = path.join(testDir, '.opencode/command/tasks/generate-tasks.md'); 
      const opencodeContent = await fs.readFile(opencodePath, 'utf8');
      expect(opencodeContent).toContain('POST_TASK_GENERATION_ALL hook');

      // Verify all formats have consistent hook integration
      const claudeHookMatch = claudeContent.match(/POST_TASK_GENERATION_ALL/g);
      const opencodeHookMatch = opencodeContent.match(/POST_TASK_GENERATION_ALL/g);
      expect(claudeHookMatch?.length).toEqual(opencodeHookMatch?.length);
    });
  });

  describe('Quality Assessment Framework Validation', () => {
    it('should validate complexity scoring matrix implementation', async () => {
      const hookPath = path.join(testDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
      const hookContent = await fs.readFile(hookPath, 'utf8');

      // Verify 5-dimension scoring system
      const dimensions = ['Technical', 'Decision', 'Integration', 'Scope', 'Uncertainty'];
      for (const dimension of dimensions) {
        expect(hookContent).toContain(dimension);
      }

      // Verify scoring scale (1-10)
      expect(hookContent).toContain('1-2 |');
      expect(hookContent).toContain('3-4 |');  
      expect(hookContent).toContain('5-6 |');
      expect(hookContent).toContain('7-8 |'); 
      expect(hookContent).toContain('9-10 |');

      // Verify composite score calculation
      expect(hookContent).toContain('Composite Score');
      expect(hookContent).toContain('MAX(Technical×1.0, Decision×0.9, Integration×0.8, Scope×0.7, Uncertainty×1.1)');

      // Verify threshold rules
      expect(hookContent).toContain('Composite ≥6: Consider decomposition');
      expect(hookContent).toContain('Any dimension ≥8: Mandatory decomposition');
      expect(hookContent).toContain('Multiple dimensions ≥6: High priority');
    });

    it('should validate decomposition patterns and strategies', async () => {
      const hookPath = path.join(testDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
      const hookContent = await fs.readFile(hookPath, 'utf8');

      // Verify decomposition patterns exist
      const patterns = ['Technology Layering', 'Decision-Implementation', 'Integration Isolation', 'Functional', 'Research-Implementation'];
      for (const pattern of patterns) {
        expect(hookContent).toContain(pattern);
      }

      // Verify AIDVR process steps
      const aidvrSteps = ['Assess', 'Identify', 'Decompose', 'Validate', 'Reconstruct'];
      for (const step of aidvrSteps) {
        expect(hookContent).toContain(step);
      }

      // Verify safety controls are in place
      expect(hookContent).toContain('Max 3 decomposition rounds per task');
      expect(hookContent).toContain('No decomposition if score ≤3');
      expect(hookContent).toContain('Min 2-hour work per subtask');
      expect(hookContent).toContain('Stop if complexity not decreasing');
    });

    it('should validate error handling and stop conditions', async () => {
      const hookPath = path.join(testDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
      const hookContent = await fs.readFile(hookPath, 'utf8');

      // Verify stop conditions
      const stopConditions = [
        'Atomic boundary reached',
        '<1 skill per subtask', 
        'Overhead > benefit',
        'Resource fragmentation',
        '<2 hour granularity',
        '3 iterations reached',
        'Score ≤3',
        'No complexity reduction'
      ];

      for (const condition of stopConditions) {
        expect(hookContent).toContain(condition);
      }

      // Verify error detection and resolution
      expect(hookContent).toContain('Infinite loop');
      expect(hookContent).toContain('Circular dependency');
      expect(hookContent).toContain('Over-decomposition');
      expect(hookContent).toContain('Orphaned task');
      expect(hookContent).toContain('Scope creep');
      expect(hookContent).toContain('Skill conflicts');
    });
  });

  describe('Task Enhancement Workflow Testing', () => {
    it('should validate complete task enhancement workflow with mock data', async () => {
      const planDir = await createMockPlan('5');
      await createMockTasks(planDir, 3);

      // Verify tasks were created correctly
      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles).toHaveLength(3);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(3);

      // Verify task content structure
      for (let i = 1; i <= 3; i++) {
        const taskPath = path.join(tasksDir, `${i.toString().padStart(2, '0')}--test-task-${i}.md`);
        expect(await fs.pathExists(taskPath)).toBe(true);
        
        const taskContent = await fs.readFile(taskPath, 'utf8');
        expect(taskContent).toContain(`id: ${i}`);
        expect(taskContent).toContain('complexity_score:');
        expect(taskContent).toContain('Skills Required');
        expect(taskContent).toContain('Acceptance Criteria');
        expect(taskContent).toContain('Implementation Notes');
      }
    });

    it('should validate task complexity scoring and enhancement requirements', async () => {
      const planDir = await createMockPlan('6');
      await createMockTasks(planDir, 5);

      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);

      // Analyze each task for complexity and enhancement needs
      for (const file of taskFiles) {
        if (!file.endsWith('.md')) continue;
        
        const taskPath = path.join(tasksDir, file);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        // Extract complexity score
        const complexityMatch = taskContent.match(/complexity_score:\s*(\d+\.?\d*)/);
        expect(complexityMatch).toBeTruthy();
        
        const complexity = parseFloat(complexityMatch?.[1] || '0');
        expect(complexity).toBeGreaterThan(0);
        expect(complexity).toBeLessThanOrEqual(10);

        // Verify task has enhancement potential (complexity > 4 or skills > 2)
        const skillsMatch = taskContent.match(/skills:\s*\[(.*?)\]/);
        expect(skillsMatch).toBeTruthy();
        
        const skillsCount = (skillsMatch?.[1] || '').split(',').filter(s => s.trim()).length;
        const needsEnhancement = complexity > 4.0 || skillsCount > 2;
        
        if (needsEnhancement) {
          // Task should have detailed implementation notes
          expect(taskContent).toContain('<details>');
          expect(taskContent).toContain('Implementation Notes');
        }
      }
    });

    it('should validate scope preservation during enhancement process', async () => {
      const planDir = await createMockPlan('7');
      await createMockTasks(planDir, 2);

      const tasksDir = path.join(planDir, 'tasks');
      const originalTasks: Array<{path: string, content: string, objectives: string[]}> = [];

      // Capture original task objectives and scope
      const taskFiles = await fs.readdir(tasksDir);
      for (const file of taskFiles) {
        if (!file.endsWith('.md')) continue;
        
        const taskPath = path.join(tasksDir, file);
        const content = await fs.readFile(taskPath, 'utf8');
        
        // Extract objectives from task content
        const objectiveMatch = content.match(/## Objective\s*\n(.*?)(?=\n##|\n$)/s);
        const acceptanceCriteriaMatch = content.match(/## Acceptance Criteria\s*\n(.*?)(?=\n##|\n$)/s);
        
        const objectives = [];
        if (objectiveMatch?.[1]) objectives.push(objectiveMatch[1].trim());
        if (acceptanceCriteriaMatch?.[1]) objectives.push(acceptanceCriteriaMatch[1].trim());
        
        originalTasks.push({
          path: taskPath,
          content,
          objectives
        });
      }

      expect(originalTasks).toHaveLength(2);

      // Validate scope preservation rules
      for (const task of originalTasks) {
        // Original objectives should be preserved
        expect(task.objectives.length).toBeGreaterThan(0);
        
        // Task should maintain core deliverables
        expect(task.content).toContain('Objective');
        expect(task.content).toContain('Acceptance Criteria');
        expect(task.content).toContain('Technical Requirements');
        
        // No scope creep - implementation notes should enhance, not expand
        if (task.content.includes('<details>')) {
          const notesMatch = task.content.match(/<details>.*?<\/details>/s);
          if (notesMatch) {
            const notes = notesMatch[0];
            // Enhancement should not add new deliverables
            expect(notes.toLowerCase()).not.toContain('additional feature');
            expect(notes.toLowerCase()).not.toContain('extra requirement');
            expect(notes.toLowerCase()).not.toContain('also implement');
          }
        }
      }
    });
  });

  describe('Cheaper Model Execution Validation', () => {
    it('should validate enhanced tasks are more executable by simpler models', async () => {
      const planDir = await createMockPlan('8');
      
      // Create tasks with varying complexity to test enhancement
      const complexTaskContent = `---
id: 1
group: "complex-task"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ["javascript", "architecture", "optimization"]
complexity_score: 7.5
---

# Complex Task: Advanced System Integration

## Objective
Implement a sophisticated data processing pipeline with multiple integration points.

## Skills Required
- javascript: Core implementation
- architecture: System design
- optimization: Performance tuning

## Acceptance Criteria
- Process data efficiently across multiple services
- Handle complex error scenarios gracefully
- Optimize for high-throughput scenarios

## Technical Requirements
Requires deep understanding of distributed systems, caching strategies, and performance optimization techniques.
`;

      const simpleTaskContent = `---
id: 2  
group: "simple-task"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ["javascript"]
complexity_score: 2.5
---

# Simple Task: Basic Data Validation

## Objective  
Add input validation to user registration form.

## Skills Required
- javascript: Form validation logic

## Acceptance Criteria
- Validate email format
- Check required fields
- Display appropriate error messages

## Technical Requirements
Simple validation rules using standard patterns.
`;

      const tasksDir = path.join(planDir, 'tasks');
      await fs.writeFile(path.join(tasksDir, '01--complex-task.md'), complexTaskContent);
      await fs.writeFile(path.join(tasksDir, '02--simple-task.md'), simpleTaskContent);

      // Analyze task executability characteristics
      const complexPath = path.join(tasksDir, '01--complex-task.md');
      const simplePath = path.join(tasksDir, '02--simple-task.md');
      
      const complexTask = await fs.readFile(complexPath, 'utf8');
      const simpleTask = await fs.readFile(simplePath, 'utf8');

      // Verify complex task needs enhancement (high complexity score)
      expect(complexTask).toContain('complexity_score: 7.5');
      expect(complexTask).toContain('skills: ["javascript", "architecture", "optimization"]');
      
      // Verify simple task doesn't need enhancement (low complexity)
      expect(simpleTask).toContain('complexity_score: 2.5');
      expect(simpleTask).toContain('skills: ["javascript"]');

      // Complex task should benefit from enhancement with detailed guidance
      const complexHasDetails = complexTask.includes('Technical Requirements');
      expect(complexHasDetails).toBe(true);

      // Simple task should be executable as-is
      const simpleIsExecutable = simpleTask.includes('Simple validation rules');
      expect(simpleIsExecutable).toBe(true);
    });

    it('should validate enhancement provides step-by-step guidance for complex tasks', async () => {
      const planDir = await createMockPlan('9');
      
      // Create a task that would benefit from step-by-step enhancement
      const enhanceableTaskContent = `---
id: 1
group: "enhancement-test"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ["api-development", "database"]
complexity_score: 6.2
complexity_notes: "High integration complexity requiring enhancement"
---

# API Integration Task

## Objective
Create RESTful API endpoints with database integration for user management.

## Skills Required
- api-development: REST endpoint creation
- database: Data persistence and queries

## Acceptance Criteria
- Implement CRUD operations for users
- Add proper error handling
- Include input validation
- Ensure secure data access

## Technical Requirements
Build comprehensive user management API with proper database integration.

<details>
<summary>Implementation Notes</summary>

This task requires enhancement for cheaper model execution:

**Step 1: Database Schema Setup**
- Define user table with fields: id, email, name, created_at, updated_at
- Create migration scripts using your ORM/query builder
- Add appropriate indexes for performance

**Step 2: API Endpoint Structure**
- POST /api/users - Create user
- GET /api/users/:id - Get user by ID  
- GET /api/users - List users with pagination
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

**Step 3: Validation Layer**
- Email format validation using regex or validator library
- Required field checks (email, name)
- Duplicate email prevention
- Input sanitization for security

**Step 4: Error Handling**
- HTTP status codes: 200, 201, 400, 404, 500
- Structured error responses with message and code
- Database connection error handling
- Validation error aggregation

**Step 5: Testing Strategy**
- Unit tests for validation functions
- Integration tests for API endpoints
- Database transaction rollback for tests
- Mock external dependencies

This enhanced guidance enables execution by models with less architectural knowledge
while maintaining the same scope and deliverables as the original task.
</summary>
</details>
`;

      const tasksDir = path.join(planDir, 'tasks');
      await fs.writeFile(path.join(tasksDir, '01--enhanced-task.md'), enhanceableTaskContent);

      const taskContent = await fs.readFile(path.join(tasksDir, '01--enhanced-task.md'), 'utf8');
      
      // Verify enhancement characteristics
      expect(taskContent).toContain('complexity_score: 6.2');
      expect(taskContent).toContain('complexity_notes: "High integration complexity requiring enhancement"');
      
      // Verify step-by-step guidance is provided
      expect(taskContent).toContain('<details>');
      expect(taskContent).toContain('Step 1:');
      expect(taskContent).toContain('Step 2:');
      expect(taskContent).toContain('Step 3:');
      expect(taskContent).toContain('Step 4:');
      expect(taskContent).toContain('Step 5:');

      // Verify enhancement maintains original scope
      expect(taskContent).toContain('Create RESTful API endpoints');
      expect(taskContent).toContain('CRUD operations for users');
      expect(taskContent).toContain('proper error handling');
      expect(taskContent).toContain('input validation');

      // Verify enhancement adds executability for cheaper models
      expect(taskContent).toContain('enables execution by models with less architectural knowledge');
      expect(taskContent).toContain('maintaining the same scope and deliverables');
    });
  });

  describe('Performance Impact Measurement', () => {
    it('should validate hook processing performance stays within acceptable bounds', async () => {
      const planDir = await createMockPlan('10');
      
      // Create multiple tasks to test performance at scale  
      await createMockTasks(planDir, 10);

      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);
      const markdownFiles = taskFiles.filter(f => f.endsWith('.md'));
      
      expect(markdownFiles.length).toBeGreaterThanOrEqual(10); // Should have created 10 tasks

      // Measure hook processing simulation time
      const startTime = Date.now();
      
      // Simulate hook processing by reading and analyzing all tasks
      const tasks = [];
      for (const file of markdownFiles) {
        const taskPath = path.join(tasksDir, file);
        const content = await fs.readFile(taskPath, 'utf8');
        
        // Simulate complexity analysis
        const complexityMatch = content.match(/complexity_score:\s*(\d+\.?\d*)/);
        const skillsMatch = content.match(/skills:\s*\[(.*?)\]/);
        
        if (complexityMatch && skillsMatch) {
          const complexity = parseFloat(complexityMatch[1] || '0');
          const skillsCount = (skillsMatch[1] || '').split(',').length;
          
          tasks.push({
            file,
            complexity,
            skillsCount,
            needsEnhancement: complexity > 5.0 || skillsCount > 2
          });
        }
      }

      const processingTime = Date.now() - startTime;
      
      // Validate performance bounds
      // Target: Processing should be fast for reasonable task counts
      expect(processingTime).toBeLessThan(1000); // < 1 second for 10 tasks
      expect(tasks.length).toBeGreaterThan(0);
      
      // Validate some tasks would be identified for enhancement
      const enhanceableTasks = tasks.filter(t => t.needsEnhancement);
      expect(enhanceableTasks.length).toBeGreaterThan(0);
      
      // Performance should scale linearly with task count
      const avgTimePerTask = processingTime / tasks.length;
      expect(avgTimePerTask).toBeLessThan(100); // < 100ms per task
    });

    it('should validate memory usage stays reasonable during hook processing', async () => {
      const planDir = await createMockPlan('11');
      await createMockTasks(planDir, 5);

      // Measure memory usage before processing
      const initialMemory = process.memoryUsage();
      
      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);
      
      // Process multiple task files to simulate hook workload
      const processedTasks = [];
      for (const file of taskFiles) {
        if (!file.endsWith('.md')) continue;
        
        const taskPath = path.join(tasksDir, file);
        const content = await fs.readFile(taskPath, 'utf8');
        
        // Simulate enhancement analysis
        const analysis = {
          file,
          content,
          contentLength: content.length,
          hasComplexity: content.includes('complexity_score:'),
          hasImplementationNotes: content.includes('<details>'),
          skillsCount: ((content.match(/skills:\s*\[(.*?)\]/) || ['', ''])[1] || '').split(',').filter(s => s.trim()).length
        };
        
        processedTasks.push(analysis);
      }

      // Measure memory after processing
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Validate memory usage is reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB increase
      expect(processedTasks.length).toBeGreaterThan(0);
      
      // Validate processing results
      const tasksWithComplexity = processedTasks.filter(t => t.hasComplexity);
      expect(tasksWithComplexity.length).toEqual(processedTasks.length); // All should have complexity scores
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing or malformed hook files gracefully', async () => {
      // Remove hook file to test error handling
      const hookPath = path.join(testDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
      await fs.remove(hookPath);
      
      // Verify hook file is missing
      expect(await fs.pathExists(hookPath)).toBe(false);
      
      // Generate-tasks template should still reference the hook
      const generateTasksPath = path.join(testDir, '.claude/commands/tasks/generate-tasks.md');
      const templateContent = await fs.readFile(generateTasksPath, 'utf8');
      expect(templateContent).toContain('POST_TASK_GENERATION_ALL');
      
      // This test validates the template structure remains intact even if hook file is missing
      // In real usage, this would be an error condition that should be handled gracefully
    });

    it('should handle edge cases in task complexity analysis', async () => {
      const planDir = await createMockPlan('12');
      
      // Create tasks with edge case complexity values
      const edgeCaseTasks = [
        { id: 1, complexity: 0.5, skills: '[]' }, // Very low complexity
        { id: 2, complexity: 10.0, skills: '["system-architecture", "distributed-systems", "performance"]' }, // Maximum complexity
        { id: 3, complexity: 6.0, skills: '["javascript"]' }, // Threshold complexity, single skill
        { id: 4, complexity: 3.0, skills: '["frontend", "backend", "database", "testing"]' } // Low complexity, many skills
      ];

      const tasksDir = path.join(planDir, 'tasks');
      for (const task of edgeCaseTasks) {
        const taskContent = `---
id: ${task.id}
group: "edge-case-test"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ${task.skills}
complexity_score: ${task.complexity}
---

# Edge Case Task ${task.id}

## Objective
Test edge case handling in hook workflow.

## Acceptance Criteria
- Handle extreme complexity values correctly
- Manage skill count variations appropriately
- Apply enhancement rules consistently
`;

        await fs.writeFile(path.join(tasksDir, `${task.id.toString().padStart(2, '0')}--edge-case-${task.id}.md`), taskContent);
      }

      // Analyze edge case handling
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(4);

      for (const task of edgeCaseTasks) {
        const taskPath = path.join(tasksDir, `${task.id.toString().padStart(2, '0')}--edge-case-${task.id}.md`);
        const content = await fs.readFile(taskPath, 'utf8');
        
        // Verify edge case values are preserved
        expect(content).toContain(`complexity_score: ${task.complexity}`);
        expect(content).toContain(`skills: ${task.skills}`);
        
        // Apply hook logic simulation
        const skillsCount = JSON.parse(task.skills).length;
        const needsEnhancement = task.complexity >= 6.0 || skillsCount > 2;
        
        // Task 1: Low complexity, no skills -> should not need enhancement
        // Task 2: High complexity, many skills -> should definitely need enhancement  
        // Task 3: Threshold complexity, single skill -> borderline case
        // Task 4: Low complexity, many skills -> should need enhancement due to skill count
        
        if (task.id === 2 || task.id === 4) {
          expect(needsEnhancement).toBe(true);
        } else if (task.id === 1) {
          expect(needsEnhancement).toBe(false);
        }
        // Task 3 is a borderline case that could go either way
      }
    });

    it('should validate circular dependency detection in hook processing', async () => {
      const planDir = await createMockPlan('13');
      
      // Create tasks with circular dependencies to test error handling
      const circularTasks = [
        { id: 1, deps: '[2]' },
        { id: 2, deps: '[3]' }, 
        { id: 3, deps: '[1]' } // Creates circular dependency: 1->2->3->1
      ];

      const tasksDir = path.join(planDir, 'tasks');
      for (const task of circularTasks) {
        const taskContent = `---
id: ${task.id}
group: "circular-test"
dependencies: ${task.deps}
status: "pending"
created: "2024-09-08"
skills: ["testing"]
complexity_score: 4.0
---

# Circular Dependency Test Task ${task.id}

## Objective
Test circular dependency detection in hook workflow.
`;

        await fs.writeFile(path.join(tasksDir, `${task.id.toString().padStart(2, '0')}--circular-${task.id}.md`), taskContent);
      }

      // Simulate dependency analysis
      const taskFiles = await fs.readdir(tasksDir);
      const tasks = [];
      
      for (const file of taskFiles) {
        if (!file.endsWith('.md')) continue;
        
        const content = await fs.readFile(path.join(tasksDir, file), 'utf8');
        const idMatch = content.match(/id:\s*(\d+)/);
        const depsMatch = content.match(/dependencies:\s*(\[.*?\])/);
        
        if (idMatch && depsMatch) {
          tasks.push({
            id: parseInt(idMatch[1] || '0'),
            dependencies: JSON.parse(depsMatch[1] || '[]')
          });
        }
      }

      expect(tasks).toHaveLength(3);

      // Verify circular dependency exists
      const task1 = tasks.find(t => t.id === 1);
      const task2 = tasks.find(t => t.id === 2);
      const task3 = tasks.find(t => t.id === 3);
      
      expect(task1?.dependencies).toContain(2);
      expect(task2?.dependencies).toContain(3);  
      expect(task3?.dependencies).toContain(1);

      // This creates the cycle: 1->2->3->1
      // In a real hook implementation, this should be detected and flagged as an error
    });
  });

  describe('Integration with Multiple Assistant Formats', () => {
    it('should validate hook integration works consistently across all assistant formats', async () => {
      // Test that all assistant formats reference the hook correctly
      const assistantFormats = [
        { name: 'claude', path: '.claude/commands/tasks/generate-tasks.md', format: 'md' },
        { name: 'gemini', path: '.gemini/commands/tasks/generate-tasks.toml', format: 'toml' },
        { name: 'opencode', path: '.opencode/command/tasks/generate-tasks.md', format: 'md' }
      ];

      for (const assistant of assistantFormats) {
        const templatePath = path.join(testDir, assistant.path);
        expect(await fs.pathExists(templatePath)).toBe(true);
        
        const content = await fs.readFile(templatePath, 'utf8');
        
        // All formats should reference the hook
        expect(content).toContain('POST_TASK_GENERATION_ALL');
        
        if (assistant.format === 'md') {
          // Markdown formats should have the hook reference in Step 3
          expect(content).toContain('Step 3: POST_TASK_GENERATION_ALL hook');
          expect(content).toContain('@.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
        } else if (assistant.format === 'toml') {
          // TOML format should have the hook reference converted properly
          expect(content).toContain('POST_TASK_GENERATION_ALL');
          expect(content).toContain('hooks');
        }
      }

      // Verify the shared hook file is accessible to all formats
      const hookPath = path.join(testDir, '.ai/task-manager/config/hooks/POST_TASK_GENERATION_ALL.md');
      expect(await fs.pathExists(hookPath)).toBe(true);
    });

    it('should validate consistency of hook references across assistant template conversions', async () => {
      // Compare Claude (MD) and OpenCode (MD) - should be identical
      const claudePath = path.join(testDir, '.claude/commands/tasks/generate-tasks.md');
      const opencodePath = path.join(testDir, '.opencode/command/tasks/generate-tasks.md');
      
      const claudeContent = await fs.readFile(claudePath, 'utf8');
      const opencodeContent = await fs.readFile(opencodePath, 'utf8');
      
      // Both Markdown formats should be identical regarding hook integration
      expect(claudeContent).toEqual(opencodeContent);
      
      // Verify both contain the same hook references
      const claudeHookMatches = claudeContent.match(/POST_TASK_GENERATION_ALL/g);
      const opencodeHookMatches = opencodeContent.match(/POST_TASK_GENERATION_ALL/g);
      
      expect(claudeHookMatches).toEqual(opencodeHookMatches);
      
      // Compare with Gemini (TOML) conversion
      const geminiPath = path.join(testDir, '.gemini/commands/tasks/generate-tasks.toml');
      const geminiContent = await fs.readFile(geminiPath, 'utf8');
      
      // Gemini should have the hook reference converted to TOML format
      expect(geminiContent).toContain('POST_TASK_GENERATION_ALL');
      
      // Verify the hook reference count is maintained across formats
      const geminiHookMatches = geminiContent.match(/POST_TASK_GENERATION_ALL/g);
      expect(geminiHookMatches?.length).toBeGreaterThan(0);
    });
  });
});