// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';
import SettingsMemento from '../SettingsMemento';

configure({ asyncUtilTimeout: 5_000 });
vi.setConfig({ testTimeout: 15_000 });

let isAdmin = false;

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
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

const FISCALITE_FOYER_TABS = /Sections du chapitre Fiscalité foyer/i;

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

function searchMemento(value: string) {
  const search = screen.getByRole('searchbox', { name: /Rechercher dans le mémento/i });
  fireEvent.change(search, { target: { value } });
}

describe('SettingsMemento — filtre mot-clé global', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('réduit la lecture aux parties pertinentes', async () => {
    render(<SettingsMemento />);

    expect(partHeader(/Social et protection sociale/)).toBeDefined();

    searchMemento('usufruit');

    await waitFor(() => {
      expect(partHeader(/Social et protection sociale/)).toBeUndefined();
    });
    expect(partHeader(/Démembrement/)).toBeDefined();
  });

  it('cherche aussi dans l’éditorial des chapitres', async () => {
    render(<SettingsMemento />);

    searchMemento('Personnes à protéger');

    await waitFor(() => {
      expect(partHeader(/Droit civil/)).toBeDefined();
      expect(partHeader(/Social et protection sociale/)).toBeUndefined();
    });
  });

  it('atteint le catalogue produits (Livret A)', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    searchMemento('Livret A');
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
    render(<SettingsMemento />);

    searchMemento('CEG');

    await waitFor(() => {
      expect(partHeader(/Social et protection sociale/)).toBeDefined();
    });
  });

  it('atteint une source visible au lecteur sans exposer les statuts admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    searchMemento('CARPV');

    await waitFor(() => {
      expect(partHeader(/Social et protection sociale/)).toBeDefined();
      expect(partHeader(/Fiscalité/)).toBeUndefined();
    });

    await selectMementoTab(user, /Sections du chapitre Retraite/i, 'Sources & couverture');

    expect(
      await screen.findByRole('link', { name: 'Statuts de la section professionnelle' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/A - Couverture :/)).not.toBeInTheDocument();
    expect(screen.queryByText('carpv-statuts-retraite-prevoyance')).not.toBeInTheDocument();
  });

  it('ne recherche pas les libellés de statut pour un lecteur non-admin', async () => {
    const { container } = render(<SettingsMemento />);

    searchMemento('A - Couverture : partielle');

    expect(await screen.findByText(/Aucun résultat pour/)).toBeInTheDocument();
    expect(container.querySelectorAll('.settings-memento-status')).toHaveLength(0);
  });

  it('atteint une source par refId brut en mode admin', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    searchMemento('carpv-statuts-retraite-prevoyance');

    await waitFor(() => {
      expect(partHeader(/Social et protection sociale/)).toBeDefined();
      expect(partHeader(/Fiscalité/)).toBeUndefined();
    });

    await selectMementoTab(user, /Sections du chapitre Retraite/i, 'Sources & couverture');

    expect(
      await screen.findByRole('link', { name: 'Statuts de la section professionnelle' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('A - Couverture : partielle').length).toBeGreaterThan(0);
  });

  it('atteint les sources par statut en mode admin', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    searchMemento('A - Couverture : partielle');

    await waitFor(() => {
      expect(partHeader(/Fiscalité/)).toBeDefined();
    });

    await selectMementoTab(user, FISCALITE_FOYER_TABS, 'Sources & couverture');

    expect(screen.getAllByText('A - Couverture : partielle').length).toBeGreaterThan(0);
  });

  it('affiche un état vide global quand rien ne correspond', async () => {
    render(<SettingsMemento />);

    searchMemento('zzzznomatch');

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
