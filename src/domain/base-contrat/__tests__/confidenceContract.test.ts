/**
 * Contrat bloquant des niveaux de confiance Base-Contrat.
 */

import { describe, expect, it } from 'vitest';
import { CATALOG } from '../catalog';
import { getRules } from '../rules/index';
import type { RuleBlock } from '../rules/types';

const AUDIENCES = ['pp', 'pm'] as const;
const RULE_PHASES = ['constitution', 'sortie', 'deces'] as const;

type RulePhase = (typeof RULE_PHASES)[number];

interface RuleBlockContext {
  productId: string;
  audience: (typeof AUDIENCES)[number];
  phase: RulePhase;
  block: RuleBlock;
}

function allBlockContexts(productId: string): RuleBlockContext[] {
  return AUDIENCES.flatMap((audience) => {
    const rules = getRules(productId, audience);
    return RULE_PHASES.flatMap((phase) =>
      rules[phase].map((block) => ({
        productId,
        audience,
        phase,
        block,
      })),
    );
  });
}

describe('confidence policy — elevee est vérifiée et sourcée', () => {
  it('conserve des blocs elevee quand ils respectent déjà le contrat', () => {
    const verifiedBlocks = CATALOG.flatMap((product) =>
      allBlockContexts(product.id).filter(({ block }) => block.confidence === 'elevee'),
    );

    expect(verifiedBlocks.length).toBeGreaterThan(0);
  });

  it('bloque les blocs elevee avec "À confirmer" ou sans source', () => {
    const violations = CATALOG.flatMap((product) =>
      allBlockContexts(product.id)
        .filter(({ block }) => block.confidence === 'elevee')
        .flatMap(({ productId, audience, phase, block }) => {
          const location = `${productId}/${audience}/${phase} — ${block.title}`;
          const issues: string[] = [];
          if (block.bullets.some((bullet) => bullet.includes('À confirmer'))) {
            issues.push(`${location} contient "À confirmer"`);
          }
          if (!Array.isArray(block.sources) || block.sources.length === 0) {
            issues.push(`${location} sans source`);
          }
          return issues;
        }),
    );

    expect(violations, violations.join('\n')).toEqual([]);
  });
});
