import React, { useEffect, useMemo, useState } from 'react'
import { onResetEvent, storageKeyFor } from '../utils/reset.js'

/* ---------- Helpers format ---------- */
const fmt0 = (n)=> (Math.round(Number(n)||0)).toLocaleString('fr-FR')
const euro0 = (n)=> fmt0(n) + ' €'
const toNum  = (v)=> {
  if (typeof v === 'number') return v
  const s = String(v || '').replace(/[^\d.-]/g,'')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
const rid = () => Math.random().toString(36).slice(2,9)

/* Date utils (YYYY-MM) */
function nowYearMonth(){
  const d = new Date()
  const m = String(d.getMonth()+1).padStart(2,'0')
  return `${d.getFullYear()}-${m}`
}
function addMonths(ym/*YYYY-MM*/, k/*int*/){
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
function monthsDiff(a/*YYYY-MM*/, b/*YYYY-MM*/){
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
    const interet = crd * r

    // borne la dernière mensualité
    let mensu = mensuFixe
    const maxMensu = interet + crd
    if (mensu > maxMensu) mensu = maxMensu
    if (mensu < interet && r > 0) mensu = interet

    let amort = Math.max(0, mensu - interet)
    if (amort > crd) amort = crd

    crd = Math.max(0, crd - amort)
    const assur = (assurMode === 'CI') ? assurFixe : (crd * rAss)
    const mensuTotal = mensu + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu, mensuTotal, crd })
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
    const interet = crd * r

    let mensu = (typeof mensuOverride === 'number' && mensuOverride > 0) ? mensuOverride : interet
    const maxMensu = interet + crd
    if (mensu > maxMensu) mensu = maxMensu
    if (mensu < interet && r > 0) mensu = interet

    let amort = 0
    if (m === N) {
      amort = crd
      mensu = interet + amort
    } else if (mensu > interet) {
      amort = Math.min(crd, mensu - interet)
    }

    crd = Math.max(0, crd - amort)
    const assur = (assurMode === 'CI') ? assurFixe : (crd * rAss)
    const mensuTotal = mensu + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu, mensuTotal, crd })
  }
  return rows
}

function scheduleLisseePret1({ pret1, autresPretsRows, cibleMensuTotale }) {
  const { capital, r, rAss, N, assurMode, type } = pret1
  const rows = []
  let crd = Math.max(0, capital)
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null
  const EPS = 1e-8

  const sumMensuAutresAtMonth = (m) =>
    autresPretsRows.reduce((s, arr) => s + ((arr[m-1]?.mensu) || 0), 0)

  for (let m = 1; m <= N; m++) {
    if (crd <= EPS) break
    const interet = crd * r
    const mensuAutres = sumMensuAutresAtMonth(m)
    let mensu1 = Math.max(0, cibleMensuTotale - mensuAutres)

    // borne “intérêt + CRD” et plan selon type
    const capMensu = interet + crd
    if (mensu1 > capMensu) mensu1 = capMensu
    if (type === 'infine') {
      if (m < N && mensu1 < interet && r > 0) mensu1 = interet
    } else {
      if (mensu1 < interet && r > 0) mensu1 = interet
      if (m === N) mensu1 = interet + crd
    }

    let amort = Math.max(0, mensu1 - interet)
    if (amort > crd) amort = crd

    crd = Math.max(0, crd - amort)
    const assur = (assurMode === 'CI') ? assurFixe : (crd * rAss)
    const mensuTotal = mensu1 + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu:mensu1, mensuTotal, crd })
  }
  return rows
}

