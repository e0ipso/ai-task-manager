/**
 * Advanced progress tracking system for complex operations
 * Provides hierarchical progress tracking, estimated time completion, and detailed metrics
 */

import { EnhancedLogger, LogLevel } from './logger';

export interface ProgressStep {
  id: string;
  name: string;
  weight: number; // Relative weight for progress calculation
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress?: number; // 0-100 for partial completion
  substeps?: ProgressStep[];
  error?: string;
}

export interface ProgressMetrics {
  totalSteps: number;
  completedSteps: number;
  currentStep: string | null;
  overallProgress: number; // 0-100
  estimatedTimeRemaining: number; // milliseconds
  elapsedTime: number; // milliseconds
  averageStepTime: number; // milliseconds
  successful: number;
  failed: number;
}

export interface ProgressTrackerConfig {
  logger?: EnhancedLogger;
  enableDetailedLogging: boolean;
  estimationWindowSize: number; // Number of recent steps to use for time estimation
  progressUpdateThreshold: number; // Minimum progress change to trigger update
}

export class ProgressTracker {
  private steps: Map<string, ProgressStep> = new Map();
  private stepOrder: string[] = [];
  private currentStepId: string | null = null;
  private startTime: Date | null = null;
  private endTime: Date | null = null;
  private config: ProgressTrackerConfig;
  private logger?: EnhancedLogger;
  private progressHistory: Array<{ timestamp: Date; progress: number }> = [];

  constructor(config: Partial<ProgressTrackerConfig> = {}) {
    this.config = {
      enableDetailedLogging: true,
      estimationWindowSize: 10,
      progressUpdateThreshold: 1,
      ...config,
    };
    this.logger = this.config.logger ?? undefined;
  }

  /**
   * Add a progress step to the tracker
   */
  addStep(id: string, name: string, weight: number = 1): void {
    const step: ProgressStep = {
      id,
      name,
      weight,
      completed: false,
    };

    this.steps.set(id, step);
    this.stepOrder.push(id);

    if (this.logger) {
      this.logger.debug(`Added progress step: ${name}`, 'PROGRESS', { id, weight });
    }
  }

  /**
   * Add multiple steps at once
   */
  addSteps(steps: Array<{ id: string; name: string; weight?: number }>): void {
    steps.forEach(step => this.addStep(step.id, step.name, step.weight));
  }

  /**
   * Start tracking progress
   */
  start(): void {
    this.startTime = new Date();
    this.progressHistory = [{ timestamp: this.startTime, progress: 0 }];

    if (this.logger) {
      this.logger.info('Progress tracking started', 'PROGRESS', {
        totalSteps: this.stepOrder.length,
        steps: Array.from(this.steps.values()).map(s => ({ id: s.id, name: s.name, weight: s.weight })),
      });
    }
  }

  /**
   * Start a specific step
   */
  startStep(stepId: string): void {
    const step = this.steps.get(stepId);
    if (!step) {
      if (this.logger) {
        this.logger.warn(`Attempted to start unknown step: ${stepId}`, 'PROGRESS');
      }
      return;
    }

    // Complete previous step if it's still active
    if (this.currentStepId && this.currentStepId !== stepId) {
      this.completeStep(this.currentStepId, false);
    }

    step.startTime = new Date();
    step.completed = false;
    step.progress = 0;
    this.currentStepId = stepId;

    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug(`Started step: ${step.name}`, 'PROGRESS', { stepId });
    }

