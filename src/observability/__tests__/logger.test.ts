import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../sentry', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  redactContext: vi.fn((context) => context ?? {}),
}));

describe('observability/logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envoie info uniquement vers la capture applicative', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { logger } = await import('../logger');
    const sentry = await import('../sentry');

    logger.info('info technique', { area: 'mode' });

    expect(sentry.captureMessage).toHaveBeenCalledWith('info technique', { area: 'mode' });
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('écrit les warnings en console et les remonte', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { logger } = await import('../logger');
    const sentry = await import('../sentry');

    logger.warn('warning technique', { area: 'bootstrap' });

    expect(warnSpy).toHaveBeenCalledWith('warning technique', { area: 'bootstrap' });
    expect(sentry.captureMessage).toHaveBeenCalledWith('warning technique', { area: 'bootstrap' });
  });

  it('normalise les erreurs avant capture', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { logger } = await import('../logger');
    const sentry = await import('../sentry');

    logger.error('erreur technique', 'boom', { area: 'react-error-boundary' });

    expect(errorSpy).toHaveBeenCalledWith('erreur technique', expect.any(Error), {
      area: 'react-error-boundary',
    });
    expect(sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      area: 'react-error-boundary',
    });
  });
});
