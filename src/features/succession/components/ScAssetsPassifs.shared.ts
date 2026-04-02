import type {
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
} from '../successionDraft.types';
import type { SuccessionLegacyAssetOwner } from '../successionDraft';
import {
  ASSET_SUBCATEGORY_OPTIONS,
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
} from '../successionSimulator.constants';

export interface ScAssetsOwnerFlags {
  isMarried: boolean;
  isPacsed: boolean;
  isConcubinage: boolean;
}

export function getActifNetLabel(
  owner: SuccessionLegacyAssetOwner,
  flags: ScAssetsOwnerFlags,
): string {
  if (owner === 'epoux1') {
    if (flags.isPacsed) return 'Actif net partenaire 1';
    if (flags.isMarried) return 'Actif net époux 1';
    if (flags.isConcubinage) return 'Actif net personne 1';
    return 'Actif net (vous)';
  }
  if (owner === 'epoux2') {
    if (flags.isPacsed) return 'Actif net partenaire 2';
    if (flags.isMarried) return 'Actif net époux 2';
    return 'Actif net personne 2';
  }
  return flags.isPacsed || flags.isConcubinage ? 'Masse indivise nette' : 'Masse commune nette';
}

export function buildSubCategoryOptions(
  entry: SuccessionAssetDetailEntry,
  residencePrincipaleEntryId: string | null,
): { value: string; label: string }[] {
  const hasResidencePrincipale = residencePrincipaleEntryId !== null;
  const isCurrentResidencePrincipale = entry.id === residencePrincipaleEntryId;

  return ASSET_SUBCATEGORY_OPTIONS[entry.category as SuccessionAssetCategory]
    .filter((option) => (
      entry.category !== 'immobilier'
      || option !== RESIDENCE_PRINCIPALE_SUBCATEGORY
      || !hasResidencePrincipale
      || isCurrentResidencePrincipale
    ))
    .map((option) => ({
      value: option,
      label: option,
    }));
}
