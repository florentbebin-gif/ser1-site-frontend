import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PASS_HISTORY,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';
import type { SimulatorDefinition } from '@/domain/simulators/types';

import { SETTINGS_FAMILIES, SETTINGS_FAMILY_IDS } from './families';
import { SETTINGS_REGISTRY } from './registry';
import type {
  SettingsCurrentValue,
  SettingsDefaultTable,
  SettingsFamilyId,
  SettingsOwnerPagePath,
  SettingsReferenceTarget,
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
const SETTINGS_DEFAULTS_BY_TABLE: Record<SettingsDefaultTable, unknown> = {
  tax_settings: DEFAULT_TAX_SETTINGS,
  ps_settings: DEFAULT_PS_SETTINGS,
  fiscality_settings: DEFAULT_FISCALITY_SETTINGS,
};

function hasObjectPath(root: unknown, path: string): boolean {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) return false;

  let current: unknown = root;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return false;
      current = current[index];
      continue;
    }

    if (typeof current !== 'object' || current === null || !(segment in current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return true;
}

function validateSettingsDefaultTarget(
  entry: SettingsRegistryEntry,
  label: 'defaultValue' | 'currentValue',
  target: SettingsReferenceTarget,
  errors: string[],
): void {
  if (target.kind === 'settings-default') {
    const defaults = SETTINGS_DEFAULTS_BY_TABLE[target.table];
    if (!hasObjectPath(defaults, target.path)) {
      errors.push(`${entry.key}: ${label} introuvable dans ${target.table}.${target.path}.`);
    }
  }

  if (target.kind === 'pass-history') {
    const passYears = Object.keys(DEFAULT_PASS_HISTORY);
    const resolves =
      target.year === 'latest' ? passYears.length > 0 : target.year in DEFAULT_PASS_HISTORY;
    if (!resolves) {
      errors.push(`${entry.key}: ${label} PASS introuvable (${target.year}).`);
    }
  }
}

function validateCurrentValueTarget(
  entry: SettingsRegistryEntry,
  target: SettingsCurrentValue,
  errors: string[],
): void {
  if (target.kind === 'supabase-jsonb') {
    const defaults = SETTINGS_DEFAULTS_BY_TABLE[target.table];
    if (!hasObjectPath(defaults, target.path)) {
      errors.push(`${entry.key}: currentValue introuvable dans ${target.table}.${target.path}.`);
    }
  }

  if (target.kind === 'supabase-table' && target.table === 'pass_history') {
    if (target.path !== 'year/pass_amount' || Object.keys(DEFAULT_PASS_HISTORY).length === 0) {
      errors.push(`${entry.key}: currentValue pass_history invalide (${target.path}).`);
    }
  }
}

function validateValueTargets(entry: SettingsRegistryEntry, errors: string[]): void {
  if (entry.defaultValue !== null) {
    validateSettingsDefaultTarget(entry, 'defaultValue', entry.defaultValue, errors);
  }
  if (entry.currentValue !== null) {
    validateCurrentValueTarget(entry, entry.currentValue, errors);
  }
}

function validateUniqueKeys(entries: readonly SettingsRegistryEntry[], errors: string[]): void {
  const keys = entries.map((entry) => entry.key);
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
  knownSimulators: ReadonlyMap<string, SimulatorDefinition>,
  errors: string[],
): void {
  for (const simulatorId of entry.consumerSimulatorIds) {
    const simulator = knownSimulators.get(simulatorId);
    if (!simulator) {
      errors.push(`${entry.key}: simulateur consommateur inconnu (${simulatorId}).`);
      continue;
    }
    if (!simulator.settingsKeys.some((settingKey) => settingKey === entry.key)) {
      errors.push(
        `${entry.key}: le simulateur consommateur ${simulatorId} ne déclare pas la clé dans settingsKeys.`,
      );
    }
  }
}

function validateSimulatorSettingsKeys(
  entries: readonly SettingsRegistryEntry[],
  simulatorDefinitions: readonly SimulatorDefinition[],
  errors: string[],
): void {
  const registryByKey = new Map(entries.map((entry) => [entry.key, entry]));

  for (const simulator of simulatorDefinitions) {
    for (const settingKey of simulator.settingsKeys) {
      const entry = registryByKey.get(settingKey);
      if (!entry) continue;
      if (!entry.consumerSimulatorIds.some((simulatorId) => simulatorId === simulator.id)) {
        errors.push(
          `${simulator.id}: settingsKeys déclare ${settingKey}, mais le registry ne liste pas ce consommateur.`,
        );
      }
    }
  }
}

function validateEntry(
  entry: SettingsRegistryEntry,
  knownClaimKeys: Set<string>,
  knownSimulators: ReadonlyMap<string, SimulatorDefinition>,
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
  validateConsumers(entry, knownSimulators, errors);
  validateValueTargets(entry, errors);

  if (entry.status === 'planned') validatePlannedEntry(entry, errors);
  if (entry.status === 'ready') validateReadyEntry(entry, knownClaimKeys, errors);
  if (entry.status === 'partial') validatePartialEntry(entry, knownClaimKeys, errors);
}

export function validateSettingsRegistryEntries(
  entries: readonly SettingsRegistryEntry[],
  simulatorDefinitions: readonly SimulatorDefinition[] = SIMULATOR_DEFINITIONS,
): SettingsRegistryValidationResult {
  const errors: string[] = [];
  const knownClaimKeys = new Set(SETTINGS_REFERENCE_CHAIN.map((binding) => binding.claimKey));
  const knownSimulators = new Map(
    simulatorDefinitions.map((definition) => [definition.id, definition]),
  );

  validateUniqueKeys(entries, errors);
  for (const entry of entries) {
    validateEntry(entry, knownClaimKeys, knownSimulators, errors);
  }
  validateSimulatorSettingsKeys(entries, simulatorDefinitions, errors);

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateSettingsRegistry(): SettingsRegistryValidationResult {
  return validateSettingsRegistryEntries(SETTINGS_REGISTRY);
}
