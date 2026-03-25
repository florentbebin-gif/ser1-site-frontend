import { useMemo } from 'react';
import {
  countEffectiveDescendantBranchesForDeceased,
} from './successionEnfants';
import { canOpenDispositions } from './successionDispositions';
import { buildTestamentBeneficiaryOptions } from './successionTestament';
import {
  ASSET_CATEGORY_OPTIONS,
  BRANCH_OPTIONS,
  TESTAMENT_SIDES,
} from './successionSimulator.constants';
import { computeSuccessionAssetValuation } from './successionAssetValuation';
import {
  buildSuccessionAssetOwnerOptions,
  buildSuccessionAssetPocketOptions,
  type SuccessionAssetPocket,
} from './successionDraft';
import {
  buildPrevoyanceClauseOptions,
  getBirthDateLabels,
  isCoupleSituation,
} from './successionSimulator.helpers';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionPersonParty,
  SuccessionAssuranceVieEntry,
  FamilyBranch,
  FamilyMember,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  SuccessionPrimarySide,
} from './successionDraft';
import type {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
} from './successionDraft';

interface UseSuccessionUiDerivedValuesInput {
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  isMarried: boolean;
  isPacsed: boolean;
  isConcubinage: boolean;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  forfaitMobilierMode: typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.forfaitMobilierMode;
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
}

