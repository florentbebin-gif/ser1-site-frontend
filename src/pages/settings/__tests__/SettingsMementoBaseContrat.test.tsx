// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
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

async function openInternalTab(user: ReturnType<typeof userEvent.setup>, name: RegExp | string) {
  await user.click(screen.getByRole('tab', { name }));
}

async function openCalculatorCard(user: ReturnType<typeof userEvent.setup>, label: string) {
  const buttons = await screen.findAllByRole('button');
  const button = buttons.find(
    (candidate): candidate is HTMLButtonElement =>
      candidate instanceof HTMLButtonElement &&
      candidate.classList.contains('settings-memento-calculator-card__header') &&
      candidate.textContent?.includes(label) === true,
  );

  if (!button) throw new Error(`Carte paramètres introuvable : ${label}`);
  await user.click(button);
}

describe('SettingsMemento — Base-Contrat', () => {
  it('rend le référentiel contrats depuis la vue paramètres calculateurs', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(screen.queryByRole('radiogroup', { name: 'Audience' })).not.toBeInTheDocument();

    await openInternalTab(user, /Paramètres calculateurs/i);
    await openCalculatorCard(user, 'Référentiel contrats');

    expect(
      await screen.findByRole('radiogroup', { name: 'Audience' }, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });
});
