/**
 * Simple Logging Utility
 *
 * This file provides a simple logging interface for the CLI
 * Handles different log levels and formatted output with optional color support
 */

// Chalk instance - loaded dynamically to handle ESM module
let chalkInstance: any | null = null;
let chalkInitialized = false;

/**
 * Initialize chalk instance dynamically
 * This handles the ESM import in a CommonJS environment
 */
async function initChalk(): Promise<void> {
  if (chalkInitialized) return;

  try {
    const { default: chalk } = await import('chalk');
    chalkInstance = chalk;
  } catch (_error) {
    // Chalk not available, will fall back to plain console output
    chalkInstance = null;
  }

  chalkInitialized = true;
}

/**
 * Get chalk instance, initializing if necessary
 */
export async function getChalk(): Promise<any | null> {
  await initChalk();
  return chalkInstance;
}

/**
 * Debug mode flag - can be set externally
 */
export let isDebugMode = false;

/**
 * Enable or disable debug mode
 */
export function setDebugMode(enabled: boolean): void {
  isDebugMode = enabled;
}

/**
 * Log an informational message
 */
export async function info(message: string): Promise<void> {
  const chalk = await getChalk();
  const formattedMessage = chalk?.blue(`ℹ ${message}`) || `ℹ ${message}`;
  console.log(formattedMessage);
}

/**
 * Log a success message
 */
export async function success(message: string): Promise<void> {
  const chalk = await getChalk();
  const formattedMessage = chalk?.green(`✓ ${message}`) || `✓ ${message}`;
  console.log(formattedMessage);
}

/**
 * Log an error message
 */
export async function error(message: string): Promise<void> {
  const chalk = await getChalk();
  const formattedMessage = chalk?.red(`✗ ${message}`) || `✗ ${message}`;
  console.error(formattedMessage);
}

/**
 * Log a warning message
 */
export async function warning(message: string): Promise<void> {
  const chalk = await getChalk();
  const formattedMessage = chalk?.yellow(`⚠ ${message}`) || `⚠ ${message}`;
  console.log(formattedMessage);
}

/**
 * Log a debug message (only shown in debug mode)
 */
export async function debug(message: string): Promise<void> {
  if (!isDebugMode) return;

  const chalk = await getChalk();
  const formattedMessage = chalk?.gray(`🐛 DEBUG: ${message}`) || `🐛 DEBUG: ${message}`;
  console.log(formattedMessage);
}

/**
 * Synchronous versions for cases where async is not suitable
 * These will only use colors if chalk was previously initialized
 */
export const sync = {
  /**
   * Log an informational message (sync)
   */
  info(message: string): void {
    const formattedMessage = chalkInstance?.blue(`ℹ ${message}`) || `ℹ ${message}`;
    console.log(formattedMessage);
  },

  /**
   * Log a success message (sync)
   */
  success(message: string): void {
    const formattedMessage = chalkInstance?.green(`✓ ${message}`) || `✓ ${message}`;
    console.log(formattedMessage);
  },

  /**
   * Log an error message (sync)
   */
  error(message: string): void {
    const formattedMessage = chalkInstance?.red(`✗ ${message}`) || `✗ ${message}`;
    console.error(formattedMessage);
  },

  /**
   * Log a warning message (sync)
   */
  warning(message: string): void {
    const formattedMessage = chalkInstance?.yellow(`⚠ ${message}`) || `⚠ ${message}`;
    console.log(formattedMessage);
  },

  /**
   * Log a debug message (sync, only shown in debug mode)
   */
  debug(message: string): void {
    if (!isDebugMode) return;

    const formattedMessage = chalkInstance?.gray(`🐛 DEBUG: ${message}`) || `🐛 DEBUG: ${message}`;
    console.log(formattedMessage);
  },
};

/**
 * Initialize the logger - call this early in your application
 * This pre-loads chalk to avoid delays on first use
 */
export async function initLogger(): Promise<void> {
  await initChalk();
}

// Pre-initialize chalk on module load (non-blocking)
initChalk().catch(() => {
  // Silently handle initialization errors
  // Logger will work without colors if chalk fails to load
});
