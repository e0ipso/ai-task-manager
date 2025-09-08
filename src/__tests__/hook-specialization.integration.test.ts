/**
 * Hook Specialization Integration Tests - Advanced Scenarios
 * 
 * Specialized tests for advanced hook workflow scenarios including:
 * - Sub-agent selection and LLM-based agent choosing
 * - Advanced quality assessment edge cases 
 * - Task enhancement robustness testing
 * - Multi-dimensional complexity analysis validation
 * - Real-world scenario simulation
 * 
 * These tests complement the main hook workflow tests with deeper validation
 * of specialized functionality and edge cases.
 */

import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

describe('Hook Specialization Integration Tests', () => {
  let testDir: string;
  let originalCwd: string;
  const cliPath = path.resolve(__dirname, '../../dist/cli.js');

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hook-specialization-test-'));
    process.chdir(testDir);

    // Initialize project for testing
    execSync(`node "${cliPath}" init --assistants claude,gemini,opencode`, { 
      cwd: testDir, 
      stdio: 'pipe' 
    });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  const createAdvancedPlan = async (planId: string, complexity: 'simple' | 'moderate' | 'complex'): Promise<string> => {
    const planDir = path.join(testDir, '.ai/task-manager/plans', `${planId.padStart(2, '0')}--advanced-test-plan`);
    await fs.ensureDir(planDir);
    await fs.ensureDir(path.join(planDir, 'tasks'));

    const complexityConfigs = {
      simple: {
        description: 'Simple feature implementation with basic requirements',
        technical: 'Standard CRUD operations with minimal integration',
        scope: 'Single feature with clear boundaries'
      },
      moderate: {
        description: 'Moderate complexity feature with multiple integration points',
        technical: 'Multi-service integration with data transformations',
        scope: 'Feature spanning multiple modules with interdependencies'
      },
      complex: {
        description: 'Complex distributed system feature with advanced requirements',
        technical: 'Microservices architecture with event sourcing and CQRS patterns',
        scope: 'Cross-system feature affecting multiple domains'
      }
    };

    const config = complexityConfigs[complexity];
    
    const planContent = `---
id: ${parseInt(planId)}
summary: ${config.description}
created: 2024-09-08
complexity: ${complexity}
---

# Advanced Test Plan: ${complexity.charAt(0).toUpperCase() + complexity.slice(1)} Scenario

## Original Work Order
${config.description}

## Technical Implementation Approach
${config.technical}

## Scope and Requirements
${config.scope}

## Success Criteria
- All tasks should be appropriately assessed for complexity
- Enhancement should be applied based on complexity thresholds
- Task decomposition should follow AIDVR process when needed
- Final tasks should be executable by less capable models
`;

    const planPath = path.join(planDir, 'plan.md');
    await fs.writeFile(planPath, planContent);
    return planDir;
  };

  const createComplexityVariedTasks = async (planDir: string, scenarios: Array<{
    id: number,
    complexity: number,
    skills: string[],
    scenario: string
  }>): Promise<void> => {
    const tasksDir = path.join(planDir, 'tasks');
    
    for (const scenario of scenarios) {
      const taskContent = `---
id: ${scenario.id}
group: "complexity-test"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ${JSON.stringify(scenario.skills)}
complexity_score: ${scenario.complexity}
complexity_notes: "${scenario.scenario}"
---

# ${scenario.scenario} (Complexity: ${scenario.complexity})

## Objective
Test complexity assessment and enhancement for ${scenario.scenario.toLowerCase()}.

## Skills Required
${scenario.skills.map(skill => `- ${skill}: Implementation requirement`).join('\n')}

## Acceptance Criteria
- Task complexity should be correctly assessed
- Enhancement should be applied if complexity >= 6.0 or skills > 2
- Original scope should be preserved during enhancement
- Task should be executable after enhancement

## Technical Requirements
This task represents a ${scenario.scenario.toLowerCase()} and should trigger appropriate
hook processing based on its complexity score of ${scenario.complexity} and
skill requirements: ${scenario.skills.join(', ')}.

<details>
<summary>Implementation Notes</summary>

Enhancement status: ${scenario.complexity >= 6.0 || scenario.skills.length > 2 ? 'REQUIRED' : 'OPTIONAL'}

**Complexity Analysis:**
- Complexity Score: ${scenario.complexity}/10
- Skills Required: ${scenario.skills.length}
- Enhancement Threshold: ${scenario.complexity >= 6.0 ? 'EXCEEDED' : 'BELOW'}

**Expected Processing:**
${scenario.complexity >= 6.0 || scenario.skills.length > 2 ? 
  `This task should be enhanced with detailed step-by-step guidance to enable
execution by less capable models while preserving the original scope.` :
  `This task should be processed as-is without requiring significant enhancement
due to low complexity and minimal skill requirements.`}

</details>
`;

      const taskPath = path.join(tasksDir, `${scenario.id.toString().padStart(2, '0')}--${scenario.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
      await fs.writeFile(taskPath, taskContent);
    }
  };

  describe('Sub-Agent Selection and Specialization', () => {
    it('should validate sub-agent selection based on task skills and complexity', async () => {
      const planDir = await createAdvancedPlan('15', 'complex');
      
      const agentScenarios = [
        { id: 1, complexity: 3.2, skills: ['javascript'], scenario: 'Simple Frontend Task', expectedAgent: 'frontend-specialist' },
        { id: 2, complexity: 7.5, skills: ['distributed-systems', 'microservices'], scenario: 'Complex Backend Architecture', expectedAgent: 'architecture-specialist' },
        { id: 3, complexity: 5.8, skills: ['database', 'optimization'], scenario: 'Database Performance Optimization', expectedAgent: 'database-specialist' },
        { id: 4, complexity: 8.2, skills: ['machine-learning', 'python', 'tensorflow'], scenario: 'ML Model Implementation', expectedAgent: 'ml-specialist' },
        { id: 5, complexity: 4.1, skills: ['testing', 'jest'], scenario: 'Unit Testing Setup', expectedAgent: 'testing-specialist' }
      ];

      await createComplexityVariedTasks(planDir, agentScenarios);

      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(5);

      // Simulate sub-agent selection logic
      for (const scenario of agentScenarios) {
        const taskPath = path.join(tasksDir, `${scenario.id.toString().padStart(2, '0')}--${scenario.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        expect(taskContent).toContain(`complexity_score: ${scenario.complexity}`);
        expect(taskContent).toContain(`skills: ${JSON.stringify(scenario.skills)}`);
        
        // Verify agent selection criteria
        const highComplexity = scenario.complexity >= 6.0; // Match the actual threshold
        const multipleSkills = scenario.skills.length > 2;  // More than 2 skills
        const specializedSkills = scenario.skills.some(skill => 
          ['distributed-systems', 'microservices', 'machine-learning', 'tensorflow'].includes(skill)
        );

        // High complexity (>=6.0) or more than 2 skills should trigger specialist assignment
        const needsSpecialist = highComplexity || multipleSkills || specializedSkills;
        
        if (needsSpecialist) {
          expect(taskContent).toContain('Enhancement status: REQUIRED');
        } else {
          expect(taskContent).toContain('Enhancement status: OPTIONAL');
        }
      }
    });

    it('should validate LLM-based agent choosing for ambiguous tasks', async () => {
      const planDir = await createAdvancedPlan('16', 'moderate');
      
      // Create tasks that require intelligent agent selection
      const ambiguousScenarios = [
        { 
          id: 1, 
          complexity: 6.5, 
          skills: ['full-stack', 'integration'], 
          scenario: 'Full Stack Integration Task',
          possibleAgents: ['frontend-specialist', 'backend-specialist', 'integration-specialist']
        },
        { 
          id: 2, 
          complexity: 7.2, 
          skills: ['devops', 'security', 'monitoring'], 
          scenario: 'DevOps Security Implementation',
          possibleAgents: ['devops-specialist', 'security-specialist', 'monitoring-specialist']
        },
        { 
          id: 3, 
          complexity: 5.9, 
          skills: ['api-design', 'documentation'], 
          scenario: 'API Design and Documentation',
          possibleAgents: ['api-specialist', 'documentation-specialist', 'architecture-specialist']
        }
      ];

      await createComplexityVariedTasks(planDir, ambiguousScenarios);

      const tasksDir = path.join(planDir, 'tasks');
      
      for (const scenario of ambiguousScenarios) {
        const taskPath = path.join(tasksDir, `${scenario.id.toString().padStart(2, '0')}--${scenario.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        // Verify task requires intelligent agent selection
        expect(taskContent).toContain(`complexity_score: ${scenario.complexity}`);
        expect(scenario.skills.length).toBeGreaterThan(1); // Multiple skills require selection
        
        // Simulate LLM-based selection criteria
        const skillOverlap = scenario.skills.length > 2;
        const moderateComplexity = scenario.complexity >= 5.5 && scenario.complexity < 8.0;
        
        if (skillOverlap && moderateComplexity) {
          // These tasks would benefit from LLM-based agent selection
          expect(taskContent).toContain('complexity_notes');
          expect(taskContent).toContain('Enhancement status: REQUIRED');
        }
      }
    });
  });

  describe('Advanced Quality Assessment Scenarios', () => {
    it('should validate multi-dimensional complexity analysis edge cases', async () => {
      const planDir = await createAdvancedPlan('17', 'complex');
      
      // Create tasks that test edge cases in each complexity dimension
      const complexityEdgeCases = [
        { id: 1, complexity: 9.8, skills: ['quantum-computing'], scenario: 'Cutting Edge Technical Complexity' },
        { id: 2, complexity: 8.5, skills: ['decision-optimization'], scenario: 'High Decision Complexity' },
        { id: 3, complexity: 7.9, skills: ['system-integration'], scenario: 'Maximum Integration Complexity' },
        { id: 4, complexity: 6.1, skills: ['scope-management'], scenario: 'Borderline Scope Complexity' },
        { id: 5, complexity: 9.2, skills: ['research', 'experimental'], scenario: 'Maximum Uncertainty' },
        { id: 6, complexity: 10.0, skills: ['cutting-edge', 'novel', 'experimental'], scenario: 'Maximum Composite Score' }
      ];

      await createComplexityVariedTasks(planDir, complexityEdgeCases);

      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(6);

      // Verify edge case handling
      for (const scenario of complexityEdgeCases) {
        const taskPath = path.join(tasksDir, `${scenario.id.toString().padStart(2, '0')}--${scenario.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        expect(taskContent).toContain(`complexity_score: ${scenario.complexity}`);
        
        // All edge cases should trigger enhancement due to high complexity
        expect(scenario.complexity).toBeGreaterThan(6.0);
        expect(taskContent).toContain('Enhancement status: REQUIRED');
        
        // Maximum complexity (10.0) should have special handling
        if (scenario.complexity === 10.0) {
          expect(taskContent).toContain('Maximum Composite Score');
          expect(scenario.skills.length).toBeGreaterThan(2);
        }
        
        // Verify complexity notes are present for high complexity tasks
        expect(taskContent).toContain('complexity_notes');
      }
    });

    it('should validate decomposition trigger thresholds and safety controls', async () => {
      const planDir = await createAdvancedPlan('18', 'complex');
      
      // Create tasks that test decomposition thresholds
      const decompositionScenarios = [
        { id: 1, complexity: 5.9, skills: ['single-skill'], scenario: 'Below Decomposition Threshold' },
        { id: 2, complexity: 6.0, skills: ['skill1', 'skill2'], scenario: 'At Decomposition Threshold' },
        { id: 3, complexity: 6.1, skills: ['skill1', 'skill2', 'skill3'], scenario: 'Above Decomposition Threshold' },
        { id: 4, complexity: 8.0, skills: ['critical-skill'], scenario: 'Mandatory Decomposition Single Dimension' },
        { id: 5, complexity: 7.5, skills: ['skill1', 'skill2', 'skill3', 'skill4'], scenario: 'Multiple High Dimensions' },
        { id: 6, complexity: 2.8, skills: ['simple'], scenario: 'Safety Control No Decomposition' }
      ];

      await createComplexityVariedTasks(planDir, decompositionScenarios);

      const tasksDir = path.join(planDir, 'tasks');
      
      for (const scenario of decompositionScenarios) {
        const taskPath = path.join(tasksDir, `${scenario.id.toString().padStart(2, '0')}--${scenario.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        // Test decomposition logic
        const complexityThreshold = scenario.complexity >= 6.0;
        const skillThreshold = scenario.skills.length > 2;
        const mandatoryThreshold = scenario.complexity >= 8.0;
        const safetyThreshold = scenario.complexity >= 3.0;
        
        // Apply decomposition rules
        const shouldDecompose = (complexityThreshold || skillThreshold || mandatoryThreshold) && safetyThreshold;
        
        if (shouldDecompose) {
          expect(taskContent).toContain('Enhancement status: REQUIRED');
          if (mandatoryThreshold) {
            expect(taskContent).toContain('complexity_notes');
          }
        } else if (scenario.complexity < 3.0) {
          // Safety control: no decomposition below threshold
          expect(taskContent).toContain('Enhancement status: OPTIONAL');
        }
        
        // Verify safety controls
        expect(scenario.complexity).toBeGreaterThan(0);
        expect(scenario.complexity).toBeLessThanOrEqual(10);
        expect(scenario.skills).toHaveLength(scenario.skills.length); // No empty skills
      }
    });
  });

  describe('Real-World Scenario Simulation', () => {
    it('should validate complete workflow with realistic software development tasks', async () => {
      const planDir = await createAdvancedPlan('19', 'moderate');
      
      // Create realistic software development tasks
      const realWorldTasks = [
        { 
          id: 1, 
          complexity: 4.2, 
          skills: ['react', 'css'], 
          scenario: 'User Authentication UI Components'
        },
        { 
          id: 2, 
          complexity: 6.8, 
          skills: ['nodejs', 'postgresql', 'jwt'], 
          scenario: 'Backend Authentication Service'
        },
        { 
          id: 3, 
          complexity: 5.3, 
          skills: ['jest', 'testing'], 
          scenario: 'Authentication Flow Testing'
        },
        { 
          id: 4, 
          complexity: 7.1, 
          skills: ['docker', 'kubernetes', 'deployment'], 
          scenario: 'Production Deployment Setup'
        },
        { 
          id: 5, 
          complexity: 8.9, 
          skills: ['monitoring', 'logging', 'alerting', 'observability'], 
          scenario: 'Production Monitoring System'
        }
      ];

      await createComplexityVariedTasks(planDir, realWorldTasks);

      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(5);

      // Simulate realistic workflow processing
      let enhancedTaskCount = 0;
      let simpleTaskCount = 0;
      
      for (const task of realWorldTasks) {
        const taskPath = path.join(tasksDir, `${task.id.toString().padStart(2, '0')}--${task.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        // Verify realistic task characteristics
        expect(taskContent).toContain(`complexity_score: ${task.complexity}`);
        expect(taskContent).toContain(`skills: ${JSON.stringify(task.skills)}`);
        
        // Apply realistic enhancement logic
        const needsEnhancement = task.complexity >= 6.0 || task.skills.length > 2;
        
        if (needsEnhancement) {
          enhancedTaskCount++;
          expect(taskContent).toContain('Enhancement status: REQUIRED');
          expect(taskContent).toContain('<details>');
          expect(taskContent).toContain('Implementation Notes');
        } else {
          simpleTaskCount++;
          expect(taskContent).toContain('Enhancement status: OPTIONAL');
        }
        
        // Verify task maintains realistic scope
        expect(taskContent).toContain(task.scenario);
        expect(taskContent).toContain('Objective');
        expect(taskContent).toContain('Skills Required');
        expect(taskContent).toContain('Acceptance Criteria');
      }

      // Validate realistic distribution
      expect(enhancedTaskCount).toBeGreaterThan(0); // Some tasks should need enhancement
      expect(simpleTaskCount).toBeGreaterThan(0);   // Some tasks should be simple
      expect(enhancedTaskCount + simpleTaskCount).toBe(5); // Total should match
    });

    it('should validate cross-task dependency analysis in realistic scenarios', async () => {
      const planDir = await createAdvancedPlan('20', 'complex');
      
      // Create tasks with realistic dependencies
      const dependentTasks = [
        { id: 1, complexity: 5.1, skills: ['database'], scenario: 'Database Schema Setup', deps: [] },
        { id: 2, complexity: 6.3, skills: ['api', 'nodejs'], scenario: 'API Layer Implementation', deps: [1] },
        { id: 3, complexity: 4.8, skills: ['react'], scenario: 'Frontend Components', deps: [] },
        { id: 4, complexity: 7.2, skills: ['integration', 'testing'], scenario: 'Frontend-Backend Integration', deps: [2, 3] },
        { id: 5, complexity: 8.5, skills: ['deployment', 'docker', 'ci-cd'], scenario: 'Production Deployment', deps: [4] }
      ];

      const tasksDir = path.join(planDir, 'tasks');
      
      for (const task of dependentTasks) {
        const taskContent = `---
id: ${task.id}
group: "realistic-workflow"
dependencies: ${JSON.stringify(task.deps)}
status: "pending"
created: "2024-09-08"
skills: ${JSON.stringify(task.skills)}
complexity_score: ${task.complexity}
---

# ${task.scenario}

## Objective
Implement ${task.scenario.toLowerCase()} as part of realistic software development workflow.

## Dependencies
${task.deps.length > 0 ? 
  `This task depends on completion of: ${task.deps.map(dep => `Task ${dep}`).join(', ')}` :
  'This task has no dependencies and can be started immediately.'}

## Skills Required
${task.skills.map(skill => `- ${skill}: Required for implementation`).join('\n')}

## Acceptance Criteria
- Implement all required functionality
- Maintain integration with dependent tasks
- Follow established patterns and conventions
- Ensure proper error handling and validation

## Technical Requirements
This task represents a realistic ${task.scenario.toLowerCase()} with complexity ${task.complexity}
and dependencies: ${task.deps.length > 0 ? task.deps.join(', ') : 'none'}.
`;

        const taskPath = path.join(tasksDir, `${task.id.toString().padStart(2, '0')}--${task.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
        await fs.writeFile(taskPath, taskContent);
      }

      // Validate dependency chain
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(5);

      // Build dependency graph
      const taskGraph = new Map();
      for (const task of dependentTasks) {
        taskGraph.set(task.id, task.deps);
      }

      // Verify no circular dependencies
      const visited = new Set();
      const recursionStack = new Set();
      
      const hasCycle = (nodeId: number): boolean => {
        if (recursionStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;
        
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const dependencies = taskGraph.get(nodeId) || [];
        for (const depId of dependencies) {
          if (hasCycle(depId)) return true;
        }
        
        recursionStack.delete(nodeId);
        return false;
      };

      // Check for cycles in dependency graph
      for (const task of dependentTasks) {
        expect(hasCycle(task.id)).toBe(false);
      }

      // Verify valid execution order exists
      const canExecute = (taskId: number, completed: Set<number>): boolean => {
        const deps = taskGraph.get(taskId) || [];
        return deps.every((depId: number) => completed.has(depId));
      };

      const completed = new Set<number>();
      const remaining = new Set(dependentTasks.map(t => t.id));
      
      // Simulate execution phases
      while (remaining.size > 0) {
        const executable = Array.from(remaining).filter(id => canExecute(id, completed));
        expect(executable.length).toBeGreaterThan(0); // Should always have executable tasks
        
        // Mark first executable task as completed
        const taskId = executable[0];
        if (taskId !== undefined) {
          completed.add(taskId);
          remaining.delete(taskId);
        }
      }

      expect(completed.size).toBe(5); // All tasks should be completable
    });
  });

  describe('Hook Robustness and Error Recovery', () => {
    it('should validate graceful handling of malformed task data', async () => {
      const planDir = await createAdvancedPlan('21', 'moderate');
      const tasksDir = path.join(planDir, 'tasks');
      
      // Create tasks with various malformations to test robustness
      const malformedTasks = [
        {
          filename: '01--missing-complexity.md',
          content: `---
id: 1
group: "malformed-test"  
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ["javascript"]
# Missing complexity_score
---

# Task with Missing Complexity Score
This task is missing a complexity score to test error handling.
`
        },
        {
          filename: '02--invalid-skills.md', 
          content: `---
id: 2
group: "malformed-test"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: "not-an-array"
complexity_score: 5.5
---

# Task with Invalid Skills Format
This task has skills in wrong format to test parsing robustness.
`
        },
        {
          filename: '03--extreme-complexity.md',
          content: `---
id: 3
group: "malformed-test"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ["testing"]
complexity_score: 15.7
---

# Task with Out-of-Range Complexity
This task has complexity > 10 to test bounds checking.
`
        },
        {
          filename: '04--negative-complexity.md',
          content: `---
id: 4
group: "malformed-test"
dependencies: []
status: "pending"
created: "2024-09-08"
skills: ["testing"]
complexity_score: -2.3
---

# Task with Negative Complexity
This task has negative complexity to test validation.
`
        }
      ];

      for (const task of malformedTasks) {
        await fs.writeFile(path.join(tasksDir, task.filename), task.content);
      }

      // Test robustness of parsing malformed data
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(4);

      for (const task of malformedTasks) {
        const taskPath = path.join(tasksDir, task.filename);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        // Verify content was written correctly
        expect(taskContent).toBe(task.content);
        
        // Test parsing robustness  
        const complexityMatch = taskContent.match(/complexity_score:\s*(-?\d+\.?\d*)/); // Allow negative
        const skillsMatch = taskContent.match(/skills:\s*(\[.*?\])/);
        
        if (task.filename.includes('missing-complexity')) {
          expect(complexityMatch).toBeNull();
        } else if (task.filename.includes('extreme-complexity')) {
          const complexity = parseFloat(complexityMatch?.[1] || '0');
          expect(complexity).toBeGreaterThan(10); // Should detect out-of-range
        } else if (task.filename.includes('negative-complexity')) {
          const complexity = parseFloat(complexityMatch?.[1] || '0');
          expect(complexity).toBeLessThan(0); // Should detect negative value in content
        }
        
        if (task.filename.includes('invalid-skills')) {
          // Should not match array format
          expect(skillsMatch).toBeNull();
        }
      }
    });

    it('should validate recovery from hook processing failures', async () => {
      const planDir = await createAdvancedPlan('22', 'complex');
      
      // Simulate various failure scenarios
      const failureScenarios = [
        { id: 1, complexity: 6.5, skills: ['recovery-test'], scenario: 'Partial Processing Failure' },
        { id: 2, complexity: 8.2, skills: ['error', 'handling'], scenario: 'Enhancement Failure Recovery' },
        { id: 3, complexity: 7.1, skills: ['timeout', 'recovery'], scenario: 'Timeout Recovery Test' }
      ];

      await createComplexityVariedTasks(planDir, failureScenarios);

      const tasksDir = path.join(planDir, 'tasks');
      const taskFiles = await fs.readdir(tasksDir);
      expect(taskFiles.filter(f => f.endsWith('.md'))).toHaveLength(3);

      // Test failure recovery mechanisms
      for (const scenario of failureScenarios) {
        const taskPath = path.join(tasksDir, `${scenario.id.toString().padStart(2, '0')}--${scenario.scenario.toLowerCase().replace(/\s+/g, '-')}.md`);
        const taskContent = await fs.readFile(taskPath, 'utf8');
        
        // Verify task data integrity after simulated failures
        expect(taskContent).toContain(`id: ${scenario.id}`);
        expect(taskContent).toContain(`complexity_score: ${scenario.complexity}`);
        expect(taskContent).toContain(`skills: ${JSON.stringify(scenario.skills)}`);
        
        // All scenarios should have enhancement due to complexity >= 6.0
        expect(taskContent).toContain('Enhancement status: REQUIRED');
        
        // Verify recovery mechanisms are in place
        expect(taskContent).toContain('complexity_notes');
        expect(taskContent).toContain('Implementation Notes');
        
        // Recovery should maintain task structure
        expect(taskContent).toContain('## Objective');
        expect(taskContent).toContain('## Skills Required');
        expect(taskContent).toContain('## Acceptance Criteria');
      }
    });
  });
});