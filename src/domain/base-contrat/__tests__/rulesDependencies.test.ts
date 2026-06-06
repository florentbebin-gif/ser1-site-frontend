import { describe, expect, it } from 'vitest';

import { CATALOG } from '../catalog';
import { getRules } from '../rules/index';
import type { RuleBlock } from '../rules/types';

const GENERIC_DEPENDENCY_PATTERNS: RegExp[] = [
  /source officielle/i,
  /contractuelle applicable/i,
  /(^|[^\p{L}])[àa]\s+confirmer\b/iu,
  /(^|[^\p{L}])[àa]\s+v[eé]rifier\b/iu,
  /\bsource\b.*\b(confirmer|v[eé]rifier|applicable)\b/i,
];

const SOURCE_PLACEHOLDER = new RegExp(
  ['source officielle', 'contractuelle applicable'].join(' ou '),
  'i',
);

function allBlocks(productId: string): RuleBlock[] {
  const pp = getRules(productId, 'pp');
  const pm = getRules(productId, 'pm');
  return [
    ...pp.constitution,
    ...pp.sortie,
    ...pp.deces,
    ...pm.constitution,
    ...pm.sortie,
    ...pm.deces,
  ];
}

describe('Base-Contrat — dépendances de règles', () => {
  it('ne contient aucune dependency générique de source', () => {
    for (const product of CATALOG) {
      for (const block of allBlocks(product.id)) {
        for (const dependency of block.dependencies ?? []) {
          for (const pattern of GENERIC_DEPENDENCY_PATTERNS) {
            expect(
              pattern.test(dependency),
              `Dependency générique ${pattern} dans ${product.id} / "${block.title}": "${dependency}"`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('ne réintroduit pas le placeholder source officiel ou contractuel', () => {
    for (const product of CATALOG) {
      for (const block of allBlocks(product.id)) {
        const texts = [block.title, ...block.bullets, ...(block.dependencies ?? [])];
        for (const text of texts) {
          expect(
            SOURCE_PLACEHOLDER.test(text),
            `Placeholder source dans ${product.id} / "${block.title}": "${text}"`,
          ).toBe(false);
        }
      }
    }
  });
});
