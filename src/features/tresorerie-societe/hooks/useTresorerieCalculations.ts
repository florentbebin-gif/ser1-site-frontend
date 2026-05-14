/**
 * useTresorerieCalculations.ts — Pont fiscal + orchestration de la simulation
 *
 * Construit les TresoFiscalParams depuis useFiscalContext (chaîne fiscale standard),
 * appelle simulateTresorerieV2() via useMemo, et calcule les 9 KPIs de la sidebar.
 *
 * Règle : zéro valeur fiscale hardcodée — tout transite par TresoFiscalParams.
 */

import { useMemo } from 'react';
import { useFiscalContext } from '../../../hooks/useFiscalContext';
import {
  simulateTresorerieV2,
  TresoSimulationInputError,
} from '../../../engine/tresorerie/simulateTresorerieV2';
import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../../constants/settingsDefaults';
import type { TresoInputsRuntime, TresoFiscalParams, TresoProjectionRow } from '../../../engine/tresorerie/types';
import { getAssociateAnnualIncomeNeedForYear } from '../../../engine/tresorerie/revenuePhases';
import { getAssociateProfile, getSelectedAssociate } from '../utils/tresorerieSocieteModel';
import { normalizeProjectionHorizonYears } from '../utils/projectionHorizon';

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export interface TresoKPIs {
  /** CCA total constitué (Σ apports sur durée active) */
  ccaTotalConstitue: number;
  /** IS total décaissé sur toute la projection */
  isTotalDecaisse: number;
  /** IS latent capitalisation à la dernière année */
  isLatentCapi: number;
  /** Revenu net annuel à la 1re année de retraite */
  revenusNetsRetraite: number;
  /**
   * Durée estimée de remboursement CCA (années).
   * null si besoinsRetraiteAnnuels = 0.
   */
  dureeRemboursementCCA: number | null;
  /** Valeur nette société (valeurCapi + capitalDistrib) à l'année de retraite */
  valeurNetteSocieteRetraite: number;
  /** Réserves en fin d'exercice à l'année de retraite */
  reservesRetraite: number;
  /** Capacité distribuable de l'année 1 */
  capaciteDistribuableAn1: number;
  /** true si dividendes demandés > capacité à l'année 1 */
  alerteDividendesAn1: boolean;
  /** Déficit maximum du compte bancaire face au solde minimum + BFR. */
  deficitBancaireMax: number;
  /** Solde du compte bancaire à la fin de l’horizon. */
  compteBancaireFinHorizon: number;
  /** CCA restant dû à la fin de l’horizon. */
  ccaRestantFinHorizon: number;
  /** CCA remboursé sur toute la projection. */
  ccaRembourseTotal: number;
  /** true si au moins une année ne respecte pas le solde bancaire cible. */
  alerteTresorerieBancaire: boolean;
  /** Première année civile où le compte bancaire passe sous le seuil cible. */
  premiereAnneeDeficitBancaire: number | null;
  /** true si la trésorerie bancaire respecte le solde minimum + BFR jusqu’à l’horizon. */
  tresorerieTientHorizon: boolean;
  /** true si la cible de revenu est atteinte ; null si aucune cible n’est saisie. */
  revenuCibleTientHorizon: boolean | null;
  /** Première année civile où le revenu net projeté passe sous la cible. */
  premiereAnneeRevenuCibleNonTenu: number | null;
  /** Rendement moyen annuel estimé de la trésorerie placée. */
  performanceMoyenneTresorerie: number;
  /** Indique si la projection a des lignes (inputs valides) */
  hasRows: boolean;
  /** Année de départ en retraite (index 1-based dans rows) */
  anneeRetraiteIndex: number | null;
}

// ─── Résultat du hook ─────────────────────────────────────────────────────────

