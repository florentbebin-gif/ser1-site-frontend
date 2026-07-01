// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier, type DossierAudit } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import { buildAuditLandingViewModel } from '../../auditLandingViewModel';
import { FoyerFamillePage } from '../FoyerFamillePage';

const NOW = new Date('2026-06-09T10:00:00.000Z');

function renderPage(mutate?: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  mutate?.(audit);
  const viewModel = buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
    { now: NOW },
  );

  return render(
    <FoyerFamillePage
      dossier={audit}
      viewModel={viewModel}
      updateDossier={vi.fn()}
      onSelectSection={vi.fn()}
    />,
  );
}

describe('FoyerFamillePage', () => {
  it('marque la situation professionnelle complète quand les deux statuts sont renseignés', () => {
    renderPage((audit) => {
      audit.situationFamiliale.mr.prenom = 'Jean';
      audit.situationFamiliale.mr.nom = 'Martin';
      audit.situationFamiliale.mr.dateNaissance = '1958-01-01';
      audit.situationFamiliale.mr.statutSocial = 'retraite';
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.mme = {
        prenom: 'Claire',
        nom: 'Martin',
        dateNaissance: '1960-02-02',
        statutSocial: 'chomage',
      };
    });

    expect(
      screen.getByRole('button', {
        name: /Situation professionnelle — Retraité · Chômage — Complet — Modifier/,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Situation professionnelle — Complet' }),
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Foyer & famille — Partiel' })).toBeVisible();
    expect(screen.queryByText('Professions à compléter')).toBeNull();
  });

  it('laisse la situation professionnelle à compléter quand un statut actif n’a pas de libellé', () => {
    renderPage((audit) => {
      audit.situationFamiliale.mr.prenom = 'Jean';
      audit.situationFamiliale.mr.nom = 'Martin';
      audit.situationFamiliale.mr.dateNaissance = '1980-01-01';
      audit.situationFamiliale.mr.statutSocial = 'salarie_cadre_prive';
    });

    expect(
      screen.getByRole('button', {
        name: /Situation professionnelle — Situation professionnelle à compléter — À compléter — Compléter/,
      }),
    ).toBeVisible();
  });

  it('affiche la légende compacte des branches familiales', () => {
    renderPage((audit) => {
      audit.situationFamiliale.mr.prenom = 'Bernard';
      audit.situationFamiliale.mr.nom = 'Dupont';
      audit.situationFamiliale.mme = {
        prenom: 'Tati',
        nom: 'Dupont',
        dateNaissance: '1974-01-01',
      };
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.enfants = [
        { prenom: 'Lucie', dateNaissance: '2011-01-01', estCommun: true },
        { prenom: 'John', dateNaissance: '2002-01-01', estCommun: false, parentPrincipal: 'mr' },
        { prenom: 'Rima', dateNaissance: '2005-01-01', estCommun: false, parentPrincipal: 'mme' },
      ];
    });

    const legend = screen.getByRole('list', { name: 'Légende des branches familiales' });
    expect(legend).toBeVisible();
    expect(within(legend).getByText('Commun')).toBeVisible();
    expect(within(legend).getByText('Branche client')).toBeVisible();
    expect(within(legend).getByText('Branche conjoint')).toBeVisible();
  });
});
