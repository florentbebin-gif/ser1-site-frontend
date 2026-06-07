import { SETTINGS_CORE_REGISTRY } from './entriesCore';
import { SETTINGS_PLANNED_REGISTRY } from './entriesPlanned';
import type { SettingsOwnerPagePath, SettingsRegistryEntry, SettingsRegistryStatus } from './types';

export const SETTINGS_REGISTRY = [
  ...SETTINGS_CORE_REGISTRY,
  ...SETTINGS_PLANNED_REGISTRY,
] as const satisfies readonly SettingsRegistryEntry[];

export type SettingRegistryKey = (typeof SETTINGS_REGISTRY)[number]['key'];

export const SETTINGS_REGISTRY_KEYS = new Set<string>(
  SETTINGS_REGISTRY.map((setting) => setting.key),
);

export function assertDeclaredSettingKeys(keys: readonly string[]): readonly SettingRegistryKey[] {
  const unknown = keys.filter((key) => !SETTINGS_REGISTRY_KEYS.has(key));
  if (unknown.length > 0) {
    throw new Error(`Settings fiscaux non déclarés dans le registry : ${unknown.join(', ')}`);
  }
  return keys as readonly SettingRegistryKey[];
}

export function getSettingsRegistryEntry(key: string): SettingsRegistryEntry {
  const entry = SETTINGS_REGISTRY.find((setting) => setting.key === key);
  if (!entry) {
    throw new Error(`Setting fiscal/métier introuvable : ${key}`);
  }
  return entry;
}

export function listSettingsByStatus(status: SettingsRegistryStatus): SettingsRegistryEntry[] {
  return SETTINGS_REGISTRY.filter((setting) => setting.status === status);
}

export function listSettingsForOwnerPage(pagePath: SettingsOwnerPagePath): SettingsRegistryEntry[] {
  return SETTINGS_REGISTRY.filter((setting) => setting.ownerSettingsPage === pagePath);
}

export function listSettingsForSimulator(simulatorId: string): SettingsRegistryEntry[] {
  return SETTINGS_REGISTRY.filter((setting) =>
    setting.consumerSimulatorIds.some((consumerSimulatorId) => consumerSimulatorId === simulatorId),
  );
}
