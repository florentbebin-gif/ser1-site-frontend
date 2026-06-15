// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleState } from '@/auth/useUserRole';
import {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import { getLegalReference } from '@/domain/legal-references';
import { DmtgSuccessionProvider } from '../DmtgSuccession/DmtgSuccessionProvider';
import MementoDmtgEntrySection from '../memento/MementoDmtgEntrySection';
import { MementoGlobalSaveBar, MementoSaveProvider } from '@/hooks/settings/mementoSaveRegistry';

let isAdmin = true;
let taxSettingsData: unknown = DEFAULT_TAX_SETTINGS;
let fiscalitySettingsData: unknown = DEFAULT_FISCALITY_SETTINGS;
let authUserId: string | null = '11111111-1111-4111-8111-111111111111';
let loadGate: Promise<void> | null = null;
let releaseLoadGate: (() => void) | null = null;
const upsertCalls: Array<{ table: SettingsTable; payload: unknown }> = [];

type SettingsTable = 'tax_settings' | 'fiscality_settings';

function makeQueryBuilder(table: SettingsTable) {
  const listResult = {
    data: [
      {
        data: table === 'tax_settings' ? taxSettingsData : fiscalitySettingsData,
      },
    ],
    error: null,
  };
  const singleResult = {
    data: {
      data: table === 'tax_settings' ? taxSettingsData : fiscalitySettingsData,
    },
    error: null,
  };
  const writeResult = { data: null, error: null };

  const builder = {} as {
    select: () => typeof builder;
    eq: () => typeof builder;
    upsert: (payload: unknown) => Promise<typeof writeResult>;
    maybeSingle: () => Promise<typeof singleResult>;
    then: PromiseLike<typeof listResult>['then'];
  };

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.upsert = vi.fn((payload: unknown) => {
    upsertCalls.push({ table, payload });
    return Promise.resolve(writeResult);
  });
  builder.maybeSingle = vi.fn(() => Promise.resolve(singleResult));
  builder.then = (onFulfilled, onRejected) =>
    (loadGate ?? Promise.resolve()).then(() => listResult).then(onFulfilled, onRejected);

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

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: vi.fn(),
  broadcastInvalidation: vi.fn(),
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: authUserId ? { id: authUserId } : null },
          error: null,
        }),
      ),
    },
    from: vi.fn((table: SettingsTable) => makeQueryBuilder(table)),
  },
}));

async function renderDmtgEntry(entryKey: string, withSave = true) {
  render(
    <MementoSaveProvider>
      <DmtgSuccessionProvider>
        <MementoDmtgEntrySection entryKey={entryKey} />
      </DmtgSuccessionProvider>
      {withSave ? <MementoGlobalSaveBar isAdmin={isAdmin} /> : null}
    </MementoSaveProvider>,
  );

  await waitFor(() => {
    expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
  });
}

