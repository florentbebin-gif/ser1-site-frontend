import { describe, expect, it } from 'vitest';

import { DOSSIER_CHAIN_LABELS } from '../chainLabels';

describe('DOSSIER_CHAIN_LABELS', () => {
  it('définit les trois directions de chaîne, non vides et distinctes', () => {
    const values = [
      DOSSIER_CHAIN_LABELS.upstream,
      DOSSIER_CHAIN_LABELS.current,
      DOSSIER_CHAIN_LABELS.downstream,
    ];

    expect(values.every((label) => label.trim().length > 0)).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });
});
