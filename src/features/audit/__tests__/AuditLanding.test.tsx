// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';
import {
  SNAPSHOT_LAST_SAVED_FILENAME_KEY,
  SNAPSHOT_LOADED_FILENAME_KEY,
} from '@/reporting/snapshot';

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
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('affiche la landing sans titre local et conserve l’encart dossier', () => {
    renderLanding();

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.queryByText(/Préparez le dossier/)).toBeNull();
    expect(screen.getByTestId('dossier-loaded-card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Dossier de travail' })).toBeVisible();
  });

  it('affiche la barre d’état compacte sans données métier inventées', () => {
    const { container } = renderLanding(withFoyer);

    expect(screen.getByText('Dossier renseigné')).toBeVisible();
    expect(screen.getByText('Points à compléter')).toBeVisible();
    expect(screen.getByText('Parts fiscales indicatives')).toBeVisible();
    expect(screen.getByText('IR · Patrimoine')).toBeVisible();
    expect(screen.getAllByText('À venir').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Stratégie').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Verrouillée')).toBeVisible();
    fireEvent.click(screen.getByTestId('audit-export-menu-button'));
    expect(screen.getByRole('menuitem', { name: 'Word (.docx)' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'PowerPoint (.pptx)' })).toBeDisabled();
    expect(container.textContent ?? '').not.toMatch(/12\s*\/\s*18/);
    expect(container.textContent ?? '').not.toMatch(/patrimoine net/i);
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
    const { container } = renderLanding(withFoyer);
    const synthese = within(section('Synthèse dossier'));

    expect(synthese.getByRole('img', { name: 'Schéma de filiation du foyer' })).toBeInTheDocument();
    expect(container.querySelector('.audit-fil__avatar-image')).toBeInTheDocument();
    expect(container.querySelector('.audit-fil__avatar-face')).toBeNull();
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
    expect(screen.getByRole('img', { name: "Illustration d'une liste d'objectifs" })).toBeVisible();
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

  it('affiche le dossier de travail dédié et l’avancement sans wording hors contrat', () => {
    window.sessionStorage.setItem(SNAPSHOT_LOADED_FILENAME_KEY, 'famille-martin.ser1');
    window.sessionStorage.setItem(SNAPSHOT_LAST_SAVED_FILENAME_KEY, 'audit-local.ser1');
    renderLanding(withFoyer);

    const dossier = screen.getByTestId('dossier-loaded-card');
    expect(
      within(dossier).getByRole('heading', { level: 2, name: 'Dossier de travail' }),
    ).toBeInTheDocument();
    expect(within(dossier).getByTestId('dossier-client-label')).toHaveTextContent('Famille Martin');
    expect(within(dossier).getByTestId('dossier-client-label')).toHaveClass(
      'dossier-travail__client-value',
    );
    expect(within(dossier).getByTestId('dossier-loaded-filename')).toHaveTextContent(
      'famille-martin',
    );
    expect(within(dossier).queryByText('Session locale active')).toBeNull();
    expect(within(dossier).queryByText('Métadonnées locales non nominatives')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Avancement du dossier' })).toBeVisible();
    expect(screen.getAllByText('À venir').length).toBeGreaterThanOrEqual(12);

    const text =
      screen.getByText('Dossier de travail').closest('.audit-landing')?.textContent ?? '';
    expect(text).not.toMatch(new RegExp(`Versions & ${'sauvegardes'}`, 'i'));
    expect(text).not.toMatch(
      new RegExp([`Cl${'oud'}`, `dis${'tant'}`, `ser${'veur'}`].join('|'), 'i'),
    );
    expect(text).not.toMatch(new RegExp(`Assistant ${'SER1'}`, 'i'));
  });

  it('marque les valeurs non sauvegardées du dossier de travail avec l’état accentué', () => {
    renderLanding(withFoyer);

    const dossier = screen.getByTestId('dossier-loaded-card');
    expect(within(dossier).getByTestId('dossier-client-label')).toHaveTextContent('Famille Martin');
    expect(within(dossier).getByTestId('dossier-loaded-filename')).toHaveTextContent(
      'Non sauvegardé',
    );
    expect(within(dossier).getByTestId('dossier-loaded-filename')).toHaveAttribute(
      'data-state',
      'unsaved',
    );
    expect(within(dossier).getByTestId('dossier-loaded-disclaimer')).toHaveTextContent(
      'Non sauvegardé',
    );
    expect(within(dossier).getByTestId('dossier-loaded-disclaimer')).toHaveAttribute(
      'data-state',
      'unsaved',
    );
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
