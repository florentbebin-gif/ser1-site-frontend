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
import SettingsDmtgSuccession from '../SettingsDmtgSuccession';

let isAdmin = true;
let taxSettingsData: unknown = DEFAULT_TAX_SETTINGS;
let fiscalitySettingsData: unknown = DEFAULT_FISCALITY_SETTINGS;
let authUserId: string | null = '11111111-1111-4111-8111-111111111111';
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
    Promise.resolve(listResult).then(onFulfilled, onRejected);

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

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
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

describe('SettingsDmtgSuccession', () => {
  beforeEach(() => {
    isAdmin = true;
    taxSettingsData = DEFAULT_TAX_SETTINGS;
    fiscalitySettingsData = DEFAULT_FISCALITY_SETTINGS;
    authUserId = '11111111-1111-4111-8111-111111111111';
    upsertCalls.length = 0;
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

    render(<SettingsDmtgSuccession />);

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Golden DMTG bloqué/i });
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/Scénario conjoint \+ deux enfants 600 kEUR/i)).toBeInTheDocument();
  });

  it('autorise la sauvegarde admin quand le golden DMTG local passe', async () => {
    render(<SettingsDmtgSuccession />);

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Enregistrer DMTG & Succession/i });
    expect(saveButton).toBeEnabled();
    expect(
      screen.queryByText(/Scénario conjoint \+ deux enfants 600 kEUR/i),
    ).not.toBeInTheDocument();
  });

  it('expose le registre settings transmission et placements en lecture seule', async () => {
    render(<SettingsDmtgSuccession />);

    await screen.findByText('Registre settings');

    expect(screen.getByText('Partiel')).toBeInTheDocument();
    expect(screen.getByText('Planifié')).toBeInTheDocument();
    expect(screen.getByText('Pacte Dutreil')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pacte Dutreil/i })).toBeNull();
  });

  it("trace l'utilisateur authentifié dans les deux écritures DMTG", async () => {
    render(<SettingsDmtgSuccession />);

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer DMTG & Succession/i }));

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

    render(<SettingsDmtgSuccession />);

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer DMTG & Succession/i }));

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

    render(<SettingsDmtgSuccession />);

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer DMTG & Succession/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erreur de validation du schéma DMTG/i)).toBeInTheDocument();
    });
    expect(upsertCalls).toHaveLength(0);
  });

  it('rend les références juridiques DMTG cliquables', async () => {
    render(<SettingsDmtgSuccession />);

    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Libéralités/i }));
    const donationSimpleBlock = screen
      .getByText('Donation simple (pleine propriété)')
      .closest('.income-tax-block');

    expect(donationSimpleBlock).not.toBeNull();
    expect(
      within(donationSimpleBlock as HTMLElement).getByRole('link', { name: 'Art. 894' }),
    ).toHaveAttribute('href', getLegalReference('code-civil-894').officialUrl);
    expect(screen.queryByText(/C\. civ\. art\. 894/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Avantages matrimoniaux/i }));
    expect(
      screen
        .getAllByRole('link', { name: 'Art. 1527' })
        .some(
          (link) => link.getAttribute('href') === getLegalReference('code-civil-1527').officialUrl,
        ),
    ).toBe(true);

    await userEvent.click(
      screen.getByRole('button', { name: /Réserve héréditaire & droits du conjoint/i }),
    );
    expect(screen.getByRole('link', { name: 'Art. 913' })).toHaveAttribute(
      'href',
      getLegalReference('code-civil-913').officialUrl,
    );
    expect(screen.getByRole('link', { name: 'Art. 757' })).toHaveAttribute(
      'href',
      getLegalReference('code-civil-757').officialUrl,
    );

    await userEvent.click(screen.getByRole('button', { name: /Assurance-vie décès/i }));
    expect(
      screen
        .getAllByRole('link', { name: 'Art. 990 I' })
        .some((link) => link.getAttribute('href') === getLegalReference('cgi-990-i').officialUrl),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: 'Art. 757 B' })
        .some((link) => link.getAttribute('href') === getLegalReference('cgi-757-b').officialUrl),
    ).toBe(true);
  });
});
