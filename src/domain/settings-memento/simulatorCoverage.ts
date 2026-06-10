import { SIMULATOR_DEFINITIONS, type SimulatorId } from '@/domain/simulators/registry';
import type { SimulatorDefinition } from '@/domain/simulators/types';

import { MEMENTO_CHAPTERS } from './chapters';
import {
  MEMENTO_STATUS_VALUES,
  type MementoChapter,
  type MementoChapterId,
  type MementoStatus,
} from './types';
import { ROADMAP_ONLY_SIMULATOR_IDS, SIMULATOR_MEMENTO_COVERAGE } from './simulatorCoverageData';

export { ROADMAP_ONLY_SIMULATOR_IDS, SIMULATOR_MEMENTO_COVERAGE } from './simulatorCoverageData';

export type RoadmapOnlySimulatorId =
  | 'obo'
  | 'fiscalite-societe'
  | 'prevoyance-dirigeant'
  | 'donation-demembrement-societe'
  | 'succession-liquidite-societe';

export type SimulatorCoverageTarget =
  | { kind: 'registry'; simulatorId: SimulatorId }
  | { kind: 'subtype'; parentSimulatorId: SimulatorId; subtypeLabel: string }
  | { kind: 'roadmap-only'; roadmapId: RoadmapOnlySimulatorId; roadmapLabel: string };

export interface SimulatorCoverageEntry {
  target: SimulatorCoverageTarget;
  chapterId: MementoChapterId;
  sectionLabel: string;
  expectedStatus: MementoStatus;
  note?: string;
}

export interface SimulatorCoverageValidationResult {
  ok: boolean;
  errors: string[];
}

interface SimulatorCoverageDefinition {
  id: string;
  lifecycle: SimulatorDefinition['lifecycle'];
  subtypes?: readonly string[];
}

type RegistryCoverageEntry = Omit<SimulatorCoverageEntry, 'target'> & {
  target: Extract<SimulatorCoverageTarget, { kind: 'registry' }>;
};

type SubtypeCoverageEntry = Omit<SimulatorCoverageEntry, 'target'> & {
  target: Extract<SimulatorCoverageTarget, { kind: 'subtype' }>;
};

type RoadmapOnlyCoverageEntry = Omit<SimulatorCoverageEntry, 'target'> & {
  target: Extract<SimulatorCoverageTarget, { kind: 'roadmap-only' }>;
};

interface SimulatorCoverageValidationCatalogs {
  chapters: readonly Pick<MementoChapter, 'id'>[];
  roadmapOnlyIds: readonly string[];
  simulatorDefinitions: readonly SimulatorCoverageDefinition[];
  statuses: ReadonlySet<string>;
}

function mergeCatalogs(
  catalogs: Partial<SimulatorCoverageValidationCatalogs> = {},
): SimulatorCoverageValidationCatalogs {
  return {
    chapters: MEMENTO_CHAPTERS,
    roadmapOnlyIds: ROADMAP_ONLY_SIMULATOR_IDS,
    simulatorDefinitions: SIMULATOR_DEFINITIONS,
    statuses: new Set<string>(MEMENTO_STATUS_VALUES),
    ...catalogs,
  };
}

function targetKey(entry: SimulatorCoverageEntry): string {
  switch (entry.target.kind) {
    case 'registry':
      return `registry:${entry.target.simulatorId}`;
    case 'subtype':
      return `subtype:${entry.target.parentSimulatorId}:${entry.target.subtypeLabel}`;
    case 'roadmap-only':
      return `roadmap-only:${entry.target.roadmapId}`;
  }
}

function targetLabel(entry: SimulatorCoverageEntry): string {
  switch (entry.target.kind) {
    case 'registry':
      return entry.target.simulatorId;
    case 'subtype':
      return `${entry.target.parentSimulatorId}:${entry.target.subtypeLabel}`;
    case 'roadmap-only':
      return entry.target.roadmapId;
  }
}

