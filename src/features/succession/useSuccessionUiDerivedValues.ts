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
import {
  getBirthDateLabels,
  isCoupleSituation,
} from './successionSimulator.helpers';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionAssuranceVieEntry,
  FamilyBranch,
  FamilyMember,
  SuccessionEnfant,
  SuccessionPrimarySide,
} from './successionDraft';
import type {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
} from './successionDraft';

interface UseSuccessionUiDerivedValuesInput {
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  isMarried: boolean;
  isPacsed: boolean;
  isConcubinage: boolean;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  assetEntries: SuccessionAssetDetailEntry[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  assuranceVieDraft: SuccessionAssuranceVieEntry[];
}

export function useSuccessionUiDerivedValues({
  civilContext,
  isMarried,
  isPacsed,
  isConcubinage,
  enfantsContext,
  familyMembers,
  assetEntries,
  assuranceVieEntries,
  assuranceVieDraft,
}: UseSuccessionUiDerivedValuesInput) {
  const birthDateLabels = useMemo(
    () => getBirthDateLabels(civilContext.situationMatrimoniale),
    [civilContext.situationMatrimoniale],
  );
  const showSecondBirthDate = isCoupleSituation(civilContext.situationMatrimoniale);

  const assetOwnerOptions = useMemo((): { value: SuccessionAssetOwner; label: string }[] => {
    if (isMarried) {
      return [
        { value: 'epoux1', label: 'Époux 1' },
        { value: 'epoux2', label: 'Époux 2' },
        { value: 'commun', label: 'Communauté' },
      ];
    }
    if (isPacsed) {
      return [
        { value: 'epoux1', label: 'Partenaire 1' },
        { value: 'epoux2', label: 'Partenaire 2' },
        { value: 'commun', label: 'Indivision' },
      ];
    }
    if (isConcubinage) {
      return [
        { value: 'epoux1', label: 'Personne 1' },
        { value: 'epoux2', label: 'Personne 2' },
        { value: 'commun', label: 'Indivision' },
      ];
    }
    return [{ value: 'epoux1', label: 'Défunt(e)' }];
  }, [isConcubinage, isMarried, isPacsed]);

  const assuranceViePartyOptions = useMemo(
    () => assetOwnerOptions.filter((option) => option.value !== 'commun') as { value: 'epoux1' | 'epoux2'; label: string }[],
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
      frere_soeur: 'Frère/Sœur',
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
        { value: 'epoux1', label: 'Côté Partenaire 1' },
        { value: 'epoux2', label: 'Côté Partenaire 2' },
      ];
    }
    if (situation === 'divorce') {
      return [
        { value: 'epoux1', label: 'Côté Défunt(e)' },
        { value: 'epoux2', label: 'Côté Ex-conjoint(e)' },
      ];
    }
    if (situation === 'celibataire' || situation === 'veuf') {
      return [
        { value: 'epoux1', label: 'Côté Défunt(e)' },
      ];
    }
    return BRANCH_OPTIONS;
  }, [civilContext.situationMatrimoniale]);

  const assetBreakdown = useMemo(() => assetEntries.reduce((totals, entry) => {
    if (entry.category === 'passif') {
      totals.passifs[entry.owner] += entry.amount;
    } else {
      totals.actifs[entry.owner] += entry.amount;
    }
    return totals;
  }, {
    actifs: {
      epoux1: 0,
      epoux2: 0,
      commun: 0,
    },
    passifs: {
      epoux1: 0,
      epoux2: 0,
      commun: 0,
    },
  } as {
    actifs: Record<SuccessionAssetOwner, number>;
    passifs: Record<SuccessionAssetOwner, number>;
  }), [assetEntries]);

  const assetNetTotals = useMemo(() => ({
    epoux1: Math.max(0, assetBreakdown.actifs.epoux1 - assetBreakdown.passifs.epoux1),
    epoux2: Math.max(0, assetBreakdown.actifs.epoux2 - assetBreakdown.passifs.epoux2),
    commun: Math.max(0, assetBreakdown.actifs.commun - assetBreakdown.passifs.commun),
  }), [assetBreakdown]);

  const assuranceVieTotals = useMemo(() => assuranceVieEntries.reduce((totals, entry) => ({
    capitaux: totals.capitaux + entry.capitauxDeces,
    versementsApres70: totals.versementsApres70 + entry.versementsApres70,
  }), {
    capitaux: 0,
    versementsApres70: 0,
  }), [assuranceVieEntries]);

  const assuranceVieDraftTotals = useMemo(() => assuranceVieDraft.reduce((totals, entry) => ({
    capitaux: totals.capitaux + entry.capitauxDeces,
    versementsApres70: totals.versementsApres70 + entry.versementsApres70,
  }), {
    capitaux: 0,
    versementsApres70: 0,
  }), [assuranceVieDraft]);

  const assuranceVieByAssure = useMemo(() => assuranceVieEntries.reduce((totals, entry) => {
    totals[entry.assure] += entry.capitauxDeces;
    return totals;
  }, {
    epoux1: 0,
    epoux2: 0,
  } as Record<'epoux1' | 'epoux2', number>), [assuranceVieEntries]);

  const assetEntriesByCategory = useMemo(() => ASSET_CATEGORY_OPTIONS.map((category) => ({
    ...category,
    entries: assetEntries.filter((entry) => entry.category === category.value),
  })), [assetEntries]);

  return {
    birthDateLabels,
    showSecondBirthDate,
    assetOwnerOptions,
    assuranceViePartyOptions,
    canOpenDispositionsModal,
    testamentSides,
    descendantBranchesBySide,
    testamentBeneficiaryOptionsBySide,
    donateurOptions,
    donatairesOptions,
    branchOptions,
    assetBreakdown,
    assetNetTotals,
    assuranceVieTotals,
    assuranceVieDraftTotals,
    assuranceVieByAssure,
    assetEntriesByCategory,
  };
}
