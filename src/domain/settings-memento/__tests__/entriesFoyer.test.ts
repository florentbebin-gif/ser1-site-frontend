import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — foyer, civil et patrimoine', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const FOYER_EXPECTED_STATUSES = {
    'foyer.filiation': 'planned',
    'foyer.budget': 'planned',
    'civil.regime-matrimonial': 'partiel',
    'civil.devolution-conjoint-survivant': 'partiel',
    'civil.reserve-quotite': 'couvert',
    'transmission.donations-anterieures': 'planned',
    'patrimoine.demembrement': 'couvert',
    'patrimoine.actif-passif': 'a_verifier',
  } as const;
  const FOYER_KEYS = Object.keys(FOYER_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof FOYER_EXPECTED_STATUSES
  >;

  // Les règles civiles et patrimoniales socles sont consommées par le moteur
  // succession, dont la ligne de couverture simulateur vit au chapitre
  // transmission : l'écart de chapitre est attendu pour ces entrées.
  const CROSS_CHAPTER_SIMULATOR_EXCEPTIONS = new Set([
    'civil.devolution-conjoint-survivant::succession',
    'civil.reserve-quotite::succession',
    'patrimoine.demembrement::succession',
  ]);

  it('déclare les huit entrées du lot foyer avec leurs statuts attendus', () => {
    for (const key of FOYER_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.status, key).toBe(FOYER_EXPECTED_STATUSES[key]);
    }
  });

  it('aligne chaque claim sur la page propriétaire de son entrée', () => {
    const bindingsByClaimKey = new Map(
      SETTINGS_REFERENCE_CHAIN.map((binding) => [binding.claimKey, binding]),
    );

    for (const key of FOYER_KEYS) {
      const entry = entryByKey.get(key);

      for (const claimKey of entry!.claimKeys) {
        const binding = bindingsByClaimKey.get(claimKey);

        expect(binding, `${key}: claim inconnu ${claimKey}`).toBeDefined();
        expect(binding!.pagePath, `${key}: ${claimKey}`).toBe(entry!.ownerPagePath);
      }
    }
  });

  it('justifie les statuts couvert par des sources officielles et le simulateur succession actif', () => {
    for (const key of ['civil.reserve-quotite', 'patrimoine.demembrement'] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.claimKeys.length + entry!.refIds.length, key).toBeGreaterThan(0);
      expect(entry!.relatedSimulatorIds, key).toEqual(['succession']);
    }
  });

  it('rattache le socle démembrement au claim et au registre DMTG', () => {
    const entry = entryByKey.get('patrimoine.demembrement');

    expect(entry!.claimKeys).toContain('usufruit-nue-propriete-cgi-669');
    expect(entry!.registryKeys).toEqual(['transmission.dmtg-succession']);
    expect(entry!.refIds).toContain('cgi-669');
    expect(entry!.refIds).toContain('code-civil-578');
  });

  it('garde le régime matrimonial partiel avec son référentiel civil complet', () => {
    const entry = entryByKey.get('civil.regime-matrimonial');

    expect(entry!.status).toBe('partiel');
    expect(entry!.relatedSimulatorIds).toEqual(['regime-matrimonial']);
    expect(entry!.refIds).toContain('code-civil-1515');
    expect(entry!.refIds).toContain('code-civil-1527');
    expect(entry!.refIds).toContain('cgi-796-0-bis');
  });

  it('aligne chaque entrée du lot sur le chapitre couvert par son simulateur, hors exceptions documentées', () => {
    for (const key of FOYER_KEYS) {
      const entry = entryByKey.get(key);

      for (const simulatorId of entry!.relatedSimulatorIds) {
        if (CROSS_CHAPTER_SIMULATOR_EXCEPTIONS.has(`${key}::${simulatorId}`)) continue;

        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId, key).toBe(entry!.chapterId);
      }
    }
  });
});
