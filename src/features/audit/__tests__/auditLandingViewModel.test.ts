import { describe, expect, it } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import { buildAuditLandingViewModel, type AuditLandingViewModel } from '../auditLandingViewModel';

const NOW = new Date('2026-06-09T10:00:00.000Z');

function vmFromAudit(mutate: (audit: ReturnType<typeof createEmptyDossier>) => void = () => {}) {
  const audit = createEmptyDossier();
  mutate(audit);
  return buildAuditLandingViewModel(
    buildDossierPatrimonialFromAudit(audit, { now: NOW.toISOString() }),
    { now: NOW },
  );
}

function userText(vm: AuditLandingViewModel): string {
  return [
    vm.synthese.ariaLabel,
    vm.synthese.tmiLabel,
    vm.objectifs.ariaLabel,
    vm.objectifs.note ?? '',
    vm.pilotage.title,
    vm.pilotage.description,
    vm.pilotage.caption,
  ].join(' ');
}

describe('buildAuditLandingViewModel', () => {
  it('reste vide sur un dossier vierge', () => {
    const vm = vmFromAudit();

    expect(vm.hasDossier).toBe(false);
    expect(vm.isNewAnalysisEmpty).toBe(true);
    expect(vm.clientName).toBeNull();
    expect(vm.dossierClientLabel).toBeNull();
    expect(vm.synthese.principal).toBeNull();
    expect(vm.synthese.situationLabel).toBeNull();
    expect(vm.synthese.partsFiscales).toBeNull();
    expect(vm.synthese.filiationHasData).toBe(false);
  });

  it('restitue l’état civil réel (nom, âge, profession)', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
        profession: 'Médecin',
      };
    });

    expect(vm.synthese.principal).toMatchObject({
      fullName: 'Jean Martin',
      age: 46,
      profession: 'Médecin',
      avatarKind: 'homme',
    });
    expect(vm.clientName).toBe('Jean Martin');
    expect(vm.isNewAnalysisEmpty).toBe(false);
    expect(vm.dossierClientLabel).toBe('Jean Martin');
    expect(vm.synthese.situationLabel).toBe('Célibataire');
    expect(vm.synthese.partsFiscales).toBe(1);
    expect(vm.synthese.tmiLabel).toBe('IR disponible');
    expect(vm.synthese.etatCivilCompletion.label).toMatch(/^Données état civil renseignées/);
  });

  it('affiche le prénom nom pour une personne divorcée seule', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.situationFamiliale.situationMatrimoniale = 'divorce';
    });

    expect(vm.dossierClientLabel).toBe('Jean Martin');
  });

  it('sort de l’état nouvelle analyse dès qu’un client principal est amorcé', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: '',
        dateNaissance: '',
      };
    });

    expect(vm.hasDossier).toBe(true);
    expect(vm.isNewAnalysisEmpty).toBe(false);
  });

  it('sort de l’état nouvelle analyse dès qu’un objectif F1 existe', () => {
    const vm = vmFromAudit((audit) => {
      audit.objectifs = ['developper_patrimoine'];
    });

    expect(vm.hasDossier).toBe(true);
    expect(vm.isNewAnalysisEmpty).toBe(false);
  });

  it('expose les 9 sections métier sans fabriquer les fondations non livrées', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
        profession: 'Médecin',
      };
      audit.objectifs = ['proteger_conjoint'];
    });

    expect(vm.progress).toHaveLength(9);
    expect(vm.progress.map((section) => section.label)).toEqual([
      'Dossier',
      'Foyer & famille',
      'Sociétés / organigramme',
      'Actifs / passifs',
      'Fiscalité & budget',
      'Prévoyance',
      'Succession',
      'Objectifs',
      'Synthèse & projection',
    ]);

    const fiscalite = vm.progress.find((section) => section.id === 'fiscalite');
    expect(fiscalite).toMatchObject({
      availability: 'gated',
      isNavigable: true,
      status: null,
      statusLabel: 'Déclaratif',
    });
    const syntheseProjection = vm.progress.find((section) => section.id === 'synthese');
    expect(syntheseProjection).toMatchObject({
      foundation: 'F6',
      availability: 'gated',
      isNavigable: false,
      status: null,
      statusLabel: 'À venir',
    });
    expect(vm.progress).toContainEqual(
      expect.objectContaining({
        id: 'actifs-passifs',
        availability: 'gated',
        isNavigable: true,
        statusLabel: 'Inventaire déclaratif',
      }),
    );
    expect(vm.progress.filter((section) => section.availability === 'gated')).toHaveLength(6);
    expect(vm.progress.filter((section) => section.availability === 'gated')).not.toContainEqual(
      expect.objectContaining({ status: 'complet' }),
    );
  });

  it('calcule la barre d’état depuis les sections F1 disponibles uniquement', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.objectifs = ['proteger_conjoint'];
    });

    const f1Sections = vm.progress.filter(
      (section) => section.foundation === 'F1' && section.availability === 'available',
    );
    const f1Metric = vm.statusBar.items.find((item) => item.id === 'f1');
    const pointsMetric = vm.statusBar.items.find((item) => item.id === 'points');
    const irMetric = vm.statusBar.items.find((item) => item.id === 'ir');
    const patrimoineMetric = vm.statusBar.items.find((item) => item.id === 'patrimoine');
    const strategieMetric = vm.statusBar.items.find((item) => item.id === 'strategie');

    expect(vm.statusBar.f1Total).toBe(f1Sections.length);
    expect(vm.statusBar.f1Completed).toBe(
      f1Sections.filter((section) => section.status === 'complet').length,
    );
    expect(f1Metric).toMatchObject({
      label: 'Sections F1 renseignées',
      value: `${vm.statusBar.f1Completed}/${vm.statusBar.f1Total}`,
    });
    expect(pointsMetric).toMatchObject({
      label: 'Champs F1 à compléter',
      value: String(vm.statusBar.pointsToComplete),
    });
    expect(irMetric).toMatchObject({ label: 'IR', value: 'Disponible' });
    expect(patrimoineMetric).toMatchObject({ label: 'Patrimoine', value: 'À venir' });
    expect(strategieMetric).toMatchObject({ value: 'Verrouillée' });
    expect(vm.statusBar.items.map((item) => item.value).join(' ')).not.toMatch(/12\s*\/\s*18/);
  });

  it('restitue le couple, les enfants âgés et les parts fiscales dérivées de F1', () => {
    const vm = vmFromAudit((audit) => {
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
        {
          prenom: 'Léa',
          dateNaissance: '2010-05-01',
          estCommun: true,
          civilite: 'madame',
        },
        { prenom: 'Tom', dateNaissance: '2013-05-01', estCommun: true },
      ];
    });

    expect(vm.synthese.conjoint).toMatchObject({
      fullName: 'Marie Martin',
      profession: 'Architecte',
      avatarKind: 'femme',
    });
    expect(vm.dossierClientLabel).toBe('Famille Martin');
    expect(vm.synthese.enfants.map((enfant) => enfant.prenom)).toEqual(['Léa', 'Tom']);
    expect(vm.synthese.enfants.map((enfant) => enfant.avatarKind)).toEqual(['fille', 'garcon']);
    expect(vm.synthese.enfants[0]?.age).toBe(16);
    // Marié + 2 enfants à charge → 2 + 0,5 + 0,5 = 3 parts.
    expect(vm.synthese.partsFiscales).toBe(3);
    expect(vm.synthese.filiationHasData).toBe(true);
  });

  it('affiche la famille quand un parent seul a un enfant', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.situationFamiliale.enfants = [
        { prenom: 'Léa', dateNaissance: '2010-05-01', estCommun: true },
      ];
    });

    expect(vm.dossierClientLabel).toBe('Famille Martin');
  });

  it('remonte les proches utiles au schéma de filiation', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.situationFamiliale.enfants = [
        {
          id: 'enfant-lea',
          prenom: 'Léa',
          nom: 'Martin',
          dateNaissance: '2010-05-01',
          estCommun: true,
        },
      ];
      audit.situationFamiliale.proches = [
        {
          id: 'proche-parent',
          lienParente: 'parent',
          prenom: 'Anne',
          nom: 'Martin',
          dateNaissance: '1950-01-01',
          rattachement: 'client',
          avatarKind: 'femme',
        },
        {
          id: 'proche-petit-enfant',
          lienParente: 'petit_enfant',
          prenom: 'Noé',
          nom: 'Martin',
          dateNaissance: '2030-01-01',
          parentEnfantId: 'enfant-lea',
        },
        {
          id: 'proche-oncle',
          lienParente: 'oncle_tante',
          prenom: 'Paul',
          nom: 'Martin',
          dateNaissance: '1972-01-01',
          rattachementBranche: 'client_paternelle',
        },
      ];
    });

    expect(vm.synthese.proches.map((proche) => proche.prenom)).toEqual(['Anne', 'Noé', 'Paul']);
    expect(vm.synthese.proches.map((proche) => proche.lienParente)).toEqual([
      'parent',
      'petit_enfant',
      'oncle_tante',
    ]);
    expect(vm.synthese.proches.map((proche) => proche.avatarKind)).toEqual([
      'femme',
      'garcon',
      'homme',
    ]);
    expect(vm.synthese.proches[1]?.parentEnfantId).toBe('enfant-lea');
    expect(vm.synthese.filiationHasData).toBe(true);
  });

  it('affiche un fallback famille quand plusieurs membres existent sans nom principal', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: '',
        dateNaissance: '1980-01-01',
      };
      audit.situationFamiliale.enfants = [
        { prenom: 'Léa', dateNaissance: '2010-05-01', estCommun: true },
      ];
    });

    expect(vm.dossierClientLabel).toBe('Famille à renseigner');
  });

  it('garde un avatar enfant robuste quand le prénom est encore vide', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.situationFamiliale.enfants = [{ prenom: '', dateNaissance: '', estCommun: true }];
    });

    expect(vm.synthese.enfants[0]).toMatchObject({
      prenom: '—',
      avatarKind: 'garcon',
    });
  });

  it('compte une part de plus pour le troisième enfant (règle quotient familial)', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
      audit.situationFamiliale.mme = {
        prenom: 'Marie',
        nom: 'Martin',
        dateNaissance: '1982-03-01',
      };
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.enfants = [
        { prenom: 'A', dateNaissance: '2008-01-01', estCommun: true },
        { prenom: 'B', dateNaissance: '2010-01-01', estCommun: true },
        { prenom: 'C', dateNaissance: '2012-01-01', estCommun: true },
      ];
    });

    // 2 + 0,5 + 0,5 + 1 = 4 parts.
    expect(vm.synthese.partsFiscales).toBe(4);
  });

  it('restitue les objectifs et une note qualitative', () => {
    const vm = vmFromAudit((audit) => {
      audit.objectifs = [
        'proteger_conjoint',
        'reduire_fiscalite',
        'developper_patrimoine',
        'revenus_differes',
      ];
    });

    expect(vm.objectifs.objectifs.map((objectif) => objectif.label)).toEqual([
      'Protéger mon conjoint',
      'Réduire la fiscalité',
      'Développer mon patrimoine',
      'Préparer des revenus différés',
    ]);
    expect(vm.objectifs.visibleObjectifs.map((objectif) => objectif.label)).toEqual([
      'Protéger mon conjoint',
      'Réduire la fiscalité',
      'Développer mon patrimoine',
    ]);
    expect(vm.objectifs.totalObjectifs).toBe(4);
    expect(vm.objectifs.overflowCount).toBe(1);
    expect(vm.objectifs.note).toBe('Contraintes à préciser');
  });

  it('produit les points à confirmer depuis les champs F1 requis manquants', () => {
    const vm = vmFromAudit();

    expect(vm.statusBar.items.find((item) => item.id === 'points')).toMatchObject({
      label: 'Champs F1 à compléter',
      value: '3',
    });
    expect(vm.pointsAConfirmer.map((point) => point.label)).toEqual([
      'Client principal à compléter',
      'Objectifs client à définir',
    ]);
    expect(vm.pointsAConfirmer.map((point) => point.action?.destination)).toEqual([
      'dossier',
      'objectifs',
    ]);
  });

  it('ajoute le régime matrimonial à confirmer pour un couple sans régime renseigné', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.situationFamiliale.mme = {
        prenom: 'Marie',
        nom: 'Martin',
        dateNaissance: '1982-03-01',
      };
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.objectifs = ['proteger_conjoint'];
    });

    expect(vm.pointsAConfirmer).toContainEqual(
      expect.objectContaining({
        id: 'regime-matrimonial',
        label: 'Régime matrimonial à confirmer',
        action: { destination: 'civil' },
      }),
    );
  });

  it('ne crée aucun point à confirmer quand le socle F1 requis est cohérent', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
      };
      audit.objectifs = ['developper_patrimoine'];
    });

    expect(vm.pointsAConfirmer).toEqual([]);
  });

  it('expose les slides d’aperçu sans chiffre métier inventé ni route simulateur', () => {
    const vm = vmFromAudit();
    const text = vm.previewSlides
      .map((slide) =>
        [slide.title, slide.eyebrow, slide.badgeLabel, slide.description, slide.caption].join(' '),
      )
      .join(' ');

    expect(vm.previewSlides.map((slide) => slide.id)).toEqual(['masses', 'societe', 'ir']);
    expect(vm.previewSlides.map((slide) => slide.badgeLabel)).toEqual([
      'À venir · F3',
      'À venir · F5',
      'Disponible · IR',
    ]);
    expect(vm.previewSlides.find((slide) => slide.id === 'ir')).toMatchObject({
      status: 'available',
    });
    expect(text).not.toMatch(/\/sim\//);
    expect(text).not.toMatch(/patrimoine net|TMI\s+\d|droits? successoraux|score|radar|€|%/i);
  });

  it('expose les prérequis de stratégie sans activation ni radar', () => {
    const vm = vmFromAudit((audit) => {
      audit.objectifs = ['developper_patrimoine'];
    });

    expect(vm.pilotage.prerequis.map((prerequis) => prerequis.label)).toEqual([
      'Objectifs définis',
      'Contraintes précisées',
      'Patrimoine structuré',
      'Scénarios disponibles',
    ]);
    expect(vm.pilotage.prerequis[0]).toMatchObject({
      status: 'satisfied',
      statusLabel: 'Renseigné',
    });
    expect(vm.pilotage.prerequis.slice(1).map((prerequis) => prerequis.status)).toEqual([
      'missing',
      'future',
      'future',
    ]);
  });

  it('garde la stratégie verrouillée et n’expose aucun jargon interne', () => {
    const vm = vmFromAudit();

    expect(vm.pilotage.title).toBe('Stratégie');
    const text = userText(vm);
    expect(text).not.toMatch(/\bF6\b/);
    expect(text).not.toMatch(/fondation/i);
    expect(text).not.toMatch(/patrimoine net/i);
    expect(text).not.toMatch(/TMI\s+\d/i);
    expect(text).not.toMatch(/\bmock\b|fake|dummy/i);
  });
});
