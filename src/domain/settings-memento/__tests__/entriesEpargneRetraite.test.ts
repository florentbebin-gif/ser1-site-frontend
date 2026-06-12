import { describe, expect, it } from 'vitest';

import {
  ARTICLE_83_PERO_CLAIMS,
  EPARGNE_SALARIALE_RETRAITE_CLAIMS,
  FISCALITE_SORTIE_RETRAITE_CLAIMS,
  MADELIN_RETRAITE_CLAIMS,
  MEMENTO_ENTRIES,
  PER_INDIVIDUEL_CLAIMS,
  getCoverageForSimulator,
} from '../index';

describe('settings-memento — épargne retraite', () => {
  const entryByKey = new Map<string, (typeof MEMENTO_ENTRIES)[number]>(
    MEMENTO_ENTRIES.map((entry) => [entry.key, entry]),
  );
  const EXPECTED_STATUSES = {
    'epargne-retraite.base-cg-retraite': 'partiel',
    'epargne-retraite.per-individuel': 'couvert',
    'epargne-retraite.per-potentiel': 'couvert',
    'epargne-retraite.per-transfert': 'couvert',
    'epargne-retraite.article-83-pero': 'partiel',
    'epargne-retraite.madelin': 'partiel',
    'epargne-retraite.epargne-salariale-retraite': 'partiel',
    'epargne-retraite.fiscalite-sortie-retraite': 'partiel',
  } as const;

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

  it('déclare les statuts R8 attendus du chapitre épargne retraite', () => {
    for (const [key, status] of Object.entries(EXPECTED_STATUSES)) {
      expect(entryByKey.get(key)?.status).toBe(status);
    }
  });

  it('détaille les simulateurs PER couverts par des entrées sourcées', () => {
    expect(getCoverageForSimulator('per').expectedStatus).toBe('couvert');
    expect(getCoverageForSimulator('per-potentiel').expectedStatus).toBe('couvert');
    expect(getCoverageForSimulator('per-transfert').expectedStatus).toBe('couvert');

    for (const simulatorId of ['per', 'per-potentiel', 'per-transfert']) {
      const coveringEntries = [...entryByKey.values()].filter(
        (entry) =>
          entry.status === 'couvert' &&
          (entry.relatedSimulatorIds as readonly string[]).includes(simulatorId) &&
          (entry.refIds.length > 0 || entry.claimKeys.length > 0),
      );

      expect(coveringEntries.map((entry) => entry.key)).toEqual(
        expect.arrayContaining([expect.stringMatching(/^epargne-retraite\./)]),
      );
    }
  });

  it('rattache les claimKeys Base-Contrat et fiscalité retraite exacts', () => {
    expect(entryByKey.get('epargne-retraite.per-individuel')?.claimKeys).toEqual(
      PER_INDIVIDUEL_CLAIMS,
    );
    expect(entryByKey.get('epargne-retraite.article-83-pero')?.claimKeys).toEqual(
      ARTICLE_83_PERO_CLAIMS,
    );
    expect(entryByKey.get('epargne-retraite.madelin')?.claimKeys).toEqual(MADELIN_RETRAITE_CLAIMS);
    expect(entryByKey.get('epargne-retraite.epargne-salariale-retraite')?.claimKeys).toEqual(
      EPARGNE_SALARIALE_RETRAITE_CLAIMS,
    );
    expect(entryByKey.get('epargne-retraite.fiscalite-sortie-retraite')?.claimKeys).toEqual(
      FISCALITE_SORTIE_RETRAITE_CLAIMS,
    );
  });

  it('conserve la fiscalité de sortie comme doctrine sourcée sans moteur fiscal séparé', () => {
    const entry = entryByKey.get('epargne-retraite.fiscalite-sortie-retraite');

    expect(entry).toBeDefined();
    expect(entry!.ownerPagePath).toBe('/settings/prelevements');
    expect(entry!.registryKeys).toEqual([
      'impots.ir.abattements-et-decote',
      'retraite-prevoyance.ps-retraite',
      'retraite-prevoyance.seuils-rfr',
    ]);
    expect(entry!.claimKeys).toEqual(
      expect.arrayContaining([
        'abat10-pensions-current',
        'retirement-thresholds-current',
        'retirement-current-brackets',
      ]),
    );
  });

  it('ne laisse aucun bloc R8 en source officielle manquante', () => {
    for (const key of Object.keys(EXPECTED_STATUSES)) {
      expect(entryByKey.get(key)?.status).not.toBe('blocked_missing_official_source');
    }
  });
});
