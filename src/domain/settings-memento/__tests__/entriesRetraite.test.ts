import { describe, expect, it } from 'vitest';

import { LEGAL_REFERENCES } from '@/domain/legal-references';
import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — retraite obligatoire', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const RETRAITE_EXPECTED_STATUSES = {
    'retraite.globale': 'planned',
    'retraite.regime-general': 'partiel',
    'retraite.dispositifs-depart': 'partiel',
    'retraite.decote-surcote': 'partiel',
    'retraite.reversion': 'partiel',
    'retraite.agirc-arrco': 'partiel',
    'retraite.dirigeant-assimile-salarie': 'planned',
    'retraite.ssi-artisan-commercant': 'partiel',
    'retraite.cnavpl-professions-liberales': 'partiel',
    'retraite.caisses-sante-liberales': 'partiel',
    'retraite.cipav': 'partiel',
    'retraite.msa': 'partiel',
    'retraite.autres-caisses-liberales': 'partiel',
    'retraite.fonction-publique': 'planned',
  } as const;
  const RETRAITE_KEYS = Object.keys(RETRAITE_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof RETRAITE_EXPECTED_STATUSES
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
  const R7_RETIREMENT_REF_IDS = [
    'css-l351-1-l351-17',
    'css-l161-22',
    'css-l353-1',
    'assurance-retraite-carriere-longue',
    'assurance-retraite-retraite-progressive',
    'assurance-retraite-cumul-emploi-retraite',
    'assurance-retraite-pension-reversion',
  ] as const;
  const S4_RETIREMENT_REF_IDS = [
    'css-l351-3',
    'css-l633-1',
    'css-l635-1',
    'css-l641-1',
    'css-l643-1',
    'css-d643-1',
    'carmf-retraite',
    'carcdsf-regimes-retraite',
    'carpimko-retraite',
    'cavp-retraite',
    'carpv-statuts-retraite-prevoyance',
    'cavec-retraite-complementaire',
    'cavamac-retraite',
    'cnbf-institution-retraite-prevoyance',
    'cprn-affiliation-obligatoire',
    'cavom-retraite',
    'code-pensions-civiles-militaires-l24',
    'service-public-retraite-agent-public',
    'service-public-rafp',
    'service-public-ircantec-contractuel',
  ] as const;

  it('déclare les quatorze entrées retraite R6/R7/S4 avec leurs statuts attendus', () => {
    for (const key of RETRAITE_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.status, key).toBe(RETRAITE_EXPECTED_STATUSES[key]);
      expect(entry!.chapterId, key).toBe('retraite');
    }
  });

  it('rattache toutes les entrées retraite au mémento', () => {
    for (const key of RETRAITE_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry!.ownerPagePath, key).toBe('/settings/memento');
    }
  });

  it('trace la fonction publique comme sujet planifié sans promettre de couverture active', () => {
    const entry = entryByKey.get('retraite.fonction-publique');

    expect(entry).toBeDefined();
    expect(entry!.chapterId).toBe('retraite');
    expect(entry!.status).toBe('planned');
    expect(entry!.ownerPagePath).toBe('/settings/memento');
    expect(entry!.registryKeys).toEqual([]);
    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual([
      'code-pensions-civiles-militaires-l24',
      'service-public-retraite-agent-public',
      'service-public-rafp',
      'service-public-ircantec-contractuel',
    ]);
    expect(entry!.relatedSimulatorIds).toEqual(['retraite']);
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

  it('aligne les claims retraite existants sur le mémento', () => {
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
      expect(binding!.pagePath).toBe('/settings/memento');
    }
  });

  it('verrouille les références officielles qualifiées par régime', () => {
    expect(entryByKey.get('retraite.regime-general')!.refIds).toEqual([
      'assurance-retraite-age-taux-plein',
      'css-l351-3',
    ]);
    expect(entryByKey.get('retraite.dispositifs-depart')!.refIds).toEqual([
      'css-l351-1-l351-17',
      'css-l161-22',
      'assurance-retraite-carriere-longue',
      'assurance-retraite-retraite-progressive',
      'assurance-retraite-cumul-emploi-retraite',
    ]);
    expect(entryByKey.get('retraite.decote-surcote')!.refIds).toEqual([
      'assurance-retraite-age-taux-plein',
      'css-l351-1-l351-17',
    ]);
    expect(entryByKey.get('retraite.reversion')!.refIds).toEqual([
      'css-l353-1',
      'assurance-retraite-pension-reversion',
    ]);
    expect(entryByKey.get('retraite.agirc-arrco')!.refIds).toEqual(['agirc-arrco-points-retraite']);
    expect(entryByKey.get('retraite.ssi-artisan-commercant')!.refIds).toEqual([
      'entreprendre-service-public-retraite-ei',
      'urssaf-independant-droits-retraite',
      'css-l633-1',
      'css-l635-1',
    ]);
    expect(entryByKey.get('retraite.cnavpl-professions-liberales')!.refIds).toEqual([
      'cnavpl-retraite-liberaux',
      'entreprendre-service-public-retraite-ei',
      'css-l641-1',
      'css-l643-1',
      'css-d643-1',
    ]);
    expect(entryByKey.get('retraite.caisses-sante-liberales')!.refIds).toEqual([
      'carmf-retraite',
      'carcdsf-regimes-retraite',
      'carpimko-retraite',
      'cavp-retraite',
      'carpv-statuts-retraite-prevoyance',
    ]);
    expect(entryByKey.get('retraite.cipav')!.refIds).toEqual(['lacipav-affiliation-retraite']);
    expect(entryByKey.get('retraite.msa')!.refIds).toEqual(['msa-retraite']);
    expect(entryByKey.get('retraite.autres-caisses-liberales')!.refIds).toEqual([
      'cavec-retraite-complementaire',
      'cavamac-retraite',
      'cnbf-institution-retraite-prevoyance',
      'cprn-affiliation-obligatoire',
      'cavom-retraite',
    ]);
  });

  it('n’attache pas les sources R6 au simulateur retraite tant que son lifecycle reste planned', () => {
    const referencesById = new Map(LEGAL_REFERENCES.map((reference) => [reference.id, reference]));

    for (const refId of R6_REF_IDS) {
      expect(referencesById.get(refId)?.relatedSimulatorIds ?? [], refId).toEqual([]);
      expect(referencesById.get(refId)?.relatedSettings, refId).toEqual(['prelevements']);
    }
  });

  it('n’attache pas les sources R7 retraite au simulateur retraite tant que son lifecycle reste planned', () => {
    const referencesById = new Map(LEGAL_REFERENCES.map((reference) => [reference.id, reference]));

    for (const refId of R7_RETIREMENT_REF_IDS) {
      expect(referencesById.get(refId)?.relatedSimulatorIds ?? [], refId).toEqual([]);
      expect(referencesById.get(refId)?.relatedSettings, refId).toEqual(['prelevements']);
    }
  });

  it('n’attache pas les sources S4 retraite au simulateur retraite tant que son lifecycle reste planned', () => {
    const referencesById = new Map(LEGAL_REFERENCES.map((reference) => [reference.id, reference]));

    for (const refId of S4_RETIREMENT_REF_IDS) {
      expect(referencesById.get(refId)?.relatedSimulatorIds ?? [], refId).toEqual([]);
      expect(referencesById.get(refId)?.relatedSettings, refId).toEqual(['prelevements']);
    }
  });

  it('garde les caisses libérales en partiel sans moteur de liquidation dédié', () => {
    for (const key of [
      'retraite.caisses-sante-liberales',
      'retraite.autres-caisses-liberales',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.status, key).toBe('partiel');
      expect(entry!.claimKeys, key).toEqual([]);
      expect(entry!.refIds.length, key).toBeGreaterThan(0);
      expect(entry!.statusReason, key).toContain('aucun');
    }
  });

  it('ne marque aucun sujet retraite obligatoire comme couvert ou bloqué', () => {
    for (const key of RETRAITE_KEYS) {
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