export function useSuccessionUiDerivedValues({
  civilContext,
  isMarried,
  isPacsed,
  isConcubinage: _isConcubinage,
  enfantsContext,
  familyMembers,
  assetEntries,
  groupementFoncierEntries,
  assuranceVieEntries,
  perEntries,
  prevoyanceDecesEntries,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  abattementResidencePrincipale,
}: UseSuccessionUiDerivedValuesInput) {
  const birthDateLabels = useMemo(
    () => getBirthDateLabels(civilContext.situationMatrimoniale),
    [civilContext.situationMatrimoniale],
  );
  const showSecondBirthDate = isCoupleSituation(civilContext.situationMatrimoniale);

  const assetOwnerOptions = useMemo(
    (): { value: SuccessionAssetOwner; label: string }[] => buildSuccessionAssetOwnerOptions({
      situationMatrimoniale: civilContext.situationMatrimoniale,
      regimeMatrimonial: civilContext.regimeMatrimonial,
      pacsConvention: civilContext.pacsConvention,
    }),
    [civilContext.pacsConvention, civilContext.regimeMatrimonial, civilContext.situationMatrimoniale],
  );

  const assetPocketOptions = useMemo(
    (): { value: SuccessionAssetPocket; label: string }[] => buildSuccessionAssetPocketOptions({
      situationMatrimoniale: civilContext.situationMatrimoniale,
      regimeMatrimonial: civilContext.regimeMatrimonial,
      pacsConvention: civilContext.pacsConvention,
    }),
    [civilContext.pacsConvention, civilContext.regimeMatrimonial, civilContext.situationMatrimoniale],
  );

  const assuranceViePartyOptions = useMemo(
    (): { value: SuccessionPersonParty; label: string }[] => assetOwnerOptions
      .filter((option): option is { value: SuccessionPersonParty; label: string } => option.value !== 'commun'),
    [assetOwnerOptions],
  );

  const canOpenDispositionsModal = useMemo(
    () => canOpenDispositions(civilContext.situationMatrimoniale, enfantsContext, familyMembers),
    [civilContext.situationMatrimoniale, enfantsContext, familyMembers],
  );

  const testamentSides = useMemo(
    () => (isCoupleSituation(civilContext.situationMatrimoniale) ? TESTAMENT_SIDES : ['epoux1']) as SuccessionPrimarySide[],
    [civilContext.situationMatrimoniale],
  );

  const descendantBranchesBySide = useMemo(() => ({
    epoux1: countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, 'epoux1'),
    epoux2: countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, 'epoux2'),
  }), [enfantsContext, familyMembers]);

  const testamentBeneficiaryOptionsBySide = useMemo(
    () => ({
      epoux1: buildTestamentBeneficiaryOptions(
        civilContext.situationMatrimoniale,
        'epoux1',
        enfantsContext,
        familyMembers,
      ),
      epoux2: buildTestamentBeneficiaryOptions(
        civilContext.situationMatrimoniale,
        'epoux2',
        enfantsContext,
        familyMembers,
      ),
    }),
    [civilContext.situationMatrimoniale, enfantsContext, familyMembers],
  );

  const donateurOptions = useMemo(
    () => assetOwnerOptions.filter((option) => option.value !== 'commun'),
    [assetOwnerOptions],
  );

  const donatairesOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    if (isMarried) options.push({ value: 'conjoint', label: 'Conjoint(e)' });
    else if (isPacsed) options.push({ value: 'conjoint', label: 'Partenaire' });

    enfantsContext.forEach((enfant, index) => {
      const prenom = enfant.prenom?.trim();
      options.push({ value: enfant.id, label: prenom ? prenom : `Enfant ${index + 1}` });
    });

    const memberTypeLabel: Record<string, string> = {
      petit_enfant: 'Petit-enfant',
      parent: 'Parent',
      frere_soeur: 'Frere/Soeur',
      oncle_tante: 'Oncle/Tante',
      tierce_personne: 'Tierce personne',
    };
    familyMembers.forEach((member) => {
      options.push({ value: member.id, label: memberTypeLabel[member.type] ?? 'Membre' });
    });
    options.push({ value: 'autre', label: 'Autre' });
    return options;
  }, [isMarried, isPacsed, enfantsContext, familyMembers]);

  const branchOptions = useMemo((): { value: FamilyBranch; label: string }[] => {
    const situation = civilContext.situationMatrimoniale;
    if (situation === 'pacse' || situation === 'concubinage') {
      return [
        { value: 'epoux1', label: 'Cote Partenaire 1' },
        { value: 'epoux2', label: 'Cote Partenaire 2' },
      ];
    }
    if (situation === 'divorce') {
      return [
        { value: 'epoux1', label: 'Cote Defunt(e)' },
        { value: 'epoux2', label: 'Cote Ex-conjoint(e)' },
      ];
    }
    if (situation === 'celibataire' || situation === 'veuf') {
      return [
        { value: 'epoux1', label: 'Cote Defunt(e)' },
      ];
    }
    return BRANCH_OPTIONS;
  }, [civilContext.situationMatrimoniale]);

  const assetValuation = useMemo(
    () => computeSuccessionAssetValuation({
      civilContext,
      assetEntries,
      groupementFoncierEntries,
      forfaitMobilierMode,
      forfaitMobilierPct,
      forfaitMobilierMontant,
      abattementResidencePrincipale,
    }),
    [
      civilContext,
      assetEntries,
      groupementFoncierEntries,
      forfaitMobilierMode,
      forfaitMobilierPct,
      forfaitMobilierMontant,
      abattementResidencePrincipale,
    ],
  );

  const assuranceVieTotals = useMemo(() => assuranceVieEntries.reduce((totals, entry) => ({
    capitaux: totals.capitaux + entry.capitauxDeces,
    versementsApres70: totals.versementsApres70 + entry.versementsApres70,
  }), {
    capitaux: 0,
    versementsApres70: 0,
  }), [assuranceVieEntries]);

  const assuranceVieByAssure = useMemo(() => assuranceVieEntries.reduce((totals, entry) => {
    totals[entry.assure] += entry.capitauxDeces;
    return totals;
  }, {
    epoux1: 0,
    epoux2: 0,
  } as Record<'epoux1' | 'epoux2', number>), [assuranceVieEntries]);

  const perTotals = useMemo(() => perEntries.reduce((totals, entry) => ({
    capitaux: totals.capitaux + entry.capitauxDeces,
  }), {
    capitaux: 0,
  }), [perEntries]);

  const perByAssure = useMemo(() => perEntries.reduce((totals, entry) => {
    totals[entry.assure] += entry.capitauxDeces;
    return totals;
  }, {
    epoux1: 0,
    epoux2: 0,
  } as Record<'epoux1' | 'epoux2', number>), [perEntries]);

  const prevoyanceTotals = useMemo(() => prevoyanceDecesEntries.reduce((totals, entry) => ({
    capitaux: totals.capitaux + entry.capitalDeces,
  }), {
    capitaux: 0,
  }), [prevoyanceDecesEntries]);

  const prevoyanceByAssure = useMemo(() => prevoyanceDecesEntries.reduce((totals, entry) => {
    totals[entry.assure] += entry.capitalDeces;
    return totals;
  }, {
    epoux1: 0,
    epoux2: 0,
  } as Record<'epoux1' | 'epoux2', number>), [prevoyanceDecesEntries]);

  const prevoyanceClauseOptions = useMemo(
    () => buildPrevoyanceClauseOptions(enfantsContext, familyMembers),
    [enfantsContext, familyMembers],
  );

  const assetEntriesByCategory = useMemo(() => ASSET_CATEGORY_OPTIONS.map((category) => ({
    ...category,
    entries: assetEntries.filter((entry) => entry.category === category.value),
  })), [assetEntries]);

  return {
    birthDateLabels,
    showSecondBirthDate,
    assetOwnerOptions,
    assetPocketOptions,
    assuranceViePartyOptions,
    canOpenDispositionsModal,
    testamentSides,
    descendantBranchesBySide,
    testamentBeneficiaryOptionsBySide,
    donateurOptions,
    donatairesOptions,
    branchOptions,
    assetBreakdown: assetValuation.assetBreakdown,
    actifsTaxablesParOwner: assetValuation.actifsTaxablesParOwner,
    assetNetTotals: assetValuation.assetNetTotals,
    forfaitMobilierComputed: assetValuation.forfaitMobilierComputed,
    forfaitMobilierParOwner: assetValuation.forfaitMobilierParOwner,
    hasResidencePrincipale: assetValuation.hasResidencePrincipale,
    residencePrincipaleEntryId: assetValuation.residencePrincipaleEntryId,
    transmissionBasis: assetValuation.transmissionBasis,
    assuranceVieTotals,
    assuranceVieByAssure,
    perTotals,
    perByAssure,
    prevoyanceTotals,
    prevoyanceByAssure,
    prevoyanceClauseOptions,
    hasBeneficiaryLevelGfAdjustment: assetValuation.transmissionBasis.hasBeneficiaryLevelGfAdjustment,
    assetEntriesByCategory,
  };
}
