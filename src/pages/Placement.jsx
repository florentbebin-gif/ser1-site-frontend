/* ===========================================================
   PLACEMENT — Version corrigée (format M€/K€, 8 chiffres max)
=========================================================== */

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { onResetEvent } from '../utils/reset.js'

/* ------------------- Helpers format ------------------- */
const euro = (n) => {
  const val = Number(n) || 0
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2).replace('.', ',') + ' M€'
  if (val >= 1_000)     return (val / 1_000).toFixed(2).replace('.', ',') + ' k€'
  return val.toLocaleString('fr-FR') + ' €'
}
const fmtInt = (n) => (Math.round(n) || 0).toLocaleString('fr-FR')
const toNum = (v) => {
  const s = String(v || '').replace(/[^\d.-]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/* ------------------- UI Layout ------------------- */
const COL_INPUT_W = 160
const AMOUNT_W_IN_VERS = '60%'

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
   SIMULATION CALCUL
=========================================================== */
function simulateSimpleOnInitial({ rate, initial, entryFeePct }, startMonth, durYears, yearsMax){
  const r = rate || 0
  const fee = entryFeePct || 0
  const initNet = toNum(initial) * (1 - fee)
  const values = []

  for(let y=1; y<=yearsMax; y++){
    const monthsCum = (13 - startMonth) + 12*(y-1)
    const val = initNet * (1 + r*(monthsCum/12))
    values.push(y <= durYears ? val : undefined)
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
    const mStart = (y===1 ? startMonth : 1)
    const nbMois = 13 - mStart
    let total = 0

    total += endPrevYear * (1 + r*(nbMois/12))

    if(y===1 && initialNet > 0){
      total += initialNet * (1 + r*(nbMois/12))
    }

    if (contrib && contrib.amount > 0){
      const amtNet = toNum(contrib.amount) * (1 - fee)
      if (contrib.freq === 'mensuel'){
        const mFirst = (y===1 ? mStart : 1)
        for(let m=mFirst; m<=12; m++){
          const monthsRem = 13 - m
          total += amtNet * (1 + r*(monthsRem/12))
        }
      }else{
        const monthsRem = 13 - startMonth
        total += amtNet * (1 + r*(monthsRem/12))
      }
    }
    values.push(y <= durYears ? total : undefined)
    endPrevYear = total
  }
  return values
}

/* ===========================================================
   Composant principal
=========================================================== */
export default function Placement(){
  const [startMonth, setStartMonth] = useState(1)
  const [products,   setProducts]   = useState(DEFAULT_PRODUCTS)
  const [durations,  setDurations]  = useState(defaultDurations)
  const [contribs,   setContribs]   = useState(defaultContribs)

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

  const result = useMemo(()=>{
    const yearsMax = Math.max(...durations, 1)
    const sims = products.map((p,i)=>{
      const base = { rate:+p.rate||0, initial:p.initial, entryFeePct:+p.entryFeePct||0 }
      return (i>=2)
        ? simulateSimpleOnInitial(base, startMonth, durations[i], yearsMax)
        : simulateWithContrib(base, startMonth, contribs[i], durations[i], yearsMax)
    })
    return {
      years: Array.from({length: Math.max(...durations, 1)}, (_,k)=> k+1),
      series: sims.map((vals,i)=> ({ name:products[i].name, values:vals }))
    }
  }, [products, durations, contribs, startMonth])

  const years  = result.years
  const series = result.series

  return (
    <div className="panel">
      <div className="plac-title">Comparer différents placements</div>

      {/* Mois de souscription */}
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:10}}>
        <div className="cell-strong">Mois de souscription</div>
        <select value={startMonth} onChange={e=> setStartMonth(+e.target.value)} style={{height:32}}>
          {MONTHS.map((m,idx)=><option key={idx} value={idx+1}>{m}</option>)}
        </select>
        <span className="cell-muted" style={{fontSize:13}}>
          (les intérêts de l’année 1 sont au pro-rata du mois de souscription)
        </span>
      </div>

      <div className="plac-table-wrap">
        <table className="plac-table">
          <thead>
            <tr>
              <th></th>
              {products.map((p,i)=><th key={i}>{p.name}</th>)}
            </tr>
          </thead>

          <tbody>

            {/* Rendement */}
            <tr>
              <td className="cell-muted">Rendement Net de FG</td>
              {products.map((p,i)=>{
                const ratePct = (Number(p.rate)||0)*100
                return (
                  <td key={i} className="input-cell">
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                      <input
                        type="number" step="0.01"
                        value={Number(ratePct.toFixed(2))}
                        onChange={e=> setProd(i,{rate:(+e.target.value||0)/100})}
                        style={{width:'100%', textAlign:'right'}}
                      />
                      <span>%</span>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Placement initial — 8 chiffres max */}
            <tr>
              <td className="cell-strong">Placement Initial</td>
              {products.map((p,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                    <input
                      type="text" inputMode="numeric"
                      value={fmtInt(p.initial)}
                      maxLength={8}
                      onChange={e=>{
                        let clean = e.target.value.replace(/\D/g,'').slice(0,8)
                        setProd(i,{initial:toNum(clean)})
                      }}
                      onBlur={e=>{
                        let clean = e.target.value.replace(/\D/g,'').slice(0,8)
                        e.target.value = fmtInt(toNum(clean))
                      }}
                      style={{width:'100%', textAlign:'right'}}
                    />
                    <span>€</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Frais entrée */}
            <tr>
              <td className="cell-muted">Frais d’entrée</td>
              {products.map((p,i)=>{
                const feePct = (Number(p.entryFeePct)||0)*100
                return (
                  <td key={i} className="input-cell">
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                      <input
                        type="number" step="0.01"
                        value={Number(feePct.toFixed(2))}
                        onChange={e=> setProd(i,{entryFeePct:(+e.target.value||0)/100})}
                        style={{width:'100%', textAlign:'right'}}
                      />
                      <span>%</span>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Versement programmé */}
            <tr>
              <td className="cell-strong">Versement programmé</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  {i < 2 ? (
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                      <input
                        type="text" inputMode="numeric"
                        value={fmtInt(contribs[i].amount)}
                        maxLength={6}
                        onChange={e=>{
                          let clean = e.target.value.replace(/\D/g,'')
                          setContrib(i,{amount:toNum(clean)})
                        }}
                        onBlur={e=>{
                          let clean = e.target.value.replace(/\D/g,'')
                          e.target.value = fmtInt(toNum(clean))
                        }}
                        style={{width:AMOUNT_W_IN_VERS, textAlign:'right'}}
                      />
                      <span>€</span>
                      <select
                        value={contribs[i].freq}
                        onChange={e=> setContrib(i,{freq:e.target.value})}
                        style={{height:32}}
                      >
                        <option value="mensuel">mensuel</option>
                        <option value="annuel">annuel</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{textAlign:'right', color:'#777', width:COL_INPUT_W}}>—</div>
                  )}
                </td>
              ))}
            </tr>

            {/* Durée */}
            <tr>
              <td>Durée en année</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                    <input
                      type="number" min="1"
                      value={durations[i]}
                      onChange={e=> setDuration(i,+e.target.value||1)}
                      style={{width:'100%', textAlign:'right'}}
                    />
                    <span>an(s)</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Lignes Année */}
            {years.map((y, yi)=>(
              <tr key={yi}>
                <td>{`Année ${y}`}</td>
                {series.map((s, si)=>(
                  <td key={si} style={{textAlign:'center', fontWeight:600}}>
                    {s.values[yi] !== undefined ? euro(s.values[yi]) : '0 €'}
                  </td>
                ))}
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* Graphique */}
      <div className="chart-card" style={{marginTop:20, border:'none', boxShadow:'none'}}>
        <SmoothChart res={result}/>
      </div>
    </div>
  )
}

/* ===========================================================
   Graphique — Axe Y lisible et propre
=========================================================== */

const COLORS = ['#2B5A52','#C0B5AA','#E4D0BB','#7A7A7A','#444555']

function SmoothChart({res}) {
  const wrapRef = useRef(null)
  const [wrapW, setWrapW] = useState(900)

  useEffect(()=>{
    const ro = new ResizeObserver(entries=>{
      setWrapW(entries[0]?.contentRect?.width || 900)
    })
    if(wrapRef.current) ro.observe(wrapRef.current)
    return ()=> ro.disconnect()
  },[])

  const filtered = res.series.map(s=>{
    const vals = (s.values||[]).map(v=> v>0 ? v : undefined)
    return vals.some(v=>v>0) ? {...s, values:vals} : null
  }).filter(Boolean)

  if(!filtered.length) return null

  const LEG_W = 180
  const PAD   = 55  
  const W     = Math.max(600, wrapW - 24)
  const SVG_W = Math.max(420, W - LEG_W)
  const SVG_H = 360

  const years = res.years
  const N = years.length

  let maxY = 1
  filtered.forEach(s => s.values.forEach(v=>{ if(v>maxY) maxY=v }))

  let unit = 1000 
  if (maxY >= 1_000_000) {
    unit = 100_000 
  }
  const topU = Math.ceil(maxY / unit) * unit

  const x = i => PAD + (N>1 ? i*((SVG_W-2*PAD)/(N-1)) : 0)
  const y = v => SVG_H - PAD - ((v/topU)*(SVG_H-2*PAD))

  const ticksY = []
  for(let v=0; v<=topU; v+=unit){
    ticksY.push({v, y:y(v)})
  }

  const lastPoints = filtered.map((s,si)=>{
    let idx = -1
    s.values.forEach((v,i)=>{ if(v!==undefined) idx=i })
    return idx>=0 ? {
      si, name:s.name, color:COLORS[si%COLORS.length],
      idx, val:s.values[idx],
      lx:x(idx), ly:y(s.values[idx])
    } : null
  }).filter(Boolean)

  return (
    <div ref={wrapRef} style={{display:'flex', width:'100%', gap:12}}>
      <svg width={SVG_W} height={SVG_H}>

        {/* Axes */}
        <line x1={PAD} y1={SVG_H-PAD} x2={SVG_W-PAD} y2={SVG_H-PAD} stroke="#bbb"/>
        <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_H-PAD} stroke="#bbb"/>

        {/* Grille + labels */}
        {ticksY.map((t,i)=>(
          <g key={'y'+i}>
            <line x1={PAD-5} y1={t.y} x2={SVG_W-PAD} y2={t.y} stroke="#eee"/>
            <text x={PAD-8} y={t.y+4} fontSize="12" fill="#444" textAnchor="end">
              {t.v >= 1_000_000
                ? (t.v/1_000_000).toLocaleString('fr-FR') + ' M€'
                : (t.v/1000).toLocaleString('fr-FR') + ' k€'}
            </text>
          </g>
        ))}

        {/* Ticks X */}
        {years.map((yr,i)=>(
          <text key={i} x={x(i)} y={SVG_H-PAD+16} fontSize="12" fill="#444" textAnchor="middle">
            {yr}
          </text>
        ))}

        {/* Courbes */}
        {filtered.map((s,si)=>(
          <g key={'s'+si}>
            <path
              d={s.values.map((v,i)=> v!==undefined ? `${i===0?'M':'L'}${x(i)},${y(v)}` : '').join(' ')}
              fill="none"
              stroke={COLORS[si%COLORS.length]}
              strokeWidth="2.5"
            />
            {s.values.map((v,i)=>(
              v!==undefined && <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={COLORS[si%COLORS.length]}/>
            ))}
          </g>
        ))}

      </svg>

      {/* Légende */}
      <div style={{width:LEG_W, display:'flex', flexDirection:'column', gap:8}}>
        {filtered.map((s,si)=>(
          <div key={'l'+si} style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{
              width:10, height:10, borderRadius:9999,
              background:COLORS[si%COLORS.length]
            }}/>
            <span style={{fontSize:13}}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
