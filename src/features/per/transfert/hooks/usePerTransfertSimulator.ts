import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BaseCgRetraiteContract, BaseCgRetraiteContractType } from '@/data/basecg';
import { getBaseCgRetraiteCatalog } from '@/utils/cache/baseCgRetraiteRepository';
import { onResetEvent, storageKeyFor } from '@/utils/reset';
import {
  computePerTransfert,
  resolveMortalityTableFromContractLabel,
  type PerTransfertFiscalAssumptions,
  type PerTransfertInput,
  type PerTransfertProductType,
  type PerTransfertResult,
  type PerTransfertSex,
} from '@/engine/per';
import type { MortalityTableCode } from '@/data/mortality';
import type { FiscalContext } from '@/hooks/useFiscalContext';
import { capOutgoingTransferFeeRate, defaultOutgoingTransferFeeRate } from '../utils/transferFeeCap';

export interface PerTransfertFormState {
  typeContrat: BaseCgRetraiteContractType;
  compagnie: string;
  contractId: string;
  capitalAcquis: number;
  interetsAcquis: number;
  renteActuelleAnnuelleBrute: number;
  subscriptionDate: string;
  annualCurrentPayment: number;
  sex: PerTransfertSex;
  birthYear: number;
  currentAge: number;
  liquidationAge: number;
  tmiRetraite: number;
  transferFeeRate: number;
  newPerEntryFeeRate: number;
  performanceUntilRetirementRate: number;
  currentContractPerformanceUntilRetirementRate: number;
  currentRentRevaluationRate: number;
  newRentRevaluationRate: number;
  capitalExitRevaluationRate: number;
  capitalShareRate: number;
  horizonAgeShort: number;
  horizonAgeLong: number;
  mortalityTable: MortalityTableCode;
  currentRentMode: 'statement' | 'manual_table';
  currentTechnicalRate: number;
  currentConversionFeeRate: number;
  currentArrearsFeeRate: number;
  currentGuaranteedYears: number;
  currentReversionEnabled: boolean;
  currentReversionRate: number;
  currentReversionSpouseBirthYear: number;
  technicalRate: number;
  conversionFeeRate: number;
  arrearsFeeRate: number;
  guaranteedYears: number;
  reversionEnabled: boolean;
  reversionRate: number;
  spouseBirthYear: number;
  spouseAgeAtLiquidation: number;
  prefonPoints: number;
}

const DEFAULT_STATE: PerTransfertFormState = {
  typeContrat: 'MADELIN',
  compagnie: '',
  contractId: '',
  capitalAcquis: 0,
  interetsAcquis: 0,
  renteActuelleAnnuelleBrute: 0,
  subscriptionDate: '',
  annualCurrentPayment: 0,
  sex: 'M',
  birthYear: 1960,
  currentAge: 60,
  liquidationAge: 64,
  tmiRetraite: 0,
  transferFeeRate: 0,
  newPerEntryFeeRate: 0,
  performanceUntilRetirementRate: 0,
  currentContractPerformanceUntilRetirementRate: 0,
  currentRentRevaluationRate: 0,
  newRentRevaluationRate: 0,
  capitalExitRevaluationRate: 0,
  capitalShareRate: 0,
  horizonAgeShort: 80,
  horizonAgeLong: 90,
  mortalityTable: 'TGH05',
  currentRentMode: 'statement',
  currentTechnicalRate: 0,
  currentConversionFeeRate: 0,
  currentArrearsFeeRate: 0,
  currentGuaranteedYears: 0,
  currentReversionEnabled: false,
  currentReversionRate: 0,
  currentReversionSpouseBirthYear: 1962,
  technicalRate: 0,
  conversionFeeRate: 0,
  arrearsFeeRate: 0,
  guaranteedYears: 0,
  reversionEnabled: false,
  reversionRate: 0,
  spouseBirthYear: 1962,
  spouseAgeAtLiquidation: 62,
  prefonPoints: 0,
};

function toRate(percent: number): number {
  return Number.isFinite(percent) ? percent / 100 : 0;
}

function toPercent(rate: number): number {
  return Number.isFinite(rate) ? rate * 100 : 0;
}

function contractToProductType(type: BaseCgRetraiteContractType): PerTransfertProductType {
  if (type === 'ARTICLE83') return 'ARTICLE83';
  if (type === 'MADELIN') return 'MADELIN';
  if (type === 'PERP') return 'PERP';
  if (type === 'PER_POINTS') return 'PER_POINTS';
  return 'PER';
}

