import { scheduleAmortissable } from '../credit/loanSchedule';
import { normalizeAllocationPockets } from './allocationPockets';
import { computeProductiveMonthsByCivilYear } from './calculPlacements';
import type {
  AllocationPocketInput,
  AssociateInput,
  CompanyLoanInput,
  AmountScheduleInput,
  SubsidiaryInput,
  TresoAssociateRevenueRow,
  TresoFiscalParams,
} from './types';

export interface CompanyLoanYearResult {
  annuiteCreditIS: number;
  interetsCreditIS: number;
  interetsDeductibles: number;
  revenusActifFinance: number;
}

export interface SubsidiaryYearResult {
  servicesRevenue: number;
  dividendesFiliales: number;
  dividendesFilialesExoneres: number;
  quotePartTaxable: number;
  estimatedFiscalResult: number;
  disposalCash: number;
  disposalGain: number;
}

export interface AssociateCashMaps {
  remunerationByAssociate: Map<string, number>;
  ccaRepaidByAssociate: Map<string, number>;
  ccaInterestByAssociate?: Map<string, number>;
  grossDividendsByAssociate: Map<string, number>;
  tnsSocialChargesByAssociate: Map<string, number>;
}

export interface InvestmentLot {
  pocket: AllocationPocketInput;
  amount: number;
  value: number;
  capitalInvested: number;
  startYear: number;
}

export interface MatrixYearResult {
  capitalDistrib: number;
  revenuDistrib: number;
  capitalCapi: number;
  valeurCapi: number;
  gainCapiN: number;
  isLatentCapi: number;
  montantRachatCapi: number;
  maturityCash: number;
  matrixRolloverCash: number;
  repeatableMaturities: InvestmentLot[];
  nextLots: InvestmentLot[];
}

function parseYearMonth(value: string | undefined, fallbackYear: number): { year: number; month: number } {
  if (!value) return { year: fallbackYear, month: 1 };
  const [year, month] = value.split('-').map(Number);
  return {
    year: year || fallbackYear,
    month: month && month >= 1 && month <= 12 ? month : 1,
  };
}

export function getEconomicRightsPct(associate: AssociateInput): number {
  return associate.ownershipLots.reduce((sum, lot) => sum + lot.economicRightsPct, 0);
}

export function isTnsAssociate(associate: AssociateInput): boolean {
  return associate.roles.includes('gerant_tns') || associate.roles.includes('cogerant_tns');
}

export function isCivilYearBeforeOrEqual(endYear: number | undefined, anneeCivile: number): boolean {
  return endYear == null || anneeCivile <= endYear;
}

function emptyAssociateRow(
  associate: AssociateInput,
  source: TresoAssociateRevenueRow['source'],
): TresoAssociateRevenueRow {
  return {
    associateId: associate.id,
    label: associate.label,
    source,
    remuneration: 0,
    ccaRepaid: 0,
    grossDividends: 0,
    dividendTax: 0,
    tnsSocialCharges: 0,
    netRevenue: 0,
  };
}

function buildCompanyLoanYearResult(
  loan: CompanyLoanInput,
  anneeCivileDebut: number,
  year: number,
): CompanyLoanYearResult {
  if (loan.principal <= 0 || loan.durationMonths <= 0) {
    return {
      annuiteCreditIS: 0,
      interetsCreditIS: 0,
      interetsDeductibles: 0,
      revenusActifFinance: 0,
    };
  }

  const start = parseYearMonth(loan.startDate, anneeCivileDebut);
  const startOffsetMonths = (start.year - anneeCivileDebut) * 12 + (start.month - 1);
  const schedule = scheduleAmortissable({
    capital: loan.principal,
    r: loan.annualRate / 12,
    rAss: 0,
    N: loan.durationMonths,
    assurMode: 'CRD',
  });

  let annuiteCreditIS = 0;
  let interetsCreditIS = 0;

  for (let mois = 1; mois <= 12; mois++) {
    const simMonth = (year - 1) * 12 + mois;
    const loanMonth = simMonth - startOffsetMonths;
    if (loanMonth < 1) continue;
    const row = schedule[loanMonth - 1];
    if (!row) continue;
    annuiteCreditIS += row.mensu;
    interetsCreditIS += row.interet;
  }

  const revenusActifFinance =
    loan.financedAssetReturnRate && loan.financedAssetReturnRate > 0
      ? loan.principal * loan.financedAssetReturnRate * (
        computeProductiveMonthsByCivilYear({
          dateSouscription: loan.startDate,
          delaiJouissanceMois: loan.enjoymentDelayMonths ?? 0,
          dureeMois: loan.durationMonths,
          repetitionAuTerme: false,
          anneeCivile: anneeCivileDebut + year - 1,
        }) / 12
      )
      : 0;

  return {
    annuiteCreditIS,
    interetsCreditIS,
    interetsDeductibles: loan.deductibleInterest ? interetsCreditIS : 0,
    revenusActifFinance,
  };
}

