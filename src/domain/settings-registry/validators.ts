import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';

import { SETTINGS_FAMILIES, SETTINGS_FAMILY_IDS } from './families';
import { SETTINGS_REGISTRY } from './registry';
import type {
  SettingsFamilyId,
  SettingsOwnerPagePath,
  SettingsRegistryEntry,
  SettingsRegistryValidationResult,
} from './types';

const STATUS_VALUES = new Set(['ready', 'partial', 'planned']);
const FAMILY_OWNER_PAGES: ReadonlyMap<
  SettingsFamilyId,
  ReadonlySet<SettingsOwnerPagePath>
> = new Map(
  SETTINGS_FAMILIES.map((family) => [family.id, new Set<SettingsOwnerPagePath>(family.ownerPages)]),
);

function validateUniqueKeys(errors: string[]): void {
  const keys = SETTINGS_REGISTRY.map((entry) => entry.key);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicates.length > 0) {
    errors.push(`Clés settings dupliquées : ${duplicates.join(', ')}`);
  }
}

function validatePlannedEntry(entry: SettingsRegistryEntry, errors: string[]): void {
  if (entry.defaultValue !== null || entry.currentValue !== null) {
    errors.push(`${entry.key}: un setting planned ne doit pas porter de valeur.`);
  }
  if (entry.source.status !== 'a-completer') {
    errors.push(`${entry.key}: un setting planned doit avoir une référence à compléter.`);
  }
  if (!entry.source.referenceToComplete) {
    errors.push(`${entry.key}: referenceToComplete obligatoire pour un setting planned.`);
  }
  if (entry.millesime !== 'a-renseigner-avant-codage') {
    errors.push(`${entry.key}: un setting planned garde un millésime à renseigner.`);
  }
}

function validateReadyEntry(
  entry: SettingsRegistryEntry,
  knownClaimKeys: Set<string>,
  errors: string[],
): void {
  if (entry.defaultValue === null || entry.currentValue === null) {
    errors.push(`${entry.key}: un setting ready doit pointer defaultValue et currentValue.`);
  }
  if (entry.source.status !== 'complete') {
    errors.push(`${entry.key}: un setting ready doit avoir une source complète.`);
  }
  if (entry.source.settingsReferenceClaimKeys.length === 0) {
    errors.push(
      `${entry.key}: un setting ready doit référencer au moins un claim settings-references.`,
    );
  }
  if (entry.millesime === 'a-renseigner-avant-codage') {
    errors.push(`${entry.key}: un setting ready doit avoir un millésime défini.`);
  }

  for (const claimKey of entry.source.settingsReferenceClaimKeys) {
    if (!knownClaimKeys.has(claimKey)) {
      errors.push(`${entry.key}: claim settings-references inconnu (${claimKey}).`);
    }
  }
}

function validatePartialEntry(
  entry: SettingsRegistryEntry,
  knownClaimKeys: Set<string>,
  errors: string[],
): void {
  if (entry.defaultValue === null || entry.currentValue === null) {
    errors.push(`${entry.key}: un setting partial doit pointer la source partielle existante.`);
  }
  if (
    entry.source.status === 'complete' &&
    entry.source.settingsReferenceClaimKeys.some((claimKey) => !knownClaimKeys.has(claimKey))
  ) {
    errors.push(
      `${entry.key}: claim settings-references inconnu dans une source partielle complète.`,
    );
  }
  if (entry.source.status === 'a-completer' && !entry.source.referenceToComplete) {
    errors.push(
      `${entry.key}: une source partielle à compléter doit nommer la référence attendue.`,
    );
  }
}

function validateOwner(entry: SettingsRegistryEntry, errors: string[]): void {
  const ownerPages = FAMILY_OWNER_PAGES.get(entry.family);
  if (!ownerPages?.has(entry.ownerSettingsPage)) {
    errors.push(`${entry.key}: page propriétaire incohérente (${entry.ownerSettingsPage}).`);
  }
}

function validateConsumers(
  entry: SettingsRegistryEntry,
  knownSimulatorIds: Set<string>,
  errors: string[],
): void {
  for (const simulatorId of entry.consumerSimulatorIds) {
    if (!knownSimulatorIds.has(simulatorId)) {
      errors.push(`${entry.key}: simulateur consommateur inconnu (${simulatorId}).`);
    }
  }
}

function validateEntry(
  entry: SettingsRegistryEntry,
  knownClaimKeys: Set<string>,
  knownSimulatorIds: Set<string>,
  errors: string[],
): void {
  if (!SETTINGS_FAMILY_IDS.has(entry.family)) {
    errors.push(`${entry.key}: famille inconnue (${entry.family}).`);
  }
  if (!entry.key.startsWith(`${entry.family}.`)) {
    errors.push(`${entry.key}: la clé doit commencer par sa famille (${entry.family}.).`);
  }
  if (!STATUS_VALUES.has(entry.status)) {
    errors.push(`${entry.key}: statut inconnu (${entry.status}).`);
  }
  if (entry.validation.validators.length === 0) {
    errors.push(`${entry.key}: au moins un validateur doit être déclaré.`);
  }
  if (entry.validation.requiredBeforeConsumption !== true) {
    errors.push(`${entry.key}: la validation doit être requise avant consommation.`);
  }
  validateOwner(entry, errors);
  validateConsumers(entry, knownSimulatorIds, errors);

  if (entry.status === 'planned') validatePlannedEntry(entry, errors);
  if (entry.status === 'ready') validateReadyEntry(entry, knownClaimKeys, errors);
  if (entry.status === 'partial') validatePartialEntry(entry, knownClaimKeys, errors);
}

export function validateSettingsRegistry(): SettingsRegistryValidationResult {
  const errors: string[] = [];
  const knownClaimKeys = new Set(SETTINGS_REFERENCE_CHAIN.map((binding) => binding.claimKey));
  const knownSimulatorIds = new Set(SIMULATOR_DEFINITIONS.map((definition) => definition.id));

  validateUniqueKeys(errors);
  for (const entry of SETTINGS_REGISTRY) {
    validateEntry(entry, knownClaimKeys, knownSimulatorIds, errors);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
