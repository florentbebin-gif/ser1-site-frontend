// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import AuditLanding from '../AuditLanding';
import { buildAuditLandingViewModel } from '../auditLandingViewModel';

const NOW = '2026-06-08T10:00:00.000Z';

function renderLanding(audit = createEmptyDossier()) {
  const onOpenAudit = vi.fn();
  const viewModel = buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW }),
  );
  render(<AuditLanding viewModel={viewModel} onOpenAudit={onOpenAudit} />);
  return { onOpenAudit };
}

describe('AuditLanding', () => {
  it('affiche les trois cartes de l’entrée /audit', () => {
    renderLanding();

    expect(screen.getByRole('heading', { level: 2, name: 'Synthèse dossier' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Pilotage stratégique' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Objectifs' })).toBeInTheDocument();
  });

  it('restitue un état vide avec la CTA « Compléter le dossier »', () => {
    const { onOpenAudit } = renderLanding();

    const synthese = screen
      .getByRole('heading', { level: 2, name: 'Synthèse dossier' })
      .closest('section') as HTMLElement;
    expect(
      within(synthese).getByText('à compléter', { selector: '.audit-landing__badge-label' }),
    ).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: 'Compléter le dossier' });
    cta.click();
    expect(onOpenAudit).toHaveBeenCalledWith('dossier');
  });

  it('restitue un dossier complet F1 avec la CTA « Reprendre l’audit »', () => {
    const audit = createEmptyDossier();
    audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
    audit.objectifs = ['proteger_conjoint'];
    renderLanding(audit);

    expect(screen.getByText('complet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reprendre l’audit' })).toBeInTheDocument();
    expect(screen.getByText('Protéger mon conjoint')).toBeInTheDocument();
  });

  it('présente le pilotage stratégique comme « à venir » sans scénario activable', () => {
    renderLanding();

    const pilotage = screen
      .getByRole('heading', { level: 2, name: 'Pilotage stratégique' })
      .closest('section');
    expect(pilotage).not.toBeNull();
    const region = within(pilotage as HTMLElement);
    expect(
      region.getByText('à venir', { selector: '.audit-landing__badge-label' }),
    ).toBeInTheDocument();
    expect(region.getAllByText(/F6/).length).toBeGreaterThan(0);
    // Aucune action de pilotage activable : le seul bouton est désactivé.
    expect(region.getByRole('button')).toBeDisabled();
  });

  it('n’affiche aucun radar réel, score chiffré ou patrimoine net fabriqué', () => {
    const { container } = render(
      <AuditLanding
        viewModel={buildAuditLandingViewModel(
          buildDossierPatrimonialFromAudit(createEmptyDossier(), { now: NOW }),
        )}
        onOpenAudit={vi.fn()}
      />,
    );

    // Pas de graphe vectoriel (radar) rendu.
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
    // Pas de score /100 ni de patrimoine net inventé.
    expect(screen.queryByText(/\/\s*100/)).toBeNull();
    expect(screen.queryByText(/patrimoine net/i)).toBeNull();
  });
});
