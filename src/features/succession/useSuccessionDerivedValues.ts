/**
 * useSuccessionDerivedValues — Valeurs dérivées du simulateur Succession.
 *
 * Extrait de SuccessionSimulator.tsx (PR-P1-07-03).
 * Pure computation : aucun effet de bord, aucun setState.
 * useFiscalContext({ strict: true }) reste dans SuccessionSimulator.
 */

import { useMemo } from 'react';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import {
  countEffectiveDescendantBranches,
  countEffectiveDescendantBranchesForDeceased,
  countLivingEnfants,
  countLivingNonCommuns,
  getEnfantRattachementOptions,
} from './successionEnfants';
import { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import { buildSuccessionPredecesAnalysis } from './successionPredeces';
import { canOpenDispositions } from './successionDispositions';
import { buildTestamentBeneficiaryOptions } from './successionTestament';
import {
  buildSuccessionChainageAnalysis,
  type SuccessionChainOrder,
} from './successionChainage';
import {
  buildSuccessionChainTransmissionRows,
  buildSuccessionDirectDisplayAnalysis,
  computeSuccessionDirectEstateBasis,
} from './successionDisplay';
import { buildSuccessionDevolutionAnalysis } from './successionDevolution';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';
import {
  ASSET_CATEGORY_OPTIONS,
  BRANCH_OPTIONS,
  DONATION_ENTRE_EPOUX_OPTIONS,
  TESTAMENT_SIDES,
} from './successionSimulator.constants';
import {
  getBirthDateLabels,
  getDonationEffectiveAmount,
  getTestamentParticularLegaciesTotal,
  isCoupleSituation,
} from './successionSimulator.helpers';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionAssuranceVieEntry,
  FamilyBranch,
  FamilyMember,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionPrimarySide,
} from './successionDraft';
import {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
} from './successionDraft';

