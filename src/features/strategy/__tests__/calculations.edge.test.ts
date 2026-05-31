import { describe, expect, it } from 'vitest';
import { createEmptyDossier } from '@/domain/audit/types';
import { calculateBaselineProjection, compareScenarios } from '../utils/calculations';
import type { Scenario } from '@/domain/strategy/types';

describe('calculations edge cases', () => {
  it('retourne un IR nul si le nombre de parts est invalide', () => {
    const dossier = createEmptyDossier();
    dossier.situationFiscale.revenuFiscalReference = 80000;
    dossier.situationFiscale.nombreParts = 0;

    const scenario = calculateBaselineProjection(dossier);

    expect(scenario.projections.every((projection) => projection.impotRevenu === 0)).toBe(true);
  });

  it('rejette une comparaison sans projection baseline', () => {
    const emptyBaseline: Scenario = {
      id: 'baseline',
      nom: 'Baseline vide',
      description: '',
      projections: [],
      hypotheses: [],
    };
    const strategie = calculateBaselineProjection(createEmptyDossier());

    expect(() => compareScenarios(emptyBaseline, strategie)).toThrow(
      'Comparaison impossible: scénario sans projection.',
    );
  });

  it('rejette une comparaison dont la stratégie manque une année projetée', () => {
    const baseline = calculateBaselineProjection(createEmptyDossier());
    const strategie: Scenario = {
      ...baseline,
      id: 'strategie',
      projections: baseline.projections.slice(0, -1),
    };

    expect(() => compareScenarios(baseline, strategie)).toThrow(
      "Projection stratégie manquante pour l'année 10.",
    );
  });
});
