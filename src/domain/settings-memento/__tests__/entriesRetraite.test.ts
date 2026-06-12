import { describe, expect, it } from 'vitest';

import { LEGAL_REFERENCES } from '@/domain/legal-references';
import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — retraite obligatoire', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const R6_EXPECTED_STATUSES = {
    'retraite.globale': 'planned',
    'retraite.regime-general': 'partiel',
    'retraite.agirc-arrco': 'partiel',
    'retraite.dirigeant-assimile-salarie': 'planned',
    'retraite.ssi-artisan-commercant': 'partiel',
    'retraite.cnavpl-professions-liberales': 'partiel',
    'retraite.caisses-sante-liberales': 'a_verifier',
    'retraite.cipav': 'partiel',
    'retraite.msa': 'partiel',
    'retraite.autres-caisses-liberales': 'a_verifier',
  } as const;
  const R6_KEYS = Object.keys(R6_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof R6_EXPECTED_STATUSES
  >;
  const R6_REF_IDS = [
    'assurance-retraite-age-taux-plein',
    'agirc-arrco-points-retraite',
    'entreprendre-service-public-retraite-ei',
    'urssaf-independant-droits-retraite',
    'cnavpl-retraite-liberaux',
    'lacipav-affiliation-retraite',
    'msa-retraite',
  ] as const;

  it('déclare les dix entrées du lot retraite obligatoire avec leurs statuts attendus', () => {
    for (const key of R6_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.status, key).toBe(R6_EXPECTED_STATUSES[key]);
      expect(entry!.chapterId, key).toBe('retraite');
    }
  });

  it('rattache toutes les entrées retraite obligatoire à Prélèvements', () => {
    for (const key of R6_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry!.ownerPagePath, key).toBe('/settings/prelevements');
    }
  });

  it('conserve retraite globale en planned malgré les settings transverses existants', () => {
    const entry = entryByKey.get('retraite.globale');

    expect(entry!.status).toBe('planned');
    expect(entry!.registryKeys).toEqual([
      'retraite-prevoyance.ps-retraite',
      'retraite-prevoyance.seuils-rfr',
      'retraite-prevoyance.pass',
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
    ]);
    expect(entry!.claimKeys).toEqual([
      'retirement-current-brackets',
      'retirement-thresholds-current',
      'pass-latest',
    ]);
    expect(entry!.relatedSimulatorIds).toEqual(['retraite']);
  });

  it('garde le régime général sur le PASS sans embarquer les PS retraite de sortie', () => {
    const entry = entryByKey.get('retraite.regime-general');

    expect(entry!.registryKeys).toEqual(['retraite-prevoyance.pass']);
    expect(entry!.claimKeys).toEqual(['pass-latest']);
  });

  it('aligne les claims retraite existants sur la page Prélèvements', () => {
    const bindingsByClaimKey = new Map(
      SETTINGS_REFERENCE_CHAIN.map((binding) => [binding.claimKey, binding]),
    );

    for (const claimKey of [
      'retirement-current-brackets',
      'retirement-thresholds-current',
      'pass-latest',
    ] as const) {
      const binding = bindingsByClaimKey.get(claimKey);

      expect(binding, `claim inconnu ${claimKey}`).toBeDefined();
      expect(binding!.pagePath).toBe('/settings/prelevements');
    }
  });

  it('verrouille les références officielles qualifiées par régime', () => {
    expect(entryByKey.get('retraite.regime-general')!.refIds).toEqual([
      'assurance-retraite-age-taux-plein',
    ]);
    expect(entryByKey.get('retraite.agirc-arrco')!.refIds).toEqual(['agirc-arrco-points-retraite']);
    expect(entryByKey.get('retraite.ssi-artisan-commercant')!.refIds).toEqual([
      'entreprendre-service-public-retraite-ei',
      'urssaf-independant-droits-retraite',
    ]);
    expect(entryByKey.get('retraite.cnavpl-professions-liberales')!.refIds).toEqual([
      'cnavpl-retraite-liberaux',
      'entreprendre-service-public-retraite-ei',
    ]);
    expect(entryByKey.get('retraite.cipav')!.refIds).toEqual(['lacipav-affiliation-retraite']);
    expect(entryByKey.get('retraite.msa')!.refIds).toEqual(['msa-retraite']);
  });

  it('n’attache pas les sources R6 au simulateur retraite tant que son lifecycle reste planned', () => {
    const referencesById = new Map(LEGAL_REFERENCES.map((reference) => [reference.id, reference]));

    for (const refId of R6_REF_IDS) {
      expect(referencesById.get(refId)?.relatedSimulatorIds ?? [], refId).toEqual([]);
      expect(referencesById.get(refId)?.relatedSettings, refId).toEqual(['prelevements']);
    }
  });

  it('garde les caisses non qualifiées en a_verifier sans source affichée', () => {
    for (const key of [
      'retraite.caisses-sante-liberales',
      'retraite.autres-caisses-liberales',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.status, key).toBe('a_verifier');
      expect(entry!.claimKeys, key).toEqual([]);
      expect(entry!.refIds, key).toEqual([]);
    }
  });

  it('ne marque aucun sujet retraite obligatoire comme couvert ou bloqué', () => {
    for (const key of R6_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry!.status, key).not.toBe('couvert');
      expect(entry!.status, key).not.toBe('blocked_missing_official_source');
    }
  });

  it('respecte la couverture planned du simulateur retraite', () => {
    const coverage = getCoverageForSimulator('retraite' as SimulatorId);

    expect(coverage.chapterId).toBe('retraite');
    expect(coverage.expectedStatus).toBe('planned');
  });
});
