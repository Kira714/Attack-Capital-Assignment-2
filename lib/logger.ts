/**
 * Centralized logging utility
 * Provides consistent error logging across the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: any): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: any): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | any, context?: any): void {
    const errorDetails = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    console.error(this.formatMessage('error', message, { ...errorDetails, ...context }));
  }

  debug(message: string, context?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Database operation logging
  db(operation: string, model: string, context?: any): void {
    this.debug(`DB ${operation}: ${model}`, context);
  }

  // API request logging
  api(method: string, path: string, status: number, context?: any): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this[level](`${method} ${path} - ${status}`, context);
  }

  // Integration logging
  integration(provider: string, operation: string, context?: any): void {
    this.info(`${provider.toUpperCase()} ${operation}`, context);
  }
}

export const logger = new Logger();









