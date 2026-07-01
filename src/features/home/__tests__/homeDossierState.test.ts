import { describe, expect, it } from 'vitest';

import { createEmptyDossier, type DossierAudit } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';
import { buildAuditLandingViewModel } from '@/features/audit/shared';

import { buildHomeDossierState } from '../homeDossierState';

function viewModelFromAudit(mutate: (audit: DossierAudit) => void) {
  const audit = createEmptyDossier();
  audit.id = 'audit-test';
  mutate(audit);
  return buildAuditLandingViewModel(buildDossierPatrimonialFromAudit(audit));
}

const COUPLE_COMPLET: (audit: DossierAudit) => void = (audit) => {
  audit.situationFamiliale = {
    mr: { prenom: 'Alice', nom: 'Martin', dateNaissance: '1980-01-01', profession: 'Dirigeante' },
    mme: { prenom: 'Camille', nom: 'Martin', dateNaissance: '1982-02-02' },
    situationMatrimoniale: 'marie',
    enfants: [],
    proches: [],
  };
};

describe('buildHomeDossierState', () => {
  it("rend l'état sans dossier : pas de jauge, nouvelle analyse et scan de pré-remplissage", () => {
    const vm = buildAuditLandingViewModel(buildDossierPatrimonialFromAudit(createEmptyDossier()));

    expect(vm.hasDossier).toBe(false);
    const state = buildHomeDossierState(vm);

    expect(state.progress).toBeNull();
    expect(state.primaryAction).toMatchObject({
      state: 'new-analysis',
      title: 'Nouvelle analyse patrimoniale',
      cta: 'Démarrer',
    });
    expect(state.scanAction).toEqual({
      title: 'Scan documentaire',
      subtitle: 'Importez les documents du client pour pré-remplir le dossier.',
      cta: 'Importer',
    });
  });

  it('rend un dossier actif partiel sans objectif comme une continuation du dossier', () => {
    const vm = viewModelFromAudit((audit) => {
      audit.situationFamiliale.mr.prenom = 'Jean';
      audit.situationFamiliale.mr.nom = 'Martin';
      audit.objectifs = [];
    });

    expect(vm.hasDossier).toBe(true);
    const state = buildHomeDossierState(vm);

    expect(state.progress?.label).toBe('Identité foyer');
    expect(state.progress?.ariaLabel).toMatch(/^Identité foyer : \d+ %$/);
    expect(state.primaryAction).toMatchObject({
      state: 'continue-dossier',
      title: 'Continuer le dossier',
      cta: 'Continuer',
    });
    expect(state.scanAction).toEqual({
      title: 'Ajouter des documents au dossier',
      subtitle:
        'Complétez ou vérifiez les données déjà structurées à partir de nouvelles pièces client.',
      cta: 'Ajouter des pièces',
    });
  });

  it('reprend la stratégie quand des objectifs sont définis sans scénario en cours', () => {
    const vm = viewModelFromAudit((audit) => {
      COUPLE_COMPLET(audit);
      audit.objectifs = ['preparer_transmission'];
    });

    const state = buildHomeDossierState(vm);

    expect(state.progress?.percent).toBe(100);
    expect(state.primaryAction).toMatchObject({
      state: 'resume-strategy',
      title: 'Reprendre la stratégie',
      cta: 'Reprendre',
    });
  });

  it('priorise le scénario en cours quand un signal fiable est fourni', () => {
    const vm = viewModelFromAudit((audit) => {
      COUPLE_COMPLET(audit);
      audit.objectifs = ['preparer_transmission'];
    });

    const state = buildHomeDossierState(vm, { hasScenarioInProgress: true });

    expect(state.primaryAction).toMatchObject({
      state: 'continue-scenario',
      title: 'Continuer le scénario',
      cta: 'Continuer',
    });
  });
});