// Calcule la cible de mensualité totale (Prêt1 + autres) pour conserver une durée cible.
function findTargetForDuration({ basePret1, autresPretsRows, targetLen }) {
  // Simule une cible -> renvoie {len, lastCRD}
  const simulate = (cible) => {
    const rows = scheduleLisseePret1({
      pret1: basePret1,
      autresPretsRows,
      cibleMensuTotale: cible
    })
    const len = rows.length
    const lastCRD = rows[len-1]?.crd ?? 0
    return { len, lastCRD }
  }

  // Borne basse : intérêts du 1er mois + mensualité des autres prêts au mois 1
  const interet1 = basePret1.capital * basePret1.r
  const autresM1 = autresPretsRows.reduce((s, arr)=> s + (arr[0]?.mensu || 0), 0)
  let lo = Math.max(0, interet1 + autresM1)

  // Borne haute : on double jusqu'à atteindre une durée <= targetLen
  let hi = Math.max(lo + 1, lo * 2 || 1000)
  while (true) {
    const { len } = simulate(hi)
    if (len <= targetLen) break
    hi *= 2
    if (hi > 1e7) break // garde-fou
  }

  // Dichotomie
  for (let i=0; i<36; i++){
    const mid = (lo + hi) / 2
    const { len, lastCRD } = simulate(mid)
    if (len > targetLen || lastCRD > 1) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return hi
}

/* ===============================
   Page Crédit
================================ */
export default function Credit(){

  /* ---- ÉTATS ---- */
  const [startYM, setStartYM]         = useState(nowYearMonth()) // Date souscription prêt 1
  const [assurMode, setAssurMode]     = useState('CRD')          // 'CI' | 'CRD'
  const [creditType, setCreditType]   = useState('amortissable') // type prêt 1 (et défaut pour autres)

  const [capital, setCapital]         = useState(300000)
  const [duree, setDuree]             = useState(240)
  const [taux, setTaux]               = useState(3.50)
  const [tauxAssur, setTauxAssur]     = useState(0.30)
  const [mensuBase, setMensuBase]     = useState('')             // saisie mensu prêt 1

  // prêts additionnels : + type & startYM
  const [pretsPlus, setPretsPlus]     = useState([])             // [{id,capital,duree,taux,startYM,type}]
  const [lisserPret1, setLisserPret1] = useState(false)
  const [viewMode, setViewMode]       = useState('mensuel')      // 'mensuel' | 'annuel'
  const [lissageMode, setLissageMode] = useState('mensu') // 'mensu' | 'duree'

  // PERSISTENCE
  const STORE_KEY = storageKeyFor('credit')
  const [hydrated, setHydrated] = useState(false)
  useEffect(()=>{
    try{
      const raw = localStorage.getItem(STORE_KEY)
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
      localStorage.setItem(STORE_KEY, JSON.stringify({
        startYM, assurMode, creditType, capital, duree, taux, tauxAssur,
        mensuBase, pretsPlus, lisserPret1, viewMode, lissageMode
      }))
    }catch{}
  }, [hydrated, startYM, assurMode, creditType, capital, duree, taux, tauxAssur, mensuBase, pretsPlus, lisserPret1, viewMode, lissageMode])

  // Reset global
  useEffect(()=>{
    const off = onResetEvent?.(()=>{
      setStartYM(nowYearMonth())
      setAssurMode('CRD')
      setCreditType('amortissable')
      setCapital(300000)
      setDuree(240)
      setTaux(3.5)
      setTauxAssur(0.3)
      setMensuBase('')
      setPretsPlus([])
      setLisserPret1(false)
      setViewMode('mensuel')
      setLissageMode('mensu')
      try { localStorage.removeItem(STORE_KEY) } catch {}
    })
    return off || (()=>{})
  }, [STORE_KEY])

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

  /* ---- Gen échéanciers prêts additionnels (avec décalage startYM propre + type propre) ---- */
  function shiftRows(rows, offset){
    if (offset === 0) return rows.slice()
    if (offset > 0) return Array.from({length:offset}, () => null).concat(rows)
    // offset < 0 : démarre avant le prêt 1 → on coupe le début
    return rows.slice(-offset)
  }

  const autresRows = useMemo(()=>{
    return pretsPlus.map(p=>{
      const rM = (Math.max(0, Number(p.taux)||0)/100)/12
      const Np = Math.max(1, Math.floor(toNum(p.duree)||0))
      const C  = Math.max(0, toNum(p.capital))
      const type = p.type || creditType

      // AUCUNE assurance sur les prêts additionnels
      const rows = (type === 'infine')
        ? scheduleInFine({ capital:C, r:rM, rAss:0, N:Np, assurMode })
        : scheduleAmortissable({ capital:C, r:rM, rAss:0, N:Np, assurMode })

      const off = monthsDiff(startYM, p.startYM || startYM)
      return shiftRows(rows, off)
    })
  }, [pretsPlus, creditType, assurMode, startYM])

  // ====== Durée "de base" du prêt 1 (sans lissage) ======
  const basePret1Rows = useMemo(() => {
    const base = { capital: effectiveCapitalPret1, r, rAss: rA, N, assurMode, type: creditType }
    return (creditType === 'infine')
      ? scheduleInFine({ ...base, mensuOverride: mensuHorsAssurance_base })
      : scheduleAmortissable({ ...base, mensuOverride: mensuHorsAssurance_base })
  }, [effectiveCapitalPret1, r, rA, N, assurMode, creditType, mensuHorsAssurance_base])

  /* ---- Prêt 1 (standard ou lissé) ---- */
  const pret1Rows = useMemo(()=>{
    const basePret1 = { capital: effectiveCapitalPret1, r, rAss:rA, N, assurMode, type: creditType }

    // Pas de lissage ou pas d'autres prêts => comportement standard
    if (!lisserPret1 || autresRows.length === 0) {
      return (creditType === 'infine')
        ? scheduleInFine({ ...basePret1, mensuOverride: mensuBaseEffectivePret1 })
        : scheduleAmortissable({ ...basePret1, mensuOverride: mensuBaseEffectivePret1 })
    }

    if (lissageMode === 'mensu') {
      // Mode historique : maintenir la mensualité totale (M1)
      const mensuAutresM1 = autresRows.reduce((s,arr)=> s + ((arr[0]?.mensu) || 0), 0)
      const cible = mensuBaseEffectivePret1 + mensuAutresM1
      return scheduleLisseePret1({ pret1: basePret1, autresPretsRows: autresRows, cibleMensuTotale: cible })
    }

    // Nouveau mode : maintenir la DURÉE (identique à la durée "base")
    const targetLen = basePret1Rows.length
    const cible = findTargetForDuration({ basePret1, autresPretsRows: autresRows, targetLen })
    return scheduleLisseePret1({ pret1: basePret1, autresPretsRows: autresRows, cibleMensuTotale: cible })
  }, [
    effectiveCapitalPret1, r, rA, N, assurMode, creditType,
    mensuBaseEffectivePret1, lisserPret1, autresRows, lissageMode, basePret1Rows.length
  ])

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
      const p1 = collect(pret1Rows[m-1])
      const others = autresRows.reduce((s,arr)=> {
        const r = collect(arr[m-1]); return { i:s.i+r.i, a:s.a+r.a, am:s.am+r.am, me:s.me+r.me, mt:s.mt+r.mt, c:s.c+r.c }
      }, {i:0,a:0,am:0,me:0,mt:0,c:0})
      out.push({
        mois:m,
        interet: p1.i + others.i,
        assurance: p1.a + others.a,
        amort: p1.am + others.am,
        mensu: p1.me + others.me,
        mensuTotal: p1.mt + others.mt,
        crd: p1.c + others.c
      })
    }
    return out
  }, [pret1Rows, autresRows, N])

  /* ---- Agrégation annuelle (si besoin) ---- */
  function aggregateToYears(rows /*mensuel*/) {
    const map = new Map()
    rows.forEach((r, idx) => {
      const ym = addMonths(startYM, idx)
      const year = labelYear(ym)
      const cur = map.get(year) || { interet:0, assurance:0, amort:0, mensu:0, mensuTotal:0, crd:0 }
      cur.interet    += r.interet
      cur.assurance  += r.assurance
      cur.amort      += r.amort
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

  const tableDisplay = useMemo(()=>{
    if (viewMode === 'annuel') return aggregateToYears(agrRows)
    return attachMonthLabels(agrRows)
  }, [agrRows, viewMode, startYM])

  /* ---- Synthèse ---- */
  const mensualiteTotaleM1 = (pret1Rows[0]?.mensu || 0) + autresRows.reduce((s,arr)=> s + ((arr[0]?.mensu) || 0), 0)
  const primeAssMensuelle = (pret1Rows[0]?.assurance || 0) // assurance uniquement prêt 1
  const coutInteretsPret1 = pret1Rows.reduce((s,l)=> s + (l.interet||0), 0)
  const coutInteretsAgr   = agrRows.reduce((s,l)=> s + l.interet, 0)
  const pret1Interets     = pret1Rows.reduce((s,l)=> s + (l.interet   || 0), 0)
  const pret1Assurance    = pret1Rows.reduce((s,l)=> s + (l.assurance || 0), 0)

  /* ---- Vérifications ---- */
const warnings = useMemo(() => {
  const w = [];

  // Capital prêt 1
  if ((effectiveCapitalPret1 || 0) <= 0) {
    w.push('Le capital du prêt 1 doit être > 0.');
  }

  // Durée prêt 1
  if ((N || 0) <= 0) {
    w.push('La durée (mois) doit être > 0.');
  }

  // Mensualité vs intérêts (prêt 1) si amortissable
  if (creditType === 'amortissable') {
    const m1  = pret1Rows?.[0]?.mensu ?? 0;
    const i1  = pret1Rows?.[0]?.interet ?? 0;
    if (m1 < i1 - 1e-6) {
      w.push('La mensualité du prêt 1 est inférieure aux intérêts du premier mois.');
    }
  }

  // Prêts additionnels
  pretsPlus.forEach((p, idx) => {
    const k = idx + 2;
    if ((toNum(p.capital) || 0) <= 0)  w.push(`Le capital du prêt ${k} doit être > 0.`);
    if ((toNum(p.duree)   || 0) <= 0)  w.push(`La durée du prêt ${k} doit être > 0.`);
  });

  return w;
}, [effectiveCapitalPret1, N, creditType, pret1Rows, pretsPlus]);

  
  /* ---- Export Excel (.xls) ---- */
  function buildWorksheetXml(title, header, rows) {
    const esc = (s)=> String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    const rowXml = (cells)=> `<Row>${
      cells.map(v => `<Cell><Data ss:Type="${typeof v === 'number' ? 'Number' : 'String'}">${esc(v)}</Data></Cell>`).join('')
    }</Row>`
    return `
      <Worksheet ss:Name="${esc(title)}">
        <Table>
          ${rowXml(header)}
          ${rows.map(r => rowXml(r)).join('')}
        </Table>
      </Worksheet>`
  }

  function exportExcel() {
    try {
      // Feuille AGRÉGÉ (toujours en mensuel pour l’export, lisible)
      const header = ['Mois','Intérêts','Assurance','Amort.','Paiement','Paiement + Assur.','CRD total']
      const agr = agrRows.map((l,idx) => [
        labelMonthFR(addMonths(startYM, idx)),
        Math.round(l.interet),
        Math.round(l.assurance),
        Math.round(l.amort),
        Math.round(l.mensu),
        Math.round(l.mensuTotal),
        Math.round(l.crd)
      ])

      // DÉTAIL PAR PRÊT (mensuel)
      const hP = ['Mois','Intérêts','Assurance','Amort.','Mensualité','Mensualité + Assur.','CRD']

      const p1 = pret1Rows.map((l,idx) => [
        labelMonthFR(addMonths(startYM, idx)),
        Math.round(l.interet),
        Math.round(l.assurance),
        Math.round(l.amort),
        Math.round(l.mensu),
        Math.round(l.mensuTotal),
        Math.round(l.crd)
      ])

      const p2 = (autresRows[0] || []).map((l,idx)=>[
        labelMonthFR(addMonths(startYM, idx)),
        Math.round(l?.interet ?? 0),
        Math.round(l?.assurance ?? 0),
        Math.round(l?.amort ?? 0),
        Math.round(l?.mensu ?? 0),
        Math.round(l?.mensuTotal ?? 0),
        Math.round(l?.crd ?? 0)
      ])

      const p3 = (autresRows[1] || []).map((l,idx)=>[
        labelMonthFR(addMonths(startYM, idx)),
        Math.round(l?.interet ?? 0),
        Math.round(l?.assurance ?? 0),
        Math.round(l?.amort ?? 0),
        Math.round(l?.mensu ?? 0),
        Math.round(l?.mensuTotal ?? 0),
        Math.round(l?.crd ?? 0)
      ])

      const xml =
        `<?xml version="1.0"?>
        <?mso-application progid="Excel.Sheet"?>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
          ${buildWorksheetXml('Agrégé', header, agr)}
          ${buildWorksheetXml('Prêt 1', hP, p1)}
          ${buildWorksheetXml('Prêt 2', hP, p2)}
          ${buildWorksheetXml('Prêt 3', hP, p3)}
        </Workbook>`

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'amortissement.xls'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export Excel échoué', e)
      alert('Impossible de générer le fichier Excel.')
    }
  }

  /* ---- Rendu ---- */
  const isAnnual = viewMode === 'annuel'
  const colLabelPaiement    = isAnnual ? 'Annuité' : 'Mensualité'
  const colLabelPaiementAss = isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.'

  return (
    <div className="panel">
      <div className="plac-title" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
        <span>Simulateur de crédit</span>
        <div style={{display:'flex', gap:8}}>
          <button className="chip" onClick={exportExcel}>Exporter (Excel)</button>
        </div>
      </div>

      {/* PARAMÈTRES PRÊT 1 — réorganisation */}
      <div className="plac-table-wrap" style={{padding:12}}>
        <table className="plac-table" role="grid" aria-label="paramètres prêt 1" style={{tableLayout:'fixed', width:'100%'}}>
          <colgroup>
            <col style={{width:'25%'}}/>
            <col style={{width:'25%'}}/>
            <col style={{width:'25%'}}/>
            <col style={{width:'25%'}}/>
          </colgroup>
          <tbody>
            {/* Ligne 1 : Type + Date */}
            <tr>
              <td className="cell-strong">Type de crédit (Prêt 1)</td>
              <td className="input-cell">
                <select value={creditType} onChange={e=> setCreditType(e.target.value)} style={{height:32, width:'100%'}}>
                  <option value="amortissable">Amortissable</option>
                  <option value="infine">In fine</option>
                </select>
              </td>

              <td className="cell-strong">Date de souscription (Prêt 1)</td>
              <td className="input-cell">
                <input type="month" value={startYM} onChange={e=> setStartYM(e.target.value)} style={{height:32, width:'100%'}}/>
              </td>
            </tr>

            {/* Ligne 2 : Durée + Taux crédit */}
            <tr>
              <td className="cell-strong">Durée (mois)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                  <input type="text" inputMode="numeric" value={String(N)} onChange={e=> onChangeDuree(e.target.value)} style={{width:'100%', textAlign:'right', height:32}}/>
                  <span>mois</span>
                </div>
              </td>

              <td className="cell-muted">Taux annuel (crédit)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                  <input type="number" step="0.01" value={Number((taux).toFixed(2))} onChange={e=> setTaux(+e.target.value || 0)} style={{width:'100%', textAlign:'right', height:32}}/>
                  <span>%</span>
                </div>
              </td>
            </tr>

            {/* Ligne 3 : Montant + Mensualité (remontés) */}
            <tr>
              <td className="cell-strong">Montant emprunté (Prêt 1)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                  <input type="text" inputMode="numeric" value={fmt0(effectiveCapitalPret1)} onChange={e=> onChangeCapital(e.target.value)} style={{width:'100%', textAlign:'right', height:32}}/>
                  <span>€</span>
                </div>
              </td>

              <td className="cell-strong">Mensualité (hors assurance) — Prêt 1</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                  <input type="text" inputMode="numeric" placeholder={fmt0(mensuHorsAssurance_base)} value={mensuBase} onChange={e=> onChangeMensuBase(e.target.value)} style={{width:'100%', textAlign:'right', height:32}}/>
                  <span>€</span>
                </div>
              </td>
            </tr>

            {/* Ligne 4 : Mode assurance (descendu) + Taux assurance */}
            <tr>
              <td className="cell-strong">Mode de l’assurance</td>
              <td className="input-cell">
                <select value={assurMode} onChange={e=> setAssurMode(e.target.value)} style={{height:32, width:'100%'}}>
                  <option value="CI">Capital initial</option>
                  <option value="CRD">Capital restant dû</option>
                </select>
              </td>

              <td className="cell-muted">Taux annuel (assurance)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                  <input type="number" step="0.01" value={Number((tauxAssur).toFixed(2))} onChange={e=> setTauxAssur(+e.target.value || 0)} style={{width:'100%', textAlign:'right', height:32}}/>
                  <span>%</span>
                </div>
              </td>
            </tr>

            {/* Ligne 5 : Coût + Vue */}
            <tr>
              <td className="cell-strong">Coût total (intérêts + assurance)</td>
              <td className="input-cell" style={{textAlign:'right', fontWeight:600}}>
                {euro0(pret1Interets + pret1Assurance)}
                <div className="cell-muted" style={{fontSize:12}}>
                  dont intérêts {euro0(pret1Interets)} • assurance {euro0(pret1Assurance)}
                </div>
              </td>

              <td className="cell-strong">Vue</td>
              <td className="input-cell" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                <button className={`chip ${viewMode==='mensuel'?'active':''}`} onClick={()=> setViewMode('mensuel')}>Vue mensuelle</button>
                <button className={`chip ${viewMode==='annuel'?'active':''}`}  onClick={()=> setViewMode('annuel')}>Vue annuelle</button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* WARNINGS */}
      {Array.isArray(warnings) && warnings.length > 0 && (
        <div style={{background:'#FFF7E6', border:'1px solid #E5C07B', color:'#7A5A00', padding:'8px 12px', borderRadius:8, marginTop:8}}>
          <ul style={{margin:0, paddingLeft:18}}>
            {warnings.map((w,i)=><li key={i}>{w}</li>)}
          </ul>
        </div>
        )}

      {/* PRÊTS ADDITIONNELS */}
      <div style={{marginTop:14}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
          <div className="cell-strong">Prêts additionnels (max 2)</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button className="chip" onClick={addPret} disabled={pretsPlus.length>=2}>+ Ajouter un prêt</button>
            <button className={`chip ${lisserPret1 ? 'active' : ''}`} onClick={()=> setLisserPret1(v => !v)} title="Lisser la mensualité totale en ajustant le prêt 1">
              {lisserPret1 ? 'Lisser le prêt 1 : ON' : 'Lisser le prêt 1'}
            </button>
          </div>
        </div>

        {pretsPlus.length > 0 && (
          <div className="plac-table-wrap" style={{padding:12, marginTop:8}}>
            <table className="plac-table" role="grid" aria-label="prêts additionnels"
                   style={{tableLayout:'fixed', width:'100%'}}>
              <colgroup>
                <col style={{width:'5%'}}/>{/* # */}
                <col style={{width:'12%'}}/>{/* Type */}
                <col style={{width:'14%'}}/>{/* Capital */}
                <col style={{width:'10%'}}/>{/* Durée */}
                <col style={{width:'10%'}}/>{/* Taux */}
                <col style={{width:'16%'}}/>{/* Mensu */}
                <col style={{width:'18%'}}/>{/* Date */}
                <col style={{width:'15%'}}/>{/* Btn */}
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th style={{textAlign:'right'}}>Capital (€)</th>
                  <th style={{textAlign:'right'}}>Durée</th>
                  <th style={{textAlign:'right'}}>Taux (%)</th>
                  <th style={{textAlign:'right'}}>Mensualité (hors assur.)</th>
                  <th>Date de souscription</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pretsPlus.map((p,idx)=>{
                  const rM = (Math.max(0, Number(p.taux)||0)/100)/12
                  const Np = Math.max(1, Math.floor(toNum(p.duree)||0))
                  const C  = Math.max(0, toNum(p.capital))
                  const type = p.type || creditType
                  const mensu = (type === 'infine')
                    ? (rM === 0 ? 0 : C * rM)
                    : mensualiteAmortissable(C, rM, Np)
                  return (
                    <tr key={p.id}>
                      <td>{idx+2}</td>
                      <td className="input-cell">
                        <select
                          value={type}
                          onChange={e=> updatePret(p.id, { type: e.target.value })}
                          style={{height:28, width:'100%'}}
                        >
                          <option value="amortissable">Amortissable</option>
                          <option value="infine">In fine</option>
                        </select>
                      </td>
                      <td className="input-cell" style={{textAlign:'right'}}>
                        <input type="text" inputMode="numeric" value={fmt0(C)}
                               onChange={e=> updatePret(p.id, { capital: String(e.target.value).replace(/\D/g,'').slice(0,8) })}
                               style={{width:'100%', textAlign:'right', height:28}}/>
                      </td>
                      <td className="input-cell" style={{textAlign:'right'}}>
                        <input type="text" inputMode="numeric" value={String(Np)}
                               onChange={e=> updatePret(p.id, { duree: String(e.target.value).replace(/\D/g,'').slice(0,3) })}
                               style={{width:'100%', textAlign:'right', height:28}}/>
                      </td>
                      <td className="input-cell" style={{textAlign:'right'}}>
                        <input type="number" step="0.01" value={Number((Number(p.taux)||0).toFixed(2))}
                               onChange={e=> updatePret(p.id, { taux: +e.target.value || 0 })}
                               style={{width:'100%', textAlign:'right', height:28}}/>
                      </td>
                      <td style={{textAlign:'right', fontWeight:600}}>{euro0(mensu)}</td>
                      <td className="input-cell" style={{textAlign:'center'}}>
                        <input type="month" value={p.startYM || startYM}
                               onChange={e=> updatePret(p.id, { startYM: e.target.value })}
                               style={{height:28, width:'100%'}}/>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <button className="chip" style={{width:'100%'}} onClick={()=> removePret(p.id)}>Supprimer</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SYNTHESE */}
      <div style={{ marginTop:14, border:'1px solid #C0B5AA', borderRadius:10, padding:'12px 14px', background:'#F8F6F4' }}>
        {viewMode !== 'annuel' ? (
          /* ---- VUE MENSUELLE ---- */
          <>
            <div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
              <div>
                <div className="cell-muted">Votre mensualité totale :</div>
                <div style={{fontWeight:700, color:'#2C3D38'}}>
                  {euro0(mensualiteTotaleM1)} <span className="cell-muted">(hors assurance)</span>
                </div>
              </div>
              <div>
                <div className="cell-muted">Coût total des prêts (hors assurance) :</div>
                <div style={{fontWeight:700, color:'#2C3D38'}}>{euro0(coutInteretsAgr)}</div>
              </div>
              <div>
                <div className="cell-muted">Votre prime d’assurance mensuelle :</div>
                <div style={{fontWeight:700, color:'#2C3D38'}}>{euro0(primeAssMensuelle)}</div>
              </div>
            </div>

            <div className="cell-muted" style={{marginTop:6}}>
              Différence de durées : <span style={{fontWeight:700, color:'#2C3D38'}}>
                {diffDureesMois > 0 ? `+${diffDureesMois}` : diffDureesMois} mois
              </span>
            </div>

            {/* Contrôles lissage (à droite) */}
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:6, flexWrap:'wrap'}}>
              <button
                className={`chip ${lissageMode==='mensu' ? 'active' : ''}`}
                onClick={()=> setLissageMode('mensu')}
                disabled={!lisserPret1}
                title="Lisser en maintenant la mensualité totale (peut réduire la durée)"
              >
                Lissage : mensualité constante
              </button>
              <button
                className={`chip ${lissageMode==='duree' ? 'active' : ''}`}
                onClick={()=> setLissageMode('duree')}
                disabled={!lisserPret1}
                title="Lisser en maintenant la durée du prêt 1"
              >
                Lissage : durée constante
              </button>
            </div>

            {/* Tableau synthétique de périodes — s'affiche dès qu'il y a ≥1 prêt additionnel */}
            {pretsPlus.length > 0 && synthesePeriodes.length > 0 && (
              <div style={{marginTop:10}}>
                <table className="plac-table" style={{tableLayout:'fixed', width:'100%'}}>
                  <colgroup>
                    <col style={{width:'40%'}}/>
                    <col style={{width:'20%'}}/>
                    <col style={{width:'20%'}}/>
                    <col style={{width:'20%'}}/>
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Période</th>
                      <th>Prêt 1</th>
                      <th>Prêt 2</th>
                      <th>Prêt 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthesePeriodes.map((ln, i)=>(
                      <tr key={i}>
                        <td className="cell-strong">{ln.from}</td>
                        <td style={{textAlign:'right'}}>{ln.p1>0 ? euro0(ln.p1) : '—'}</td>
                        <td style={{textAlign:'right'}}>{ln.p2>0 ? euro0(ln.p2) : '—'}</td>
                        <td style={{textAlign:'right'}}>{ln.p3>0 ? euro0(ln.p3) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* ---- VUE ANNUELLE ---- */
          <>
            {/* Contrôles lissage (à droite) */}
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:6, flexWrap:'wrap'}}>
              <button
                className={`chip ${lissageMode==='mensu' ? 'active' : ''}`}
                onClick={()=> setLissageMode('mensu')}
                disabled={!lisserPret1}
                title="Lisser en maintenant la mensualité totale (peut réduire la durée)"
              >
                Lissage : mensualité constante
              </button>
              <button
                className={`chip ${lissageMode==='duree' ? 'active' : ''}`}
                onClick={()=> setLissageMode('duree')}
                disabled={!lisserPret1}
                title="Lisser en maintenant la durée du prêt 1"
              >
                Lissage : durée constante
              </button>
            </div>

            {(() => {
              const ann = aggregateToYears(agrRows)
              const annuiteMaxSansAss = ann.length ? Math.max(...ann.map(a => a.mensu)) : 0
              return (
                <div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
                  <div>
                    <div className="cell-muted">Votre annuité totale :</div>
                    <div style={{fontWeight:700, color:'#2C3D38'}}>
                      {euro0(annuiteMaxSansAss)} <span className="cell-muted">(hors assurance)</span>
                    </div>
                  </div>

                  <div>
                    <div className="cell-muted">Coût total des prêts (hors assurance) :</div>
                    <div style={{fontWeight:700, color:'#2C3D38'}}>{euro0(coutInteretsAgr)}</div>
                  </div>
                </div>
              )
            })()}

            <div className="cell-muted" style={{marginTop:6}}>
              Différence de durées : <span style={{fontWeight:700, color:'#2C3D38'}}>
                {diffDureesMois > 0 ? `+${diffDureesMois}` : diffDureesMois} mois
              </span>
            </div>

            {/* En vue annuelle, le tableau de périodes s'affiche aussi si ≥1 prêt additionnel */}
            {pretsPlus.length > 0 && synthesePeriodes.length > 0 && (
              <div style={{marginTop:10}}>
                <table className="plac-table" style={{tableLayout:'fixed', width:'100%'}}>
                  <colgroup>
                    <col style={{width:'40%'}}/>
                    <col style={{width:'20%'}}/>
                    <col style={{width:'20%'}}/>
                    <col style={{width:'20%'}}/>
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Période</th>
                      <th>Prêt 1</th>
                      <th>Prêt 2</th>
                      <th>Prêt 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthesePeriodes.map((ln, i)=>(
                      <tr key={i}>
                        <td className="cell-strong">{ln.from}</td>
                        <td style={{textAlign:'right'}}>{ln.p1>0 ? euro0(ln.p1) : '—'}</td>
                        <td style={{textAlign:'right'}}>{ln.p2>0 ? euro0(ln.p2) : '—'}</td>
                        <td style={{textAlign:'right'}}>{ln.p3>0 ? euro0(ln.p3) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div className="plac-table-wrap" style={{marginTop:16}}>
        <table className="plac-table" role="grid" aria-label="amortissement" style={{tableLayout:'fixed', width:'100%'}}>
          <thead>
            <tr>
              <th>Période</th>
              <th style={{textAlign:'right'}}>Intérêts</th>
              <th style={{textAlign:'right'}}>Assurance</th>
              <th style={{textAlign:'right'}}>Amort.</th>
              <th style={{textAlign:'right'}}>{colLabelPaiement}</th>
              <th style={{textAlign:'right'}}>{colLabelPaiementAss}</th>
              <th style={{textAlign:'right'}}>CRD total</th>
            </tr>
          </thead>
          <tbody>
            {tableDisplay.map((l, i) => (
              <tr key={i}>
                <td>{l.periode}</td>
                <td style={{textAlign:'right'}}>{euro0(l.interet)}</td>
                <td style={{textAlign:'right'}}>{euro0(l.assurance)}</td>
                <td style={{textAlign:'right'}}>{euro0(l.amort)}</td>
                <td style={{textAlign:'right', fontWeight:600}}>{euro0(l.mensu)}</td>
                <td style={{textAlign:'right', fontWeight:600}}>{euro0(l.mensuTotal)}</td>
                <td style={{textAlign:'right'}}>{euro0(l.crd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DÉTAIL PAR PRÊT — reste mensuel */}
      <div className="plac-table-wrap" style={{marginTop:16}}>
        <div className="cell-strong" style={{marginBottom:8}}>Détail par prêt (mensuel)</div>

        {/* PRÊT 1 */}
        <div style={{marginBottom:12}}>
          <div className="cell-muted" style={{fontSize:13, margin:'6px 0'}}>Prêt 1</div>
          <table className="plac-table" role="grid" aria-label="amortissement prêt 1"
                 style={{tableLayout:'fixed', width:'100%', fontSize:13}}>
            <thead>
              <tr>
                <th>Période</th>
                <th style={{textAlign:'right'}}>Intérêts</th>
                <th style={{textAlign:'right'}}>Assurance</th>
                <th style={{textAlign:'right'}}>Amort.</th>
                <th style={{textAlign:'right'}}>Mensualité</th>
                <th style={{textAlign:'right'}}>Mensualité + Assur.</th>
                <th style={{textAlign:'right'}}>CRD</th>
              </tr>
            </thead>
            <tbody>
              {pret1Rows.map((l, idx)=>(
                <tr key={idx}>
                  <td style={{borderRight:'1px solid #CEC1B6'}}>{labelMonthFR(addMonths(startYM, idx))}</td>
                  <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l.interet)}</td>
                  <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l.assurance)}</td>
                  <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l.amort)}</td>
                  <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6', fontWeight:600}}>{euro0(l.mensu)}</td>
                  <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6', fontWeight:600}}>{euro0(l.mensuTotal)}</td>
                  <td style={{textAlign:'right'}}>{euro0(l.crd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PRÊT 2 */}
        {autresRows[0] && (
          <div style={{marginBottom:12}}>
            <div className="cell-muted" style={{fontSize:13, margin:'6px 0'}}>Prêt 2</div>
            <table className="plac-table" role="grid" aria-label="amortissement prêt 2"
                   style={{tableLayout:'fixed', width:'100%', fontSize:13}}>
              <thead>
                <tr>
                  <th>Période</th>
                  <th style={{textAlign:'right'}}>Intérêts</th>
                  <th style={{textAlign:'right'}}>Assurance</th>
                  <th style={{textAlign:'right'}}>Amort.</th>
                  <th style={{textAlign:'right'}}>Mensualité</th>
                  <th style={{textAlign:'right'}}>Mensualité + Assur.</th>
                  <th style={{textAlign:'right'}}>CRD</th>
                </tr>
              </thead>
              <tbody>
                {autresRows[0].map((l, idx)=>(
                  <tr key={idx}>
                    <td style={{borderRight:'1px solid #CEC1B6'}}>{labelMonthFR(addMonths(startYM, idx))}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.interet ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.assurance ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.amort ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.mensu ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.mensuTotal ?? 0)}</td>
                    <td style={{textAlign:'right'}}>{euro0(l?.crd ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PRÊT 3 */}
        {autresRows[1] && (
          <div>
            <div className="cell-muted" style={{fontSize:13, margin:'6px 0'}}>Prêt 3</div>
            <table className="plac-table" role="grid" aria-label="amortissement prêt 3"
                   style={{tableLayout:'fixed', width:'100%', fontSize:13}}>
              <thead>
                <tr>
                  <th>Période</th>
                  <th style={{textAlign:'right'}}>Intérêts</th>
                  <th style={{textAlign:'right'}}>Assurance</th>
                  <th style={{textAlign:'right'}}>Amort.</th>
                  <th style={{textAlign:'right'}}>Mensualité</th>
                  <th style={{textAlign:'right'}}>Mensualité + Assur.</th>
                  <th style={{textAlign:'right'}}>CRD</th>
                </tr>
              </thead>
              <tbody>
                {autresRows[1].map((l, idx)=>(
                  <tr key={idx}>
                    <td style={{borderRight:'1px solid #CEC1B6'}}>{labelMonthFR(addMonths(startYM, idx))}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.interet ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.assurance ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.amort ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.mensu ?? 0)}</td>
                    <td style={{textAlign:'right', borderRight:'1px solid #CEC1B6'}}>{euro0(l?.mensuTotal ?? 0)}</td>
                    <td style={{textAlign:'right'}}>{euro0(l?.crd ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
