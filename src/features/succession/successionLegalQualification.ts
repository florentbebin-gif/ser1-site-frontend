import type {
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssetLegalNature,
  SuccessionAssetOrigin,
  SuccessionCivilContext,
  SuccessionMeubleImmeubleLegal,
  SuccessionPatrimonialContext,
} from './successionDraft.types';
import type { SuccessionAssetPocket } from './successionPatrimonialModel';

export const SUCCESSION_ASSET_LEGAL_NATURE_OPTIONS: Array<{
  value: SuccessionAssetLegalNature;
  label: string;
}> = [
  { value: 'non_qualifie', label: 'Non qualifie' },
  { value: 'propre', label: 'Propre' },
  { value: 'propre_par_nature', label: 'Propre par nature' },
  { value: 'commun', label: 'Commun' },
];

export const SUCCESSION_ASSET_ORIGIN_OPTIONS: Array<{
  value: SuccessionAssetOrigin;
  label: string;
}> = [
  { value: 'non_precise', label: 'Non precisee' },
  { value: 'avant_union', label: 'Avant union' },
  { value: 'acquisition_onereuse', label: 'Acquisition onereuse' },
  { value: 'donation_succession', label: 'Donation / succession' },
  { value: 'emploi_remploi', label: 'Emploi / remploi' },
  { value: 'clause_matrimoniale', label: 'Clause matrimoniale' },
];

export const SUCCESSION_MEUBLE_IMMEUBLE_LEGAL_OPTIONS: Array<{
  value: SuccessionMeubleImmeubleLegal;
  label: string;
}> = [
  { value: 'non_qualifie', label: 'Auto (selon categorie)' },
  { value: 'meuble', label: 'Meuble' },
  { value: 'immeuble', label: 'Immeuble' },
];

export function getDefaultSuccessionMeubleImmeubleLegal(
  category: SuccessionAssetCategory,
): SuccessionMeubleImmeubleLegal {
  if (category === 'immobilier') return 'immeuble';
  if (category === 'passif') return 'non_qualifie';
  return 'meuble';
}

export function getEffectiveSuccessionMeubleImmeubleLegal(
  entry: Pick<SuccessionAssetDetailEntry, 'category' | 'meubleImmeubleLegal'>,
): SuccessionMeubleImmeubleLegal {
  if (entry.meubleImmeubleLegal && entry.meubleImmeubleLegal !== 'non_qualifie') {
    return entry.meubleImmeubleLegal;
  }
  return getDefaultSuccessionMeubleImmeubleLegal(entry.category);
}

function keepsSeparateQualifiedPocket(
  legalNature: SuccessionAssetDetailEntry['legalNature'],
): boolean {
  return legalNature === 'propre' || legalNature === 'propre_par_nature';
}

export function resolveSuccessionQualifiedAssetPocket({
  civilContext,
  patrimonialContext,
  entry,
  pocket,
}: {
  civilContext: Pick<SuccessionCivilContext, 'situationMatrimoniale' | 'regimeMatrimonial'>;
  patrimonialContext?: Pick<SuccessionPatrimonialContext, 'stipulationContraireCU'>;
  entry: Pick<
    SuccessionAssetDetailEntry,
    'category' | 'legalNature' | 'meubleImmeubleLegal'
  >;
  pocket: SuccessionAssetPocket;
}): SuccessionAssetPocket {
  if (entry.category === 'passif' || civilContext.situationMatrimoniale !== 'marie') {
    return pocket;
  }

  if (civilContext.regimeMatrimonial === 'communaute_universelle') {
    const canKeepSeparateOwnPocket = (
      patrimonialContext?.stipulationContraireCU
      && entry.legalNature === 'propre_par_nature'
      && (pocket === 'epoux1' || pocket === 'epoux2')
    );
    return canKeepSeparateOwnPocket ? pocket : 'communaute';
  }

  if (civilContext.regimeMatrimonial === 'communaute_meubles_acquets') {
    if (keepsSeparateQualifiedPocket(entry.legalNature)) {
      return pocket;
    }
    return getEffectiveSuccessionMeubleImmeubleLegal(entry) === 'meuble'
      ? 'communaute'
      : pocket;
  }

  return pocket;
}
