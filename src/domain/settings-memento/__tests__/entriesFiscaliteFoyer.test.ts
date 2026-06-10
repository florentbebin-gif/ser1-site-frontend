import { describe, expect, it } from 'vitest';

import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — fiscalité foyer', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const FISCALITE_FOYER_KEYS = [
    'fiscalite-foyer.ir',
    'fiscalite-foyer.niches-fiscales',
    'fiscalite-foyer.ifi',
    'immobilier.revenus-fonciers',
    'immobilier.lmnp-lmp',
    'immobilier.pv-immobilieres',
  ] as const;

  it('déclare les six entrées fiscalité foyer avec leurs statuts attendus', () => {
    expect(entryByKey.get('fiscalite-foyer.ir')?.status).toBe('couvert');
    expect(entryByKey.get('fiscalite-foyer.niches-fiscales')?.status).toBe('partiel');
    expect(entryByKey.get('fiscalite-foyer.ifi')?.status).toBe('partiel');
    expect(entryByKey.get('immobilier.revenus-fonciers')?.status).toBe('planned');
    expect(entryByKey.get('immobilier.lmnp-lmp')?.status).toBe('planned');
    expect(entryByKey.get('immobilier.pv-immobilieres')?.status).toBe('planned');
  });

  it('rattache chaque entrée fiscalité foyer à la page propriétaire Impôts', () => {
    for (const key of FISCALITE_FOYER_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      expect(entry!.ownerPagePath).toBe('/settings/impots');
    }
  });

  it('justifie le statut couvert IR par des claims settings et un simulateur actif', () => {
    const entry = entryByKey.get('fiscalite-foyer.ir');

    expect(entry!.claimKeys.length).toBeGreaterThan(0);
    expect(entry!.registryKeys.length).toBeGreaterThan(0);
    expect(entry!.relatedSimulatorIds).toEqual(['ir']);
  });

  it('garde des sources qualifiées sur les entrées partiel liées au registry', () => {
    for (const key of ['fiscalite-foyer.ifi'] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.registryKeys.length).toBeGreaterThan(0);
      expect(entry!.claimKeys.length + entry!.refIds.length).toBeGreaterThan(0);
    }
  });

  it('aligne chaque entrée fiscalité foyer sur le chapitre couvert par son simulateur', () => {
    for (const key of FISCALITE_FOYER_KEYS) {
      const entry = entryByKey.get(key);

      for (const simulatorId of entry!.relatedSimulatorIds) {
        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId).toBe(entry!.chapterId);
      }
    }
  });
});
