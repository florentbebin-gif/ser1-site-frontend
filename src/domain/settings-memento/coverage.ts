import { LEGAL_REFERENCES } from '@/domain/legal-references';
import { SETTINGS_REGISTRY_KEYS } from '@/domain/settings-registry';
import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';
import type { SimulatorDefinition, SimulatorLifecycle } from '@/domain/simulators/types';

import { MEMENTO_CHAPTERS } from './chapters';
import { MEMENTO_ENTRIES } from './entries';
import {
  ROADMAP_ONLY_SIMULATOR_IDS,
  SIMULATOR_MEMENTO_COVERAGE,
  validateSimulatorMementoCoverage,
  type SimulatorCoverageEntry,
} from './simulatorCoverage';
import type { MementoChapter, MementoEntry } from './types';
import { validateMementoTaxonomy } from './validators';

const CANONICAL_SOCIETY_SETTINGS_PATH = '/settings/comptables-societes';
const SINGULAR_SOCIETY_SETTINGS_PATH = '/settings/comptables-societe';
const SOURCE_MISSING_ALLOWED_STATUSES = new Set([
  'planned',
  'a_verifier',
  'blocked_missing_official_source',
]);
const SOURCE_REQUIRED_LIFECYCLES = new Set<SimulatorLifecycle>(['active', 'hub', 'expertOnly']);
const NON_COVERABLE_LIFECYCLES = new Set<SimulatorLifecycle>([
  'planned',
  'internalOnly',
  'placeholder',
]);

export type MementoCoverageStringCatalog = readonly string[] | ReadonlySet<string>;

export interface MementoCoverageSimulatorDefinition {
  id: string;
  lifecycle: SimulatorDefinition['lifecycle'];
  subtypes?: readonly string[];
}

interface ResolvedMementoCoverageInput {
  chapters: readonly MementoChapter[];
  entries: readonly MementoEntry[];
  coverage: readonly SimulatorCoverageEntry[];
  knownSettingsUrlPaths: readonly string[];
  legalReferenceIds: ReadonlySet<string>;
  registryKeys: ReadonlySet<string>;
  roadmapOnlyIds: readonly string[];
  settingReferenceClaimKeys: ReadonlySet<string>;
  simulatorDefinitions: readonly MementoCoverageSimulatorDefinition[];
}

export interface MementoCoverageInput {
  chapters?: readonly MementoChapter[];
  entries?: readonly MementoEntry[];
  coverage?: readonly SimulatorCoverageEntry[];
  knownSettingsUrlPaths: readonly string[];
  legalReferenceIds?: MementoCoverageStringCatalog;
  registryKeys?: MementoCoverageStringCatalog;
  roadmapOnlyIds?: readonly string[];
  settingReferenceClaimKeys?: MementoCoverageStringCatalog;
  simulatorDefinitions?: readonly MementoCoverageSimulatorDefinition[];
}

export interface MementoCoverageReport {
  ok: boolean;
  errors: string[];
  counts: {
    chapters: number;
    entries: number;
    simulatorCoverage: number;
    registrySimulators: number;
    knownSettingsUrlPaths: number;
    ownerPagePaths: number;
  };
  referencedChapterIds: readonly string[];
  unreferencedChapterIds: readonly string[];
  settingsRoutes: {
    hasCanonicalSocietyPath: boolean;
    hasSingularSocietyPath: boolean;
    unknownOwnerPagePaths: readonly string[];
  };
}

export interface MementoCoverageValidationResult {
  ok: boolean;
  errors: string[];
}

function toReadonlySet(values: MementoCoverageStringCatalog): ReadonlySet<string> {
  if ('has' in values) return values;
  return new Set(values);
}

function resolveInput(input: MementoCoverageInput): ResolvedMementoCoverageInput {
  const simulatorDefinitions = input.simulatorDefinitions ?? SIMULATOR_DEFINITIONS;

  return {
    chapters: input.chapters ?? MEMENTO_CHAPTERS,
    entries: input.entries ?? MEMENTO_ENTRIES,
    coverage: input.coverage ?? SIMULATOR_MEMENTO_COVERAGE,
    knownSettingsUrlPaths: input.knownSettingsUrlPaths,
    legalReferenceIds: toReadonlySet(
      input.legalReferenceIds ?? LEGAL_REFERENCES.map((reference) => reference.id),
    ),
    registryKeys: toReadonlySet(input.registryKeys ?? [...SETTINGS_REGISTRY_KEYS]),
    roadmapOnlyIds: input.roadmapOnlyIds ?? ROADMAP_ONLY_SIMULATOR_IDS,
    settingReferenceClaimKeys: toReadonlySet(
      input.settingReferenceClaimKeys ??
        SETTINGS_REFERENCE_CHAIN.map((binding) => binding.claimKey),
    ),
    simulatorDefinitions,
  };
}

