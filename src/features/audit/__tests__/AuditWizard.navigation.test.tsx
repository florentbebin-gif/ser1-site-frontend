// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuditWizard from '../AuditWizard';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

describe('AuditWizard navigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('avance, recule et permet l’accès direct aux étapes', async () => {
    render(<AuditWizard />);

    expect(screen.getByRole('heading', { name: 'Situation familiale' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));

    expect(screen.getByRole('heading', { name: 'Situation civile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: /Actifs/ }));

    expect(screen.getByRole('heading', { name: 'Actifs' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Précédent' }));

    expect(screen.getByRole('heading', { name: 'Situation civile' })).toBeInTheDocument();
  });
});