export interface TresoCalculationsResult {
  rows: TresoProjectionRow[];
  kpis: TresoKPIs;
  loading: boolean;
  error: string | null;
  simulationError: string | null;
  fiscalParams: TresoFiscalParams | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface SimulationState {
  rows: TresoProjectionRow[];
  simulationError: string | null;
}

export function useTresorerieCalculations(inputs: TresoInputsRuntime): TresoCalculationsResult {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: false });

  // ── Construction des TresoFiscalParams depuis la chaîne fiscale ──────────
  const fiscalParams = useMemo<TresoFiscalParams | null>(() => {
    if (!fiscalContext) return null;

    const rawTax = fiscalContext._raw_tax ?? DEFAULT_TAX_SETTINGS;
    const rawPs = fiscalContext._raw_ps ?? DEFAULT_PS_SETTINGS;

    const corpCurrent = rawTax?.corporateTax?.current ?? DEFAULT_TAX_SETTINGS.corporateTax.current;
    const defaultsCorp = DEFAULT_TAX_SETTINGS.corporateTax.current;

    const normalRate = (corpCurrent.normalRate ?? defaultsCorp.normalRate) / 100;
    const reducedRate = (corpCurrent.reducedRate ?? defaultsCorp.reducedRate) / 100;
    const reducedThreshold = corpCurrent.reducedThreshold ?? defaultsCorp.reducedThreshold;
    const tnsDividendBasePct =
      (corpCurrent.tnsDividendBasePct ?? defaultsCorp.tnsDividendBasePct) / 100;
    const maxDeductibleCcaInterestRate =
      (corpCurrent.maxDeductibleCcaInterestRate ?? defaultsCorp.maxDeductibleCcaInterestRate) / 100;
    const dividendesAbattement =
      (corpCurrent.dividendsAbatementPct ?? defaultsCorp.dividendsAbatementPct) / 100;
    const participationDisposalQpfcRate =
      (corpCurrent.participationDisposalQpfcPct ?? defaultsCorp.participationDisposalQpfcPct) / 100;

    const qpfc = corpCurrent.motherDaughterQpfc ?? defaultsCorp.motherDaughterQpfc;
    const standardQpfc = (qpfc.standard ?? defaultsCorp.motherDaughterQpfc.standard) / 100;
    const groupQpfc = (qpfc.group ?? defaultsCorp.motherDaughterQpfc.group) / 100;

    const pfuRateIR = (fiscalContext.pfuRateIR ?? DEFAULT_TAX_SETTINGS.pfu.current.rateIR) / 100;
    const psRate = (rawPs?.patrimony?.current?.generalRate ?? DEFAULT_PS_SETTINGS.patrimony.current.generalRate) / 100;

    return {
      isNormalRate: normalRate,
      isReducedRate: reducedRate,
      isReducedThreshold: reducedThreshold,
      motherDaughterStandardQpfcRate: standardQpfc,
      motherDaughterGroupQpfcRate: groupQpfc,
      participationDisposalQpfcRate,
      pfuRateIR,
      psRate,
      pfuTotal: pfuRateIR + psRate,
      dividendesAbattement,
      irScale: fiscalContext.irScaleCurrent ?? DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
      tnsDividendBasePct,
      maxDeductibleCcaInterestRate,
    };
  }, [fiscalContext]);

  // ── Simulation ────────────────────────────────────────────────────────────
  const simulation = useMemo<SimulationState>(() => {
    if (!fiscalParams) return { rows: [], simulationError: null };
    try {
      const horizonYears = normalizeProjectionHorizonYears(inputs.company.projectionHorizonYears);
      return { rows: simulateTresorerieV2(inputs, fiscalParams, horizonYears), simulationError: null };
    } catch (simulationError) {
      if (simulationError instanceof TresoSimulationInputError) {
        return { rows: [], simulationError: simulationError.message };
      }
      throw simulationError;
    }
  }, [inputs, fiscalParams]);
  const rows = simulation.rows;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo<TresoKPIs>(() => {
    if (rows.length === 0) {
      return {
        ccaTotalConstitue: 0,
        isTotalDecaisse: 0,
        isLatentCapi: 0,
        revenusNetsRetraite: 0,
        dureeRemboursementCCA: null,
        valeurNetteSocieteRetraite: 0,
        reservesRetraite: 0,
        capaciteDistribuableAn1: 0,
        alerteDividendesAn1: false,
        deficitBancaireMax: 0,
        compteBancaireFinHorizon: 0,
        ccaRestantFinHorizon: 0,
        ccaRembourseTotal: 0,
        alerteTresorerieBancaire: false,
        premiereAnneeDeficitBancaire: null,
        tresorerieTientHorizon: true,
        revenuCibleTientHorizon: null,
        premiereAnneeRevenuCibleNonTenu: null,
        performanceMoyenneTresorerie: 0,
        hasRows: false,
        anneeRetraiteIndex: null,
      };
    }

    const selectedAssociate = getSelectedAssociate(inputs);
    const activeProfile = getAssociateProfile(inputs, selectedAssociate);
    const anneeRetraiteIndex = Math.min(
      activeProfile.retirementAge - activeProfile.currentAge,
      rows.length - 1,
    );

    // CCA total constitué = plus haut niveau projeté du compte courant.
    const ccaTotalConstitue = rows.reduce((max, row) => Math.max(max, row.ccaCumule), 0);

    // IS total décaissé = Σ is annuels
    const isTotalDecaisse = rows.reduce((acc, r) => acc + r.is, 0);

    // IS latent capi = dernière ligne
    const lastRow = rows[rows.length - 1];
    const isLatentCapi = lastRow?.isLatentCapi ?? 0;

    // Revenus nets à la retraite
    const retraiteRow = anneeRetraiteIndex >= 0 ? rows[anneeRetraiteIndex] : null;
    const revenusNetsRetraite = retraiteRow?.revenusNets ?? 0;

    // Durée remboursement CCA
    const annualNeedAtRetirement = selectedAssociate
      ? getAssociateAnnualIncomeNeedForYear(
        selectedAssociate,
        activeProfile.annualIncomeNeed,
        activeProfile.projectionStartYear + Math.max(0, anneeRetraiteIndex),
      )
      : activeProfile.annualIncomeNeed;
    const dureeRemboursementCCA = annualNeedAtRetirement > 0 && ccaTotalConstitue > 0
      ? Math.ceil(ccaTotalConstitue / annualNeedAtRetirement)
      : null;

    // Valeur nette société à la retraite
    const valeurNetteSocieteRetraite = retraiteRow
      ? (retraiteRow.valeurCapi + retraiteRow.capitalDistrib)
      : 0;

    // Réserves à la retraite
    const reservesRetraite = retraiteRow?.reservesFin ?? 0;

    // KPIs année 1
    const an1 = rows[0];
    const capaciteDistribuableAn1 = an1?.capaciteDistribuable ?? 0;
    const alerteDividendesAn1 = an1?.alerteDividendesSuperieursCapacite ?? false;
    const deficitBancaireMax = rows.reduce(
      (max, row) => Math.max(max, row.deficitTresorerieBancaire ?? 0),
      0,
    );
    const compteBancaireFinHorizon = lastRow?.tresorerieBanqueFin ?? lastRow?.tresorerieFin ?? 0;
    const ccaRestantFinHorizon = lastRow?.ccaRestant ?? 0;
    const ccaRembourseTotal = rows.reduce((sum, row) => sum + row.retraitsCCA, 0);
    const firstDeficitRow = rows.find(row => row.alerteTresorerieBancaireInsuffisante);
    const premiereAnneeDeficitBancaire = firstDeficitRow
      ? activeProfile.projectionStartYear + firstDeficitRow.year - 1
      : null;
    const revenuCibleRows = selectedAssociate
      ? rows.map(row => {
        const anneeCivile = activeProfile.projectionStartYear + row.year - 1;
        return {
          row,
          anneeCivile,
          cible: getAssociateAnnualIncomeNeedForYear(
            selectedAssociate,
            activeProfile.annualIncomeNeed,
            anneeCivile,
          ),
        };
      }).filter(item => item.cible > 0)
      : [];
    const firstRevenuCibleNonTenu = revenuCibleRows.find(item => item.row.revenusNets + 1 < item.cible);
    const revenuCibleTientHorizon = revenuCibleRows.length > 0
      ? !firstRevenuCibleNonTenu
      : null;
    let previousCapiGain = 0;
    const performance = rows.reduce(
      (sum, row) => {
        const capitalPlace = row.capitalDistrib + row.capitalCapi;
        const capiGain = Math.max(0, row.valeurCapi - row.capitalCapi);
        const capiPerformanceAnnuelle = Math.max(0, capiGain - previousCapiGain);
        previousCapiGain = capiGain;
        return {
          produits: sum.produits + row.revenuDistrib + capiPerformanceAnnuelle,
          capitalPlace: sum.capitalPlace + capitalPlace,
        };
      },
      { produits: 0, capitalPlace: 0 },
    );
    const performanceMoyenneTresorerie = performance.capitalPlace > 0
      ? performance.produits / performance.capitalPlace
      : 0;

    return {
      ccaTotalConstitue,
      isTotalDecaisse,
      isLatentCapi,
      revenusNetsRetraite,
      dureeRemboursementCCA,
      valeurNetteSocieteRetraite,
      reservesRetraite,
      capaciteDistribuableAn1,
      alerteDividendesAn1,
      deficitBancaireMax,
      compteBancaireFinHorizon,
      ccaRestantFinHorizon,
      ccaRembourseTotal,
      alerteTresorerieBancaire: deficitBancaireMax > 0,
      premiereAnneeDeficitBancaire,
      tresorerieTientHorizon: deficitBancaireMax <= 0,
      revenuCibleTientHorizon,
      premiereAnneeRevenuCibleNonTenu: firstRevenuCibleNonTenu?.anneeCivile ?? null,
      performanceMoyenneTresorerie,
      hasRows: true,
      anneeRetraiteIndex,
    };
  }, [rows, inputs]);

  return {
    rows,
    kpis,
    loading,
    error,
    simulationError: simulation.simulationError,
    fiscalParams,
  };
}
