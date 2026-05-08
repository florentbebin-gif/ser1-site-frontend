// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BaseContrat from '../BaseContrat';
import type { UserRoleState } from '@/auth/useUserRole';
import type { ProductRules } from '@/domain/base-contrat/rules';

let isAdmin = false;

const getBaseContratOverridesMock = vi.fn();
const upsertBaseContratOverrideMock = vi.fn();

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

vi.mock('@/utils/cache/baseContratOverridesCache', () => ({
  getBaseContratOverrides: () => getBaseContratOverridesMock(),
  upsertBaseContratOverride: (payload: unknown) => upsertBaseContratOverrideMock(payload),
}));

const mockedRules: ProductRules = {
  constitution: [{
    title: 'Fiscalité de test',
    bullets: ['À confirmer selon le régime applicable.'],
    confidence: 'moyenne',
    sources: [{ label: 'CGI art. 779', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000026292566' }],
    dependencies: ['Validation notaire'],
  }],
  sortie: [],
  deces: [],
};

vi.mock('@/domain/base-contrat/rules/index', () => ({
  getRules: vi.fn(() => mockedRules),
}));

async function openFirstProduct() {
  render(<BaseContrat />);

  await screen.findByText('Référentiel contrats');
  await userEvent.click(screen.getByRole('button', { name: /Assurance prévoyance/i }));
  const productHeader = screen.getByRole('button', { name: /Assurance dépendance/i });
  await userEvent.click(productHeader);
  return productHeader;
}

describe('BaseContrat', () => {
  beforeEach(() => {
    isAdmin = false;
    getBaseContratOverridesMock.mockReset();
    getBaseContratOverridesMock.mockResolvedValue({});
    upsertBaseContratOverrideMock.mockReset();
    upsertBaseContratOverrideMock.mockResolvedValue(undefined);
  });

  it('utilise un bouton natif pour ouvrir un produit', async () => {
    const productHeader = await openFirstProduct();

    expect(productHeader.tagName).toBe('BUTTON');
  });

  it('masque les sources, la confiance et les dépendances aux non-admins', async () => {
    await openFirstProduct();

    await waitFor(() => {
      expect(screen.getByText('Fiscalité de test')).toBeInTheDocument();
    });
    expect(screen.queryByText('Confiance moyenne')).not.toBeInTheDocument();
    expect(screen.queryByText('CGI art. 779')).not.toBeInTheDocument();
    expect(screen.queryByText('Validation notaire')).not.toBeInTheDocument();
  });

  it('affiche les sources, la confiance et les dépendances aux admins', async () => {
    isAdmin = true;

    await openFirstProduct();

    expect(await screen.findByText('Confiance moyenne')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CGI art. 779' })).toHaveAttribute(
      'href',
      'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000026292566',
    );
    expect(screen.getByText('Validation notaire')).toBeInTheDocument();
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

    expect(screen.queryByText('Revue : À revoir')).not.toBeInTheDocument();
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

    expect(await screen.findByText('Revue : À revoir')).toBeInTheDocument();
    expect(screen.getByText('Source fiscale à relire')).toBeInTheDocument();
    expect(screen.getByText('2026-07-01')).toBeInTheDocument();
  });

  it('sauvegarde les champs de revue depuis la modale admin', async () => {
    isAdmin = true;

    await openFirstProduct();
    await userEvent.click(screen.getAllByRole('button', { name: 'Clôturer' })[0]);
    await userEvent.selectOptions(screen.getByLabelText(/Statut de revue/i), 'obsolescence_a_confirmer');
    await userEvent.type(screen.getByLabelText(/Raison de revue/i), 'Barème à confirmer');
    await userEvent.type(screen.getByLabelText(/Prochaine revue/i), '2026-09-30');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(upsertBaseContratOverrideMock).toHaveBeenCalledWith(expect.objectContaining({
        product_id: 'assurance_dependance',
        review_status: 'obsolescence_a_confirmer',
        review_reason: 'Barème à confirmer',
        next_review_at: '2026-09-30',
      }));
    });
  });
});
