import { describe, expect, it } from 'vitest';

import {
  SIMULATOR_DEFINITIONS,
  SIMULATOR_REGISTRY,
  type SimulatorId,
} from '@/domain/simulators/registry';
import type { SimulatorDefinition } from '@/domain/simulators/types';

import { MEMENTO_CHAPTERS } from '../chapters';
import {
  ROADMAP_ONLY_SIMULATOR_IDS,
  SIMULATOR_MEMENTO_COVERAGE,
  getCoverageForSimulator,
  listCoverageForChapter,
  validateSimulatorMementoCoverage,
  type RoadmapOnlySimulatorId,
  type SimulatorCoverageEntry,
  type SimulatorCoverageTarget,
} from '../simulatorCoverage';

const EXPECTED_ROADMAP_ONLY_IDS = [
  'obo',
  'fiscalite-societe',
  'prevoyance-dirigeant',
  'donation-demembrement-societe',
  'succession-liquidite-societe',
] as const;

const EXPECTED_SUBTYPE_TARGETS = [
  'placement:Assurance-vie / capitalisation',
  'placement:PEA',
  'placement:CTO',
  'tresorerie-societe:Placement trésorerie intégré',
  'tresorerie-societe:CCA',
  'tresorerie-societe:Filiales',
  'tresorerie-societe:Emprunts société',
] as const;

type RegistryCoverageEntry = Omit<SimulatorCoverageEntry, 'target'> & {
  target: Extract<SimulatorCoverageTarget, { kind: 'registry' }>;
};

type SubtypeCoverageEntry = Omit<SimulatorCoverageEntry, 'target'> & {
  target: Extract<SimulatorCoverageTarget, { kind: 'subtype' }>;
};

type RoadmapOnlyCoverageEntry = Omit<SimulatorCoverageEntry, 'target'> & {
  target: Extract<SimulatorCoverageTarget, { kind: 'roadmap-only' }>;
};

const isRegistryCoverageEntry = (entry: SimulatorCoverageEntry): entry is RegistryCoverageEntry =>
  entry.target.kind === 'registry';

const isSubtypeCoverageEntry = (entry: SimulatorCoverageEntry): entry is SubtypeCoverageEntry =>
  entry.target.kind === 'subtype';

const isRoadmapOnlyCoverageEntry = (
  entry: SimulatorCoverageEntry,
): entry is RoadmapOnlyCoverageEntry => entry.target.kind === 'roadmap-only';

const registryEntries = (coverage: readonly SimulatorCoverageEntry[]) =>
  coverage.filter(isRegistryCoverageEntry);

const subtypeEntries = (coverage: readonly SimulatorCoverageEntry[]) =>
  coverage.filter(isSubtypeCoverageEntry);

const roadmapOnlyEntries = (coverage: readonly SimulatorCoverageEntry[]) =>
  coverage.filter(isRoadmapOnlyCoverageEntry);

const withoutRegistryCoverage = (simulatorId: SimulatorId): readonly SimulatorCoverageEntry[] =>
  SIMULATOR_MEMENTO_COVERAGE.filter(
    (entry) => entry.target.kind !== 'registry' || entry.target.simulatorId !== simulatorId,
  );

const duplicateRegistryCoverage = (simulatorId: SimulatorId): readonly SimulatorCoverageEntry[] => {
  const coverage = getCoverageForSimulator(simulatorId);
  return [...SIMULATOR_MEMENTO_COVERAGE, coverage];
};

const withReplacement = (
  predicate: (entry: SimulatorCoverageEntry) => boolean,
  replacement: SimulatorCoverageEntry,
): readonly SimulatorCoverageEntry[] =>
  SIMULATOR_MEMENTO_COVERAGE.map((entry) => (predicate(entry) ? replacement : entry));

