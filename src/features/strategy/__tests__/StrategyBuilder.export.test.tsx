// @vitest-environment jsdom
/* eslint-disable ser1-colors/no-hardcoded-colors -- Fixtures de thème déterministes pour vérifier le payload PPTX. */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_COLORS, type ThemeColors } from '@/settings/theme';
import { createEmptyDossier, type DossierAudit } from '../../audit/types';
import StrategyBuilder from '../StrategyBuilder';
import { exportStrategyPptx } from '../export/exportStrategy';

const TEST_COLORS: ThemeColors = {
  ...DEFAULT_COLORS,
  c1: '#101010',
  c6: '#606060',
};

vi.mock('../export/exportStrategy', () => ({
  exportStrategyPptx: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({ fiscalContext: null }),
}));

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: TEST_COLORS,
  }),
}));

function createDossier(): DossierAudit {
  const base = createEmptyDossier();
  return {
    ...base,
    id: 'dossier-strategy-export',
    situationFamiliale: {
      ...base.situationFamiliale,
      mr: { prenom: 'Jeanne', nom: 'Martin', dateNaissance: '1975-01-01' },
    },
    situationFiscale: {
      ...base.situationFiscale,
      revenuFiscalReference: 85000,
      nombreParts: 2,
    },
    actifs: [
      {
        id: 'actif-1',
        libelle: 'Résidence principale',
        valeur: 400000,
        proprietaire: 'commun',
        type: 'residence_principale',
      },
    ],
  };
}

async function openExportMenu(): Promise<HTMLButtonElement> {
  await screen.findByRole('heading', { name: 'Comparaison des scénarios' });
  await userEvent.click(screen.getByTestId('export-menu-button'));
  return screen.getByRole('menuitem', { name: 'PowerPoint (.pptx)' });
}

describe('StrategyBuilder export PPTX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('désactive l’export PPTX quand produitsSelectionnes est vide', async () => {
    render(<StrategyBuilder dossier={createDossier()} />);

    const exportOption = await openExportMenu();

    expect(exportOption).toBeDisabled();
    expect(exportOption).toHaveAttribute('title', 'Ajoutez au moins un produit avant d’exporter.');
  });

  it('active l’export PPTX après ajout d’un produit', async () => {
    render(<StrategyBuilder dossier={createDossier()} />);

    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter un produit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Plan Épargne Retraite (PER)' }));

    const exportOption = await openExportMenu();

    expect(exportOption).toBeEnabled();
  });

  it('passe colors depuis useTheme à exportStrategyPptx', async () => {
    render(<StrategyBuilder dossier={createDossier()} />);

    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter un produit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Plan Épargne Retraite (PER)' }));
    await userEvent.click(await openExportMenu());

    await waitFor(() => expect(exportStrategyPptx).toHaveBeenCalledTimes(1));
    expect(exportStrategyPptx).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: TEST_COLORS,
      }),
    );
  });
});