async function editDmtgFrereSoeurAbattement(value = '15933') {
  const input = screen.getByLabelText('Abattement frère/sœur');
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

async function editDmtgLigneDirecteAbattement(value: string) {
  const input = screen.getByLabelText('Abattement par enfant');
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

describe('DMTG dans les entrées du mémento', () => {
  beforeEach(() => {
    isAdmin = true;
    taxSettingsData = DEFAULT_TAX_SETTINGS;
    fiscalitySettingsData = DEFAULT_FISCALITY_SETTINGS;
    authUserId = '11111111-1111-4111-8111-111111111111';
    loadGate = null;
    releaseLoadGate = null;
    upsertCalls.length = 0;
  });

  it('ne bloque pas le contenu de lecture pendant le chargement DMTG', () => {
    loadGate = new Promise<void>((resolve) => {
      releaseLoadGate = resolve;
    });

    render(
      <MementoSaveProvider>
        <DmtgSuccessionProvider>
          <p>Lecture transmission disponible</p>
          <MementoDmtgEntrySection entryKey="transmission.succession-dmtg" />
        </DmtgSuccessionProvider>
        <MementoGlobalSaveBar isAdmin={isAdmin} />
      </MementoSaveProvider>,
    );

    expect(screen.getByText('Lecture transmission disponible')).toBeInTheDocument();
    expect(screen.getByText('Chargement des paramètres DMTG...')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Enregistrer les paramètres DMTG & succession/i }),
    ).not.toBeInTheDocument();

    releaseLoadGate?.();
  });

  it('bloque la sauvegarde admin quand le golden DMTG local dérive', async () => {
    taxSettingsData = {
      ...DEFAULT_TAX_SETTINGS,
      dmtg: {
        ...DEFAULT_TAX_SETTINGS.dmtg,
        ligneDirecte: {
          ...DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte,
          abattement: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement + 20_000,
        },
      },
    };

    await renderDmtgEntry('transmission.succession-dmtg');

    await editDmtgLigneDirecteAbattement('120000');

    const saveButton = screen.getByRole('button', { name: /Enregistrer les modifications/i });
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/Scénario conjoint \+ deux enfants 600 kEUR/i)).toBeInTheDocument();
  });

  it('autorise la sauvegarde admin quand le golden DMTG local passe', async () => {
    await renderDmtgEntry('transmission.succession-dmtg');

    await editDmtgFrereSoeurAbattement();

    const saveButton = screen.getByRole('button', { name: /Enregistrer les modifications/i });
    expect(saveButton).toBeEnabled();
    expect(
      screen.queryByText(/Scénario conjoint \+ deux enfants 600 kEUR/i),
    ).not.toBeInTheDocument();
  });

  it("trace l'utilisateur authentifié dans les deux écritures DMTG", async () => {
    await renderDmtgEntry('transmission.succession-dmtg');
    await editDmtgFrereSoeurAbattement();

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }));

    await waitFor(() => {
      expect(upsertCalls).toHaveLength(2);
    });
    expect(upsertCalls).toEqual(
      expect.arrayContaining([
        {
          table: 'tax_settings',
          payload: expect.objectContaining({ id: 1, updated_by: authUserId }),
        },
        {
          table: 'fiscality_settings',
          payload: expect.objectContaining({ id: 1, updated_by: authUserId }),
        },
      ]),
    );
  });

  it('charge un ancien blob DMTG et sauvegarde un format canonique', async () => {
    taxSettingsData = {
      ...DEFAULT_TAX_SETTINGS,
      dmtg: {
        abattementLigneDirecte: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
        scale: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
      },
    };

    await renderDmtgEntry('transmission.succession-dmtg');
    await editDmtgFrereSoeurAbattement();

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }));

    await waitFor(() => {
      expect(upsertCalls).toHaveLength(2);
    });
    const taxWrite = upsertCalls.find((call) => call.table === 'tax_settings')?.payload as {
      data?: { dmtg?: Record<string, unknown> };
    };
    expect(taxWrite.data?.dmtg).toHaveProperty('ligneDirecte');
    expect(taxWrite.data?.dmtg).not.toHaveProperty('abattementLigneDirecte');
    expect(taxWrite.data?.dmtg).not.toHaveProperty('scale');
  });

  it('bloque une écriture non canonique avant Supabase', async () => {
    fiscalitySettingsData = {
      ...DEFAULT_FISCALITY_SETTINGS,
      rulesetsByKey: {
        ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey,
        assuranceVie: {
          ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey.assuranceVie,
          rules: {
            ...DEFAULT_ASSURANCE_VIE_RULES,
            deces: {
              ...DEFAULT_ASSURANCE_VIE_RULES.deces,
              apres70ans: {
                ...DEFAULT_ASSURANCE_VIE_RULES.deces.apres70ans,
                globalAllowance: null,
              },
            },
          },
        },
      },
    };

    await renderDmtgEntry('transmission.assurance-vie-deces');
    const allowanceInput = screen.getByLabelText('Abattement par bénéficiaire');
    await userEvent.clear(allowanceInput);
    await userEvent.type(allowanceInput, '152501');

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erreur de validation du schéma DMTG/i)).toBeInTheDocument();
    });
    expect(upsertCalls).toHaveLength(0);
  });

  it('rend les blocs chiffrés en texte, sans inputs ni bouton, pour un non-admin', async () => {
    isAdmin = false;

    await renderDmtgEntry('transmission.succession-dmtg');

    expect(screen.getByText('100 000 €')).toBeInTheDocument();
    expect(screen.getByText('20 %')).toBeInTheDocument();
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: /Enregistrer les paramètres DMTG & succession/i }),
    ).not.toBeInTheDocument();
  });

  it('rend les inputs des blocs chiffrés seulement pour un admin', async () => {
    await renderDmtgEntry('transmission.assurance-vie-deces');

    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /Aucune modification à enregistrer/i }),
    ).toBeInTheDocument();
  });

  it('rend les références juridiques DMTG cliquables dans les entrées éclatées', async () => {
    await renderDmtgEntry('transmission.liberalites', false);

    const donationSimpleBlock = screen
      .getByText('Donation simple (pleine propriété)')
      .closest('.income-tax-block');

    expect(donationSimpleBlock).not.toBeNull();
    expect(
      within(donationSimpleBlock as HTMLElement).getByRole('link', { name: 'Art. 894' }),
    ).toHaveAttribute('href', getLegalReference('code-civil-894').officialUrl);
    expect(screen.queryByText(/C\. civ\. art\. 894/)).not.toBeInTheDocument();

    render(<MementoDmtgEntrySection entryKey="civil.reserve-quotite" />);
    expect(
      screen
        .getAllByRole('link', { name: 'Art. 913' })
        .some(
          (link) => link.getAttribute('href') === getLegalReference('code-civil-913').officialUrl,
        ),
    ).toBe(true);

    render(<MementoDmtgEntrySection entryKey="civil.devolution-conjoint-survivant" />);
    expect(
      screen
        .getAllByRole('link', { name: 'Art. 757' })
        .some(
          (link) => link.getAttribute('href') === getLegalReference('code-civil-757').officialUrl,
        ),
    ).toBe(true);
  });
});
