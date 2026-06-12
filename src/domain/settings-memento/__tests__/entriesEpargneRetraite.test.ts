import { describe, expect, it } from 'vitest';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — épargne retraite', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));

  it('déclare la Base CG retraite comme référentiel documentaire R7', () => {
    const entry = entryByKey.get('epargne-retraite.base-cg-retraite');

    expect(entry).toBeDefined();
    expect(entry!.chapterId).toBe('epargne-retraite');
    expect(entry!.status).toBe('partiel');
    expect(entry!.ownerPagePath).toBe('/settings/base-contrat-retraite');
    expect(entry!.registryKeys).toEqual([]);
    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual([
      'cmf-l224-1',
      'cmf-l224-40',
      'cgi-154-bis',
      'cgi-163-quatervicies',
    ]);
    expect(entry!.relatedSimulatorIds).toEqual(['per', 'per-transfert']);
  });

  it('ne change pas les couvertures PER qui seront détaillées au lot suivant', () => {
    expect(getCoverageForSimulator('per').expectedStatus).toBe('couvert');
    expect(getCoverageForSimulator('per-potentiel').expectedStatus).toBe('couvert');
    expect(getCoverageForSimulator('per-transfert').expectedStatus).toBe('couvert');
  });
});
