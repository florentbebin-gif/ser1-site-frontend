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
    });
    expect(vm.synthese.situationLabel).toBe('Célibataire');
    expect(vm.synthese.partsFiscales).toBe(1);
    expect(vm.synthese.tmiLabel).toBe('à venir');
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
    });
    expect(vm.synthese.enfants.map((enfant) => enfant.prenom)).toEqual(['Léa', 'Tom']);
    expect(vm.synthese.enfants[0]?.age).toBe(16);
    // Marié + 2 enfants à charge → 2 + 0,5 + 0,5 = 3 parts.
    expect(vm.synthese.partsFiscales).toBe(3);
    expect(vm.synthese.filiationHasData).toBe(true);
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
  });
});
