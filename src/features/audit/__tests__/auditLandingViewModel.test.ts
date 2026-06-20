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
    expect(vm.dossierClientLabel).toBe('Jean Martin');
    expect(vm.synthese.situationLabel).toBe('Célibataire');
    expect(vm.synthese.partsFiscales).toBe(1);
    expect(vm.synthese.tmiLabel).toBe('à venir');
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

  it('expose les 18 sections canoniques sans fabriquer les fondations non livrées', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = {
        prenom: 'Jean',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
        profession: 'Médecin',
      };
      audit.objectifs = ['proteger_conjoint'];
    });

    expect(vm.progress).toHaveLength(18);
    expect(vm.progress.map((section) => section.label)).toEqual([
      'Dossier',
      'Situation familiale',
      'Filiation',
      'Régime matrimonial & donations',
      'Situation professionnelle',
      'Budget & capacité',
      'Sociétés / organigramme',
      'Patrimoine',
      'Actifs',
      'Passifs',
      'Fiscalité',
      'IFI conditionnel',
      'Succession',
      'Prévoyance',
      'Retraite',
      'Placements',
      'Objectifs',
      'Synthèse',
    ]);

    const fiscalite = vm.progress.find((section) => section.id === 'fiscalite');
    expect(fiscalite).toMatchObject({
      availability: 'gated',
      status: null,
      statusLabel: 'À venir',
    });
    expect(vm.progress.filter((section) => section.availability === 'gated')).toHaveLength(11);
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
    const calculsMetric = vm.statusBar.items.find((item) => item.id === 'calculs');
    const strategieMetric = vm.statusBar.items.find((item) => item.id === 'strategie');

    expect(vm.statusBar.f1Total).toBe(f1Sections.length);
    expect(vm.statusBar.f1Completed).toBe(
      f1Sections.filter((section) => section.status === 'complet').length,
    );
    expect(f1Metric).toMatchObject({
      label: 'Dossier renseigné',
      value: `${vm.statusBar.f1Completed}/${vm.statusBar.f1Total}`,
    });
    expect(calculsMetric).toMatchObject({ value: 'À venir' });
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
        { prenom: 'Léa', dateNaissance: '2010-05-01', estCommun: true },
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
      audit.objectifs = ['proteger_conjoint', 'reduire_fiscalite'];
    });

    expect(vm.objectifs.objectifs.map((objectif) => objectif.label)).toEqual([
      'Protéger mon conjoint',
      'Réduire la fiscalité',
    ]);
    expect(vm.objectifs.note).toBe('Contraintes à préciser');
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
