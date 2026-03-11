/**
 * useCreditCalculations.ts - Hook de calculs pour le simulateur de crédit
 *
 * Extrait et centralisé depuis Credit.jsx legacy.
 * Toute la logique de calcul des échéanciers est ici.
 */

import { useMemo } from 'react';
import {
  monthsDiff,
  addMonths,
  labelMonthFR,
} from '../utils/creditFormatters';
import {
  computeCapitalDecesSchedule,
  computeGlobalCapitalDecesSchedule,
} from '../../../engine/credit/capitalDeces';
import type { ScheduleRowInput } from '../../../engine/credit/capitalDeces';
import type {
  CreditAssurMode,
  CreditCalcResult,
  CreditLoan,
  CreditLoanParams,
  CreditPeriodSummary,
  CreditScheduleRow,
  CreditShiftedScheduleRow,
  CreditState,
  CreditSynthesis,
  CreditType,
} from '../types';

interface ScheduleArgs {
  capital: number;
  r: number;
  rAss: number;
  N: number;
  assurMode: CreditAssurMode;
  mensuOverride?: number;
}

interface SmoothPret1Args extends ScheduleArgs {
  type: CreditType;
}

interface SmoothingMensuArgs {
  pret1: SmoothPret1Args;
  autresPretsRows: CreditShiftedScheduleRow[][];
  autresIsInfine: boolean[];
  cibleMensuTotale: number;
}

interface SmoothingBaseArgs {
  basePret1: ScheduleArgs;
  autresPretsRows: CreditShiftedScheduleRow[][];
  autresIsInfine: boolean[];
}

interface SmoothingDurationArgs extends SmoothingBaseArgs {
  totalConst: number;
}

// ============================================================================
// FORMULES DE BASE
// ============================================================================

function mensualiteAmortissable(C: number, r: number, N: number): number {
  if (N <= 0) return 0;
  if (r === 0) return C / N;
  return (C * r) / (1 - Math.pow(1 + r, -N));
}

function scheduleAmortissable({
  capital,
  r,
  rAss,
  N,
  assurMode,
  mensuOverride,
}: ScheduleArgs): ScheduleRowInput[] {
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const mensuFixe = (typeof mensuOverride === 'number' && mensuOverride > 0)
    ? mensuOverride
    : mensualiteAmortissable(capital, r, N);

  const assurFixe = assurMode === 'CI' ? capital * rAss : null;
  const EPS = 1e-8;

  for (let m = 1; m <= N; m += 1) {
    if (crd <= EPS) break;

    const crdStart = crd;
    const interet = crdStart * r;
    let mensu = mensuFixe;

    const maxMensu = interet + crdStart;
    if (mensu > maxMensu) mensu = maxMensu;
    if (mensu < interet && r > 0) mensu = interet;

    let amort = Math.max(0, mensu - interet);
    if (amort > crdStart) amort = crdStart;

    const crdEnd = Math.max(0, crdStart - amort);
    const assur = assurMode === 'CI' ? assurFixe : crdStart * rAss;

    rows.push({
      mois: m,
      interet,
      assurance: assur || 0,
      amort,
      mensu,
      mensuTotal: mensu + (assur || 0),
      crd: crdEnd,
    });
    crd = crdEnd;
  }
  return rows;
}

function scheduleInFine({
  capital,
  r,
  rAss,
  N,
  assurMode,
  mensuOverride,
}: ScheduleArgs): ScheduleRowInput[] {
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const assurFixe = assurMode === 'CI' ? capital * rAss : null;
  const EPS = 1e-8;

  for (let m = 1; m <= N; m += 1) {
    if (crd <= EPS) break;

    const crdStart = crd;
    const interet = crdStart * r;
    let mensu = (typeof mensuOverride === 'number' && mensuOverride > 0) ? mensuOverride : interet;

    const maxMensu = interet + (m === N ? crdStart : 0);
    if (mensu > maxMensu) mensu = maxMensu;
    if (mensu < interet && r > 0) mensu = interet;

    let amort = 0;
    if (m === N) {
      amort = crdStart;
      mensu = interet + amort;
    } else if (mensu > interet) {
      amort = Math.min(crdStart, mensu - interet);
    }

    const crdEnd = Math.max(0, crdStart - amort);
    const assur = assurMode === 'CI' ? assurFixe : crdStart * rAss;

    rows.push({
      mois: m,
      interet,
      assurance: assur || 0,
      amort,
      mensu,
      mensuTotal: mensu + (assur || 0),
      crd: crdEnd,
    });
    crd = crdEnd;
  }
  return rows;
}

// ============================================================================
// LISSAGE
// ============================================================================

