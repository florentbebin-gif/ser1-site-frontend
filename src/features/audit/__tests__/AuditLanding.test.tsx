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
  audit.situationFamiliale.mr = {
    prenom: 'Jean',
    nom: 'Martin',
    dateNaissance: '1980-01-01',
    profession: 'Médecin',
  };
  audit.situationFamiliale.mme = {
    prenom: 'Marie',
    nom: 'Martin',
    dateNaissance: '1982-03-01',
    profession: 'Architecte',
  };
  audit.situationFamiliale.situationMatrimoniale = 'marie';
  audit.situationFamiliale.enfants = [
    { prenom: 'Léa', dateNaissance: '2010-05-01', estCommun: true },
  ];
}

function section(name: string): HTMLElement {
  return screen.getByRole('heading', { level: 2, name }).closest('section') as HTMLElement;
}

describe('AuditLanding', () => {
  it('affiche la landing sans titre local et conserve l’encart dossier', () => {
    renderLanding();

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.queryByText(/Préparez le dossier/)).toBeNull();
    expect(screen.getByTestId('dossier-loaded-card')).toBeInTheDocument();
  });

  it('restitue un état civil patrimonial réel (nom, âge, profession, parts)', () => {
    renderLanding(withFoyer);
    const syntheseSection = section('Synthèse dossier');
    const synthese = within(syntheseSection);

    expect(synthese.getByText(/Jean Martin/)).toBeInTheDocument();
    expect(synthese.getByText(/46 ans/)).toBeInTheDocument();
    expect(synthese.getByText('Médecin')).toBeInTheDocument();
    expect(synthese.getByText('Marié(e)')).toBeInTheDocument();
    expect(synthese.getByText(/Marie Martin/)).toBeInTheDocument();
    expect(synthese.getByText(/parts/)).toBeInTheDocument();
    expect(synthese.getByLabelText(/Données état civil renseignées/)).toBeInTheDocument();
    expect(synthese.getByText('à venir')).toBeInTheDocument();
    expect(syntheseSection.textContent ?? '').not.toMatch(/TMI\s+\d/i);
    expect(syntheseSection.textContent ?? '').not.toMatch(/TMI[^%]*%/i);
  });

  it('rend un schéma de filiation', () => {
    renderLanding(withFoyer);
    const synthese = within(section('Synthèse dossier'));

    expect(synthese.getByRole('img', { name: 'Schéma de filiation du foyer' })).toBeInTheDocument();
  });

  it('présente les aperçus visuels à venir masses successorales et organigramme société', () => {
    renderLanding(withFoyer);

    const masses = section('Masses successorales');
    const societe = section('Organigramme société');

    expect(masses).toBeInTheDocument();
    expect(societe).toBeInTheDocument();
    expect(screen.getAllByText('À venir').length).toBeGreaterThanOrEqual(2);
    expect(
      within(masses).getByText('Calcul disponible après structuration du patrimoine.'),
    ).toBeInTheDocument();
    expect(within(societe).getByText('Structure société à renseigner.')).toBeInTheDocument();
    expect(within(masses).queryByRole('button')).toBeNull();
    expect(within(societe).queryByRole('button')).toBeNull();
  });

  it('porte l’action par les libellés en en-tête des cartes', () => {
    const { container, onOpenAudit } = renderLanding();

    screen.getByRole('button', { name: /^Voir l'audit complet/ }).click();
    expect(onOpenAudit).toHaveBeenLastCalledWith('dossier');
    screen.getByRole('button', { name: /^Définir les objectifs client/ }).click();
    expect(onOpenAudit).toHaveBeenLastCalledWith('objectifs');
    expect(container.querySelector('.audit-card__go')).toBeNull();
    expect(container.querySelectorAll('.premium-btn')).toHaveLength(0);
  });

  it('laisse la carte Stratégie verrouillée et non cliquable', () => {
    renderLanding();
    const strategie = section('Stratégie');

    expect(
      within(strategie).getByText('Disponible après structuration du dossier.'),
    ).toBeInTheDocument();
    expect(within(strategie).getByText('Verrouillé')).toBeInTheDocument();
    expect(within(strategie).queryByText('Configurer')).toBeNull();
    expect(within(strategie).queryByRole('button')).toBeNull();
  });

  it('affiche le bloc versions seulement quand un dossier est saisi', () => {
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
    const versions = screen.getByRole('heading', { level: 2, name: 'Versions & sauvegardes' });
    expect(versions.closest('.dossier-rail__panel')).toBeInTheDocument();
    expect(versions.closest('.dossier-context-card')).toBeNull();
    expect(screen.getByText('Cloud')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
  });

  it('n’affiche aucun score, /100 ni patrimoine net fabriqué', () => {
    const { container } = renderLanding(withFoyer);
    const text = container.textContent ?? '';

    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByText(/\/\s*100/)).toBeNull();
    expect(text).not.toMatch(/patrimoine net/i);
    expect(text).not.toMatch(/\bF6\b/);
    expect(text).not.toMatch(/\bmock\b|fake|dummy/i);
  });
});
