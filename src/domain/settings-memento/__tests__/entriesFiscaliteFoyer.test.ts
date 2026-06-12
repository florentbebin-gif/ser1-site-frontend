import { describe, expect, it } from 'vitest';

import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — fiscalité foyer', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const FISCALITE_FOYER_KEYS = [
    'fiscalite-foyer.ir',
    'fiscalite-foyer.niches-fiscales',
    'fiscalite-foyer.ifi',
    'fiscalite-foyer.non-residents',
  ] as const;

  it('déclare les quatre entrées fiscalité foyer avec leurs statuts attendus', () => {
    expect(entryByKey.get('fiscalite-foyer.ir')?.status).toBe('couvert');
    expect(entryByKey.get('fiscalite-foyer.niches-fiscales')?.status).toBe('partiel');
    expect(entryByKey.get('fiscalite-foyer.ifi')?.status).toBe('partiel');
    expect(entryByKey.get('fiscalite-foyer.non-residents')?.status).toBe('partiel');
  });

  it('distingue le plafonnement global des niches du PFU', () => {
    const entry = entryByKey.get('fiscalite-foyer.niches-fiscales');

    expect(entry!.refIds).toContain('cgi-200-0-a');
    expect(entry!.refIds).not.toContain('cgi-200-a');
  });

  it('rattache la valorisation du démembrement à l’entrée IFI par la référence commune', () => {
    const entry = entryByKey.get('fiscalite-foyer.ifi');

    expect(entry!.refIds).toContain('cgi-669');
    expect(entry!.refIds).toEqual(expect.arrayContaining(['cgi-972', 'cgi-974', 'cgi-979']));
  });

  it('rattache les non-résidents aux sources fiscales qualifiées sans claim settings', () => {
    const entry = entryByKey.get('fiscalite-foyer.non-residents');

    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual(['cgi-197-a', 'cgi-182-a', 'cgi-187', 'cgi-964']);
    expect(entry!.relatedSimulatorIds).toEqual(['ifi']);
    expect(entry!.statusReason).toContain('conventions fiscales');
  });

  it('rattache chaque entrée fiscalité foyer à la page propriétaire mémento', () => {
    for (const key of FISCALITE_FOYER_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry).toBeDefined();
      expect(entry!.ownerPagePath).toBe('/settings/memento');
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
