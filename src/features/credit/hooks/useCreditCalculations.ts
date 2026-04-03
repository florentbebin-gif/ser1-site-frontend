/**
 * useCreditCalculations.ts - Hook de calculs pour le simulateur de crédit
 *
 * Extrait et centralise depuis l'ancienne implementation monolithique du simulateur Credit.
 * Toute la logique de calcul des échéanciers est ici.
 */

import { useMemo } from 'react';
import {
  monthsDiff,
  addMonths,
  labelMonthFR,
  toNum,
} from '../utils/creditFormatters';
import {
  buildCapitalDecesParams,
  buildLoanParams,
  buildRequiredLoanParams,
  shiftRows,
} from '../utils/creditCalculationHelpers';
import {
  computeCapitalDecesSchedule,
  computeGlobalCapitalDecesSchedule,
} from '../../../engine/credit/capitalDeces';
import type { ScheduleRowInput } from '../../../engine/credit/capitalDeces';
import {
  mensualiteAmortissable,
  scheduleAmortissable,
  scheduleInFine,
  scheduleLisseePret1,
  scheduleLisseePret1Duration,
  totalConstantForDuration,
  type ScheduleArgs,
  type SmoothPret1Args,
} from './creditSchedules';
import type {
  CreditCalcResult,
  CreditLoanParams,
  CreditPeriodSummary,
  CreditScheduleRow,
  CreditShiftedScheduleRow,
  CreditState,
  CreditSynthesis,
} from '../types';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export function useCreditCalculations(
  state: CreditState,
  globalStartYM?: string,
): CreditCalcResult {
  const startYM = globalStartYM || state.startYM;

  const pret1Params = useMemo<CreditLoanParams>(
    () => buildRequiredLoanParams(state.pret1, state, startYM),
    [state, startYM],
  );

  const mensuBasePret1 = useMemo<number>(() => {
    const {
      type,
      capital,
      r,
      duree: N,
    } = pret1Params;
    if (type === 'infine') return r === 0 ? 0 : capital * r;
    return mensualiteAmortissable(capital, r, N);
  }, [pret1Params]);

  const autresParams = useMemo<CreditLoanParams[]>(() => {
    const params = [
      buildLoanParams(state.pret2, state, startYM),
      buildLoanParams(state.pret3, state, startYM),
    ];
    return params.filter((value): value is CreditLoanParams => value !== null);
  }, [state, startYM]);

  const autresRows = useMemo<CreditShiftedScheduleRow[][]>(() => (
    autresParams.map((loan) => {
      const baseRows = loan.type === 'infine'
        ? scheduleInFine({
          capital: loan.capital,
          r: loan.r,
          rAss: loan.rA,
          N: loan.duree,
          assurMode: loan.assurMode,
        })
        : scheduleAmortissable({
          capital: loan.capital,
          r: loan.r,
          rAss: loan.rA,
          N: loan.duree,
          assurMode: loan.assurMode,
        });

      const rowsWithDeces = computeCapitalDecesSchedule(buildCapitalDecesParams(loan), baseRows);
      const offset = monthsDiff(startYM, loan.startYM);
      return shiftRows(rowsWithDeces, offset);
    })
  ), [autresParams, startYM]);

  const basePret1Rows = useMemo<CreditScheduleRow[]>(() => {
    const {
      capital,
      r,
      rA: rAss,
      duree: N,
      assurMode,
      type,
    } = pret1Params;

    const base = {
      capital,
      r,
      rAss,
      N,
      assurMode,
    };

    const rows = type === 'infine'
      ? scheduleInFine({ ...base, mensuOverride: mensuBasePret1 })
      : scheduleAmortissable({ ...base, mensuOverride: mensuBasePret1 });

    return computeCapitalDecesSchedule(buildCapitalDecesParams(pret1Params), rows);
  }, [pret1Params, mensuBasePret1]);

  const pret1IsInfine = pret1Params.type === 'infine';

  const autresIsInfine = useMemo<boolean[]>(
    () => autresParams.map((loan) => loan.type === 'infine'),
    [autresParams],
  );

  const anyInfine = pret1IsInfine || autresIsInfine.some(Boolean);

  const pret1Rows = useMemo<CreditScheduleRow[]>(() => {
    const {
      capital,
      r,
      rA: rAss,
      duree: N,
      assurMode,
      type,
    } = pret1Params;
    const basePret1: SmoothPret1Args = {
      capital,
      r,
      rAss,
      N,
      assurMode,
      type,
    };

    let rows: ScheduleRowInput[];
    if (!state.lisserPret1 || pret1IsInfine || autresRows.length === 0) {
      rows = type === 'infine'
        ? scheduleInFine({ ...basePret1, mensuOverride: mensuBasePret1 })
        : scheduleAmortissable({ ...basePret1, mensuOverride: mensuBasePret1 });
    } else if (state.lissageMode === 'mensu') {
      const mensuAutresM1 = autresRows.reduce((sum, arr) => sum + (arr[0]?.mensuTotal || 0), 0);
      rows = scheduleLisseePret1({
        pret1: basePret1,
        autresPretsRows: autresRows,
        autresIsInfine,
        cibleMensuTotale: mensuBasePret1 + mensuAutresM1,
      });
    } else {
      const baseArgs: ScheduleArgs = {
        capital,
        r,
        rAss,
        N,
        assurMode,
      };
      const totalConst = totalConstantForDuration({
        basePret1: baseArgs,
        autresPretsRows: autresRows,
        autresIsInfine,
      });
      rows = scheduleLisseePret1Duration({
        basePret1: baseArgs,
        autresPretsRows: autresRows,
        autresIsInfine,
        totalConst,
      });
    }

    return computeCapitalDecesSchedule(buildCapitalDecesParams(pret1Params), rows);
  }, [
    pret1Params,
    mensuBasePret1,
    state.lisserPret1,
    state.lissageMode,
    pret1IsInfine,
    autresRows,
    autresIsInfine,
  ]);

  const dureeBaseMois = basePret1Rows.length;
  const dureeLisseMois = pret1Rows.length;
  const diffDureesMois = dureeLisseMois - dureeBaseMois;

  const agrRows = useMemo<CreditScheduleRow[]>(() => {
    const allLoansParams = [
      buildCapitalDecesParams(pret1Params),
      ...autresParams.map(buildCapitalDecesParams),
    ];

    return computeGlobalCapitalDecesSchedule(allLoansParams, [pret1Rows, ...autresRows]);
  }, [pret1Params, autresParams, pret1Rows, autresRows]);

  const synthese = useMemo<CreditSynthesis>(() => {
    const pret1Interets = pret1Rows.reduce((sum, row) => sum + (row.interet || 0), 0);
    const pret1Assurance = pret1Rows.reduce((sum, row) => sum + (row.assurance || 0), 0);

    const autresInterets = autresRows.reduce(
      (total, rows) => total + rows.reduce((sum, row) => sum + (row?.interet || 0), 0),
      0,
    );
    const autresAssurance = autresRows.reduce(
      (total, rows) => total + rows.reduce((sum, row) => sum + (row?.assurance || 0), 0),
      0,
    );

    const totalInterets = pret1Interets + autresInterets;
    const totalAssurance = pret1Assurance + autresAssurance;

    return {
      totalInterets,
      totalAssurance,
      coutTotalCredit: totalInterets + totalAssurance,
      mensualiteTotaleM1: (pret1Rows[0]?.mensu || 0) + autresRows.reduce((sum, rows) => sum + (rows[0]?.mensu || 0), 0),
      primeAssMensuelle: (pret1Rows[0]?.assurance || 0) + autresRows.reduce((sum, rows) => sum + (rows[0]?.assurance || 0), 0),
      capitalEmprunte:
        pret1Rows.reduce((sum, row) => sum + (row.amort || 0), 0)
        + autresRows.reduce((total, rows) => total + rows.reduce((sum, row) => sum + (row?.amort || 0), 0), 0),
      diffDureesMois,
    };
  }, [pret1Rows, autresRows, diffDureesMois]);

  const synthesePeriodes = useMemo<CreditPeriodSummary[]>(() => {
    if (autresParams.length === 0) return [];

    const changeSet = new Set<number>([0]);

    autresParams.forEach((loan) => {
      const offset = monthsDiff(startYM, loan.startYM);
      const duration = Math.max(1, Math.floor(toNum(loan.duree) || 0));
      const startIndex = Math.max(0, offset);
      const endIndex = Math.max(0, offset + duration);
      changeSet.add(startIndex);
      changeSet.add(endIndex);
    });

    const maxLen = Math.max(pret1Rows.length, ...autresRows.map((rows) => rows.length), pret1Params.duree);
    const points = Array.from(changeSet)
      .sort((a, b) => a - b)
      .filter((value) => value < maxLen);

    const rows = points.map((monthIndex) => {
      const ym = addMonths(startYM, monthIndex);
      const p1 = pret1Rows[monthIndex]?.mensu || 0;
      const p2 = autresRows[0]?.[monthIndex]?.mensu || 0;
      const p3 = autresRows[1]?.[monthIndex]?.mensu || 0;
      return {
        from: `À partir de ${labelMonthFR(ym)}`,
        p1,
        p2,
        p3,
        monthIndex,
      };
    });

    const dedup: CreditPeriodSummary[] = [];
    for (const row of rows) {
      const last = dedup[dedup.length - 1];
      if (last && last.p1 === row.p1 && last.p2 === row.p2 && last.p3 === row.p3) {
        continue;
      }
      dedup.push(row);
    }
    return dedup;
  }, [autresParams, startYM, pret1Rows, autresRows, pret1Params.duree]);

  return {
    pret1Rows,
    pret2Rows: autresRows[0] || [],
    pret3Rows: autresRows[1] || [],
    agrRows,
    pret1Params,
    autresParams,
    anyInfine,
    pret1IsInfine,
    autresIsInfine,
    hasPretsAdditionnels: autresParams.length > 0,
    synthese,
    synthesePeriodes,
    dureeBaseMois,
    dureeLisseMois,
    diffDureesMois,
    mensuBasePret1,
  };
}
