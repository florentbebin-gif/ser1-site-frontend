import { describe, expect, it } from 'vitest';

import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — placements et enveloppes', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const PLACEMENTS_KEYS = [
    'placements.allocation',
    'placements.assurance-vie-capitalisation',
    'placements.enveloppes-titres',
    'immobilier.scpi',
  ] as const;

  it('déclare les quatre entrées placements avec leurs statuts attendus', () => {
    expect(entryByKey.get('placements.allocation')?.status).toBe('couvert');
    expect(entryByKey.get('placements.assurance-vie-capitalisation')?.status).toBe('partiel');
    expect(entryByKey.get('placements.enveloppes-titres')?.status).toBe('partiel');
    expect(entryByKey.get('immobilier.scpi')?.status).toBe('partiel');
  });

  it('rattache chaque entrée placements au catalogue Base-Contrat comme page propriétaire', () => {
    for (const key of PLACEMENTS_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      expect(entry!.ownerPagePath).toBe('/settings/base-contrat');
    }
  });

  it('justifie le statut couvert allocation par des claims settings et le simulateur actif', () => {
    const entry = entryByKey.get('placements.allocation');

    expect(entry!.claimKeys.length).toBeGreaterThan(0);
    expect(entry!.refIds.length).toBeGreaterThan(0);
    expect(entry!.relatedSimulatorIds).toEqual(['placement']);
  });

  it('réutilise des claims Base-Contrat existants sur chaque sous-type d’enveloppe', () => {
    for (const key of [
      'placements.assurance-vie-capitalisation',
      'placements.enveloppes-titres',
      'immobilier.scpi',
    ] as const) {
      const entry = entryByKey.get(key);
      const baseContratClaims = entry!.claimKeys.filter((claimKey) =>
        claimKey.startsWith('base-contrat-'),
      );

      expect(baseContratClaims.length).toBeGreaterThan(0);
    }
  });

  it('garde des sources qualifiées sur les entrées partiel liées au registry', () => {
    for (const key of ['placements.assurance-vie-capitalisation', 'immobilier.scpi'] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.registryKeys.length).toBeGreaterThan(0);
      expect(entry!.claimKeys.length + entry!.refIds.length).toBeGreaterThan(0);
    }
  });

  it('aligne chaque entrée placements sur le chapitre couvert par son simulateur', () => {
    for (const key of PLACEMENTS_KEYS) {
      const entry = entryByKey.get(key);

      for (const simulatorId of entry!.relatedSimulatorIds) {
        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId).toBe(entry!.chapterId);
      }
    }
  });

  it('garde SCPI en couverture documentaire sans activer le simulateur planifié', () => {
    const entry = entryByKey.get('immobilier.scpi');

    expect(entry!.status).not.toBe('couvert');
    expect(entry!.relatedSimulatorIds).toEqual(['scpi']);
    expect(entry!.registryKeys).toEqual(['immobilier.scpi.regime']);
  });
});
