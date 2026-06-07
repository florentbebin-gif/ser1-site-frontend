// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleState } from '@/auth/useUserRole';
import SettingsPrelevements from '../SettingsPrelevements';

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

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
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

describe('SettingsPrelevements', () => {
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

    render(<SettingsPrelevements />);

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

  it('expose les settings sociaux planifiés sans contrôle éditable', async () => {
    render(<SettingsPrelevements />);

    await screen.findByText('Registre settings');

    expect(screen.getByText('Planifié')).toBeInTheDocument();
    expect(screen.getByText('Charges sociales dirigeant')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Charges sociales dirigeant/i })).toBeNull();
  });

  it("n'affiche pas le succès global si la sauvegarde PASS échoue", async () => {
    const user = userEvent.setup();
    passUpsertMock.mockResolvedValueOnce({ error: { message: 'PASS refusé' } });

    render(<SettingsPrelevements />);

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
