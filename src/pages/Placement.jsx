/* ===========================================================
   PLACEMENT — Option B (refactor + UX fixes)
   - Inputs factorisés
   - Unités alignées
   - 8 chiffres max sur Placement initial
   - Graphique: ticks 1 000 / 10 000, labels lisibles, valeur finale
   - Tableau: format € complet
   - Titres colonnes sur 2 lignes
   - Phrase modifiée “les intérêts de l’année…”
=========================================================== */

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { onResetEvent } from '../utils/reset.js'

/* ------------------- Helpers format ------------------- */
const fmtInt = (n)=> (Math.round(n) || 0).toLocaleString('fr-FR')
const toNum  = (v)=> {
  if (typeof v === 'number') return v
  const s = String(v || '').replace(/[^\d.-]/g,'')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
const euroFull = (n)=> (Number(n)||0).toLocaleString('fr-FR') + ' €'

// Format court pour graphique uniquement
const fmtShortEuro = (v)=>{
  const n = Number(v)||0
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' M€'
  if (n >= 1_000)     return (n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' k€'
  return n.toLocaleString('fr-FR') + ' €'
}

/* ------------------- UI constants ------------------- */
const COL_INPUT_W      = 160
const AMOUNT_W_IN_VERS = '60%'
const INPUT_H          = 32

/* ------------------- Defaults ------------------- */
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

const DEFAULT_PRODUCTS = [
  { name:'Placement 1 Capitalisation', rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 2 Capitalisation', rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 3 Distribution',   rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 4 Distribution',   rate:0, initial:0, entryFeePct:0 },
]

const defaultDurations = [1,1,1,1]
const defaultContribs  = [
  { amount:0, freq:'mensuel' },
  { amount:0, freq:'annuel'  },
  { amount:0, freq:'annuel'  },
  { amount:0, freq:'annuel'  },
]

/* ===========================================================
   SIMULATIONS
=========================================================== */
function simulateSimpleOnInitial({ rate, initial, entryFeePct }, startMonth, durYears, yearsMax){
  const r = rate || 0
  const fee = entryFeePct || 0
  const initNet = toNum(initial) * (1 - fee)
  const values = []

  for(let y=1; y<=yearsMax; y++){
    const monthsCum = (13 - startMonth) + 12*(y-1)
    const val = initNet * (1 + r * (monthsCum/12))
    values.push( (y <= durYears) ? val : undefined )
  }
  return values
}

function simulateWithContrib({ rate, initial, entryFeePct }, startMonth, contrib, durYears, yearsMax){
  const r = rate || 0
  const fee = entryFeePct || 0
  const initialNet = toNum(initial) * (1 - fee)
  const values = []
  let endPrevYear = 0

  for(let y=1; y<=yearsMax; y++){
    const mStart = (y === 1 ? startMonth : 1)
    const nbMois = 13 - mStart
    let total = 0

    // capital de début d'année + intérêts pro-rata
    total += endPrevYear
    total += endPrevYear * r * (nbMois/12)

    // initial (A1)
    if (y === 1 && initialNet > 0){
      total += initialNet
      total += initialNet * r * (nbMois/12)
    }

    // versements nets
    if (contrib && contrib.amount > 0){
      const amtNet = toNum(contrib.amount) * (1 - fee)
      if (contrib.freq === 'mensuel'){
        const mFirst = (y === 1 ? mStart : 1)
        for(let m = mFirst; m <= 12; m++){
          const monthsRem = 13 - m
          total += amtNet
          total += amtNet * r * (monthsRem/12)
        }
      }else{
        const monthsRem = 13 - startMonth
        total += amtNet
        total += amtNet * r * (monthsRem/12)
      }
    }

    values.push( (y <= durYears) ? total : undefined )
    endPrevYear = total
  }
  return values
}

/* ===========================================================
   INPUTS factorisés
=========================================================== */

function InputWithUnit({ value, onChange, type='text', unit='', width=COL_INPUT_W, maxLength, inputMode='numeric' }){
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'flex-end',
      gap:6, width, height:INPUT_H
    }}>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        {...(maxLength ? { maxLength } : {})}
        onChange={onChange}
        style={{width:'100%', textAlign:'right', height:INPUT_H, lineHeight:`${INPUT_H}px`}}
      />
      {unit && <span style={{lineHeight:`${INPUT_H}px`, height:INPUT_H}}>{unit}</span>}
    </div>
  )
}