describe('settings-memento simulatorCoverage', () => {
  it('couvre chaque SimulatorDefinition une seule fois sans recopier les routes', () => {
    const registryIds = registryEntries(SIMULATOR_MEMENTO_COVERAGE).map(
      (entry) => entry.target.simulatorId,
    );
    const expectedRegistryIds = SIMULATOR_DEFINITIONS.map((definition) => definition.id);
    const result = validateSimulatorMementoCoverage(SIMULATOR_MEMENTO_COVERAGE);

    expect(registryIds).toHaveLength(SIMULATOR_DEFINITIONS.length);
    expect([...registryIds].sort()).toEqual([...expectedRegistryIds].sort());
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('verrouille les sous-types de la section E contre les labels déclarés par les parents', () => {
    const subtypeTargets = subtypeEntries(SIMULATOR_MEMENTO_COVERAGE).map(
      (entry) => `${entry.target.parentSimulatorId}:${entry.target.subtypeLabel}`,
    );

    expect(subtypeTargets.sort()).toEqual([...EXPECTED_SUBTYPE_TARGETS].sort());

    for (const entry of subtypeEntries(SIMULATOR_MEMENTO_COVERAGE)) {
      const parent = SIMULATOR_DEFINITIONS.find(
        (definition) => definition.id === entry.target.parentSimulatorId,
      );
      expect(parent?.subtypes).toContain(entry.target.subtypeLabel);
    }
  });

  it('verrouille les cinq exceptions ROADMAP-only tant qu’elles ne sont pas en registry', () => {
    const registryIds = new Set(SIMULATOR_DEFINITIONS.map((definition) => definition.id));
    const roadmapOnlyIds = roadmapOnlyEntries(SIMULATOR_MEMENTO_COVERAGE).map(
      (entry) => entry.target.roadmapId,
    );

    expect(ROADMAP_ONLY_SIMULATOR_IDS).toEqual(EXPECTED_ROADMAP_ONLY_IDS);
    expect(roadmapOnlyIds.sort()).toEqual([...EXPECTED_ROADMAP_ONLY_IDS].sort());
    expect(roadmapOnlyIds.filter((roadmapId) => registryIds.has(roadmapId))).toEqual([]);
  });

  it('empêche les lifecycles non prêts de devenir couverts dans le mémento', () => {
    const blockedLifecycleIds = SIMULATOR_REGISTRY.filter((definition) =>
      ['planned', 'internalOnly', 'placeholder'].includes(definition.lifecycle),
    ).map((definition) => definition.id);

    const invalidCoveredIds = blockedLifecycleIds.filter(
      (simulatorId) => getCoverageForSimulator(simulatorId).expectedStatus === 'couvert',
    );

    expect(invalidCoveredIds).toEqual([]);
  });

  it('référence tous les chapitres canoniques depuis la couverture simulateurs', () => {
    const coveredChapterIds = new Set(SIMULATOR_MEMENTO_COVERAGE.map((entry) => entry.chapterId));
    const missingChapterIds = MEMENTO_CHAPTERS.map((chapter) => chapter.id).filter(
      (chapterId) => !coveredChapterIds.has(chapterId),
    );

    expect(missingChapterIds).toEqual([]);
  });

  it('expose les helpers de lecture par chapitre et par simulateur', () => {
    expect(listCoverageForChapter('epargne-retraite').map((entry) => entry.sectionLabel)).toEqual(
      expect.arrayContaining(['PER', 'Potentiel PER', 'Transfert PER']),
    );
    expect(getCoverageForSimulator('ir')).toMatchObject({
      target: { kind: 'registry', simulatorId: 'ir' },
      chapterId: 'fiscalite-foyer',
      expectedStatus: 'couvert',
    });
  });

  it('refuse les mappings incomplets, dupliqués ou désynchronisés', () => {
    const coverageWithoutIr = validateSimulatorMementoCoverage(withoutRegistryCoverage('ir'));
    const coverageWithDuplicateIr = validateSimulatorMementoCoverage(
      duplicateRegistryCoverage('ir'),
    );
    const coverageWithUnknownSubtype = validateSimulatorMementoCoverage(
      withReplacement(
        (entry) =>
          entry.target.kind === 'subtype' &&
          entry.target.parentSimulatorId === 'placement' &&
          entry.target.subtypeLabel === 'PEA',
        {
          target: {
            kind: 'subtype',
            parentSimulatorId: 'placement',
            subtypeLabel: 'PEA non déclaré',
          },
          chapterId: 'placements',
          sectionLabel: 'PEA non déclaré',
          expectedStatus: 'partiel',
        },
      ),
    );
    const coverageWithRoadmapCollision = validateSimulatorMementoCoverage(
      withReplacement(
        (entry) => entry.target.kind === 'roadmap-only' && entry.target.roadmapId === 'obo',
        {
          target: {
            kind: 'roadmap-only',
            roadmapId: 'ir' as RoadmapOnlySimulatorId,
            roadmapLabel: 'Collision IR',
          },
          chapterId: 'societe',
          sectionLabel: 'Collision IR',
          expectedStatus: 'planned',
        },
      ),
    );
    const coverageWithCoveredPlanned = validateSimulatorMementoCoverage(
      withReplacement(
        (entry) => entry.target.kind === 'registry' && entry.target.simulatorId === 'filiation',
        {
          ...getCoverageForSimulator('filiation'),
          expectedStatus: 'couvert',
        },
      ),
    );
    const coverageWithoutChapter = validateSimulatorMementoCoverage(
      SIMULATOR_MEMENTO_COVERAGE.filter((entry) => entry.chapterId !== 'civil'),
    );

    expect(coverageWithoutIr.errors).toContain('Simulateur registry sans couverture : ir.');
    expect(coverageWithDuplicateIr.errors).toContain(
      'Simulateur registry couvert plusieurs fois : ir.',
    );
    expect(coverageWithUnknownSubtype.errors).toContain(
      'placement: sous-type absent de la registry simulateurs (PEA non déclaré).',
    );
    expect(coverageWithRoadmapCollision.errors).toContain(
      'ir: roadmap-only existe déjà dans la registry simulateurs.',
    );
    expect(coverageWithCoveredPlanned.errors).toContain(
      'filiation: lifecycle planned ne peut pas avoir expectedStatus couvert.',
    );
    expect(coverageWithoutChapter.errors).toContain(
      'Chapitre mémento sans couverture simulateur : civil.',
    );
  });

  it('peut être validé avec des catalogues injectés pour les tests', () => {
    const fixtureDefinitions = [
      {
        id: 'fixture-planned',
        lifecycle: 'planned',
        subtypes: ['Sous-type fixture'],
      },
    ] as const satisfies readonly Pick<SimulatorDefinition, 'id' | 'lifecycle' | 'subtypes'>[];
    const fixtureCoverage = [
      {
        target: { kind: 'registry', simulatorId: 'fixture-planned' },
        chapterId: 'foyer',
        sectionLabel: 'Fixture planned',
        expectedStatus: 'planned',
      },
      {
        target: {
          kind: 'subtype',
          parentSimulatorId: 'fixture-planned',
          subtypeLabel: 'Sous-type fixture',
        },
        chapterId: 'foyer',
        sectionLabel: 'Sous-type fixture',
        expectedStatus: 'planned',
      },
    ] as unknown as readonly SimulatorCoverageEntry[];

    const result = validateSimulatorMementoCoverage(fixtureCoverage, {
      chapters: [MEMENTO_CHAPTERS[0]],
      simulatorDefinitions: fixtureDefinitions,
      roadmapOnlyIds: [],
    });

    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
