import { describe, expect, it } from 'vitest';

import { TYPE_LABELS } from '../labels';

describe('TYPE_LABELS', () => {
  it('couvre les neuf types de contrats retraite', () => {
    expect(Object.keys(TYPE_LABELS).sort()).toEqual([
      'ARTICLE83',
      'AUTRE',
      'MADELIN',
      'PERCO',
      'PERECO',
      'PERIN',
      'PEROB',
      'PERP',
      'PER_POINTS',
    ]);
  });

  it('distingue les anciens dispositifs et les PER post-PACTE', () => {
    expect(TYPE_LABELS.ARTICLE83).toContain('pré-PACTE');
    expect(TYPE_LABELS.PEROB).toBe('PER obligatoire');
    expect(TYPE_LABELS.PERCO).toContain('pré-PACTE');
    expect(TYPE_LABELS.PERECO).toBe('PER d’entreprise collectif');
  });
});
