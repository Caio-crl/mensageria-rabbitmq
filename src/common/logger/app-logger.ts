
import { Logger } from '@nestjs/common';

const logger = new Logger('Application');
const MAX_ERROR_MESSAGE_LENGTH = 1_000;
const SENSITIVE_VALUE_REPLACEMENT = '[REDACTED]';

export const appLogger = {
  debug(message: string, extra?: Record<string, unknown>): void {
    logger.debug(formatLogMessage(message, extra));
  },

  info(message: string, extra?: Record<string, unknown>): void {
    logger.log(formatLogMessage(message, extra));
  },

  warn(message: string, extra?: Record<string, unknown>): void {
    logger.warn(formatLogMessage(message, extra));
  },

  error(message: string, extra?: Record<string, unknown>): void {
    logger.error(formatLogMessage(message, extra));
  },

  fatal(message: string, extra?: Record<string, unknown>): void {
    logger.error(formatLogMessage(message, extra));
  },
};

function formatLogMessage(
  message: string,
  extra?: Record<string, unknown>,
): string {
  return extra ? `${message} ${JSON.stringify(extra)}` : message;
}

export function getSafeErrorLogFields(
  error: unknown,
): Record<string, string | undefined> {
  return {
    errorName: getErrorName(error),
    errorCode: getErrorCode(error),
    errorMessage: getSafeErrorMessage(error),
  };
}

function getErrorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }

  return typeof error;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code);
  }

  return undefined;
}

function getSafeErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.message) {
    return undefined;
  }

  return sanitizeErrorMessage(error.message);
}

function sanitizeErrorMessage(message: string): string {
  return truncateMessage(
    message
      .replace(/[\r\n\t]+/g, ' ')
      .replace(
        /([\w.-]+):\/\/([^/\s:@]+):([^@\s/]+)@/g,
        `$1://${SENSITIVE_VALUE_REPLACEMENT}:${SENSITIVE_VALUE_REPLACEMENT}@`,
      )
      .replace(
        /(["']?(?:accessToken|authorization|authorizationHeader|cookie|credential|credentials|password|refreshToken|secret|set-cookie|token)["']?\s*[:=]\s*["']?)([^"',;\s}]+)/gi,
        `$1${SENSITIVE_VALUE_REPLACEMENT}`,
      )
      .trim(),
  );
}

function truncateMessage(message: string): string {
  if (message.length <= MAX_ERROR_MESSAGE_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH)}...`;
}
