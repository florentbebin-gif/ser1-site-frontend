import {
  captureException,
  captureMessage,
  redactContext,
  type ObservabilityContext,
} from './sentry';

function normalizeError(error: unknown, message: string): Error {
  if (error instanceof Error) return error;
  if (error == null) return new Error(message);
  return new Error(String(error));
}

export const logger = {
  info(message: string, context?: ObservabilityContext): void {
    // Pas de console.log en prod : si Sentry est off, les info-logs disparaissent volontairement.
    captureMessage(message, context);
  },

  warn(message: string, context?: ObservabilityContext): void {
    console.warn(message, redactContext(context));
    captureMessage(message, context);
  },

  error(message: string, error?: unknown, context?: ObservabilityContext): void {
    const normalized = normalizeError(error, message);
    console.error(message, normalized, redactContext(context));
    captureException(normalized, context);
  },
};
