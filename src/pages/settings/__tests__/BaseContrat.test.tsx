// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BaseContratSettingsPanel from '../BaseContrat/BaseContratSettingsPanel';
import type { UserRoleState } from '@/auth/useUserRole';
import type { ProductRules } from '@/domain/base-contrat/rules';
import { getLegalReference } from '@/domain/legal-references';
import {
  DEFAULT_MEMENTO_REFERENCE_VALUES,
  type MementoReferenceValue,
} from '@/domain/settings-memento/referenceValues';

let isAdmin = false;

const getBaseContratOverridesMock = vi.fn();
const upsertBaseContratOverrideMock = vi.fn();
const useMementoReferenceValuesMock = vi.hoisted(() => vi.fn());
const handleReferenceNumericChangeMock = vi.hoisted(() => vi.fn());
const handleReferenceTextChangeMock = vi.hoisted(() => vi.fn());
const saveReferenceValuesMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/utils/cache/baseContratOverridesCache', () => ({
  getBaseContratOverrides: () => getBaseContratOverridesMock(),
  upsertBaseContratOverride: (payload: unknown) => upsertBaseContratOverrideMock(payload),
}));

vi.mock('@/hooks/settings/useMementoReferenceValues', () => ({
  useMementoReferenceValues: (admin: boolean, options?: unknown) =>
    useMementoReferenceValuesMock(admin, options),
}));

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {},
    loading: false,
    error: null,
    meta: {},
  }),
}));

const mockedRules: ProductRules = {
  constitution: [
    {
      title: 'Fiscalité de test',
      bullets: ['À confirmer selon le régime applicable.'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 990 I CGI',
          refId: 'cgi-990-i',
        },
      ],
      dependencies: ['Validation notaire', 'source officielle ou contractuelle applicable'],
    },
  ],
  sortie: [],
  deces: [],
};

vi.mock('@/domain/base-contrat/rules/index', () => ({
  getRules: vi.fn(() => mockedRules),
  buildBaseContratFiscalLabels: vi.fn(() => ({
    pfu: 'PFU de test',
    pfuIr: 'IR de test',
    psGeneral: 'PS de test',
    psException: 'PS exception de test',
    dmtgLigneDirecteAbattement: 'abattement de test',
    assuranceVie990IAllowance: '990 I de test',
    assuranceVie757BAllowance: '757 B de test',
    assuranceVie990IRates: 'barème 990 I de test',
    assuranceVieRachatMoins8Ans: 'rachat avant huit ans de test',
    assuranceVieRachatPlus8Ans: 'rachat après huit ans de test',
    assuranceVieRetraitsPs: 'PS assurance-vie de test',
    capitalGainIr: 'IR PV de test',
    malrauxReductionRates: 'Malraux de test',
    microFoncierAbattement: 'micro-foncier de test',
    peaVersementCeilings: 'plafond PEA de test',
    peaPmeVersementCeilings: 'plafond PEA-PME de test',
    preciousMetalsFlatTax: 'taxe métaux de test',
    rvtoTaxableFractions: 'RVTO de test',
    soficaReductionRates: 'SOFICA de test',
    ifiResidencePrincipaleAbattement: 'IFI de test',
  })),
}));

function mockReferenceValuesHook(rows: readonly MementoReferenceValue[] = []) {
  useMementoReferenceValuesMock.mockReturnValue({
    rows,
    loading: false,
    saving: false,
    error: null,
    handleNumericChange: handleReferenceNumericChangeMock,
    handleTextChange: handleReferenceTextChangeMock,
    save: saveReferenceValuesMock,
  });
}

async function openFirstProduct() {
  render(<BaseContratSettingsPanel />);

  await screen.findByRole('radiogroup', { name: 'Audience' });
  await userEvent.click(screen.getByRole('button', { name: /Assurance prévoyance/i }));
  const productHeader = screen.getByRole('button', { name: /Assurance dépendance/i });
  await userEvent.click(productHeader);
  return productHeader;
}

