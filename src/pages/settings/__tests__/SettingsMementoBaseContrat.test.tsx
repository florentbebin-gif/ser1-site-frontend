// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SettingsMemento from '../SettingsMemento';

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => ({
    role: 'admin',
    user: null,
    isAdmin: true,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: undefined,
    loading: false,
    error: null,
    meta: {},
  }),
}));

vi.mock('@/utils/cache/baseContratOverridesCache', () => ({
  getBaseContratOverrides: vi.fn(() => Promise.resolve({})),
  upsertBaseContratOverride: vi.fn(() => Promise.resolve()),
}));

async function openCalculatorCard(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    const candidate = screen
      .getAllByRole('button')
      .find(
        (item): item is HTMLButtonElement =>
          item instanceof HTMLButtonElement &&
          item.classList.contains('settings-memento-calculator-card__header') &&
          item.textContent?.includes(label) === true,
      );

    if (!candidate) throw new Error(`Carte paramètres introuvable : ${label}`);
    return candidate;
  });

  await user.click(button);
}

async function openAdminSection(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    const candidate = screen
      .getAllByRole('button')
      .find(
        (item): item is HTMLButtonElement =>
          item instanceof HTMLButtonElement &&
          item.classList.contains('settings-memento-admin-section__header') &&
          item.textContent?.includes(label) === true,
      );

    if (!candidate) throw new Error(`Section admin introuvable : ${label}`);
    return candidate;
  });

  await user.click(button);
}

describe('SettingsMemento — Base-Contrat', () => {
  it('rend le référentiel contrats depuis la vue paramètres calculateurs', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(screen.queryByRole('radiogroup', { name: 'Audience' })).not.toBeInTheDocument();

    await openAdminSection(user, 'Paramètres calculateurs');
    await openCalculatorCard(user, 'Référentiel contrats');

    expect(
      await screen.findByRole('radiogroup', { name: 'Audience' }, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });
});
