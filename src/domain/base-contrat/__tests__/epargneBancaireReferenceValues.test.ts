import { describe, expect, it } from 'vitest';

import { getRules } from '../rules/index';

describe('épargne bancaire — valeurs réglementées dédupliquées', () => {
  it('ne répète plus les plafonds et taux de chiffres clés dans la phase constitution', () => {
    const products = ['livret_a', 'ldds', 'lep', 'pea', 'pea_pme', 'pel', 'cel'] as const;
    const forbiddenValuePattern =
      /22\s*950|12\s*000|10\s*000|1\s*600|15\s*300|61\s*200|150\s*000|225\s*000|1,5\s*%|2,5\s*%/;

    for (const productId of products) {
      const text = getRules(productId, 'pp')
        .constitution.flatMap((block) => block.bullets)
        .join(' ');

      expect(text, productId).not.toMatch(forbiddenValuePattern);
      expect(text, productId).toMatch(/plafonn|réglement|Versement/i);
    }
  });
});
