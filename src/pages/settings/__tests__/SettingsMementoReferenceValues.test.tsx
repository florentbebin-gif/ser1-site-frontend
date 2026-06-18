// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';
import { DEFAULT_MEMENTO_REFERENCE_VALUES } from '@/domain/settings-memento/referenceValues';
import { invalidateMementoReferenceValuesCache } from '@/utils/cache/mementoReferenceValuesCache';

import SettingsMemento from '../SettingsMemento';

let isAdmin = false;
const fromMock = vi.hoisted(() => vi.fn());
const upsertMock = vi.hoisted(() => vi.fn());

function makeReferenceValuesBuilder() {
  const listResult = { data: DEFAULT_MEMENTO_REFERENCE_VALUES, error: null };
  const writeResult = { data: null, error: null };

  const builder = {} as {
    select: () => typeof builder;
    order: () => Promise<typeof listResult>;
    upsert: typeof upsertMock;
  };

  builder.select = () => builder;
  builder.order = () => Promise.resolve(listResult);
  builder.upsert = upsertMock.mockResolvedValue(writeResult);

  return builder;
}

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
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

describe('SettingsMemento — valeurs de référence', () => {
  beforeEach(() => {
    isAdmin = false;
    fromMock.mockReset();
    upsertMock.mockReset();
    fromMock.mockImplementation(() => makeReferenceValuesBuilder());
    invalidateMementoReferenceValuesCache();
  });

  it('affiche les valeurs des produits réglementés dans la fiche pour un non-admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Produits & enveloppes réglementés');

    expect(screen.queryByRole('heading', { name: 'Valeurs de référence' })).not.toBeInTheDocument();
    expect(
      await screen.findByRole('radiogroup', { name: 'Audience' }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Épargne bancaire/i }));
    await user.click(screen.getByRole('button', { name: /Livret A/i }));

    expect(await screen.findByRole('heading', { name: 'Chiffres clés' })).toBeInTheDocument();
    expect(screen.getByText(/22\s*950\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/1,5\s*%/)).toBeInTheDocument();
    expect(screen.queryByText('AGIRC-ARRCO — tranche T1')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Livret A — plafond — valeur')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les valeurs de référence' }),
    ).not.toBeInTheDocument();
  });

  it('laisse un admin éditer puis enregistrer les valeurs de la fiche produit via le bouton global', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Produits & enveloppes réglementés');
    await screen.findByRole('radiogroup', { name: 'Audience' });
    await user.click(screen.getByRole('button', { name: /Épargne bancaire/i }));
    await user.click(screen.getByRole('button', { name: /Livret A/i }));

    const livretAInput = await screen.findByLabelText('Livret A — plafond — valeur');
    expect(livretAInput).toBeEnabled();

    await user.clear(livretAInput);
    await user.type(livretAInput, '23000');

    const globalSaveButton = await screen.findByRole('button', {
      name: 'Enregistrer les modifications',
    });
    await waitFor(() => {
      expect(globalSaveButton).toBeEnabled();
    });

    await openReadPart(user, 'Produits & enveloppes réglementés');
    await user.click(globalSaveButton);

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'livret-a-plafond',
            value_numeric: 23000,
          }),
        ]),
        { onConflict: 'key,year' },
      );
    });
    const payload = upsertMock.mock.calls[0]?.[0] as Array<{ domain: string }> | undefined;
    expect(payload?.every((row) => row.domain === 'chiffres-cles')).toBe(true);
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les valeurs de référence' }),
    ).not.toBeInTheDocument();
  });

  it('affiche les repères sociaux en lecture pour un non-admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Social et protection sociale');

    expect(
      await screen.findByRole('heading', { name: 'Valeurs sociales de référence' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('CSM — taux maximal')).toBeInTheDocument();
    expect(await screen.findByText('AGIRC-ARRCO — tranche T1')).toBeInTheDocument();
    expect(await screen.findByText('PEE — plafond d’abondement')).toBeInTheDocument();
    expect(
      screen.getByText('Employeur 4,72 % · salarié 3,15 % · total 7,87 %'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Livret A — plafond')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('AGIRC-ARRCO — tranche T1 — valeur')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les valeurs mémento' }),
    ).not.toBeInTheDocument();
  });

  it('affiche les valeurs de démembrement en lecture pour un non-admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Démembrement');

    expect(
      await screen.findByRole('heading', { name: 'Valeurs de démembrement' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Moins de vingt et un ans révolus')).toBeInTheDocument();
    expect(await screen.findByText('Usufruit temporaire — période de dix ans')).toBeInTheDocument();
    expect(screen.getByText('Usufruit 90 % · nue-propriété 10 %')).toBeInTheDocument();
    expect(screen.getByText('23 %')).toBeInTheDocument();
    expect(screen.queryByText('Livret A — plafond')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Moins de vingt et un ans révolus — valeur'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Usufruit temporaire — période de dix ans — valeur'),
    ).not.toBeInTheDocument();
  });

  it('laisse un admin éditer et enregistrer une valeur de démembrement via le bouton global', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Démembrement');

    const usufruitInput = await screen.findByLabelText('Moins de vingt et un ans révolus — valeur');
    expect(usufruitInput).toBeEnabled();

    fireEvent.change(usufruitInput, {
      target: { value: 'Usufruit 90 % · nue-propriété 10 % — ligne revue' },
    });
    const globalSaveButton = await screen.findByRole('button', {
      name: 'Enregistrer les modifications',
    });
    await waitFor(() => {
      expect(globalSaveButton).toBeEnabled();
    });
    await openReadPart(user, 'Démembrement');
    await user.click(globalSaveButton);

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'usufruit-viager-moins-21',
            value_text: 'Usufruit 90 % · nue-propriété 10 % — ligne revue',
          }),
        ]),
        { onConflict: 'key,year' },
      );
    });
  });

  it('affiche les valeurs internationales en lecture pour un non-admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité internationale');

    expect(
      await screen.findByRole('heading', { name: 'Valeurs internationales' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('IR non-résidents — première fraction')).toBeInTheDocument();
    expect(await screen.findByText('IFI non-résidents — assiette française')).toBeInTheDocument();
    expect(
      await screen.findByText('Assurance-vie décès — bénéficiaire résident fiscal français'),
    ).toBeInTheDocument();
    expect(await screen.findByText('PVI non-résidents — personne physique')).toBeInTheDocument();
    expect(screen.getAllByText('20 %').length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        'Actifs immobiliers français et parts à proportion de l’immobilier français taxable',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Livret A — plafond')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('IR non-résidents — première fraction — valeur'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('IFI non-résidents — assiette française — valeur'),
    ).not.toBeInTheDocument();
  });

  it('laisse un admin éditer et enregistrer une valeur sociale textuelle via le bouton global', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Social et protection sociale');

    const agircInput = await screen.findByLabelText('AGIRC-ARRCO — tranche T1 — valeur');
    expect(agircInput).toBeEnabled();

    fireEvent.change(agircInput, {
      target: { value: 'Employeur 4,72 % / salarié 3,15 % / total 7,87 %' },
    });
    const globalSaveButton = await screen.findByRole('button', {
      name: 'Enregistrer les modifications',
    });
    await waitFor(() => {
      expect(globalSaveButton).toBeEnabled();
    });
    await user.click(globalSaveButton);

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'agirc-arrco-t1',
            value_text: 'Employeur 4,72 % / salarié 3,15 % / total 7,87 %',
          }),
        ]),
        { onConflict: 'key,year' },
      );
    });
  });
});