describe('BaseContratSettingsPanel', () => {
  beforeEach(() => {
    isAdmin = false;
    getBaseContratOverridesMock.mockReset();
    getBaseContratOverridesMock.mockResolvedValue({});
    upsertBaseContratOverrideMock.mockReset();
    upsertBaseContratOverrideMock.mockResolvedValue(undefined);
    useMementoReferenceValuesMock.mockReset();
    handleReferenceNumericChangeMock.mockReset();
    handleReferenceTextChangeMock.mockReset();
    saveReferenceValuesMock.mockReset();
    saveReferenceValuesMock.mockResolvedValue({ ok: true });
    mockReferenceValuesHook();
  });

  it('utilise un bouton natif pour ouvrir un produit', async () => {
    const productHeader = await openFirstProduct();

    expect(productHeader.tagName).toBe('BUTTON');
  });

  it('rend le choix audience comme un radiogroup', async () => {
    render(<BaseContratSettingsPanel />);

    await screen.findByRole('radiogroup', { name: 'Audience' });

    expect(screen.getByRole('radiogroup', { name: 'Audience' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Audience' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Particulier' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await userEvent.click(screen.getByRole('radio', { name: 'Entreprise' }));

    expect(screen.getByRole('radio', { name: 'Entreprise' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('affiche les sources aux non-admins sans afficher la confiance ni les dépendances', async () => {
    await openFirstProduct();

    await waitFor(() => {
      expect(screen.getByText('Fiscalité de test')).toBeInTheDocument();
    });
    expect(screen.queryByText('C1 - Source qualité : à vérifier')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Art. 990 I CGI' })).toHaveAttribute(
      'href',
      getLegalReference('cgi-990-i').officialUrl,
    );
    expect(screen.queryByText('Validation notaire')).not.toBeInTheDocument();
  });

  it('affiche les sources et la confiance aux admins sans afficher les dépendances', async () => {
    isAdmin = true;

    await openFirstProduct();

    expect(await screen.findByText('C1 - Source qualité : à vérifier')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Art. 990 I CGI' })).toHaveAttribute(
      'href',
      getLegalReference('cgi-990-i').officialUrl,
    );
    expect(screen.queryByText('Validation notaire')).not.toBeInTheDocument();
    expect(
      screen.queryByText('source officielle ou contractuelle applicable'),
    ).not.toBeInTheDocument();
  });

  it('masque le statut de revue des overrides aux non-admins', async () => {
    getBaseContratOverridesMock.mockResolvedValue({
      assurance_dependance: {
        product_id: 'assurance_dependance',
        closed_date: null,
        note_admin: null,
        review_status: 'a_revoir',
        review_reason: 'Source fiscale à relire',
        next_review_at: '2026-07-01',
        updated_at: '2026-05-08T00:00:00.000Z',
      },
    });

    await openFirstProduct();

    expect(screen.queryByText('B - Revue : À revoir')).not.toBeInTheDocument();
    expect(screen.queryByText('Source fiscale à relire')).not.toBeInTheDocument();
    expect(screen.queryByText('2026-07-01')).not.toBeInTheDocument();
  });

  it('affiche le statut de revue des overrides aux admins', async () => {
    isAdmin = true;
    getBaseContratOverridesMock.mockResolvedValue({
      assurance_dependance: {
        product_id: 'assurance_dependance',
        closed_date: null,
        note_admin: null,
        review_status: 'a_revoir',
        review_reason: 'Source fiscale à relire',
        next_review_at: '2026-07-01',
        updated_at: '2026-05-08T00:00:00.000Z',
      },
    });

    await openFirstProduct();

    expect(await screen.findByText('B - Revue : À revoir')).toBeInTheDocument();
    expect(screen.getByText('Source fiscale à relire')).toBeInTheDocument();
    expect(screen.getByText('2026-07-01')).toBeInTheDocument();
  });

  it('affiche les valeurs de référence du produit sans champs en lecture non-admin', async () => {
    mockReferenceValuesHook(DEFAULT_MEMENTO_REFERENCE_VALUES);
    render(<BaseContratSettingsPanel />);

    await screen.findByRole('radiogroup', { name: 'Audience' });
    await userEvent.click(screen.getByRole('button', { name: /Épargne bancaire/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Livret A/i }));

    expect(await screen.findByRole('heading', { name: 'Chiffres clés' })).toBeInTheDocument();
    expect(screen.getByText(/22\s*950\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/1,5\s*%/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Livret A — plafond — valeur')).not.toBeInTheDocument();
    expect(screen.queryByText(/12\s*000\s*€/)).not.toBeInTheDocument();
  });

  it('laisse un admin éditer les valeurs de référence sans bouton local', async () => {
    isAdmin = true;
    mockReferenceValuesHook(DEFAULT_MEMENTO_REFERENCE_VALUES);
    render(<BaseContratSettingsPanel />);

    await screen.findByRole('radiogroup', { name: 'Audience' });
    await userEvent.click(screen.getByRole('button', { name: /Épargne bancaire/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Livret A/i }));

    const plafondInput = await screen.findByLabelText('Livret A — plafond — valeur');
    fireEvent.change(plafondInput, { target: { value: '23000' } });

    expect(handleReferenceNumericChangeMock).toHaveBeenCalledWith(
      'livret-a-plafond',
      'value_numeric',
      '23000',
    );
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les valeurs de référence' }),
    ).not.toBeInTheDocument();
    expect(saveReferenceValuesMock).not.toHaveBeenCalled();
  });

  it('sauvegarde les champs de revue depuis la modale admin', async () => {
    isAdmin = true;

    await openFirstProduct();
    await userEvent.click(screen.getAllByRole('button', { name: 'Clôturer' })[0]);
    await userEvent.selectOptions(
      screen.getByLabelText(/Statut de revue/i),
      'obsolescence_a_confirmer',
    );
    await userEvent.type(screen.getByLabelText(/Raison de revue/i), 'Barème à confirmer');
    await userEvent.type(screen.getByLabelText(/Prochaine revue/i), '2026-09-30');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(upsertBaseContratOverrideMock).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: 'assurance_dependance',
          review_status: 'obsolescence_a_confirmer',
          review_reason: 'Barème à confirmer',
          next_review_at: '2026-09-30',
        }),
      );
    });
  });
});