interface UseSuccessionDerivedValuesInput {
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  liquidationContext: typeof DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT;
  assetEntries: SuccessionAssetDetailEntry[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  assuranceVieDraft: SuccessionAssuranceVieEntry[];
  devolutionContext: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT;
  patrimonialContext: typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT;
  donationsContext: SuccessionDonationEntry[];
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  fiscalSnapshot: SuccessionFiscalSnapshot;
  chainOrder: SuccessionChainOrder;
  canExport: boolean;
}

 
export function useSuccessionDerivedValues({
  civilContext,
  liquidationContext,
  assetEntries,
  assuranceVieEntries,
  assuranceVieDraft,
  devolutionContext,
  patrimonialContext,
  donationsContext,
  enfantsContext,
  familyMembers,
  fiscalSnapshot,
  chainOrder,
  canExport,
}: UseSuccessionDerivedValuesInput) {
  // ── Compteurs familiaux ────────────────────────────────────────────────────

  const nbEnfants = useMemo(() => countLivingEnfants(enfantsContext), [enfantsContext]);
  const nbDescendantBranches = useMemo(
    () => countEffectiveDescendantBranches(enfantsContext, familyMembers),
    [enfantsContext, familyMembers],
  );
  const nbEnfantsNonCommuns = useMemo(
    () => countLivingNonCommuns(enfantsContext),
    [enfantsContext],
  );
  const donationTotals = useMemo(() => donationsContext.reduce((totals, entry) => {
    const amount = getDonationEffectiveAmount(entry);
    if (entry.type === 'rapportable') totals.rapportable += amount;
    if (entry.type === 'hors_part') totals.horsPart += amount;
    return totals;
  }, {
    rapportable: 0,
    horsPart: 0,
    legsParticuliers: getTestamentParticularLegaciesTotal(devolutionContext.testamentsBySide),
  }), [donationsContext, devolutionContext.testamentsBySide]);

  const enfantRattachementOptions = useMemo(
    () => getEnfantRattachementOptions(civilContext.situationMatrimoniale),
    [civilContext.situationMatrimoniale],
  );

  const branchOptions = useMemo((): { value: FamilyBranch; label: string }[] => {
    const s = civilContext.situationMatrimoniale;
    if (s === 'pacse' || s === 'concubinage') return [
      { value: 'epoux1', label: 'Côté Partenaire 1' },
      { value: 'epoux2', label: 'Côté Partenaire 2' },
    ];
    if (s === 'divorce') return [
      { value: 'epoux1', label: 'Côté Défunt(e)' },
      { value: 'epoux2', label: "Côté Ex-conjoint(e)" },
    ];
    if (s === 'celibataire' || s === 'veuf') return [
      { value: 'epoux1', label: 'Côté Défunt(e)' },
    ];
    return BRANCH_OPTIONS;
  }, [civilContext.situationMatrimoniale]);

  // ── Analyses moteur ────────────────────────────────────────────────────────

  const predecesAnalysis = useMemo(
    () => buildSuccessionPredecesAnalysis(
      civilContext,
      { ...liquidationContext, nbEnfants: nbDescendantBranches },
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
    ),
    [civilContext, liquidationContext, nbDescendantBranches, fiscalSnapshot.dmtgSettings, patrimonialContext.attributionBiensCommunsPct],
  );
  const chainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants: nbDescendantBranches },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
      patrimonial: {
        donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
        donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
      },
      enfantsContext,
      familyMembers,
      devolution: devolutionContext,
    }),
    [
      civilContext,
      liquidationContext,
      nbDescendantBranches,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      enfantsContext,
      familyMembers,
      devolutionContext,
    ],
  );
  const directEstateBasis = useMemo(
    () => computeSuccessionDirectEstateBasis(civilContext, liquidationContext, chainOrder),
    [civilContext, liquidationContext, chainOrder],
  );

  const derivedActifNetSuccession = chainageAnalysis.step1?.actifTransmis ?? directEstateBasis.actifNetSuccession;

  const devolutionAnalysis = useMemo(
    () => buildSuccessionDevolutionAnalysis(
      civilContext,
      nbDescendantBranches,
      {
        ...devolutionContext,
        nbEnfantsNonCommuns,
      },
      derivedActifNetSuccession,
      patrimonialContext.legsParticuliers,
      enfantsContext,
      familyMembers,
      {
        patrimonial: {
          donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
          donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
        },
        simulatedDeceased: chainOrder,
      },
    ),
    [
      civilContext,
      nbDescendantBranches,
      devolutionContext,
      nbEnfantsNonCommuns,
      derivedActifNetSuccession,
      patrimonialContext.legsParticuliers,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      enfantsContext,
      familyMembers,
      chainOrder,
    ],
  );

  const isMarried = civilContext.situationMatrimoniale === 'marie';
  const isPacsed = civilContext.situationMatrimoniale === 'pacse';
  const isConcubinage = civilContext.situationMatrimoniale === 'concubinage';
  const isCommunityRegime = isMarried && (
    civilContext.regimeMatrimonial === 'communaute_legale'
    || civilContext.regimeMatrimonial === 'communaute_universelle'
    || civilContext.regimeMatrimonial === 'communaute_meubles_acquets'
  );
  const isPacsIndivision = isPacsed && civilContext.pacsConvention === 'indivision';
  const showSharedTransmissionPct = isCommunityRegime || isPacsIndivision;
  const showDonationEntreEpoux = isMarried;

  const patrimonialSimulatedDeceased = civilContext.situationMatrimoniale === 'marie'
    ? chainOrder
    : directEstateBasis.simulatedDeceased;

  const patrimonialAnalysis = useMemo(
    () => buildSuccessionPatrimonialAnalysis(
      civilContext,
      derivedActifNetSuccession,
      nbDescendantBranches,
      patrimonialContext,
      donationsContext,
      fiscalSnapshot,
      {
        simulatedDeceased: patrimonialSimulatedDeceased,
        testament: devolutionContext.testamentsBySide[patrimonialSimulatedDeceased],
      },
    ),
    [
      civilContext,
      derivedActifNetSuccession,
      nbDescendantBranches,
      patrimonialContext,
      donationsContext,
      fiscalSnapshot,
      patrimonialSimulatedDeceased,
      devolutionContext.testamentsBySide,
    ],
  );

  // ── Dérivés UI ─────────────────────────────────────────────────────────────

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
    () => assetOwnerOptions.filter((o) => o.value !== 'commun'),
    [assetOwnerOptions],
  );

  const donatairesOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    if (isMarried) opts.push({ value: 'conjoint', label: 'Conjoint(e)' });
    else if (isPacsed) opts.push({ value: 'conjoint', label: 'Partenaire' });
    enfantsContext.forEach((enfant, idx) => {
      const prenom = enfant.prenom?.trim();
      opts.push({ value: enfant.id, label: prenom ? prenom : `Enfant ${idx + 1}` });
    });
    const memberTypeLabel: Record<string, string> = {
      petit_enfant: 'Petit-enfant',
      parent: 'Parent',
      frere_soeur: 'Frère/Sœur',
      oncle_tante: 'Oncle/Tante',
      tierce_personne: 'Tierce personne',
    };
    familyMembers.forEach((member) => {
      opts.push({ value: member.id, label: memberTypeLabel[member.type] ?? 'Membre' });
    });
    opts.push({ value: 'autre', label: 'Autre' });
    return opts;
  }, [isMarried, isPacsed, enfantsContext, familyMembers]);

  // ── Actifs / passifs ───────────────────────────────────────────────────────

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

  const avFiscalAnalysis = useMemo(
    () => buildSuccessionAvFiscalAnalysis(
      assuranceVieEntries,
      civilContext,
      enfantsContext,
      familyMembers,
      fiscalSnapshot,
    ),
    [assuranceVieEntries, civilContext, enfantsContext, familyMembers, fiscalSnapshot],
  );

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

  // ── Affichage résultats ────────────────────────────────────────────────────

  const displayUsesChainage = Boolean(isMarried
    && chainageAnalysis.applicable
    && chainageAnalysis.step1
    && chainageAnalysis.step2);

  const displayActifNetSuccession = useMemo(
    () => (displayUsesChainage ? derivedActifNetSuccession : directEstateBasis.actifNetSuccession),
    [displayUsesChainage, derivedActifNetSuccession, directEstateBasis.actifNetSuccession],
  );

  const directDisplayAnalysis = useMemo(
    () => buildSuccessionDirectDisplayAnalysis({
      civil: civilContext,
      devolution: devolutionAnalysis,
      devolutionContext,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      order: chainOrder,
      actifNetSuccession: directEstateBasis.actifNetSuccession,
      baseWarnings: directEstateBasis.warnings,
    }),
    [
      civilContext,
      devolutionAnalysis,
      devolutionContext,
      fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      chainOrder,
      directEstateBasis.actifNetSuccession,
      directEstateBasis.warnings,
    ],
  );

  const displayAssuranceVieTransmise = useMemo(() => {
    if (displayUsesChainage) return assuranceVieByAssure[chainageAnalysis.order];
    return assuranceVieByAssure[directDisplayAnalysis.simulatedDeceased];
  }, [
    assuranceVieByAssure,
    chainageAnalysis.order,
    directDisplayAnalysis.simulatedDeceased,
    displayUsesChainage,
  ]);

  const derivedMasseTransmise = useMemo(
    () => displayActifNetSuccession + displayAssuranceVieTransmise,
    [displayActifNetSuccession, displayAssuranceVieTransmise],
  );

  const derivedTotalDroits = useMemo(
    () => (displayUsesChainage
      ? chainageAnalysis.totalDroits
      : (directDisplayAnalysis.result?.totalDroits ?? 0)) + avFiscalAnalysis.totalDroits,
    [displayUsesChainage, chainageAnalysis.totalDroits, directDisplayAnalysis.result?.totalDroits, avFiscalAnalysis.totalDroits],
  );

  const synthDonutTransmis = useMemo(() => {
    if (displayUsesChainage) {
      const step1 = chainageAnalysis.step1;
      const step2 = chainageAnalysis.step2;
      if (!step1 || !step2) return derivedMasseTransmise;
      return step1.actifTransmis
        + step2.actifTransmis
        + assuranceVieByAssure.epoux1
        + assuranceVieByAssure.epoux2;
    }
    return derivedMasseTransmise;
  }, [displayUsesChainage, chainageAnalysis, assuranceVieByAssure, derivedMasseTransmise]);

  const synthHypothese = useMemo(() => {
    if (!isMarried || nbDescendantBranches === 0) return null;
    if (patrimonialContext.donationEntreEpouxActive) {
      const opt = DONATION_ENTRE_EPOUX_OPTIONS.find((o) => o.value === patrimonialContext.donationEntreEpouxOption);
      const spouseBirthDate = chainOrder === 'epoux1'
        ? civilContext.dateNaissanceEpoux2
        : civilContext.dateNaissanceEpoux1;
      const valuationBase = patrimonialContext.donationEntreEpouxOption === 'mixte'
        ? derivedActifNetSuccession * 0.75
        : derivedActifNetSuccession;
      const valuation = (
        patrimonialContext.donationEntreEpouxOption === 'usufruit_total'
        || patrimonialContext.donationEntreEpouxOption === 'mixte'
      )
        ? getUsufruitValuationFromBirthDate(spouseBirthDate, valuationBase)
        : null;
      const baseLabel = `Donation entre époux : ${opt?.label ?? patrimonialContext.donationEntreEpouxOption}`;
      if (valuation) {
        return `${baseLabel} — valorisation art. 669 CGI : usufruit ${Math.round(valuation.tauxUsufruit * 100)}%, nue-propriété ${Math.round(valuation.tauxNuePropriete * 100)}% (usufruitier ${valuation.age} ans)`;
      }
      if (
        patrimonialContext.donationEntreEpouxOption === 'usufruit_total'
        || patrimonialContext.donationEntreEpouxOption === 'mixte'
      ) {
        return `${baseLabel} — valorisation art. 669 CGI en attente de la date de naissance du conjoint survivant`;
      }
      return baseLabel;
    }
    if (nbEnfantsNonCommuns > 0) {
      return `Art. 757 CC : 1/4 en pleine propriété imposé au conjoint survivant en présence d'enfant(s) non commun(s).`;
    }
    if (devolutionContext.choixLegalConjointSansDDV === 'usufruit') {
      const spouseBirthDate = chainOrder === 'epoux1'
        ? civilContext.dateNaissanceEpoux2
        : civilContext.dateNaissanceEpoux1;
      const valuation = getUsufruitValuationFromBirthDate(spouseBirthDate, derivedActifNetSuccession);
      if (valuation) {
        return `Art. 757 CC : usufruit de la totalité retenu — valorisation art. 669 CGI : usufruit ${Math.round(valuation.tauxUsufruit * 100)}%, nue-propriété ${Math.round(valuation.tauxNuePropriete * 100)}% (usufruitier ${valuation.age} ans)`;
      }
      return 'Art. 757 CC : usufruit de la totalité demandé — valorisation art. 669 CGI en attente de la date de naissance du conjoint survivant (repli moteur sur 1/4 en pleine propriété).';
    }
    if (devolutionContext.choixLegalConjointSansDDV === 'quart_pp') {
      return 'Art. 757 CC : 1/4 en pleine propriété retenu au titre du choix légal du conjoint survivant.';
    }
    return 'Hypothèse moteur : 1/4 en pleine propriété pour le conjoint survivant (choix légal non précisé).';
  }, [
    isMarried,
    nbDescendantBranches,
    nbEnfantsNonCommuns,
    devolutionContext.choixLegalConjointSansDDV,
    patrimonialContext.donationEntreEpouxActive,
    patrimonialContext.donationEntreEpouxOption,
    chainOrder,
    civilContext.dateNaissanceEpoux1,
    civilContext.dateNaissanceEpoux2,
    derivedActifNetSuccession,
  ]);

  const transmissionRows = useMemo(() => {
    if (displayUsesChainage) {
      const { order, step1, step2 } = chainageAnalysis;
      if (!step1 || !step2) return [];
      const otherOrder = order === 'epoux1' ? 'epoux2' : 'epoux1';
      const avCapital = assuranceVieByAssure[order] + assuranceVieByAssure[otherOrder];
      return [
        ...buildSuccessionChainTransmissionRows(chainageAnalysis),
        ...(avCapital > 0 ? [{
          id: 'assurance-vie',
          label: 'Assurance-vie',
          brut: avCapital,
          droits: avFiscalAnalysis.totalDroits,
          net: avCapital - avFiscalAnalysis.totalDroits,
        }] : []),
      ];
    }

    return [
      ...directDisplayAnalysis.transmissionRows,
      ...(displayAssuranceVieTransmise > 0 ? [{
        id: 'assurance-vie',
        label: 'Assurance-vie',
        brut: displayAssuranceVieTransmise,
        droits: avFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
        net: displayAssuranceVieTransmise - avFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
      }] : []),
    ];
  }, [
    displayUsesChainage,
    chainageAnalysis,
    assuranceVieByAssure,
    avFiscalAnalysis.totalDroits,
    avFiscalAnalysis.byAssure,
    directDisplayAnalysis.transmissionRows,
    directDisplayAnalysis.simulatedDeceased,
    displayAssuranceVieTransmise,
  ]);

  // ── Payload export ─────────────────────────────────────────────────────────

  const chainageExportPayload = useMemo(
    () => ({
      applicable: displayUsesChainage,
      order: chainageAnalysis.order,
      firstDecedeLabel: chainageAnalysis.firstDecedeLabel,
      secondDecedeLabel: chainageAnalysis.secondDecedeLabel,
      step1: displayUsesChainage && chainageAnalysis.step1 ? {
        actifTransmis: chainageAnalysis.step1.actifTransmis,
        assuranceVieTransmise: assuranceVieByAssure[chainageAnalysis.order],
        masseTotaleTransmise: chainageAnalysis.step1.actifTransmis + assuranceVieByAssure[chainageAnalysis.order],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
        partConjoint: chainageAnalysis.step1.partConjoint,
        partEnfants: chainageAnalysis.step1.partEnfants,
        droitsEnfants: chainageAnalysis.step1.droitsEnfants,
        beneficiaries: chainageAnalysis.step1.beneficiaries.map((beneficiary) => ({
          label: beneficiary.label,
          brut: beneficiary.brut,
          droits: beneficiary.droits,
          net: beneficiary.net,
          exonerated: beneficiary.exonerated ?? false,
        })),
      } : null,
      step2: displayUsesChainage && chainageAnalysis.step2 ? {
        actifTransmis: chainageAnalysis.step2.actifTransmis,
        assuranceVieTransmise: assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        masseTotaleTransmise: chainageAnalysis.step2.actifTransmis
          + assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
        partConjoint: chainageAnalysis.step2.partConjoint,
        partEnfants: chainageAnalysis.step2.partEnfants,
        droitsEnfants: chainageAnalysis.step2.droitsEnfants,
        beneficiaries: chainageAnalysis.step2.beneficiaries.map((beneficiary) => ({
          label: beneficiary.label,
          brut: beneficiary.brut,
          droits: beneficiary.droits,
          net: beneficiary.net,
          exonerated: beneficiary.exonerated ?? false,
        })),
      } : null,
      assuranceVieTotale: assuranceVieTotals.capitaux,
      totalDroits: derivedTotalDroits,
      warnings: displayUsesChainage
        ? [...chainageAnalysis.warnings, ...avFiscalAnalysis.warnings]
        : [
          ...(isPacsed
            ? ['PACS: la synthèse fiscale affichée repose sur le décès simulé du partenaire sélectionné, pas sur une chronologie 2 décès.']
            : ['Chronologie 2 décès non utilisée pour cette situation : la synthèse repose sur la succession directe du défunt simulé.']),
          ...directDisplayAnalysis.warnings,
          ...avFiscalAnalysis.warnings,
        ],
    }),
    [
      displayUsesChainage,
      chainageAnalysis,
      assuranceVieByAssure,
      assuranceVieTotals.capitaux,
      avFiscalAnalysis,
      derivedTotalDroits,
      isPacsed,
      directDisplayAnalysis.warnings,
    ],
  );

  const totalActifsLiquidation = useMemo(
    () => Math.max(
      0,
      liquidationContext.actifEpoux1 + liquidationContext.actifEpoux2 + liquidationContext.actifCommun,
    ),
    [liquidationContext],
  );

  const canExportSimplified = (displayActifNetSuccession > 0 || totalActifsLiquidation > 0 || assuranceVieTotals.capitaux > 0);
  const canExportCurrentMode = canExport && canExportSimplified;

  const attentions = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...predecesAnalysis.warnings,
      ...chainageAnalysis.warnings,
      ...devolutionAnalysis.warnings,
      ...(!displayUsesChainage ? directDisplayAnalysis.warnings : []),
      ...patrimonialAnalysis.warnings,
      ...avFiscalAnalysis.warnings,
    ].filter((warning) => {
      if (seen.has(warning)) return false;
      seen.add(warning);
      return true;
    });
  }, [
    predecesAnalysis.warnings,
    chainageAnalysis.warnings,
    devolutionAnalysis.warnings,
    displayUsesChainage,
    directDisplayAnalysis.warnings,
    patrimonialAnalysis.warnings,
    avFiscalAnalysis.warnings,
  ]);

  const exportHeirs = useMemo(
    () => (displayUsesChainage ? [] : directDisplayAnalysis.heirs).map((heir) => ({
      lien: heir.lien,
      partSuccession: heir.partSuccession,
    })),
    [displayUsesChainage, directDisplayAnalysis.heirs],
  );

  return {
    // Compteurs familiaux
    nbEnfants,
    nbDescendantBranches,
    nbEnfantsNonCommuns,
    donationTotals,
    enfantRattachementOptions,
    branchOptions,
    // Analyses moteur
    predecesAnalysis,
    chainageAnalysis,
    directEstateBasis,
    derivedActifNetSuccession,
    devolutionAnalysis,
    patrimonialAnalysis,
    // Booleans situation
    isMarried,
    isPacsed,
    isConcubinage,
    isCommunityRegime,
    isPacsIndivision,
    showSharedTransmissionPct,
    showDonationEntreEpoux,
    patrimonialSimulatedDeceased,
    // UI labels / options
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
    // Actifs
    assetBreakdown,
    assetNetTotals,
    assetEntriesByCategory,
    // Assurance-vie
    assuranceVieTotals,
    assuranceVieDraftTotals,
    avFiscalAnalysis,
    assuranceVieByAssure,
    // Affichage résultats
    displayUsesChainage,
    displayActifNetSuccession,
    directDisplayAnalysis,
    displayAssuranceVieTransmise,
    derivedMasseTransmise,
    derivedTotalDroits,
    synthDonutTransmis,
    synthHypothese,
    transmissionRows,
    // Export
    chainageExportPayload,
    totalActifsLiquidation,
    canExportSimplified,
    canExportCurrentMode,
    attentions,
    exportHeirs,
  };
}
