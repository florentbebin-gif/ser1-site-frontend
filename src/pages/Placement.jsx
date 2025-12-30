/* ===========================================================
   PLACEMENT — Refonte UX + Simulation épargne/liquidation + fiscalité FR (simplifiée)
   - Persistance localStorage: ser1:sim:placement (conservé)
   - Reset uniquement via onResetEvent (conservé)
   - 2 produits / 2 colonnes (comparaison)
   - Phase épargne / Phase liquidation / Synthèse
   - Fiscalité: simplifiée par défaut + flags “plus fidèle” (préparé)
=========================================================== */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { onResetEvent, storageKeyFor } from '../utils/reset.js'
import { toNumber } from '../utils/number.js'
import './Placement.css'

/* ------------------- Helpers format ------------------- */
const clamp = (n, a, b) => Math.min(b, Math.max(a, n))
const round0 = (n) => Math.round(Number(n) || 0)
const toNum = (v) => toNumber(v, 0)

const fmt0 = (n) => round0(n).toLocaleString('fr-FR')
const euro0 = (n) => `${fmt0(n)} €`
const pct2fr = (x) => (Number(x || 0) * 100).toFixed(2).replace('.', ',')
const shortEuro = (v) => {
  const n = Number(v) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M€`
  if (n >= 1_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} k€`
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

/* ------------------- Références fiscales (fallback local) -------------------
   Objectif: utiliser les mêmes ordres de grandeur que tes Settings (N=2025).
   - PFU 30% (12.8 + 17.2) : SettingsImpots.jsx :contentReference[oaicite:9]{index=9}
   - PS Patrimoine 17.2 : SettingsPrelevements.jsx :contentReference[oaicite:10]{index=10}
*/
const TAX_DEFAULTS_2025 = {
  pfuTotal: 0.30,
  pfuIr: 0.128,
  psPatrimoine: 0.172,
  avAfter8Total: 0.247, // 7.5% IR + 17.2% PS (simplifié, sans abattement)
}

/* ------------------- Modèles / constantes UI ------------------- */
const INPUT_H = 32

const ENVELOPES = [
  { key: 'CTO', label: 'CTO' },
  { key: 'AV', label: 'Assurance-vie' },
  { key: 'PEA', label: 'PEA' },
  { key: 'SCPI', label: 'SCPI' },
  { key: 'PER', label: 'PER' },
]

const TYPE_MODES = [
  { key: 'capi', label: 'Capitalisation' },
  { key: 'distri', label: 'Distribution' },
]

const WITHDRAW_STRATS = [
  { key: 'lump', label: 'Retrait unique' },
  { key: 'exhaust', label: 'Retraits sur N années (épuiser le capital)' },
  { key: 'recurrent', label: 'Retrait annuel récurrent' },
]

const VIEW_MODES = [
  { key: 'capital', label: 'Capital' },
  { key: 'tax', label: 'Fiscalité' },
  { key: 'cashflow', label: 'Cashflow' },
]

/* ------------------- Defaults state ------------------- */
const DEFAULT_CLIENT = {
  currentYear: 2025,
  birthYear: 1980,
  ageRetirement: 64,
  ageWithdrawStart: 64,
  ageDeath: 90,
  tmiCurrent: 0.30,
  tmiRetirement: 0.11,
  taxMode: 'pfu', // 'pfu' | 'bareme' (pour CTO surtout)
  psRate: TAX_DEFAULTS_2025.psPatrimoine,
  pfuTotal: TAX_DEFAULTS_2025.pfuTotal,
  avAfter8Total: TAX_DEFAULTS_2025.avAfter8Total,
  fidelityMode: 'simple', // 'simple' | 'faithful' (préparé)
}

const defaultProduct = (n) => ({
  name: `Produit ${n}`,
  envelope: 'AV',
  typeMode: 'capi', // capi | distri
  // Rendement(s) annuels (net de frais de gestion, avant impôts/PS)
  rate: 0.03,         // pour capi : croissance
  revaloRate: 0.02,   // pour distri : revalorisation capital
  distRate: 0.04,     // pour distri : distribution annuelle
  entryFeePct: 0.00,
  annualFeePct: 0.00, // CTO/PEA (simplifié)
  initial: 10_000,
  contribAmount: 10_000,
  contribFreq: 'annuel', // mensuel|annuel
  contribEndAge: 64,
  // PER
  perDeductible: true,
})

const DEFAULT_STATE = {
  step: 'epargne', // epargne | liquidation | synthese
  startMonth: 1,
  client: DEFAULT_CLIENT,
  products: [defaultProduct(1), defaultProduct(2)],
  // retraits ponctuels pendant épargne
  savingWithdrawals: [
    // { age: 55, amount: 5000 }
  ],
  // liquidation
  liquidation: {
    strat: 'exhaust',
    startAge: 64,
    lumpAmount: 50_000,
    exhaustYears: 25,
    recurrentAmount: 12_000,
  },
  // UI
  tableView: 'capital',
  chartMetric: 'capital', // capital | cashflow
}

/* ------------------- Inputs FR robustes ------------------- */
function InputWithUnit({ value, onChange, onBlur, unit, inputMode='numeric', ariaLabel, disabled=false }) {
  return (
    <div className="pl-input">
      <input
        className="pl-input__field"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        inputMode={inputMode}
        aria-label={ariaLabel}
        disabled={disabled}
      />
      {unit ? <span className="pl-input__unit">{unit}</span> : null}
    </div>
  )
}

function Select({ value, onChange, children, ariaLabel }) {
  return (
    <select className="pl-select" value={value} onChange={onChange} aria-label={ariaLabel}>
      {children}
    </select>
  )
}

/* ------------------- Règles “produit autorise retraits en épargne” ------------------- */
function canWithdrawInSaving(envelope) {
  // Simplifié : PER = non (blocage), SCPI = oui mais disclaimer (liquidité), autres = oui
  if (envelope === 'PER') return { ok: false, reason: "Retraits en phase d’épargne non prévus sur PER (hors cas légaux)." }
  if (envelope === 'SCPI') return { ok: true, reason: "SCPI : liquidité non garantie (retrait théorique, dépend du marché)." }
  return { ok: true, reason: '' }
}

/* ------------------- Moteur fiscal (simplifié) ------------------- */
function taxOnDistribution({ envelope, taxMode, tmi, pfuTotal, psRate }, amount) {
  const a = Math.max(0, Number(amount) || 0)
  if (a <= 0) return 0

  if (envelope === 'SCPI') {
    // Simplifié : revenus fonciers au barème + PS patrimoine
    return a * (tmi + psRate)
  }

  if (envelope === 'CTO') {
    // Distribution: PFU ou barème (simplifié)
    const rate = (taxMode === 'bareme') ? tmi : pfuTotal
    return a * rate
  }

  // AV/PEA/PER : distribution “comme un cashflow” (rare) -> PFU par défaut
  return a * pfuTotal
}

function taxOnWithdrawalGains({ envelope, yearsSinceOpen, tmi, tmiRet, pfuTotal, psRate, avAfter8Total, peaAgeGateYears=5 }, gainsPart, extra = {}) {
  const g = Math.max(0, Number(gainsPart) || 0)
  if (g <= 0) return 0

  if (envelope === 'PEA') {
    // <5 ans : PFU sur gains, >=5 : PS sur gains (IR = 0)
    return (yearsSinceOpen < peaAgeGateYears) ? g * pfuTotal : g * psRate
  }

  if (envelope === 'AV') {
    // Simplifié : <8 ans PFU, >=8 ans “AV after 8” (7.5 + PS) sans abattements
    return (yearsSinceOpen < 8) ? g * pfuTotal : g * avAfter8Total
  }

  if (envelope === 'PER') {
    // Gains: PFU (simplifié)
    return g * pfuTotal
  }

  // CTO / SCPI : retrait = vente -> PFU sur gains (simplifié)
  return g * pfuTotal
}

function taxOnPerWithdrawalPrincipal({ tmiRetirement }, principalDeductiblePart) {
  const p = Math.max(0, Number(principalDeductiblePart) || 0)
  if (p <= 0) return 0
  return p * (Number(tmiRetirement) || 0)
}

/* ------------------- Simulation annuelle -------------------
   On simule année par année :
   - capital début
   - versements (nets frais entrée)
   - performance (capi) OU distribution (distri)
   - frais annuels
   - retraits (épargne + liquidation)
   - fiscalité (sur distributions + sur retraits)
*/
function simulatePlan({ startMonth, client, products, savingWithdrawals, liquidation, chartMetric }) {
  const c = client
  const ageNow = clamp((c.currentYear - c.birthYear), 0, 120)
  const ageStart = ageNow
  const ageW = clamp(c.ageWithdrawStart, ageStart, 120)
  const ageD = clamp(c.ageDeath, ageW, 120)

  const horizonYears = Math.max(1, ageD - ageStart + 1)
  const monthsFirstYear = (13 - clamp(startMonth, 1, 12)) // prorata année 1
  const prorataFirstYear = monthsFirstYear / 12

  // Chaque produit: on track le capital + “coût d’acquisition” (pour calcul gains lors des retraits)
  const initTrack = (p) => ({
    capital: Math.max(0, Number(p.initial) || 0) * (1 - (Number(p.entryFeePct) || 0)),
    cost: Math.max(0, Number(p.initial) || 0) * (1 - (Number(p.entryFeePct) || 0)), // simplifié
    yearsOpen: 0,
    // pour PER : suivre versements “déductibles” cumulés (simplifié)
    perDeductiblePrincipal: p.envelope === 'PER' && p.perDeductible ? (Math.max(0, Number(p.initial) || 0) * (1 - (Number(p.entryFeePct) || 0))) : 0,
    // cumuls
    cumTax: 0,
    cumPs: 0, // (ici on ne sépare pas finement, mais on garde l’axe “tax total”)
    cumCashflowNet: 0,
    cumPerTaxSaving: 0,
  })

  const tracks = products.map(initTrack)

  const rows = []
  for (let i = 0; i < horizonYears; i += 1) {
    const age = ageStart + i
    const inSaving = age < ageW
    const yearFactor = (i === 0) ? prorataFirstYear : 1

    const yearRow = {
      yearIndex: i + 1,
      age,
      inSaving,
      // par produit:
      byProd: products.map(() => ({
        capitalEnd: 0,
        gainYear: 0,
        taxYear: 0,
        cashflowNet: 0,
      })),
    }

    // retaits ponctuels pendant épargne (au même âge)
    const savingWds = inSaving
      ? (savingWithdrawals || []).filter(w => Number(w.age) === age)
      : []

    // liquidation: déterminer retrait annuel cible (simplifié)
    let liquidWd = 0
    if (!inSaving) {
      if (liquidation?.strat === 'lump' && age === Number(liquidation.startAge)) {
        liquidWd = Math.max(0, Number(liquidation.lumpAmount) || 0)
      } else if (liquidation?.strat === 'recurrent' && age >= Number(liquidation.startAge)) {
        liquidWd = Math.max(0, Number(liquidation.recurrentAmount) || 0)
      }
      // exhaust: calculé par produit (dépend capital)
    }

    for (let pi = 0; pi < products.length; pi += 1) {
      const p = products[pi]
      const t = tracks[pi]
      const r = Number(p.rate) || 0
      const revalo = Number(p.revaloRate) || 0
      const dist = Number(p.distRate) || 0
      const entryFee = Number(p.entryFeePct) || 0
      const annualFee = Number(p.annualFeePct) || 0

      // Année d’ouverture (pour PEA/AV)
      t.yearsOpen += 1

      // 1) Versements programmés (si en phase épargne et jusqu’à contribEndAge)
      let contribNet = 0
      if (inSaving && age <= Number(p.contribEndAge)) {
        const amt = Math.max(0, Number(p.contribAmount) || 0)
        if (amt > 0) {
          if (p.contribFreq === 'mensuel') {
            // année 1 proratisée
            const months = (i === 0) ? monthsFirstYear : 12
            const total = (amt * months)
            contribNet = total * (1 - entryFee)
          } else {
            contribNet = amt * (1 - entryFee) * yearFactor
          }
        }
      }

      t.capital += contribNet
      t.cost += contribNet

      // PER : économie IR en phase épargne si déductible
      if (p.envelope === 'PER' && p.perDeductible && inSaving) {
        const taxSave = (contribNet) * (Number(c.tmiCurrent) || 0)
        t.cumPerTaxSaving += taxSave
        t.perDeductiblePrincipal += contribNet
      }

      // 2) Performance / distribution
      let cashflowBrut = 0
      let perfGain = 0

      if (p.typeMode === 'distri') {
        cashflowBrut = t.capital * dist * yearFactor
        // revalo capital
        const before = t.capital
        t.capital = t.capital * (1 + revalo * yearFactor)
        perfGain = (t.capital - before)
      } else {
        const before = t.capital
        t.capital = t.capital * (1 + r * yearFactor)
        perfGain = (t.capital - before)
      }

      // 3) Frais annuels (simplifié : % du capital fin d’année)
      const feeYear = t.capital * annualFee * yearFactor
      if (feeYear > 0) {
        t.capital = Math.max(0, t.capital - feeYear)
        // frais = “coût” additionnel (on ne l’ajoute pas au cost d’acquisition)
      }

      // 4) Fiscalité sur distribution (si distribution)
      let taxOnDist = 0
      if (cashflowBrut > 0) {
        taxOnDist = taxOnDistribution(
          { envelope: p.envelope, taxMode: c.taxMode, tmi: c.tmiCurrent, pfuTotal: c.pfuTotal, psRate: c.psRate },
          cashflowBrut
        )
      }
      const cashflowNet = Math.max(0, cashflowBrut - taxOnDist)
      t.cumCashflowNet += cashflowNet

      // 5) Retraits (épargne ponctuels + liquidation)
      let wd = 0

      // Épargne : appliquer retraits ponctuels (répartis sur les produits proportionnellement au capital, simplifié)
      if (savingWds.length) {
        const req = savingWds.reduce((s, w) => s + Math.max(0, Number(w.amount) || 0), 0)
        // on tente de retirer “req / nbProduits” par produit (simplifié et lisible)
        wd += req / products.length
      }

      // Liquidation
      if (!inSaving) {
        if (liquidation?.strat === 'exhaust' && age >= Number(liquidation.startAge)) {
          const yearsLeft = Math.max(1, (ageD - age + 1))
          const target = t.capital / yearsLeft
          wd += target
        } else {
          wd += liquidWd / products.length
        }
      }

      wd = Math.min(wd, t.capital)
      // Calcul quote-part gains sur retrait (simplifié : gains proportionnels)
      const capitalBeforeWd = t.capital
      t.capital = Math.max(0, t.capital - wd)

      const totalValueBefore = Math.max(1e-9, capitalBeforeWd)
      const totalCostBefore = Math.max(0, t.cost)
      const latentGains = Math.max(0, totalValueBefore - totalCostBefore)

      const gainsPart = (latentGains > 0)
        ? Math.min(latentGains, wd * (latentGains / totalValueBefore))
        : 0

      const principalPart = Math.max(0, wd - gainsPart)

      // mise à jour cost (on “vend” proportionnellement)
      const costReduction = (totalValueBefore > 0) ? (totalCostBefore * (wd / totalValueBefore)) : 0
      t.cost = Math.max(0, t.cost - costReduction)

      // Fiscalité sur retrait
      let taxWd = 0
      // PER : fiscalité spécifique sur principal “déductible”
      if (p.envelope === 'PER') {
        // part principal déductible consommée (simplifié)
        const dedPart = Math.min(t.perDeductiblePrincipal, principalPart)
        if (dedPart > 0) {
          taxWd += taxOnPerWithdrawalPrincipal({ tmiRetirement: c.tmiRetirement }, dedPart)
          t.perDeductiblePrincipal = Math.max(0, t.perDeductiblePrincipal - dedPart)
        }
        taxWd += taxOnWithdrawalGains(
          { envelope: 'PER', yearsSinceOpen: t.yearsOpen, tmi: c.tmiCurrent, tmiRet: c.tmiRetirement, pfuTotal: c.pfuTotal, psRate: c.psRate, avAfter8Total: c.avAfter8Total },
          gainsPart
        )
      } else {
        taxWd += taxOnWithdrawalGains(
          { envelope: p.envelope, yearsSinceOpen: t.yearsOpen, tmi: c.tmiCurrent, tmiRet: c.tmiRetirement, pfuTotal: c.pfuTotal, psRate: c.psRate, avAfter8Total: c.avAfter8Total },
          gainsPart
        )
      }

      t.cumTax += (taxOnDist + taxWd)

      // gain annuel (économique) = perfGain - frais (déjà soustraits) ; ici on remonte perfGain “avant frais annuels”
      yearRow.byProd[pi] = {
        capitalEnd: t.capital,
        gainYear: perfGain,
        taxYear: (taxOnDist + taxWd),
        cashflowNet: cashflowNet,
      }
    }

    rows.push(yearRow)
  }

  // Synthèse par produit
  const summaries = products.map((p, i) => {
    const t = tracks[i]
    const finalCap = rows.length ? rows[rows.length - 1].byProd[i].capitalEnd : 0
    const totalTax = t.cumTax
    const totalCashflow = t.cumCashflowNet
    const perSave = t.cumPerTaxSaving
    return {
      name: p.name,
      envelope: p.envelope,
      finalCap,
      totalTax,
      totalCashflow,
      perSave,
    }
  })

  // dataset pour graph
  const years = rows.map(r => r.yearIndex)
  const seriesCapital = products.map((p, i) => ({
    name: p.name,
    values: rows.map(r => r.byProd[i].capitalEnd),
  }))
  const seriesCashflow = products.map((p, i) => ({
    name: `${p.name} (cashflow)`,
    values: rows.map(r => r.byProd[i].cashflowNet),
  }))

  return {
    ageNow,
    ageStart,
    ageWithdrawStart: ageW,
    ageDeath: ageD,
    rows,
    summaries,
    chart: {
      years,
      series: (chartMetric === 'cashflow') ? seriesCashflow : seriesCapital,
    }
  }
}

/* ===========================================================
   MAIN
=========================================================== */
export default function Placement() {
  const STORE_KEY = storageKeyFor('placement')

  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState(DEFAULT_STATE)

  // Champs “raw” pour % (2 produits) : éviter NaN + garder virgule
  const [rawRate, setRawRate] = useState(['3,00', '3,00'])
  const [rawEntryFee, setRawEntryFee] = useState(['0,00', '0,00'])
  const [rawAnnualFee, setRawAnnualFee] = useState(['0,00', '0,00'])
  const [rawRevalo, setRawRevalo] = useState(['2,00', '2,00'])
  const [rawDist, setRawDist] = useState(['4,00', '4,00'])

  // Hydrate localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (s && typeof s === 'object') {
  const next = { ...DEFAULT_STATE, ...s }

  // Force exactement 2 placements (évite les vieux states à 4 colonnes)
  const p0 = (next.products && next.products[0]) ? next.products[0] : DEFAULT_STATE.products[0]
  const p1 = (next.products && next.products[1]) ? next.products[1] : DEFAULT_STATE.products[1]
  next.products = [p0, p1]

  setState(next)
}
      }
    } catch {}
    setHydrated(true)
  }, [STORE_KEY])

  // Persist
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state))
    } catch {}
  }, [hydrated, state, STORE_KEY])

  // Reset (conservé)
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      if (simId && simId !== 'placement') return
      setState(DEFAULT_STATE)
      try { localStorage.removeItem(STORE_KEY) } catch {}
    })
    return off || (() => {})
  }, [STORE_KEY])

  // Sync raw % quand state change
  useEffect(() => {
    const p0 = state.products[0]
    const p1 = state.products[1]
    setRawRate([pct2fr(p0.rate), pct2fr(p1.rate)])
    setRawEntryFee([pct2fr(p0.entryFeePct), pct2fr(p1.entryFeePct)])
    setRawAnnualFee([pct2fr(p0.annualFeePct), pct2fr(p1.annualFeePct)])
    setRawRevalo([pct2fr(p0.revaloRate), pct2fr(p1.revaloRate)])
    setRawDist([pct2fr(p0.distRate), pct2fr(p1.distRate)])
  }, [state.products])

  const setClient = (patch) => setState(s => ({ ...s, client: { ...s.client, ...patch } }))
  const setProd = (i, patch) => setState(s => ({ ...s, products: s.products.map((p, k) => (k === i ? { ...p, ...patch } : p)) }))
  const setStep = (step) => setState(s => ({ ...s, step }))
  const setStartMonth = (startMonth) => setState(s => ({ ...s, startMonth }))
  const setSavingWithdrawals = (savingWithdrawals) => setState(s => ({ ...s, savingWithdrawals }))
  const setLiquidation = (patch) => setState(s => ({ ...s, liquidation: { ...s.liquidation, ...patch } }))
  const setTableView = (tableView) => setState(s => ({ ...s, tableView }))
  const setChartMetric = (chartMetric) => setState(s => ({ ...s, chartMetric }))

  const sim = useMemo(() => {
    return simulatePlan({
      startMonth: state.startMonth,
      client: state.client,
      products: state.products,
      savingWithdrawals: state.savingWithdrawals,
      liquidation: state.liquidation,
      chartMetric: state.chartMetric,
    })
  }, [state.startMonth, state.client, state.products, state.savingWithdrawals, state.liquidation, state.chartMetric])

  const bestFinal = useMemo(() => {
    const a = sim.summaries[0]
    const b = sim.summaries[1]
    return (a.finalCap >= b.finalCap) ? a : b
  }, [sim.summaries])

  const bestCashflow = useMemo(() => {
    const a = sim.summaries[0]
    const b = sim.summaries[1]
    return (a.totalCashflow >= b.totalCashflow) ? a : b
  }, [sim.summaries])

  // Autorisation retraits épargne (si un seul produit interdit, on bloque l’UI du bouton)
  const savingWdAllowed = useMemo(() => {
    const a = canWithdrawInSaving(state.products[0].envelope)
    const b = canWithdrawInSaving(state.products[1].envelope)
    return { a, b, ok: a.ok && b.ok }
  }, [state.products])

  return (
    <div className="ir-panel placement-page">
      <div className="ir-header pl-header">
        <div>
          <div className="ir-title">Comparer deux placements</div>
          <div className="pl-subtitle">
            Phase épargne → phase liquidation → synthèse (fiscalité FR simplifiée).
          </div>
        </div>

        <div className="pl-stepper" role="navigation" aria-label="Navigation phases">
          <button
            className={`pl-step ${state.step === 'epargne' ? 'is-active' : ''}`}
            onClick={() => setStep('epargne')}
          >
            Phase épargne
          </button>
          <button
            className={`pl-step ${state.step === 'liquidation' ? 'is-active' : ''}`}
            onClick={() => setStep('liquidation')}
          >
            Phase liquidation
          </button>
          <button
            className={`pl-step ${state.step === 'synthese' ? 'is-active' : ''}`}
            onClick={() => setStep('synthese')}
          >
            Synthèse
          </button>
        </div>
      </div>

      <div className="ir-grid">
        {/* LEFT */}
        <div className="ir-left">
          {/* Bandeau paramètres client */}
          <div className="ir-table-wrapper">
            <div className="pl-topgrid">
              <div className="ir-field">
                <label>Année de naissance</label>
                <input
                  type="text"
                  value={String(state.client.birthYear)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setClient({ birthYear: v === '' ? 1980 : Number(v) })
                  }}
                />
              </div>

              <div className="ir-field">
                <label>Âge retraite</label>
                <input
                  type="text"
                  value={String(state.client.ageRetirement)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setClient({ ageRetirement: v === '' ? 64 : Number(v) })
                  }}
                />
              </div>

              <div className="ir-field">
                <label>Âge début retraits</label>
                <input
                  type="text"
                  value={String(state.client.ageWithdrawStart)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setClient({ ageWithdrawStart: v === '' ? 64 : Number(v) })
                  }}
                />
              </div>

              <div className="ir-field">
                <label>Âge décès (simulation)</label>
                <input
                  type="text"
                  value={String(state.client.ageDeath)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setClient({ ageDeath: v === '' ? 90 : Number(v) })
                  }}
                />
              </div>

              <div className="ir-field">
                <label>TMI actuel</label>
                <InputWithUnit
                  value={pct2fr(state.client.tmiCurrent)}
                  onChange={(e) => {
                    const raw = e.target.value
                    const v = clamp(toNum(raw) / 100, 0, 0.60)
                    setClient({ tmiCurrent: v })
                  }}
                  inputMode="decimal"
                  unit="%"
                  ariaLabel="TMI actuel"
                />
              </div>

              <div className="ir-field">
                <label>TMI retraite</label>
                <InputWithUnit
                  value={pct2fr(state.client.tmiRetirement)}
                  onChange={(e) => {
                    const raw = e.target.value
                    const v = clamp(toNum(raw) / 100, 0, 0.60)
                    setClient({ tmiRetirement: v })
                  }}
                  inputMode="decimal"
                  unit="%"
                  ariaLabel="TMI retraite"
                />
              </div>

              <div className="ir-field">
                <label>Mode fiscal (CTO)</label>
                <Select
                  value={state.client.taxMode}
                  onChange={(e) => setClient({ taxMode: e.target.value })}
                  ariaLabel="Mode fiscal CTO"
                >
                  <option value="pfu">PFU (par défaut)</option>
                  <option value="bareme">Barème (TMI)</option>
                </Select>
              </div>

              <div className="ir-field">
                <label>Mois de démarrage</label>
                <Select
                  value={state.startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                  ariaLabel="Mois de démarrage"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </Select>
                <div className="pl-hint">(intérêts de la 1ère année proratisés)</div>
              </div>
            </div>
          </div>

          {/* Phase épargne */}
          {state.step === 'epargne' && (
            <div className="ir-table-wrapper">
              <div className="pl-section-title">Paramètres en phase d’épargne</div>

              <table className="ir-table pl-table" role="grid" aria-label="Tableau phase épargne">
                <thead>
                  <tr>
                    <th></th>
                    {state.products.map((p, i) => (
                      <th key={i} className="pl-colhead">
                        <div className="pl-colname">{`Placement ${i + 1}`}</div>
                        <div className="pl-collabel">{ENVELOPES.find(x => x.key === p.envelope)?.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr className="ir-row-title">
                    <td colSpan={3}>Produit</td>
                  </tr>

                  <tr>
                    <td>Enveloppe</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <Select value={p.envelope} onChange={(e) => setProd(i, { envelope: e.target.value })} ariaLabel={`Enveloppe ${i + 1}`}>
                          {ENVELOPES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </Select>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Type</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <Select value={p.typeMode} onChange={(e) => setProd(i, { typeMode: e.target.value })} ariaLabel={`Type ${i + 1}`}>
                          {TYPE_MODES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </Select>
                      </td>
                    ))}
                  </tr>

                  <tr className="ir-row-title">
                    <td colSpan={3}>Rendement & frais</td>
                  </tr>

                  <tr>
                    <td>Rendement annuel (avant impôts/PS)</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputWithUnit
                          value={rawRate[i]}
                          onChange={(e) => setRawRate(a => a.map((x, k) => (k === i ? e.target.value : x)))}
                          onBlur={(e) => {
                            const v = clamp(toNum(e.target.value) / 100, -0.20, 0.30)
                            setProd(i, { rate: v })
                            setRawRate(a => a.map((x, k) => (k === i ? pct2fr(v) : x)))
                          }}
                          inputMode="decimal"
                          unit="%"
                          ariaLabel={`Rendement produit ${i + 1}`}
                        />
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Taux de distribution (si distribution)</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputWithUnit
                          value={rawDist[i]}
                          onChange={(e) => setRawDist(a => a.map((x, k) => (k === i ? e.target.value : x)))}
                          onBlur={(e) => {
                            const v = clamp(toNum(e.target.value) / 100, 0, 0.20)
                            setProd(i, { distRate: v })
                            setRawDist(a => a.map((x, k) => (k === i ? pct2fr(v) : x)))
                          }}
                          inputMode="decimal"
                          unit="%"
                          ariaLabel={`Distribution produit ${i + 1}`}
                          disabled={state.products[i].typeMode !== 'distri'}
                        />
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Revalorisation du capital (si distribution)</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputWithUnit
                          value={rawRevalo[i]}
                          onChange={(e) => setRawRevalo(a => a.map((x, k) => (k === i ? e.target.value : x)))}
                          onBlur={(e) => {
                            const v = clamp(toNum(e.target.value) / 100, -0.10, 0.20)
                            setProd(i, { revaloRate: v })
                            setRawRevalo(a => a.map((x, k) => (k === i ? pct2fr(v) : x)))
                          }}
                          inputMode="decimal"
                          unit="%"
                          ariaLabel={`Revalorisation produit ${i + 1}`}
                          disabled={state.products[i].typeMode !== 'distri'}
                        />
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Frais d’entrée</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputWithUnit
                          value={rawEntryFee[i]}
                          onChange={(e) => setRawEntryFee(a => a.map((x, k) => (k === i ? e.target.value : x)))}
                          onBlur={(e) => {
                            const v = clamp(toNum(e.target.value) / 100, 0, 0.10)
                            setProd(i, { entryFeePct: v })
                            setRawEntryFee(a => a.map((x, k) => (k === i ? pct2fr(v) : x)))
                          }}
                          inputMode="decimal"
                          unit="%"
                          ariaLabel={`Frais entrée produit ${i + 1}`}
                        />
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Frais annuels (CTO/PEA)</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputWithUnit
                          value={rawAnnualFee[i]}
                          onChange={(e) => setRawAnnualFee(a => a.map((x, k) => (k === i ? e.target.value : x)))}
                          onBlur={(e) => {
                            const v = clamp(toNum(e.target.value) / 100, 0, 0.05)
                            setProd(i, { annualFeePct: v })
                            setRawAnnualFee(a => a.map((x, k) => (k === i ? pct2fr(v) : x)))
                          }}
                          inputMode="decimal"
                          unit="%"
                          ariaLabel={`Frais annuels produit ${i + 1}`}
                          disabled={!(state.products[i].envelope === 'CTO' || state.products[i].envelope === 'PEA')}
                        />
                      </td>
                    ))}
                  </tr>

                  <tr className="ir-row-title">
                    <td colSpan={3}>Investissement</td>
                  </tr>

                  <tr>
                    <td>Versement initial</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputWithUnit
                          value={fmt0(p.initial)}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').slice(0, 9)
                            setProd(i, { initial: clean === '' ? 0 : Number(clean) })
                          }}
                          unit="€"
                          ariaLabel={`Versement initial ${i + 1}`}
                        />
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Versements programmés</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <div className="pl-inline">
                          <InputWithUnit
                            value={fmt0(p.contribAmount)}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').slice(0, 9)
                              setProd(i, { contribAmount: clean === '' ? 0 : Number(clean) })
                            }}
                            unit="€"
                            ariaLabel={`Versement programmé ${i + 1}`}
                          />
                          <Select
                            value={p.contribFreq}
                            onChange={(e) => setProd(i, { contribFreq: e.target.value })}
                            ariaLabel={`Fréquence versement ${i + 1}`}
                          >
                            <option value="mensuel">mensuel</option>
                            <option value="annuel">annuel</option>
                          </Select>
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Fin des versements (âge)</td>
                    {state.products.map((p, i) => (
                      <td key={i}>
                        <InputWithUnit
                          value={String(p.contribEndAge)}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                            setProd(i, { contribEndAge: v === '' ? state.client.ageWithdrawStart : Number(v) })
                          }}
                          unit="ans"
                          ariaLabel={`Fin versements âge ${i + 1}`}
                        />
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>PER : versements déductibles</td>
                    {state.products.map((p, i) => (
                      <td key={i} style={{ textAlign: 'center' }}>
                        {p.envelope === 'PER' ? (
                          <label className="pl-check">
                            <input
                              type="checkbox"
                              checked={!!p.perDeductible}
                              onChange={(e) => setProd(i, { perDeductible: e.target.checked })}
                              aria-label={`PER déductible produit ${i + 1}`}
                            />
                            <span>Oui</span>
                          </label>
                        ) : (
                          <span className="pl-muted">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <div className="pl-subblock">
                <div className="pl-subblock__head">
                  <div>
                    <strong>Retraits ponctuels en phase d’épargne</strong>
                    <div className="pl-hint">
                      {(!savingWdAllowed.ok)
                        ? "Désactivé : au moins une enveloppe ne permet pas les retraits en épargne."
                        : (savingWdAllowed.a.reason || savingWdAllowed.b.reason || "Ajoute des retraits (âge / montant).")}
                    </div>
                  </div>

                  <button
                    className="pl-btn"
                    onClick={() => {
                      if (!savingWdAllowed.ok) return
                      setSavingWithdrawals([...(state.savingWithdrawals || []), { age: state.client.ageWithdrawStart - 5, amount: 5000 }])
                    }}
                    disabled={!savingWdAllowed.ok}
                  >
                    + Ajouter
                  </button>
                </div>

                {(state.savingWithdrawals || []).length ? (
                  <div className="pl-wdlist" role="table" aria-label="Retraits ponctuels épargne">
                    <div className="pl-wdlist__row pl-wdlist__head">
                      <div>Âge</div>
                      <div>Montant</div>
                      <div></div>
                    </div>
                    {state.savingWithdrawals.map((w, idx) => (
                      <div key={idx} className="pl-wdlist__row">
                        <InputWithUnit
                          value={String(w.age)}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                            const next = state.savingWithdrawals.map((x, k) => k === idx ? { ...x, age: v === '' ? state.client.ageWithdrawStart : Number(v) } : x)
                            setSavingWithdrawals(next)
                          }}
                          unit="ans"
                          ariaLabel={`Âge retrait ${idx + 1}`}
                        />
                        <InputWithUnit
                          value={fmt0(w.amount)}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').slice(0, 9)
                            const next = state.savingWithdrawals.map((x, k) => k === idx ? { ...x, amount: clean === '' ? 0 : Number(clean) } : x)
                            setSavingWithdrawals(next)
                          }}
                          unit="€"
                          ariaLabel={`Montant retrait ${idx + 1}`}
                        />
                        <button
                          className="pl-btn pl-btn--ghost"
                          onClick={() => setSavingWithdrawals(state.savingWithdrawals.filter((_, k) => k !== idx))}
                          aria-label={`Supprimer retrait ${idx + 1}`}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pl-muted">Aucun retrait ponctuel saisi.</div>
                )}
              </div>

              <div className="ir-disclaimer pl-disclaimer">
                <strong>Hypothèses (phase épargne)</strong>
                Rendements constants, pas de volatilité. Les versements sont nets de frais d’entrée.
                Fiscalité simplifiée et indicative.
              </div>
            </div>
          )}

          {/* Phase liquidation */}
          {state.step === 'liquidation' && (
            <div className="ir-table-wrapper">
              <div className="pl-section-title">Paramètres en phase de liquidation</div>

              <div className="pl-liquid">
                <div className="ir-field">
                  <label>Stratégie de retraits</label>
                  <Select value={state.liquidation.strat} onChange={(e) => setLiquidation({ strat: e.target.value })} ariaLabel="Stratégie de retraits">
                    {WITHDRAW_STRATS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </Select>
                </div>

                <div className="ir-field">
                  <label>Âge du 1er retrait</label>
                  <input
                    type="text"
                    value={String(state.liquidation.startAge)}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                      setLiquidation({ startAge: v === '' ? state.client.ageWithdrawStart : Number(v) })
                    }}
                  />
                </div>

                {state.liquidation.strat === 'lump' && (
                  <div className="ir-field">
                    <label>Montant du retrait unique</label>
                    <InputWithUnit
                      value={fmt0(state.liquidation.lumpAmount)}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 9)
                        setLiquidation({ lumpAmount: clean === '' ? 0 : Number(clean) })
                      }}
                      unit="€"
                      ariaLabel="Montant retrait unique"
                    />
                  </div>
                )}

                {state.liquidation.strat === 'exhaust' && (
                  <div className="ir-field">
                    <label>Durée (années) pour épuiser</label>
                    <InputWithUnit
                      value={String(state.liquidation.exhaustYears)}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                        setLiquidation({ exhaustYears: v === '' ? 25 : Number(v) })
                      }}
                      unit="ans"
                      ariaLabel="Durée épuisement"
                    />
                    <div className="pl-hint">Le montant annuel est recalculé automatiquement (capital / années restantes).</div>
                  </div>
                )}

                {state.liquidation.strat === 'recurrent' && (
                  <div className="ir-field">
                    <label>Retrait annuel récurrent</label>
                    <InputWithUnit
                      value={fmt0(state.liquidation.recurrentAmount)}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 9)
                        setLiquidation({ recurrentAmount: clean === '' ? 0 : Number(clean) })
                      }}
                      unit="€"
                      ariaLabel="Retrait annuel récurrent"
                    />
                  </div>
                )}
              </div>

              <div className="ir-disclaimer pl-disclaimer">
                <strong>Hypothèses (phase liquidation)</strong>
                Retraits imposés sur la quote-part de gains (simplifié). PER : principal déductible taxé au TMI retraite, gains au PFU.
              </div>
            </div>
          )}

          {/* Synthèse */}
          {state.step === 'synthese' && (
            <>
              <div className="ir-table-wrapper">
                <div className="pl-section-title">Résultats</div>

                <div className="pl-results-toolbar">
                  <div className="pl-tabs" role="tablist" aria-label="Vue tableau">
                    {VIEW_MODES.map(v => (
                      <button
                        key={v.key}
                        className={`pl-tab ${state.tableView === v.key ? 'is-active' : ''}`}
                        onClick={() => setTableView(v.key)}
                        role="tab"
                        aria-selected={state.tableView === v.key}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>

                  <div className="pl-tabs" role="tablist" aria-label="Métrique graphique">
                    <button
                      className={`pl-tab ${state.chartMetric === 'capital' ? 'is-active' : ''}`}
                      onClick={() => setChartMetric('capital')}
                      role="tab"
                      aria-selected={state.chartMetric === 'capital'}
                    >
                      Courbe : capital net
                    </button>
                    <button
                      className={`pl-tab ${state.chartMetric === 'cashflow' ? 'is-active' : ''}`}
                      onClick={() => setChartMetric('cashflow')}
                      role="tab"
                      aria-selected={state.chartMetric === 'cashflow'}
                    >
                      Courbe : cashflow net
                    </button>
                  </div>
                </div>

                <div className="pl-chart-card">
                  <SmoothChart res={sim.chart} />
                </div>

                <div className="pl-table-wrapper">
                  <table className="ir-table pl-details-table" role="grid" aria-label="Tableau année par année">
                    <thead>
                      <tr>
                        <th>Âge</th>
                        <th>{state.products[0].name}</th>
                        <th>{state.products[1].name}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sim.rows.map((r, idx) => {
                        const a = r.byProd[0]
                        const b = r.byProd[1]
                        const isPhase = r.inSaving ? 'Épargne' : 'Liquidation'
                        return (
                          <tr key={idx}>
                            <td>
                              <div className="pl-agecell">
                                <div><strong>{r.age} ans</strong></div>
                                <div className="pl-muted">{isPhase}</div>
                              </div>
                            </td>

                            <td>
                              {state.tableView === 'capital' && (
                                <div className="pl-cellstack">
                                  <div className="pl-big">{euro0(a.capitalEnd)}</div>
                                  <div className="pl-muted">Gains année : {euro0(a.gainYear)}</div>
                                </div>
                              )}
                              {state.tableView === 'tax' && (
                                <div className="pl-cellstack">
                                  <div className="pl-big">{euro0(a.taxYear)}</div>
                                  <div className="pl-muted">Impôts/PS estimés (année)</div>
                                </div>
                              )}
                              {state.tableView === 'cashflow' && (
                                <div className="pl-cellstack">
                                  <div className="pl-big">{euro0(a.cashflowNet)}</div>
                                  <div className="pl-muted">Cashflow net (année)</div>
                                </div>
                              )}
                            </td>

                            <td>
                              {state.tableView === 'capital' && (
                                <div className="pl-cellstack">
                                  <div className="pl-big">{euro0(b.capitalEnd)}</div>
                                  <div className="pl-muted">Gains année : {euro0(b.gainYear)}</div>
                                </div>
                              )}
                              {state.tableView === 'tax' && (
                                <div className="pl-cellstack">
                                  <div className="pl-big">{euro0(b.taxYear)}</div>
                                  <div className="pl-muted">Impôts/PS estimés (année)</div>
                                </div>
                              )}
                              {state.tableView === 'cashflow' && (
                                <div className="pl-cellstack">
                                  <div className="pl-big">{euro0(b.cashflowNet)}</div>
                                  <div className="pl-muted">Cashflow net (année)</div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="ir-disclaimer pl-disclaimer">
                  <strong>Disclaimer</strong>
                  Résultats indicatifs et non contractuels. Fiscalité simplifiée (notamment Assurance-vie & PER),
                  à valider selon le contrat, les dates exactes, les options fiscales, et la situation du client.
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="ir-right">
          <div className="ir-summary-card">
            <div className="ir-summary-row">
              <span>Âge actuel (estimé)</span>
              <span>{sim.ageNow} ans</span>
            </div>
            <div className="ir-summary-row">
              <span>Début retraits</span>
              <span>{sim.ageWithdrawStart} ans</span>
            </div>
            <div className="ir-summary-row">
              <span>Décès (simulation)</span>
              <span>{sim.ageDeath} ans</span>
            </div>
          </div>

          <div className="ir-summary-card">
            <div className="pl-card-title">Meilleure valeur finale</div>
            <div className="pl-card-big">{bestFinal.name}</div>
            <div className="ir-summary-row">
              <span>Capital final</span>
              <span>{shortEuro(bestFinal.finalCap)}</span>
            </div>
          </div>

          <div className="ir-summary-card">
            <div className="pl-card-title">Meilleur cashflow net</div>
            <div className="pl-card-big">{bestCashflow.name}</div>
            <div className="ir-summary-row">
              <span>Cashflow cumulé</span>
              <span>{shortEuro(bestCashflow.totalCashflow)}</span>
            </div>
          </div>

          <div className="ir-summary-card">
            <div className="pl-card-title">Fiscalité estimée</div>
            {sim.summaries.map((s, i) => (
              <div key={i} className="pl-minirow">
                <div className="pl-minirow__name">{s.name}</div>
                <div className="pl-minirow__val">{shortEuro(s.totalTax)}</div>
              </div>
            ))}
          </div>

          <div className="ir-summary-card">
            <div className="pl-card-title">PER : économie d’IR (indicative)</div>
            {sim.summaries.map((s, i) => (
              <div key={i} className="pl-minirow">
                <div className="pl-minirow__name">{s.name}</div>
                <div className="pl-minirow__val">{shortEuro(s.perSave)}</div>
              </div>
            ))}
            <div className="pl-muted" style={{ marginTop: 6 }}>
              Calcul simplifié : versements déductibles × TMI actuel.
            </div>
          </div>

          <div className="ir-summary-card">
            <div className="pl-card-title">Hypothèses</div>
            <ul className="pl-bullets">
              <li>Rendements constants (pas de volatilité)</li>
              <li>Fiscalité simplifiée (quote-part gains)</li>
              <li>PS “patrimoine” par défaut : {(state.client.psRate * 100).toFixed(1).replace('.', ',')}%</li>
              <li>PFU par défaut : {(state.client.pfuTotal * 100).toFixed(1).replace('.', ',')}%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===========================================================
   SmoothChart — on conserve l’esprit de ton SVG actuel
   (ticks lisibles + labels finaux anti-chevauchement) 
=========================================================== */

const COLORS = ['#2B5A52','#C0B5AA','#E4D0BB','#7A7A7A','#444555']

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
      const vals = (s.values || []).map(v => (v !== undefined && v >= 0) ? v : undefined)
      const any = vals.some(v => v !== undefined)
      return any ? { ...s, values: vals } : null
    })
    .filter(Boolean)

  if (!filtered.length) return null

  const LEG_W = 200
  const PAD = 60
  const W = Math.max(600, wrapW - 24)
  const SVG_W = Math.max(420, W - LEG_W)
  const SVG_H = 340

  const years = res.years || []
  const N = years.length

  let maxY = 0
  filtered.forEach(s => s.values.forEach(v => { if (v !== undefined && v > maxY) maxY = v }))
  if (maxY <= 0) maxY = 1

  let step
  if (maxY <= 12_000) step = 1_000
  else {
    const base = 10_000
    const desiredMaxTicks = 10
    const factor = Math.ceil(maxY / (base * desiredMaxTicks))
    step = base * factor
  }
  const topY = Math.ceil(maxY / step) * step

  const x = (i) => PAD + (N > 1 ? i * ((SVG_W - 2 * PAD) / (N - 1)) : 0)
  const y = (v) => SVG_H - PAD - ((v / topY) * (SVG_H - 2 * PAD))

  const ticksY = []
  for (let v = 0; v <= topY; v += step) ticksY.push({ val: v, y: y(v) })

  const fmtLabel = (val) => shortEuro(val)

  const lastPoints = filtered.map((s, si) => {
    let lastIdx = -1
    s.values.forEach((v, i) => { if (v !== undefined) lastIdx = i })
    if (lastIdx < 0) return null
    return {
      si,
      name: s.name,
      color: COLORS[si % COLORS.length],
      idx: lastIdx,
      val: s.values[lastIdx],
      lx: x(lastIdx),
      ly: y(s.values[lastIdx]),
    }
  }).filter(Boolean)

  const estimateTextWidth = (text) => Math.max(10, String(text).length * 7)
  const LABEL_H = 18
  const labelsRaw = lastPoints.map(p => {
    const label = fmtLabel(p.val)
    const w = estimateTextWidth(label)
    const minX = PAD + 4 + w / 2
    const maxX = SVG_W - PAD - 4 - w / 2
    const cx = Math.min(maxX, Math.max(minX, p.lx))
    const cy = p.ly - 10
    return { ...p, label, w, cx, cy }
  })

  const MIN_GAP = 18
  const minLabelY = PAD + LABEL_H / 2
  const maxLabelY = SVG_H - PAD - LABEL_H / 2

  labelsRaw.sort((a, b) => a.cy - b.cy)

  const labelsPlaced = []
  for (const lab of labelsRaw) {
    let yPlace = Math.max(minLabelY, lab.cy)
    if (labelsPlaced.length) {
      const prev = labelsPlaced[labelsPlaced.length - 1]
      if (yPlace < prev.y + MIN_GAP) yPlace = prev.y + MIN_GAP
    }
    yPlace = Math.min(maxLabelY, yPlace)
    labelsPlaced.push({ ...lab, x: lab.cx, y: yPlace })
  }
  for (let i = labelsPlaced.length - 2; i >= 0; i--) {
    const cur = labelsPlaced[i]
    const next = labelsPlaced[i + 1]
    if (cur.y > next.y - MIN_GAP) cur.y = Math.max(minLabelY, next.y - MIN_GAP)
  }

  const buildPath = (vals) => {
    const pts = vals.map((v, i) => (v === undefined ? null : [x(i), y(v)])).filter(Boolean)
    if (!pts.length) return ''
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`
    return d
  }

  return (
    <div ref={wrapRef} className="pl-chart-wrap">
      <svg width={SVG_W} height={SVG_H} role="img" aria-label="Évolution des placements">
        <line x1={PAD} y1={SVG_H - PAD} x2={SVG_W - PAD} y2={SVG_H - PAD} stroke="#bbb" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_H - PAD} stroke="#bbb" />

        {ticksY.map((t, i) => (
          <g key={'gy' + i}>
            <line x1={PAD - 5} y1={t.y} x2={SVG_W - PAD} y2={t.y} stroke="#eee" />
            <text x={PAD - 10} y={t.y + 4} fontSize="12" fill="#555" textAnchor="end">
              {shortEuro(t.val)}
            </text>
          </g>
        ))}

        {/* X ticks */}
        {years.map((yr, i) => (
          <g key={'x' + i}>
            <line x1={x(i)} y1={SVG_H - PAD} x2={x(i)} y2={SVG_H - PAD + 5} stroke="#bbb" />
            {(i === 0 || i === years.length - 1 || (years.length <= 12 && i % 2 === 0) || (years.length > 12 && i % 5 === 0)) && (
              <text x={x(i)} y={SVG_H - PAD + 18} fontSize="12" fill="#555" textAnchor="middle">
                {yr}
              </text>
            )}
          </g>
        ))}

        {/* series */}
        {filtered.map((s, si) => (
          <path
            key={'p' + si}
            d={buildPath(s.values)}
            fill="none"
            stroke={COLORS[si % COLORS.length]}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* labels finaux */}
        {labelsPlaced.map((p, i) => {
          const left = p.x - p.w / 2
          const top = p.y - LABEL_H / 2
          const needsLeader = (p.y < p.ly - 10 - 0.5)
          const leaderToY = top + LABEL_H
          const leaderToX = p.x

          return (
            <g key={'lbl' + i}>
              {needsLeader && (
                <line x1={p.lx} y1={p.ly} x2={leaderToX} y2={leaderToY} stroke={p.color} strokeWidth="1" />
              )}
              <rect x={left - 3} y={top - 2} width={p.w + 6} height={LABEL_H + 4} fill="#fff" opacity="0.92" rx="3" />
              <text x={p.x} y={p.y + 4} fontSize="13" fill={p.color} textAnchor="middle">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="pl-legend">
        {filtered.map((s, si) => (
          <div key={'lg' + si} className="pl-legend__item">
            <span className="pl-legend__dot" style={{ background: COLORS[si % COLORS.length] }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
