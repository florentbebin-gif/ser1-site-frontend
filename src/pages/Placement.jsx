import React, { useEffect, useMemo, useRef, useState } from 'react'
import { onResetEvent, storageKeyFor } from '../utils/reset.js'
import { toNumber } from '../utils/number.js'

// On réutilise le look&feel IR (classes .ir-*)
import './Ir.css'
import './Placement.css'

/* ===========================================================
   Helpers format / parsing (FR robuste)
=========================================================== */
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const toNum = (v, def = 0) => {
  const n = toNumber(v, def)
  return Number.isFinite(n) ? n : def
}

const fmtInt = (n) => (Math.round(Number(n) || 0)).toLocaleString('fr-FR')
const euro0 = (n) => `${(Math.round(Number(n) || 0)).toLocaleString('fr-FR')} €`

const fmtPctFR = (dec, digits = 2) =>
  (Number(dec || 0) * 100).toFixed(digits).replace('.', ',')

const fmtShortEuro = (v) => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1_000_000) return `${Math.round(n / 1_000_000).toLocaleString('fr-FR')} M€`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000).toLocaleString('fr-FR')} k€`
  return `${Math.round(n).toLocaleString('fr-FR')} €`
}

/* ===========================================================
   Constantes UI
=========================================================== */
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const TMI_OPTIONS = [0, 11, 30, 41, 45]

const ENVELOPES = [
  { value: 'cto', label: 'CTO' },
  { value: 'av', label: 'Assurance-vie' },
  { value: 'pea', label: 'PEA' },
  { value: 'scpi', label: 'SCPI' },
  { value: 'per', label: 'PER' },
]

const PRODUCT_TYPES = [
  { value: 'cap', label: 'Capitalisation' },
  { value: 'dist', label: 'Distribution' },
]

/* ===========================================================
   Defaults (2 produits)
=========================================================== */
const DEFAULT_PRODUCTS = [
  {
    id: 'A',
    name: 'Placement A',
    envelope: 'cto',
    type: 'cap',             // cap | dist
    rate: 0.00,              // décimal: 0.05 = 5%
    entryFeePct: 0.00,       // décimal
    annualFeePct: 0.00,      // décimal
    initial: 0,
    contribAmount: 0,
    contribFreq: 'mensuel',  // mensuel | annuel
    durationYears: 10,
  },
  {
    id: 'B',
    name: 'Placement B',
    envelope: 'av',
    type: 'cap',
    rate: 0.00,
    entryFeePct: 0.00,
    annualFeePct: 0.00,
    initial: 0,
    contribAmount: 0,
    contribFreq: 'mensuel',
    durationYears: 10,
  },
]

/* ===========================================================
   Fiscalité simplifiée (implémentée) + flags (non activés)
=========================================================== */
function taxRateFor({ envelope, tmiDec, psDec, avMode }, yearIndex1) {
  // yearIndex1 = 1..N
  const pfu = 0.128 + psDec
  const bareme = tmiDec + psDec

  switch (envelope) {
    case 'cto':
      return { kind: 'annual_gains', rate: pfu, label: 'CTO (PFU)' }
    case 'av':
      return {
        kind: 'annual_gains',
        rate: (avMode === 'bareme' ? bareme : pfu),
        label: `Assurance-vie (${avMode === 'bareme' ? 'barème simplifié' : 'PFU'})`,
      }
    case 'pea': {
      // Simplification : avant 5 ans = PFU, après 5 ans = PS uniquement
      if (yearIndex1 <= 5) return { kind: 'annual_gains', rate: pfu, label: 'PEA (< 5 ans, PFU)' }
      return { kind: 'annual_gains', rate: psDec, label: 'PEA (≥ 5 ans, PS)' }
    }
    case 'scpi':
      return { kind: 'annual_income', rate: bareme, label: 'SCPI (IR+PS simplifiés)' }
    case 'per':
      // PER : impôt final seulement (sur gains) — simplifié
      return { kind: 'final_gains', rate: bareme, label: 'PER (impôt à la sortie, simplifié)' }
    default:
      return { kind: 'annual_gains', rate: pfu, label: 'PFU (défaut)' }
  }
}

/* ===========================================================
   Retraits (portfolio-level, appliqués à chaque produit)
=========================================================== */
const WITHDRAW_MODES = [
  { value: 'none', label: 'Aucun retrait' },
  { value: 'lump', label: 'Retrait unique (fin d’année N)' },
  { value: 'recurring', label: 'Retrait annuel récurrent (à partir de l’année N)' },
  { value: 'deplete', label: 'Épuiser le capital (à partir de l’année N, sur X années)' },
]

/* ===========================================================
   Moteur de simulation (mensuel -> agrégé annuel)
   Hypothèses (simples, explicites) :
   - Taux "rate" = rendement brut annuel constant
   - Frais annuels = % de l’encours, appliqués mensuellement
   - Impôt "simplifié" calculé sur gains annuels ou revenus (SCPI)
   - Retraits en fin d’année (après impôt)
=========================================================== */
function simulateProduct({
  product,
  general,
  withdraw,
  yearsMax,
  // optionnel: retrait constant imposé (pour "deplete")
  forcedAnnualWithdrawal = null,
}) {
  const {
    startMonth,
    returnMode,     // simple | compose
    compoundFreq,   // mensuelle | annuelle
    reinvestDistributions,
    tmiPct,
    psPct,
    avMode,
  } = general

  const tmiDec = (Number(tmiPct) || 0) / 100
  const psDec = (Number(psPct) || 0) / 100

  const dur = clamp(toNum(product.durationYears, 1), 1, 60)
  const horizonMonths = yearsMax * 12

  const entryFee = clamp(Number(product.entryFeePct) || 0, 0, 0.50)
  const annualFee = clamp(Number(product.annualFeePct) || 0, 0, 0.10)

  const rateAnnual = clamp(Number(product.rate) || 0, -0.50, 0.50)

  // Conversion en taux périodiques
  const rMonthlySimple = rateAnnual / 12
  const feeMonthly = annualFee / 12

  const rMonthlyCompound =
    (compoundFreq === 'annuelle')
      ? 0 // on appliquera au 12e mois
      : (Math.pow(1 + rateAnnual, 1 / 12) - 1)

  let capital = (toNum(product.initial, 0) * (1 - entryFee))
  let cashflowYearNet = 0
  let gainYearBeforeTax = 0
  let taxYear = 0

  const rows = []

  const contribAmt = Math.max(0, toNum(product.contribAmount, 0))
  const contribFreq = product.contribFreq === 'annuel' ? 'annuel' : 'mensuel'

  const shouldRunMonth = (monthIndex0) => {
    // moisIndex0: 0..horizonMonths-1
    // on stoppe la simulation au-delà de la durée propre au produit
    const year1 = Math.floor(monthIndex0 / 12) + 1
    return year1 <= dur
  }

  // contrib annuelle : on verse au mois de souscription (1..12) chaque année
  const isAnnualContribMonth = (monthIndex0) => {
    const monthInYear = (monthIndex0 % 12) + 1
    return monthInYear === startMonth
  }

  // premier mois actif année 1 = startMonth
  const isActiveMonth = (monthIndex0) => {
    const year1 = Math.floor(monthIndex0 / 12) + 1
    const monthInYear = (monthIndex0 % 12) + 1
    if (year1 === 1) return monthInYear >= startMonth
    return true
  }

  const applyMonthlyReturnAndFees = (monthIndex0) => {
    if (!isActiveMonth(monthIndex0)) return

    // 1) frais annuels (mensualisés) sur encours
    const fee = capital * feeMonthly
    capital -= fee

    // 2) rendement
    if (returnMode === 'simple') {
      // Pas d'intérêts sur intérêts "au fil de l'année" : on approxime via rMonthlySimple sur capital courant
      // (c'est déjà une simplification stable numériquement)
      const gain = capital * rMonthlySimple
      if (product.type === 'dist') {
        // distribution brute
        const distGross = Math.max(0, gain)
        // fiscalité SCPI = annual_income, sinon annual_gains (mais on taxe annuellement, donc on comptabilise ici)
        // On considère le cashflow brut = gain (si positif), sinon 0
        // Si réinvestissement, on ajoute plus tard après impôt annuel (au niveau annuel)
        gainYearBeforeTax += 0 // distribution n'est pas "gain capitalisé" ici
        cashflowYearNet += distGross // provisoire : deviendra net après impôt annuel
      } else {
        capital += gain
        gainYearBeforeTax += gain
      }
      return
    }

    // compose
    if (compoundFreq === 'annuelle') {
      // on applique la capitalisation au dernier mois de l'année
      const monthInYear = (monthIndex0 % 12) + 1
      if (monthInYear === 12) {
        const gain = capital * rateAnnual
        if (product.type === 'dist') {
          const distGross = Math.max(0, gain)
          cashflowYearNet += distGross // provisoire
        } else {
          capital += gain
          gainYearBeforeTax += gain
        }
      }
      return
    }

    // compose mensuel
    const gain = capital * rMonthlyCompound
    if (product.type === 'dist') {
      const distGross = Math.max(0, gain)
      cashflowYearNet += distGross // provisoire
    } else {
      capital += gain
      gainYearBeforeTax += gain
    }
  }

  const applyContrib = (monthIndex0) => {
    if (!isActiveMonth(monthIndex0)) return
    if (contribAmt <= 0) return

    if (contribFreq === 'mensuel') {
      capital += contribAmt * (1 - entryFee)
      return
    }
    if (contribFreq === 'annuel' && isAnnualContribMonth(monthIndex0)) {
      capital += contribAmt * (1 - entryFee)
    }
  }

  const applyAnnualTaxAndFinalizeYear = (year1) => {
    const taxRule = taxRateFor(
      { envelope: product.envelope, tmiDec, psDec, avMode },
      year1
    )

    let taxableBase = 0

    // distribution : base fiscale = revenus distribués (SCPI) sinon on simplifie en "revenu"
    if (product.type === 'dist') {
      // cashflowYearNet contient encore du brut "pré-impôt"
      taxableBase = Math.max(0, cashflowYearNet)
    } else {
      taxableBase = Math.max(0, gainYearBeforeTax)
    }

    if (taxRule.kind === 'final_gains') {
      // PER : pas d'impôt annuel (on le fera en fin de durée)
      taxYear = 0
    } else {
      taxYear = taxableBase * taxRule.rate
    }

    // convertir cashflow brut -> net (pour dist)
    let cashflowNetAfterTax = 0
    if (product.type === 'dist') {
      // Si enveloppe "annual_income" (SCPI) => on taxe le revenu ; pour les autres enveloppes on reste cohérent comparatif
      const net = Math.max(0, cashflowYearNet - taxYear)
      cashflowNetAfterTax = net

      // réinvestissement des distributions nettes, si activé
      if (reinvestDistributions) {
        capital += net
        cashflowNetAfterTax = 0 // si réinvesti, ce n'est plus un cashflow
      }
    }

    // Retraits en fin d’année (après impôt)
    let w = 0
    if (forcedAnnualWithdrawal !== null && Number.isFinite(forcedAnnualWithdrawal)) {
      // utilisé pour le mode "deplete"
      if (year1 >= withdraw.startYear) w = Math.max(0, forcedAnnualWithdrawal)
    } else {
      if (withdraw.mode === 'lump') {
        if (year1 === withdraw.startYear) w = Math.max(0, withdraw.amount)
      } else if (withdraw.mode === 'recurring') {
        if (year1 >= withdraw.startYear) w = Math.max(0, withdraw.amount)
      }
    }

    if (w > 0) {
      const wApplied = Math.min(capital, w)
      capital -= wApplied
      // par convention, un retrait est un cashflow net supplémentaire (hors fiscalité sur rachat non modélisée ici)
      cashflowNetAfterTax += wApplied
    }

    // PER : taxation finale à l'échéance (fin de la durée du produit)
    let perFinalTax = 0
    if (product.envelope === 'per' && year1 === dur) {
      // Base = gains cumulés : on approxime via (capital - apports nets)
      // On calcule les apports nets sur l’horizon via une approx : initial + contribs nets (sans rendement)
      // (simplification explicite)
      const initialNet = (toNum(product.initial, 0) * (1 - entryFee))
      const contribNetPer =
        contribAmt * (1 - entryFee)

      const nbAnnualContribs = (contribFreq === 'annuel')
        ? Math.max(0, dur) // une fois par an
        : 0

      const nbMonthlyContribs = (contribFreq === 'mensuel')
        ? Math.max(0, (dur * 12) - (startMonth - 1))
        : 0

      const contribsNetApprox =
        (contribFreq === 'annuel')
          ? nbAnnualContribs * contribNetPer
          : nbMonthlyContribs * contribNetPer

      const apportsApprox = initialNet + contribsNetApprox
      const gainsCumulApprox = Math.max(0, capital - apportsApprox)

      const tr = taxRateFor({ envelope: 'per', tmiDec, psDec, avMode }, year1)
      perFinalTax = gainsCumulApprox * tr.rate
      const paid = Math.min(capital, perFinalTax)
      capital -= paid
      taxYear += paid
    }

    rows.push({
      year: year1,
      endCapital: Math.max(0, capital),
      gainsBeforeTax: Math.max(0, gainYearBeforeTax),
      tax: Math.max(0, taxYear),
      cashflowNet: Math.max(0, cashflowNetAfterTax),
      taxLabel: taxRule.label,
    })

    // reset accumulateurs annuels
    cashflowYearNet = 0
    gainYearBeforeTax = 0
    taxYear = 0
  }

  for (let m = 0; m < horizonMonths; m++) {
    if (!shouldRunMonth(m)) break
    if (!isActiveMonth(m)) continue

    // versement (au début du mois)
    applyContrib(m)

    // rendement + frais (dans le mois)
    applyMonthlyReturnAndFees(m)

    // fin d’année : snapshot + fiscalité + retraits
    const monthInYear = (m % 12) + 1
    if (monthInYear === 12) {
      const year1 = Math.floor(m / 12) + 1
      applyAnnualTaxAndFinalizeYear(year1)
    }
  }

  return rows
}

/* Mode "deplete": calcule un retrait annuel W pour approximer capital final ~ 0 */
function solveDepleteWithdrawal({ product, general, withdraw, yearsMax }) {
  const startYear = clamp(toNum(withdraw.startYear, 1), 1, yearsMax)
  const duration = clamp(toNum(withdraw.depleteYears, 1), 1, yearsMax)

  // si démarrage + durée dépassent horizon, on borne
  const endYear = Math.min(yearsMax, startYear + duration - 1)

  // 0..capitalMax (on prend capital sans retrait comme upper bound)
  const rowsNoW = simulateProduct({ product, general, withdraw: { mode: 'none', startYear: 1, amount: 0 }, yearsMax })
  const capAtStart = (rowsNoW[startYear - 1]?.endCapital ?? 0)

  let lo = 0
  let hi = Math.max(0, capAtStart) // upper bound “raisonnable”
  let best = 0

  for (let iter = 0; iter < 28; iter++) {
    const mid = (lo + hi) / 2
    const rows = simulateProduct({
      product,
      general,
      withdraw: { ...withdraw, mode: 'deplete', startYear },
      yearsMax,
      forcedAnnualWithdrawal: mid,
    })

    const capEnd = rows[endYear - 1]?.endCapital ?? 0

    // on veut capEnd ~ 0 : si capEnd > 0 => retrait trop faible => augmenter
    if (capEnd > 0) {
      best = mid
      lo = mid
    } else {
      hi = mid
    }
  }
  return best
}

/* ===========================================================
   UI small components
=========================================================== */
function Field({ label, children }) {
  return (
    <div className="ir-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function InputText({ value, onChange, onBlur, inputMode = 'text', ariaLabel }) {
  return (
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      aria-label={ariaLabel}
    />
  )
}

/* ===========================================================
   Page
=========================================================== */
export default function Placement() {
  const STORE_KEY = storageKeyFor('placement')
  const [hydrated, setHydrated] = useState(false)

  // General
  const [startMonth, setStartMonth] = useState(1)
  const [returnMode, setReturnMode] = useState('compose')       // simple | compose
  const [compoundFreq, setCompoundFreq] = useState('mensuelle') // mensuelle | annuelle

  const [tmiPct, setTmiPct] = useState(30)
  const [psPct, setPsPct] = useState(17.2)
  const [avMode, setAvMode] = useState('pfu') // pfu | bareme
  const [reinvestDistributions, setReinvestDistributions] = useState(false)

  // Products (2)
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)

  // raw inputs for % fields (FR)
  const [rawRate, setRawRate] = useState(['', ''])
  const [rawEntryFee, setRawEntryFee] = useState(['', ''])
  const [rawAnnualFee, setRawAnnualFee] = useState(['', ''])

  // Withdrawals
  const [withdrawMode, setWithdrawMode] = useState('none') // none | lump | recurring | deplete
  const [withdrawStartYear, setWithdrawStartYear] = useState(5)
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [withdrawDepleteYears, setWithdrawDepleteYears] = useState(10)

  // Results view
  const [view, setView] = useState('capital') // capital | fiscalite | cashflow
  const [chartMetric, setChartMetric] = useState('capital') // capital | cashflow

  /* ---------- hydrate ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (s && typeof s === 'object') {
          if (typeof s.startMonth === 'number') setStartMonth(s.startMonth)
          if (typeof s.returnMode === 'string') setReturnMode(s.returnMode)
          if (typeof s.compoundFreq === 'string') setCompoundFreq(s.compoundFreq)

          if (typeof s.tmiPct === 'number') setTmiPct(s.tmiPct)
          if (typeof s.psPct === 'number') setPsPct(s.psPct)
          if (typeof s.avMode === 'string') setAvMode(s.avMode)
          if (typeof s.reinvestDistributions === 'boolean') setReinvestDistributions(s.reinvestDistributions)

          if (Array.isArray(s.products) && s.products.length === 2) setProducts(s.products)

          if (typeof s.withdrawMode === 'string') setWithdrawMode(s.withdrawMode)
          if (typeof s.withdrawStartYear === 'number') setWithdrawStartYear(s.withdrawStartYear)
          if (typeof s.withdrawAmount === 'number') setWithdrawAmount(s.withdrawAmount)
          if (typeof s.withdrawDepleteYears === 'number') setWithdrawDepleteYears(s.withdrawDepleteYears)

          if (typeof s.view === 'string') setView(s.view)
          if (typeof s.chartMetric === 'string') setChartMetric(s.chartMetric)
        }
      }
    } catch (_e) {}
    setHydrated(true)
  }, [STORE_KEY])

  /* ---------- persist ---------- */
  useEffect(() => {
    if (!hydrated) return
    try {
      const payload = JSON.stringify({
        startMonth, returnMode, compoundFreq,
        tmiPct, psPct, avMode, reinvestDistributions,
        products,
        withdrawMode, withdrawStartYear, withdrawAmount, withdrawDepleteYears,
        view, chartMetric,
      })
      localStorage.setItem(STORE_KEY, payload)
    } catch (_e) {}
  }, [
    hydrated,
    STORE_KEY,
    startMonth, returnMode, compoundFreq,
    tmiPct, psPct, avMode, reinvestDistributions,
    products,
    withdrawMode, withdrawStartYear, withdrawAmount, withdrawDepleteYears,
    view, chartMetric,
  ])

  /* ---------- reset (non négociable) ---------- */
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      if (simId && simId !== 'placement') return

      setStartMonth(1)
      setReturnMode('compose')
      setCompoundFreq('mensuelle')
      setTmiPct(30)
      setPsPct(17.2)
      setAvMode('pfu')
      setReinvestDistributions(false)
      setProducts(DEFAULT_PRODUCTS)

      setWithdrawMode('none')
      setWithdrawStartYear(5)
      setWithdrawAmount(0)
      setWithdrawDepleteYears(10)

      setView('capital')
      setChartMetric('capital')

      try { localStorage.removeItem(STORE_KEY) } catch {}
    })
    return off || (() => {})
  }, [STORE_KEY])

  /* ---------- sync raw % display ---------- */
  useEffect(() => {
    setRawRate(products.map(p => fmtPctFR(p.rate)))
    setRawEntryFee(products.map(p => fmtPctFR(p.entryFeePct)))
    setRawAnnualFee(products.map(p => fmtPctFR(p.annualFeePct)))
  }, [products])

  const setProd = (i, patch) =>
    setProducts(arr => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  /* ===========================================================
     Compute simulation
  =========================================================== */
  const yearsMax = useMemo(() => {
    const a = clamp(toNum(products[0]?.durationYears, 1), 1, 60)
    const b = clamp(toNum(products[1]?.durationYears, 1), 1, 60)
    return Math.max(a, b, 1)
  }, [products])

  const general = useMemo(() => ({
    startMonth,
    returnMode,
    compoundFreq,
    reinvestDistributions,
    tmiPct: clamp(toNum(tmiPct, 30), 0, 45),
    psPct: clamp(toNum(psPct, 17.2), 0, 25),
    avMode: avMode === 'bareme' ? 'bareme' : 'pfu',
  }), [startMonth, returnMode, compoundFreq, reinvestDistributions, tmiPct, psPct, avMode])

  const withdraw = useMemo(() => ({
    mode: withdrawMode,
    startYear: clamp(toNum(withdrawStartYear, 1), 1, yearsMax),
    amount: Math.max(0, toNum(withdrawAmount, 0)),
    depleteYears: clamp(toNum(withdrawDepleteYears, 1), 1, yearsMax),
  }), [withdrawMode, withdrawStartYear, withdrawAmount, withdrawDepleteYears, yearsMax])

  const sim = useMemo(() => {
    const rowsByProduct = products.map((p) => {
      // Mode deplete => on résout W par produit
      if (withdraw.mode === 'deplete') {
        const w = solveDepleteWithdrawal({ product: p, general, withdraw, yearsMax })
        const rows = simulateProduct({
          product: p,
          general,
          withdraw,
          yearsMax,
          forcedAnnualWithdrawal: w,
        })
        return { product: p, rows, depleteW: w }
      }

      const rows = simulateProduct({ product: p, general, withdraw, yearsMax })
      return { product: p, rows, depleteW: null }
    })

    // Fusion sur années 1..yearsMax
    const years = Array.from({ length: yearsMax }, (_, k) => k + 1)
    const table = years.map((year) => {
      const r0 = rowsByProduct[0].rows[year - 1] || { endCapital: 0, gainsBeforeTax: 0, tax: 0, cashflowNet: 0 }
      const r1 = rowsByProduct[1].rows[year - 1] || { endCapital: 0, gainsBeforeTax: 0, tax: 0, cashflowNet: 0 }
      return {
        year,
        A: r0,
        B: r1,
      }
    })

    const totals = rowsByProduct.map((rp) => {
      const last = rp.rows[rp.rows.length - 1] || { endCapital: 0 }
      const gainCum = rp.rows.reduce((s, r) => s + (r.gainsBeforeTax || 0), 0)
      const taxCum = rp.rows.reduce((s, r) => s + (r.tax || 0), 0)
      const cashflowCum = rp.rows.reduce((s, r) => s + (r.cashflowNet || 0), 0)
      return {
        endCapital: last.endCapital || 0,
        gainsCum: gainCum,
        taxCum,
        cashflowCum,
      }
    })

    return { years, table, rowsByProduct, totals }
  }, [products, general, withdraw, yearsMax])

  /* ===========================================================
     KPI cards
  =========================================================== */
  const kpi = useMemo(() => {
    const [tA, tB] = sim.totals
    const bestFinal = (tA.endCapital >= tB.endCapital) ? 'A' : 'B'
    const bestCash = (tA.cashflowCum >= tB.cashflowCum) ? 'A' : 'B'
    return {
      bestFinal,
      bestCash,
      A: tA,
      B: tB,
    }
  }, [sim])

  /* ===========================================================
     Chart data (capital or cashflow cumulé)
  =========================================================== */
  const chartRes = useMemo(() => {
    const series = products.map((p, idx) => {
      const key = idx === 0 ? 'A' : 'B'
      const vals = sim.table.map((row) => {
        if (chartMetric === 'cashflow') {
          // cumulé
          let sum = 0
          for (let y = 1; y <= row.year; y++) {
            sum += (sim.table[y - 1]?.[key]?.cashflowNet || 0)
          }
          return sum
        }
        return row[key]?.endCapital || 0
      })
      return { name: p.name, values: vals }
    })
    return { years: sim.years, series }
  }, [products, sim, chartMetric])

  /* ===========================================================
     Render helpers
  =========================================================== */
  const yearRowCells = (row, side) => {
    const r = row[side] || {}
    if (view === 'fiscalite') {
      return (
        <>
          <div className="pl-cell-main">{euro0(r.tax || 0)}</div>
          <div className="pl-cell-sub">Gains: {fmtShortEuro(r.gainsBeforeTax || 0)}</div>
        </>
      )
    }
    if (view === 'cashflow') {
      return (
        <>
          <div className="pl-cell-main">{euro0(r.cashflowNet || 0)}</div>
          <div className="pl-cell-sub">Capital: {fmtShortEuro(r.endCapital || 0)}</div>
        </>
      )
    }
    // capital
    return (
      <>
        <div className="pl-cell-main">{euro0(r.endCapital || 0)}</div>
        <div className="pl-cell-sub">Gains: {fmtShortEuro(r.gainsBeforeTax || 0)}</div>
      </>
    )
  }

  /* ===========================================================
     UI
  =========================================================== */
  return (
    <div className="ir-panel pl-panel">
      <div className="ir-header">
        <div>
          <div className="ir-title">Comparer deux placements</div>
          <div className="pl-subtitle">
            Simulation pédagogique (fiscalité simplifiée) — les intérêts de la 1ère année sont au pro-rata du mois de souscription.
          </div>
        </div>
      </div>

      <div className="ir-grid">
        {/* LEFT */}
        <div className="ir-left">
          {/* Top params */}
          <div className="pl-block">
            <div className="pl-block-title">Paramètres généraux</div>

            <div className="ir-top-params">
              <Field label="Mois de souscription">
                <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))}>
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </Field>

              <Field label="Mode de rendement">
                <select value={returnMode} onChange={(e) => setReturnMode(e.target.value)}>
                  <option value="compose">Composé</option>
                  <option value="simple">Simple (pédagogique)</option>
                </select>
              </Field>

              <Field label="Capitalisation (si composé)">
                <select value={compoundFreq} onChange={(e) => setCompoundFreq(e.target.value)}>
                  <option value="mensuelle">Mensuelle</option>
                  <option value="annuelle">Annuelle</option>
                </select>
              </Field>

              <Field label="TMI">
                <select value={tmiPct} onChange={(e) => setTmiPct(Number(e.target.value))}>
                  {TMI_OPTIONS.map(v => <option key={v} value={v}>{v} %</option>)}
                </select>
              </Field>

              <Field label="Prélèvements sociaux (PS)">
                <InputText
                  value={String(psPct).replace('.', ',')}
                  inputMode="decimal"
                  ariaLabel="Prélèvements sociaux"
                  onChange={(e) => setPsPct(toNum(e.target.value, 17.2))}
                  onBlur={() => setPsPct(clamp(toNum(psPct, 17.2), 0, 25))}
                />
              </Field>

              <Field label="Réinvestir les distributions ?">
                <label className="pl-toggle">
                  <input
                    type="checkbox"
                    checked={reinvestDistributions}
                    onChange={(e) => setReinvestDistributions(e.target.checked)}
                  />
                  <span>{reinvestDistributions ? 'Oui (capitalisation après impôt)' : 'Non (cashflow)'}</span>
                </label>
              </Field>

              <Field label="Assurance-vie : mode (simplifié)">
                <select value={avMode} onChange={(e) => setAvMode(e.target.value)}>
                  <option value="pfu">PFU</option>
                  <option value="bareme">Barème simplifié (TMI + PS)</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Products table */}
          <div className="ir-table-wrapper pl-products">
            <div className="pl-block-title">Produits (2 colonnes)</div>

            <table className="ir-table" role="grid" aria-label="Tableau produits">
              <thead>
                <tr>
                  <th></th>
                  <th>{products[0].name}</th>
                  <th>{products[1].name}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="ir-row-title"><td colSpan={3}>Caractéristiques</td></tr>

                <tr>
                  <td>Nom</td>
                  {[0, 1].map(i => (
                    <td key={i}>
                      <input
                        type="text"
                        value={products[i].name}
                        onChange={(e) => setProd(i, { name: e.target.value })}
                        aria-label={`Nom du produit ${i === 0 ? 'A' : 'B'}`}
                      />
                    </td>
                  ))}
                </tr>

                <tr>
                  <td>Enveloppe fiscale</td>
                  {[0, 1].map(i => (
                    <td key={i}>
                      <select
                        value={products[i].envelope}
                        onChange={(e) => setProd(i, { envelope: e.target.value })}
                        aria-label={`Enveloppe produit ${i === 0 ? 'A' : 'B'}`}
                      >
                        {ENVELOPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td>Type</td>
                  {[0, 1].map(i => (
                    <td key={i}>
                      <select
                        value={products[i].type}
                        onChange={(e) => setProd(i, { type: e.target.value })}
                        aria-label={`Type produit ${i === 0 ? 'A' : 'B'}`}
                      >
                        {PRODUCT_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td>Rendement brut annuel</td>
                  {[0, 1].map(i => (
                    <td key={i}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rawRate[i] ?? ''}
                        onChange={(e) => setRawRate(a => a.map((v, k) => (k === i ? e.target.value : v)))}
                        onBlur={(e) => {
                          const pct = clamp(toNum(e.target.value, 0), -50, 50)
                          const dec = pct / 100
                          setProd(i, { rate: dec })
                          setRawRate(a => a.map((v, k) => (k === i ? fmtPctFR(dec) : v)))
                        }}
                        aria-label={`Rendement brut annuel produit ${i === 0 ? 'A' : 'B'}`}
                      />
                    </td>
                  ))}
                </tr>

                <tr>
                  <td>Frais d’entrée</td>
                  {[0, 1].map(i => (
                    <td key={i}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rawEntryFee[i] ?? ''}
                        onChange={(e) => setRawEntryFee(a => a.map((v, k) => (k === i ? e.target.value : v)))}
                        onBlur={(e) => {
                          const pct = clamp(toNum(e.target.value, 0), 0, 50)
                          const dec = pct / 100
                          setProd(i, { entryFeePct: dec })
                          setRawEntryFee(a => a.map((v, k) => (k === i ? fmtPctFR(dec) : v)))
                        }}
                        aria-label={`Frais d’entrée produit ${i === 0 ? 'A' : 'B'}`}
                      />
                    </td>
                  ))}
                </tr>

                <tr>
                  <td>Frais annuels</td>
                  {[0, 1].map(i => (
                    <td key={i}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rawAnnualFee[i] ?? ''}
                        onChange={(e) => setRawAnnualFee(a => a.map((v, k) => (k === i ? e.target.value : v)))}
                        onBlur={(e) => {
                          const pct = clamp(toNum(e.target.value, 0), 0, 10)
                          const dec = pct / 100
                          setProd(i, { annualFeePct: dec })
                          setRawAnnualFee(a => a.map((v, k) => (k === i ? fmtPctFR(dec) : v)))
                        }}
                        aria-label={`Frais annuels produit ${i === 0 ? 'A' : 'B'}`}
                      />
                    </td>
                  ))}
                </tr>

                <tr className="ir-row-title"><td colSpan={3}>Investissement</td></tr>

                <tr>
                  <td>Placement initial</td>
                  {[0, 1].map(i => (
                    <td key={i}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={fmtInt(products[i].initial)}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 9)
                          setProd(i, { initial: toNum(clean, 0) })
                        }}
                        aria-label={`Placement initial produit ${i === 0 ? 'A' : 'B'}`}
                      />
                    </td>
                  ))}
                </tr>

                <tr>
                  <td>Versements programmés</td>
                  {[0, 1].map(i => (
                    <td key={i} className="pl-inline">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={fmtInt(products[i].contribAmount)}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 7)
                          setProd(i, { contribAmount: toNum(clean, 0) })
                        }}
                        aria-label={`Versement programmé produit ${i === 0 ? 'A' : 'B'}`}
                      />
                      <span className="pl-unit">€</span>
                      <select
                        value={products[i].contribFreq}
                        onChange={(e) => setProd(i, { contribFreq: e.target.value })}
                        aria-label={`Fréquence versements produit ${i === 0 ? 'A' : 'B'}`}
                      >
                        <option value="mensuel">mensuel</option>
                        <option value="annuel">annuel</option>
                      </select>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td>Durée</td>
                  {[0, 1].map(i => (
                    <td key={i} className="pl-inline">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(products[i].durationYears)}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                          setProd(i, { durationYears: clamp(toNum(v || '1', 1), 1, 60) })
                        }}
                        aria-label={`Durée produit ${i === 0 ? 'A' : 'B'}`}
                      />
                      <span className="pl-unit">an(s)</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div className="pl-hint">
              Astuce CGP : “Rendement brut” = avant fiscalité. Les frais annuels réduisent l’encours avant calcul de l’impôt simplifié.
            </div>
          </div>

          {/* Withdrawals */}
          <div className="ir-table-wrapper pl-withdraw">
            <div className="pl-block-title">Retraits</div>

            <div className="pl-withdraw-grid">
              <Field label="Mode">
                <select value={withdrawMode} onChange={(e) => setWithdrawMode(e.target.value)}>
                  {WITHDRAW_MODES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </Field>

              <Field label="Année de départ (N)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(withdrawStartYear)}
                  onChange={(e) => setWithdrawStartYear(clamp(toNum(e.target.value, 1), 1, yearsMax))}
                  aria-label="Année de départ du retrait"
                />
              </Field>

              <Field label="Montant annuel (si applicable)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={fmtInt(withdrawAmount)}
                  onChange={(e) => setWithdrawAmount(toNum(e.target.value.replace(/\D/g, ''), 0))}
                  aria-label="Montant du retrait"
                  disabled={withdrawMode === 'none' || withdrawMode === 'deplete'}
                />
              </Field>

              <Field label="Durée (si épuiser)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(withdrawDepleteYears)}
                  onChange={(e) => setWithdrawDepleteYears(clamp(toNum(e.target.value, 10), 1, yearsMax))}
                  aria-label="Durée pour épuiser le capital"
                  disabled={withdrawMode !== 'deplete'}
                />
              </Field>
            </div>

            {withdrawMode === 'deplete' && (
              <div className="pl-hint">
                “Épuiser” calcule un retrait annuel constant (par produit) pour approcher un capital final proche de 0 à la fin de la période.
              </div>
            )}
          </div>

          {/* Results */}
          <div className="pl-block">
            <div className="pl-results-head">
              <div className="pl-block-title">Résultats annuels</div>
              <div className="pl-view">
                <span>Vue</span>
                <select value={view} onChange={(e) => setView(e.target.value)} aria-label="Sélecteur de vue résultats">
                  <option value="capital">Capital</option>
                  <option value="fiscalite">Fiscalité</option>
                  <option value="cashflow">Cashflow</option>
                </select>
              </div>
            </div>

            <div className="ir-table-wrapper">
              <table className="ir-table pl-results-table" role="grid" aria-label="Tableau résultats annuels">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th>{products[0].name}</th>
                    <th>{products[1].name}</th>
                  </tr>
                </thead>
                <tbody>
                  {sim.table.map((row) => (
                    <tr key={row.year}>
                      <td>Année {row.year}</td>
                      <td>{yearRowCells(row, 'A')}</td>
                      <td>{yearRowCells(row, 'B')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="ir-table-wrapper pl-chart">
            <div className="pl-results-head">
              <div className="pl-block-title">Graphique</div>
              <div className="pl-view">
                <span>Métrique</span>
                <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value)} aria-label="Métrique graphique">
                  <option value="capital">Capital net</option>
                  <option value="cashflow">Cashflow cumulé</option>
                </select>
              </div>
            </div>

            <SmoothChart res={chartRes} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="ir-right">
          <div className="ir-summary-card">
            <div className="pl-card-title">Indicateurs clés</div>

            <div className="ir-summary-row">
              <span>Valeur finale A</span>
              <span>{fmtShortEuro(kpi.A.endCapital)}</span>
            </div>
            <div className="ir-summary-row">
              <span>Valeur finale B</span>
              <span>{fmtShortEuro(kpi.B.endCapital)}</span>
            </div>

            <div className="ir-summary-row">
              <span>Gains cumulés (avant impôt) A</span>
              <span>{fmtShortEuro(kpi.A.gainsCum)}</span>
            </div>
            <div className="ir-summary-row">
              <span>Gains cumulés (avant impôt) B</span>
              <span>{fmtShortEuro(kpi.B.gainsCum)}</span>
            </div>

            <div className="ir-summary-row">
              <span>Impôts/PS cumulés A</span>
              <span>{fmtShortEuro(kpi.A.taxCum)}</span>
            </div>
            <div className="ir-summary-row">
              <span>Impôts/PS cumulés B</span>
              <span>{fmtShortEuro(kpi.B.taxCum)}</span>
            </div>

            <div className="ir-summary-row">
              <span>Cashflow net cumulé A</span>
              <span>{fmtShortEuro(kpi.A.cashflowCum)}</span>
            </div>
            <div className="ir-summary-row">
              <span>Cashflow net cumulé B</span>
              <span>{fmtShortEuro(kpi.B.cashflowCum)}</span>
            </div>

            <div className="pl-divider" />

            <div className="ir-summary-row">
              <span>Meilleure valeur finale</span>
              <span>{kpi.bestFinal === 'A' ? products[0].name : products[1].name}</span>
            </div>
            <div className="ir-summary-row">
              <span>Meilleur cashflow</span>
              <span>{kpi.bestCash === 'A' ? products[0].name : products[1].name}</span>
            </div>
          </div>

          <div className="ir-summary-card">
            <div className="pl-card-title">Hypothèses (par défaut)</div>
            <ul className="pl-list">
              <li>Taux et frais constants sur la période.</li>
              <li>Impôt <strong>simplifié</strong> calculé annuellement (comparatif).</li>
              <li>Retraits en fin d’année (après impôt).</li>
              <li>PEA : PFU avant 5 ans, puis PS uniquement.</li>
              <li>PER : impôt final à l’échéance (simplifié).</li>
            </ul>
          </div>

          <div className="ir-summary-card">
            <div className="pl-card-title">Points d’attention (CGP)</div>
            <ul className="pl-list">
              <li>AV : abattements / ancienneté non modélisés.</li>
              <li>CTO/AV : la taxation “au fil de l’eau” est une simplification.</li>
              <li>SCPI : prix de part, vacance, revalorisation non modélisés.</li>
              <li>Fiscalité réelle = dépend des flux (rachats), des dates et du dossier client.</li>
            </ul>
          </div>

          <div className="ir-disclaimer">
            <strong>Disclaimer</strong>
            <p>Simulation indicative et non contractuelle. Elle sert à comparer des ordres de grandeur.</p>
            <p>Les règles fiscales sont volontairement simplifiées et peuvent différer de votre cas réel.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===========================================================
   SmoothChart (SVG) — repris/compacté de l’existant
=========================================================== */
const COLORS = ['#2B5A52', '#C0B5AA', '#7A7A7A', '#444555']

function SmoothChart({ res }) {
  const wrapRef = useRef(null)
  const [wrapW, setWrapW] = useState(900)

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width || 900
      setWrapW(w)
    })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  if (!res?.series?.length) return null

  const filtered = res.series
    .map(s => {
      const vals = (s.values || []).map(v => (v !== undefined && Number.isFinite(v)) ? v : undefined)
      const any = vals.some(v => v !== undefined)
      return any ? { ...s, values: vals } : null
    })
    .filter(Boolean)

  if (!filtered.length) return null

  const PAD = 56
  const LEG_W = 170
  const W = Math.max(600, wrapW - 12)
  const SVG_W = Math.max(420, W - LEG_W)
  const SVG_H = 320

  const years = res.years || []
  const N = years.length

  let maxY = 0
  filtered.forEach(s => s.values.forEach(v => { if (v !== undefined && v > maxY) maxY = v }))
  if (maxY <= 0) maxY = 1

  const step = (maxY <= 12_000) ? 1_000 : Math.ceil(maxY / 120_000) * 10_000
  const topY = Math.ceil(maxY / step) * step

  const x = (i) => PAD + (N > 1 ? i * ((SVG_W - 2 * PAD) / (N - 1)) : 0)
  const y = (v) => SVG_H - PAD - ((v / topY) * (SVG_H - 2 * PAD))

  const ticksY = []
  for (let v = 0; v <= topY; v += step) ticksY.push({ val: v, y: y(v) })

  return (
    <div ref={wrapRef} className="pl-chart-wrap">
      <svg width={SVG_W} height={SVG_H} role="img" aria-label="Évolution des placements">
        <line x1={PAD} y1={SVG_H - PAD} x2={SVG_W - PAD} y2={SVG_H - PAD} stroke="#bbb" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_H - PAD} stroke="#bbb" />

        {ticksY.map((t, i) => (
          <g key={'gy' + i}>
            <line x1={PAD - 5} y1={t.y} x2={SVG_W - PAD} y2={t.y} stroke="#eee" />
            <text x={PAD - 10} y={t.y + 4} fontSize="12" fill="#555" textAnchor="end">
              {fmtShortEuro(t.val)}
            </text>
          </g>
        ))}

        {years.map((yr, i) => (
          <text key={'gx' + i} x={x(i)} y={SVG_H - PAD + 16} fontSize="12" fill="#666" textAnchor="middle">
            {yr}
          </text>
        ))}

        {filtered.map((s, si) => {
          const color = COLORS[si % COLORS.length]
          let d = ''
          s.values.forEach((v, i) => {
            if (v === undefined) return
            d += (d === '' ? 'M' : 'L') + ' ' + x(i) + ' ' + y(v) + ' '
          })
          if (!d) return null
          return (
            <g key={'s' + si}>
              <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
              {s.values.map((v, i) => v !== undefined ? (
                <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={color} />
              ) : null)}
            </g>
          )
        })}
      </svg>

      <div className="pl-legend" aria-label="Légende graphique">
        {filtered.map((s, si) => (
          <div key={'lg' + si} className="pl-legend-item">
            <span className="pl-dot" style={{ background: COLORS[si % COLORS.length] }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
