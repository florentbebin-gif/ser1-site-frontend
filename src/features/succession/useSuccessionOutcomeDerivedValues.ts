import { useMemo } from 'react';
import type { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import type { buildSuccessionPerFiscalAnalysis } from './successionPerFiscal';
import type { buildSuccessionPrevoyanceFiscalAnalysis } from './successionPrevoyanceFiscal';
import type { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import type { buildSuccessionPredecesAnalysis } from './successionPredeces';
import type { buildSuccessionChainageAnalysis } from './successionChainage';
import type {
  computeSuccessionDirectEstateBasis} from './successionDisplay';
import {
  buildSuccessionChainTransmissionRows,
  buildSuccessionDirectDisplayAnalysis
} from './successionDisplay';
import type { buildSuccessionDevolutionAnalysis } from './successionDevolution';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';
import { DONATION_ENTRE_EPOUX_OPTIONS } from './successionSimulator.constants';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import type {
  FamilyMember,
  SuccessionEnfant,
} from './successionDraft';
import type {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
} from './successionDraft';
import type { SuccessionChainOrder } from './successionChainage';

interface UseSuccessionOutcomeDerivedValuesInput {
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  liquidationContext: typeof DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT;
  devolutionContext: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT;
  patrimonialContext: typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT;
  fiscalSnapshot: SuccessionFiscalSnapshot;
  chainOrder: SuccessionChainOrder;
  canExport: boolean;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  isMarried: boolean;
  isPacsed: boolean;
  nbDescendantBranches: number;
  nbEnfantsNonCommuns: number;
  derivedActifNetSuccession: number;
  chainageAnalysis: ReturnType<typeof buildSuccessionChainageAnalysis>;
  devolutionAnalysis: ReturnType<typeof buildSuccessionDevolutionAnalysis>;
  predecesAnalysis: ReturnType<typeof buildSuccessionPredecesAnalysis>;
  patrimonialAnalysis: ReturnType<typeof buildSuccessionPatrimonialAnalysis>;
  avFiscalAnalysis: ReturnType<typeof buildSuccessionAvFiscalAnalysis>;
  perFiscalAnalysis: ReturnType<typeof buildSuccessionPerFiscalAnalysis>;
  prevoyanceFiscalAnalysis: ReturnType<typeof buildSuccessionPrevoyanceFiscalAnalysis>;
  directEstateBasis: ReturnType<typeof computeSuccessionDirectEstateBasis>;
  assuranceVieByAssure: Record<'epoux1' | 'epoux2', number>;
  perByAssure: Record<'epoux1' | 'epoux2', number>;
  prevoyanceByAssure: Record<'epoux1' | 'epoux2', number>;
  assuranceVieTotals: {
    capitaux: number;
    versementsApres70: number;
  };
  perTotals: {
    capitaux: number;
  };
  prevoyanceTotals: {
    capitaux: number;
    dernierePrime: number;
  };
  simulatedDeathDate: Date;
}

export function useSuccessionOutcomeDerivedValues({
  civilContext,
  liquidationContext,
  devolutionContext,
  patrimonialContext,
  fiscalSnapshot,
  chainOrder,
  canExport,
  enfantsContext,
  familyMembers,
  isMarried,
  isPacsed,
  nbDescendantBranches,
  nbEnfantsNonCommuns,
  derivedActifNetSuccession,
  chainageAnalysis,
  devolutionAnalysis,
  predecesAnalysis,
  patrimonialAnalysis,
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
  directEstateBasis,
  assuranceVieByAssure,
  perByAssure,
  prevoyanceByAssure,
  assuranceVieTotals,
  perTotals,
  prevoyanceTotals,
  simulatedDeathDate,
}: UseSuccessionOutcomeDerivedValuesInput) {
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

  const displayPerTransmis = useMemo(() => {
    if (displayUsesChainage) return perByAssure[chainageAnalysis.order];
    return perByAssure[directDisplayAnalysis.simulatedDeceased];
  }, [
    perByAssure,
    chainageAnalysis.order,
    directDisplayAnalysis.simulatedDeceased,
    displayUsesChainage,
  ]);

  const displayPrevoyanceTransmise = useMemo(() => {
    if (displayUsesChainage) return prevoyanceByAssure[chainageAnalysis.order];
    return prevoyanceByAssure[directDisplayAnalysis.simulatedDeceased];
  }, [
    prevoyanceByAssure,
    chainageAnalysis.order,
    directDisplayAnalysis.simulatedDeceased,
    displayUsesChainage,
  ]);

  const derivedMasseTransmise = useMemo(
    () => displayActifNetSuccession
      + displayAssuranceVieTransmise
      + displayPerTransmis
      + displayPrevoyanceTransmise,
    [
      displayActifNetSuccession,
      displayAssuranceVieTransmise,
      displayPerTransmis,
      displayPrevoyanceTransmise,
    ],
  );

  const derivedTotalDroits = useMemo(
    () => (displayUsesChainage
      ? chainageAnalysis.totalDroits
      : (directDisplayAnalysis.result?.totalDroits ?? 0))
      + avFiscalAnalysis.totalDroits
      + perFiscalAnalysis.totalDroits
      + prevoyanceFiscalAnalysis.totalDroits,
    [
      displayUsesChainage,
      chainageAnalysis.totalDroits,
      directDisplayAnalysis.result?.totalDroits,
      avFiscalAnalysis.totalDroits,
      perFiscalAnalysis.totalDroits,
      prevoyanceFiscalAnalysis.totalDroits,
    ],
  );

  const synthDonutTransmis = useMemo(() => {
    if (displayUsesChainage) {
      const step1 = chainageAnalysis.step1;
      const step2 = chainageAnalysis.step2;
      if (!step1 || !step2) return derivedMasseTransmise;
        return step1.actifTransmis
          + step2.actifTransmis
          + assuranceVieByAssure.epoux1
          + assuranceVieByAssure.epoux2
          + perByAssure.epoux1
          + perByAssure.epoux2
          + prevoyanceByAssure.epoux1
          + prevoyanceByAssure.epoux2;
      }
      return derivedMasseTransmise;
  }, [
    displayUsesChainage,
    chainageAnalysis,
    assuranceVieByAssure,
    perByAssure,
    prevoyanceByAssure,
    derivedMasseTransmise,
  ]);

  const synthHypothese = useMemo(() => {
    if (!isMarried || nbDescendantBranches === 0) return null;

    if (patrimonialContext.donationEntreEpouxActive) {
      const option = DONATION_ENTRE_EPOUX_OPTIONS.find((entry) => entry.value === patrimonialContext.donationEntreEpouxOption);
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
        ? getUsufruitValuationFromBirthDate(spouseBirthDate, valuationBase, simulatedDeathDate)
        : null;
      const baseLabel = `Donation entre époux : ${option?.label ?? patrimonialContext.donationEntreEpouxOption}`;

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
      return 'Art. 757 CC : 1/4 en pleine propriété imposé au conjoint survivant en présence d\'enfant(s) non commun(s).';
    }

    if (devolutionContext.choixLegalConjointSansDDV === 'usufruit') {
      const spouseBirthDate = chainOrder === 'epoux1'
        ? civilContext.dateNaissanceEpoux2
        : civilContext.dateNaissanceEpoux1;
      const valuation = getUsufruitValuationFromBirthDate(
        spouseBirthDate,
        derivedActifNetSuccession,
        simulatedDeathDate,
      );
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
    simulatedDeathDate,
  ]);

  const transmissionRows = useMemo(() => {
    if (displayUsesChainage) {
      const { order, step1, step2 } = chainageAnalysis;
      if (!step1 || !step2) return [];
      const otherOrder = order === 'epoux1' ? 'epoux2' : 'epoux1';
      const avCapital = assuranceVieByAssure[order] + assuranceVieByAssure[otherOrder];
      const perCapital = perByAssure[order] + perByAssure[otherOrder];
      const prevoyanceCapital = prevoyanceByAssure[order] + prevoyanceByAssure[otherOrder];
      return [
        ...buildSuccessionChainTransmissionRows(chainageAnalysis),
        ...(avCapital > 0 ? [{
          id: 'assurance-vie',
          label: 'Assurance-vie',
          brut: avCapital,
          droits: avFiscalAnalysis.totalDroits,
          net: avCapital - avFiscalAnalysis.totalDroits,
        }] : []),
        ...(perCapital > 0 ? [{
          id: 'per-assurance',
          label: 'PER assurance',
          brut: perCapital,
          droits: perFiscalAnalysis.totalDroits,
          net: perCapital - perFiscalAnalysis.totalDroits,
        }] : []),
        ...(prevoyanceCapital > 0 ? [{
          id: 'prevoyance-deces',
          label: 'Prévoyance décès',
          brut: prevoyanceCapital,
          droits: prevoyanceFiscalAnalysis.totalDroits,
          net: prevoyanceCapital - prevoyanceFiscalAnalysis.totalDroits,
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
      ...(displayPerTransmis > 0 ? [{
        id: 'per-assurance',
        label: 'PER assurance',
        brut: displayPerTransmis,
        droits: perFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
        net: displayPerTransmis - perFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
      }] : []),
      ...(displayPrevoyanceTransmise > 0 ? [{
        id: 'prevoyance-deces',
        label: 'Prévoyance décès',
        brut: displayPrevoyanceTransmise,
        droits: prevoyanceFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
        net: displayPrevoyanceTransmise - prevoyanceFiscalAnalysis.byAssure[directDisplayAnalysis.simulatedDeceased].totalDroits,
      }] : []),
    ];
  }, [
    displayUsesChainage,
    chainageAnalysis,
    assuranceVieByAssure,
    perByAssure,
    prevoyanceByAssure,
    avFiscalAnalysis.totalDroits,
    avFiscalAnalysis.byAssure,
    perFiscalAnalysis.totalDroits,
    perFiscalAnalysis.byAssure,
    prevoyanceFiscalAnalysis.totalDroits,
    prevoyanceFiscalAnalysis.byAssure,
    directDisplayAnalysis.transmissionRows,
    directDisplayAnalysis.simulatedDeceased,
    displayAssuranceVieTransmise,
    displayPerTransmis,
    displayPrevoyanceTransmise,
  ]);

  const chainageExportPayload = useMemo(
    () => ({
      applicable: displayUsesChainage,
      order: chainageAnalysis.order,
      firstDecedeLabel: chainageAnalysis.firstDecedeLabel,
      secondDecedeLabel: chainageAnalysis.secondDecedeLabel,
      step1: displayUsesChainage && chainageAnalysis.step1 ? {
        actifTransmis: chainageAnalysis.step1.actifTransmis,
        assuranceVieTransmise: assuranceVieByAssure[chainageAnalysis.order],
        perTransmis: perByAssure[chainageAnalysis.order],
        prevoyanceTransmise: prevoyanceByAssure[chainageAnalysis.order],
        masseTotaleTransmise: chainageAnalysis.step1.actifTransmis
          + assuranceVieByAssure[chainageAnalysis.order]
          + perByAssure[chainageAnalysis.order]
          + prevoyanceByAssure[chainageAnalysis.order],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
        droitsPer: perFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
        droitsPrevoyance: prevoyanceFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
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
        perTransmis: perByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        prevoyanceTransmise: prevoyanceByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        masseTotaleTransmise: chainageAnalysis.step2.actifTransmis
          + assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1']
          + perByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1']
          + prevoyanceByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
        droitsPer: perFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
        droitsPrevoyance: prevoyanceFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
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
      perTotale: perTotals.capitaux,
      prevoyanceTotale: prevoyanceTotals.capitaux,
      totalDroits: derivedTotalDroits,
      warnings: displayUsesChainage
        ? [
          ...chainageAnalysis.warnings,
          ...avFiscalAnalysis.warnings,
          ...perFiscalAnalysis.warnings,
          ...prevoyanceFiscalAnalysis.warnings,
        ]
        : [
          ...(isPacsed
            ? ['PACS: la synthèse fiscale affichée repose sur le décès simulé du partenaire sélectionné, pas sur une chronologie 2 décès.']
            : ['Chronologie 2 décès non utilisée pour cette situation : la synthèse repose sur la succession directe du défunt simulé.']),
          ...directDisplayAnalysis.warnings,
          ...avFiscalAnalysis.warnings,
          ...perFiscalAnalysis.warnings,
          ...prevoyanceFiscalAnalysis.warnings,
        ],
    }),
    [
      displayUsesChainage,
      chainageAnalysis,
      assuranceVieByAssure,
      perByAssure,
      prevoyanceByAssure,
      assuranceVieTotals.capitaux,
      perTotals.capitaux,
      prevoyanceTotals.capitaux,
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
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

  const canExportSimplified = (
    displayActifNetSuccession > 0
    || totalActifsLiquidation > 0
    || assuranceVieTotals.capitaux > 0
    || perTotals.capitaux > 0
    || prevoyanceTotals.capitaux > 0
  );
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
      ...perFiscalAnalysis.warnings,
      ...prevoyanceFiscalAnalysis.warnings,
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
    perFiscalAnalysis.warnings,
    prevoyanceFiscalAnalysis.warnings,
  ]);

  const exportHeirs = useMemo(
    () => (displayUsesChainage ? [] : directDisplayAnalysis.heirs).map((heir) => ({
      lien: heir.lien,
      partSuccession: heir.partSuccession,
    })),
    [displayUsesChainage, directDisplayAnalysis.heirs],
  );

  return {
    displayUsesChainage,
    displayActifNetSuccession,
    directDisplayAnalysis,
    displayAssuranceVieTransmise,
    displayPerTransmis,
    displayPrevoyanceTransmise,
    derivedMasseTransmise,
    derivedTotalDroits,
    synthDonutTransmis,
    synthHypothese,
    transmissionRows,
    chainageExportPayload,
    totalActifsLiquidation,
    canExportSimplified,
    canExportCurrentMode,
    attentions,
    exportHeirs,
  };
}
