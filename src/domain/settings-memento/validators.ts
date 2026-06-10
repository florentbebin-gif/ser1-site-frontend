import { LEGAL_REFERENCES } from '@/domain/legal-references';
import { SETTINGS_REGISTRY_KEYS } from '@/domain/settings-registry';
import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';

import {
  MEMENTO_BUSINESS_PRIORITY_VALUES,
  MEMENTO_COVERAGE_SOURCE_VALUES,
  MEMENTO_STATUS_VALUES,
  MEMENTO_USER_INTENT_VALUES,
  type MementoChapter,
  type MementoChapterId,
  type MementoEntry,
  type MementoTaxonomyValidationResult,
} from './types';

interface MementoValidationCatalogs {
  coverageSources: ReadonlySet<string>;
  intents: ReadonlySet<string>;
  legalReferenceIds: ReadonlySet<string>;
  priorities: ReadonlySet<string>;
  registryKeys: ReadonlySet<string>;
  settingReferenceClaimKeys: ReadonlySet<string>;
  simulatorIds: ReadonlySet<string>;
  statuses: ReadonlySet<string>;
}

const DEFAULT_CATALOGS: MementoValidationCatalogs = {
  coverageSources: new Set<string>(MEMENTO_COVERAGE_SOURCE_VALUES),
  intents: new Set<string>(MEMENTO_USER_INTENT_VALUES),
  legalReferenceIds: new Set<string>(LEGAL_REFERENCES.map((reference) => reference.id)),
  priorities: new Set<string>(MEMENTO_BUSINESS_PRIORITY_VALUES),
  registryKeys: SETTINGS_REGISTRY_KEYS,
  settingReferenceClaimKeys: new Set<string>(
    SETTINGS_REFERENCE_CHAIN.map((binding) => binding.claimKey),
  ),
  simulatorIds: new Set<string>(SIMULATOR_DEFINITIONS.map((definition) => definition.id)),
  statuses: new Set<string>(MEMENTO_STATUS_VALUES),
};

const TEXT_RULES = [
  {
    label: 'un pourcentage',
    pattern: /\b\d+(?:[,.]\d+)?\s*%/u,
  },
  {
    label: 'un montant',
    pattern: /\b\d[\d\s_]*(?:[,.]\d+)?\s*(?:€|EUR|euros?)/iu,
  },
  {
    label: 'une valeur associée à plafond',
    pattern: /\bplafonds?\b[^.\n;]{0,80}\b\d{3,}(?:[\s_]\d{3})*\b/iu,
  },
  {
    label: 'une valeur associée à seuil',
    pattern: /\bseuils?\b[^.\n;]{0,80}\b\d{3,}(?:[\s_]\d{3})*\b/iu,
  },
  {
    label: 'une valeur associée à assiette',
    pattern: /\bassiettes?\b[^.\n;]{0,80}\b\d{3,}(?:[\s_]\d{3})*\b/iu,
  },
  {
    label: 'une valeur associée à abattement',
    pattern: /\babattements?\b[^.\n;]{0,80}\b\d{3,}(?:[\s_]\d{3})*\b/iu,
  },
  {
    label: 'une valeur associée à taux',
    pattern: /\btaux\b[^.\n;]{0,80}\b\d{3,}(?:[\s_]\d{3})*\b/iu,
  },
  {
    label: 'une valeur associée à barème',
    pattern: /\bbar[eè]mes?\b[^.\n;]{0,80}\b\d{3,}(?:[\s_]\d{3})*\b/iu,
  },
  {
    label: 'une formule de calcul',
    pattern: /\b(?:formule|calcul)\b[^.\n;]{0,80}(?:=|\+|\*|\/|×|\s-\s)/iu,
  },
] as const;

function mergeCatalogs(catalogs?: Partial<MementoValidationCatalogs>): MementoValidationCatalogs {
  return {
    ...DEFAULT_CATALOGS,
    ...catalogs,
  };
}

function validateUniqueChapterIds(chapters: readonly MementoChapter[], errors: string[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const chapter of chapters) {
    if (seen.has(chapter.id)) duplicates.add(chapter.id);
    seen.add(chapter.id);
    validateTextValue(chapter.id, 'label', chapter.label, errors);
    validateTextValue(chapter.id, 'description', chapter.description, errors);
  }

  if (duplicates.size > 0) {
    errors.push(`Chapitres mémento dupliqués : ${[...duplicates].join(', ')}`);
  }
}

function validateTextValue(
  key: string,
  field: 'label' | 'description' | 'statusReason',
  value: string,
  errors: string[],
): void {
  if (value.trim().length === 0) {
    errors.push(`${key}: ${field} obligatoire.`);
    return;
  }

  for (const rule of TEXT_RULES) {
    if (rule.pattern.test(value)) {
      errors.push(`${key}: ${field} contient ${rule.label}, interdit dans la taxonomie mémento.`);
    }
  }
}

function validateTextField(
  entry: MementoEntry,
  field: 'label' | 'description' | 'statusReason',
  errors: string[],
): void {
  validateTextValue(entry.key, field, entry[field], errors);
}

function validateEntryKeys(
  entries: readonly MementoEntry[],
  chapters: ReadonlySet<string>,
  errors: string[],
): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.key)) duplicates.add(entry.key);
    seen.add(entry.key);

    if (!chapters.has(entry.chapterId)) {
      errors.push(`${entry.key}: chapterId inconnu (${entry.chapterId}).`);
    }
    if (!entry.key.startsWith(`${entry.chapterId}.`)) {
      errors.push(`${entry.key}: la clé doit commencer par ${entry.chapterId}.`);
    }
  }

  if (duplicates.size > 0) {
    errors.push(`Entrées mémento dupliquées : ${[...duplicates].join(', ')}`);
  }
}

