import type {
  SettingsCurrentValue,
  SettingsDefaultTable,
  SettingsLegalSourceContract,
  SettingsOwnerPagePath,
  SettingsReferenceTarget,
} from './types';

export function settingsDefault(
  table: SettingsDefaultTable,
  path: string,
): SettingsReferenceTarget {
  return { kind: 'settings-default', table, path };
}

export function currentJsonb(table: SettingsDefaultTable, path: string): SettingsCurrentValue {
  return { kind: 'supabase-jsonb', table, path };
}

export function completeSource(
  refIds: readonly string[],
  settingsReferenceClaimKeys: readonly string[],
  note: string,
): SettingsLegalSourceContract {
  return {
    status: 'complete',
    refIds,
    settingsReferenceClaimKeys,
    note,
  };
}

export function sourceToComplete(
  referenceToComplete: string,
  note: string,
  refIds: readonly string[] = [],
): SettingsLegalSourceContract {
  return {
    status: 'a-completer',
    refIds,
    settingsReferenceClaimKeys: [],
    note,
    referenceToComplete,
  };
}

export const percentValidation = {
  validators: ['validatePercent'],
  rules: ['Taux compris entre 0 et 100, exprimé en pourcentage utilisateur.'],
  requiredBeforeConsumption: true,
} as const;

export const scaleValidation = {
  validators: ['validateScaleOrdered', 'validatePositive', 'validatePercent'],
  rules: ['Barème ordonné, bornes positives, taux en pourcentage.'],
  requiredBeforeConsumption: true,
} as const;

export const plannedValidation = {
  validators: ['check:settings-registry'],
  rules: [
    'Aucune valeur planned ne doit être exposée en édition ni consommée par un simulateur.',
    'La référence officielle doit être complétée avant passage en partial ou ready.',
  ],
  requiredBeforeConsumption: true,
} as const;

export const ownerMemento: SettingsOwnerPagePath = '/settings/memento';
export const ownerDmtg: SettingsOwnerPagePath = '/settings/dmtg-succession';
