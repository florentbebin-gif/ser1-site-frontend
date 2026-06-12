import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import type { SimulatorId } from '@/domain/simulators/registry';

import { MEMENTO_ENTRIES, getCoverageForSimulator } from '../index';

describe('settings-memento — dirigeant et social', () => {
  const entryByKey = new Map(MEMENTO_ENTRIES.map((entry) => [entry.key, entry]));
  const R5_EXPECTED_STATUSES = {
    'dirigeant.dividendes-tns': 'partiel',
    'dirigeant.remuneration': 'planned',
    'dirigeant.charges-sociales-assimile-salarie': 'planned',
    'dirigeant.charges-sociales-tns': 'partiel',
    'dirigeant.charges-sociales-liberales': 'planned',
    'dirigeant.puma-csm': 'planned',
    'dirigeant.micro-social': 'absent',
    'dirigeant.sortie-capitaux': 'partiel',
    'dirigeant.prevoyance': 'planned',
  } as const;
  const R5_KEYS = Object.keys(R5_EXPECTED_STATUSES) as ReadonlyArray<
    keyof typeof R5_EXPECTED_STATUSES
  >;

  it('déclare les neuf entrées du lot dirigeant/social avec leurs statuts attendus', () => {
    for (const key of R5_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry, `entrée manquante : ${key}`).toBeDefined();
      expect(entry!.status, key).toBe(R5_EXPECTED_STATUSES[key]);
    }
  });

  it('rattache les sujets sociaux au mémento et la prévoyance à sa page dédiée', () => {
    for (const key of R5_KEYS) {
      const entry = entryByKey.get(key);
      const expectedOwner =
        key === 'dirigeant.prevoyance'
          ? '/settings/memento'
          : key === 'dirigeant.micro-social'
            ? null
            : '/settings/memento';

      expect(entry!.ownerPagePath, key).toBe(expectedOwner);
    }
  });

  it('garde le claim social dirigeant aligné avec le mémento', () => {
    const binding = SETTINGS_REFERENCE_CHAIN.find(
      (item) => item.claimKey === 'social-dirigeant-dividendes-tns',
    );

    expect(binding).toBeDefined();
    expect(binding!.pagePath).toBe('/settings/memento');

    for (const key of [
      'dirigeant.dividendes-tns',
      'dirigeant.charges-sociales-tns',
      'dirigeant.sortie-capitaux',
    ] as const) {
      const entry = entryByKey.get(key);

      expect(entry!.claimKeys).toEqual(['social-dirigeant-dividendes-tns']);
      expect(entry!.refIds).toContain('urssaf-dividendes-tns-cotisations-sociales');
      expect(entry!.refIds).toContain('css-l131-6');
    }
  });

  it('qualifie seulement les sources sociales déjà vérifiées', () => {
    expect(entryByKey.get('dirigeant.remuneration')!.refIds).toEqual([
      'css-l311-3',
      'cgi-231',
      'urssaf-assimile-salarie-dirigeant',
      'boss-assiette-generale',
    ]);
    expect(entryByKey.get('dirigeant.charges-sociales-assimile-salarie')!.refIds).toEqual([
      'css-l311-3',
      'cgi-231',
      'urssaf-assimile-salarie-dirigeant',
      'boss-assiette-generale',
    ]);
    expect(entryByKey.get('dirigeant.puma-csm')!.refIds).toEqual([
      'service-public-puma',
      'css-l380-2',
    ]);
    expect(entryByKey.get('dirigeant.charges-sociales-tns')!.refIds).toEqual(
      expect.arrayContaining([
        'urssaf-cotisations-independants',
        'urssaf-taux-cotisations-ac-plnr',
        'css-l131-6',
      ]),
    );
  });

  it('garde le micro-social hors cible sans propriétaire ni source', () => {
    const entry = entryByKey.get('dirigeant.micro-social');

    expect(entry!.status).toBe('absent');
    expect(entry!.ownerPagePath).toBeNull();
    expect(entry!.registryKeys).toEqual([]);
    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual([]);
    expect(entry!.relatedSimulatorIds).toEqual([]);
    expect(entry!.statusReason).toContain('Hors cible initiale');
  });

  it('garde les régimes libéraux sans moteur malgré les sources URSSAF transverses', () => {
    const entry = entryByKey.get('dirigeant.charges-sociales-liberales');

    expect(entry!.status).toBe('planned');
    expect(entry!.claimKeys).toEqual([]);
    expect(entry!.refIds).toEqual([
      'urssaf-cotisations-independants',
      'urssaf-taux-cotisations-ac-plnr',
    ]);
    expect(entry!.statusReason).toContain('sans modèle social par caisse');
  });

  it('ne marque aucun sujet dirigeant/social comme couvert ou bloqué', () => {
    for (const key of R5_KEYS) {
      const entry = entryByKey.get(key);

      expect(entry!.status, key).not.toBe('couvert');
      expect(entry!.status, key).not.toBe('blocked_missing_official_source');
    }
  });

  it('respecte la couverture dirigeant des simulateurs planned', () => {
    for (const simulatorId of ['remuneration', 'sortie-capitaux'] as const) {
      const coverage = getCoverageForSimulator(simulatorId as SimulatorId);

      expect(coverage.chapterId).toBe('dirigeant');
      expect(coverage.expectedStatus).toBe('planned');
    }
  });

  it('garde la prévoyance dirigeant ROADMAP-only sans faux lien simulateur', () => {
    const entry = entryByKey.get('dirigeant.prevoyance');

    expect(entry!.relatedSimulatorIds).toEqual([]);
    expect(entry!.registryKeys).toEqual(['retraite-prevoyance.prevoyance-garanties']);
    expect(entry!.refIds).toEqual(['boss-protection-sociale-complementaire', 'css-l911-1']);
  });
});
