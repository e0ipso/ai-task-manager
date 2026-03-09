/**
 * Claude Exec Command Module
 *
 * Validates and executes multiple plans sequentially using the Claude Agent SDK.
 * Performs pre-flight validation and auto-remediation before execution.
 */

import * as fs from 'fs-extra';
import chalk from 'chalk';
import { findPlanById, PlanLocation } from './plan-utils';
import { parseTaskFiles } from './status';
import { CommandResult } from './types';

interface PlanValidation {
  planId: number;
  location: PlanLocation;
  taskCount: number;
  hasBlueprintSection: boolean;
  needsRemediation: boolean;
}

/**
 * Check if a plan file contains an Execution Blueprint section
 */
async function hasBlueprintSection(filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, 'utf-8');
  return /^## Execution Blueprint/m.test(content);
}

/**
 * Run a Claude Code command using the Agent SDK query function
 */
async function runClaudeCommand(prompt: string, cwd: string): Promise<string> {
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!oauthToken) {
    throw new Error('CLAUDE_CODE_OAUTH_TOKEN environment variable is required');
  }

  // Dynamic import for ESM module from CommonJS context
  const { query } = await import('@anthropic-ai/claude-agent-sdk');

  const output: string[] = [];

  for await (const message of query({
    prompt,
    options: {
      cwd,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      settingSources: ['project', 'user'],
      env: {
        ...process.env,
        CLAUDE_CODE_OAUTH_TOKEN: oauthToken,
      },
    },
  })) {
    if (message.type === 'assistant') {
      const assistantMsg = message as {
        type: 'assistant';
        message?: { content?: Array<{ type: string; text?: string }> };
      };
      if (assistantMsg.message?.content) {
        for (const block of assistantMsg.message.content) {
          if (block.type === 'text' && block.text) {
            output.push(block.text);
            process.stdout.write(chalk.gray(block.text));
          }
        }
      }
    } else if (message.type === 'result') {
      const resultMsg = message as { type: 'result'; result?: string };
      if (resultMsg.result) {
        output.push(resultMsg.result);
      }
    }
  }

  return output.join('\n');
}

/**
 * Validate a single plan
 */
async function validatePlan(planId: number): Promise<PlanValidation> {
  const location = await findPlanById(planId);

  if (!location) {
    throw new Error(`Plan ${planId} not found`);
  }

  if (location.isArchived) {
    throw new Error(`Plan ${planId} is archived and cannot be executed`);
  }

  const tasks = await parseTaskFiles(location.directoryPath);
  const hasBlueprint = await hasBlueprintSection(location.filePath);

  return {
    planId,
    location,
    taskCount: tasks.length,
    hasBlueprintSection: hasBlueprint,
    needsRemediation: tasks.length === 0 || !hasBlueprint,
  };
}

/**
 * Main exec command: validate and execute multiple plans sequentially
 */
export async function claudeExec(planIds: number[]): Promise<CommandResult> {
  const cwd = process.cwd();

  // Check for OAuth token early
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return {
      success: false,
      message:
        'CLAUDE_CODE_OAUTH_TOKEN environment variable is required. Set it before running claude-exec.',
    };
  }

  if (planIds.length === 0) {
    return {
      success: false,
      message: 'No plan IDs provided.',
    };
  }

  console.log(chalk.bold(`\nValidating ${planIds.length} plan(s): ${planIds.join(', ')}\n`));

  // Phase 1: Initial validation
  const validations: PlanValidation[] = [];

  for (const planId of planIds) {
    try {
      const validation = await validatePlan(planId);
      validations.push(validation);
      const status = validation.needsRemediation
        ? chalk.yellow('needs remediation')
        : chalk.green('ready');
      console.log(`  Plan ${planId}: ${status}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`  Plan ${planId}: ${msg}`));
      return {
        success: false,
        message: msg,
      };
    }
  }

  // Phase 2: Auto-remediation for plans needing tasks/blueprint
  const needsRemediation = validations.filter(v => v.needsRemediation);

  if (needsRemediation.length > 0) {
    const batchSize = 3;
    const totalBatches = Math.ceil(needsRemediation.length / batchSize);
    console.log(
      chalk.bold(`\nRemediating ${needsRemediation.length} plan(s) in batches of ${batchSize}...\n`)
    );

    for (let b = 0; b < totalBatches; b++) {
      const batch = needsRemediation.slice(b * batchSize, (b + 1) * batchSize);
      console.log(
        chalk.bold(`  Batch ${b + 1}/${totalBatches}: plans ${batch.map(v => v.planId).join(', ')}`)
      );

      const results = await Promise.allSettled(
        batch.map(async validation => {
          console.log(chalk.cyan(`  Generating tasks for plan ${validation.planId}...`));
          await runClaudeCommand(`/tasks:generate-tasks ${validation.planId}`, cwd);

          // Re-validate after remediation
          const revalidation = await validatePlan(validation.planId);

          if (revalidation.taskCount === 0) {
            throw new Error(`Plan ${validation.planId}: still has no tasks after remediation`);
          }

          if (!revalidation.hasBlueprintSection) {
            throw new Error(
              `Plan ${validation.planId}: still missing Execution Blueprint section after remediation`
            );
          }

          console.log(chalk.green(`  Plan ${validation.planId}: remediation successful`));
        })
      );

      // Check for failures in this batch
      for (const result of results) {
        if (result.status === 'rejected') {
          const msg =
            result.reason instanceof Error ? result.reason.message : String(result.reason);
          return {
            success: false,
            message: `Remediation failed: ${msg}`,
          };
        }
      }
    }
  }

  // Phase 3: Sequential execution
  console.log(chalk.bold(`\nExecuting ${planIds.length} plan(s)...\n`));

  for (let i = 0; i < planIds.length; i++) {
    const planId = planIds[i];
    console.log(
      chalk.cyan.bold(`\n[${i + 1}/${planIds.length}] Executing blueprint for plan ${planId}...\n`)
    );

    try {
      await runClaudeCommand(`/tasks:execute-blueprint ${planId}`, cwd);
      console.log(chalk.green(`\nPlan ${planId}: execution completed successfully`));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Execution failed for plan ${planId} (${i + 1}/${planIds.length}): ${msg}`,
      };
    }
  }

  const summary = `Successfully executed ${planIds.length} plan(s): ${planIds.join(', ')}`;
  console.log(chalk.green.bold(`\n${summary}\n`));

  return {
    success: true,
    message: summary,
    data: { planIds },
  };
}