/* Col header on 2 lines: "Placement X" + "Capitalisation/Distribution" */
function TwoLineHeader({ name }){
  const parts = name.split(' ')
  const type  = parts[parts.length-1] // Capitalisation / Distribution
  const label = parts.slice(0, parts.length-1).join(' ') // Placement X
  return (
    <div style={{lineHeight:1.15}}>
      {label}<br/>{type}
    </div>
  )
}

/* ===========================================================
   MAIN
=========================================================== */
export default function Placement(){
  const [startMonth, setStartMonth] = useState(1) // Janvier=1
  const [products,   setProducts]   = useState(DEFAULT_PRODUCTS)
  const [durations,  setDurations]  = useState(defaultDurations)
  const [contribs,   setContribs]   = useState(defaultContribs)

  // reset global
  useEffect(()=>{
    const off = onResetEvent?.(() => {
      setStartMonth(1)
      setProducts(DEFAULT_PRODUCTS)
      setDurations([1,1,1,1])
      setContribs(defaultContribs)
    })
    return off || (()=>{})
  }, [])

  const setProd     = (i,patch)=> setProducts(a=>a.map((p,idx)=> idx===i ? {...p, ...patch} : p))
  const setDuration = (i,v)=> setDurations(a=>a.map((x,idx)=> idx===i ? Math.max(1, v||1) : x))
  const setContrib  = (i,patch)=> setContribs(a=>a.map((c,idx)=> idx===i ? {...c, ...patch} : c))

  // Résultats
  const result = useMemo(()=>{
    const yearsMax = Math.max(...durations, 1)
    const sims = products.map((p,i)=>{
      const base = { rate:Number(p.rate)||0, initial:toNum(p.initial), entryFeePct:Number(p.entryFeePct)||0 }
      if(i >= 2){
        return simulateSimpleOnInitial(base, startMonth, durations[i], yearsMax)
      }
      return simulateWithContrib(
        base,
        startMonth,
        (contribs[i]?.amount>0 ? { amount: toNum(contribs[i].amount), freq: contribs[i].freq } : null),
        durations[i],
        yearsMax
      )
    })
    return {
      years: Array.from({length: yearsMax}, (_,k)=> k+1),
      series: sims.map((vals,i)=> ({ name: products[i].name, values: vals }))
    }
  }, [products, durations, contribs, startMonth])

  const years  = result.years
  const series = result.series

  return (
    <div className="panel">
      <div className="plac-title">Comparer différents placements</div>

      {/* Mois de souscription */}
      <div style={{display:'flex', alignItems:'center', gap:12, margin:'0 0 10px 0'}}>
        <div className="cell-strong">Mois de souscription</div>
        <select value={startMonth} onChange={e=> setStartMonth(Number(e.target.value))} style={{height:INPUT_H}}>
          {MONTHS.map((m,idx)=> <option key={idx} value={idx+1}>{m}</option>)}
        </select>
        <span className="cell-muted" style={{fontSize:13}}>
          (les intérêts de l’année sont au pro-rata du mois de souscription)
        </span>
      </div>

      <div className="plac-table-wrap">
        <table className="plac-table" role="grid" aria-label="tableau placement">
          <thead>
            <tr>
              <th></th>
              {products.map((p,i)=>(
                <th key={i}><TwoLineHeader name={p.name} /></th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Rendement Net de FG */}
            <tr>
              <td className="cell-muted">Rendement Net de FG</td>
              {products.map((p,i)=>{
                const ratePct = (Number(p.rate)||0)*100
                return (
                  <td key={i} className="input-cell">
                    <InputWithUnit
                      type="number"
                      value={Number(ratePct.toFixed(2))}
                      onChange={e=> setProd(i,{rate:(+e.target.value||0)/100})}
                      unit="%"
                    />
                  </td>
                )
              })}
            </tr>

            {/* Placement initial — 8 chiffres max */}
            <tr>
              <td className="cell-strong">Placement Initial</td>
              {products.map((p,i)=>(
                <td key={i} className="input-cell">
                  <InputWithUnit
                    value={fmtInt(p.initial)}
                    onChange={e=>{
                      const clean = e.target.value.replace(/\D/g,'').slice(0,8) // 8 chiffres
                      setProd(i,{initial: toNum(clean)})
                    }}
                    // onBlur: re-formate en FR
                    type="text"
                    unit="€"
                    inputMode="numeric"
                    maxLength={8}
                  />
                </td>
              ))}
            </tr>

            {/* Frais d’entrée */}
            <tr>
              <td className="cell-muted">Frais d’entrée</td>
              {products.map((p,i)=>{
                const feePct = (Number(p.entryFeePct)||0)*100
                return (
                  <td key={i} className="input-cell">
                    <InputWithUnit
                      type="number"
                      value={Number(feePct.toFixed(2))}
                      onChange={e=> setProd(i,{entryFeePct:(+e.target.value||0)/100})}
                      unit="%"
                    />
                  </td>
                )
              })}
            </tr>

            {/* Versement programmé (— pour 3 & 4) */}
            <tr>
              <td className="cell-strong">Versement programmé</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  {i < 2 ? (
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:COL_INPUT_W, height:INPUT_H}}>
                      <input
                        type="text" inputMode="numeric"
                        value={fmtInt(contribs[i].amount)}
                        onChange={e=>{
                          const clean = e.target.value.replace(/\D/g,'').slice(0,6)
                          setContrib(i,{amount: toNum(clean)})
                        }}
                        style={{width:AMOUNT_W_IN_VERS, textAlign:'right', height:INPUT_H, lineHeight:`${INPUT_H}px`}}
                        maxLength={6}
                      />
                      <span style={{height:INPUT_H, lineHeight:`${INPUT_H}px`}}>€</span>
                      <select
                        value={contribs[i].freq}
                        onChange={e=> setContrib(i,{freq:e.target.value})}
                        style={{height:INPUT_H}}
                      >
                        <option value="mensuel">mensuel</option>
                        <option value="annuel">annuel</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{textAlign:'right', color:'#777', width:COL_INPUT_W, height:INPUT_H, lineHeight:`${INPUT_H}px`}}>—</div>
                  )}
                </td>
              ))}
            </tr>

            {/* Durée en année */}
            <tr>
              <td>Durée en année</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  <InputWithUnit
                    type="number"
                    value={durations[i]}
                    onChange={e=> setDuration(i, +e.target.value||1)}
                    unit="an(s)"
                  />
                </td>
              ))}
            </tr>

            {/* Lignes Année N — valeurs en € plein format */}
            {years.map((y, yi)=>(
              <tr key={yi}>
                <td>{`Année ${y}`}</td>
                {series.map((s, si)=>(
                  <td key={si} style={{textAlign:'center', fontWeight:600}}>
                    {s.values[yi] !== undefined ? euroFull(s.values[yi]) : '0 €'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Graphique */}
      <div className="chart-card" style={{marginTop:20, border:'none', boxShadow:'none', outline:'none'}}>
        <SmoothChart res={result}/>
      </div>
    </div>
  )
}

/* ===========================================================
   Graphique SVG — ticks 1 000 / 10 000, labels lisibles
=========================================================== */

const COLORS = ['#2B5A52','#C0B5AA','#E4D0BB','#7A7A7A','#444555']

function SmoothChart({res}) {
  const wrapRef = useRef(null)
  const [wrapW, setWrapW] = useState(900)

  useEffect(()=>{
    const ro = new ResizeObserver(entries=>{
      const w = entries[0]?.contentRect?.width || 900
      setWrapW(w)
    })
    if(wrapRef.current) ro.observe(wrapRef.current)
    return ()=> ro.disconnect()
  },[])

  if(!res?.series?.length) return null

  // Filtre séries non vides
  const filtered = res.series.map(s=>{
    const vals = (s.values || []).map(v => (v !== undefined && v > 0) ? v : undefined)
    const anyPos = vals.some(v => v !== undefined && v > 0)
    return anyPos ? { ...s, values: vals } : null
  }).filter(Boolean)
  if(!filtered.length) return null

  // Mise en page
  const LEG_W = 180
  const PAD   = 60 // plus de marge gauche pour éviter les labels coupés
  const W     = Math.max(600, wrapW - 24)
  const SVG_W = Math.max(420, W - LEG_W)
  const SVG_H = 360

  const years = res.years || []
  const N     = years.length

  // Max Y
  let maxY = 0
  filtered.forEach(s => s.values.forEach(v => { if(v!==undefined && v>maxY) maxY = v }))
  if(maxY <= 0) maxY = 1

  // Choix du pas: 1 000 ou 10 000 selon l'échelle visée (~ jusqu'à 15 ticks)
  const step = (Math.ceil(maxY / 1000) <= 15) ? 1000 : 10000
  const topY = Math.ceil(maxY / step) * step

  const x = (i) => PAD + (N>1 ? i*((SVG_W-2*PAD)/(N-1)) : 0)
  const y = (v) => SVG_H - PAD - ((v/topY)*(SVG_H-2*PAD))

  // Ticks Y
  const ticksY = []
  for(let v=0; v<=topY; v+=step){
    ticksY.push({ val:v, y:y(v) })
  }

  // Derniers points (pour l'étiquette finale)
  const lastPoints = filtered.map((s,si)=>{
    let lastIdx = -1
    s.values.forEach((v,i)=> { if(v!==undefined) lastIdx = i })
    if(lastIdx < 0) return null
    return {
      si, name: s.name, color: COLORS[si%COLORS.length],
      idx: lastIdx,
      val: s.values[lastIdx],
      lx: x(lastIdx),
      ly: y(s.values[lastIdx])
    }
  }).filter(Boolean)

  return (
    <div ref={wrapRef} style={{display:'flex', alignItems:'stretch', gap:12, width:'100%'}}>
      {/* === GRAPHE === */}
      <svg width={SVG_W} height={SVG_H} role="img" aria-label="Évolution des placements" style={{display:'block'}}>
        {/* Axes */}
        <line x1={PAD} y1={SVG_H-PAD} x2={SVG_W-PAD} y2={SVG_H-PAD} stroke="#bbb"/>
        <line x1={PAD} y1={PAD}       x2={PAD}       y2={SVG_H-PAD} stroke="#bbb"/>

        {/* Grille Y + labels (format court) */}
        {ticksY.map((t,i)=>(
          <g key={'gy'+i}>
            <line x1={PAD-5} y1={t.y} x2={SVG_W-PAD} y2={t.y} stroke="#eee"/>
            <text x={PAD-10} y={t.y+4} fontSize="12" fill="#555" textAnchor="end">
              {fmtShortEuro(t.val)}
            </text>
          </g>
        ))}

        {/* Ticks X (années) */}
        {years.map((yr,i)=>(
          <text key={'gx'+i} x={x(i)} y={SVG_H-PAD+16} fontSize="12" fill="#666" textAnchor="middle">{yr}</text>
        ))}

        {/* Courbes + points */}
        {filtered.map((s,si)=>{
          const color = COLORS[si%COLORS.length]
          let d = ''
          s.values.forEach((v,i)=>{
            if(v===undefined) return
            d += (d===''?'M':'L') + ' ' + x(i) + ' ' + y(v) + ' '
          })
          if(!d) return null
          return (
            <g key={'s'+si}>
              <path d={d} fill="none" stroke={color} strokeWidth="2.5"/>
              {s.values.map((v,i)=> v!==undefined ? <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={color}/> : null)}
            </g>
          )
        })}

        {/* Étiquettes de valeur finale sur chaque série */}
        {lastPoints.map((p,i)=>(
          <g key={'lbl'+i}>
            <text x={p.lx + 8} y={p.ly - 6} fontSize="13" fill={p.color}>
              {fmtShortEuro(p.val)}
            </text>
          </g>
        ))}
      </svg>

      {/* === LÉGENDE === */}
      <div
        style={{
          width:LEG_W, minWidth:LEG_W, maxWidth:LEG_W,
          display:'flex', flexDirection:'column', gap:8, paddingTop:6
        }}
      >
        {filtered.map((s,si)=>(
          <div key={'lg'+si} style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{
              width:10, height:10, borderRadius:9999,
              background:COLORS[si%COLORS.length], display:'inline-block'
            }}/>
            <span style={{fontSize:13, color:'#333'}}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
