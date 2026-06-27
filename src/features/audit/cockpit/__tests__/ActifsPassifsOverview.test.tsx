// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createEmptyDossier, type DossierAudit } from '@/domain/audit/types';

import { ActifsPassifsOverview } from '../ActifsPassifsOverview';

function renderOverview(mutate?: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  return render(<ActifsPassifsOverview dossier={audit} />);
}

describe('ActifsPassifsOverview', () => {
  it('affiche deux cartes vides honnêtes, sans patrimoine net', () => {
    renderOverview();

    const actifs = screen.getByRole('region', { name: 'Actifs' });
    const passifs = screen.getByRole('region', { name: 'Passifs' });
    expect(within(actifs).getByText('Aucun actif saisi')).toBeInTheDocument();
    expect(within(passifs).getByText('Aucun passif saisi')).toBeInTheDocument();
    expect(screen.queryByText(/patrimoine net/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/F3/)).not.toBeInTheDocument();
  });

  it('répartit les montants saisis par famille et signale les incohérences', () => {
    renderOverview((audit) => {
      audit.actifs = [
        {
          id: 'a1',
          type: 'residence_principale',
          libelle: 'RP',
          valeur: 300000,
          proprietaire: 'commun',
        },
        { id: 'a2', type: 'assurance_vie', libelle: 'AV', valeur: 100000, proprietaire: 'mr' },
      ];
      audit.passif.emprunts = [
        {
          id: 'p1',
          libelle: 'Prêt',
          type: 'immobilier',
          capitalInitial: 100000,
          capitalRestantDu: 150000,
          mensualite: 0,
          tauxInteret: 0,
          dateDebut: '',
          dateFin: '',
        },
      ];
    });

    const actifs = screen.getByRole('region', { name: 'Actifs' });
    expect(within(actifs).getByText('Immobilier')).toBeInTheDocument();
    expect(within(actifs).getByText('Financier')).toBeInTheDocument();

    // Emprunt incohérent → pastille « à vérifier » dans la carte Passifs.
    const passifs = screen.getByRole('region', { name: 'Passifs' });
    expect(within(passifs).getByText(/à vérifier/)).toBeInTheDocument();
    expect(screen.queryByText(/patrimoine net/i)).not.toBeInTheDocument();
  });
});
