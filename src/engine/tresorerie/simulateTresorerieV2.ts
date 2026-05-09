import { calculBaseEtIS } from './calculIS';
import { selectAllocationPocketsForSimulation } from './allocationPockets';
import {
  getAssociateProfile,
  getCapitalPct,
  getEconomicPct,
  getSelectedAssociate,
  getSelectedAssociateId,
} from './runtimeAccessors';
import {
  buildAssociateRevenueRows,
  computeMatrixYear,
  computeSubsidiariesByYear,
  createLotsFromAllocation,
  createRepeatLotsFromMaturities,
  distributeSelectedCcaRepayment,
  getEconomicRightsPct,
  isCivilYearBeforeOrEqual,
  isTnsAssociate,
  sumAssociateNet,
  sumCompanyLoansByYear,
  sumMapValues,
} from './simulateTresorerieV2.helpers';
import type {
  AssociateInput,
  CompanyInput,
  TresoFiscalParams,
  TresoInputsRuntime,
  TresoProjectionRow,
} from './types';

export class TresoSimulationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TresoSimulationInputError';
  }
}

const CAPITAL_OWNERSHIP_OVERFLOW_ERROR = 'Détention capital supérieure à 100 %.';
const ECONOMIC_OWNERSHIP_OVERFLOW_ERROR = 'Droits économiques supérieurs à 100 %.';

function getIncomeStatement(company: CompanyInput): {
  annualRevenue: number;
  annualStructureCosts: number;
  workingCapitalRequirement: number;
} {
  return company.incomeStatement ?? {
    annualRevenue: 0,
    annualStructureCosts: company.annualStructureCosts,
    workingCapitalRequirement: 0,
  };
}

function getInitialCcaBalance(
  inputs: TresoInputsRuntime,
  associate: AssociateInput,
): number {
  if (associate.cca) {
    return Math.max(0, associate.cca.currentBalance);
  }
  return inputs.company.creationType === 'existante' ? associate.ccaInitial : 0;
}

function getAnnualCcaContribution(associate: AssociateInput, anneeCivile: number): number {
  if (associate.cca) {
    const contribution = associate.cca.annualContribution;
    const isActive =
      anneeCivile >= contribution.startYear &&
      (contribution.endYear == null || anneeCivile <= contribution.endYear);
    return isActive ? Math.max(0, contribution.amount) : 0;
  }
  return isCivilYearBeforeOrEqual(associate.ccaContributionEndYear, anneeCivile)
    ? associate.ccaAnnualContribution
    : 0;
}

function getExceptionalCcaContribution(associate: AssociateInput, anneeCivile: number): number {
  return associate.cca?.exceptionalContributions
    .filter(contribution => contribution.year === anneeCivile)
    .reduce((sum, contribution) => sum + Math.max(0, contribution.amount), 0) ?? 0;
}

function getInitialCcaContribution(
  inputs: TresoInputsRuntime,
  associate: AssociateInput,
  year: number,
): number {
  if (associate.cca) return 0;
  return year === 1 && inputs.company.creationType !== 'existante'
    ? Math.max(0, associate.ccaInitial)
    : 0;
}

function getAssociateRemunerationForYear(
  associate: AssociateInput,
  anneeCivile: number,
): { holdingCost: number; netRevenue: number } {
  const remuneration = associate.remuneration ?? {
    source: 'holding' as const,
    loadedAnnualCost: Math.max(0, associate.remunerationAnnualCost ?? 0),
    socialChargeRate: 0,
    endYear: associate.remunerationEndYear,
  };
  const startsBeforeOrDuringYear =
    remuneration.startYear == null || anneeCivile >= remuneration.startYear;
  if (!startsBeforeOrDuringYear || !isCivilYearBeforeOrEqual(remuneration.endYear, anneeCivile)) {
    return { holdingCost: 0, netRevenue: 0 };
  }

  const loadedAnnualCost = Math.max(0, remuneration.loadedAnnualCost);
  const socialChargeRate = Math.max(0, Math.min(remuneration.socialChargeRate, 1));
  return {
    holdingCost: remuneration.source === 'holding' ? loadedAnnualCost : 0,
    netRevenue: loadedAnnualCost * (1 - socialChargeRate),
  };
}

