/**
 * useCreditCalculations.js - Hook de calculs pour le simulateur de crédit
 * 
 * Extrait et centralisé depuis Credit.jsx legacy.
 * Toute la logique de calcul des échéanciers est ici.
 */

import { useMemo } from 'react';
import { monthsDiff, addMonths, labelMonthFR } from '../utils/creditFormatters.js';
import { computeCapitalDecesSchedule, computeGlobalCapitalDecesSchedule } from '../../../engine/credit/capitalDeces';

// ============================================================================
// FORMULES DE BASE
// ============================================================================

function mensualiteAmortissable(C, r, N) {
  if (N <= 0) return 0;
  if (r === 0) return C / N;
  return (C * r) / (1 - Math.pow(1 + r, -N));
}

function scheduleAmortissable({ capital, r, rAss, N, assurMode, mensuOverride }) {
  const rows = [];
  let crd = Math.max(0, capital);
  const mensuFixe = (typeof mensuOverride === 'number' && mensuOverride > 0)
    ? mensuOverride
    : mensualiteAmortissable(capital, r, N);

  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null;
  const EPS = 1e-8;

  for (let m = 1; m <= N; m++) {
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
    const assur = (assurMode === 'CI') ? assurFixe : (crdStart * rAss);

    const mensuTotal = mensu + (assur || 0);
    rows.push({ mois: m, interet, assurance: (assur || 0), amort, mensu, mensuTotal, crd: crdEnd });
    crd = crdEnd;
  }
  return rows;
}

function scheduleInFine({ capital, r, rAss, N, assurMode, mensuOverride }) {
  const rows = [];
  let crd = Math.max(0, capital);
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null;
  const EPS = 1e-8;

  for (let m = 1; m <= N; m++) {
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
    const assur = (assurMode === 'CI') ? assurFixe : (crdStart * rAss);

    const mensuTotal = mensu + (assur || 0);
    rows.push({ mois: m, interet, assurance: (assur || 0), amort, mensu, mensuTotal, crd: crdEnd });
    crd = crdEnd;
  }
  return rows;
}

// ============================================================================
// LISSAGE
// ============================================================================

function scheduleLisseePret1({ pret1, autresPretsRows, cibleMensuTotale }) {
  const { capital, r, rAss, N, assurMode, type } = pret1;
  const rows = [];
  let crd = Math.max(0, capital);
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null;
  const EPS = 1e-8;

  const mensuAutresAt = (m) =>
    autresPretsRows.reduce((s, arr) => s + ((arr[m - 1]?.mensuTotal) || 0), 0);

  for (let m = 1; m <= N; m++) {
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

    const assur = (assurMode === 'CI') ? assurFixe : (crdStart * rAss);
    const mensuTotal = mensu1 + (assur || 0);

    rows.push({ mois: m, interet, assurance: (assur || 0), amort, mensu: mensu1, mensuTotal, crd: crdEnd });
    crd = crdEnd;
  }
  return rows;
}

function scheduleLisseePret1Duration({ basePret1, autresPretsRows, totalConst }) {
  const { capital, r, rAss, N, assurMode } = basePret1;
  const rows = [];
  let crd = Math.max(0, capital);
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null;
  const EPS = 1e-8;

  const sumAutres = (m) => autresPretsRows.reduce((s, arr) => s + ((arr[m - 1]?.mensuTotal) || 0), 0);

  for (let m = 1; m <= N; m++) {
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

    const assur = (assurMode === 'CI') ? assurFixe : (crdStart * rAss);
    const mensuTotal = mensu1 + (assur || 0);

    rows.push({ mois: m, interet, assurance: (assur || 0), amort, mensu: mensu1, mensuTotal, crd: crdEnd });
    crd = crdEnd;
  }
  return rows;
}

function totalConstantForDuration({ basePret1, autresPretsRows }) {
  const { capital: B0, r, N } = basePret1;
  const pow = Math.pow(1 + r, N);

  let A = 0;
  let B = 0;

  for (let t = 1; t <= N; t++) {
    const a = Math.pow(1 + r, N - t);
    A += a;
    const autres = autresPretsRows.reduce((s, arr) => s + ((arr[t - 1]?.mensuTotal) || 0), 0);
    B += autres * a;
  }
  return (B0 * pow + B) / A;
}