function appendNestedValidationErrors(input: ResolvedMementoCoverageInput, errors: string[]): void {
  const simulatorIds = new Set<string>(
    input.simulatorDefinitions.map((definition) => definition.id),
  );
  const taxonomy = validateMementoTaxonomy(input.chapters, input.entries, {
    legalReferenceIds: input.legalReferenceIds,
    registryKeys: input.registryKeys,
    settingReferenceClaimKeys: input.settingReferenceClaimKeys,
    simulatorIds,
  });
  const simulatorCoverage = validateSimulatorMementoCoverage(input.coverage, {
    chapters: input.chapters,
    roadmapOnlyIds: input.roadmapOnlyIds,
    simulatorDefinitions: input.simulatorDefinitions,
  });

  errors.push(...taxonomy.errors, ...simulatorCoverage.errors);
}

function validateOwnerPagePaths(input: ResolvedMementoCoverageInput, errors: string[]): string[] {
  const knownPaths = new Set(input.knownSettingsUrlPaths);
  const unknownOwnerPagePaths = new Set<string>();

  for (const entry of input.entries) {
    if (entry.ownerPagePath === null) continue;
    if (knownPaths.has(entry.ownerPagePath)) continue;

    unknownOwnerPagePaths.add(entry.ownerPagePath);
    errors.push(
      `${entry.key}: ownerPagePath inconnu dans SETTINGS_ROUTES (${entry.ownerPagePath}).`,
    );
  }

  return [...unknownOwnerPagePaths].sort();
}

function validateEntryCatalogReferences(
  input: ResolvedMementoCoverageInput,
  simulatorById: ReadonlyMap<string, MementoCoverageSimulatorDefinition>,
  errors: string[],
): void {
  for (const entry of input.entries) {
    for (const registryKey of entry.registryKeys) {
      if (!input.registryKeys.has(registryKey)) {
        errors.push(`${entry.key}: registryKey inconnue (${registryKey}).`);
      }
    }

    for (const claimKey of entry.claimKeys) {
      if (!input.settingReferenceClaimKeys.has(claimKey)) {
        errors.push(`${entry.key}: claimKey settings-references inconnue (${claimKey}).`);
      }
    }

    for (const refId of entry.refIds) {
      if (!input.legalReferenceIds.has(refId)) {
        errors.push(`${entry.key}: refId juridique inconnu (${refId}).`);
      }
    }

    for (const simulatorId of entry.relatedSimulatorIds) {
      if (!simulatorById.has(simulatorId)) {
        errors.push(`${entry.key}: relatedSimulatorId inconnu (${simulatorId}).`);
      }
    }
  }
}

function validateSourceSensitiveStatuses(
  entries: readonly MementoEntry[],
  simulatorById: ReadonlyMap<string, MementoCoverageSimulatorDefinition>,
  errors: string[],
): void {
  for (const entry of entries) {
    const hasQualifiedSource = entry.refIds.length > 0 || entry.claimKeys.length > 0;
    const hasActiveSimulator = entry.relatedSimulatorIds.some((simulatorId) => {
      const simulator = simulatorById.get(simulatorId);
      return simulator ? SOURCE_REQUIRED_LIFECYCLES.has(simulator.lifecycle) : false;
    });
    const needsQualifiedSource = entry.registryKeys.length > 0 || hasActiveSimulator;

    if (
      needsQualifiedSource &&
      !hasQualifiedSource &&
      !SOURCE_MISSING_ALLOWED_STATUSES.has(entry.status)
    ) {
      errors.push(
        `${entry.key}: une entrée liée à des réglages ou simulateurs actifs sans source officielle doit rester planned, a_verifier ou blocked_missing_official_source.`,
      );
    }
  }
}

function validateEntryLifecycleCoherence(
  entries: readonly MementoEntry[],
  simulatorById: ReadonlyMap<string, MementoCoverageSimulatorDefinition>,
  errors: string[],
): void {
  for (const entry of entries) {
    if (entry.status !== 'couvert') continue;

    for (const simulatorId of entry.relatedSimulatorIds) {
      const simulator = simulatorById.get(simulatorId);
      if (!simulator || !NON_COVERABLE_LIFECYCLES.has(simulator.lifecycle)) continue;

      errors.push(
        `${entry.key}: le simulateur ${simulatorId} a un lifecycle ${simulator.lifecycle} et ne peut pas porter un statut mémento couvert.`,
      );
    }
  }
}

