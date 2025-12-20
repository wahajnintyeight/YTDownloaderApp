/**
 * Logger utility for React Native
 * Ensures logs are visible in both Metro bundler and native logs
 */

import { DOWNLOAD_FOLDER_NAME } from '../config/env';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private prefix: string;

  constructor(prefix: string = 'App') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, ...args: any[]): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const formattedPrefix = `[${timestamp}] [${this.prefix}]`;
    
    switch (level) {
      case 'error':
        console.error(formattedPrefix, ...args);
        break;
      case 'warn':
        console.warn(formattedPrefix, ...args);
        break;
      case 'info':
        console.info(formattedPrefix, ...args);
        break;
      case 'debug':
        console.debug(formattedPrefix, ...args);
        break;
      default:
        console.log(formattedPrefix, ...args);
    }
  }

  log(...args: any[]): void {
    this.formatMessage('log', ...args);
  }

  info(...args: any[]): void {
    this.formatMessage('info', ...args);
  }

  warn(...args: any[]): void {
    this.formatMessage('warn', ...args);
  }

  error(...args: any[]): void {
    this.formatMessage('error', ...args);
  }

  debug(...args: any[]): void {
    this.formatMessage('debug', ...args);
  }

  // Create a child logger with a different prefix
  child(childPrefix: string): Logger {
    return new Logger(`${this.prefix}:${childPrefix}`);
  }
}

// Export default logger instance
export const logger = new Logger(DOWNLOAD_FOLDER_NAME);

// Export Logger class for creating custom instances
export default Logger;