function validateEntrySources(
  entry: MementoEntry,
  catalogs: MementoValidationCatalogs,
  errors: string[],
): void {
  for (const registryKey of entry.registryKeys) {
    if (!catalogs.registryKeys.has(registryKey)) {
      errors.push(`${entry.key}: registryKey inconnue (${registryKey}).`);
    }
  }

  for (const claimKey of entry.claimKeys) {
    if (!catalogs.settingReferenceClaimKeys.has(claimKey)) {
      errors.push(`${entry.key}: claimKey settings-references inconnue (${claimKey}).`);
    }
  }

  for (const refId of entry.refIds) {
    if (!catalogs.legalReferenceIds.has(refId)) {
      errors.push(`${entry.key}: refId juridique inconnu (${refId}).`);
    }
  }

  for (const simulatorId of entry.relatedSimulatorIds) {
    if (!catalogs.simulatorIds.has(simulatorId)) {
      errors.push(`${entry.key}: relatedSimulatorId inconnu (${simulatorId}).`);
    }
  }

  for (const coverageSource of entry.coverageSources) {
    if (!catalogs.coverageSources.has(coverageSource)) {
      errors.push(`${entry.key}: coverageSource inconnue (${coverageSource}).`);
    }
  }
}

function validatePriority(
  entry: MementoEntry,
  catalogs: MementoValidationCatalogs,
  errors: string[],
): void {
  if (!catalogs.priorities.has(entry.priority)) {
    errors.push(`${entry.key}: priorité métier inconnue (${entry.priority}).`);
  }
}

function validateStatus(
  entry: MementoEntry,
  catalogs: MementoValidationCatalogs,
  errors: string[],
): void {
  if (!catalogs.statuses.has(entry.status)) {
    errors.push(`${entry.key}: statut mémento inconnu (${entry.status}).`);
  }

  if (entry.status === 'couvert' && entry.refIds.length === 0 && entry.claimKeys.length === 0) {
    errors.push(
      `${entry.key}: le statut couvert exige au moins un refId ou un claim settings ; les coverageSources ne suffisent pas.`,
    );
  }

  if (entry.status !== 'blocked_missing_official_source') return;

  if (entry.refIds.length > 0 || entry.claimKeys.length > 0) {
    errors.push(
      `${entry.key}: blocked_missing_official_source doit garder refIds et claimKeys vides.`,
    );
  }

  if (!/(source|référence|reference|officielle|manquante)/iu.test(entry.statusReason)) {
    errors.push(
      `${entry.key}: blocked_missing_official_source doit nommer la source officielle manquante dans statusReason.`,
    );
  }
}

function validateEntry(
  entry: MementoEntry,
  catalogs: MementoValidationCatalogs,
  errors: string[],
): void {
  validateTextField(entry, 'label', errors);
  validateTextField(entry, 'description', errors);
  validateTextField(entry, 'statusReason', errors);
  validatePriority(entry, catalogs, errors);
  validateStatus(entry, catalogs, errors);
  validateEntrySources(entry, catalogs, errors);
}

export function validateMementoTaxonomy(
  chapters: readonly MementoChapter[],
  entries: readonly MementoEntry[],
  catalogs?: Partial<MementoValidationCatalogs>,
): MementoTaxonomyValidationResult {
  const errors: string[] = [];
  const mergedCatalogs = mergeCatalogs(catalogs);
  const chapterIds = new Set<MementoChapterId>(chapters.map((chapter) => chapter.id));

  validateUniqueChapterIds(chapters, errors);
  validateEntryKeys(entries, chapterIds, errors);

  for (const entry of entries) {
    validateEntry(entry, mergedCatalogs, errors);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

interface MementoIntentValidationInput {
  id: string;
  label: string;
  chapterIds: readonly string[];
}

export function validateMementoIntents(
  chapters: readonly MementoChapter[],
  intents: readonly MementoIntentValidationInput[],
  catalogs?: Partial<Pick<MementoValidationCatalogs, 'intents'>>,
): MementoTaxonomyValidationResult {
  const errors: string[] = [];
  const mergedCatalogs = mergeCatalogs(catalogs);
  const chapterIds = new Set<MementoChapterId>(chapters.map((chapter) => chapter.id));
  const coveredChapterIds = new Set<MementoChapterId>();
  const seenIntentIds = new Set<string>();
  const duplicateIntentIds = new Set<string>();

  for (const intent of intents) {
    if (seenIntentIds.has(intent.id)) duplicateIntentIds.add(intent.id);
    seenIntentIds.add(intent.id);

    if (!mergedCatalogs.intents.has(intent.id)) {
      errors.push(`${intent.id}: intention métier inconnue.`);
    }

    validateTextValue(intent.id, 'label', intent.label, errors);

    for (const chapterId of intent.chapterIds) {
      const typedChapterId = chapterId as MementoChapterId;

      if (!chapterIds.has(typedChapterId)) {
        errors.push(`${intent.id}: chapitre mémento inconnu (${chapterId}).`);
        continue;
      }

      coveredChapterIds.add(typedChapterId);
    }
  }

  if (duplicateIntentIds.size > 0) {
    errors.push(`Intentions métier dupliquées : ${[...duplicateIntentIds].join(', ')}`);
  }

  const missingChapterIds = [...chapterIds].filter(
    (chapterId) => !coveredChapterIds.has(chapterId),
  );
  if (missingChapterIds.length > 0) {
    errors.push(`Chapitres mémento sans intention métier : ${missingChapterIds.join(', ')}.`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