function spouseAgeAtLiquidation(insuredBirthYear: number, liquidationAge: number, spouseBirthYear: number): number {
  const liquidationYear = insuredBirthYear + liquidationAge;
  return Math.max(0, liquidationYear - spouseBirthYear);
}

function buildFiscalAssumptions(fiscalContext: FiscalContext): PerTransfertFiscalAssumptions {
  return {
    rvtoTaxableFractionByAge: fiscalContext.rvtoTaxableFractionByAge,
    pfuIrRate: toRate(fiscalContext.pfuRateIR),
    psRatePatrimony: toRate(fiscalContext.psRateGeneral),
    psRateRenteInterests: fiscalContext.psRateRenteInterests,
    psRateRenteCapitalCASA: fiscalContext.psRateRenteCapitalCASA,
    abat10Rate: fiscalContext.abat10Rate,
    psRateRetirementDefault: fiscalContext.psRateRetirementDefault,
    smallAnnuityMonthlyCapitalExitThreshold: fiscalContext.smallAnnuityMonthlyCapitalExitThreshold,
    smallAnnuityAnnualCapitalExitThreshold: fiscalContext.smallAnnuityAnnualCapitalExitThreshold,
    smallAnnuityCapitalExitFlatTaxRate: fiscalContext.smallAnnuityCapitalExitFlatTaxRate,
    smallAnnuityCapitalExitFlatTaxAbatementRate: fiscalContext.smallAnnuityCapitalExitFlatTaxAbatementRate,
  };
}

