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

async function openChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = screen
    .getAllByRole('button')
    .find(
      (candidate) =>
        candidate.classList.contains('settings-memento-chapter__header') &&
        candidate.textContent?.trim().startsWith(`${label} (`),
    );

  if (!button) throw new Error(`Chapitre mémento introuvable : ${label}`);
  await user.click(button);
}

async function openSubAccordion(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('button', { name: new RegExp(label, 'i') }));
}

describe('SettingsMemento — Base-Contrat', () => {
  it('rend le référentiel contrats depuis le chapitre Placements', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openChapter(user, 'Placements');
    await openSubAccordion(user, 'Paramètres calculateurs');

    expect(
      await screen.findByRole('radiogroup', { name: 'Audience' }, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });
});