    this.updateProgress();
  }

  /**
   * Update progress of current step
   */
  updateStepProgress(stepId: string, progress: number, message?: string): void {
    const step = this.steps.get(stepId);
    if (!step) {
      if (this.logger) {
        this.logger.warn(`Attempted to update unknown step: ${stepId}`, 'PROGRESS');
      }
      return;
    }

    const oldProgress = step.progress || 0;
    step.progress = Math.max(0, Math.min(100, progress));

    if (Math.abs(step.progress - oldProgress) >= this.config.progressUpdateThreshold) {
      if (this.logger && this.config.enableDetailedLogging) {
        this.logger.debug(`Step progress: ${step.name} - ${step.progress}%${message ? ` (${message})` : ''}`, 'PROGRESS', {
          stepId,
          progress: step.progress,
          message,
        });
      }

      this.updateProgress();
    }
  }

  /**
   * Complete a step
   */
  completeStep(stepId: string, success: boolean = true, error?: string): void {
    const step = this.steps.get(stepId);
    if (!step) {
      if (this.logger) {
        this.logger.warn(`Attempted to complete unknown step: ${stepId}`, 'PROGRESS');
      }
      return;
    }

    step.endTime = new Date();
    step.completed = true;
    step.progress = success ? 100 : 0;
    step.error = error;

    if (step.startTime) {
      step.duration = step.endTime.getTime() - step.startTime.getTime();
    }

    if (this.currentStepId === stepId) {
      this.currentStepId = null;
    }

    const level = success ? LogLevel.DEBUG : LogLevel.WARN;
    const message = success 
      ? `Completed step: ${step.name}${step.duration ? ` (${step.duration}ms)` : ''}`
      : `Failed step: ${step.name}${error ? ` - ${error}` : ''}`;

    if (this.logger) {
      if (success) {
        this.logger.debug(message, 'PROGRESS', {
          stepId,
          duration: step.duration,
          success,
          error,
        });
      } else {
        this.logger.warn(message, 'PROGRESS', {
          stepId,
          duration: step.duration,
          success,
          error,
        });
      }
    }

    this.updateProgress();
  }

  /**
   * Complete all steps and finish tracking
   */
  finish(success: boolean = true): void {
    this.endTime = new Date();

    // Complete any remaining active step
    if (this.currentStepId) {
      this.completeStep(this.currentStepId, success);
    }

    const metrics = this.getMetrics();
    
    if (this.logger) {
      this.logger.info(`Progress tracking finished`, 'PROGRESS', {
        success,
        totalTime: metrics.elapsedTime,
        completedSteps: metrics.completedSteps,
        totalSteps: metrics.totalSteps,
        successfulSteps: metrics.successful,
        failedSteps: metrics.failed,
      });
    }
  }

  /**
   * Get current progress metrics
   */
  getMetrics(): ProgressMetrics {
    const totalWeight = Array.from(this.steps.values()).reduce((sum, step) => sum + step.weight, 0);
    let completedWeight = 0;
    let successful = 0;
    let failed = 0;

    for (const step of this.steps.values()) {
      if (step.completed) {
        if (step.error) {
          failed++;
        } else {
          successful++;
          completedWeight += step.weight;
        }
      } else if (step.progress && step.progress > 0) {
        // Partial completion
        completedWeight += (step.progress / 100) * step.weight;
      }
    }

    const overallProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
    const elapsedTime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const completedSteps = Array.from(this.steps.values()).filter(s => s.completed).length;
    
    return {
      totalSteps: this.stepOrder.length,
      completedSteps,
      currentStep: this.currentStepId ? (this.steps.get(this.currentStepId)?.name ?? null) : null,
      overallProgress: Math.round(overallProgress),
      estimatedTimeRemaining: this.estimateTimeRemaining(overallProgress, elapsedTime),
      elapsedTime,
      averageStepTime: this.calculateAverageStepTime(),
      successful,
      failed,
    };
  }

  /**
   * Update overall progress and emit events
   */
  private updateProgress(): void {
    const metrics = this.getMetrics();
    const now = new Date();
    
    this.progressHistory.push({
      timestamp: now,
      progress: metrics.overallProgress,
    });

    // Keep only recent history for estimation
    if (this.progressHistory.length > this.config.estimationWindowSize * 2) {
      this.progressHistory = this.progressHistory.slice(-this.config.estimationWindowSize);
    }
  }

  /**
   * Estimate time remaining based on recent progress
   */
  private estimateTimeRemaining(currentProgress: number, elapsedTime: number): number {
    if (currentProgress <= 0 || currentProgress >= 100) {
      return 0;
    }

    // Use recent progress history for more accurate estimation
    if (this.progressHistory.length >= 2) {
      const recentHistory = this.progressHistory.slice(-this.config.estimationWindowSize);
      const firstPoint = recentHistory[0];
      const lastPoint = recentHistory[recentHistory.length - 1];
      
      const timeSpan = lastPoint!.timestamp.getTime() - firstPoint!.timestamp.getTime();
      const progressDelta = lastPoint!.progress - firstPoint!.progress;
      
      if (progressDelta > 0 && timeSpan > 0) {
        const remainingProgress = 100 - currentProgress;
        const rate = progressDelta / timeSpan; // progress per millisecond
        return Math.round(remainingProgress / rate);
      }
    }

    // Fallback to simple linear estimation
    const remainingProgress = 100 - currentProgress;
    const rate = currentProgress / elapsedTime; // progress per millisecond
    
    return rate > 0 ? Math.round(remainingProgress / rate) : 0;
  }

  /**
   * Calculate average time per step
   */
  private calculateAverageStepTime(): number {
    const completedSteps = Array.from(this.steps.values()).filter(s => s.completed && s.duration);
    
    if (completedSteps.length === 0) {
      return 0;
    }

    const totalDuration = completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
    return Math.round(totalDuration / completedSteps.length);
  }

  /**
   * Get detailed step information
   */
  getSteps(): ProgressStep[] {
    return this.stepOrder.map(id => this.steps.get(id)!);
  }

  /**
   * Get step by ID
   */
  getStep(stepId: string): ProgressStep | undefined {
    return this.steps.get(stepId);
  }

  /**
   * Check if all steps are completed
   */
  isComplete(): boolean {
    return Array.from(this.steps.values()).every(step => step.completed);
  }

  /**
   * Get failed steps
   */
  getFailedSteps(): ProgressStep[] {
    return Array.from(this.steps.values()).filter(step => step.completed && step.error);
  }

  /**
   * Reset the tracker for reuse
   */
  reset(): void {
    this.steps.clear();
    this.stepOrder = [];
    this.currentStepId = null;
    this.startTime = null;
    this.endTime = null;
    this.progressHistory = [];

    if (this.logger) {
      this.logger.debug('Progress tracker reset', 'PROGRESS');
    }
  }

  /**
   * Export progress data for analysis
   */
  export(): {
    steps: ProgressStep[];
    metrics: ProgressMetrics;
    history: Array<{ timestamp: Date; progress: number }>;
    exportedAt: Date;
  } {
    return {
      steps: this.getSteps(),
      metrics: this.getMetrics(),
      history: [...this.progressHistory],
      exportedAt: new Date(),
    };
  }
}