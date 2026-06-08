import { describe, expect, it } from 'vitest';

import { createEmptyDossier } from '@/domain/audit/types';
import {
  buildDossierPatrimonialFromAudit,
  createEmptyDossierPatrimonial,
  type DossierPatrimonial,
} from '@/domain/dossier';

import { buildAuditLandingViewModel } from '../auditLandingViewModel';

const NOW = '2026-06-08T10:00:00.000Z';

function auditWithPrincipal() {
  const audit = createEmptyDossier();
  audit.situationFamiliale.mr = {
    prenom: 'Jean',
    nom: 'Martin',
    dateNaissance: '1980-01-01',
  };
  return audit;
}

describe('buildAuditLandingViewModel', () => {
  it('restitue un dossier vide en « à compléter » avec ses manques', () => {
    const dossier = buildDossierPatrimonialFromAudit(createEmptyDossier(), { now: NOW });
    const vm = buildAuditLandingViewModel(dossier);

    expect(vm.synthese.state).toBe('a-completer');
    expect(vm.synthese.stateLabel).toBe('à compléter');
    expect(vm.synthese.missing.map((item) => item.id)).toEqual([
      'membre_principal',
      'objectifs_prioritaires',
    ]);
    expect(vm.objectifs.state).toBe('vide');
    expect(vm.objectifs.objectifs).toHaveLength(0);
  });

  it('restitue un dossier partiel quand le membre principal est connu mais sans objectifs', () => {
    const dossier = buildDossierPatrimonialFromAudit(auditWithPrincipal(), { now: NOW });
    const vm = buildAuditLandingViewModel(dossier);

    expect(vm.synthese.state).toBe('partiel');
    const principalFact = vm.synthese.facts.find((fact) => fact.id === 'membre-principal');
    expect(principalFact).toMatchObject({ value: 'Jean Martin', known: true });
    expect(vm.synthese.missing.map((item) => item.id)).toEqual(['objectifs_prioritaires']);
    expect(vm.objectifs.state).toBe('vide');
  });

  it('restitue un socle F1 complet quand membre principal et objectifs sont présents', () => {
    const audit = auditWithPrincipal();
    audit.objectifs = ['proteger_conjoint', 'reduire_fiscalite'];
    const dossier = buildDossierPatrimonialFromAudit(audit, { now: NOW });
    const vm = buildAuditLandingViewModel(dossier);

    expect(vm.synthese.state).toBe('complet');
    expect(vm.synthese.missing).toHaveLength(0);
    // Objectifs connus mais contraintes/opérations absentes → carte « partiel », pas « complet ».
    expect(vm.objectifs.state).toBe('partiel');
    expect(vm.objectifs.objectifs.map((objectif) => objectif.label)).toEqual([
      'Protéger mon conjoint',
      'Réduire la fiscalité',
    ]);
  });

  it('affiche le régime matrimonial à compléter pour un couple sans régime', () => {
    const audit = auditWithPrincipal();
    audit.situationFamiliale.situationMatrimoniale = 'marie';
    const dossier = buildDossierPatrimonialFromAudit(audit, { now: NOW });
    const vm = buildAuditLandingViewModel(dossier);

    const regimeFact = vm.synthese.facts.find((fact) => fact.id === 'regime-matrimonial');
    expect(regimeFact).toMatchObject({ value: 'à compléter', known: false });
  });

  it('passe la carte objectifs en « complet » quand contraintes ou opérations existent', () => {
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
    expect(vm.objectifs.contraintes[0]?.priorityLabel).toBe('priorité haute');
    expect(vm.objectifs.operationsPrevues[0]?.statusLabel).toBe('planifiée');
  });

  it('garde le pilotage stratégique « à venir », dépendant de F6, sans donnée calculée', () => {
    const dossier = buildDossierPatrimonialFromAudit(createEmptyDossier(), { now: NOW });
    const vm = buildAuditLandingViewModel(dossier);

    expect(vm.pilotage.state).toBe('a-venir');
    expect(vm.pilotage.stateLabel).toBe('à venir');
    expect(vm.pilotage.dependsOn).toBe('F6');
    expect(vm.pilotage.upcoming.length).toBeGreaterThan(0);
  });
});
