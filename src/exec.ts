/**
 * Claude Exec Command Module
 *
 * Validates and executes multiple plans sequentially by spawning the `claude`
 * CLI with streaming output. Performs pre-flight validation and auto-remediation
 * before execution.
 */

import { spawn } from 'child_process';
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
 * Handle a single stream-json line from the claude CLI
 */
function handleStreamJsonLine(line: string, output: string[]): void {
  let msg: unknown;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  if (!msg || typeof msg !== 'object') {
    return;
  }

  const m = msg as {
    type?: string;
    message?: { content?: Array<{ type?: string; text?: string }> };
    result?: string;
  };

  if (m.type === 'assistant' && m.message?.content) {
    for (const block of m.message.content) {
      if (block.type === 'text' && block.text) {
        output.push(block.text);
        process.stdout.write(chalk.gray(block.text));
      }
    }
  } else if (m.type === 'result' && m.result) {
    output.push(m.result);
  }
}

/**
 * Run a Claude Code command by spawning the `claude` CLI and streaming its output.
 * Authentication is delegated to the CLI itself (stored session, keychain, or any
 * env var the user has configured) — we do not require any auth variable here.
 */
async function runClaudeCommand(prompt: string, cwd: string): Promise<string> {
  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
  ];

  return new Promise<string>((resolve, reject) => {
    const child = spawn('claude', args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const output: string[] = [];
    let stdoutBuf = '';
    let stderrBuf = '';

    child.stdout?.setEncoding('utf-8');
    child.stdout?.on('data', (chunk: string) => {
      stdoutBuf += chunk;
      let idx = stdoutBuf.indexOf('\n');
      while (idx >= 0) {
        const line = stdoutBuf.slice(0, idx).trim();
        stdoutBuf = stdoutBuf.slice(idx + 1);
        if (line) {
          handleStreamJsonLine(line, output);
        }
        idx = stdoutBuf.indexOf('\n');
      }
    });

    child.stderr?.setEncoding('utf-8');
    child.stderr?.on('data', (chunk: string) => {
      stderrBuf += chunk;
      process.stderr.write(chalk.gray(chunk));
    });

    child.on('error', err => {
      const msg = err instanceof Error ? err.message : String(err);
      if ((err as { code?: string }).code === 'ENOENT') {
        reject(
          new Error(
            `Failed to spawn 'claude' CLI: command not found. Install Claude Code and ensure 'claude' is on PATH.`
          )
        );
        return;
      }
      reject(new Error(`Failed to spawn 'claude' CLI: ${msg}`));
    });

    child.on('close', (code, signal) => {
      if (stdoutBuf.trim()) {
        handleStreamJsonLine(stdoutBuf.trim(), output);
        stdoutBuf = '';
      }

      if (code === 0) {
        resolve(output.join('\n'));
        return;
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      const detail = stderrBuf.trim() ? `: ${stderrBuf.trim()}` : '';
      reject(new Error(`claude CLI terminated with ${reason}${detail}`));
    });
  });
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
