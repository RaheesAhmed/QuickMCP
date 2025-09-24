/**
 * Logger utility for QuickMCP
 * Simple logging system that respects MCP stdio constraints
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  useStderr: boolean;
}

class Logger {
  private config: LoggerConfig = {
    level: 'info',
    enabled: true,
    useStderr: true
  };

  constructor(config?: Partial<LoggerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[this.config.level];
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const fullMessage = `${prefix} ${message}`;

    // Always use stderr for MCP stdio servers to avoid corrupting JSON-RPC
    if (this.config.useStderr) {
      console.error(fullMessage, ...args);
    } else {
      console.log(fullMessage, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Default logger instance
export const logger = new Logger();

// Logger factory for custom instances
export const createLogger = (config?: Partial<LoggerConfig>): Logger => {
  return new Logger(config);
};

export { Logger };
export type { LogLevel, LoggerConfig };