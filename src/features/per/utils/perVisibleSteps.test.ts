import { describe, expect, it } from 'vitest';
import { buildVisibleSteps } from './perVisibleSteps';

describe('buildVisibleSteps', () => {
  it('supprime l’étape Synthèse du parcours déclaration 2042', () => {
    expect(buildVisibleSteps('declaration-n1', false)).toEqual([1, 2, 3]);
  });

  it('supprime l’étape Synthèse du parcours versement sans projection', () => {
    expect(buildVisibleSteps('versement-n', false)).toEqual([1, 2, 3]);
  });

  it('garde l’estimation 2026 uniquement quand la projection est activée', () => {
    expect(buildVisibleSteps('versement-n', true)).toEqual([1, 2, 3, 4]);
  });
});
