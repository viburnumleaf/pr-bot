import pino from 'pino';

// Logger service abstraction for consistent logging across the application
export type Logger = {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: unknown): void;
  setVerbose(enabled: boolean): void;
}

class PinoLogger implements Logger {
  private pinoLogger: pino.Logger;
  private verbose: boolean = false;

  constructor() {
    const isPretty = process.env.NODE_ENV !== 'production' || process.env.PRETTY_LOGS === 'true';
    
    this.pinoLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: isPretty
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    });
  }

  setVerbose(enabled: boolean): void {
    this.verbose = enabled;
    if (enabled) {
      this.pinoLogger.level = 'debug';
    } else {
      this.pinoLogger.level = 'info';
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose || process.env.DEBUG === 'true') {
      if (args.length > 0) {
        this.pinoLogger.debug({ args }, message);
      } else {
        this.pinoLogger.debug(message);
      }
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.pinoLogger.info({ args }, message);
    } else {
      this.pinoLogger.info(message);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      // Check if first arg is an error
      if (args[0] instanceof Error) {
        this.pinoLogger.warn({ err: args[0] }, message);
      } else {
        this.pinoLogger.warn({ args }, message);
      }
    } else {
      this.pinoLogger.warn(message);
    }
  }

  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      this.pinoLogger.error({ err: error }, message);
    } else if (error !== undefined) {
      this.pinoLogger.error({ error }, message);
    } else {
      this.pinoLogger.error(message);
    }
  }
}

// Singleton logger instance
export const logger: Logger = new PinoLogger();
