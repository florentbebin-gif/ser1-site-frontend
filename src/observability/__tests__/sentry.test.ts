import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureException,
  captureMessage,
  initSentry,
  redactContext,
} from '../sentry';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const sensitiveKeys = [
  'email',
  'mail',
  'nom',
  'name',
  'prenom',
  'phone',
  'tel',
  'montant',
  'amount',
  'capital',
  'patrimoine',
  'revenu',
  'income',
  'rfr',
  'token',
  'jwt',
  'secret',
  'key',
  'password',
];

describe('observability/sentry', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('redige toutes les clés sensibles du contexte', () => {
    const input = Object.fromEntries(
      sensitiveKeys.map((key) => [key, `valeur-${key}`]),
    );

    expect(redactContext({
      ...input,
      area: 'bootstrap',
      statusCode: 500,
    })).toEqual({
      ...Object.fromEntries(sensitiveKeys.map((key) => [key, '[redacted]'])),
      area: 'bootstrap',
      statusCode: 500,
    });
  });

  it('reste no-op sans DSN configuré', async () => {
    const sentry = await import('@sentry/react');

    await expect(initSentry()).resolves.toBe(false);
    captureException(new Error('boom'), { email: 'client@example.com' });
    captureMessage('message technique', { token: 'secret' });

    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });
});
