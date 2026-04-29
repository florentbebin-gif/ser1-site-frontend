import { countEffectiveDescendantBranches } from './successionEnfants';
import {
  computeFirstEstate,
  computeSocieteAcquetsDistribution,
  computeStep1Split,
} from './successionChainageEstateSplit';
import {
  addSuccessionEstateTaxableBases,
  applyResidencePrincipaleAbatementToEstateBasis,
  buildSuccessionEstateTaxableBasis,
  subtractSuccessionEstateTaxableBases,
  scaleSuccessionEstateTaxableBasis,
} from './successionTransmissionBasis';
import {
  buildSuccessionPreciputCandidates,
  buildSuccessionTargetedPreciputTaxableBasis,
  getSuccessionPreciputEligiblePocket,
  resolveSuccessionPreciputApplication,
} from './successionPreciput';
import {
  computeSuccessionParticipationAcquetsSummary,
} from './successionParticipationAcquets';
import {
  asAmount,
  asChildrenCount,
  buildEmptyAnalysis,
  buildFirstEstatePocketScales,
  buildSurvivorPocketScales,
  buildTargetedPreciputSelectionsSummary,
  computeStepTransmission,
  countSideParents,
  createEmptyEstateTaxableBasis,
  getLabelForSide,
  getOtherSide,
  getStepEligibilityWarnings,
  hasRepresentationOnAnySide,
} from './successionChainage.helpers';
import type {
  SuccessionChainageAnalysis,
  SuccessionChainageInput,
} from './successionChainage.types';

export type {
  SuccessionChainAffectedLiabilitySummary,
  SuccessionChainBeneficiary,
  SuccessionChainInterMassClaimSummary,
  SuccessionChainOrder,
  SuccessionChainPreciputSelectionSummary,
  SuccessionChainPreciputSummary,
  SuccessionChainRegime,
  SuccessionChainSocieteAcquetsSummary,
  SuccessionChainStep,
  SuccessionChainageAnalysis,
} from './successionChainage.types';

