import React, { useEffect, useMemo, useState } from "react"
import { onResetEvent, storageKeyFor } from '../utils/reset.js'
import { toNumber } from '../utils/number.js'
import { useTheme } from '../settings/ThemeProvider'
import { supabase } from '../supabaseClient'
import { ExportMenu } from '../components/ExportMenu'

// V4: PPTX/Excel imports moved to dynamic import() in export functions
import { computeCapitalDecesSchedule, computeGlobalCapitalDecesSchedule } from '../engine/credit/capitalDeces';
import './Credit.css'

/* ---------- Helpers format ---------- */
const fmt0  = (n)=> (Math.round(Number(n)||0)).toLocaleString('fr-FR')
const euro0 = (n)=> fmt0(n) + ' €'
const toNum = (v)=> toNumber(v, 0)
const rid = () => Math.random().toString(36).slice(2,9)

/* Date utils (YYYY-MM) */
function nowYearMonth(){
  const d = new Date()
  const m = String(d.getMonth()+1).padStart(2,'0')
  return `${d.getFullYear()}-${m}`
}
function addMonths(ym, k){
  const [y,m] = ym.split('-').map(Number)
  const d = new Date(y, m-1 + k, 1)
  const mm = String(d.getMonth()+1).padStart(2,'0')
  return `${d.getFullYear()}-${mm}`
}
function labelMonthFR(ym){
  const [y,m] = ym.split('-').map(Number)
  return `${String(m).padStart(2,'0')}/${y}`
}
function labelYear(ym){ return ym.split('-')[0] }
function monthsDiff(a, b){
  const [ya,ma] = a.split('-').map(Number)
  const [yb,mb] = b.split('-').map(Number)
  return (yb-ya)*12 + (mb-ma)
}

/* ===============================
   Formules & échéanciers
================================ */
function mensualiteAmortissable(C, r, N) {
  if (N <= 0) return 0
  if (r === 0) return C / N
  return (C * r) / (1 - Math.pow(1 + r, -N))
}

function scheduleAmortissable({ capital, r, rAss, N, assurMode, mensuOverride }) {
  const rows = []
  let crd = Math.max(0, capital)
  const mensuFixe = (typeof mensuOverride === 'number' && mensuOverride > 0)
    ? mensuOverride
    : mensualiteAmortissable(capital, r, N)

  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null
  const EPS = 1e-8

  for (let m = 1; m <= N; m++) {
    if (crd <= EPS) break

    const crdStart = crd
    const interet  = crdStart * r
    let mensu      = mensuFixe

    // borne dernière échéance
    const maxMensu = interet + crdStart
    if (mensu > maxMensu) mensu = maxMensu
    if (mensu < interet && r > 0) mensu = interet

    let amort = Math.max(0, mensu - interet)
    if (amort > crdStart) amort = crdStart

    const crdEnd = Math.max(0, crdStart - amort)
    const assur  = (assurMode === 'CI') ? assurFixe : (crdStart * rAss) // assurance CRD début

    const mensuTotal = mensu + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu, mensuTotal, crd: crdEnd })
    crd = crdEnd
  }
  return rows
}

function scheduleInFine({ capital, r, rAss, N, assurMode, mensuOverride }) {
  const rows = []
  let crd = Math.max(0, capital)
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null
  const EPS = 1e-8

  for (let m = 1; m <= N; m++) {
    if (crd <= EPS) break

    const crdStart = crd
    const interet  = crdStart * r
    let mensu = (typeof mensuOverride === 'number' && mensuOverride > 0) ? mensuOverride : interet

    const maxMensu = interet + (m === N ? crdStart : 0) // borne si dernière
    if (mensu > maxMensu) mensu = maxMensu
    if (mensu < interet && r > 0) mensu = interet

    let amort = 0
    if (m === N) {
      amort = crdStart
      mensu = interet + amort
    } else if (mensu > interet) {
      amort = Math.min(crdStart, mensu - interet)
    }

    const crdEnd = Math.max(0, crdStart - amort)
    const assur  = (assurMode === 'CI') ? assurFixe : (crdStart * rAss) // assurance CRD début

    const mensuTotal = mensu + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu, mensuTotal, crd: crdEnd })
    crd = crdEnd
  }
  return rows
}

// === LISSAGE : MENSUALITÉ TOTALE CONSTANTE (avec assurance tous prêts) ===
function scheduleLisseePret1({ pret1, autresPretsRows, cibleMensuTotale }) {
  const { capital, r, rAss, N, assurMode, type } = pret1
  const rows = []

  let crd = Math.max(0, capital)
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null
  const EPS = 1e-8

  // Utilise mensuTotal (avec assurance) pour le lissage global
  const mensuAutresAt = (m) =>
    autresPretsRows.reduce((s, arr) => s + ((arr[m-1]?.mensuTotal) || 0), 0)

  for (let m = 1; m <= N; m++) {
    if (crd <= EPS) break

    const crdStart = crd
    const interet  = crdStart * r
    const autres   = mensuAutresAt(m)

    // part prêt 1 = cible - autres (hors assurance)
    let mensu1 = Math.max(0, cibleMensuTotale - autres)

    // bornes « sûreté »
    const capMensu = interet + crdStart
    if (mensu1 > capMensu) mensu1 = capMensu
    if (type !== 'infine' && m < N && mensu1 < interet) mensu1 = interet
    if (type === 'infine' && mensu1 < interet) mensu1 = interet
    if (m === N) mensu1 = Math.min(mensu1, capMensu)

    const amort  = Math.max(0, mensu1 - interet)
    const crdEnd = Math.max(0, crdStart - amort)

    // assurance sur le prêt 1 uniquement
    const assur = (assurMode === 'CI') ? assurFixe : (crdStart * rAss)
    const mensuTotal = mensu1 + (assur || 0)

    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu:mensu1, mensuTotal, crd:crdEnd })
    crd = crdEnd
  }
  return rows
}

// ---- Échéancier lissé avec "T" constant (durée conservée, avec assurance tous prêts) ----
function scheduleLisseePret1Duration({ basePret1, autresPretsRows, totalConst }) {
  const { capital, r, rAss, N, assurMode } = basePret1
  const rows = []

  let crd = Math.max(0, capital)
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null

  const EPS = 1e-8
  // Utilise mensuTotal (avec assurance) pour le lissage global
  const sumAutres = (m) => autresPretsRows.reduce((s, arr) => s + ((arr[m - 1]?.mensuTotal) || 0), 0)

  for (let m = 1; m <= N; m++) {
    if (crd <= EPS) break

    const crdStart = crd
    const interet  = crdStart * r
    const autres   = sumAutres(m)

    let mensu1 = totalConst - autres

    if (m < N && mensu1 < interet) mensu1 = interet
    const capMensu = interet + crdStart
    if (mensu1 > capMensu) mensu1 = capMensu
    if (m === N) mensu1 = Math.min(mensu1, interet + crdStart)

    const amort = Math.max(0, mensu1 - interet)
    const crdEnd = Math.max(0, crdStart - amort)

    const assur = (assurMode === 'CI') ? assurFixe : (crdStart * rAss)
    const mensuTotal = mensu1 + (assur || 0)

    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu:mensu1, mensuTotal, crd:crdEnd })
    crd = crdEnd
  }
  return rows
}

// ---- Annuité totale "T" (fermeture analytique) qui garantit CRD_N = 0 (avec assurance tous prêts) ----
function totalConstantForDuration({ basePret1, autresPretsRows }) {
  const { capital: B0, r, N } = basePret1
  const pow = Math.pow(1 + r, N)

  let A = 0 // somme des poids a_t = (1+r)^(N-t)
  let B = 0 // somme des o_t * a_t

  for (let t = 1; t <= N; t++) {
    const a = Math.pow(1 + r, N - t)
    A += a
    // Utilise mensuTotal (avec assurance) pour le lissage global
    const autres = autresPretsRows.reduce((s, arr) => s + ((arr[t - 1]?.mensuTotal) || 0), 0)
    B += autres * a
  }
  return (B0 * pow + B) / A
}

