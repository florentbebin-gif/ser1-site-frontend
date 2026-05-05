import { calculBaseEtIS } from './calculIS';
import {
  buildAssociateRevenueRows,
  computeMatrixYear,
  computeSubsidiariesByYear,
  createLotsFromAllocation,
  distributeSelectedCcaRepayment,
  getEconomicRightsPct,
  isCivilYearBeforeOrEqual,
  isTnsAssociate,
  sumAssociateNet,
  sumCompanyLoansByYear,
  sumMapValues,
} from './simulateTresorerieV2.helpers';
import type {
  TresoFiscalParams,
  TresoInputsV2,
  TresoProjectionRow,
} from './types';

export function simulateTresorerieV2(
  v2: TresoInputsV2,
  params: TresoFiscalParams,
  horizonAns: number,
): TresoProjectionRow[] {
  const { foyer, company } = v2;
  const anneeCivileDebut = foyer.projectionStartYear;
  const associates = company.associates;
  const selectedAssociateId = foyer.selectedAssociateId;

  const initialCcaBalances = new Map<string, number>();
  associates.forEach(associate => {
    initialCcaBalances.set(
      associate.id,
      company.creationType === 'existante' ? associate.ccaInitial : 0,
    );
  });

  let ccaBalances = initialCcaBalances;
  let ccaCumuleTotal = sumMapValues(initialCcaBalances);
  const initialLots = createLotsFromAllocation({
    pockets: v2.allocationMatrix.pockets,
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
    const ageAnnee = foyer.currentAge + year - 1;
    const enPhaseRetraite = ageAnnee >= foyer.retirementAge;
    const ccaBalanceDebut = new Map(ccaBalances);

    const remunerationByAssociate = new Map<string, number>();
    associates.forEach(associate => {
      if (isCivilYearBeforeOrEqual(associate.remunerationEndYear, anneeCivile)) {
        remunerationByAssociate.set(associate.id, Math.max(0, associate.remunerationAnnualCost));
      }
    });

    let apportCCA = 0;
    associates.forEach(associate => {
      const annualContribution = isCivilYearBeforeOrEqual(
        associate.ccaContributionEndYear,
        anneeCivile,
      )
        ? associate.ccaAnnualContribution
        : 0;
      const initialContribution =
        year === 1 && company.creationType !== 'existante' ? associate.ccaInitial : 0;
      const contribution = Math.max(0, annualContribution + initialContribution);
      if (contribution <= 0) return;
      apportCCA += contribution;
      ccaCumuleTotal += contribution;
      ccaBalances.set(associate.id, (ccaBalances.get(associate.id) ?? 0) + contribution);
    });

    const matrixResult = computeMatrixYear(investmentLots, anneeCivile, params);

    const loansResult = sumCompanyLoansByYear(company.loans, anneeCivileDebut, year);
    const subsidiariesResult = computeSubsidiariesByYear(company.subsidiaries, anneeCivile, params);

    const remunerationCost = sumMapValues(remunerationByAssociate);
    const tnsChargesPaidThisYear = sumMapValues(tnsChargesToPayByAssociate);
    const chargesStructure =
      company.annualStructureCosts + remunerationCost + tnsChargesPaidThisYear;

    const resultatComptableAvantIS =
      matrixResult.revenuDistrib +
      matrixResult.gainCapiN +
      loansResult.revenusActifFinance +
      subsidiariesResult.servicesRevenue +
      subsidiariesResult.dividendesFiliales +
      subsidiariesResult.disposalGain -
      loansResult.interetsCreditIS -
      chargesStructure;

    const resultatFiscalAvantIS =
      matrixResult.revenuDistrib +
      matrixResult.gainCapiN +
      loansResult.revenusActifFinance +
      subsidiariesResult.servicesRevenue +
      subsidiariesResult.quotePartTaxable +
      subsidiariesResult.estimatedFiscalResult +
      subsidiariesResult.disposalGain -
      loansResult.interetsDeductibles -
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
        matrixResult.revenuDistrib +
        subsidiariesResult.servicesRevenue +
        subsidiariesResult.dividendesFiliales +
        subsidiariesResult.disposalCash +
        matrixResult.maturityCash +
        matrixResult.matrixRolloverCash +
        apportCCA +
        loansResult.revenusActifFinance -
        is -
        loansResult.annuiteCreditIS -
        chargesStructure,
    );

    const selectedRemuneration = remunerationByAssociate.get(selectedAssociateId) ?? 0;
    const besoinRetraiteApresRemuneration = enPhaseRetraite
      ? Math.max(0, foyer.annualIncomeNeed - selectedRemuneration)
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
    const besoinNetRestant = enPhaseRetraite
      ? Math.max(0, foyer.annualIncomeNeed - selectedRemuneration - retraitsCCA)
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
        grossDividendsByAssociate,
        tnsSocialChargesByAssociate,
      },
      params,
    );
    const revenusNets = sumAssociateNet(revenusParAssocie, selectedAssociateId);
    const deltaBesoin = revenusNets - foyer.annualIncomeNeed;
    const pfuDividendes = dividendesAssociesBruts * params.pfuTotal;

    const fluxEntrants =
      matrixResult.revenuDistrib +
      subsidiariesResult.servicesRevenue +
      subsidiariesResult.dividendesFiliales +
      subsidiariesResult.disposalCash +
      matrixResult.maturityCash +
      matrixResult.matrixRolloverCash +
      apportCCA +
      loansResult.revenusActifFinance;
    const fluxSortants =
      is +
      retraitsCCA +
      dividendesAssociesBruts +
      loansResult.annuiteCreditIS +
      chargesStructure;
    const tresorerieAvantBalayage = tresorerieDebut + fluxEntrants - fluxSortants;
    const sweepBase = Math.max(0, tresorerieAvantBalayage - v2.allocationMatrix.sweepThreshold);
    const annualSweepLots = createLotsFromAllocation({
      pockets: v2.allocationMatrix.pockets,
      amount: sweepBase,
      allocationKey: 'annualAllocationPct',
      startYear: anneeCivile + 1,
    });
    const sweptAmount = annualSweepLots.reduce((sum, lot) => sum + lot.amount, 0);
    const tresorerieFin = tresorerieAvantBalayage - sweptAmount;

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
      chargesStructure,
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
    });

    tresorerieDebut = tresorerieFin;
    reservesDebut = reservesFin;
    tnsChargesToPayByAssociate = tnsSocialChargesByAssociate;
    investmentLots = [...matrixResult.nextLots, ...annualSweepLots];
  }

  return rows;
}
