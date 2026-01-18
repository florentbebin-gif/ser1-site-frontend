/**
 * Capital Décès Calculator
 * 
 * Source de vérité unique pour le calcul des capitaux décès (assurance décès)
 * Utilisé par UI (Credit.jsx) et exports (Excel/PPTX) pour garantir la cohérence
 */

export interface LoanParams {
  capital: number;
  tauxAssur: number;  // taux annuel en % (ex: 0.30)
  assurMode: 'CI' | 'CRD';
}

export interface ScheduleRow {
  mois: number;
  interet: number;
  assurance: number;
  amort: number;
  mensu: number;
  mensuTotal: number;
  crd: number;  // CRD fin de période
  assuranceDeces: number;  // Capital décès calculé (toujours défini)
}

/**
 * Calcule le capital décès pour une période donnée selon la règle métier
 * 
 * @param params - Paramètres du prêt
 * @param crdDebut - CRD début de période (row.crd + row.amort)
 * @returns Capital décès pour la période
 */
export function computeCapitalDecesPeriod(
  params: LoanParams,
  crdDebut: number
): number {
  // Si taux d'assurance <= 0 → capital décès = 0
  if (params.tauxAssur <= 0) {
    return 0;
  }

  // Mode "Capital Initial" → constant = capital emprunté
  if (params.assurMode === 'CI') {
    return params.capital;
  }

  // Mode "CRD" → suit le CRD début de période
  return crdDebut;
}

/**
 * Calcule l'échéancier complet des capitaux décès pour un prêt
 * 
 * @param params - Paramètres du prêt
 * @param schedule - Échéancier du prêt (sans capitaux décès)
 * @returns Échéancier avec capitaux décès calculés
 */
export function computeCapitalDecesSchedule(
  params: LoanParams,
  schedule: ScheduleRow[]
): ScheduleRow[] {
  return schedule.map((row) => {
    // CRD début = CRD fin de la période + amortissement de la période
    // (la ligne courante contient le CRD fin et l'amortissement de la même période)
    const crdDebut = (row.crd || 0) + (row.amort || 0);

    const assuranceDeces = computeCapitalDecesPeriod(params, crdDebut);

    return {
      ...row,
      assuranceDeces
    };
  });
}

/**
 * Agrège les capitaux décès de plusieurs prêts pour l'échéancier global
 * 
 * @param loansSchedules - Échéanciers par prêt (avec capitaux décès déjà calculés)
 * @returns Échéancier global avec capitaux décès agrégés
 */
export function aggregateCapitalDecesGlobal(
  loansSchedules: ScheduleRow[][]
): number[] {
  const maxLength = Math.max(...loansSchedules.map(s => s.length));
  const globalCapitalDeces: number[] = [];

  for (let period = 0; period < maxLength; period++) {
    let sum = 0;
    
    // Somme des capitaux décès de tous les prêts pour cette période
    loansSchedules.forEach(schedule => {
      const row = schedule[period];
      if (row && row.assuranceDeces) {
        sum += row.assuranceDeces;
      }
    });

    globalCapitalDeces.push(sum);
  }

  return globalCapitalDeces;
}

/**
 * Calcule les capitaux décès pour l'échéancier global directement
 * (version optimisée qui évite de recalculer chaque prêt)
 * 
 * @param allLoansParams - Paramètres de tous les prêts
 * @param allSchedules - Échéanciers bruts de tous les prêts
 * @returns Échéancier global avec capitaux décès
 */
export function computeGlobalCapitalDecesSchedule(
  allLoansParams: LoanParams[],
  allSchedules: Array<Array<ScheduleRow | null>>
): ScheduleRow[] {
  const maxLength = Math.max(...allSchedules.map(s => s.length));
  const globalSchedule: ScheduleRow[] = [];

  // Ensuite, agréger par période
  for (let period = 0; period < maxLength; period++) {
    // Agréger toutes les autres colonnes
    const aggregated: ScheduleRow = {
      mois: period + 1,
      interet: 0,
      assurance: 0,
      amort: 0,
      mensu: 0,
      mensuTotal: 0,
      crd: 0,
      assuranceDeces: 0  // Initialisé à 0 pour éviter undefined
    };

    // Sommer les valeurs de tous les prêts pour cette période
    allSchedules.forEach((schedule, idx) => {
      const row = schedule[period];
      if (!row) {
        return;
      }

      const assuranceDeces = computeCapitalDecesPeriod(
        allLoansParams[idx],
        (row.crd || 0) + (row.amort || 0)
      );

      aggregated.interet += row.interet;
      aggregated.assurance += row.assurance;
      aggregated.amort += row.amort;
      aggregated.mensu += row.mensu;
      aggregated.mensuTotal += row.mensuTotal;
      aggregated.crd += row.crd;
      aggregated.assuranceDeces += assuranceDeces;
    });

    globalSchedule.push(aggregated);
  }

  return globalSchedule;
}