function getSelectedAnnualIncomeNeed(
  selectedAssociate: AssociateInput,
  defaultAnnualNeed: number,
  anneeCivile: number,
): number {
  const remuneration = selectedAssociate.remuneration;
  if (
    remuneration?.endYear != null &&
    anneeCivile > remuneration.endYear &&
    (remuneration.annualNeedAfterStop ?? 0) > 0
  ) {
    return Math.max(0, remuneration.annualNeedAfterStop ?? 0);
  }
  return defaultAnnualNeed;
}

function hasSelectedNeedForYear(
  selectedAssociate: AssociateInput,
  enPhaseRetraite: boolean,
  anneeCivile: number,
): boolean {
  const remuneration = selectedAssociate.remuneration;
  return enPhaseRetraite || (
    remuneration?.endYear != null &&
    anneeCivile > remuneration.endYear &&
    (remuneration.annualNeedAfterStop ?? 0) > 0
  );
}

function validateOwnershipTotals(associates: AssociateInput[]): void {
  const totalCapitalPct = associates.reduce((sum, associate) => sum + getCapitalPct(associate), 0);
  const totalEconomicPct = associates.reduce((sum, associate) => sum + getEconomicPct(associate), 0);
  if (totalCapitalPct > 100) {
    throw new TresoSimulationInputError(CAPITAL_OWNERSHIP_OVERFLOW_ERROR);
  }
  if (totalEconomicPct > 100) {
    throw new TresoSimulationInputError(ECONOMIC_OWNERSHIP_OVERFLOW_ERROR);
  }
}

