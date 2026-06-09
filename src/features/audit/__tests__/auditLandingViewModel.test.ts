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
    vm.objectifs.ariaLabel,
    vm.objectifs.emptyLabel,
    vm.objectifs.note ?? '',
    vm.pilotage.title,
    vm.pilotage.description,
    vm.pilotage.caption,
  ].join(' ');
}

describe('buildAuditLandingViewModel', () => {
  it('reste vide sur un dossier vierge, sans valeur par défaut affirmée', () => {
    const vm = vmFromAudit();

    expect(vm.hasDossier).toBe(false);
    expect(vm.synthese.hasData).toBe(false);
    expect(vm.synthese.etatCivil.principalName).toBeNull();
    expect(vm.synthese.etatCivil.situationLabel).toBeNull();
    expect(vm.synthese.filiation.hasData).toBe(false);
  });

  it('restitue l’état civil réel du membre principal', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
    });

    expect(vm.hasDossier).toBe(true);
    expect(vm.synthese.etatCivil.principalName).toBe('Jean Martin');
    expect(vm.synthese.etatCivil.principalAge).toBe(46);
    expect(vm.synthese.etatCivil.situationLabel).toBe('Célibataire');
    expect(vm.synthese.filiation.principal?.label).toBe('Jean');
  });

  it('restitue le couple et les enfants dans l’état civil et la filiation', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
      audit.situationFamiliale.mme = {
        prenom: 'Marie',
        nom: 'Martin',
        dateNaissance: '1982-03-01',
      };
      audit.situationFamiliale.situationMatrimoniale = 'marie';
      audit.situationFamiliale.enfants = [
        { prenom: 'Léa', dateNaissance: '2010-05-01', estCommun: true },
      ];
    });

    expect(vm.synthese.etatCivil.situationLabel).toBe('Marié(e)');
    expect(vm.synthese.etatCivil.conjointName).toBe('Marie Martin');
    expect(vm.synthese.etatCivil.enfantsPrenoms).toEqual(['Léa']);
    expect(vm.synthese.filiation.conjoint?.label).toBe('Marie');
    expect(vm.synthese.filiation.enfants.map((node) => node.label)).toEqual(['Léa']);
    expect(vm.synthese.filiation.hasData).toBe(true);
  });

  it('restitue les objectifs réels et une note qualitative', () => {
    const vm = vmFromAudit((audit) => {
      audit.objectifs = ['proteger_conjoint', 'reduire_fiscalite'];
    });

    expect(vm.objectifs.objectifs.map((objectif) => objectif.label)).toEqual([
      'Protéger mon conjoint',
      'Réduire la fiscalité',
    ]);
    expect(vm.objectifs.note).toBe('Contraintes à préciser');
    expect(vm.objectifs.emptyLabel).toBe('Aucun objectif consigné');
  });

  it('garde la stratégie verrouillée, premium et sans jargon ni score', () => {
    const vm = vmFromAudit();

    expect(vm.pilotage.title).toBe('Stratégie');
    expect(vm.pilotage.description).toBe('Disponible après structuration du dossier.');
    expect(/\d/.test(vm.pilotage.description + vm.pilotage.caption)).toBe(false);
  });

  it('n’expose aucun jargon interne dans le texte CGP', () => {
    const text = userText(
      vmFromAudit((audit) => {
        audit.situationFamiliale.mr = {
          prenom: 'Jean',
          nom: 'Martin',
          dateNaissance: '1980-01-01',
        };
      }),
    );

    expect(text).not.toMatch(/\bF6\b/);
    expect(text).not.toMatch(/fondation/i);
    expect(text).not.toMatch(/module débloqué/i);
    expect(text).not.toMatch(/non persisté/i);
    expect(text).not.toMatch(/patrimoine net/i);
  });
});
