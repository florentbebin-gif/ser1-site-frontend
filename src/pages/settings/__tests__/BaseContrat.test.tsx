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
  upsertBaseContratOverride: vi.fn(),
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
});
