type LogContext = Record<string, unknown>;

export function logInfo(message: string, context: LogContext = {}) {
  console.info(JSON.stringify({ level: "info", message, ...context }));
}

export function logError(message: string, error: unknown, context: LogContext = {}) {
  console.error(JSON.stringify({
    level: "error",
    message,
    error: error instanceof Error ? error.message : String(error),
    ...context
  }));
}
