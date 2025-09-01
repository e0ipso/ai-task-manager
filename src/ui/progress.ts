// import { Readable } from 'stream';

export interface ProgressOptions {
  total?: number;
  message?: string;
  format?: string;
}

export interface SpinnerOptions {
  message?: string;
  spinner?: string[];
}

export class ProgressIndicator {
  private total: number;
  private current: number = 0;
  private message: string;
  private format: string;
  private startTime: number;

  constructor(options: ProgressOptions = {}) {
    this.total = options.total || 100;
    this.message = options.message || 'Progress';
    this.format = options.format || '[{bar}] {percentage}% | {current}/{total} | {message}';
    this.startTime = Date.now();
  }

  update(current: number, message?: string): void {
    this.current = Math.min(current, this.total);
    if (message) this.message = message;
    this.render();
  }

  increment(amount: number = 1, message?: string): void {
    this.update(this.current + amount, message);
  }

  complete(message?: string): void {
    this.update(this.total, message || 'Complete');
    process.stdout.write('\n');
  }

  private render(): void {
    const percentage = Math.round((this.current / this.total) * 100);
    const barLength = 30;
    const filledLength = Math.round((this.current / this.total) * barLength);

    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    const output = this.format
      .replace('{bar}', bar)
      .replace('{percentage}', percentage.toString())
      .replace('{current}', this.current.toString())
      .replace('{total}', this.total.toString())
      .replace('{message}', this.message);

    // Clear line and write progress
    process.stdout.write('\r\x1b[K' + output);
  }
}

export class Spinner {
  private frames: string[];
  private message: string;
  private interval: ReturnType<typeof setInterval> | null = null;
  private frameIndex: number = 0;
  private startTime: number = 0;

  constructor(options: SpinnerOptions = {}) {
    this.frames = options.spinner || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.message = options.message || 'Loading';
  }

  start(message?: string): void {
    if (message) this.message = message;
    this.startTime = Date.now();
    this.frameIndex = 0;

    this.interval = setInterval(() => {
      this.render();
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, 80);
  }

  update(message: string): void {
    this.message = message;
  }

  stop(message?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Clear the spinner line
    process.stdout.write('\r\x1b[K');

    if (message) {
      console.log(message);
    }
  }

  succeed(message?: string): void {
    this.stop(`✅ ${message || this.message}`);
  }

  fail(message?: string): void {
    this.stop(`❌ ${message || this.message}`);
  }

  warn(message?: string): void {
    this.stop(`⚠️  ${message || this.message}`);
  }

  info(message?: string): void {
    this.stop(`ℹ️  ${message || this.message}`);
  }

  private render(): void {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const frame = this.frames[this.frameIndex];
    const output = `${frame} ${this.message} (${elapsed}s)`;

    process.stdout.write('\r\x1b[K' + output);
  }
}

export function createProgressBar(options: ProgressOptions): ProgressIndicator {
  return new ProgressIndicator(options);
}

export function createSpinner(options: SpinnerOptions): Spinner {
  return new Spinner(options);
}

// Utility function for simulating file operations with progress
export async function simulateProgress(
  operation: () => Promise<void>,
  message: string,
  duration: number = 2000
): Promise<void> {
  const spinner = createSpinner({ message });
  spinner.start();

  try {
    await operation();
    await new Promise(resolve => setTimeout(resolve, duration));
    spinner.succeed(`${message} completed`);
  } catch (error) {
    spinner.fail(`${message} failed: ${error}`);
    throw error;
  }
}
