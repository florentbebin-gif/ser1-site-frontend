import type { ScheduleRowInput } from '../../../engine/credit/capitalDeces';
import type {
  CreditAssurMode,
  CreditShiftedScheduleRow,
  CreditType,
} from '../types';

export interface ScheduleArgs {
  capital: number;
  r: number;
  rAss: number;
  N: number;
  assurMode: CreditAssurMode;
  mensuOverride?: number;
}

export interface SmoothPret1Args extends ScheduleArgs {
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

export function mensualiteAmortissable(C: number, r: number, N: number): number {
  if (N <= 0) return 0;
  if (r === 0) return C / N;
  return (C * r) / (1 - Math.pow(1 + r, -N));
}

export function scheduleAmortissable({
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

export function scheduleInFine({
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

export function scheduleLisseePret1({
  pret1,
  autresPretsRows,
  autresIsInfine,
  cibleMensuTotale,
}: SmoothingMensuArgs): ScheduleRowInput[] {
  const { capital, r, rAss, N, assurMode, type } = pret1;
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const assurFixe = assurMode === 'CI' ? capital * rAss : null;
  const EPS = 1e-8;

  const mensuAutresAt = (m: number): number => autresPretsRows.reduce((sum, arr, i) => {
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

export function scheduleLisseePret1Duration({
  basePret1,
  autresPretsRows,
  autresIsInfine,
  totalConst,
}: SmoothingDurationArgs): ScheduleRowInput[] {
  const { capital, r, rAss, N, assurMode } = basePret1;
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const assurFixe = assurMode === 'CI' ? capital * rAss : null;
  const EPS = 1e-8;

  const sumAutres = (m: number): number => autresPretsRows.reduce((sum, arr, i) => {
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

export function totalConstantForDuration({
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
