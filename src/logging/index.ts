/**
 * Logging and Progress Tracking Module
 * 
 * This module provides comprehensive logging capabilities and progress tracking
 * for the AI Task Manager, including structured logging, operation metrics,
 * and detailed performance monitoring.
 */

export * from './logger';
export { ProgressTracker } from './progress-tracker';

// Re-export for convenience
export { EnhancedLogger as Logger, LogLevel, createLogger, createVerboseLogger, createProductionLogger } from './logger';