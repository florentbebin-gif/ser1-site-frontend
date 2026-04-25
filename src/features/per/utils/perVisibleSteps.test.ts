import { describe, expect, it } from 'vitest';
import { buildVisibleSteps } from './perVisibleSteps';

describe('buildVisibleSteps', () => {
  it('supprime l’étape Synthèse du parcours déclaration 2042', () => {
    expect(buildVisibleSteps('declaration-n1', 'previous-avis-plus-n1', false)).toEqual([1, 2, 3]);
  });

  it('ajoute Versement N après les revenus 2025 quand on part de l’avis IR 2025', () => {
    expect(buildVisibleSteps('versement-n', 'previous-avis-plus-n1', false)).toEqual([1, 2, 3, 4]);
  });

  it('garde un parcours court quand on part de l’avis IR 2026', () => {
    expect(buildVisibleSteps('versement-n', 'current-avis', false)).toEqual([1, 2, 3]);
  });

  it('ne crée pas de tab supplémentaire quand la projection est activée', () => {
    expect(buildVisibleSteps('versement-n', 'current-avis', true)).toEqual([1, 2, 3]);
    expect(buildVisibleSteps('versement-n', 'previous-avis-plus-n1', true)).toEqual([1, 2, 3, 4]);
  });
});
