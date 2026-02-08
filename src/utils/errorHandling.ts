/**
 * Utilities for standardized error handling across the application
 * Provides consistent error wrapping and UI components for error states
 */

/** Standardized app error structure */
export interface AppError {
  message: string;
  code?: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

/**
 * Converts any error to a standardized AppError
 * Use this to normalize errors from different sources (API, runtime, etc.)
 */
export function toAppError(error: unknown, context?: Record<string, unknown>): AppError {
  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
      context,
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      context,
    };
  }
  
  return {
    message: 'Une erreur inattendue est survenue',
    originalError: error,
    context,
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Une erreur inattendue est survenue';
}

/**
 * Check if error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || msg.includes('fetch') || msg.includes('connection');
  }
  return false;
}

/**
 * Check if error is a Supabase/auth error
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return code?.startsWith('auth/') || code === 'PGRST301';
  }
  return false;
}