function validateChapterReferences(
  input: ResolvedMementoCoverageInput,
  errors: string[],
): string[] {
  const referencedChapterIds = new Set<string>();

  for (const entry of input.entries) {
    referencedChapterIds.add(entry.chapterId);
  }
  for (const coverageEntry of input.coverage) {
    referencedChapterIds.add(coverageEntry.chapterId);
  }

  const unreferencedChapterIds = input.chapters
    .map((chapter) => chapter.id)
    .filter((chapterId) => !referencedChapterIds.has(chapterId));

  for (const chapterId of unreferencedChapterIds) {
    errors.push(`Chapitre mémento sans entrée ni couverture simulateur : ${chapterId}.`);
  }

  return unreferencedChapterIds;
}

function validateCanonicalSocietyRoute(
  input: ResolvedMementoCoverageInput,
  errors: string[],
): void {
  const knownPaths = new Set(input.knownSettingsUrlPaths);

  if (!knownPaths.has(CANONICAL_SOCIETY_SETTINGS_PATH)) {
    errors.push('SETTINGS_ROUTES: /settings/comptables-societes doit rester déclarée.');
  }

  for (const path of knownPaths) {
    if (path === CANONICAL_SOCIETY_SETTINGS_PATH) continue;
    if (path.startsWith(SINGULAR_SOCIETY_SETTINGS_PATH)) {
      errors.push(`SETTINGS_ROUTES: route société non canonique détectée (${path}).`);
    }
  }

  for (const entry of input.entries) {
    if (entry.ownerPagePath === null) continue;
    if (entry.ownerPagePath === CANONICAL_SOCIETY_SETTINGS_PATH) continue;
    if (entry.ownerPagePath.startsWith(SINGULAR_SOCIETY_SETTINGS_PATH)) {
      errors.push(
        `${entry.key}: ownerPagePath société doit utiliser /settings/comptables-societes.`,
      );
    }
  }
}

function listReferencedChapterIds(input: ResolvedMementoCoverageInput): string[] {
  const referencedChapterIds = new Set<string>();

  for (const entry of input.entries) {
    referencedChapterIds.add(entry.chapterId);
  }
  for (const coverageEntry of input.coverage) {
    referencedChapterIds.add(coverageEntry.chapterId);
  }

  return input.chapters
    .map((chapter) => chapter.id)
    .filter((chapterId) => referencedChapterIds.has(chapterId));
}

function countOwnerPagePaths(entries: readonly MementoEntry[]): number {
  const ownerPagePaths = entries.flatMap((entry) =>
    entry.ownerPagePath === null ? [] : [entry.ownerPagePath],
  );

  return new Set(ownerPagePaths).size;
}

export function buildMementoCoverageReport(input: MementoCoverageInput): MementoCoverageReport {
  const resolvedInput = resolveInput(input);
  const errors: string[] = [];
  const simulatorById = new Map<string, MementoCoverageSimulatorDefinition>(
    resolvedInput.simulatorDefinitions.map((definition) => [definition.id, definition]),
  );

  appendNestedValidationErrors(resolvedInput, errors);
  const unknownOwnerPagePaths = validateOwnerPagePaths(resolvedInput, errors);
  validateEntryCatalogReferences(resolvedInput, simulatorById, errors);
  validateSourceSensitiveStatuses(resolvedInput.entries, simulatorById, errors);
  validateEntryLifecycleCoherence(resolvedInput.entries, simulatorById, errors);
  const unreferencedChapterIds = validateChapterReferences(resolvedInput, errors);
  validateCanonicalSocietyRoute(resolvedInput, errors);

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      chapters: resolvedInput.chapters.length,
      entries: resolvedInput.entries.length,
      simulatorCoverage: resolvedInput.coverage.length,
      registrySimulators: resolvedInput.simulatorDefinitions.length,
      knownSettingsUrlPaths: resolvedInput.knownSettingsUrlPaths.length,
      ownerPagePaths: countOwnerPagePaths(resolvedInput.entries),
    },
    referencedChapterIds: listReferencedChapterIds(resolvedInput),
    unreferencedChapterIds,
    settingsRoutes: {
      hasCanonicalSocietyPath: resolvedInput.knownSettingsUrlPaths.includes(
        CANONICAL_SOCIETY_SETTINGS_PATH,
      ),
      hasSingularSocietyPath: resolvedInput.knownSettingsUrlPaths.some(
        (path) =>
          path !== CANONICAL_SOCIETY_SETTINGS_PATH &&
          path.startsWith(SINGULAR_SOCIETY_SETTINGS_PATH),
      ),
      unknownOwnerPagePaths,
    },
  };
}

export function validateMementoCoverage(
  input: MementoCoverageInput,
): MementoCoverageValidationResult {
  const report = buildMementoCoverageReport(input);

  return {
    ok: report.ok,
    errors: report.errors,
  };
}
