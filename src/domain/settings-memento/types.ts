import type { LegalReferenceId } from '@/domain/legal-references';
import type { SettingRegistryKey, SettingsOwnerPagePath } from '@/domain/settings-registry';

export const MEMENTO_STATUS_VALUES = [
  'couvert',
  'partiel',
  'planned',
  'absent',
  'a_verifier',
  'blocked_missing_official_source',
] as const;

export type MementoStatus = (typeof MEMENTO_STATUS_VALUES)[number];

export const MEMENTO_COVERAGE_SOURCE_VALUES = [
  'laplace',
  'excel-charges-sociales',
  'pdf-retraite',
] as const;

export type MementoCoverageSource = (typeof MEMENTO_COVERAGE_SOURCE_VALUES)[number];

export type MementoChapterId =
  | 'foyer'
  | 'civil'
  | 'patrimoine'
  | 'fiscalite-foyer'
  | 'transmission'
  | 'placements'
  | 'immobilier'
  | 'arbitrage'
  | 'retraite'
  | 'epargne-retraite'
  | 'prevoyance'
  | 'societe'
  | 'dirigeant'
  | 'transmission-entreprise';

export interface MementoChapter {
  id: MementoChapterId;
  label: string;
  description: string;
}

export interface MementoEntry {
  chapterId: MementoChapterId;
  key: string;
  label: string;
  description: string;
  status: MementoStatus;
  statusReason: string;
  ownerPagePath: SettingsOwnerPagePath | null;
  registryKeys: readonly SettingRegistryKey[];
  claimKeys: readonly string[];
  refIds: readonly LegalReferenceId[];
  coverageSources: readonly MementoCoverageSource[];
  relatedSimulatorIds: readonly string[];
}

export interface MementoTaxonomyValidationResult {
  ok: boolean;
  errors: string[];
}