export function simulateTresorerieV2(
  v2: TresoInputsRuntime,
  params: TresoFiscalParams,
  horizonAns: number,
): TresoProjectionRow[] {
  const { company } = v2;
  const associates = company.associates;
  validateOwnershipTotals(associates);
  const selectedAssociateId = getSelectedAssociateId(v2);
  const selectedAssociate = getSelectedAssociate(v2) ?? associates[0];
  const selectedProfile = getAssociateProfile(v2, selectedAssociate);
  const anneeCivileDebut = selectedProfile.projectionStartYear;
  const incomeStatement = getIncomeStatement(company);
  const allocationPockets = selectAllocationPocketsForSimulation(v2.allocationMatrix);
  const minimumBankBalance =
    v2.allocationMatrix.minimumBankBalance ?? v2.allocationMatrix.sweepThreshold ?? 0;

  const initialCcaBalances = new Map<string, number>();
  associates.forEach(associate => {
    initialCcaBalances.set(associate.id, getInitialCcaBalance(v2, associate));
  });

  let ccaBalances = new Map(initialCcaBalances);
  let ccaCumuleTotal = sumMapValues(initialCcaBalances);
  const initialLots = createLotsFromAllocation({
    pockets: allocationPockets,
    amount: company.treasuryInitial,
    allocationKey: 'initialAllocationPct',
    startYear: anneeCivileDebut,
  });
  const initialInvested = initialLots.reduce((sum, lot) => sum + lot.amount, 0);

  let investmentLots = initialLots;
  let tresorerieDebut = company.treasuryInitial - initialInvested;
  let reservesDebut = company.reservesInitial;
  let tnsChargesToPayByAssociate = new Map<string, number>();

  const rows: TresoProjectionRow[] = [];

  for (let year = 1; year <= horizonAns; year++) {
    const anneeCivile = anneeCivileDebut + year - 1;
    const ageAnnee = selectedProfile.currentAge + year - 1;
    const enPhaseRetraite = ageAnnee >= selectedProfile.retirementAge;
    const annualIncomeNeed = getSelectedAnnualIncomeNeed(
      selectedAssociate,
      selectedProfile.annualIncomeNeed,
      anneeCivile,
    );
    const enPhaseBesoin = hasSelectedNeedForYear(selectedAssociate, enPhaseRetraite, anneeCivile);
    const ccaBalanceDebut = new Map(ccaBalances);

    const remunerationByAssociate = new Map<string, number>();
    const holdingRemunerationCostByAssociate = new Map<string, number>();
    associates.forEach(associate => {
      const remuneration = getAssociateRemunerationForYear(associate, anneeCivile);
      if (remuneration.netRevenue > 0) {
        remunerationByAssociate.set(associate.id, remuneration.netRevenue);
      }
      if (remuneration.holdingCost > 0) {
        holdingRemunerationCostByAssociate.set(associate.id, remuneration.holdingCost);
      }
    });

    let apportCCA = 0;
    associates.forEach(associate => {
      const annualContribution = getAnnualCcaContribution(associate, anneeCivile);
      const initialContribution = getInitialCcaContribution(v2, associate, year);
      const exceptionalContribution = getExceptionalCcaContribution(associate, anneeCivile);
      const contribution = Math.max(0, annualContribution + initialContribution + exceptionalContribution);
      if (contribution <= 0) return;
      apportCCA += contribution;
      ccaCumuleTotal += contribution;
      ccaBalances.set(associate.id, (ccaBalances.get(associate.id) ?? 0) + contribution);
    });

    const matrixResult = computeMatrixYear(investmentLots, anneeCivile, params);

    const loansResult = sumCompanyLoansByYear(company.loans, anneeCivileDebut, year);
    const subsidiariesResult = computeSubsidiariesByYear(company.subsidiaries, anneeCivile, params);

    const ccaInterestByAssociate = new Map<string, number>();
    const ccaDeductibleInterestByAssociate = new Map<string, number>();
    associates.forEach(associate => {
      const remunerationRate = Math.max(0, associate.cca?.remunerationRate ?? 0);
      const balance = ccaBalanceDebut.get(associate.id) ?? 0;
      if (balance <= 0 || remunerationRate <= 0) return;
      const interest = balance * remunerationRate;
      const maxDeductibleRate = params.maxDeductibleCcaInterestRate ?? remunerationRate;
      const deductibleInterest = balance * Math.min(remunerationRate, Math.max(0, maxDeductibleRate));
      ccaInterestByAssociate.set(associate.id, interest);
      ccaDeductibleInterestByAssociate.set(associate.id, Math.min(interest, deductibleInterest));
    });

    const interetsCCA = sumMapValues(ccaInterestByAssociate);
    const interetsCCADeductibles = sumMapValues(ccaDeductibleInterestByAssociate);
    const interetsCCANonDeductibles = Math.max(0, interetsCCA - interetsCCADeductibles);
    const remunerationCost = sumMapValues(holdingRemunerationCostByAssociate);
    const tnsChargesPaidThisYear = sumMapValues(tnsChargesToPayByAssociate);
    const chargesStructure =
      incomeStatement.annualStructureCosts + remunerationCost + tnsChargesPaidThisYear;

    const resultatComptableAvantIS =
      incomeStatement.annualRevenue +
      matrixResult.revenuDistrib +
      matrixResult.gainCapiN +
      loansResult.revenusActifFinance +
      subsidiariesResult.servicesRevenue +
      subsidiariesResult.dividendesFiliales +
      subsidiariesResult.disposalGain -
      loansResult.interetsCreditIS -
      interetsCCA -
      chargesStructure;

    const resultatFiscalAvantIS =
      incomeStatement.annualRevenue +
      matrixResult.revenuDistrib +
      matrixResult.gainCapiN +
      loansResult.revenusActifFinance +
      subsidiariesResult.servicesRevenue +
      subsidiariesResult.quotePartTaxable +
      subsidiariesResult.estimatedFiscalResult +
      loansResult.interetsDeductibles -
      interetsCCADeductibles -
      chargesStructure;

    const { baseIS, is } = calculBaseEtIS(
      resultatFiscalAvantIS,
      params,
      company.reducedCorporateTaxEligible,
    );

    const resultatNetComptable = resultatComptableAvantIS - is;
    const capaciteDistribuable = Math.max(0, reservesDebut + resultatNetComptable);

    const tresorerieDisponibleApresIS = Math.max(
      0,
      tresorerieDebut +
        incomeStatement.annualRevenue +
        matrixResult.revenuDistrib +
        subsidiariesResult.servicesRevenue +
        subsidiariesResult.dividendesFiliales +
        subsidiariesResult.disposalCash +
        matrixResult.maturityCash +
        apportCCA +
        loansResult.revenusActifFinance -
        is -
        loansResult.annuiteCreditIS -
        interetsCCA -
        chargesStructure,
    );

    const selectedRemuneration = remunerationByAssociate.get(selectedAssociateId) ?? 0;
    const besoinRetraiteApresRemuneration = enPhaseBesoin
      ? Math.max(0, annualIncomeNeed - selectedRemuneration)
      : 0;
    const retraitsCCA = Math.min(
      besoinRetraiteApresRemuneration,
      ccaBalances.get(selectedAssociateId) ?? 0,
      tresorerieDisponibleApresIS,
    );
    const ccaRepaidByAssociate = distributeSelectedCcaRepayment({
      selectedAssociateId,
      ccaBalances,
      amount: retraitsCCA,
    });

    const selectedEconomicPct =
      (getEconomicRightsPct(associates.find(a => a.id === selectedAssociateId) ?? associates[0]) || 0) / 100;
    const besoinNetRestant = enPhaseBesoin
      ? Math.max(0, annualIncomeNeed - selectedRemuneration - retraitsCCA)
      : 0;
    const dividendesComplementairesBrutsDemandes =
      besoinNetRestant > 0 && params.pfuTotal < 1 && selectedEconomicPct > 0
        ? besoinNetRestant / (1 - params.pfuTotal) / selectedEconomicPct
        : 0;

    const creditIRResult = { mensualite: 0, annuite: 0, dividendesBrutsDemandes: 0 };
    const dividendesBrutsCreditIRDemandes = creditIRResult.dividendesBrutsDemandes;
    const dividendesDemandesTotaux =
      dividendesBrutsCreditIRDemandes + dividendesComplementairesBrutsDemandes;

    const tresoDispoApresCCAEtIS = Math.max(0, tresorerieDisponibleApresIS - retraitsCCA);
    const dividendesAssociesBruts = Math.min(
      dividendesDemandesTotaux,
      capaciteDistribuable,
      tresoDispoApresCCAEtIS,
    );
    const alerteDividendesSuperieursCapacite =
      dividendesAssociesBruts < dividendesDemandesTotaux;

    const grossDividendsByAssociate = new Map<string, number>();
    associates.forEach(associate => {
      const grossDividends = dividendesAssociesBruts * (getEconomicRightsPct(associate) / 100);
      if (grossDividends > 0) {
        grossDividendsByAssociate.set(associate.id, grossDividends);
      }
    });

    const tnsSocialChargesByAssociate = new Map<string, number>();
    associates.forEach(associate => {
      if (!isTnsAssociate(associate)) return;
      const manualRate = associate.socialChargesManualRate ?? 0;
      if (manualRate <= 0) return;
      const grossDividends = grossDividendsByAssociate.get(associate.id) ?? 0;
      const ccaAtStart = ccaBalanceDebut.get(associate.id) ?? 0;
      const threshold =
        (company.shareCapital + company.sharePremium + ccaAtStart) *
        (params.tnsDividendBasePct ?? 0);
      const socialCharges = Math.max(0, grossDividends - threshold) * manualRate;
      if (socialCharges > 0) {
        tnsSocialChargesByAssociate.set(associate.id, socialCharges);
      }
    });

    const revenusParAssocie = buildAssociateRevenueRows(
      associates,
      {
        remunerationByAssociate,
        ccaRepaidByAssociate,
        ccaInterestByAssociate,
        grossDividendsByAssociate,
        tnsSocialChargesByAssociate,
      },
      params,
    );
    const revenusNets = sumAssociateNet(revenusParAssocie, selectedAssociateId);
    const deltaBesoin = revenusNets - annualIncomeNeed;
    const pfuDividendes = dividendesAssociesBruts * params.pfuTotal;

    const fluxEntrants =
      incomeStatement.annualRevenue +
      matrixResult.revenuDistrib +
      subsidiariesResult.servicesRevenue +
      subsidiariesResult.dividendesFiliales +
      subsidiariesResult.disposalCash +
      matrixResult.maturityCash +
      apportCCA +
      loansResult.revenusActifFinance;
    const fluxSortants =
      is +
      retraitsCCA +
      dividendesAssociesBruts +
      loansResult.annuiteCreditIS +
      interetsCCA +
      chargesStructure;
    const tresorerieAvantBalayage = tresorerieDebut + fluxEntrants - fluxSortants;
    const cashReserve = minimumBankBalance + incomeStatement.workingCapitalRequirement;
    const cashProtectedFromImmediateSweep = subsidiariesResult.disposalCash;
    const sweepBase = Math.max(
      0,
      tresorerieAvantBalayage - cashReserve - cashProtectedFromImmediateSweep,
    );
    const repeatLots = createRepeatLotsFromMaturities({
      maturities: matrixResult.repeatableMaturities,
      availableCash: sweepBase,
      startYear: anneeCivile + 1,
    });
    const sweepBaseAfterRepeat = Math.max(0, sweepBase - repeatLots.amount);
    const annualSweepLots = createLotsFromAllocation({
      pockets: allocationPockets,
      amount: sweepBaseAfterRepeat,
      allocationKey: 'annualAllocationPct',
      startYear: anneeCivile + 1,
    });
    const sweptAmount = annualSweepLots.reduce((sum, lot) => sum + lot.amount, 0);
    const tresorerieFin = tresorerieAvantBalayage - repeatLots.amount - sweptAmount;
    const deficitTresorerieBancaire = Math.max(0, cashReserve - tresorerieFin);

    const ccaRestant = sumMapValues(ccaBalances);
    const miseEnReserve = resultatNetComptable - dividendesAssociesBruts;
    const reservesFin = reservesDebut + miseEnReserve;

    rows.push({
      year,
      apportCCA,
      ccaCumule: ccaCumuleTotal,
      ccaRestant,
      retraitsCCA,
      capitalDistrib: matrixResult.capitalDistrib,
      revenuDistrib: matrixResult.revenuDistrib,
      capitalCapi: matrixResult.capitalCapi,
      valeurCapi: matrixResult.valeurCapi,
      gainCapiN: matrixResult.gainCapiN,
      isLatentCapi: matrixResult.isLatentCapi,
      montantRachatCapi: matrixResult.montantRachatCapi,
      dividendesFiliales: subsidiariesResult.dividendesFiliales,
      dividendesFilialesExoneres: subsidiariesResult.dividendesFilialesExoneres,
      quotePartTaxable: subsidiariesResult.quotePartTaxable,
      cessionFilialesCash: subsidiariesResult.disposalCash,
      cessionFilialesPlusValueBrute: subsidiariesResult.disposalGain,
      cessionFilialesQuotePartTaxable: subsidiariesResult.disposalTaxableGain,
      chargesStructure,
      interetsCCA,
      interetsCCADeductibles,
      interetsCCANonDeductibles,
      interetsCreditIS: loansResult.interetsCreditIS,
      resultatComptableAvantIS,
      resultatFiscalAvantIS,
      baseIS,
      is,
      resultatNetComptable,
      dividendesBrutsCreditIRDemandes,
      dividendesComplementairesBrutsDemandes,
      dividendesDemandesTotaux,
      dividendesAssociesBruts,
      pfu: pfuDividendes,
      reservesDebut,
      capaciteDistribuable,
      miseEnReserve,
      reservesFin,
      alerteDividendesSuperieursCapacite,
      annuiteCreditIS: loansResult.annuiteCreditIS,
      revenusActifFinance: loansResult.revenusActifFinance,
      revenusNets,
      deltaBesoin,
      revenusParAssocie,
      tresorerieDebut,
      tresorerieFin,
      tresorerieBanqueDebut: tresorerieDebut,
      tresorerieBanqueFin: tresorerieFin,
      soldeMinimumCompteBancaire: minimumBankBalance,
      bfr: incomeStatement.workingCapitalRequirement,
      tresorerieDisponible: Math.max(0, tresorerieFin - cashReserve),
      montantInvestiInitial: initialInvested,
      montantBalayeAnnuel: sweptAmount,
      montantReinvestiAuTerme: repeatLots.amount,
      deficitTresorerieBancaire,
      alerteTresorerieBancaireInsuffisante: deficitTresorerieBancaire > 0,
    });

    tresorerieDebut = tresorerieFin;
    reservesDebut = reservesFin;
    tnsChargesToPayByAssociate = tnsSocialChargesByAssociate;
    investmentLots = [...matrixResult.nextLots, ...repeatLots.lots, ...annualSweepLots];
  }

  return rows;
}