export function sumCompanyLoansByYear(
  loans: CompanyLoanInput[],
  anneeCivileDebut: number,
  year: number,
): CompanyLoanYearResult {
  return loans.reduce<CompanyLoanYearResult>((sum, loan) => {
    const result = buildCompanyLoanYearResult(loan, anneeCivileDebut, year);
    return {
      annuiteCreditIS: sum.annuiteCreditIS + result.annuiteCreditIS,
      interetsCreditIS: sum.interetsCreditIS + result.interetsCreditIS,
      interetsDeductibles: sum.interetsDeductibles + result.interetsDeductibles,
      revenusActifFinance: sum.revenusActifFinance + result.revenusActifFinance,
    };
  }, {
    annuiteCreditIS: 0,
    interetsCreditIS: 0,
    interetsDeductibles: 0,
    revenusActifFinance: 0,
  });
}

export function computeSubsidiariesByYear(
  subsidiaries: SubsidiaryInput[],
  anneeCivile: number,
  params: TresoFiscalParams,
): SubsidiaryYearResult {
  const amountForSchedule = (
    schedule: AmountScheduleInput[] | undefined,
    fallbackAmount: number,
  ): number => {
    if (schedule) {
      return schedule
        .filter(item => anneeCivile >= item.startYear && (item.endYear == null || anneeCivile <= item.endYear))
        .reduce((total, item) => total + Math.max(0, item.amount), 0);
    }
    return Math.max(0, fallbackAmount);
  };

  return subsidiaries.reduce<SubsidiaryYearResult>((sum, subsidiary) => {
    const disposal = subsidiary.disposal ?? (
      subsidiary.disposalYear
        ? {
          year: subsidiary.disposalYear,
          estimatedPrice: subsidiary.estimatedDisposalPrice ?? 0,
          taxBasis: subsidiary.taxBasis ?? 0,
          fees: 0,
          regime: 'auto' as const,
        }
        : undefined
    );
    const isAfterDisposal = disposal?.year != null && anneeCivile > disposal.year;
    const servicesRevenue = isAfterDisposal
      ? 0
      : amountForSchedule(subsidiary.servicesSchedule, subsidiary.annualServicesRevenue);
    const dividendes = isAfterDisposal
      ? 0
      : amountForSchedule(subsidiary.dividendsSchedule, subsidiary.annualDividends);
    let quotePartTaxable = 0;
    let dividendesFilialesExoneres = 0;

    if (dividendes > 0 && subsidiary.motherDaughterEligible) {
      quotePartTaxable = dividendes * params.motherDaughterStandardQpfcRate;
      dividendesFilialesExoneres = dividendes - quotePartTaxable;
    } else {
      quotePartTaxable = dividendes;
    }

    const ownershipRate = Math.max(0, subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct ?? 0) / 100;
    const isDisposalYear = disposal?.year === anneeCivile;
    const disposalGrossCash = isDisposalYear ? Math.max(0, disposal.estimatedPrice) * ownershipRate : 0;
    const disposalGain = isDisposalYear
      ? Math.max(
        0,
        (disposal.estimatedPrice - disposal.taxBasis - (disposal.fees ?? 0)) * ownershipRate,
      )
      : 0;
    const autoPvlt =
      (subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct ?? 0) >= 5 &&
      (disposal?.acquisitionYear == null || disposal?.year == null || disposal.year - disposal.acquisitionYear >= 2);
    const disposalRegime = disposal?.regime === 'auto'
      ? (autoPvlt ? 'pvlt' : 'standard')
      : disposal?.regime;
    const disposalTaxableGain = disposalRegime === 'pvlt'
      ? disposalGain * Math.max(0, params.participationDisposalQpfcRate ?? 0)
      : disposalGain;

    return {
      servicesRevenue: sum.servicesRevenue + servicesRevenue,
      dividendesFiliales: sum.dividendesFiliales + dividendes,
      dividendesFilialesExoneres: sum.dividendesFilialesExoneres + dividendesFilialesExoneres,
      quotePartTaxable: sum.quotePartTaxable + quotePartTaxable + disposalTaxableGain,
      estimatedFiscalResult:
        sum.estimatedFiscalResult +
        (subsidiary.fiscalIntegrationEstimateEnabled ? subsidiary.estimatedFiscalResult ?? 0 : 0),
      disposalCash: sum.disposalCash + disposalGrossCash,
      disposalGain: sum.disposalGain + disposalGain,
    };
  }, {
    servicesRevenue: 0,
    dividendesFiliales: 0,
    dividendesFilialesExoneres: 0,
    quotePartTaxable: 0,
    estimatedFiscalResult: 0,
    disposalCash: 0,
    disposalGain: 0,
  });
}

