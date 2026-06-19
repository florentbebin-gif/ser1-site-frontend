// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SettingsMemento from '../SettingsMemento';

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => ({
    role: 'user',
    user: null,
    isAdmin: false,
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

async function selectMementoTab(
  user: ReturnType<typeof userEvent.setup>,
  tablistName: RegExp | string,
  tabName: RegExp | string,
) {
  const tablist = await screen.findByRole('tablist', { name: tablistName });
  const tab = await within(tablist).findByRole('tab', { name: tabName });
  await user.click(tab);
}

function partHeader(label: RegExp): HTMLButtonElement | undefined {
  return screen
    .queryAllByRole('button')
    .find(
      (item): item is HTMLButtonElement =>
        item instanceof HTMLButtonElement &&
        item.classList.contains('settings-memento-part__header') &&
        label.test(item.textContent ?? ''),
    );
}

describe('SettingsMemento — filtre mot-clé global', () => {
  it('réduit la lecture aux parties pertinentes', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(partHeader(/Social et protection sociale/)).toBeDefined();

    const search = screen.getByRole('searchbox', { name: /Rechercher dans le mémento/i });
    await user.type(search, 'usufruit');

    await waitFor(() => {
      expect(partHeader(/Social et protection sociale/)).toBeUndefined();
    });
    expect(partHeader(/Démembrement/)).toBeDefined();
  });

  it('cherche aussi dans l’éditorial des chapitres', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    const search = screen.getByRole('searchbox', { name: /Rechercher dans le mémento/i });
    await user.type(search, 'Personnes à protéger');

    await waitFor(() => {
      expect(partHeader(/Droit civil/)).toBeDefined();
      expect(partHeader(/Social et protection sociale/)).toBeUndefined();
    });
  });

  it('atteint le catalogue produits (Livret A)', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    const search = screen.getByRole('searchbox', { name: /Rechercher dans le mémento/i });
    await user.type(search, 'Livret A');
    await selectMementoTab(
      user,
      /Sections de Produits & enveloppes réglementés/i,
      'Paramètres de référence',
    );

    expect(
      await screen.findByRole('radiogroup', { name: 'Audience' }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^Livret A/i })).toBeInTheDocument();
  });

  it('atteint les valeurs des tables de référence (CEG)', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    const search = screen.getByRole('searchbox', { name: /Rechercher dans le mémento/i });
    await user.type(search, 'CEG');

    await waitFor(() => {
      expect(partHeader(/Social et protection sociale/)).toBeDefined();
    });
  });

  it('affiche un état vide global quand rien ne correspond', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    const search = screen.getByRole('searchbox', { name: /Rechercher dans le mémento/i });
    await user.type(search, 'zzzznomatch');

    expect(await screen.findByText(/Aucun résultat pour/)).toBeInTheDocument();
    expect(partHeader(/Produits & enveloppes/)).toBeUndefined();
  });
});

describe('SettingsMemento — prudence lecteur', () => {
  it("n'expose aucune pastille de statut au lecteur non-admin", async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Lexique');

    // Le contenu du lexique est rendu, mais le lecteur ne voit aucune pastille de statut.
    expect((await screen.findAllByText('Acquêts')).length).toBeGreaterThan(0);
    expect(screen.queryByText('À manier avec prudence')).not.toBeInTheDocument();
    expect(screen.queryByText('Chantier prévu')).not.toBeInTheDocument();
    expect(screen.queryByText('Pas encore traité')).not.toBeInTheDocument();
    expect(screen.queryByText('Périmètre en cours')).not.toBeInTheDocument();
  });
});
