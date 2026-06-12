import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — placements et enveloppes', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const R1_EXPECTED_STATUSES = {
    'placements.allocation': 'couvert',
    'placements.ps-pfu-revenus-capital': 'couvert',
    'placements.assurance-vie-capitalisation': 'partiel',
    'placements.enveloppes-titres': 'partiel',
    'placements.epargne-reglementee': 'couvert',
  } as const;
  const R1_KEYS = Object.keys(R1_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof R1_EXPECTED_STATUSES
  >;

  // La part IR du PFU est administrée dans le mémento, mais le taux global
  // est composé avec la part sociale portée par la page Prélèvements : l'entrée
  // mémento garde Prélèvements comme propriétaire de preuve.
  const CROSS_PAGE_CLAIM_EXCEPTIONS = new Set([
    'placements.ps-pfu-revenus-capital::pfu-ir-current',
  ]);

  it('déclare les cinq entrées du lot placements avec leurs statuts attendus', () => {
    for (const key of R1_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.status, key).toBe(R1_EXPECTED_STATUSES[key]);
    }
  });

  it('rattache chaque entrée à sa page propriétaire de preuve', () => {
    for (const key of R1_KEYS) {
      const entry = entryByKey.get(key);
      const expectedOwner =
        key === 'placements.ps-pfu-revenus-capital'
          ? '/settings/prelevements'
          : '/settings/base-contrat';

      expect(entry!.ownerPagePath, key).toBe(expectedOwner);
    }
  });

  it('aligne chaque claim sur la page propriétaire de son entrée, hors exception documentée', () => {
    const bindingsByClaimKey = new Map(
      SETTINGS_REFERENCE_CHAIN.map((binding) => [binding.claimKey, binding]),
    );

    for (const key of R1_KEYS) {
      const entry = entryByKey.get(key);

      for (const claimKey of entry!.claimKeys) {
        if (CROSS_PAGE_CLAIM_EXCEPTIONS.has(`${key}::${claimKey}`)) continue;

        const binding = bindingsByClaimKey.get(claimKey);

        expect(binding, `${key}: claim inconnu ${claimKey}`).toBeDefined();
        expect(binding!.pagePath, `${key}: ${claimKey}`).toBe(entry!.ownerPagePath);
      }
    }
  });

  it('justifie les statuts couvert par des claims settings existants', () => {
    for (const key of [
      'placements.allocation',
      'placements.ps-pfu-revenus-capital',
      'placements.epargne-reglementee',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.claimKeys.length, key).toBeGreaterThan(0);
    }
  });

  it('réutilise des claims Base-Contrat existants sur chaque entrée adossée au catalogue', () => {
    for (const key of [
      'placements.allocation',
      'placements.assurance-vie-capitalisation',
      'placements.enveloppes-titres',
      'placements.epargne-reglementee',
    ] as const) {
      const entry = entryByKey.get(key);
      const baseContratClaims = entry!.claimKeys.filter((claimKey) =>
        claimKey.startsWith('base-contrat-'),
      );

      expect(baseContratClaims.length, key).toBeGreaterThan(0);
    }
  });

  it('garde des sources qualifiées sur les entrées liées au registry', () => {
    for (const key of [
      'placements.ps-pfu-revenus-capital',
      'placements.assurance-vie-capitalisation',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.registryKeys.length, key).toBeGreaterThan(0);
      expect(entry!.claimKeys.length + entry!.refIds.length, key).toBeGreaterThan(0);
    }
  });

  it('aligne chaque entrée placements sur le chapitre couvert par son simulateur', () => {
    for (const key of R1_KEYS) {
      const entry = entryByKey.get(key);

      for (const simulatorId of entry!.relatedSimulatorIds) {
        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId, key).toBe(entry!.chapterId);
      }
    }
  });
});
