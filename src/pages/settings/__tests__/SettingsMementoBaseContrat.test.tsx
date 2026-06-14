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

async function openReadPart(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    const candidate = screen
      .getAllByRole('button')
      .find(
        (item): item is HTMLButtonElement =>
          item instanceof HTMLButtonElement &&
          item.classList.contains('settings-memento-part__header') &&
          item.textContent?.includes(label) === true,
      );

    if (!candidate) throw new Error(`Partie introuvable : ${label}`);
    return candidate;
  });

  await user.click(button);
}

async function openReadChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    const candidate = screen
      .getAllByRole('button')
      .find(
        (item): item is HTMLButtonElement =>
          item instanceof HTMLButtonElement &&
          item.classList.contains('settings-memento-read-chapter__header') &&
          item.textContent?.includes(label) === true,
      );

    if (!candidate) throw new Error(`Chapitre introuvable : ${label}`);
    return candidate;
  });

  await user.click(button);
}

describe('SettingsMemento — Base-Contrat', () => {
  it('rend le référentiel contrats depuis la partie chiffres clés', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(screen.queryByRole('radiogroup', { name: 'Audience' })).not.toBeInTheDocument();

    await openReadPart(user, 'Chiffres clés et produits réglementés');

    expect(
      await screen.findByRole('radiogroup', { name: 'Audience' }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Référentiel contrats/i })).toBeInTheDocument();
  });

  it('ne rend plus le référentiel contrats dans la lecture placements', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Impôt sur les sociétés et placements');
    await openReadChapter(user, 'Placements');

    expect(screen.queryByRole('radiogroup', { name: 'Audience' })).not.toBeInTheDocument();
    expect(screen.queryByText('Référentiel contrats')).not.toBeInTheDocument();
  });
});
