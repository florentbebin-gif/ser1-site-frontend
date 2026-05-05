/**
 * loanSchedule.ts — Moteur pur de calcul d'échéancier de prêt
 *
 * Fonctions extraites de src/features/credit/hooks/creditSchedules.ts.
 * Zéro dépendance React, zéro import feature — consommable depuis n'importe quel moteur.
 *
 * Réexporté par creditSchedules.ts pour préserver la compatibilité ascendante.
 */

import type { ScheduleRowInput } from './capitalDeces';

/** Mode d'assiette assurance : CI = sur capital initial, CRD = sur capital restant dû */
export type LoanAssurMode = 'CI' | 'CRD';

export interface LoanScheduleArgs {
  capital: number;
  /** Taux mensuel (pas annuel) */
  r: number;
  /** Taux assurance mensuel */
  rAss: number;
  /** Durée en mois */
  N: number;
  assurMode: LoanAssurMode;
  mensuOverride?: number;
}

/**
 * Calcule la mensualité d'un prêt amortissable (sans assurance).
 * Formule : C × r / (1 − (1 + r)^−N)
 */
export function mensualiteAmortissable(C: number, r: number, N: number): number {
  if (N <= 0) return 0;
  if (r === 0) return C / N;
  return (C * r) / (1 - Math.pow(1 + r, -N));
}

/**
 * Génère l'échéancier mensuel d'un prêt amortissable.
 */
export function scheduleAmortissable({
  capital,
  r,
  rAss,
  N,
  assurMode,
  mensuOverride,
}: LoanScheduleArgs): ScheduleRowInput[] {
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const mensuFixe =
    typeof mensuOverride === 'number' && mensuOverride > 0
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

/**
 * Génère l'échéancier mensuel d'un prêt in fine.
 */
export function scheduleInFine({
  capital,
  r,
  rAss,
  N,
  assurMode,
  mensuOverride,
}: LoanScheduleArgs): ScheduleRowInput[] {
  const rows: ScheduleRowInput[] = [];
  let crd = Math.max(0, capital);
  const assurFixe = assurMode === 'CI' ? capital * rAss : null;
  const EPS = 1e-8;

  for (let m = 1; m <= N; m += 1) {
    if (crd <= EPS) break;

    const crdStart = crd;
    const interet = crdStart * r;
    let mensu =
      typeof mensuOverride === 'number' && mensuOverride > 0 ? mensuOverride : interet;

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
