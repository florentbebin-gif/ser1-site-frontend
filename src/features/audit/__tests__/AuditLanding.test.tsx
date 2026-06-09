// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import AuditLanding from '../AuditLanding';
import { buildAuditLandingViewModel } from '../auditLandingViewModel';

const NOW = new Date('2026-06-09T10:00:00.000Z');

function renderLanding(mutate: (audit: ReturnType<typeof createEmptyDossier>) => void = () => {}) {
  const audit = createEmptyDossier();
  mutate(audit);
  const onOpenAudit = vi.fn();
  const viewModel = buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
    { now: NOW },
  );
  const result = render(<AuditLanding viewModel={viewModel} onOpenAudit={onOpenAudit} />);
  return { onOpenAudit, ...result };
}

function withFoyer(audit: ReturnType<typeof createEmptyDossier>) {
  audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
  audit.situationFamiliale.mme = { prenom: 'Marie', nom: 'Martin', dateNaissance: '1982-03-01' };
  audit.situationFamiliale.situationMatrimoniale = 'marie';
  audit.situationFamiliale.enfants = [
    { prenom: 'Léa', dateNaissance: '2010-05-01', estCommun: true },
  ];
}

function section(name: string): HTMLElement {
  return screen.getByRole('heading', { level: 2, name }).closest('section') as HTMLElement;
}

describe('AuditLanding', () => {
  it('affiche un header minimal (sans sous-titre) et conserve l’encart dossier', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dossier patrimonial' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Préparez le dossier/)).toBeNull();
    expect(screen.queryByText('Cockpit patrimonial')).toBeNull();
    // Encart « Dossier de travail » rendu par la page elle-même.
    expect(screen.getByTestId('dossier-loaded-card')).toBeInTheDocument();
  });

  it('supprime les pastilles d’état et les gros boutons', () => {
    const { container } = renderLanding();

    expect(screen.queryByText('Dossier à initialiser')).toBeNull();
    expect(screen.queryByText('Verrouillé')).toBeNull();
    expect(screen.queryByText('À définir')).toBeNull();
    expect(container.querySelectorAll('.premium-btn')).toHaveLength(0);
  });

  it('restitue l’état civil et la filiation réels dans la carte Synthèse', () => {
    renderLanding(withFoyer);
    const synthese = within(section('Synthèse dossier'));

    expect(synthese.getByText(/Jean Martin/)).toBeInTheDocument();
    expect(synthese.getByText(/46 ans/)).toBeInTheDocument();
    expect(synthese.getByText('Marié(e)')).toBeInTheDocument();
    expect(synthese.getByText(/Marie Martin/)).toBeInTheDocument();
  });

  it('présente masses successorales et organigramme société comme « à venir »', () => {
    renderLanding(withFoyer);
    const synthese = within(section('Synthèse dossier'));

    expect(synthese.getByText('Masses successorales')).toBeInTheDocument();
    expect(synthese.getByText('Organigramme société')).toBeInTheDocument();
    expect(synthese.getAllByText('à venir').length).toBeGreaterThanOrEqual(2);
  });

  it('porte l’action par les cartes cliquables (flèche, pas de gros bouton)', () => {
    const { onOpenAudit } = renderLanding();

    screen.getByRole('button', { name: /^Synthèse dossier/ }).click();
    expect(onOpenAudit).toHaveBeenLastCalledWith('dossier');
    screen.getByRole('button', { name: /^Objectifs/ }).click();
    expect(onOpenAudit).toHaveBeenLastCalledWith('objectifs');
  });

  it('laisse la carte Stratégie verrouillée et non cliquable', () => {
    renderLanding();
    const strategie = section('Stratégie');

    expect(
      within(strategie).getByText('Disponible après structuration du dossier.'),
    ).toBeInTheDocument();
    expect(within(strategie).queryByRole('button')).toBeNull();
  });

  it('affiche le bloc « Versions & sauvegardes » seulement quand un dossier est saisi', () => {
    const { rerender } = renderLanding();
    expect(screen.queryByText('Versions & sauvegardes')).toBeNull();

    const audit = createEmptyDossier();
    withFoyer(audit);
    rerender(
      <AuditLanding
        viewModel={buildAuditLandingViewModel(
          buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
          { now: NOW },
        )}
        onOpenAudit={vi.fn()}
      />,
    );
    expect(screen.getByText('Versions & sauvegardes')).toBeInTheDocument();
  });

  it('n’affiche aucun score, /100 ni patrimoine net fabriqué', () => {
    const { container } = renderLanding(withFoyer);
    const text = container.textContent ?? '';

    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByText(/\/\s*100/)).toBeNull();
    expect(text).not.toMatch(/patrimoine net/i);
    expect(text).not.toMatch(/\bF6\b/);
  });
});