export function sumMapValues(values: Map<string, number>): number {
  let total = 0;
  values.forEach(value => {
    total += value;
  });
  return total;
}

export function distributeSelectedCcaRepayment(params: {
  selectedAssociateId: string;
  ccaBalances: Map<string, number>;
  amount: number;
}): Map<string, number> {
  const repaid = new Map<string, number>();
  const currentBalance = params.ccaBalances.get(params.selectedAssociateId) ?? 0;
  const selectedRepayment = Math.min(params.amount, currentBalance);
  if (selectedRepayment > 0) {
    repaid.set(params.selectedAssociateId, selectedRepayment);
    params.ccaBalances.set(params.selectedAssociateId, currentBalance - selectedRepayment);
  }
  return repaid;
}

export function buildAssociateRevenueRows(
  associates: AssociateInput[],
  cashMaps: AssociateCashMaps,
  params: TresoFiscalParams,
): TresoAssociateRevenueRow[] {
  const rows: TresoAssociateRevenueRow[] = [];

  associates.forEach(associate => {
    const remuneration = cashMaps.remunerationByAssociate.get(associate.id) ?? 0;
    if (remuneration > 0) {
      rows.push({
        ...emptyAssociateRow(associate, 'remuneration'),
        remuneration,
        netRevenue: remuneration,
      });
    }

    const ccaRepaid = cashMaps.ccaRepaidByAssociate.get(associate.id) ?? 0;
    if (ccaRepaid > 0) {
      rows.push({
        ...emptyAssociateRow(associate, 'cca'),
        ccaRepaid,
        netRevenue: ccaRepaid,
      });
    }

    const ccaInterest = cashMaps.ccaInterestByAssociate?.get(associate.id) ?? 0;
    if (ccaInterest > 0) {
      rows.push({
        ...emptyAssociateRow(associate, 'cca_interets'),
        netRevenue: ccaInterest,
      });
    }

    const grossDividends = cashMaps.grossDividendsByAssociate.get(associate.id) ?? 0;
    if (grossDividends > 0) {
      const dividendTax = grossDividends * params.pfuTotal;
      rows.push({
        ...emptyAssociateRow(associate, 'dividendes'),
        grossDividends,
        dividendTax,
        netRevenue: grossDividends - dividendTax,
      });
    }

    const tnsSocialCharges = cashMaps.tnsSocialChargesByAssociate.get(associate.id) ?? 0;
    if (tnsSocialCharges > 0) {
      rows.push({
        ...emptyAssociateRow(associate, 'charges_sociales_tns'),
        tnsSocialCharges,
      });
    }
  });

  return rows;
}

export function sumAssociateNet(rows: TresoAssociateRevenueRow[], associateId: string): number {
  return rows
    .filter(row => row.associateId === associateId)
    .reduce((sum, row) => sum + row.netRevenue, 0);
}