export function buildSuccessionChainageAnalysis(
  input: SuccessionChainageInput,
): SuccessionChainageAnalysis {
  const enfantsContext = input.enfantsContext ?? [];
  const familyMembers = input.familyMembers ?? [];
  const nbEnfants = Math.max(
    asChildrenCount(input.liquidation.nbEnfants),
    countEffectiveDescendantBranches(enfantsContext, familyMembers),
  );
  const totalPatrimoine =
    asAmount(input.liquidation.actifEpoux1)
    + asAmount(input.liquidation.actifEpoux2)
    + asAmount(input.liquidation.actifCommun);

  if (!input.regimeUsed) {
    return buildEmptyAnalysis(
      input.order,
      'Chainage disponible pour couples maries ou pacses avec regime de liquidation.',
    );
  }

  if (input.civil.situationMatrimoniale === 'pacse') {
    return buildEmptyAnalysis(
      input.order,
      'PACS: chainage 2 deces non modelise (cf. matrice de maturite). Bascule sur succession directe du defunt simule.',
    );
  }

  const attributionPctBase = input.attributionBiensCommunsPct ?? 50;
  const attributionPct = (
    input.civil.situationMatrimoniale === 'marie'
    && input.civil.regimeMatrimonial === 'communaute_universelle'
    && input.patrimonial?.attributionIntegrale
  ) ? 100 : attributionPctBase;
  const isSocieteAcquetsRegime = input.civil.situationMatrimoniale === 'marie'
    && input.civil.regimeMatrimonial === 'separation_biens_societe_acquets'
    && input.regimeUsed === 'separation_biens';
  const preciputEligiblePocket = getSuccessionPreciputEligiblePocket({
    isCommunityRegime: input.civil.situationMatrimoniale === 'marie'
      && input.regimeUsed !== 'separation_biens'
      && !isSocieteAcquetsRegime,
    isSocieteAcquetsRegime,
  });
  const preciputCandidates = buildSuccessionPreciputCandidates({
    assetEntries: input.assetEntries ?? [],
    groupementFoncierEntries: input.groupementFoncierEntries ?? [],
    allowedPocket: preciputEligiblePocket,
  });
  const resolvedPreciput = resolveSuccessionPreciputApplication({
    patrimonial: input.patrimonial,
    candidates: preciputCandidates,
  });
  const participationAcquetsSummary = computeSuccessionParticipationAcquetsSummary({
    civil: input.civil,
    regimeUsed: input.regimeUsed,
    order: input.order,
    liquidation: input.liquidation,
    patrimonial: input.patrimonial,
  });
  const requestedTargetedPreciputBasis = resolvedPreciput.mode === 'cible'
    ? buildSuccessionTargetedPreciputTaxableBasis(resolvedPreciput.targetedSelections)
    : createEmptyEstateTaxableBasis();
  const preserveQualifiedSeparatePocketsInUniversalCommunity = (
    input.civil.situationMatrimoniale === 'marie'
    && input.civil.regimeMatrimonial === 'communaute_universelle'
    && Boolean(input.patrimonial?.stipulationContraireCU)
  );
  const preciputPatrimonial = resolvedPreciput.mode === 'none'
    ? input.patrimonial
    : {
      ...(input.patrimonial ?? {}),
      preciputMontant: resolvedPreciput.requestedAmount,
    };
  const societeAcquetsDistribution = isSocieteAcquetsRegime
    ? computeSocieteAcquetsDistribution(
      input.order,
      input.societeAcquetsNetValue ?? 0,
      preciputPatrimonial,
    )
    : null;
  const societeAcquetsEstateRatio = (
    societeAcquetsDistribution
    && (input.societeAcquetsNetValue ?? 0) > 0
  )
    ? societeAcquetsDistribution.firstEstateContribution / Math.max(1, input.societeAcquetsNetValue ?? 0)
    : 0;
  const isCommunityRegime = input.regimeUsed !== 'separation_biens';
  const sharedMassPreciputAmount = (
    resolvedPreciput.mode !== 'none'
    && !societeAcquetsDistribution
    && isCommunityRegime
  ) ? resolvedPreciput.requestedAmount : 0;
  const firstEstateBase = computeFirstEstate(
    input.regimeUsed,
    input.order,
    input.liquidation,
    attributionPct,
    preserveQualifiedSeparatePocketsInUniversalCommunity,
    sharedMassPreciputAmount,
  ) + (societeAcquetsDistribution?.firstEstateContribution ?? 0);
  const firstEstateWithoutPreciput = sharedMassPreciputAmount > 0
    ? computeFirstEstate(
      input.regimeUsed,
      input.order,
      input.liquidation,
      attributionPct,
      preserveQualifiedSeparatePocketsInUniversalCommunity,
      0,
    ) + (societeAcquetsDistribution?.firstEstateContribution ?? 0)
    : 0;
  const firstEstate = Math.min(
    totalPatrimoine,
    Math.max(0, firstEstateBase + (participationAcquetsSummary?.firstEstateAdjustment ?? 0)),
  );
  const survivorBase = Math.max(0, totalPatrimoine - firstEstate);
  const survivorEconomicInflows = Math.max(0, input.survivorEconomicInflows?.[input.order] ?? 0);
  const warnings: string[] = [];
  const firstEstatePocketScales = buildFirstEstatePocketScales(
    input.civil,
    input.regimeUsed,
    input.order,
    attributionPct,
    societeAcquetsEstateRatio,
    preserveQualifiedSeparatePocketsInUniversalCommunity,
  );
  const survivorPocketScales = buildSurvivorPocketScales(
    input.civil,
    input.regimeUsed,
    input.order,
    attributionPct,
    societeAcquetsEstateRatio,
    preserveQualifiedSeparatePocketsInUniversalCommunity,
  );
  const firstEstateTaxableBasis = buildSuccessionEstateTaxableBasis(
    input.transmissionBasis,
    firstEstatePocketScales,
  );

  if (attributionPct !== 50 && input.regimeUsed === 'communaute_legale') {
    warnings.push(
      `Attribution des biens communs au survivant: ${attributionPct} % applique au partage communautaire.`,
    );
  }
  if (nbEnfants <= 0) {
    warnings.push(
      'Aucun enfant declare: la chronologie reste indicative hors beneficiaires testamentaires explicitement saisis.',
    );
  }
  if (hasRepresentationOnAnySide(enfantsContext, familyMembers)) {
    warnings.push(
      'Chainage: representation successorale simplifiee prise en compte pour les petits-enfants declares.',
    );
  }
  if (input.patrimonial?.preciputMode === 'cible' && resolvedPreciput.mode === 'cible') {
    warnings.push(
      `Preciput cible: ${Math.round(resolvedPreciput.requestedAmount).toLocaleString('fr-FR')} EUR demandes sur ${resolvedPreciput.targetedSelections.length} bien(s) compatibles.`,
    );
  }
  if (resolvedPreciput.usesGlobalFallback) {
    warnings.push('Preciput cible: aucune selection compatible active, repli sur le montant global.');
  }
  if (
    resolvedPreciput.mode === 'cible'
    && resolvedPreciput.targetedSelections.length > 0
  ) {
    warnings.push(
      `Preciput cible: biens retenus ${resolvedPreciput.targetedSelections.map((selection) => selection.candidate.label).join(', ')}.`,
    );
  }
  if (societeAcquetsDistribution) {
    warnings.push(...societeAcquetsDistribution.warnings);
  }
  if (participationAcquetsSummary) {
    warnings.push(...participationAcquetsSummary.warnings);
  }
  if (input.interMassClaimsSummary?.configured) {
    warnings.push(
      `Creances entre masses: ${Math.round(input.interMassClaimsSummary.totalAppliedAmount).toLocaleString('fr-FR')} EUR appliques sur ${input.interMassClaimsSummary.claims.filter((claim) => claim.appliedAmount > 0).length} ecriture(s).`,
    );
    warnings.push(...input.interMassClaimsSummary.warnings);
  }
  if ((input.affectedLiabilitySummary?.totalAmount ?? 0) > 0) {
    warnings.push(
      `Passif affecte: ${Math.round(input.affectedLiabilitySummary?.totalAmount ?? 0).toLocaleString('fr-FR')} EUR rattaches a des masses patrimoniales dediees.`,
    );
  }
  if (preserveQualifiedSeparatePocketsInUniversalCommunity) {
    warnings.push(
      "Communaute universelle: les biens qualifies 'propre par nature' et rattaches a un epoux sont exclus de la masse commune simplifiee.",
    );
  }
  if (input.civil.regimeMatrimonial === 'communaute_meubles_acquets') {
    warnings.push(
      'Communaute de meubles et acquets: la qualification meuble / immeuble des actifs detailles ajuste la masse simplifiee avant chainage.',
    );
  }
  warnings.push(
    'Module de chainage simplifie: liquidation notariale fine et options civiles avancees non modelisees.',
  );

  const nbParentsStep1 = countSideParents(familyMembers, input.order);
  const step1Split = computeStep1Split(
    input.civil,
    input.regimeUsed,
    firstEstate,
    nbEnfants,
    input.order,
    (sharedMassPreciputAmount > 0 || societeAcquetsDistribution || !isCommunityRegime)
      ? { ...(input.patrimonial ?? {}), preciputMontant: 0 }
      : preciputPatrimonial,
    input.referenceDate,
    nbParentsStep1,
  );
  warnings.push(...step1Split.warnings);
  const step1TaxableEstate = firstEstate - step1Split.preciputDeducted;
  const effectivePreciputApplied = societeAcquetsDistribution?.preciputAmount
    ?? (sharedMassPreciputAmount > 0 ? sharedMassPreciputAmount : step1Split.preciputDeducted);
  const targetedPreciputAppliedAmount = resolvedPreciput.mode === 'cible'
    ? effectivePreciputApplied
    : 0;
  const preciputSummary = (
    resolvedPreciput.mode === 'none'
    && effectivePreciputApplied <= 0
  )
    ? null
    : {
      mode: resolvedPreciput.mode,
      pocket: preciputEligiblePocket,
      requestedAmount: resolvedPreciput.requestedAmount,
      appliedAmount: resolvedPreciput.mode === 'cible'
        ? targetedPreciputAppliedAmount
        : effectivePreciputApplied,
      usesGlobalFallback: resolvedPreciput.usesGlobalFallback,
      selections: buildTargetedPreciputSelectionsSummary(
        resolvedPreciput.targetedSelections,
        resolvedPreciput.requestedAmount,
        targetedPreciputAppliedAmount,
      ),
    };
  const targetedPreciputAppliedBasis = (
    resolvedPreciput.mode === 'cible'
    && resolvedPreciput.requestedAmount > 0
    && targetedPreciputAppliedAmount > 0
  )
    ? scaleSuccessionEstateTaxableBasis(
      requestedTargetedPreciputBasis,
      targetedPreciputAppliedAmount / resolvedPreciput.requestedAmount,
    )
    : createEmptyEstateTaxableBasis();
  const firstEstateBasisDenominator = sharedMassPreciputAmount > 0
    ? Math.max(firstEstate, firstEstateWithoutPreciput)
    : firstEstate;
  const step1TransmissionTaxableBasisBase = firstEstateBasisDenominator > 0
    ? (
      resolvedPreciput.mode === 'cible'
        ? (
          societeAcquetsDistribution
            ? firstEstateTaxableBasis
            : subtractSuccessionEstateTaxableBases(
              firstEstateTaxableBasis,
              targetedPreciputAppliedBasis,
            )
        )
        : scaleSuccessionEstateTaxableBasis(
          firstEstateTaxableBasis,
          step1TaxableEstate / firstEstateBasisDenominator,
        )
    )
    : createEmptyEstateTaxableBasis();
  const step1TransmissionTaxableBasis = applyResidencePrincipaleAbatementToEstateBasis(
    step1TransmissionTaxableBasisBase,
    Boolean(input.abattementResidencePrincipale),
  );
  const step1Details = computeStepTransmission(
    input,
    step1TaxableEstate,
    step1TransmissionTaxableBasis,
    input.order,
    step1Split.conjointPart,
    step1Split.enfantsPart,
    null,
    `Etape 1 (${getLabelForSide(input.order)})`,
    step1Split.parentsPart,
  );
  warnings.push(...step1Details.warnings);
  warnings.push(...getStepEligibilityWarnings(
    `Etape 1 (${getLabelForSide(input.order)})`,
    enfantsContext,
    familyMembers,
    input.order,
    step1Details.transmission.beneficiaries.length > 0,
  ));

  const otherSide = getOtherSide(input.order);
  const step2InheritedCarryOverAmount = step1Split.carryOverToStep2 + step1Details.carryOverToStep2;
  const step2CarryOverAmount = step2InheritedCarryOverAmount;
  const step2Estate = survivorBase + step2CarryOverAmount + survivorEconomicInflows;
  const survivorTaxableBasis = buildSuccessionEstateTaxableBasis(
    input.transmissionBasis,
    survivorPocketScales,
  );
  const carryOverTaxableBasis = resolvedPreciput.mode === 'cible'
    ? addSuccessionEstateTaxableBases(
      step1TaxableEstate > 0
        ? scaleSuccessionEstateTaxableBasis(
          step1TransmissionTaxableBasis,
          step2InheritedCarryOverAmount / step1TaxableEstate,
        )
        : createEmptyEstateTaxableBasis(),
      targetedPreciputAppliedBasis,
    )
    : firstEstateBasisDenominator > 0
      ? scaleSuccessionEstateTaxableBasis(
        firstEstateTaxableBasis,
        step2CarryOverAmount / firstEstateBasisDenominator,
      )
      : createEmptyEstateTaxableBasis();
  const survivorEconomicInflowsTaxableBasis = {
    ordinaryNetBeforeForfait: survivorEconomicInflows,
    groupementEntries: [],
    residencePrincipaleValeur: 0,
  };
  const step2TaxableBasis = addSuccessionEstateTaxableBases(
    survivorTaxableBasis,
    carryOverTaxableBasis,
    survivorEconomicInflowsTaxableBasis,
  );
  const nbParentsStep2 = nbEnfants <= 0 ? countSideParents(familyMembers, otherSide) : 0;
  const step2ParentsPart = nbParentsStep2 > 0 ? step2Estate * Math.min(2, nbParentsStep2) * 0.25 : 0;
  const step2Details = computeStepTransmission(
    input,
    step2Estate,
    step2TaxableBasis,
    otherSide,
    0,
    step2Estate - step2ParentsPart,
    input.order,
    `Etape 2 (${getLabelForSide(otherSide)})`,
    step2ParentsPart,
  );
  warnings.push(...step2Details.warnings);
  warnings.push(...getStepEligibilityWarnings(
    `Etape 2 (${getLabelForSide(otherSide)})`,
    enfantsContext,
    familyMembers,
    otherSide,
    step2Details.transmission.beneficiaries.length > 0,
  ));
  if (survivorEconomicInflows > 0) {
    warnings.push(
      `Etape 2 (${getLabelForSide(otherSide)}): capitaux assurances nets recycles depuis l'etape 1 = ${Math.round(survivorEconomicInflows).toLocaleString('fr-FR')} EUR.`,
    );
  }
  if (input.abattementResidencePrincipale && input.transmissionBasis?.residencePrincipaleEntry) {
    warnings.push(
      `Etape 1 (${getLabelForSide(input.order)}): abattement residence principale 20 % applique a l'assiette fiscale de cette etape uniquement.`,
    );
  }

  return {
    applicable: true,
    order: input.order,
    firstDecedeLabel: input.order === 'epoux1' ? 'Epoux 1' : 'Epoux 2',
    secondDecedeLabel: input.order === 'epoux1' ? 'Epoux 2' : 'Epoux 1',
    step1: {
      actifTransmis: step1TaxableEstate,
      partConjoint: step1Details.partConjoint,
      partEnfants: step1Details.partAutresBeneficiaires,
      droitsConjoint: 0,
      droitsEnfants: step1Details.transmission.droits,
      beneficiaries: step1Details.transmission.beneficiaries,
    },
    step2: {
      actifTransmis: step2Estate,
      partConjoint: step2Details.partConjoint,
      partEnfants: step2Details.partAutresBeneficiaires,
      droitsConjoint: 0,
      droitsEnfants: step2Details.transmission.droits,
      beneficiaries: step2Details.transmission.beneficiaries,
    },
    societeAcquets: societeAcquetsDistribution
      ? {
        configured: societeAcquetsDistribution.configured,
        totalValue: societeAcquetsDistribution.totalValue,
        firstEstateContribution: societeAcquetsDistribution.firstEstateContribution,
        survivorShare: societeAcquetsDistribution.survivorShare,
        preciputAmount: societeAcquetsDistribution.preciputAmount,
        survivorAttributionAmount: societeAcquetsDistribution.survivorAttributionAmount,
        liquidationMode: societeAcquetsDistribution.liquidationMode,
        deceasedQuotePct: societeAcquetsDistribution.deceasedQuotePct,
        survivorQuotePct: societeAcquetsDistribution.survivorQuotePct,
        attributionIntegrale: societeAcquetsDistribution.attributionIntegrale,
      }
      : null,
    participationAcquets: participationAcquetsSummary,
    preciput: preciputSummary,
    interMassClaims: input.interMassClaimsSummary
      ? {
        configured: input.interMassClaimsSummary.configured,
        totalRequestedAmount: input.interMassClaimsSummary.totalRequestedAmount,
        totalAppliedAmount: input.interMassClaimsSummary.totalAppliedAmount,
        claims: input.interMassClaimsSummary.claims.map((claim) => ({
          id: claim.id,
          kind: claim.kind,
          label: claim.label,
          fromPocket: claim.fromPocket,
          toPocket: claim.toPocket,
          requestedAmount: claim.requestedAmount,
          appliedAmount: claim.appliedAmount,
        })),
      }
      : null,
    affectedLiabilities: input.affectedLiabilitySummary
      ? {
        totalAmount: input.affectedLiabilitySummary.totalAmount,
        byPocket: input.affectedLiabilitySummary.byPocket.map((entry) => ({
          pocket: entry.pocket,
          amount: entry.amount,
        })),
      }
      : null,
    totalDroits: step1Details.transmission.droits + step2Details.transmission.droits,
    warnings,
  };
}
