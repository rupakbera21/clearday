/**
 * @file logger.ts
 * @description Privacy-preserving structured logger. Never logs prompt contents, coordinates, or health data.
 * Addresses problem-statement: Privacy by design, operational monitoring.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Strips sensitive keys like coordinates, health details, prompt contents, or secrets.
 */
function sanitizeContext(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!ctx) return undefined;
  const sensitiveKeys = [
    "lat",
    "latitude",
    "lon",
    "longitude",
    "health",
    "conditions",
    "prompt",
    "apikey",
    "token",
    "secret",
    "body",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeContext(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: sanitizeContext(context),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.info(line);
  }
}

export const logger = {
  /**
   * Logs informational messages with sanitized context.
   */
  info(message: string, context?: Record<string, unknown>) {
    writeLog("info", message, context);
  },
  /**
   * Logs warnings with sanitized context.
   */
  warn(message: string, context?: Record<string, unknown>) {
    writeLog("warn", message, context);
  },
  /**
   * Logs errors with sanitized context.
   */
  error(message: string, context?: Record<string, unknown>) {
    writeLog("error", message, context);
  },
  /**
   * Logs debug messages in non-production environments.
   */
  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      writeLog("debug", message, context);
    }
  },
};
