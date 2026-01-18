import React, { useEffect, useMemo, useRef, useState } from 'react'
import { onResetEvent, storageKeyFor } from '../utils/reset.js'
import { toNumber } from '../utils/number.js'
import { useTheme } from '../settings/ThemeProvider'
import { buildCreditStudyDeck } from '../pptx/presets/creditDeckBuilder'
import { exportAndDownloadStudyDeck } from '../pptx/export/exportStudyDeck'
import { supabase } from '../supabaseClient'
import './Credit.css'
import '../styles/premium-shared.css'

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
const { colors: themeColors } = useTheme()

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

const [rawTauxAss, setRawTauxAss] = useState('');
const [rawTauxPlus, setRawTauxPlus] = useState({}); // par prêt id -> string
const [rawTauxAssurPlus, setRawTauxAssurPlus] = useState({}); // par prêt id -> string pour taux assurance

//  version normalisée dès l’affichage
const [rawTaux, setRawTaux] = useState(Number(taux).toFixed(2).replace('.', ','));
const [rawTauxAssur, setRawTauxAssur] = useState(Number(tauxAssur).toFixed(2).replace('.', ','));

// Sync initial / reset
useEffect(() => {
  setRawTaux((Number(taux).toFixed(2)).toString());
  setRawTauxAss((Number(tauxAssur).toFixed(2)).toString());
}, [taux, tauxAssur]);
 
  // prêts additionnels : + type & startYM
  const [pretsPlus, setPretsPlus]     = useState([])             // [{id,capital,duree,taux,startYM,type}]
  const [lisserPret1, setLisserPret1] = useState(false)
  const [viewMode, setViewMode]       = useState('mensuel')      // 'mensuel' | 'annuel'
  const [lissageMode, setLissageMode] = useState('mensu')        // 'mensu' | 'duree'

  // --- Dropdown Export
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)
  useEffect(() => {
    const onDocClick = (e) => {
      if (!exportRef.current) return
      if (exportRef.current.contains(e.target)) return
      setExportOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

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
    setRawTauxAss('');
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
  const onChangeMensuBase = (val) => {
    const clean = String(val).replace(/[^\d]/g,'').slice(0,8)
    setMensuBase(clean ? Number(clean).toLocaleString('fr-FR') : '')
  }

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

  /* ---- Variables manquantes pour éviter le crash ---- */
  const mensuAssurance_base = useMemo(()=>{
    const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null
    return (assurMode === 'CI') ? assurFixe : 0 // Fallback simple pour éviter crash
  }, [assurMode, capital, rAss])

  const mensuTotal_base = useMemo(()=>{
    return mensuHorsAssurance_base + mensuAssurance_base
  }, [mensuHorsAssurance_base, mensuAssurance_base])

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

  /* ---- Gen échéanciers prêts additionnels (avec assurance si définie) ---- */
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

      const rows = baseRows.map(row => ({
        ...row,
        assuranceDeces: (pAssurMode === 'CI') ? C : ((row.crd || 0) + (row.amort || 0))
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

    return rows.map(row => ({
      ...row,
      assuranceDeces: (assurMode === 'CI')
        ? effectiveCapitalPret1
        : ((row.crd || 0) + (row.amort || 0))
    }))

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
    const maxLen = Math.max(pret1Rows.length, ...autresRows.map(a => a.length), N)
    const out = []
    for(let m=1; m<=maxLen; m++){
      const collect = (row)=> row ? ({
        i: row.interet||0, a: row.assurance||0, am: row.amort||0, me: row.mensu||0, mt: row.mensuTotal||0, c: row.crd||0
      }) : ({ i:0,a:0,am:0,me:0,mt:0,c:0 })
      const p1Row = pret1Rows[m-1]
      const p1 = collect(p1Row)
      const others = autresRows.reduce((s,arr)=> {
        const r = collect(arr[m-1]); return { i:s.i+r.i, a:s.a+r.a, am:s.am+r.am, me:s.me+r.me, mt:s.mt+r.mt, c:s.c+r.c }
      }, {i:0,a:0,am:0,me:0,mt:0,c:0})
      // Assurance décès cumulée de tous les prêts selon leur mode respectif
      let assuranceDecesCumul = 0
      
      // Prêt 1
      const crdStartPret1 = (p1Row ? (p1Row.crd || 0) + (p1Row.amort || 0) : 0)
      assuranceDecesCumul += (assurMode === 'CI') ? effectiveCapitalPret1 : crdStartPret1
      
      // Prêts additionnels (2 et 3)
      autresRows.forEach((arr, idx) => {
        const row = arr[m-1]
        if (row) {
          const pret = pretsPlus[idx]
          const pretMode = pret?.assurMode || 'CRD'
          const pretCapital = Math.max(0, toNum(pret?.capital) || 0)
          const crdStartPret = (row.crd || 0) + (row.amort || 0)
          assuranceDecesCumul += (pretMode === 'CI') ? pretCapital : crdStartPret
        }
      })
      
      out.push({
        mois:m,
        interet: p1.i + others.i,
        assurance: p1.a + others.a,
        amort: p1.am + others.am,
        mensu: p1.me + others.me,
        mensuTotal: p1.mt + others.mt,
        crd: p1.c + others.c,
        assuranceDeces: assuranceDecesCumul
      })
    }
    return out
  }, [pret1Rows, autresRows, pretsPlus, N, assurMode, effectiveCapitalPret1])

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
      cur.assuranceDeces = cur.assuranceDeces ?? r.assuranceDeces ?? null
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
    const acc = map.get(year) || { interet:0, assurance:0, amort:0, mensu:0, mensuTotal:0, crd:0 };
    acc.interet    += r.interet || 0;
    acc.assurance  += r.assurance || 0;
    acc.amort      += r.amort || 0;
    acc.mensu      += r.mensu || 0;
    acc.mensuTotal += r.mensuTotal || 0;
    // on prend le dernier CRD de l'année
    acc.crd         = r.crd || acc.crd || 0;
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
  
  const coutInteretsPret1  = pret1Rows.reduce((s,l)=> s + (l.interet||0), 0)
  const coutInteretsAgr    = agrRows.reduce((s,l)=> s + l.interet, 0)
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
  const annuiteMaxSansAss = useMemo(()=>{
    if (!isAnnual) return 0
    return aggregatedYears.length ? Math.max(...aggregatedYears.map(a => a.mensu)) : 0
  }, [aggregatedYears, isAnnual])

  // === Synthèse des périodes (réactive aux dates)
  // clé dédiée pour réagir aux changements de startYM des prêts 2/3
  const datesKey = useMemo(
    () => pretsPlus.map(p => p.startYM || '').join('|'),
    [pretsPlus]
  )

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

  /* ---- Export Excel (.xls) ---- */

  // Feuilles "classiques" : périodes en colonnes (on transpose)
  function buildWorksheetXml(title, header, rows) {
    const aoa = [header, ...rows];
    const t = transpose(aoa);
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowXml = (cells) =>
      `<Row>${
        cells
          .map(
            (v) =>
              `<Cell><Data ss:Type="${
                typeof v === 'number' ? 'Number' : 'String'
              }">${esc(v)}</Data></Cell>`
          )
          .join('')
      }</Row>`;

    return `
      <Worksheet ss:Name="${esc(title)}">
        <Table>
          ${t.map((r) => rowXml(r)).join('')}
        </Table>
      </Worksheet>`;
  }

  // Feuille "Paramètres" : on garde l’orientation verticale (Pas de transpose)
  function buildWorksheetXmlVertical(title, header, rows) {
    const aoa = [header, ...rows];
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowXml = (cells) =>
      `<Row>${
        cells
          .map(
            (v) =>
              `<Cell><Data ss:Type="${
                typeof v === 'number' ? 'Number' : 'String'
              }">${esc(v)}</Data></Cell>`
          )
          .join('')
      }</Row>`;

    return `
      <Worksheet ss:Name="${esc(title)}">
        <Table>
          ${aoa.map((r) => rowXml(r)).join('')}
        </Table>
      </Worksheet>`;
  }

  function exportExcel() {
    try {
      // En-têtes alignés sur la vue
      const headerResume = [
        'Période',
        'Intérêts',
        'Assurance',
        'Amort.',
        isAnnual ? 'Annuité' : 'Mensualité',
        isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.',
        'CRD total',
      ];
      const headerPret = [
        'Période',
        'Intérêts',
        'Assurance',
        'Amort.',
        isAnnual ? 'Annuité' : 'Mensualité',
        isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.',
        'CRD',
      ];

      // 0) Onglet PARAMÈTRES : tout ce qui est saisi par l’utilisateur
      const headerParams = ['Champ', 'Valeur'];
      const rowsParams = [];

      // Prêt 1
      rowsParams.push([
        'Type de crédit (Prêt 1)',
        creditType === 'amortissable' ? 'Amortissable' : 'In fine',
      ]);
      rowsParams.push([
        'Date de souscription (Prêt 1)',
        startYM ? labelMonthFR(startYM) : '',
      ]);
      rowsParams.push(['Durée (mois) — Prêt 1', duree]);
      rowsParams.push(['Montant emprunté (Prêt 1)', euro0(capital)]);
      rowsParams.push([
        'Taux annuel (crédit) — Prêt 1',
        `${Number(taux).toFixed(2).replace('.', ',')} %`,
      ]);
      rowsParams.push([
        'Mensualité (hors assurance) — Prêt 1',
        mensuBase ? `${mensuBase} €` : '',
      ]);
      rowsParams.push([
        "Mode de l’assurance (Prêt 1)",
        assurMode === 'CI' ? 'Capital initial' : 'Capital restant dû',
      ]);
      rowsParams.push([
        'Taux annuel (assurance)',
        `${Number(tauxAssur).toFixed(2).replace('.', ',')} %`,
      ]);
      rowsParams.push([
        'Vue',
        isAnnual ? 'Vue annuelle' : 'Vue mensuelle',
      ]);
      rowsParams.push([
        'Lissage prêt 1',
        lisserPret1
          ? lissageMode === 'mensu'
            ? 'Mensualité constante'
            : 'Durée constante'
          : 'Aucun',
      ]);

      // Prêts additionnels (Prêt 2 / Prêt 3)
      pretsPlus.forEach((p, idx) => {
        const k = idx + 2;
        const type = p.type || creditType;
        const pAssurMode = p.assurMode || 'CRD';
        rowsParams.push([
          `Prêt ${k} - Type de crédit`,
          type === 'amortissable' ? 'Amortissable' : 'In fine',
        ]);
        rowsParams.push([
          `Prêt ${k} - Montant emprunté`,
          euro0(toNum(p.capital)),
        ]);
        rowsParams.push([
          `Prêt ${k} - Durée (mois)`,
          toNum(p.duree),
        ]);
        rowsParams.push([
          `Prêt ${k} - Taux annuel (crédit)`,
          `${Number(p.taux || 0).toFixed(2).replace('.', ',')} %`,
        ]);
        rowsParams.push([
          `Prêt ${k} - Taux annuel (assurance)`,
          `${Number(p.tauxAssur || 0).toFixed(2).replace('.', ',')} %`,
        ]);
        rowsParams.push([
          `Prêt ${k} - Mode assurance`,
          pAssurMode === 'CI' ? 'Capital initial' : 'Capital restant dû',
        ]);
        rowsParams.push([
          `Prêt ${k} - Date de souscription`,
          p.startYM ? labelMonthFR(p.startYM) : '',
        ]);
      });

      // 1) Résumé : ce qui est affiché dans le tableau principal
      const resumeRows = tableDisplay.map((l) => [
        l.periode,
        Math.round(l.interet),
        Math.round(l.assurance),
        Math.round(l.amort),
        Math.round(l.mensu),
        Math.round(l.mensuTotal),
        Math.round(l.crd),
      ]);

      // 2) Détail par prêt selon la vue actuelle
      const pret1Arr = (isAnnual
        ? aggregateToYearsFromRows(pret1Rows, startYM)
        : attachMonthLabels(pret1Rows)
      ).map((l) => [
        l.periode,
        Math.round(l.interet),
        Math.round(l.assurance),
        Math.round(l.amort),
        Math.round(l.mensu),
        Math.round(l.mensuTotal),
        Math.round(l.crd),
      ]);

      const pret2Arr = (autresRows[0]
        ? isAnnual
          ? aggregateToYearsFromRows(autresRows[0], startYM)
          : attachMonthLabels(autresRows[0])
        : []
      ).map((l) => [
        l.periode,
        Math.round(l?.interet ?? 0),
        Math.round(l?.assurance ?? 0),
        Math.round(l?.amort ?? 0),
        Math.round(l?.mensu ?? 0),
        Math.round(l?.mensuTotal ?? 0),
        Math.round(l?.crd ?? 0),
      ]);

      const pret3Arr = (autresRows[1]
        ? isAnnual
          ? aggregateToYearsFromRows(autresRows[1], startYM)
          : attachMonthLabels(autresRows[1])
        : []
      ).map((l) => [
        l.periode,
        Math.round(l?.interet ?? 0),
        Math.round(l?.assurance ?? 0),
        Math.round(l?.amort ?? 0),
        Math.round(l?.mensu ?? 0),
        Math.round(l?.mensuTotal ?? 0),
        Math.round(l?.crd ?? 0),
      ]);

      const xml = `<?xml version="1.0"?>
        <?mso-application progid="Excel.Sheet"?>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
          ${buildWorksheetXmlVertical('Paramètres', headerParams, rowsParams)}
          ${buildWorksheetXml('Résumé', headerResume, resumeRows)}
          ${buildWorksheetXml('Prêt 1', headerPret, pret1Arr)}
          ${pretsPlus.length > 0 ? buildWorksheetXml('Prêt 2', headerPret, pret2Arr) : ''}
          ${pretsPlus.length > 1 ? buildWorksheetXml('Prêt 3', headerPret, pret3Arr) : ''}
        </Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SER1_${isAnnual ? 'Annuel' : 'Mensuel'}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export Excel échoué', e);
      alert('Impossible de générer le fichier Excel.');
    }
  }

  async function exportPowerPoint() {
    try {
      // Build PPTX colors from theme
      const pptxColors = {
        c1: themeColors.c1,
        c2: themeColors.c2,
        c3: themeColors.c3,
        c4: themeColors.c4,
        c5: themeColors.c5,
        c6: themeColors.c6,
        c7: themeColors.c7,
        c8: themeColors.c8,
        c9: themeColors.c9,
        c10: themeColors.c10,
      }

      // Try to load logo from Supabase storage
      let logoUrl = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.storage
            .from('logos')
            .createSignedUrl(`${user.id}/logo.png`, 60)
          if (data?.signedUrl) {
            logoUrl = data.signedUrl
          }
        }
      } catch (logoError) {
        console.warn('Logo loading failed, continuing without logo:', logoError)
      }

      // Build amortization rows (annual aggregation)
      const amortizationRows = aggregatedYears.map(row => ({
        periode: row.periode,
        interet: row.interet,
        assurance: row.assurance,
        amort: row.amort,
        annuite: row.mensu,
        annuiteTotale: row.mensuTotal,
        crd: row.crd,
      }))

      // Build credit data for PPTX (utilise totaux tous prêts pour cohérence avec UI)
      const creditData = {
        capitalEmprunte: effectiveCapitalPret1,
        dureeMois: N,
        tauxNominal: taux,
        tauxAssurance: tauxAssur,
        mensualiteHorsAssurance: mensuHorsAssurance_base,
        mensualiteTotale: mensuHorsAssurance_base + primeAssMensuelle,
        coutTotalInterets: totalInterets,      // Totaux tous prêts
        coutTotalAssurance: totalAssurance,    // Totaux tous prêts
        coutTotalCredit: coutTotalCredit,      // Totaux tous prêts
        creditType: creditType,
        assuranceMode: assurMode,
        amortizationRows,
        clientName: undefined, // Could be passed from props/context if available
      }

      // Build deck spec
      const deck = buildCreditStudyDeck(creditData, pptxColors, logoUrl)

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const filename = `simulation-credit-${dateStr}.pptx`

      // Export and download
      await exportAndDownloadStudyDeck(deck, pptxColors, filename)
    } catch (error) {
      console.error('Export PowerPoint Crédit échoué:', error)
      alert('Erreur lors de la génération du PowerPoint. Veuillez réessayer.')
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
          <div ref={exportRef} style={{position:'relative'}}>
            <button className="chip premium-btn" aria-haspopup="menu" aria-expanded={exportOpen ? 'true' : 'false'} onClick={()=> setExportOpen(v => !v)}>
              Exporter ▾
            </button>
            {exportOpen && (
              <div role="menu" className="credit-export-menu">
                <button role="menuitem" className="chip premium-btn" style={{width:'100%', justifyContent:'flex-start'}} onClick={()=>{ setExportOpen(false); exportExcel(); }}>Excel</button>
                <button role="menuitem" className="chip premium-btn" style={{width:'100%', justifyContent:'flex-start'}} onClick={()=>{ setExportOpen(false); exportPowerPoint(); }}>PowerPoint</button>
              </div>
            )}
          </div>
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
