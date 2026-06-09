import { describe, expect, it } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import {
  buildDossierPatrimonialFromAudit,
  createEmptyDossierPatrimonial,
  type DossierPatrimonial,
} from '@/domain/dossier';

import { buildAuditLandingViewModel, type AuditLandingViewModel } from '../auditLandingViewModel';

const NOW = '2026-06-08T10:00:00.000Z';

function vmFromAudit(mutate: (audit: ReturnType<typeof createEmptyDossier>) => void = () => {}) {
  const audit = createEmptyDossier();
  mutate(audit);
  return buildAuditLandingViewModel(buildDossierPatrimonialFromAudit(audit, { now: NOW }));
}

function checkItem(vm: AuditLandingViewModel, id: string) {
  return vm.synthese.checklist.find((item) => item.id === id);
}

/** Tout le texte exposé au CGP, pour les gardes anti-jargon. */
function userText(vm: AuditLandingViewModel): string {
  const parts: string[] = [
    vm.summary.collecte.label,
    vm.summary.strategy.label,
    vm.summary.nextAction.label,
    vm.synthese.badge.label,
    vm.objectifs.badge.label,
    vm.objectifs.emptyLabel,
    vm.objectifs.action.label,
    ...vm.objectifs.notes,
    vm.pilotage.badge.label,
    vm.pilotage.headline,
    vm.pilotage.description,
    vm.pilotage.caption,
  ];
  for (const item of vm.synthese.checklist) {
    parts.push(item.label, item.requirementLabel, item.value ?? '', item.action?.label ?? '');
  }
  return parts.join(' ');
}

describe('buildAuditLandingViewModel', () => {
  it('ne présente jamais une valeur par défaut comme une certitude (dossier vierge)', () => {
    const vm = vmFromAudit();

    const situation = checkItem(vm, 'situation-familiale');
    expect(situation?.done).toBe(false);
    expect(situation?.value).toBeUndefined();
    const enfants = checkItem(vm, 'enfants');
    expect(enfants?.done).toBe(false);
    expect(enfants?.value).toBeUndefined();
    // Aucune valeur affichée ne doit affirmer une situation par défaut ou une absence.
    const values = vm.synthese.checklist.map((item) => item.value ?? '').join(' ');
    expect(/célibataire/i.test(values)).toBe(false);
    expect(/aucun/i.test(values)).toBe(false);
  });

  it('résume la collecte et propose une seule prochaine action (dossier vide)', () => {
    const vm = vmFromAudit();

    expect(vm.summary.collecte.label).toBe('Collecte en cours');
    expect(vm.summary.keyDataDone).toBe(0);
    expect(vm.summary.keyDataTotal).toBeGreaterThan(0);
    expect(vm.summary.ratio).toBe(0);
    // Membre principal + objectifs = 2 requis manquants.
    expect(vm.summary.requisRemaining).toBe(2);
    expect(vm.summary.recommandeRemaining).toBeGreaterThan(0);
    expect(vm.summary.nextAction.label).toBe('Saisir le membre principal');
    expect(vm.synthese.primaryAction).toEqual(vm.summary.nextAction);
  });

  it('affiche la situation familiale réelle une fois le foyer engagé', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
    });

    expect(checkItem(vm, 'membre-principal')).toMatchObject({ done: true, value: 'Jean Martin' });
    expect(checkItem(vm, 'situation-familiale')).toMatchObject({
      done: true,
      value: 'Célibataire',
    });
    expect(vm.summary.nextAction.label).toBe('Ajouter des objectifs');
  });

  it('ajoute conjoint et régime à la checklist pour un couple', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
      audit.situationFamiliale.situationMatrimoniale = 'marie';
    });

    expect(checkItem(vm, 'conjoint')).toMatchObject({ done: false, requirement: 'recommande' });
    expect(checkItem(vm, 'regime-matrimonial')).toMatchObject({ done: false });
    expect(checkItem(vm, 'conjoint')?.action?.label).toBe('Saisir');
  });

  it('réunit les données clés requises sans manque bloquant', () => {
    const vm = vmFromAudit((audit) => {
      audit.situationFamiliale.mr = { prenom: 'Jean', nom: 'Martin', dateNaissance: '1980-01-01' };
      audit.objectifs = ['proteger_conjoint', 'reduire_fiscalite'];
    });

    expect(vm.summary.requisRemaining).toBe(0);
    expect(vm.summary.nextAction.label).toBe('Reprendre l’audit');
    expect(vm.objectifs.objectifs.map((objectif) => objectif.label)).toEqual([
      'Protéger mon conjoint',
      'Réduire la fiscalité',
    ]);
    expect(vm.objectifs.notes).toContain('Contraintes à préciser');
  });

  it('présente la carte objectifs vide de façon qualitative, sans compteur zéro', () => {
    const vm = vmFromAudit();

    expect(vm.objectifs.state).toBe('vide');
    expect(vm.objectifs.badge.label).toBe('À renseigner');
    expect(vm.objectifs.emptyLabel).toBe('Aucun objectif consigné');
    expect(vm.objectifs.objectifs).toHaveLength(0);
    expect(vm.objectifs.action.label).toBe('Ajouter des objectifs');
  });

  it('passe la carte objectifs en « complet » avec contraintes ou opérations', () => {
    const base = createEmptyDossierPatrimonial({ now: NOW });
    const dossier: DossierPatrimonial = {
      ...base,
      objectifs: [
        {
          id: 'o1',
          code: 'developper_patrimoine',
          label: 'Développer mon patrimoine',
          priority: 1,
          sourceRefIds: [],
        },
      ],
      contraintes: [
        {
          id: 'c1',
          label: 'Maintenir une épargne de précaution',
          priority: 'haute',
          sourceRefIds: [],
        },
      ],
      operationsPrevues: [
        { id: 'op1', label: 'Vente résidence secondaire', status: 'planned', sourceRefIds: [] },
      ],
    };
    const vm = buildAuditLandingViewModel(dossier);

    expect(vm.objectifs.state).toBe('complet');
    expect(vm.objectifs.badge.tone).toBe('done');
  });

  it('garde le pilotage verrouillé, premium et sans jargon interne', () => {
    const vm = vmFromAudit();

    expect(vm.pilotage.badge.tone).toBe('locked');
    expect(vm.pilotage.headline).toBe('Stratégie verrouillée');
    // Pas de score chiffré dans le placeholder.
    expect(/\d/.test(vm.pilotage.headline + vm.pilotage.description + vm.pilotage.caption)).toBe(
      false,
    );
  });

  it('n’expose aucun jargon interne dans le texte CGP', () => {
    const text = userText(
      vmFromAudit((audit) => {
        audit.situationFamiliale.mr = {
          prenom: 'Jean',
          nom: 'Martin',
          dateNaissance: '1980-01-01',
        };
        audit.situationFamiliale.situationMatrimoniale = 'marie';
      }),
    );

    expect(text).not.toMatch(/\bF6\b/);
    expect(text).not.toMatch(/fondation/i);
    expect(text).not.toMatch(/module débloqué/i);
    expect(text).not.toMatch(/non persisté/i);
    expect(text).not.toMatch(/version active du dossier/i);
    expect(text).not.toMatch(/non calculable/i);
    expect(text).not.toMatch(/bloquant/i);
  });
});
