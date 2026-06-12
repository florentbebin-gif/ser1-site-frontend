import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import {
  MEMENTO_ENTRIES,
  getCoverageForSimulator,
  PREVOYANCE_AFFILIATION_CAISSES_CLAIMS,
  PREVOYANCE_MAINTIEN_EMPLOYEUR_CLAIMS,
  PREVOYANCE_REGIME_CLAIMS,
} from '../index';

describe('settings-memento — prévoyance obligatoire', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const bindingsByClaimKey = new Map(
    SETTINGS_REFERENCE_CHAIN.map((binding) => [binding.claimKey, binding]),
  );
  const R7_PREVOYANCE_EXPECTED_STATUSES = {
    'prevoyance.familiale': 'partiel',
    'prevoyance.maintien-employeur': 'partiel',
    'prevoyance.regimes-salaries': 'partiel',
    'prevoyance.regimes-independants': 'partiel',
    'prevoyance.affiliation-caisses': 'partiel',
  } as const;
  const R7_PREVOYANCE_KEYS = Object.keys(R7_PREVOYANCE_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof R7_PREVOYANCE_EXPECTED_STATUSES
  >;

  it('déclare les entrées prévoyance R7 avec leurs statuts attendus', () => {
    for (const key of R7_PREVOYANCE_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.chapterId, key).toBe('prevoyance');
      expect(entry!.status, key).toBe(R7_PREVOYANCE_EXPECTED_STATUSES[key]);
      expect(entry!.ownerPagePath, key).toBe('/settings/prevoyance-regimes');
      expect(entry!.registryKeys, key).toContain('retraite-prevoyance.prevoyance-garanties');
    }
  });

  it('garde la prévoyance familiale appuyée sur les sources générales qualifiées', () => {
    const entry = entryByKey.get('prevoyance.familiale');

    expect(entry!.refIds).toEqual([
      'css-l911-1',
      'code-assurances-l132-1',
      'boss-protection-sociale-complementaire',
      'base-source-boss-prevoyance-tns',
    ]);
    expect(entry!.relatedSimulatorIds).toEqual(['prevoyance']);
  });

  it('verrouille la cartographie des caisses attendue par R7', () => {
    const entry = entryByKey.get('prevoyance.affiliation-caisses');

    expect(entry!.claimKeys).toEqual(PREVOYANCE_AFFILIATION_CAISSES_CLAIMS);
    expect(entry!.registryKeys).toEqual([
      'retraite-prevoyance.prevoyance-garanties',
      'retraite-prevoyance.cotisations-retraite',
      'social-dirigeant.charges-sociales',
    ]);
    expect(entry!.relatedSimulatorIds).toEqual(['prevoyance', 'remuneration', 'retraite']);
  });

  it('pointe chaque claim régime vers les sources JSONB prévoyance en base', () => {
    for (const claimKey of [...PREVOYANCE_MAINTIEN_EMPLOYEUR_CLAIMS, ...PREVOYANCE_REGIME_CLAIMS]) {
      const binding = bindingsByClaimKey.get(claimKey);

      expect(binding, `claim inconnu ${claimKey}`).toBeDefined();
      expect(binding!.pagePath, claimKey).toBe('/settings/prevoyance-regimes');
      expect(binding!.target.kind, claimKey).toBe('prevoyance-db');
      expect(binding!.refIds, claimKey).toEqual([]);
      expect(binding!.noRefReason, claimKey).toContain(
        'npm run audit:settings-references -- --with-db',
      );
    }
  });

  it('couvre tous les claims prevoyance-db sans les dupliquer dans le mémento', () => {
    const prevoyanceDbClaimKeys = SETTINGS_REFERENCE_CHAIN.filter(
      (binding) => binding.target.kind === 'prevoyance-db',
    ).map((binding) => binding.claimKey);
    const mementoClaimKeys = [...PREVOYANCE_MAINTIEN_EMPLOYEUR_CLAIMS, ...PREVOYANCE_REGIME_CLAIMS];

    expect([...mementoClaimKeys].sort()).toEqual([...prevoyanceDbClaimKeys].sort());
    expect(new Set(mementoClaimKeys).size).toBe(mementoClaimKeys.length);
  });

  it('ne revendique pas un même claim prévoyance sur deux entrées R7', () => {
    const claimOwners = new Map<string, string>();

    for (const key of R7_PREVOYANCE_KEYS) {
      const entry = entryByKey.get(key);

      for (const claimKey of entry!.claimKeys) {
        expect(
          claimOwners.get(claimKey),
          `${claimKey} déjà porté par ${claimOwners.get(claimKey)}`,
        ).toBeUndefined();
        claimOwners.set(claimKey, key);
      }
    }
  });

  it('respecte la couverture partielle du simulateur prévoyance actif', () => {
    const coverage = getCoverageForSimulator('prevoyance' as SimulatorId);

    expect(coverage.chapterId).toBe('prevoyance');
    expect(coverage.expectedStatus).toBe('partiel');
  });
});
