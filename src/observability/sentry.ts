import type * as SentryModule from '@sentry/react';

export type ObservabilityContext = Record<string, string | number | boolean | null | undefined>;

const SENSITIVE_KEY_PATTERN =
  /email|mail|nom|name|prenom|phone|tel|montant|amount|capital|patrimoine|revenu|income|rfr|token|jwt|secret|key|password/i;

let sentryEnabled = false;
let sentry: typeof SentryModule | null = null;
let initPromise: Promise<boolean> | null = null;

function readNumberEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function redactContext(context: ObservabilityContext = {}): ObservabilityContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : value,
    ]),
  );
}

export async function initSentry(): Promise<boolean> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    sentryEnabled = false;
    sentry = null;
    return false;
  }

  if (initPromise) return initPromise;

  initPromise = import('@sentry/react')
    .then((module) => {
      module.init({
        dsn,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION,
        sendDefaultPii: false,
        tracesSampleRate: readNumberEnv(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0),
        beforeSend(event) {
          event.user = undefined;
          if (event.request) {
            event.request.cookies = undefined;
            event.request.headers = undefined;
            event.request.data = undefined;
          }
          if (event.extra) {
            event.extra = redactContext(event.extra as ObservabilityContext);
          }
          return event;
        },
      });

      sentry = module;
      sentryEnabled = true;
      return true;
    })
    .catch(() => {
      sentry = null;
      sentryEnabled = false;
      initPromise = null;
      return false;
    });

  return initPromise;
}

export function isSentryEnabled(): boolean {
  return sentryEnabled;
}

export function captureException(error: unknown, context?: ObservabilityContext): void {
  if (!sentryEnabled || !sentry) return;
  sentry.captureException(error, {
    extra: redactContext(context),
  });
}

export function captureMessage(message: string, context?: ObservabilityContext): void {
  if (!sentryEnabled || !sentry) return;
  sentry.captureMessage(message, {
    level: 'info',
    extra: redactContext(context),
  });
}
