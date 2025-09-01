/**
 * Comprehensive logging and progress tracking system for AI Task Manager
 * Provides structured logging, performance metrics, and detailed operation tracking
 */

import * as path from 'path';
import * as fs from 'fs/promises';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  duration?: number;
  operationId?: string;
}

export interface OperationMetrics {
  operationId: string;
  operationType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableFileLogging: boolean;
  logDirectory?: string;
  maxLogFiles: number;
  maxLogSizeBytes: number;
  enableConsole: boolean;
  timestampFormat: string;
}

export class EnhancedLogger {
  private logs: LogEntry[] = [];
  private operations: OperationMetrics[] = [];
  private activeOperations: Map<string, OperationMetrics> = new Map();
  private config: LoggerConfig;
  private logFileHandle?: fs.FileHandle;
  private logRotationCheck: number = 0;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enableFileLogging: config.enableFileLogging ?? false,
      maxLogFiles: config.maxLogFiles ?? 5,
      maxLogSizeBytes: config.maxLogSizeBytes ?? 10 * 1024 * 1024, // 10MB
      enableConsole: config.enableConsole ?? true,
      timestampFormat: config.timestampFormat ?? 'ISO',
      logDirectory: config.logDirectory,
    };

    if (this.config.enableFileLogging && this.config.logDirectory) {
      this.initializeFileLogging().catch(error => {
        console.error('Failed to initialize file logging:', error);
      });
    }
  }

  /**
   * Initialize file logging system
   */
  private async initializeFileLogging(): Promise<void> {
    if (!this.config.logDirectory) return;

    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
      const logFile = path.join(this.config.logDirectory, `ai-task-manager-${Date.now()}.log`);
      this.logFileHandle = await fs.open(logFile, 'a');
    } catch (error) {
      console.error('Failed to create log file:', error);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Start tracking an operation
   */
  startOperation(operationType: string, metadata?: Record<string, any>): string {
    const operationId = `${operationType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const operation: OperationMetrics = {
      operationId,
      operationType,
      startTime: new Date(),
      metadata: metadata ?? {},
    };

    this.activeOperations.set(operationId, operation);
    this.debug(`Started operation: ${operationType}`, 'OPERATION', { operationId, metadata });

    return operationId;
  }

  /**
   * Complete an operation
   */
  completeOperation(operationId: string, success: boolean = true, error?: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.warn(`Attempted to complete unknown operation: ${operationId}`, 'OPERATION');
      return;
    }

    operation.endTime = new Date();
    operation.duration = operation.endTime.getTime() - operation.startTime.getTime();
    operation.success = success;
    if (error !== undefined) {
      operation.error = error;
    }

    this.operations.push(operation);
    this.activeOperations.delete(operationId);

    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = success 
      ? `Completed operation: ${operation.operationType} (${operation.duration}ms)`
      : `Failed operation: ${operation.operationType} - ${error}`;

    this.log(level, message, 'OPERATION', { 
      operationId, 
      duration: operation.duration,
      success,
      error 
    });
  }

  /**
   * Update operation progress
   */
  updateOperation(operationId: string, progress: number, message?: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.warn(`Attempted to update unknown operation: ${operationId}`, 'OPERATION');
      return;
    }

    operation.metadata = {
      ...operation.metadata,
      progress,
      progressMessage: message,
    };

    this.debug(`Operation progress: ${operation.operationType} - ${progress}%${message ? ` (${message})` : ''}`, 'OPERATION', {
      operationId,
      progress,
      message,
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    const shouldLog = this.shouldLog(level);
    if (!shouldLog) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context ?? undefined,
      data,
    };

    this.logs.push(entry);

    // Console output
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // File output
    if (this.config.enableFileLogging && this.logFileHandle) {
      this.outputToFile(entry).catch(error => {
        console.error('Failed to write to log file:', error);
      });
    }
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configIndex = levels.indexOf(this.config.level);
    const logIndex = levels.indexOf(level);
    return logIndex >= configIndex;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const context = entry.context ? `[${entry.context}]` : '';
    const message = `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * Output log entry to file
   */
  private async outputToFile(entry: LogEntry): Promise<void> {
    if (!this.logFileHandle) return;

    const timestamp = this.formatTimestamp(entry.timestamp);
    const context = entry.context || 'GENERAL';
    const dataStr = entry.data ? ` | DATA: ${JSON.stringify(entry.data)}` : '';
    const line = `${timestamp} [${entry.level.toUpperCase()}] [${context}] ${entry.message}${dataStr}\n`;

    await this.logFileHandle.write(line);

    // Check for log rotation every 100 writes
    this.logRotationCheck++;
    if (this.logRotationCheck >= 100) {
      this.logRotationCheck = 0;
      await this.checkLogRotation();
    }
  }

  /**
   * Format timestamp according to configuration
   */
  private formatTimestamp(date: Date): string {
    switch (this.config.timestampFormat) {
      case 'ISO':
        return date.toISOString();
      case 'local':
        return date.toLocaleString();
      case 'time':
        return date.toISOString().substring(11, 23);
      default:
        return date.toISOString();
    }
  }

  /**
   * Check if log file needs rotation
   */
  private async checkLogRotation(): Promise<void> {
    if (!this.logFileHandle || !this.config.logDirectory) return;

    try {
      const stats = await this.logFileHandle.stat();
      if (stats.size > this.config.maxLogSizeBytes) {
        await this.rotateLogFile();
      }
    } catch (error) {
      this.error('Failed to check log rotation', 'LOGGER', error);
    }
  }

  /**
   * Rotate log file when it gets too large
   */
  private async rotateLogFile(): Promise<void> {
    if (!this.logFileHandle || !this.config.logDirectory) return;

    try {
      await this.logFileHandle.close();
      
      // Create new log file
      const logFile = path.join(this.config.logDirectory, `ai-task-manager-${Date.now()}.log`);
      this.logFileHandle = await fs.open(logFile, 'a');

      // Clean up old log files
      await this.cleanupOldLogFiles();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Clean up old log files exceeding the limit
   */
  private async cleanupOldLogFiles(): Promise<void> {
    if (!this.config.logDirectory) return;

    try {
      const files = await fs.readdir(this.config.logDirectory);
      const logFiles = files
        .filter(file => file.startsWith('ai-task-manager-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDirectory!, file),
        }));

      // Sort by modification time and keep only the most recent files
      if (logFiles.length > this.config.maxLogFiles) {
        const fileStats = await Promise.all(
          logFiles.map(async file => ({
            ...file,
            stats: await fs.stat(file.path),
          }))
        );

        fileStats
          .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
          .slice(this.config.maxLogFiles)
          .forEach(async (file) => {
            try {
              await fs.unlink(file.path);
              this.info(`Deleted old log file: ${file.name}`, 'LOGGER');
            } catch (error) {
              this.error(`Failed to delete log file: ${file.name}`, 'LOGGER', error);
            }
          });
      }
    } catch (error) {
      this.error('Failed to cleanup old log files', 'LOGGER', error);
    }
  }

  /**
   * Get all log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by context
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Get all operation metrics
   */
  getOperations(): OperationMetrics[] {
    return [...this.operations];
  }

  /**
   * Get active operations
   */
  getActiveOperations(): OperationMetrics[] {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Get operation statistics
   */
  getOperationStats(): {
    total: number;
    successful: number;
    failed: number;
    active: number;
    avgDuration: number;
    totalDuration: number;
  } {
    const successful = this.operations.filter(op => op.success).length;
    const failed = this.operations.filter(op => !op.success).length;
    const totalDuration = this.operations.reduce((sum, op) => sum + (op.duration || 0), 0);
    const avgDuration = this.operations.length > 0 ? totalDuration / this.operations.length : 0;

    return {
      total: this.operations.length,
      successful,
      failed,
      active: this.activeOperations.size,
      avgDuration: Math.round(avgDuration),
      totalDuration,
    };
  }

  /**
   * Export logs to a structured format
   */
  exportLogs(): {
    logs: LogEntry[];
    operations: OperationMetrics[];
    stats: any;
    exportedAt: Date;
  } {
    return {
      logs: this.getLogs(),
      operations: this.getOperations(),
      stats: this.getOperationStats(),
      exportedAt: new Date(),
    };
  }

  /**
   * Clear all logs and operations
   */
  clear(): void {
    this.logs = [];
    this.operations = [];
    this.activeOperations.clear();
    this.info('Logs cleared', 'LOGGER');
  }

  /**
   * Close the logger and clean up resources
   */
  async close(): Promise<void> {
    if (this.logFileHandle) {
      await this.logFileHandle.close();
      this.logFileHandle = undefined as any;
    }
  }
}

/**
 * Create a logger with default configuration
 */
export function createLogger(config?: Partial<LoggerConfig>): EnhancedLogger {
  return new EnhancedLogger(config);
}

/**
 * Create a logger configured for verbose output
 */
export function createVerboseLogger(logDirectory?: string): EnhancedLogger {
  const config: Partial<LoggerConfig> = {
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableFileLogging: !!logDirectory,
    timestampFormat: 'time',
  };
  
  if (logDirectory) {
    config.logDirectory = logDirectory;
  }
  
  return new EnhancedLogger(config);
}

/**
 * Create a logger configured for production use
 */
export function createProductionLogger(logDirectory: string): EnhancedLogger {
  return new EnhancedLogger({
    level: LogLevel.INFO,
    enableConsole: false,
    enableFileLogging: true,
    logDirectory,
    maxLogFiles: 10,
    maxLogSizeBytes: 50 * 1024 * 1024, // 50MB
  });
}