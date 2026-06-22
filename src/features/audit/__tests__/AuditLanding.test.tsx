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
import { buildAuditLandingViewModel, type AuditLandingViewModel } from '../auditLandingViewModel';

const NOW = new Date('2026-06-09T10:00:00.000Z');

function renderLanding(mutate: (audit: ReturnType<typeof createEmptyDossier>) => void = () => {}) {
  const audit = createEmptyDossier();
  mutate(audit);
  const viewModel = buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
    { now: NOW },
  );
  return renderLandingViewModel(viewModel);
}

function renderLandingViewModel(viewModel: AuditLandingViewModel) {
  const onOpenAudit = vi.fn();
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

function withClientPartiel(audit: ReturnType<typeof createEmptyDossier>) {
  audit.situationFamiliale.mr = {
    prenom: 'Jean',
    nom: 'Martin',
    dateNaissance: '',
  };
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
    expect(screen.getByText('Champs F1 à compléter')).toBeVisible();
    expect(screen.getByText('Parts fiscales indicatives')).toBeVisible();
    expect(screen.getByText('IR · Patrimoine')).toBeVisible();
    expect(screen.getAllByText('À venir').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Stratégie').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Verrouillée')).toBeVisible();
    expect(screen.queryByTestId('audit-export-menu-button')).toBeNull();
    expect(screen.queryByRole('button', { name: /Exporter/i })).toBeNull();
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

  it('affiche les points à confirmer déterministes dès que le dossier est amorcé', () => {
    const { onOpenAudit } = renderLanding(withClientPartiel);
    const points = section('Points à confirmer');

    expect(within(points).getByText('Client principal à compléter')).toBeVisible();
    expect(within(points).getByText('Objectifs client à définir')).toBeVisible();
    expect(within(points).queryByText(/Prénom, nom et date de naissance/)).toBeNull();
    expect(within(points).queryByText(/Aucun objectif prioritaire/)).toBeNull();

    const actions = within(points).getAllByRole('button', { name: 'Compléter' });
    fireEvent.click(actions[0]!);
    expect(onOpenAudit).toHaveBeenLastCalledWith('dossier');
    fireEvent.click(actions[1]!);
    expect(onOpenAudit).toHaveBeenLastCalledWith('objectifs');
  });

  it('guide une nouvelle analyse vide sans rendre le cockpit prématuré', () => {
    const { onOpenAudit } = renderLanding();
    const start = section('Nouvelle analyse patrimoniale');

    expect(
      within(start).getByText('Renseignez d’abord le client principal pour structurer le foyer.'),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { level: 2, name: 'Synthèse dossier' })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Points à confirmer' })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Objectifs' })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Stratégie' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Calculs à venir' })).toBeNull();
    expect(screen.queryByText('Foyer à renseigner')).toBeNull();
    expect(screen.queryByText('Filiation à renseigner')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Commencer par le client/ }));
    expect(onOpenAudit).toHaveBeenLastCalledWith('dossier');
  });

  it('réaffiche le cockpit complet dès qu’un client est amorcé', () => {
    renderLanding(withClientPartiel);

    expect(screen.getByRole('heading', { level: 2, name: 'Synthèse dossier' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Points à confirmer' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Objectifs' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Stratégie' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Calculs à venir' })).toBeVisible();
  });

  it('relie un régime matrimonial manquant à l’étape civile réelle', () => {
    const { onOpenAudit } = renderLanding((audit) => {
      withFoyer(audit);
      audit.objectifs = ['proteger_conjoint'];
    });
    const points = section('Points à confirmer');

    expect(within(points).getByText('Régime matrimonial à confirmer')).toBeVisible();
    fireEvent.click(within(points).getByRole('button', { name: 'Compléter' }));
    expect(onOpenAudit).toHaveBeenLastCalledWith('civil');
  });

  it('compacte les points et objectifs à trois lignes avec un total réel', () => {
    const audit = createEmptyDossier();
    withFoyer(audit);
    audit.objectifs = [
      'proteger_proches',
      'developper_patrimoine',
      'proteger_revenus_sante',
      'revenus_differes',
    ];
    const viewModel = buildAuditLandingViewModel(
      buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
      { now: NOW },
    );

    renderLandingViewModel({
      ...viewModel,
      pointsAConfirmer: [
        {
          id: 'point-1',
          label: 'Premier point',
          reason: 'Première phrase explicative masquée.',
          action: { destination: 'dossier' },
          tone: 'warning',
        },
        {
          id: 'point-2',
          label: 'Deuxième point',
          reason: 'Deuxième phrase explicative masquée.',
          action: { destination: 'civil' },
          tone: 'warning',
        },
        {
          id: 'point-3',
          label: 'Troisième point',
          reason: 'Troisième phrase explicative masquée.',
          action: { destination: 'objectifs' },
          tone: 'danger',
        },
        {
          id: 'point-4',
          label: 'Quatrième point',
          reason: 'Quatrième phrase explicative masquée.',
          action: null,
          tone: 'warning',
        },
      ],
    });

    const points = section('Points à confirmer');
    expect(within(points).getByLabelText('4 point(s) à confirmer')).toHaveTextContent('4');
    expect(within(points).getByText('Premier point')).toBeVisible();
    expect(within(points).getByText('Deuxième point')).toBeVisible();
    expect(within(points).getByText('Troisième point')).toBeVisible();
    expect(within(points).queryByText('Quatrième point')).toBeNull();
    expect(within(points).queryByText(/phrase explicative masquée/)).toBeNull();

    const objectifs = section('Objectifs');
    expect(within(objectifs).getByLabelText('1 objectif non affiché sur 4')).toHaveTextContent(
      '+1 objectif',
    );
    expect(within(objectifs).getByText('Protéger mes proches')).toBeVisible();
    expect(within(objectifs).getByText('Développer mon patrimoine')).toBeVisible();
    expect(
      within(objectifs).getByText('Protéger mes revenus en cas de problème de santé'),
    ).toBeVisible();
    expect(within(objectifs).queryByText('Préparer des revenus différés')).toBeNull();
  });

  it('rend un carrousel premium avec une seule fiche active accessible', () => {
    renderLanding(withFoyer);

    const carousel = screen.getByRole('region', { name: 'Calculs à venir' });

    expect(within(carousel).getByRole('heading', { name: 'Masses successorales' })).toBeVisible();
    expect(within(carousel).queryByRole('heading', { name: 'Organigramme société' })).toBeNull();
    expect(within(carousel).queryByRole('heading', { name: 'Impôt sur le revenu' })).toBeNull();
    expect(carousel.querySelectorAll('.audit-carousel__slide[aria-hidden="true"]')).toHaveLength(2);
    expect(carousel.querySelector('[data-slide-position="prev"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(carousel.querySelector('[data-slide-position="next"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(within(carousel).queryByRole('link')).toBeNull();

    fireEvent.click(within(carousel).getByRole('button', { name: /suivant/i }));
    expect(within(carousel).getByRole('heading', { name: 'Organigramme société' })).toBeVisible();

    fireEvent.keyDown(within(carousel).getByRole('button', { name: /suivant/i }), {
      key: 'ArrowRight',
    });
    expect(within(carousel).getByRole('heading', { name: 'Impôt sur le revenu' })).toBeVisible();

    fireEvent.keyDown(within(carousel).getByRole('button', { name: /suivant/i }), {
      key: 'ArrowLeft',
    });
    expect(within(carousel).getByRole('heading', { name: 'Organigramme société' })).toBeVisible();

    expect(within(carousel).getAllByRole('button', { name: /Afficher l’aperçu \d/ })).toHaveLength(
      3,
    );
    expect(carousel.textContent ?? '').not.toMatch(/patrimoine net|TMI\s+\d|\/\s*100|score|radar/i);
  });

  it('porte l’action par les libellés en en-tête des cartes', () => {
    const { container, onOpenAudit } = renderLanding(withFoyer);

    screen.getByRole('button', { name: /^Voir l'audit complet/ }).click();
    expect(onOpenAudit).toHaveBeenLastCalledWith('dossier');
    screen.getByRole('button', { name: /^Définir les objectifs client/ }).click();
    expect(onOpenAudit).toHaveBeenLastCalledWith('objectifs');
    expect(screen.getByRole('img', { name: "Illustration d'une liste d'objectifs" })).toBeVisible();
    expect(container.querySelector('.audit-card__go')).toBeNull();
    expect(container.querySelectorAll('.premium-btn')).toHaveLength(0);
  });

  it('laisse la carte Stratégie verrouillée et non cliquable', () => {
    renderLanding(withFoyer);
    const strategie = section('Stratégie');

    expect(
      within(strategie).getByText(
        'Verrouillée tant que les prérequis métier ne sont pas disponibles.',
      ),
    ).toBeInTheDocument();
    expect(within(strategie).getByText('Objectifs définis')).toBeVisible();
    expect(within(strategie).getByText('Patrimoine structuré')).toBeVisible();
    expect(within(strategie).getByText('Scénarios disponibles')).toBeVisible();
    expect(within(strategie).getByText('Aucun scénario disponible à ce stade.')).toBeVisible();
    expect(within(strategie).getByText('Verrouillé')).toBeInTheDocument();
    expect(within(strategie).queryByText('Configurer')).toBeNull();
    expect(within(strategie).queryByRole('button')).toBeNull();
    expect(within(strategie).queryByText('Protection')).toBeNull();
    expect(within(strategie).queryByText('Transmission')).toBeNull();
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
    expect(screen.getAllByText('À venir').length).toBeGreaterThanOrEqual(9);
    expect(screen.getAllByText('Inventaire déclaratif')).toHaveLength(2);
    expect(screen.getByText('Déclaratif')).toBeInTheDocument();

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
