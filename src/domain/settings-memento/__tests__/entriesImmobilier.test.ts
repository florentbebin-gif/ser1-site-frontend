import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — immobilier et arbitrage', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const R2_EXPECTED_STATUSES = {
    'immobilier.credit': 'couvert',
    'immobilier.revenus-fonciers': 'planned',
    'immobilier.lmnp-lmp': 'planned',
    'immobilier.pv-immobilieres': 'planned',
    'immobilier.scpi': 'partiel',
    'immobilier.investissement-locatif': 'planned',
    'immobilier.dispositifs-fiscaux': 'partiel',
    'immobilier.sci': 'planned',
    'immobilier.non-residents': 'a_verifier',
    'arbitrage.vendre-conserver-reemployer': 'planned',
  } as const;
  const R2_KEYS = Object.keys(R2_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof R2_EXPECTED_STATUSES
  >;

  it('déclare les dix entrées du lot immobilier avec leurs statuts attendus', () => {
    for (const key of R2_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.status, key).toBe(R2_EXPECTED_STATUSES[key]);
    }
  });

  it('aligne chaque claim sur la page propriétaire de son entrée', () => {
    const bindingsByClaimKey = new Map(
      SETTINGS_REFERENCE_CHAIN.map((binding) => [binding.claimKey, binding]),
    );

    for (const key of R2_KEYS) {
      const entry = entryByKey.get(key);

      for (const claimKey of entry!.claimKeys) {
        const binding = bindingsByClaimKey.get(claimKey);

        expect(binding, `${key}: claim inconnu ${claimKey}`).toBeDefined();
        expect(binding!.pagePath, `${key}: ${claimKey}`).toBe(entry!.ownerPagePath);
      }
    }
  });

  it('justifie le statut couvert crédit par des références officielles et le simulateur actif', () => {
    const entry = entryByKey.get('immobilier.credit');

    expect(entry!.refIds.length).toBeGreaterThan(0);
    expect(entry!.relatedSimulatorIds).toEqual(['credit']);
  });

  it('réutilise des claims Base-Contrat existants sur les entrées adossées au catalogue', () => {
    for (const key of ['immobilier.scpi', 'immobilier.dispositifs-fiscaux'] as const) {
      const entry = entryByKey.get(key);
      const baseContratClaims = entry!.claimKeys.filter((claimKey) =>
        claimKey.startsWith('base-contrat-'),
      );

      expect(baseContratClaims.length, key).toBeGreaterThan(0);
    }
  });

  it('garde des sources qualifiées sur les entrées liées au registry settings', () => {
    for (const key of [
      'immobilier.revenus-fonciers',
      'immobilier.lmnp-lmp',
      'immobilier.pv-immobilieres',
      'immobilier.scpi',
      'immobilier.investissement-locatif',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.registryKeys.length, key).toBeGreaterThan(0);
      expect(entry!.claimKeys.length + entry!.refIds.length, key).toBeGreaterThan(0);
    }
  });

  it('rattache l’intégralité des dispositifs fiscaux immobiliers du catalogue Base-Contrat', () => {
    const DISPOSITIF_SECTION_KEY = 'dispositifs-fiscaux-immobilier';
    const dispositifClaimKeys = new Set(
      SETTINGS_REFERENCE_CHAIN.filter(
        (binding) => binding.sectionKey === DISPOSITIF_SECTION_KEY,
      ).map((binding) => binding.claimKey),
    );
    const entry = entryByKey.get('immobilier.dispositifs-fiscaux');

    expect(dispositifClaimKeys.size).toBe(30);
    expect(entry!.claimKeys).toHaveLength(dispositifClaimKeys.size);
    for (const claimKey of entry!.claimKeys) {
      expect(
        dispositifClaimKeys.has(claimKey),
        `claim hors section dispositifs : ${claimKey}`,
      ).toBe(true);
    }
  });

  it('couvre les deux audiences de détention SCPI sans activer le simulateur', () => {
    const entry = entryByKey.get('immobilier.scpi');
    const hasPp = entry!.claimKeys.some((claimKey) => claimKey.includes('-scpi-pp-'));
    const hasPm = entry!.claimKeys.some((claimKey) => claimKey.includes('-scpi-pm-'));

    expect(entry!.status).toBe('partiel');
    expect(entry!.refIds).toContain('base-source-art-28-cgi-revenus-fonciers');
    expect(hasPp, 'claims SCPI personne physique manquants').toBe(true);
    expect(hasPm, 'claims SCPI personne morale manquants').toBe(true);
    expect(entry!.relatedSimulatorIds).toEqual(['scpi']);
    expect(entry!.registryKeys).toEqual(['immobilier.scpi.regime']);
  });

  it('garde le périmètre non-résidents en attente de qualification sans source affichée', () => {
    const entry = entryByKey.get('immobilier.non-residents');

    expect(entry!.status).toBe('a_verifier');
    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual([]);
  });

  it('rattache la SCI à sa référence civile de détention de parts', () => {
    const entry = entryByKey.get('immobilier.sci');

    expect(entry!.refIds).toContain('code-civil-1075');
  });

  it('aligne chaque entrée du lot sur le chapitre couvert par son simulateur', () => {
    for (const key of R2_KEYS) {
      const entry = entryByKey.get(key);

      for (const simulatorId of entry!.relatedSimulatorIds) {
        const coverage = getCoverageForSimulator(simulatorId as SimulatorId);
        expect(coverage.chapterId, key).toBe(entry!.chapterId);
      }
    }
  });
});
