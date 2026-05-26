import { describe, expect, it } from 'vitest';
import type { PerPotentielResult } from '@/engine/per';
import { makeDefaultPerPotentielState } from './perPotentielState';
import { hasPerPotentielSynthesisReady } from './perPotentielReadiness';

const result = {} as PerPotentielResult;

describe('hasPerPotentielSynthesisReady', () => {
  it('reste en attente sans parcours explicite', () => {
    const state = makeDefaultPerPotentielState();

    expect(hasPerPotentielSynthesisReady(state, result)).toBe(false);
  });

  it('reste en attente tant que le moteur ne restitue pas de résultat exploitable', () => {
    const state = { ...makeDefaultPerPotentielState(), mode: 'versement-n' as const };

    expect(hasPerPotentielSynthesisReady(state, null)).toBe(false);
  });

  it('devient prêt quand un avis IR est saisi', () => {
    const state = {
      ...makeDefaultPerPotentielState(),
      mode: 'versement-n' as const,
      avisIr: {
        nonUtiliseAnnee1: 100,
        nonUtiliseAnnee2: 0,
        nonUtiliseAnnee3: 0,
        plafondCalcule: 0,
        anneeRef: 2025,
      },
    };

    expect(hasPerPotentielSynthesisReady(state, result)).toBe(true);
  });

  it('devient prêt quand un revenu TNS ou un versement retraite est saisi', () => {
    const base = { ...makeDefaultPerPotentielState(), mode: 'versement-n' as const };

    expect(
      hasPerPotentielSynthesisReady(
        {
          ...base,
          projectionNDeclarant1: {
            ...base.projectionNDeclarant1,
            statutTns: true,
            art62: 50000,
          },
        },
        result,
      ),
    ).toBe(true);

    expect(
      hasPerPotentielSynthesisReady(
        {
          ...base,
          projectionNDeclarant1: {
            ...base.projectionNDeclarant1,
            statutTns: true,
            cotisationsMadelin154bis: 3000,
          },
        },
        result,
      ),
    ).toBe(true);
  });
});
