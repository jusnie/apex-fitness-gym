/**
 * Logger — Athletly V2
 *
 * Centralized logging utility with timestamps, tags, and performance tracking.
 * All logs use [TAG] prefix format for easy filtering in Expo console output.
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.info('Auth', 'Session loaded', { userId: '...' });
 *   const end = log.time('Auth', 'getSession');
 *   ... await getSession() ...
 *   end(); // prints elapsed time
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_COLORS: Record<LogLevel, string> = {
  DEBUG: '🔍',
  INFO: '✅',
  WARN: '⚠️',
  ERROR: '❌',
};

function formatTimestamp(): string {
  const now = new Date();
  return `${now.toLocaleTimeString('de-DE')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
}

function formatMessage(level: LogLevel, tag: string, message: string, data?: unknown): string {
  const prefix = `${LOG_COLORS[level]} [${formatTimestamp()}] [${tag}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data, null, 0)}`;
  }
  return `${prefix} ${message}`;
}

function debug(tag: string, message: string, data?: unknown): void {
  if (__DEV__) {
    console.log(formatMessage('DEBUG', tag, message, data));
  }
}

function info(tag: string, message: string, data?: unknown): void {
  console.log(formatMessage('INFO', tag, message, data));
}

function warn(tag: string, message: string, data?: unknown): void {
  console.warn(formatMessage('WARN', tag, message, data));
}

function error(tag: string, message: string, data?: unknown): void {
  console.error(formatMessage('ERROR', tag, message, data));
}

/**
 * Start a performance timer. Returns a function that logs the elapsed time when called.
 *
 * @example
 *   const end = log.time('Auth', 'getSession');
 *   await supabase.auth.getSession();
 *   end(); // logs: ✅ [12:34:56.789] [Auth] getSession completed in 142ms
 */
function time(tag: string, label: string): () => void {
  const start = performance.now();
  debug(tag, `${label} started...`);
  return () => {
    const elapsed = Math.round(performance.now() - start);
    info(tag, `${label} completed in ${elapsed}ms`);
  };
}

/**
 * Log a state transition (useful for stores and navigation).
 */
function state(tag: string, field: string, from: unknown, to: unknown): void {
  debug(tag, `${field}: ${JSON.stringify(from)} → ${JSON.stringify(to)}`);
}

export const log = {
  debug,
  info,
  warn,
  error,
  time,
  state,
};