function hydrateState(): PerTransfertFormState {
  try {
    const raw = sessionStorage.getItem(storageKeyFor('per-transfert'));
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function usePerTransfertSimulator(fiscalContext: FiscalContext) {
  const [state, setState] = useState<PerTransfertFormState>(() => hydrateState());
  const [catalog, setCatalog] = useState<BaseCgRetraiteContract[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getBaseCgRetraiteCatalog()
      .then((contracts) => {
        if (!mounted) return;
        setCatalog(contracts);
        setCatalogLoading(false);
      })
      .catch(() => {
        if (mounted) setCatalogLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKeyFor('per-transfert'), JSON.stringify(state));
    } catch {
      // ignore sessionStorage
    }
  }, [state]);

  useEffect(() => onResetEvent(({ simId }) => {
    if (simId === 'per-transfert') {
      setState(DEFAULT_STATE);
    }
  }), []);

  const selectedContract = useMemo(
    () => catalog.find((contract) => contract.id === state.contractId) ?? null,
    [catalog, state.contractId],
  );

  const update = useCallback(<K extends keyof PerTransfertFormState>(
    key: K,
    value: PerTransfertFormState[K],
  ) => {
    setState((previous) => {
      const next = { ...previous, [key]: value };
      const contract = catalog.find((candidate) => candidate.id === previous.contractId);
      if (contract && (key === 'transferFeeRate' || key === 'subscriptionDate')) {
        const baseRate = key === 'transferFeeRate'
          ? toRate(Number(value))
          : (contract.typeContrat === 'PERCO'
            ? toRate(previous.transferFeeRate)
            : defaultOutgoingTransferFeeRate(contract.typeContrat, contract.phaseEpargne.fraisTransfertSortantRate));
        const subscriptionDate = key === 'subscriptionDate' ? String(value ?? '') : previous.subscriptionDate;
        next.transferFeeRate = toPercent(capOutgoingTransferFeeRate(
          contract.typeContrat,
          baseRate,
          subscriptionDate,
        ));
      }
      return next;
    });
  }, [catalog]);

  const applyContract = useCallback((contractId: string) => {
    const contract = catalog.find((candidate) => candidate.id === contractId);
    if (!contract) {
      setState((previous) => ({ ...previous, contractId }));
      return;
    }
    setState((previous) => ({
      ...previous,
      contractId,
      typeContrat: contract.typeContrat,
      compagnie: contract.compagnie,
      transferFeeRate: toPercent(capOutgoingTransferFeeRate(
        contract.typeContrat,
        defaultOutgoingTransferFeeRate(
          contract.typeContrat,
          contract.phaseEpargne.fraisTransfertSortantRate ?? previous.transferFeeRate / 100,
        ),
        previous.subscriptionDate,
      )),
      currentArrearsFeeRate: toPercent(contract.phaseLiquidation.fraisArreragesRate ?? previous.currentArrearsFeeRate / 100),
      mortalityTable: resolveMortalityTableFromContractLabel(
        contract.phaseLiquidation.tableConversionRente,
        previous.sex,
      ),
    }));
  }, [catalog]);

  const input = useMemo<PerTransfertInput>(() => {
    const fiscalAssumptions = buildFiscalAssumptions(fiscalContext);
    return {
      productType: contractToProductType(state.typeContrat),
      originalContractType: state.typeContrat,
      targetCompartment: selectedContract?.perCompartment ?? null,
      capitalAcquis: state.capitalAcquis,
      interetsAcquis: state.interetsAcquis,
      renteActuelleAnnuelleBrute: state.renteActuelleAnnuelleBrute,
      subscriptionDate: state.subscriptionDate || null,
      annualCurrentPayment: state.annualCurrentPayment,
      insured: {
        sex: state.sex,
        birthYear: state.birthYear,
        currentAge: state.currentAge,
        liquidationAge: state.liquidationAge,
      },
      tmiRetraite: toRate(state.tmiRetraite),
      fiscalAssumptions,
      annuityOptions: {
        mortalityTable: state.sex === 'M' ? 'TGH05' : 'TGF05',
        technicalRate: toRate(state.technicalRate),
        frequency: 12,
        paymentTiming: 'arrears',
        conversionFeeRate: toRate(state.conversionFeeRate),
        conversionFeeFixed: 0,
        arrearsFeeRate: toRate(state.arrearsFeeRate),
        arrearsFeeFixedPerPayment: 0,
        reversion: {
          enabled: state.reversionEnabled,
          rate: toRate(state.reversionRate),
          spouseSex: state.sex === 'M' ? 'F' : 'M',
          spouseBirthYear: state.spouseBirthYear,
          spouseAgeAtLiquidation: state.spouseAgeAtLiquidation,
          spouseMortalityTable: state.sex === 'M' ? 'TGF05' : 'TGH05',
        },
        guaranteedAnnuities: {
          enabled: state.guaranteedYears > 0,
          years: state.guaranteedYears,
        },
        temporaryIncrease: {
          enabled: false,
          increaseRate: 0,
          years: 0,
        },
      },
      currentRentOptions: {
        mode: state.currentRentMode,
        mortalityTable: state.mortalityTable,
        technicalRate: toRate(state.currentTechnicalRate),
        conversionFeeRate: toRate(state.currentConversionFeeRate),
        arrearsFeeRate: toRate(state.currentArrearsFeeRate),
        guaranteedYears: state.currentGuaranteedYears,
        reversionEnabled: state.currentReversionEnabled,
        reversionRate: toRate(state.currentReversionRate),
        spouseBirthYear: state.currentReversionSpouseBirthYear,
        spouseAgeAtLiquidation: spouseAgeAtLiquidation(
          state.birthYear,
          state.liquidationAge,
          state.currentReversionSpouseBirthYear,
        ),
      },
      projection: {
        transferFeeRate: capOutgoingTransferFeeRate(
          state.typeContrat,
          toRate(state.transferFeeRate),
          state.subscriptionDate,
        ),
        newPerEntryFeeRate: toRate(state.newPerEntryFeeRate),
        performanceUntilRetirementRate: toRate(state.performanceUntilRetirementRate),
        currentContractPerformanceUntilRetirementRate: toRate(state.currentContractPerformanceUntilRetirementRate),
        currentRentRevaluationRate: toRate(state.currentRentRevaluationRate),
        newRentRevaluationRate: toRate(state.newRentRevaluationRate),
        capitalExitRevaluationRate: toRate(state.capitalExitRevaluationRate),
        capitalShareRate: toRate(state.capitalShareRate),
        horizonAgeShort: state.horizonAgeShort,
        horizonAgeLong: state.horizonAgeLong,
      },
      prefon: {
        enabled: state.typeContrat === 'PER_POINTS',
        points: state.prefonPoints,
        acquisitionAge: state.currentAge,
        params: selectedContract?.pointsParams ?? null,
      },
    };
  }, [fiscalContext, selectedContract, state]);

  const result = useMemo<PerTransfertResult>(() => computePerTransfert(input), [input]);

  return {
    state,
    update,
    applyContract,
    catalog,
    catalogLoading,
    selectedContract,
    result,
    input,
  };
}
