// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import AuditLanding from '../AuditLanding';
import { buildAuditLandingViewModel } from '../auditLandingViewModel';

const NOW = '2026-06-08T10:00:00.000Z';

function renderLanding(mutate: (audit: ReturnType<typeof createEmptyDossier>) => void = () => {}) {
  const audit = createEmptyDossier();
  mutate(audit);
  const onOpenAudit = vi.fn();
  const viewModel = buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW }),
  );
  const result = render(<AuditLanding viewModel={viewModel} onOpenAudit={onOpenAudit} />);
  return { onOpenAudit, ...result };
}

function section(name: string): HTMLElement {
  return screen.getByRole('heading', { level: 2, name }).closest('section') as HTMLElement;
}

describe('AuditLanding', () => {
  it('affiche un haut de page court et la bande de statut', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Audit patrimonial' }),
    ).toBeInTheDocument();
    const band = within(screen.getByRole('group', { name: 'État de la collecte' }));
    expect(band.getByText('Collecte')).toBeInTheDocument();
    expect(band.getByText('Données clés')).toBeInTheDocument();
    expect(band.getByText('Stratégie')).toBeInTheDocument();
    expect(band.getByText('Prochaine action')).toBeInTheDocument();
  });

  it('ne rend pas la bande de statut comme des inputs', () => {
    renderLanding();
    const band = screen.getByRole('group', { name: 'État de la collecte' });

    expect(within(band).queryByRole('textbox')).toBeNull();
    expect(within(band).queryByRole('combobox')).toBeNull();
    expect(band.querySelectorAll('input, select, textarea')).toHaveLength(0);
  });

  it('propose une seule action primaire', () => {
    const { container } = renderLanding();

    const primaries = container.querySelectorAll('.premium-btn-primary');
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveAccessibleName('Saisir le membre principal');
  });

  it('déclenche la prochaine action depuis la CTA primaire', () => {
    const { onOpenAudit } = renderLanding();

    screen.getByRole('button', { name: 'Saisir le membre principal' }).click();
    expect(onOpenAudit).toHaveBeenCalledWith('dossier');
  });

  it('ne présente aucune valeur par défaut comme certitude (dossier vierge)', () => {
    renderLanding();

    expect(screen.queryByText('Célibataire')).toBeNull();
    expect(screen.queryByText(/aucun enfant/i)).toBeNull();
    expect(screen.queryByText(/aucune donation/i)).toBeNull();
  });

  it('présente le pilotage comme verrouillé, visuel et sans action activable', () => {
    const { container } = renderLanding();
    const pilotage = section('Pilotage stratégique');

    expect(within(pilotage).getByText('Stratégie verrouillée')).toBeInTheDocument();
    expect(within(pilotage).getByText('Verrouillé')).toBeInTheDocument();
    expect(pilotage.querySelector('.audit-landing__skeleton')).not.toBeNull();
    // Aucun scénario activable, aucun bouton mort.
    expect(within(pilotage).queryByRole('button')).toBeNull();
    // Aucun radar / score fabriqué.
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByText(/\/\s*100/)).toBeNull();
  });

  it('n’affiche aucun jargon interne dans le texte rendu', () => {
    const { container } = renderLanding((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
      audit.situationFamiliale.situationMatrimoniale = 'marie';
    });
    const text = container.textContent ?? '';

    expect(text).not.toMatch(/\bF6\b/);
    expect(text).not.toMatch(/fondation/i);
    expect(text).not.toMatch(/non persisté/i);
    expect(text).not.toMatch(/non calculable/i);
    expect(text).not.toMatch(/module débloqué/i);
    expect(text).not.toMatch(/patrimoine net/i);
  });

  it('rend la carte objectifs vide de façon qualitative', () => {
    renderLanding();
    const objectifs = within(section('Objectifs'));

    expect(objectifs.getByText('Aucun objectif consigné')).toBeInTheDocument();
    expect(objectifs.getByRole('button', { name: 'Ajouter des objectifs' })).toBeInTheDocument();
  });

  it('restitue les objectifs réels quand ils existent', () => {
    renderLanding((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
      audit.objectifs = ['proteger_conjoint'];
    });

    expect(screen.getByText('Protéger mon conjoint')).toBeInTheDocument();
  });
});
