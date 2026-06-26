// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createEmptyDossier, type DossierAudit } from '@/domain/audit/types';

import { FoyerSummary } from '../FoyerSummary';

function renderSummary(mutate?: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  return render(<FoyerSummary dossier={audit} />);
}

describe('FoyerSummary', () => {
  it('affiche le statut professionnel quand aucun libellé de profession n’est possible', () => {
    renderSummary((audit) => {
      audit.situationFamiliale.mr.prenom = 'Jean';
      audit.situationFamiliale.mr.nom = 'Martin';
      audit.situationFamiliale.mr.dateNaissance = '1958-01-01';
      audit.situationFamiliale.mr.statutSocial = 'retraite';
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.mme = {
        prenom: 'Claire',
        nom: 'Martin',
        dateNaissance: '1960-02-02',
        statutSocial: 'maladie_invalidite',
      };
    });

    const summary = screen.getByRole('region', { name: 'Synthèse foyer' });

    expect(within(summary).getByText('Profession')).toBeVisible();
    expect(within(summary).getByText('Retraité')).toBeVisible();
    expect(within(summary).getByText('Profession conjoint')).toBeVisible();
    expect(within(summary).getByText('Maladie / invalidité')).toBeVisible();
    expect(within(summary).queryAllByText('Non renseignée')).toHaveLength(1);
  });
});
