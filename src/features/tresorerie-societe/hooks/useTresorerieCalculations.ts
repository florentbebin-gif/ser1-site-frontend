/**
 * useTresorerieCalculations.ts — Pont fiscal + orchestration de la simulation
 *
 * Construit les TresoFiscalParams depuis useFiscalContext (chaîne fiscale standard),
 * appelle simulateTresorerie() via useMemo, et calcule les 9 KPIs de la sidebar.
 *
 * Règle : zéro valeur fiscale hardcodée — tout transite par TresoFiscalParams.
 */

import { useMemo } from 'react';
import { useFiscalContext } from '../../../hooks/useFiscalContext';
import { simulateTresorerie } from '../../../engine/tresorerie/simulateTresorerie';
import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../../constants/settingsDefaults';
import type { TresoInputs, TresoFiscalParams, TresoProjectionRow } from '../../../engine/tresorerie/types';

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
  fiscalParams: TresoFiscalParams | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const HORIZON_ANS = 40;

export function useTresorerieCalculations(inputs: TresoInputs): TresoCalculationsResult {
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
      pfuRateIR,
      psRate,
      pfuTotal: pfuRateIR + psRate,
      dividendesAbattement: 0.40, // V1 non utilisé — taux légal, non paramétrable en settings V1
      irScale: fiscalContext.irScaleCurrent ?? DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    };
  }, [fiscalContext]);

  // ── Simulation ────────────────────────────────────────────────────────────
  const rows = useMemo<TresoProjectionRow[]>(() => {
    if (!fiscalParams) return [];
    try {
      return simulateTresorerie(inputs, fiscalParams, HORIZON_ANS);
    } catch {
      return [];
    }
  }, [inputs, fiscalParams]);

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
        hasRows: false,
        anneeRetraiteIndex: null,
      };
    }

    const dureeActive = inputs.dureeActiveAns;
    const anneeRetraiteIndex = Math.min(inputs.ageRetraite - inputs.ageActuel, rows.length - 1);

    // CCA total constitué = ccaCumule à la fin de la phase active
    const lastActiveRow = rows[Math.min(dureeActive - 1, rows.length - 1)];
    const ccaTotalConstitue = lastActiveRow?.ccaCumule ?? 0;

    // IS total décaissé = Σ is annuels
    const isTotalDecaisse = rows.reduce((acc, r) => acc + r.is, 0);

    // IS latent capi = dernière ligne
    const lastRow = rows[rows.length - 1];
    const isLatentCapi = lastRow?.isLatentCapi ?? 0;

    // Revenus nets à la retraite
    const retraiteRow = anneeRetraiteIndex >= 0 ? rows[anneeRetraiteIndex] : null;
    const revenusNetsRetraite = retraiteRow?.revenusNets ?? 0;

    // Durée remboursement CCA
    const dureeRemboursementCCA = inputs.besoinsRetraiteAnnuels > 0 && ccaTotalConstitue > 0
      ? Math.ceil(ccaTotalConstitue / inputs.besoinsRetraiteAnnuels)
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
      hasRows: true,
      anneeRetraiteIndex,
    };
  }, [rows, inputs]);

  return {
    rows,
    kpis,
    loading,
    error,
    fiscalParams,
  };
}