export function createLotsFromAllocation(params: {
  pockets: AllocationPocketInput[];
  amount: number;
  allocationKey: 'initialAllocationPct' | 'annualAllocationPct';
  startYear: number;
}): InvestmentLot[] {
  if (params.amount <= 0) return [];
  const pockets = normalizeAllocationPockets(params.pockets);
  const totalPct = pockets.reduce(
    (sum, pocket) => sum + Math.max(0, pocket[params.allocationKey]),
    0,
  );
  if (totalPct <= 0) return [];
  const scale = totalPct > 100 ? 100 / totalPct : 1;

  return pockets
    .map(pocket => {
      const allocated =
        params.amount * Math.max(0, pocket[params.allocationKey]) * scale / 100;
      if (allocated <= 0) return null;
      return {
        pocket: { ...pocket, termDestination: 'treasury' },
        amount: allocated,
        value: allocated,
        capitalInvested: allocated,
        startYear: params.startYear,
      };
    })
    .filter((lot): lot is InvestmentLot => lot !== null);
}

export function computeMatrixYear(
  lots: InvestmentLot[],
  anneeCivile: number,
  params: TresoFiscalParams,
): MatrixYearResult {
  return lots.reduce<MatrixYearResult>((sum, lot) => {
    const durationYears = Math.max(1, lot.pocket.durationYears || 1);
    const monthsProductive = computeProductiveMonthsByCivilYear({
      dateSouscription: `${lot.startYear}-01`,
      delaiJouissanceMois: lot.pocket.enjoymentDelayMonths,
      dureeMois: durationYears * 12,
      repetitionAuTerme: false,
      anneeCivile,
    });

    let valueAfter = lot.value;
    let revenuDistrib = 0;
    let gainCapiN = 0;
    let montantRachatCapi = 0;
    let maturityValue = 0;

    if (lot.pocket.kind === 'distribution') {
      revenuDistrib = lot.amount * lot.pocket.annualReturnRate * (monthsProductive / 12);
      sum.capitalDistrib += lot.amount;
      sum.revenuDistrib += revenuDistrib;
      maturityValue = lot.amount;
    } else {
      const annualGrowth = lot.pocket.annualReturnRate * (monthsProductive / 12);
      valueAfter = lot.value * (1 + annualGrowth);
      sum.capitalCapi += lot.capitalInvested;
      sum.valeurCapi += valueAfter;
      sum.isLatentCapi += Math.max(0, valueAfter - lot.capitalInvested) * params.isNormalRate;
      maturityValue = valueAfter;
    }

    const isMaturityYear = anneeCivile >= lot.startYear + durationYears - 1;
    if (!isMaturityYear) {
      sum.nextLots.push({ ...lot, value: valueAfter });
      return sum;
    }

    if (lot.pocket.kind === 'capitalisation') {
      gainCapiN = Math.max(0, valueAfter - lot.capitalInvested);
      montantRachatCapi = valueAfter;
      sum.gainCapiN += gainCapiN;
      sum.montantRachatCapi += montantRachatCapi;
    }

    sum.maturityCash += maturityValue;

    if (lot.pocket.repeatAtTerm) {
      sum.repeatableMaturities.push({
        pocket: lot.pocket,
        amount: maturityValue,
        value: maturityValue,
        capitalInvested: maturityValue,
        startYear: anneeCivile + 1,
      });
      return sum;
    }

    return sum;
  }, {
    capitalDistrib: 0,
    revenuDistrib: 0,
    capitalCapi: 0,
    valeurCapi: 0,
    gainCapiN: 0,
    isLatentCapi: 0,
    montantRachatCapi: 0,
    maturityCash: 0,
    matrixRolloverCash: 0,
    repeatableMaturities: [],
    nextLots: [],
  });
}

export function createRepeatLotsFromMaturities(params: {
  maturities: InvestmentLot[];
  availableCash: number;
  startYear: number;
}): { lots: InvestmentLot[]; amount: number } {
  let remaining = Math.max(0, params.availableCash);
  const lots: InvestmentLot[] = [];
  let amount = 0;

  params.maturities.forEach(maturity => {
    if (remaining <= 0) return;
    const reinvested = Math.min(remaining, maturity.amount);
    if (reinvested <= 0) return;
    remaining -= reinvested;
    amount += reinvested;
    lots.push({
      pocket: { ...maturity.pocket, termDestination: 'treasury' },
      amount: reinvested,
      value: reinvested,
      capitalInvested: reinvested,
      startYear: params.startYear,
    });
  });

  return { lots, amount };
}

