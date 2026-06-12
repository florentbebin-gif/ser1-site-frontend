// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleState } from '@/auth/useUserRole';
import PrelevementsSettingsPanel from '../Prelevements/PrelevementsSettingsPanel';

let isAdmin = true;

const psUpsertMock = vi.hoisted(() => vi.fn());
const passUpsertMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const invalidateMock = vi.hoisted(() => vi.fn());
const broadcastInvalidationMock = vi.hoisted(() => vi.fn());

const psRows = [
  {
    data: {
      labels: {
        currentYearLabel: '2026 (RFR 2024 & Avis IR 2025)',
        previousYearLabel: '2025 (RFR 2023 & Avis IR 2024)',
      },
      patrimony: {
        current: { generalRate: 17.2, exceptionRate: 15.5, csgDeductibleRate: 6.8 },
        previous: { generalRate: 17.2, exceptionRate: 15.5, csgDeductibleRate: 6.8 },
      },
    },
  },
];

const taxRows = [
  {
    data: {
      incomeTax: {
        currentYearLabel: '2026 (revenus 2025)',
        previousYearLabel: '2025 (revenus 2024)',
      },
    },
  },
];

const passRows = [
  { year: 2025, pass_amount: 47100 },
  { year: 2026, pass_amount: 48060 },
];

function selectResult(rows: unknown[]) {
  return {
    select: () => ({
      eq: () => Promise.resolve({ data: rows, error: null }),
    }),
  };
}

function passHistoryResult() {
  return {
    select: () => ({
      order: () => Promise.resolve({ data: passRows, error: null }),
    }),
    upsert: passUpsertMock,
  };
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
    rpc: rpcMock,
  },
}));

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: invalidateMock,
  broadcastInvalidation: broadcastInvalidationMock,
}));

describe('PrelevementsSettingsPanel', () => {
  beforeEach(() => {
    isAdmin = true;
    psUpsertMock.mockReset();
    psUpsertMock.mockResolvedValue({ error: null });
    passUpsertMock.mockReset();
    passUpsertMock.mockResolvedValue({ error: null });
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
    invalidateMock.mockReset();
    invalidateMock.mockResolvedValue(undefined);
    broadcastInvalidationMock.mockReset();
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      if (table === 'ps_settings') {
        return {
          ...selectResult(psRows),
          upsert: psUpsertMock,
        };
      }
      if (table === 'tax_settings') return selectResult(taxRows);
      if (table === 'pass_history') return passHistoryResult();
      throw new Error(`Table inattendue : ${table}`);
    });
  });

  it('sauvegarde les prélèvements et le PASS avec le bouton global', async () => {
    const user = userEvent.setup();

    render(<PrelevementsSettingsPanel />);

    await screen.findByRole('button', { name: /Historique du PASS/i });
    await user.click(screen.getByRole('button', { name: /Historique du PASS/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue('47100')).toBeInTheDocument();
    });

    const passSection = screen.getByRole('region', { name: /Historique du PASS/i });
    const passInput = within(passSection).getByDisplayValue('47100');
    await user.clear(passInput);
    await user.type(passInput, '47200');

    await user.click(screen.getByRole('button', { name: 'Enregistrer les paramètres' }));

    await waitFor(() => {
      expect(psUpsertMock).toHaveBeenCalledTimes(1);
      expect(passUpsertMock).toHaveBeenCalledTimes(1);
    });
    expect(passUpsertMock).toHaveBeenCalledWith(
      [
        { year: 2025, pass_amount: 47200 },
        { year: 2026, pass_amount: 48060 },
      ],
      { onConflict: 'year' },
    );
    expect(screen.getByText('Paramètres de prélèvements sociaux enregistrés.')).toBeInTheDocument();
  });

  it('édite les charges sociales dirigeant sourcées dans ps_settings', async () => {
    const user = userEvent.setup();

    render(<PrelevementsSettingsPanel />);

    await screen.findByRole('button', { name: /Charges sociales dirigeant/i });
    await user.click(screen.getByRole('button', { name: /Charges sociales dirigeant/i }));

    const section = screen.getByRole('region', { name: /Charges sociales dirigeant/i });
    expect(within(section).getByText('Partiel')).toBeInTheDocument();
    expect(within(section).getByText(/Rémunération TNS.*à compléter/i)).toBeInTheDocument();
    expect(
      within(section).getByText(/Rémunération assimilé salarié.*à compléter/i),
    ).toBeInTheDocument();
    expect(within(section).getByText(/Tranches TA\/TB\/TC.*à compléter/i)).toBeInTheDocument();

    const dividendThresholdInput = within(section).getByLabelText(
      'Seuil dividendes TNS soumis aux charges sociales',
    );
    await user.clear(dividendThresholdInput);
    await user.type(dividendThresholdInput, '12');

    await user.click(screen.getByRole('button', { name: 'Enregistrer les paramètres' }));

    await waitFor(() => {
      expect(psUpsertMock).toHaveBeenCalledTimes(1);
    });

    const savedPayload = psUpsertMock.mock.calls[0]?.[0] as {
      data: {
        socialDirigeant: {
          current: {
            dividends: { tnsSocialBasePct: number };
            remuneration: {
              tns: { status: string };
              assimileSalarie: { status: string };
            };
            passTranches: { status: string };
          };
        };
      };
    };
    expect(savedPayload.data.socialDirigeant.current.dividends.tnsSocialBasePct).toBe(12);
    expect(savedPayload.data.socialDirigeant.current.remuneration.tns.status).toBe('a-completer');
    expect(savedPayload.data.socialDirigeant.current.remuneration.assimileSalarie.status).toBe(
      'a-completer',
    );
    expect(savedPayload.data.socialDirigeant.current.passTranches.status).toBe('a-completer');
  });

  it('empêche la sauvegarde des charges sociales dirigeant incohérentes', async () => {
    const user = userEvent.setup();

    render(<PrelevementsSettingsPanel />);

    await screen.findByRole('button', { name: /Charges sociales dirigeant/i });
    await user.click(screen.getByRole('button', { name: /Charges sociales dirigeant/i }));

    const section = screen.getByRole('region', { name: /Charges sociales dirigeant/i });
    const dividendThresholdInput = within(section).getByLabelText(
      'Seuil dividendes TNS soumis aux charges sociales',
    );
    await user.clear(dividendThresholdInput);
    await user.type(dividendThresholdInput, '101');

    expect(screen.getByRole('button', { name: 'Erreurs de validation' })).toBeDisabled();
    expect(
      screen.getByText(/socialDirigeant\.current\.dividends\.tnsSocialBasePct/i),
    ).toBeInTheDocument();
    expect(psUpsertMock).not.toHaveBeenCalled();
  });

  it("n'affiche pas le succès global si la sauvegarde PASS échoue", async () => {
    const user = userEvent.setup();
    passUpsertMock.mockResolvedValueOnce({ error: { message: 'PASS refusé' } });

    render(<PrelevementsSettingsPanel />);

    await screen.findByRole('button', { name: /Historique du PASS/i });
    await user.click(screen.getByRole('button', { name: 'Enregistrer les paramètres' }));

    await waitFor(() => {
      expect(psUpsertMock).toHaveBeenCalledTimes(1);
      expect(passUpsertMock).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByText('Paramètres de prélèvements sociaux enregistrés.'),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Erreur lors de l'enregistrement du PASS.")).toBeInTheDocument();
  });
});
