import type { LegalReferenceId } from '@/domain/legal-references';
import type { SettingsDefaultTable, SettingsReferenceTarget } from '@/domain/settings-references';

export type { SettingsDefaultTable, SettingsReferenceTarget };

export type SettingsFamilyId =
  | 'impots'
  | 'comptables-societes'
  | 'immobilier'
  | 'transmission'
  | 'retraite-prevoyance'
  | 'placements'
  | 'social-dirigeant';

export type SettingsValueType =
  | 'amount'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'percent'
  | 'scale'
  | 'threshold'
  | 'ruleset'
  | 'object';

export type SettingsUnit = 'eur' | 'percent' | 'year' | 'month' | 'date' | 'ratio' | 'none';

export type SettingsRegistryStatus = 'ready' | 'partial' | 'planned';
export type SettingsReferenceStatus = 'complete' | 'a-completer';
export type SettingsMillesime = `${number}` | 'a-renseigner-avant-codage';

export type SettingsOwnerPagePath =
  | '/settings/memento'
  | '/settings/base-contrat'
  | '/settings/base-contrat-retraite'
  | '/settings/prevoyance-regimes';

export type SettingsCurrentValue =
  | {
      kind: 'supabase-jsonb';
      table: SettingsDefaultTable;
      path: string;
    }
  | {
      kind: 'supabase-table';
      table:
        | 'pass_history'
        | 'prevoyance_regime_settings'
        | 'prevoyance_maintien_employeur_settings';
      path: string;
    }
  | {
      kind: 'runtime-catalog';
      source: 'base-contrat';
      path: string;
    };

export interface SettingsValidationContract {
  validators: readonly string[];
  rules: readonly string[];
  requiredBeforeConsumption: boolean;
}

export interface SettingsLegalSourceContract {
  status: SettingsReferenceStatus;
  refIds: readonly LegalReferenceId[];
  settingsReferenceClaimKeys: readonly string[];
  note: string;
  referenceToComplete?: string;
}

export interface SettingsFamilyDefinition {
  id: SettingsFamilyId;
  label: string;
  description: string;
  ownerPages: readonly SettingsOwnerPagePath[];
  status: SettingsRegistryStatus;
}

export interface SettingsRegistryEntry {
  family: SettingsFamilyId;
  key: string;
  label: string;
  description: string;
  valueType: SettingsValueType;
  unit: SettingsUnit;
  millesime: SettingsMillesime;
  effectiveFrom?: string;
  effectiveTo?: string;
  source: SettingsLegalSourceContract;
  defaultValue: SettingsReferenceTarget | null;
  currentValue: SettingsCurrentValue | null;
  validation: SettingsValidationContract;
  ownerSettingsPage: SettingsOwnerPagePath;
  consumerSimulatorIds: readonly string[];
  status: SettingsRegistryStatus;
  statusReason: string;
}

export interface SettingsRegistryValidationResult {
  ok: boolean;
  errors: string[];
}