function scheduleLisseePret1({
  pret1,
  autresPretsRows,
  autresIsInfine,
  cibleMensuTotale,
}: SmoothingMensuArgs): ScheduleRowInput[] {
  const {
    capital,
    r,
    rAss,
    N,
    assurMode,
    type,
  } = pret1;
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const assurFixe = assurMode === 'CI' ? capital * rAss : null;
  const EPS = 1e-8;

  const mensuAutresAt = (m: number): number =>
    autresPretsRows.reduce((sum, arr, i) => {
      const row = arr[m - 1];
      if (!row) return sum;
      return sum + (autresIsInfine[i] ? (row.mensuTotal - row.amort) : row.mensuTotal);
    }, 0);

  for (let m = 1; m <= N; m += 1) {
    if (crd <= EPS) break;

    const crdStart = crd;
    const interet = crdStart * r;
    const autres = mensuAutresAt(m);

    let mensu1 = Math.max(0, cibleMensuTotale - autres);

    const capMensu = interet + crdStart;
    if (mensu1 > capMensu) mensu1 = capMensu;
    if (type !== 'infine' && m < N && mensu1 < interet) mensu1 = interet;
    if (type === 'infine' && mensu1 < interet) mensu1 = interet;
    if (m === N) mensu1 = Math.min(mensu1, capMensu);

    const amort = Math.max(0, mensu1 - interet);
    const crdEnd = Math.max(0, crdStart - amort);

    const assur = assurMode === 'CI' ? assurFixe : crdStart * rAss;

    rows.push({
      mois: m,
      interet,
      assurance: assur || 0,
      amort,
      mensu: mensu1,
      mensuTotal: mensu1 + (assur || 0),
      crd: crdEnd,
    });
    crd = crdEnd;
  }
  return rows;
}

function scheduleLisseePret1Duration({
  basePret1,
  autresPretsRows,
  autresIsInfine,
  totalConst,
}: SmoothingDurationArgs): ScheduleRowInput[] {
  const {
    capital,
    r,
    rAss,
    N,
    assurMode,
  } = basePret1;
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const assurFixe = assurMode === 'CI' ? capital * rAss : null;
  const EPS = 1e-8;

  const sumAutres = (m: number): number =>
    autresPretsRows.reduce((sum, arr, i) => {
      const row = arr[m - 1];
      if (!row) return sum;
      return sum + (autresIsInfine[i] ? (row.mensuTotal - row.amort) : row.mensuTotal);
    }, 0);

  for (let m = 1; m <= N; m += 1) {
    if (crd <= EPS) break;

    const crdStart = crd;
    const interet = crdStart * r;
    const autres = sumAutres(m);

    let mensu1 = totalConst - autres;

    if (m < N && mensu1 < interet) mensu1 = interet;
    const capMensu = interet + crdStart;
    if (mensu1 > capMensu) mensu1 = capMensu;
    if (m === N) mensu1 = Math.min(mensu1, interet + crdStart);

    const amort = Math.max(0, mensu1 - interet);
    const crdEnd = Math.max(0, crdStart - amort);

    const assur = assurMode === 'CI' ? assurFixe : crdStart * rAss;

    rows.push({
      mois: m,
      interet,
      assurance: assur || 0,
      amort,
      mensu: mensu1,
      mensuTotal: mensu1 + (assur || 0),
      crd: crdEnd,
    });
    crd = crdEnd;
  }
  return rows;
}

function totalConstantForDuration({
  basePret1,
  autresPretsRows,
  autresIsInfine,
}: SmoothingBaseArgs): number {
  const { capital: B0, r, N } = basePret1;
  const pow = Math.pow(1 + r, N);

  let A = 0;
  let B = 0;

  for (let t = 1; t <= N; t += 1) {
    const a = Math.pow(1 + r, N - t);
    A += a;
    const autres = autresPretsRows.reduce((sum, arr, i) => {
      const row = arr[t - 1];
      if (!row) return sum;
      return sum + (autresIsInfine[i] ? (row.mensuTotal - row.amort) : row.mensuTotal);
    }, 0);
    B += autres * a;
  }
  return (B0 * pow + B) / A;
}

// ============================================================================
// HELPERS
// ============================================================================

function shiftRows(rows: CreditScheduleRow[], offset: number): CreditShiftedScheduleRow[] {
  if (offset === 0) return rows.slice();
  if (offset > 0) return [...Array.from({ length: offset }, (): CreditShiftedScheduleRow => null), ...rows];
  return rows.slice(-offset);
}

function toNum(v: string | number | null | undefined): number {
  const n = parseFloat(String(v ?? ''));
  return Number.isNaN(n) ? 0 : n;
}

function buildLoanParams(
  loan: CreditLoan | null,
  state: CreditState,
  fallbackStartYM: string,
): CreditLoanParams | null {
  if (!loan) return null;

  const rAn = Math.max(0, Number(loan.taux) || 0) / 100;
  const rAss = Math.max(0, Number(loan.tauxAssur) || 0) / 100;

  return {
    ...loan,
    capital: Math.max(0, toNum(loan.capital)),
    duree: Math.max(1, Math.floor(toNum(loan.duree) || 0)),
    rAn,
    rAss,
    r: rAn / 12,
    rA: rAss / 12,
    type: loan.type || state.creditType || 'amortissable',
    assurMode: loan.assurMode || state.assurMode || 'CRD',
    quotite: (loan.quotite ?? 100) / 100,
    startYM: loan.startYM || fallbackStartYM,
  };
}

function buildRequiredLoanParams(
  loan: CreditLoan,
  state: CreditState,
  fallbackStartYM: string,
): CreditLoanParams {
  return buildLoanParams(loan, state, fallbackStartYM)!;
}

function buildCapitalDecesParams(loan: CreditLoanParams) {
  return {
    capital: loan.capital,
    tauxAssur: loan.rAss * 100 * 12,
    assurMode: loan.assurMode,
    quotite: loan.quotite,
  };
}

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