/* ===============================
   Page Crédit
================================ */
export default function Credit(){

/* ---- THEME ---- */
const { colors: themeColors, logo, setLogo, cabinetLogo, themeSource, pptxColors } = useTheme()

/* ---- ÉTATS ---- */
const [startYM, setStartYM]         = useState(nowYearMonth()) // Date souscription prêt 1
const [assurMode, setAssurMode]     = useState('CRD')          // 'CI' | 'CRD'
const [creditType, setCreditType]   = useState('amortissable') // type prêt 1

const [capital, setCapital]         = useState(300000)
const [duree, setDuree]             = useState(240)
const [taux, setTaux]               = useState(3.50)
const [tauxAssur, setTauxAssur]     = useState(0.30)
const [mensuBase, setMensuBase]     = useState('')             // saisie mensu prêt 1

// État "touched" pour tracker si l'utilisateur a interagi avec les champs
const [touched, setTouched]         = useState({ capital: false, duree: false })

const [rawTauxPlus, setRawTauxPlus] = useState({}); // par prêt id -> string
const [rawTauxAssurPlus, setRawTauxAssurPlus] = useState({}); // par prêt id -> string pour taux assurance

//  version normalisée dès l’affichage
const [rawTaux, setRawTaux] = useState(Number(taux).toFixed(2).replace('.', ','));
const [rawTauxAssur, setRawTauxAssur] = useState(Number(tauxAssur).toFixed(2).replace('.', ','));

// Sync initial / reset
useEffect(() => {
  setRawTaux((Number(taux).toFixed(2)).toString());
}, [taux, tauxAssur]);
 
  // prêts additionnels : + type & startYM
  const [pretsPlus, setPretsPlus]     = useState([])             // [{id,capital,duree,taux,startYM,type}]
  const [lisserPret1, setLisserPret1] = useState(false)
  const [viewMode, setViewMode]       = useState('mensuel')      // 'mensuel' | 'annuel'
  const [lissageMode, setLissageMode] = useState('mensu')        // 'mensu' | 'duree'

  // --- Export Loading state
  const [exportLoading, setExportLoading] = useState(false)

  // --- Si plus de prêt 2/3, éteindre le lissage s'il était ON
  useEffect(() => {
    if (pretsPlus.length === 0 && lisserPret1) setLisserPret1(false)
  }, [pretsPlus.length, lisserPret1])

  // PERSISTENCE
  const STORE_KEY = storageKeyFor('credit')
  const [hydrated, setHydrated] = useState(false)
  useEffect(()=>{
    try{
      const raw = sessionStorage.getItem(STORE_KEY)
      if(raw){
        const s = JSON.parse(raw)
        if (s && typeof s === 'object'){
          setStartYM(s.startYM ?? nowYearMonth())
          setAssurMode(s.assurMode ?? 'CRD')
          setCreditType(s.creditType ?? 'amortissable')
          setCapital(s.capital ?? 300000)
          setDuree(s.duree ?? 240)
          setTaux(s.taux ?? 3.5)
          setTauxAssur(s.tauxAssur ?? 0.3)
          setMensuBase(s.mensuBase ?? '')
          setPretsPlus(Array.isArray(s.pretsPlus) ? s.pretsPlus : [])
          setLisserPret1(!!s.lisserPret1)
          setViewMode(s.viewMode ?? 'mensuel')
          setLissageMode(s.lissageMode ?? 'mensu')
        }
      }
    }catch{}
    setHydrated(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(()=>{
    if(!hydrated) return
    try{
      sessionStorage.setItem(STORE_KEY, JSON.stringify({
        startYM, assurMode, creditType, capital, duree, taux, tauxAssur, mensuBase, pretsPlus, lisserPret1, viewMode, lissageMode
      }))
    }catch{}
  }, [hydrated, startYM, assurMode, creditType, capital, duree, taux, tauxAssur, mensuBase, pretsPlus, lisserPret1, viewMode, lissageMode])

// Reset global (ne réinitialise que les champs saisissables du simulateur CRÉDIT)
useEffect(() => {
  const off = onResetEvent?.(({ simId }) => {
    // Ne réagit qu'au reset du simulateur "credit"
    if (simId && simId !== 'credit') return;

    const ym = nowYearMonth();

    // champs "saisissables" du prêt 1
    setStartYM(ym);
    setCapital(0);
    setDuree(0);
    setTaux(0);
    setTauxAssur(0);
    setMensuBase('');

    // prêts additionnels : on efface tout
    setPretsPlus([]);

    // champs "bruts" utilisés pour la saisie des taux
    setRawTauxPlus({});
    setRawTauxAssurPlus({});

    // Réinitialiser l'état touched
    setTouched({ capital: false, duree: false });

    // on nettoie aussi le sessionStorage pour repartir d'une feuille blanche
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {}

    // On ne touche PAS à :
    // - assurMode
    // - creditType
    // - lisserPret1 (sera remis à false automatiquement si plus de prêts)
    // - viewMode
    // - lissageMode
  });

  return off || (() => {});
}, [STORE_KEY]);


  /* ---- Handlers bornés ---- */
  const onChangeCapital = (val) => setCapital(toNum(String(val).replace(/\D/g,'').slice(0,8)))
  const onChangeDuree   = (val) => setDuree(Math.max(1, toNum(String(val).replace(/\D/g,'').slice(0,3))))
  /* ---- Taux mensuels & paramètres ---- */
  const rAn  = Math.max(0, Number(taux) || 0)/100
  const rAss = Math.max(0, Number(tauxAssur) || 0)/100
  const r    = rAn / 12
  const rA   = rAss / 12
  const N    = Math.max(1, Math.floor(duree || 0))

  /* ---- Mensualité base prêt 1 + capital recalculé si mensu saisie ---- */
  const mensuHorsAssurance_base = useMemo(()=>{
    if (creditType === 'infine') return r === 0 ? 0 : capital * r
    return mensualiteAmortissable(capital, r, N)
  }, [creditType, capital, r, N])

  const effectiveCapitalPret1 = useMemo(()=>{
    const hasOthers = pretsPlus.length > 0
    const mensuUser = toNum(mensuBase)
    if (!mensuUser || hasOthers) return capital
    if (creditType === 'infine') return (r === 0) ? capital : Math.floor(mensuUser / r)
    if (r === 0) return Math.floor(mensuUser * N)
    return Math.floor(mensuUser * (1 - Math.pow(1+r, -N)) / r)
  }, [capital, pretsPlus.length, mensuBase, creditType, r, N])

  const mensuBaseEffectivePret1 = useMemo(()=>{
    const hasOthers = pretsPlus.length > 0
    const mensuUser = toNum(mensuBase)
    return hasOthers ? mensuHorsAssurance_base : (mensuUser || mensuHorsAssurance_base)
  }, [pretsPlus.length, mensuBase, mensuHorsAssurance_base])

  function shiftRows(rows, offset){
    if (offset === 0) return rows.slice()
    if (offset > 0) return Array.from({length:offset}, () => null).concat(rows)
    return rows.slice(-offset)
  }
  const autresRows = useMemo(()=>{
    return pretsPlus.map(p=>{
      const rM = (Math.max(0, Number(p.taux)||0)/100)/12
      const Np = Math.max(1, Math.floor(toNum(p.duree)||0))
      const C  = Math.max(0, toNum(p.capital))
      const type = p.type || creditType
      
      // Assurance prêt additionnel : utilise tauxAssur et assurMode du prêt (défaut: 0, CRD)
      const pTauxAssur = Math.max(0, Number(p.tauxAssur) || 0)
      const pAssurMode = p.assurMode || 'CRD'
      const rAssP = pTauxAssur / 100 / 12

      const baseRows = (type === 'infine')
        ? scheduleInFine({ capital:C, r:rM, rAss:rAssP, N:Np, assurMode: pAssurMode })
        : scheduleAmortissable({ capital:C, r:rM, rAss:rAssP, N:Np, assurMode: pAssurMode })

      // Calcule les capitaux décès avec la source de vérité unique
      const loanParams = {
        capital: C,
        tauxAssur: pTauxAssur,
        assurMode: pAssurMode
      };
      const rowsWithDeces = computeCapitalDecesSchedule(loanParams, baseRows);
      
      const rows = rowsWithDeces.map(row => ({
        ...row,
        // assuranceDeces est déjà calculé par computeCapitalDecesSchedule
      }))

      const off = monthsDiff(startYM, p.startYM || startYM)
      return shiftRows(rows, off)
    })
  }, [pretsPlus, creditType, startYM])

  /* ---- Prêt 1 : base (sans lissage) ---- */
  const basePret1Rows = useMemo(() => {
    const base = { capital: effectiveCapitalPret1, r, rAss: rA, N, assurMode, type: creditType }
    return (creditType === 'infine')
      ? scheduleInFine({ ...base, mensuOverride: mensuHorsAssurance_base })
      : scheduleAmortissable({ ...base, mensuOverride: mensuHorsAssurance_base })
  }, [effectiveCapitalPret1, r, rA, N, assurMode, creditType, mensuHorsAssurance_base])

  // === Statut In fine global (désactive le lissage partout)
  const pret1IsInfine = (creditType === 'infine')
  const anyInfine = pret1IsInfine || pretsPlus.some(p => (p?.type || '') === 'infine')

  // Si un prêt est In fine → on coupe le lissage si ON
  useEffect(()=>{
    if (anyInfine && lisserPret1) setLisserPret1(false)
  }, [anyInfine, lisserPret1])

  /* ---- Prêt 1 (standard ou lissé) ---- */
  const pret1Rows = useMemo(() => {
    const basePret1 = { capital: effectiveCapitalPret1, r, rAss:rA, N, assurMode, type: creditType }

    // Pas de lissage (ou impossible) ou pas d'autres prêts => échéancier standard
    let rows
    if (!lisserPret1 || anyInfine || autresRows.length === 0) {
      rows = (creditType === 'infine')
        ? scheduleInFine({ ...basePret1, mensuOverride: mensuBaseEffectivePret1 })
        : scheduleAmortissable({ ...basePret1, mensuOverride: mensuBaseEffectivePret1 })
    } else if (lissageMode === 'mensu') {
      // Utilise mensuTotal (avec assurance) pour la cible de lissage
      const mensuAutresM1 = autresRows.reduce((s, arr) => s + ((arr[0]?.mensuTotal) || 0), 0)
      const cible = mensuBaseEffectivePret1 + mensuAutresM1
      rows = scheduleLisseePret1({ pret1: basePret1, autresPretsRows: autresRows, cibleMensuTotale: cible })
    } else {
      const T = totalConstantForDuration({ basePret1, autresPretsRows: autresRows })
      rows = scheduleLisseePret1Duration({ basePret1, autresPretsRows: autresRows, totalConst: T })
    }

    // Calcule les capitaux décès avec la source de vérité unique
      const loanParams = {
        capital: effectiveCapitalPret1,
        tauxAssur: tauxAssur, // Déjà en % annuel
        assurMode: assurMode
      };
      const rowsWithDeces = computeCapitalDecesSchedule(loanParams, rows);
      
      return rowsWithDeces

  }, [
    effectiveCapitalPret1, r, rA, N, assurMode, creditType,
    mensuBaseEffectivePret1, lisserPret1, autresRows, lissageMode, anyInfine
  ])

  // Durées & différence
  const dureeBaseMois  = basePret1Rows.length
  const dureeLisseMois = pret1Rows.length
  const diffDureesMois = dureeLisseMois - dureeBaseMois

  /* ---- Table mensuelle agrégée ---- */
  const agrRows = useMemo(()=>{
    // Prépare les paramètres pour tous les prêts
    const allLoansParams = [
      {
        capital: effectiveCapitalPret1,
        tauxAssur: tauxAssur,
        assurMode: assurMode
      },
      ...pretsPlus.map(p => ({
        capital: Math.max(0, toNum(p.capital)),
        tauxAssur: Math.max(0, Number(p.tauxAssur) || 0),
        assurMode: p.assurMode || 'CRD'
      }))
    ];
    
    // Prépare les échéanciers bruts pour tous les prêts
    const allSchedules = [pret1Rows, ...autresRows];
    
    // Calcule l'échéancier global avec capitaux décès unifiés
    return computeGlobalCapitalDecesSchedule(allLoansParams, allSchedules);
  }, [pret1Rows, autresRows, pretsPlus, N, assurMode, effectiveCapitalPret1, tauxAssur])

  /* ---- Agrégation annuelle (si besoin) ---- */
  function aggregateToYears(rows) {
    const map = new Map()
    rows.forEach((r, idx) => {
      const ym = addMonths(startYM, idx)
      const year = labelYear(ym)
      const cur = map.get(year) || { interet:0, assurance:0, amort:0, mensu:0, mensuTotal:0, crd:0, assuranceDeces:null }
      cur.interet    += r.interet
      cur.assurance  += r.assurance
      cur.amort      += r.amort
      cur.assuranceDeces = r.assuranceDeces ?? cur.assuranceDeces ?? null
      cur.mensu      += r.mensu
      cur.mensuTotal += r.mensuTotal
      cur.crd         = r.crd
      map.set(year, cur)
    })
    return Array.from(map.entries()).map(([year, v])=> ({ periode: year, ...v }))
  }
  function attachMonthLabels(rows){
    return rows.map((r, idx)=> ({ periode: labelMonthFR(addMonths(startYM, idx)), ...r }))
}

 // Agrège des rows (format {interet, assurance, amort, mensu, mensuTotal, crd}) par année
function aggregateToYearsFromRows(rows, startYMBase) {
  const map = new Map();
  rows.forEach((r, idx) => {
    if (!r) return;
    const ym = addMonths(startYMBase, idx);
    const year = labelYear(ym);
    const acc = map.get(year) || { interet:0, assurance:0, amort:0, mensu:0, mensuTotal:0, crd:0, assuranceDeces:null };
    acc.interet    += r.interet || 0;
    acc.assurance  += r.assurance || 0;
    acc.amort      += r.amort || 0;
    acc.mensu      += r.mensu || 0;
    acc.mensuTotal += r.mensuTotal || 0;
    // on prend le dernier CRD / capital décès de l'année
    acc.crd         = r.crd || acc.crd || 0;
    acc.assuranceDeces = r.assuranceDeces ?? acc.assuranceDeces ?? null;
    map.set(year, acc);
  });
  return Array.from(map.entries()).map(([periode, v]) => ({ periode, ...v }));
}
 
  const isAnnual = viewMode === 'annuel'
  const aggregatedYears = useMemo(() => aggregateToYears(agrRows), [agrRows, startYM])
  const tableDisplay = useMemo(()=>{
    if (isAnnual) return aggregatedYears
    return attachMonthLabels(agrRows)
  }, [aggregatedYears, agrRows, isAnnual, startYM])

  /* ---- Synthèse ---- */
  const mensualiteTotaleM1 = (pret1Rows[0]?.mensu || 0) + autresRows.reduce((s,arr)=> s + ((arr[0]?.mensu) || 0), 0)
  const firstYearAggregate = isAnnual ? aggregatedYears[0] : null
  // Valeurs d'affichage selon mode (mensuel/annuel)
  const montantPrincipalAff = isAnnual ? (firstYearAggregate?.mensu || 0) : mensualiteTotaleM1;
  
  // Assurance mensuelle M1 tous prêts
  const primeAssMensuellePret1 = (pret1Rows[0]?.assurance || 0)
  const primeAssMensuelleAutres = autresRows.reduce((s,arr)=> s + ((arr[0]?.assurance) || 0), 0)
  const primeAssMensuelle = primeAssMensuellePret1 + primeAssMensuelleAutres
  const primeAssAff = isAnnual ? (firstYearAggregate?.assurance || 0) : primeAssMensuelle;
  
  const pret1Interets      = pret1Rows.reduce((s,l)=> s + (l.interet   || 0), 0)
  const pret1Assurance     = pret1Rows.reduce((s,l)=> s + (l.assurance || 0), 0)
  
  // Totaux assurance et intérêts tous prêts (pour synthèse globale)
  const autresInterets = autresRows.reduce((total, arr) => 
    total + arr.reduce((s, row) => s + ((row?.interet) || 0), 0), 0)
  const autresAssurance = autresRows.reduce((total, arr) => 
    total + arr.reduce((s, row) => s + ((row?.assurance) || 0), 0), 0)
  const totalInterets = pret1Interets + autresInterets
  const totalAssurance = pret1Assurance + autresAssurance
  const coutTotalCredit = totalInterets + totalAssurance

  // Annuité max (hors assurance) pour la vue annuelle
  // === Tableau des périodes (affiché s’il y a ≥1 prêt additionnel)
const synthesePeriodes = useMemo(() => {
  if (pretsPlus.length === 0) return []

  // 1) Points de rupture : 0 + début/fin effectifs (relatifs à startYM) de chaque prêt 2/3
  const changeSet = new Set([0])

  pretsPlus.forEach(p => {
    const offRaw = monthsDiff(startYM, p.startYM || startYM) // peut être négatif si le prêt a déjà commencé
    const Np     = Math.max(1, Math.floor(toNum(p.duree) || 0))

    // Début “vu depuis startYM” (si prêt déjà en cours, c’est 0)
    const startIdx = Math.max(0, offRaw)

    // Fin “vu depuis startYM”
    // - si offRaw < 0  => endIdx = Np + offRaw (mois restants)
    // - si offRaw >= 0 => endIdx = offRaw + Np
    const endIdx = Math.max(0, offRaw + Np)

    changeSet.add(startIdx)
    changeSet.add(endIdx)
  })

  // 2) On garde seulement les points dans l’horizon simulé
  const maxLen = Math.max(pret1Rows.length, ...autresRows.map(a => a.length), N)
  const points = Array.from(changeSet)
    .sort((a, b) => a - b)
    .filter(x => x < maxLen)

  // 3) Matérialise les lignes avec leurs mensualités à ces points
  const rows = points.map(t => {
    const ym = addMonths(startYM, t)
    const p1 = pret1Rows[t]?.mensu || 0
    const p2 = autresRows[0]?.[t]?.mensu || 0
    const p3 = autresRows[1]?.[t]?.mensu || 0
    return { from: `À partir de ${labelMonthFR(ym)}`, p1, p2, p3 }
  })

  // 4) Dédupe les lignes consécutives identiques
  const dedup = []
  for (const r of rows) {
    const last = dedup[dedup.length - 1]
    if (last && last.p1 === r.p1 && last.p2 === r.p2 && last.p3 === r.p3) continue
    dedup.push(r)
  }
  return dedup
}, [pretsPlus, startYM, pret1Rows, autresRows, N])

  /* ---- Vérifications ---- */
  const warnings = useMemo(() => {
    const w = []
    // N'afficher l'alerte que si l'utilisateur a interagi avec le champ (onBlur)
    if (touched.capital && (effectiveCapitalPret1 || 0) <= 0) w.push('Le capital du prêt 1 doit être > 0.')
    if (touched.duree && (N || 0) <= 0) w.push('La durée (mois) doit être > 0.')
    if (creditType === 'amortissable') {
      const m1 = pret1Rows?.[0]?.mensu ?? 0
      const i1 = pret1Rows?.[0]?.interet ?? 0
      if (m1 < i1 - 1e-6) w.push('La mensualité du prêt 1 est inférieure aux intérêts du premier mois.')
    }
    pretsPlus.forEach((p, idx) => {
      const k = idx + 2
      if ((toNum(p.capital) || 0) <= 0)  w.push(`Le capital du prêt ${k} doit être > 0.`)
      if ((toNum(p.duree)   || 0) <= 0)  w.push(`La durée du prêt ${k} doit être > 0.`)
    })
    return w
  }, [effectiveCapitalPret1, N, creditType, pret1Rows, pretsPlus, touched])

  /* ---- Actions prêts additionnels ---- */
  const addPret = () => {
    if (pretsPlus.length >= 2) return
    setPretsPlus(arr => [...arr, {
      id: rid(), capital: 100000, duree: 120, taux: 2.50,
      startYM, type: creditType,
      tauxAssur: 0, assurMode: 'CRD'  // Assurance désactivée par défaut (zéro régression)
    }])
  }
  const updatePret = (id, patch) => setPretsPlus(arr => arr.map(p => p.id === id ? ({ ...p, ...patch }) : p))
  const removePret = (id) => setPretsPlus(arr => arr.filter(p => p.id !== id))
  // Transpose un array-of-arrays (pour les échéanciers : périodes en colonnes)
  function transpose(aoa) {
    if (!aoa.length) return aoa;
    const rows = aoa.length;
    const cols = Math.max(...aoa.map(r => r.length));
    const out = Array.from({ length: cols }, () => Array(rows).fill(''));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out[c][r] = aoa[r][c] ?? '';
      }
    }
    return out;
  }

  /* ---- Export Excel (.xlsx) ---- */

  const cell = (v, style) => ({ v, style });

  async function exportExcel() {
    setExportLoading(true);
    try {
      // V4: Dynamic import Excel builder
      const { buildXlsxBlob, downloadXlsx, validateXlsxBlob } = await import('../utils/xlsxBuilder');
      const headerResume = [
        cell('Période', 'sHeader'),
        cell('Intérêts', 'sHeader'),
        cell('Assurance', 'sHeader'),
        cell('Amort.', 'sHeader'),
        cell(isAnnual ? 'Annuité' : 'Mensualité', 'sHeader'),
        cell(isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.', 'sHeader'),
        cell('CRD total', 'sHeader'),
        cell('Assurance décès', 'sHeader'),
      ];
      const headerPret = [
        cell('Période', 'sHeader'),
        cell('Intérêts', 'sHeader'),
        cell('Assurance', 'sHeader'),
        cell('Amort.', 'sHeader'),
        cell(isAnnual ? 'Annuité' : 'Mensualité', 'sHeader'),
        cell(isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.', 'sHeader'),
        cell('CRD', 'sHeader'),
        cell('Capitaux décès', 'sHeader'),
      ];

      // 0) Onglet PARAMÈTRES : tout ce qui est saisi par l’utilisateur
      const headerParams = [cell('Champ', 'sHeader'), cell('Valeur', 'sHeader')];
      const rowsParams = [];

      // Prêt 1
      rowsParams.push([cell('Prêt 1', 'sSection'), cell('', 'sSection')]);
      rowsParams.push([cell('Type de crédit (Prêt 1)', 'sText'), cell(creditType === 'amortissable' ? 'Amortissable' : 'In fine', 'sText')]);
      rowsParams.push([cell('Date de souscription (Prêt 1)', 'sText'), cell(startYM ? labelMonthFR(startYM) : '', 'sText')]);
      rowsParams.push([cell('Durée (mois) — Prêt 1', 'sText'), cell(duree, 'sCenter')]);
      rowsParams.push([cell('Montant emprunté (Prêt 1)', 'sText'), cell(toNum(capital), 'sMoney')]);
      rowsParams.push([cell('Taux annuel (crédit) — Prêt 1', 'sText'), cell((Number(taux) || 0) / 100, 'sPercent')]);
      rowsParams.push([cell('Mensualité (hors assurance) — Prêt 1', 'sText'), cell(toNum(mensuBase), 'sMoney')]);
      rowsParams.push([cell('Mensualité totale estimée', 'sText'), cell(Math.round(mensuHorsAssurance_base + primeAssMensuelle), 'sMoney')]);
      rowsParams.push([cell("Mode de l’assurance (Prêt 1)", 'sText'), cell(assurMode === 'CI' ? 'Capital initial' : 'Capital restant dû', 'sText')]);
      rowsParams.push([cell('Taux annuel (assurance) — Prêt 1', 'sText'), cell((Number(tauxAssur) || 0) / 100, 'sPercent')]);
      rowsParams.push([cell('Vue', 'sText'), cell(isAnnual ? 'Vue annuelle' : 'Vue mensuelle', 'sText')]);
      rowsParams.push([cell('Lissage prêt 1', 'sText'), cell(lisserPret1 ? (lissageMode === 'mensu' ? 'Mensualité constante' : 'Durée constante') : 'Aucun', 'sText')]);

      // Prêts additionnels (Prêt 2 / Prêt 3)
      pretsPlus.forEach((p, idx) => {
        const k = idx + 2;
        const type = p.type || creditType;
        const pAssurMode = p.assurMode || 'CRD';
        rowsParams.push([cell(`Prêt ${k}`, 'sSection'), cell('', 'sSection')]);
        rowsParams.push([cell(`Prêt ${k} - Type de crédit`, 'sText'), cell(type === 'amortissable' ? 'Amortissable' : 'In fine', 'sText')]);
        rowsParams.push([cell(`Prêt ${k} - Montant emprunté`, 'sText'), cell(toNum(p.capital), 'sMoney')]);
        rowsParams.push([cell(`Prêt ${k} - Durée (mois)`, 'sText'), cell(toNum(p.duree), 'sCenter')]);
        rowsParams.push([cell(`Prêt ${k} - Taux annuel (crédit)`, 'sText'), cell((Number(p.taux || 0) || 0) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${k} - Taux annuel (assurance)`, 'sText'), cell((Number(p.tauxAssur || 0) || 0) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${k} - Mode assurance`, 'sText'), cell(pAssurMode === 'CI' ? 'Capital initial' : 'Capital restant dû', 'sText')]);
        rowsParams.push([cell(`Prêt ${k} - Date de souscription`, 'sText'), cell(p.startYM ? labelMonthFR(p.startYM) : '', 'sText')]);
      });

      // 1) Résumé : ce qui est affiché dans le tableau principal
      const resumeRows = tableDisplay.map((l) => [
        cell(l.periode, 'sCenter'),
        cell(Math.round(l.interet), 'sMoney'),
        cell(Math.round(l.assurance), 'sMoney'),
        cell(Math.round(l.amort), 'sMoney'),
        cell(Math.round(l.mensu), 'sMoney'),
        cell(Math.round(l.mensuTotal), 'sMoney'),
        cell(Math.round(l.crd), 'sMoney'),
        cell(Math.round(l.assuranceDeces ?? 0), 'sMoney'),
      ]);

      // 2) Détail par prêt selon la vue actuelle
      const pret1Arr = (isAnnual
        ? aggregateToYearsFromRows(pret1Rows, startYM)
        : attachMonthLabels(pret1Rows)
      ).map((l) => [
        cell(l.periode, 'sCenter'),
        cell(Math.round(l.interet), 'sMoney'),
        cell(Math.round(l.assurance), 'sMoney'),
        cell(Math.round(l.amort), 'sMoney'),
        cell(Math.round(l.mensu), 'sMoney'),
        cell(Math.round(l.mensuTotal), 'sMoney'),
        cell(Math.round(l.crd), 'sMoney'),
        cell(Math.round(l.assuranceDeces ?? 0), 'sMoney'),
      ]);

      const pret2Arr = (autresRows[0]
        ? isAnnual
          ? aggregateToYearsFromRows(autresRows[0], startYM)
          : attachMonthLabels(autresRows[0])
        : []
      ).map((l) => [
        cell(l.periode, 'sCenter'),
        cell(Math.round(l?.interet ?? 0), 'sMoney'),
        cell(Math.round(l?.assurance ?? 0), 'sMoney'),
        cell(Math.round(l?.amort ?? 0), 'sMoney'),
        cell(Math.round(l?.mensu ?? 0), 'sMoney'),
        cell(Math.round(l?.mensuTotal ?? 0), 'sMoney'),
        cell(Math.round(l?.crd ?? 0), 'sMoney'),
        cell(Math.round(l?.assuranceDeces ?? 0), 'sMoney'),
      ]);

      const pret3Arr = (autresRows[1]
        ? isAnnual
          ? aggregateToYearsFromRows(autresRows[1], startYM)
          : attachMonthLabels(autresRows[1])
        : []
      ).map((l) => [
        cell(l.periode, 'sCenter'),
        cell(Math.round(l?.interet ?? 0), 'sMoney'),
        cell(Math.round(l?.assurance ?? 0), 'sMoney'),
        cell(Math.round(l?.amort ?? 0), 'sMoney'),
        cell(Math.round(l?.mensu ?? 0), 'sMoney'),
        cell(Math.round(l?.mensuTotal ?? 0), 'sMoney'),
        cell(Math.round(l?.crd ?? 0), 'sMoney'),
        cell(Math.round(l?.assuranceDeces ?? 0), 'sMoney'),
      ]);

      const sheets = [
        {
          name: 'Paramètres',
          rows: [headerParams, ...rowsParams],
          columnWidths: [36, 22],
        },
        {
          name: 'Résumé',
          rows: transpose([headerResume, ...resumeRows]),
          columnWidths: [18, 14, 14, 14, 14, 14, 14, 14],
        },
        {
          name: 'Prêt 1',
          rows: transpose([headerPret, ...pret1Arr]),
          columnWidths: [18, 14, 14, 14, 14, 14, 14, 14],
        },
        ...(pretsPlus.length > 0
          ? [
              {
                name: 'Prêt 2',
                rows: transpose([headerPret, ...pret2Arr]),
                columnWidths: [18, 14, 14, 14, 14, 14, 14, 14],
              },
            ]
          : []),
        ...(pretsPlus.length > 1
          ? [
              {
                name: 'Prêt 3',
                rows: transpose([headerPret, ...pret3Arr]),
                columnWidths: [18, 14, 14, 14, 14, 14, 14, 14],
              },
            ]
          : []),
      ];

      const blob = await buildXlsxBlob({
        sheets,
        headerFill: themeColors?.c1,
        sectionFill: themeColors?.c7,
      });
      const isValid = await validateXlsxBlob(blob);
      if (!isValid) {
        throw new Error('XLSX invalide (signature PK manquante).');
      }
      downloadXlsx(blob, `SER1_${isAnnual ? 'Annuel' : 'Mensuel'}.xlsx`);
    } catch (e) {
      console.error('Export Excel échoué', e);
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }

  async function exportPowerPoint() {
    setExportLoading(true);
    try {
      // V4: Dynamic import PPTX builders
      const [{ buildCreditStudyDeck }, { exportAndDownloadStudyDeck }] = await Promise.all([
        import('../pptx/presets/creditDeckBuilder'),
        import('../pptx/export/exportStudyDeck')
      ]);
      
      // Build PPTX colors from theme
      // V3.3: Logo resolution based on themeSource
      // Priority: cabinet logo > user logo > undefined
      let exportLogo
      if (themeSource === 'cabinet') {
        // Mode cabinet: priorité logo cabinet, fallback logo user
        exportLogo = cabinetLogo || logo
      } else {
        // Mode custom: logo user uniquement
        exportLogo = logo
      }
      
      // TRACE: Log exact logo being used for debugging
      console.info('[Credit Export] exportLogo resolved =', exportLogo 
        ? (exportLogo.startsWith('data:') ? `dataURI (${exportLogo.length} chars)` : exportLogo.substring(0, 80) + '...')
        : '(none)')
      console.info('[Credit Export] themeSource:', themeSource, '| cabinetLogo:', !!cabinetLogo, '| userLogo:', !!logo)
      
      // Fallback: reload from user_metadata if still undefined
      if (!exportLogo) {
        console.info('[Credit Export] No logo in context, attempting reload from user_metadata...')
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.user_metadata?.cover_slide_url) {
            exportLogo = user.user_metadata.cover_slide_url
            setLogo(exportLogo)
            console.info('[Credit Export] Logo reloaded from user_metadata')
          }
        } catch (logoError) {
          console.warn('[Credit Export] Failed to reload logo:', logoError)
        }
      }

      // Build amortization rows for TOTAL (annual aggregation)
      const amortizationRowsTotal = aggregatedYears.map(row => ({
        periode: row.periode,
        interet: row.interet,
        assurance: row.assurance,
        amort: row.amort,
        annuite: row.mensu,
        annuiteTotale: row.mensuTotal,
        crd: row.crd,
      }))

      // Build per-loan amortization rows
      const pret1AggregatedYears = aggregateToYearsFromRows(pret1Rows, startYM)
      const amortizationRowsPret1 = pret1AggregatedYears.map(row => ({
        periode: row.periode,
        interet: row.interet,
        assurance: row.assurance,
        amort: row.amort,
        annuite: row.mensu,
        annuiteTotale: row.mensuTotal,
        crd: row.crd,
      }))

      // Calculate total capital (all loans)
      const totalCapital = effectiveCapitalPret1 + pretsPlus.reduce((s, p) => s + toNum(p.capital), 0)
      
      // Calculate max duration across all loans
      const maxDureeMois = Math.max(N, ...pretsPlus.map(p => toNum(p.duree) || 0))

      // Build loans array for multi-loan PPTX
      const loans = [
        {
          index: 1,
          capital: effectiveCapitalPret1,
          dureeMois: N,
          tauxNominal: taux,
          tauxAssurance: tauxAssur,
          creditType: creditType,
          assuranceMode: assurMode,
          mensualiteHorsAssurance: mensuHorsAssurance_base,
          mensualiteTotale: mensuHorsAssurance_base + primeAssMensuellePret1,
          coutInterets: pret1Interets,
          coutAssurance: pret1Assurance,
          amortizationRows: amortizationRowsPret1,
        },
        ...pretsPlus.map((p, idx) => {
          const pRows = autresRows[idx] || []
          const pAggregated = aggregateToYearsFromRows(pRows.filter(r => r), startYM)
          const pInterets = pRows.reduce((s, row) => s + ((row?.interet) || 0), 0)
          const pAssurance = pRows.reduce((s, row) => s + ((row?.assurance) || 0), 0)
          return {
            index: idx + 2,
            capital: toNum(p.capital),
            dureeMois: toNum(p.duree),
            tauxNominal: Number(p.taux) || 0,
            tauxAssurance: Number(p.tauxAssur) || 0,
            creditType: p.type || creditType,
            assuranceMode: p.assurMode || 'CRD',
            mensualiteHorsAssurance: pRows[0]?.mensu || 0,
            mensualiteTotale: pRows[0]?.mensuTotal || 0,
            coutInterets: pInterets,
            coutAssurance: pAssurance,
            amortizationRows: pAggregated.map(row => ({
              periode: row.periode,
              interet: row.interet,
              assurance: row.assurance,
              amort: row.amort,
              annuite: row.mensu,
              annuiteTotale: row.mensuTotal,
              crd: row.crd,
            })),
          }
        })
      ]

      // Build payment periods for timeline visualization
      const paymentPeriods = synthesePeriodes.map(p => ({
        label: p.from,
        mensualitePret1: p.p1,
        mensualitePret2: p.p2,
        mensualitePret3: p.p3,
        total: p.p1 + p.p2 + p.p3,
      }))

      const assuranceDecesByYear = aggregatedYears.map((row) => row?.assuranceDeces ?? 0);

      // Build credit data for PPTX with full multi-loan support
      const creditData = {
        // Global totals
        totalCapital,
        maxDureeMois,
        coutTotalInterets: totalInterets,
        coutTotalAssurance: totalAssurance,
        coutTotalCredit: coutTotalCredit,
        assuranceDecesByYear,
        
        // Smoothing info
        smoothingEnabled: lisserPret1 && pretsPlus.length > 0,
        smoothingMode: lissageMode,
        
        // Per-loan data
        loans,
        
        // Payment periods timeline
        paymentPeriods,
        
        // Total amortization (aggregated all loans)
        amortizationRows: amortizationRowsTotal,
        
        // Legacy fields for backward compatibility
        capitalEmprunte: totalCapital,
        dureeMois: maxDureeMois,
        tauxNominal: taux,
        tauxAssurance: tauxAssur,
        mensualiteHorsAssurance: mensuHorsAssurance_base,
        mensualiteTotale: mensuHorsAssurance_base + primeAssMensuelle,
        creditType: creditType,
        assuranceMode: assurMode,
        
        clientName: undefined,
      }

      // Build deck spec with logo from ThemeProvider
      const deck = buildCreditStudyDeck(creditData, pptxColors, exportLogo)

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const filename = `simulation-credit-${dateStr}.pptx`

      // Export and download
      await exportAndDownloadStudyDeck(deck, pptxColors, filename)
    } catch (error) {
      console.error('Export PowerPoint Crédit échoué:', error)
      alert('Erreur lors de la génération du PowerPoint. Veuillez réessayer.')
    } finally {
      setExportLoading(false);
    }
  }

  /* ---- Rendu ---- */
  const colLabelPaiement    = isAnnual ? 'Annuité' : 'Mensualité'
  const colLabelPaiementAss = isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.'
  const canShowLissageChips = lisserPret1 && !anyInfine && pretsPlus.length > 0

  return (
    <div className="credit-page premium-page sim-credit">
      {/* HEADER */}
      <div className="credit-header premium-header">
        <span className="credit-title premium-title">Simulateur de crédit</span>
        <div className="credit-actions">
          <div className="credit-view-toggle">
            <button className={`chip premium-btn ${viewMode==='mensuel'?'active':''}`} onClick={()=> setViewMode('mensuel')}>Mensuel</button>
            <button className={`chip premium-btn ${viewMode==='annuel'?'active':''}`} onClick={()=> setViewMode('annuel')}>Annuel</button>
          </div>
          <ExportMenu
            options={[
              { label: 'Excel', onClick: exportExcel },
              { label: 'PowerPoint', onClick: exportPowerPoint },
            ]}
            loading={exportLoading}
          />
        </div>
      </div>

      {/* WARNINGS */}
      {Array.isArray(warnings) && warnings.length > 0 && (
        <div className="credit-warnings">
          <ul>{warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {/* GRID : Paramètres + Synthèse */}
      <div className="credit-grid premium-grid">
        {/* COLONNE GAUCHE : Paramètres */}
        <div className="credit-left premium-left">
          <div className="credit-section premium-section">
            <div className="credit-section-title premium-title">Prêt principal</div>
            <div className="credit-params-grid premium-grid-2">
              <div className="credit-field premium-field">
                <label>Type de crédit</label>
                <div className="credit-input premium-input">
                  <select className="credit-select premium-select" value={creditType} onChange={e=> setCreditType(e.target.value)}>
                    <option value="amortissable">Amortissable</option>
                    <option value="infine">In fine</option>
                  </select>
                </div>
              </div>
              <div className="credit-field premium-field">
                <label>Date de souscription</label>
                <div className="credit-input premium-input">
                  <input type="month" className="credit-input__field premium-input" value={startYM} onChange={e=> setStartYM(e.target.value)}/>
                </div>
              </div>
              <div className="credit-field premium-field">
                <label>Montant emprunté</label>
                <div className="credit-input premium-input">
                  <input type="text" inputMode="numeric" className="credit-input__field premium-input" value={fmt0(effectiveCapitalPret1)} onChange={e=> onChangeCapital(e.target.value)} onBlur={()=> setTouched(t => ({...t, capital: true}))}/>
                  <span className="credit-input__unit premium-unit">€</span>
                </div>
              </div>
              <div className="credit-field premium-field">
                <label>Durée</label>
                <div className="credit-input premium-input">
                  <input type="text" inputMode="numeric" className="credit-input__field premium-input" value={String(duree)} onChange={e=> onChangeDuree(e.target.value)} onBlur={()=> setTouched(t => ({...t, duree: true}))}/>
                  <span className="credit-input__unit premium-unit">mois</span>
                </div>
              </div>
              <div className="credit-field premium-field">
                <label>Taux annuel (crédit)</label>
                <div className="credit-input premium-input">
                  <input type="text" inputMode="decimal" className="credit-input__field premium-input" value={rawTaux}
                    onChange={e => {
                      let raw = e.target.value.replace(',', '.');
                      raw = raw.replace(/[^0-9.]/g, '');
                      const parts = raw.split('.');
                      if (parts.length > 2) raw = parts.shift() + '.' + parts.join('');
                      setRawTaux(raw);
                    }}
                    onBlur={() => {
                      const num = toNumber(rawTaux);
                      setTaux(num);
                      setRawTaux(Number(num).toFixed(2).replace('.', ','));
                    }}
                  />
                  <span className="credit-input__unit premium-unit">%</span>
                </div>
              </div>
              <div className="credit-field premium-field">
                <label>Mensualité</label>
                <div className="credit-input premium-input">
                  <input type="text" className="credit-input__field premium-input" value={fmt0(mensuHorsAssurance_base)} disabled/>
                  <span className="credit-input__unit premium-unit">€</span>
                </div>
                <span className="credit-field-hint">Hors assurance</span>
              </div>
            </div>
          </div>

          <div className="credit-section premium-section">
            <div className="credit-section-title premium-section-title">Assurance emprunteur</div>
            <div className="credit-params-grid premium-grid-2">
              <div className="credit-field premium-field">
                <label>Mode de calcul</label>
                <div className="credit-input premium-input">
                  <select className="credit-select premium-select" value={assurMode} onChange={e=> setAssurMode(e.target.value)}>
                    <option value="CI">Sur capital initial</option>
                    <option value="CRD">Sur capital restant dû</option>
                  </select>
                </div>
              </div>
              <div className="credit-field premium-field">
                <label>Taux annuel (assurance)</label>
                <div className="credit-input premium-input">
                  <input type="text" inputMode="decimal" className="credit-input__field premium-input" value={rawTauxAssur}
                    onChange={e => {
                      let raw = e.target.value.replace(',', '.');
                      raw = raw.replace(/[^0-9.]/g, '');
                      const parts = raw.split('.');
                      if (parts.length > 2) raw = parts.shift() + '.' + parts.join('');
                      setRawTauxAssur(raw);
                    }}
                    onBlur={() => {
                      const num = toNumber(rawTauxAssur);
                      setTauxAssur(num);
                      setRawTauxAssur(Number(num).toFixed(2).replace('.', ','));
                    }}
                  />
                  <span className="credit-input__unit premium-unit">%</span>
                </div>
              </div>
                                        </div>
          </div>
        </div>

        {/* COLONNE DROITE : Synthèse */}
        <div className="credit-right premium-right">
          <div className="credit-summary-card premium-summary-card">
            <div className="credit-summary-title premium-summary-title">Synthèse du prêt</div>
            <div className="credit-kpi-grid premium-kpi-grid">
              <div className="credit-kpi premium-kpi">
                <div className="credit-kpi-value premium-kpi-value">{euro0(montantPrincipalAff)}</div>
                <div className="credit-kpi-label premium-kpi-label">{isAnnual ? 'Annuité' : 'Mensualité'} (hors ass.)</div>
              </div>
              <div className="credit-kpi premium-kpi">
                <div className="credit-kpi-value premium-kpi-value">{euro0(primeAssAff)}</div>
                <div className="credit-kpi-label premium-kpi-label">Assurance / {isAnnual ? 'an' : 'mois'}</div>
              </div>
            </div>
            <div className="credit-summary-row premium-summary-row">
              <span className="credit-summary-label premium-summary-label">Coût total des intérêts</span>
              <span className="credit-summary-value premium-summary-value">{euro0(totalInterets)}</span>
            </div>
            <div className="credit-summary-row">
              <span className="credit-summary-label">Coût total assurance</span>
              <span className="credit-summary-value">{euro0(totalAssurance)}</span>
            </div>
            <div className="credit-summary-row">
              <span className="credit-summary-label">Coût total du crédit</span>
              <span className="credit-summary-value credit-summary-value--highlight">{euro0(coutTotalCredit)}</span>
            </div>
            {lisserPret1 && (
              <div className="credit-summary-row">
                <span className="credit-summary-label">Différence de durée</span>
                <span className="credit-summary-value">{diffDureesMois > 0 ? `+${diffDureesMois}` : diffDureesMois} mois</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRÊTS ADDITIONNELS */}
      <div className="credit-section">
        <div className="credit-prets-header">
          <span className="credit-prets-title">Prêts additionnels (max 2)</span>
          <div className="credit-prets-actions">
            <button className="chip" onClick={addPret} disabled={pretsPlus.length>=2}>+ Ajouter un prêt</button>
            {pretsPlus.length > 0 && (
              <button
                className={`chip ${lisserPret1 ? 'active' : ''}`}
                onClick={()=> setLisserPret1(v => !v)}
                disabled={anyInfine}
                title={anyInfine ? "Le lissage est indisponible si un prêt est en In fine" : "Lisser la mensualité totale en ajustant le prêt 1"}
              >
                {lisserPret1 ? 'Lissage : ON' : 'Lisser le prêt 1'}
              </button>
            )}
            {canShowLissageChips && (
              <>
                <button className={`chip ${lissageMode==='mensu' ? 'active' : ''}`} onClick={()=> setLissageMode('mensu')}>Mensualité cste</button>
                <button className={`chip ${lissageMode==='duree' ? 'active' : ''}`} onClick={()=> setLissageMode('duree')}>Durée cste</button>
              </>
            )}
          </div>
        </div>

        {pretsPlus.length > 0 && (
          <div className="credit-table-wrapper">
            <table className="credit-table credit-table--compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th className="text-right">Capital</th>
                  <th className="text-right">Durée</th>
                  <th className="text-right">Taux</th>
                  <th className="text-right">Taux (ass.)</th>
                  <th>Mode</th>
                  <th className="text-right">Mensualité</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pretsPlus.map((p,idx)=>{
                  const rM = (Math.max(0, Number(p.taux)||0)/100)/12
                  const Np = Math.max(1, Math.floor(toNum(p.duree)||0))
                  const C  = Math.max(0, toNum(p.capital))
                  const type = p.type || creditType
                  const mensu = (type === 'infine') ? (rM === 0 ? 0 : C * rM) : mensualiteAmortissable(C, rM, Np)
                  return (
                    <tr key={p.id}>
                      <td>{idx+2}</td>
                      <td>
                        <select className="credit-select" value={type} onChange={e=> updatePret(p.id, { type: e.target.value })} style={{height:28}}>
                          <option value="amortissable">Amort.</option>
                          <option value="infine">In fine</option>
                        </select>
                      </td>
                      <td className="text-right">
                        <input type="text" inputMode="numeric" className="credit-input__field" value={fmt0(C)} onChange={e=> updatePret(p.id, { capital: String(e.target.value).replace(/\D/g,'').slice(0,8) })} style={{height:28}}/>
                      </td>
                      <td className="text-right">
                        <input type="text" inputMode="numeric" className="credit-input__field" value={String(toNum(p.duree) || 0)} onChange={e => updatePret(p.id, { duree: String(e.target.value).replace(/\D/g, '').slice(0, 3) })} style={{height:28}}/>
                      </td>
                      <td className="text-right">
                        <input type="text" inputMode="decimal" className="credit-input__field" value={rawTauxPlus[p.id] ?? (Number((Number(p.taux)||0).toFixed(2)).toString())}
                          onChange={e=>{ setRawTauxPlus(m => ({ ...m, [p.id]: e.target.value })); updatePret(p.id, { taux: toNumber(e.target.value) }); }}
                          onBlur={()=>{ setRawTauxPlus(m => ({ ...m, [p.id]: (Number((Number(p.taux)||0).toFixed(2)).toString()) })); }}
                          style={{height:28}}/>
                      </td>
                      <td className="text-right">
                        <input type="text" inputMode="decimal" className="credit-input__field" 
                          value={rawTauxAssurPlus[p.id] ?? (Number((Number(p.tauxAssur)||0).toFixed(2)).toString())}
                          onChange={e=>{ setRawTauxAssurPlus(m => ({ ...m, [p.id]: e.target.value })); updatePret(p.id, { tauxAssur: Math.max(0, toNumber(e.target.value)) }); }}
                          onBlur={()=>{ setRawTauxAssurPlus(m => ({ ...m, [p.id]: (Number((Number(p.tauxAssur)||0).toFixed(2)).toString()) })); }}
                          style={{height:28, width:60}}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <select className="credit-select" value={p.assurMode || 'CRD'} onChange={e=> updatePret(p.id, { assurMode: e.target.value })} style={{height:28, minWidth:60}}>
                          <option value="CI">CI</option>
                          <option value="CRD">CRD</option>
                        </select>
                      </td>
                      <td className="text-right font-semibold">{euro0(mensu)}</td>
                      <td className="text-center">
                        <input type="month" className="credit-input__field" value={p.startYM || startYM} onChange={e=> updatePret(p.id, { startYM: e.target.value })} style={{height:28}}/>
                      </td>
                      <td className="text-center">
                        <button className="chip" onClick={()=> removePret(p.id)}>×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TABLEAU DES PÉRIODES (si prêts multiples) */}
      {pretsPlus.length > 0 && synthesePeriodes.length > 0 && (
        <div className="credit-section">
          <div className="credit-section-title">Répartition par période</div>
          <div className="credit-table-wrapper">
            <table className="credit-table premium-table">
              <thead>
                <tr>
                  <th>Période</th>
                  <th className="text-right">Prêt 1</th>
                  <th className="text-right">Prêt 2</th>
                  {pretsPlus.length > 1 && <th className="text-right">Prêt 3</th>}
                </tr>
              </thead>
              <tbody>
                {synthesePeriodes.map((ln, i)=>(
                  <tr key={i}>
                    <td>{ln.from}</td>
                    <td className="text-right">{ln.p1>0 ? euro0(ln.p1) : '—'}</td>
                    <td className="text-right">{ln.p2>0 ? euro0(ln.p2) : '—'}</td>
                    {pretsPlus.length > 1 && <td className="text-right">{ln.p3>0 ? euro0(ln.p3) : '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLEAU D'AMORTISSEMENT */}
      <div className="credit-section">
        <div className="credit-section-title">Échéancier {isAnnual ? 'annuel' : 'mensuel'}</div>
        <div className="credit-table-wrapper">
          <table className="credit-table premium-table">
            <thead>
              <tr>
                <th>Période</th>
                <th className="text-right">Intérêts</th>
                <th className="text-right">Assurance</th>
                <th className="text-right">Amort.</th>
                <th className="text-right">{colLabelPaiement}</th>
                <th className="text-right">{colLabelPaiementAss}</th>
                <th className="text-right">CRD</th>
                <th className="text-right">Assurance décès</th>
              </tr>
            </thead>
            <tbody>
              {tableDisplay.map((l, i) => (
                <tr key={i}>
                  <td>{l.periode}</td>
                  <td className="text-right">{euro0(l.interet)}</td>
                  <td className="text-right">{euro0(l.assurance)}</td>
                  <td className="text-right">{euro0(l.amort)}</td>
                  <td className="text-right font-semibold">{euro0(l.mensu)}</td>
                  <td className="text-right font-semibold">{euro0(l.mensuTotal)}</td>
                  <td className="text-right">{euro0(l.crd)}</td>
                  <td className="text-right">{l.assuranceDeces ? euro0(l.assuranceDeces) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DÉTAIL PAR PRÊT */}
      {pretsPlus.length > 0 && (
        <div className="credit-detail-section">
          <div className="credit-section">
            <div className="credit-section-title">Détail par prêt</div>
            
            <div className="credit-detail-subtitle">Prêt 1</div>
            <div className="credit-table-wrapper">
              <table className="credit-table credit-table--compact">
                <thead>
                  <tr>
                    <th>Période</th>
                    <th className="text-right">Intérêts</th>
                    <th className="text-right">Assur.</th>
                    <th className="text-right">Amort.</th>
                    <th className="text-right">{colLabelPaiement}</th>
                    <th className="text-right">CRD</th>
                    <th className="text-right">Capitaux décès</th>
                  </tr>
                </thead>
                <tbody>
                  {(isAnnual ? aggregateToYearsFromRows(pret1Rows, startYM) : attachMonthLabels(pret1Rows)).map((l, idx) => (
                    <tr key={idx}>
                      <td>{l.periode}</td>
                      <td className="text-right">{euro0(l.interet)}</td>
                      <td className="text-right">{euro0(l.assurance)}</td>
                      <td className="text-right">{euro0(l.amort)}</td>
                      <td className="text-right font-semibold">{euro0(l.mensu)}</td>
                      <td className="text-right">{euro0(l.crd)}</td>
                      <td className="text-right">{l.assuranceDeces ? euro0(l.assuranceDeces) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {autresRows[0] && (
              <>
                <div className="credit-detail-subtitle">Prêt 2</div>
                <div className="credit-table-wrapper">
                  <table className="credit-table credit-table--compact">
                    <thead>
                      <tr>
                        <th>Période</th>
                        <th className="text-right">Intérêts</th>
                        <th className="text-right">Assur.</th>
                        <th className="text-right">Amort.</th>
                        <th className="text-right">{colLabelPaiement}</th>
                        <th className="text-right">CRD</th>
                        <th className="text-right">Capitaux décès</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isAnnual ? aggregateToYearsFromRows(autresRows[0], startYM) : attachMonthLabels(autresRows[0])).map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.periode}</td>
                          <td className="text-right">{euro0(l?.interet ?? 0)}</td>
                          <td className="text-right">{euro0(l?.assurance ?? 0)}</td>
                          <td className="text-right">{euro0(l?.amort ?? 0)}</td>
                          <td className="text-right font-semibold">{euro0(l?.mensu ?? 0)}</td>
                          <td className="text-right">{euro0(l?.crd ?? 0)}</td>
                          <td className="text-right">{l?.assuranceDeces ? euro0(l.assuranceDeces) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {autresRows[1] && (
              <>
                <div className="credit-detail-subtitle">Prêt 3</div>
                <div className="credit-table-wrapper">
                  <table className="credit-table credit-table--compact">
                    <thead>
                      <tr>
                        <th>Période</th>
                        <th className="text-right">Intérêts</th>
                        <th className="text-right">Assur.</th>
                        <th className="text-right">Amort.</th>
                        <th className="text-right">{colLabelPaiement}</th>
                        <th className="text-right">CRD</th>
                        <th className="text-right">Capitaux décès</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isAnnual ? aggregateToYearsFromRows(autresRows[1], startYM) : attachMonthLabels(autresRows[1])).map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.periode}</td>
                          <td className="text-right">{euro0(l?.interet ?? 0)}</td>
                          <td className="text-right">{euro0(l?.assurance ?? 0)}</td>
                          <td className="text-right">{euro0(l?.amort ?? 0)}</td>
                          <td className="text-right font-semibold">{euro0(l?.mensu ?? 0)}</td>
                          <td className="text-right">{euro0(l?.crd ?? 0)}</td>
                          <td className="text-right">{l?.assuranceDeces ? euro0(l.assuranceDeces) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ENCART HYPOTHÈSES */}
      <div className="credit-hypotheses">
        <div className="credit-hypotheses-title">Hypothèses et limites</div>
        <ul>
          <li>Les résultats sont indicatifs et ne constituent pas une offre de prêt.</li>
          <li>Le calcul suppose un taux fixe sur toute la durée du prêt.</li>
          <li>L'assurance emprunteur est calculée selon le mode sélectionné (capital initial ou restant dû) pour chaque prêt.</li>
          <li>Les frais de dossier, de garantie et de notaire ne sont pas inclus dans ce simulateur.</li>
        </ul>
      </div>
    </div>
  )
}