function countMap(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function isRegistryCoverageEntry(entry: SimulatorCoverageEntry): entry is RegistryCoverageEntry {
  return entry.target.kind === 'registry';
}

function isSubtypeCoverageEntry(entry: SimulatorCoverageEntry): entry is SubtypeCoverageEntry {
  return entry.target.kind === 'subtype';
}

function isRoadmapOnlyCoverageEntry(
  entry: SimulatorCoverageEntry,
): entry is RoadmapOnlyCoverageEntry {
  return entry.target.kind === 'roadmap-only';
}

function validateRegistryTarget(
  entry: RegistryCoverageEntry,
  simulatorById: ReadonlyMap<string, SimulatorCoverageDefinition>,
  errors: string[],
): void {
  const simulator = simulatorById.get(entry.target.simulatorId);
  if (!simulator) {
    errors.push(`${entry.target.simulatorId}: simulateur absent de la registry simulateurs.`);
    return;
  }

  if (
    ['planned', 'internalOnly', 'placeholder'].includes(simulator.lifecycle) &&
    entry.expectedStatus === 'couvert'
  ) {
    errors.push(
      `${entry.target.simulatorId}: lifecycle ${simulator.lifecycle} ne peut pas avoir expectedStatus couvert.`,
    );
  }
}

function validateSubtypeTarget(
  entry: SubtypeCoverageEntry,
  simulatorById: ReadonlyMap<string, SimulatorCoverageDefinition>,
  errors: string[],
): void {
  const parent = simulatorById.get(entry.target.parentSimulatorId);
  if (!parent) {
    errors.push(`${entry.target.parentSimulatorId}: parent de sous-type absent de la registry.`);
    return;
  }

  if (!parent.subtypes?.includes(entry.target.subtypeLabel)) {
    errors.push(
      `${entry.target.parentSimulatorId}: sous-type absent de la registry simulateurs (${entry.target.subtypeLabel}).`,
    );
  }
}

function validateRoadmapTarget(
  entry: RoadmapOnlyCoverageEntry,
  simulatorById: ReadonlyMap<string, SimulatorCoverageDefinition>,
  roadmapOnlyIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (simulatorById.has(entry.target.roadmapId)) {
    errors.push(
      `${entry.target.roadmapId}: roadmap-only existe déjà dans la registry simulateurs.`,
    );
  }

  if (!roadmapOnlyIds.has(entry.target.roadmapId)) {
    errors.push(`${entry.target.roadmapId}: roadmap-only non déclaré.`);
  }
}

function validateEntry(
  entry: SimulatorCoverageEntry,
  catalogs: SimulatorCoverageValidationCatalogs,
  chapterIds: ReadonlySet<string>,
  simulatorById: ReadonlyMap<string, SimulatorCoverageDefinition>,
  roadmapOnlyIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (!chapterIds.has(entry.chapterId)) {
    errors.push(`${targetLabel(entry)}: chapterId mémento inconnu (${entry.chapterId}).`);
  }

  if (!catalogs.statuses.has(entry.expectedStatus)) {
    errors.push(`${targetLabel(entry)}: expectedStatus mémento inconnu (${entry.expectedStatus}).`);
  }

  if (isRegistryCoverageEntry(entry)) {
    validateRegistryTarget(entry, simulatorById, errors);
    return;
  }
  if (isSubtypeCoverageEntry(entry)) {
    validateSubtypeTarget(entry, simulatorById, errors);
    return;
  }
  if (isRoadmapOnlyCoverageEntry(entry)) {
    validateRoadmapTarget(entry, simulatorById, roadmapOnlyIds, errors);
  }
}

export function validateSimulatorMementoCoverage(
  coverage: readonly SimulatorCoverageEntry[] = SIMULATOR_MEMENTO_COVERAGE,
  catalogs?: Partial<SimulatorCoverageValidationCatalogs>,
): SimulatorCoverageValidationResult {
  const errors: string[] = [];
  const mergedCatalogs = mergeCatalogs(catalogs);
  const chapterIds = new Set<string>(mergedCatalogs.chapters.map((chapter) => chapter.id));
  const simulatorById = new Map<string, SimulatorCoverageDefinition>(
    mergedCatalogs.simulatorDefinitions.map((definition) => [definition.id, definition]),
  );
  const roadmapOnlyIds = new Set<string>(mergedCatalogs.roadmapOnlyIds);
  const seenTargets = new Set<string>();
  const duplicateTargets = new Set<string>();
  const referencedChapterIds = new Set<string>();

  for (const entry of coverage) {
    const key = targetKey(entry);
    if (seenTargets.has(key)) duplicateTargets.add(targetLabel(entry));
    seenTargets.add(key);
    referencedChapterIds.add(entry.chapterId);
    validateEntry(entry, mergedCatalogs, chapterIds, simulatorById, roadmapOnlyIds, errors);
  }

  for (const duplicateTarget of duplicateTargets) {
    errors.push(`Couverture mémento dupliquée : ${duplicateTarget}.`);
  }

  const registryCounts = countMap(
    coverage.filter(isRegistryCoverageEntry).map((entry) => entry.target.simulatorId),
  );
  for (const simulator of mergedCatalogs.simulatorDefinitions) {
    const count = registryCounts.get(simulator.id) ?? 0;
    if (count === 0) errors.push(`Simulateur registry sans couverture : ${simulator.id}.`);
    if (count > 1) errors.push(`Simulateur registry couvert plusieurs fois : ${simulator.id}.`);
  }

  const roadmapCounts = countMap(
    coverage.filter(isRoadmapOnlyCoverageEntry).map((entry) => entry.target.roadmapId),
  );
  for (const roadmapId of mergedCatalogs.roadmapOnlyIds) {
    const count = roadmapCounts.get(roadmapId) ?? 0;
    if (count === 0) errors.push(`ROADMAP-only sans couverture : ${roadmapId}.`);
    if (count > 1) errors.push(`ROADMAP-only couvert plusieurs fois : ${roadmapId}.`);
  }

  for (const chapterId of chapterIds) {
    if (!referencedChapterIds.has(chapterId)) {
      errors.push(`Chapitre mémento sans couverture simulateur : ${chapterId}.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function listCoverageForChapter(
  chapterId: MementoChapterId,
): readonly SimulatorCoverageEntry[] {
  return SIMULATOR_MEMENTO_COVERAGE.filter((entry) => entry.chapterId === chapterId);
}

export function getCoverageForSimulator(simulatorId: SimulatorId): SimulatorCoverageEntry {
  const coverage = SIMULATOR_MEMENTO_COVERAGE.find(
    (entry) => entry.target.kind === 'registry' && entry.target.simulatorId === simulatorId,
  );

  if (!coverage) {
    throw new Error(`Couverture mémento introuvable pour le simulateur : ${simulatorId}`);
  }

  return coverage;
}