// ============================================================================
// HELPERS
// ============================================================================

function shiftRows(rows, offset) {
  if (offset === 0) return rows.slice();
  if (offset > 0) return Array.from({ length: offset }, () => null).concat(rows);
  return rows.slice(-offset);
}

function toNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useCreditCalculations(state, globalStartYM) {
  const startYM = globalStartYM || state.startYM;

  // -------------------------------------------------------------------------
  // PARAMÈTRES PRÊT 1
  // -------------------------------------------------------------------------
  const pret1Params = useMemo(() => {
    const p = state.pret1 || {};
    const rAn = Math.max(0, Number(p.taux) || 0) / 100;
    const rAss = Math.max(0, Number(p.tauxAssur) || 0) / 100;
    return {
      capital: Math.max(0, toNum(p.capital)),
      duree: Math.max(1, Math.floor(toNum(p.duree) || 0)),
      rAn,
      rAss,
      r: rAn / 12,
      rA: rAss / 12,
      type: p.type || state.creditType || 'amortissable',
      assurMode: p.assurMode || state.assurMode || 'CRD',
      quotite: (p.quotite ?? 100) / 100,
      startYM: p.startYM || startYM,
    };
  }, [state.pret1, state.creditType, state.assurMode, startYM]);

  // -------------------------------------------------------------------------
  // MENSUALITÉ DE BASE PRÊT 1
  // -------------------------------------------------------------------------
  const mensuBasePret1 = useMemo(() => {
    const { type, capital, r, duree: N } = pret1Params;
    if (type === 'infine') return r === 0 ? 0 : capital * r;
    return mensualiteAmortissable(capital, r, N);
  }, [pret1Params]);

  // -------------------------------------------------------------------------
  // PRÊTS ADDITIONNELS (2 et 3)
  // -------------------------------------------------------------------------
  const autresParams = useMemo(() => {
    const params = [];
    
    if (state.pret2) {
      const p = state.pret2;
      const rAn = Math.max(0, Number(p.taux) || 0) / 100;
      const rAss = Math.max(0, Number(p.tauxAssur) || 0) / 100;
      params.push({
        ...p,
        capital: Math.max(0, toNum(p.capital)),
        duree: Math.max(1, Math.floor(toNum(p.duree) || 0)),
        rAn,
        rAss,
        r: rAn / 12,
        rA: rAss / 12,
        type: p.type || state.creditType || 'amortissable',
        assurMode: p.assurMode || state.assurMode || 'CRD',
        quotite: (p.quotite ?? 100) / 100,
        startYM: p.startYM || startYM,
      });
    }
    
    if (state.pret3) {
      const p = state.pret3;
      const rAn = Math.max(0, Number(p.taux) || 0) / 100;
      const rAss = Math.max(0, Number(p.tauxAssur) || 0) / 100;
      params.push({
        ...p,
        capital: Math.max(0, toNum(p.capital)),
        duree: Math.max(1, Math.floor(toNum(p.duree) || 0)),
        rAn,
        rAss,
        r: rAn / 12,
        rA: rAss / 12,
        type: p.type || state.creditType || 'amortissable',
        assurMode: p.assurMode || state.assurMode || 'CRD',
        quotite: (p.quotite ?? 100) / 100,
        startYM: p.startYM || startYM,
      });
    }
    
    return params;
  }, [state.pret2, state.pret3, state.creditType, state.assurMode, startYM]);

  // -------------------------------------------------------------------------
  // ÉCHÉANCIERS PRÊTS ADDITIONNELS
  // -------------------------------------------------------------------------
  const autresRows = useMemo(() => {
    return autresParams.map((p) => {
      const baseRows = (p.type === 'infine')
        ? scheduleInFine({ capital: p.capital, r: p.r, rAss: p.rA, N: p.duree, assurMode: p.assurMode })
        : scheduleAmortissable({ capital: p.capital, r: p.r, rAss: p.rA, N: p.duree, assurMode: p.assurMode });

      const loanParams = {
        capital: p.capital,
        tauxAssur: p.rAss * 100 * 12,
        assurMode: p.assurMode,
        quotite: p.quotite,
      };
      const rowsWithDeces = computeCapitalDecesSchedule(loanParams, baseRows);

      const off = monthsDiff(startYM, p.startYM || startYM);
      return shiftRows(rowsWithDeces, off);
    });
  }, [autresParams, startYM]);

  // -------------------------------------------------------------------------
  // ÉCHÉANCIER PRÊT 1 (BASE)
  // -------------------------------------------------------------------------
  const basePret1Rows = useMemo(() => {
    const { capital, r, rA: rAss, duree: N, assurMode, type } = pret1Params;
    const base = { capital, r, rAss, N, assurMode, type };
    return (type === 'infine')
      ? scheduleInFine({ ...base, mensuOverride: mensuBasePret1 })
      : scheduleAmortissable({ ...base, mensuOverride: mensuBasePret1 });
  }, [pret1Params, mensuBasePret1]);

  // -------------------------------------------------------------------------
  // DÉTECTION IN FINE
  // -------------------------------------------------------------------------
  const anyInfine = useMemo(() => {
    const pret1IsInfine = pret1Params.type === 'infine';
    const pret2IsInfine = state.pret2?.type === 'infine';
    const pret3IsInfine = state.pret3?.type === 'infine';
    return pret1IsInfine || pret2IsInfine || pret3IsInfine;
  }, [pret1Params.type, state.pret2?.type, state.pret3?.type]);

  // -------------------------------------------------------------------------
  // ÉCHÉANCIER PRÊT 1 (AVEC LISSAGE)
  // -------------------------------------------------------------------------
  const pret1Rows = useMemo(() => {
    const { capital, r, rA: rAss, duree: N, assurMode, type } = pret1Params;
    const basePret1 = { capital, r, rAss, N, assurMode, type };

    let rows;
    if (!state.lisserPret1 || anyInfine || autresRows.length === 0) {
      rows = (type === 'infine')
        ? scheduleInFine({ ...basePret1, mensuOverride: mensuBasePret1 })
        : scheduleAmortissable({ ...basePret1, mensuOverride: mensuBasePret1 });
    } else if (state.lissageMode === 'mensu') {
      const mensuAutresM1 = autresRows.reduce((s, arr) => s + ((arr[0]?.mensuTotal) || 0), 0);
      const cible = mensuBasePret1 + mensuAutresM1;
      rows = scheduleLisseePret1({ pret1: basePret1, autresPretsRows: autresRows, cibleMensuTotale: cible });
    } else {
      const T = totalConstantForDuration({ basePret1, autresPretsRows: autresRows });
      rows = scheduleLisseePret1Duration({ basePret1, autresPretsRows: autresRows, totalConst: T });
    }

    const loanParams = {
      capital: pret1Params.capital,
      tauxAssur: pret1Params.rAss * 100 * 12,
      assurMode: pret1Params.assurMode,
      quotite: pret1Params.quotite,
    };
    return computeCapitalDecesSchedule(loanParams, rows);
  }, [pret1Params, mensuBasePret1, state.lisserPret1, state.lissageMode, anyInfine, autresRows]);

  // -------------------------------------------------------------------------
  // DURÉES
  // -------------------------------------------------------------------------
  const dureeBaseMois = basePret1Rows.length;
  const dureeLisseMois = pret1Rows.length;
  const diffDureesMois = dureeLisseMois - dureeBaseMois;

  // -------------------------------------------------------------------------
  // AGRÉGATION GLOBALE
  // -------------------------------------------------------------------------
  const agrRows = useMemo(() => {
    const allLoansParams = [
      {
        capital: pret1Params.capital,
        tauxAssur: pret1Params.rAss * 100 * 12,
        assurMode: pret1Params.assurMode,
        quotite: pret1Params.quotite,
      },
      ...autresParams.map(p => ({
        capital: p.capital,
        tauxAssur: p.rAss * 100 * 12,
        assurMode: p.assurMode,
        quotite: p.quotite,
      })),
    ];

    const allSchedules = [pret1Rows, ...autresRows];
    return computeGlobalCapitalDecesSchedule(allLoansParams, allSchedules);
  }, [pret1Params, autresParams, pret1Rows, autresRows]);

  // -------------------------------------------------------------------------
  // SYNTHÈSE FINANCIÈRE
  // -------------------------------------------------------------------------
  const synthese = useMemo(() => {
    const pret1Interets = pret1Rows.reduce((s, l) => s + (l.interet || 0), 0);
    const pret1Assurance = pret1Rows.reduce((s, l) => s + (l.assurance || 0), 0);

    const autresInterets = autresRows.reduce((total, arr) =>
      total + arr.reduce((s, row) => s + ((row?.interet) || 0), 0), 0);
    const autresAssurance = autresRows.reduce((total, arr) =>
      total + arr.reduce((s, row) => s + ((row?.assurance) || 0), 0), 0);

    const totalInterets = pret1Interets + autresInterets;
    const totalAssurance = pret1Assurance + autresAssurance;
    const coutTotalCredit = totalInterets + totalAssurance;

    const mensualiteTotaleM1 = (pret1Rows[0]?.mensu || 0) + autresRows.reduce((s, arr) => s + ((arr[0]?.mensu) || 0), 0);
    const primeAssMensuellePret1 = (pret1Rows[0]?.assurance || 0);
    const primeAssMensuelleAutres = autresRows.reduce((s, arr) => s + ((arr[0]?.assurance) || 0), 0);
    const primeAssMensuelle = primeAssMensuellePret1 + primeAssMensuelleAutres;

    const capitalEmprunte =
      pret1Rows.reduce((s, l) => s + (l.amort || 0), 0) +
      autresRows.reduce((total, arr) => total + arr.reduce((s, row) => s + ((row?.amort) || 0), 0), 0);

    return {
      totalInterets,
      totalAssurance,
      coutTotalCredit,
      mensualiteTotaleM1,
      primeAssMensuelle,
      capitalEmprunte,
      diffDureesMois,
    };
  }, [pret1Rows, autresRows, diffDureesMois]);

  // -------------------------------------------------------------------------
  // SYNTHÈSE PÉRIODES (si prêts multiples)
  // -------------------------------------------------------------------------
  const synthesePeriodes = useMemo(() => {
    if (autresParams.length === 0) return [];

    const changeSet = new Set([0]);

    autresParams.forEach((p) => {
      const offRaw = monthsDiff(startYM, p.startYM || startYM);
      const Np = Math.max(1, Math.floor(toNum(p.duree) || 0));
      const startIdx = Math.max(0, offRaw);
      const endIdx = Math.max(0, offRaw + Np);
      changeSet.add(startIdx);
      changeSet.add(endIdx);
    });

    const maxLen = Math.max(pret1Rows.length, ...autresRows.map(a => a.length), pret1Params.duree);
    const points = Array.from(changeSet)
      .sort((a, b) => a - b)
      .filter(x => x < maxLen);

    const rows = points.map(t => {
      const ym = addMonths(startYM, t);
      const p1 = pret1Rows[t]?.mensu || 0;
      const p2 = autresRows[0]?.[t]?.mensu || 0;
      const p3 = autresRows[1]?.[t]?.mensu || 0;
      return { from: `À partir de ${labelMonthFR(ym)}`, p1, p2, p3 };
    });

    // Déduplication
    const dedup = [];
    for (const r of rows) {
      const last = dedup[dedup.length - 1];
      if (last && last.p1 === r.p1 && last.p2 === r.p2 && last.p3 === r.p3) continue;
      dedup.push(r);
    }
    return dedup;
  }, [autresParams, startYM, pret1Rows, autresRows, pret1Params.duree]);

  return {
    // Échéanciers
    pret1Rows,
    pret2Rows: autresRows[0] || [],
    pret3Rows: autresRows[1] || [],
    agrRows,
    
    // Paramètres
    pret1Params,
    autresParams,
    
    // Flags
    anyInfine,
    hasPretsAdditionnels: autresParams.length > 0,
    
    // Synthèses
    synthese,
    synthesePeriodes,
    
    // Métriques
    dureeBaseMois,
    dureeLisseMois,
    diffDureesMois,
    mensuBasePret1,
  };
}
