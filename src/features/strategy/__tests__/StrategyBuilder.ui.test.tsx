// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { triggerPageReset } from '@/utils/reset';
import { createEmptyDossier, type DossierAudit } from '../../audit/types';
import StrategyBuilder from '../StrategyBuilder';

vi.mock('../export/exportStrategy', () => ({
  exportStrategyPptx: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({ fiscalContext: null }),
}));

vi.mock('../../../settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

function createDossier(): DossierAudit {
  const base = createEmptyDossier();
  return {
    ...base,
    id: 'dossier-strategy-ui',
    situationFamiliale: {
      ...base.situationFamiliale,
      mr: { prenom: 'Jeanne', nom: 'Martin', dateNaissance: '1975-01-01' },
    },
    situationFiscale: {
      ...base.situationFiscale,
      revenuFiscalReference: 85000,
      nombreParts: 2,
    },
  };
}

describe('StrategyBuilder produits sélectionnés', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('ajoute puis supprime un produit', async () => {
    render(<StrategyBuilder dossier={createDossier()} />);

    expect(screen.getByText(/Aucun produit sélectionné/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter un produit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Plan Épargne Retraite (PER)' }));

    expect(
      screen.getByRole('heading', { name: 'Plan Épargne Retraite (PER)' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Supprimer ce produit'));

    expect(screen.getByText(/Aucun produit sélectionné/)).toBeInTheDocument();
  });

  it('réinitialise les produits via l’événement global strategy', async () => {
    render(<StrategyBuilder dossier={createDossier()} />);

    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter un produit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Plan Épargne Retraite (PER)' }));

    expect(
      screen.getByRole('heading', { name: 'Plan Épargne Retraite (PER)' }),
    ).toBeInTheDocument();

    triggerPageReset('strategy');

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Plan Épargne Retraite (PER)' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Aucun produit sélectionné/)).toBeInTheDocument();
  });
});
