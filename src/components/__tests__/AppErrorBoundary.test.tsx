// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from '../AppErrorBoundary';
import { captureException } from '../../observability';

vi.mock('../../observability', () => ({
  captureException: vi.fn(),
}));

function ThrowingComponent(): never {
  throw new Error('Erreur contrôlée');
}

describe('AppErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const preventExpectedError = (event: ErrorEvent) => {
    if (event.error instanceof Error && event.error.message === 'Erreur contrôlée') {
      event.preventDefault();
    }
  };

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.addEventListener('error', preventExpectedError);
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.removeEventListener('error', preventExpectedError);
    consoleErrorSpy.mockRestore();
  });

  it('rend le fallback runtime et capture l’erreur React', () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Application Indisponible')).toBeInTheDocument();
    expect(screen.getByText(/Erreur contrôlée/)).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        area: 'react-error-boundary',
        componentStack: expect.any(String),
      }),
    );
  });
});
