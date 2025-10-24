import React, { useMemo, useState, useEffect, useRef } from 'react'
import { onResetEvent } from '../utils/reset.js'

/* ------------------- Helpers format ------------------- */
const euro  = (n)=> (n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtInt= (n)=> (Math.round(n) || 0).toLocaleString('fr-FR')
const toNum = (v)=> {
  if (typeof v === 'number') return v
  const s = String(v || '').replace(/[^\d.-]/g,'')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/* ------------------- Layout (alignement) ------------------- */
const COL_INPUT_W = 160      // largeur fixe pour aligner les colonnes
const AMOUNT_W_IN_VERS = '60%'

/* ------------------- Defaults ------------------- */
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

// Produits (noms fixes)
const DEFAULT_PRODUCTS = [
  { name:'Placement 1 Capitalisation', rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 2 Capitalisation', rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 3 Distribution',   rate:0, initial:0, entryFeePct:0 },
  { name:'Placement 4 Distribution',   rate:0, initial:0, entryFeePct:0 },
]

// Durée (toutes à 1 an au départ)
const defaultDurations = [1,1,1,1]

// Versements programmés (uniquement colonnes 1 & 2)
const defaultContribs  = [
  { amount:0,     freq:'mensuel' },
  { amount:0,     freq:'annuel'  },
  { amount:0,     freq:'annuel'  }, // ignorés pour 3 & 4 (—)
  { amount:0,     freq:'annuel'  },
]

/* ===========================================================
   CALCULS — pro-rata simple mensuel (pas de capitalisation intra-annuelle)
=========================================================== */

/** Intérêts simples pro-rata sur capital initial net uniquement (placements 3 & 4) */
function simulateSimpleOnInitial({ rate, initial, entryFeePct }, startMonth, durYears, yearsMax){
  const r = rate || 0
  const fee = entryFeePct || 0
  const initNet = toNum(initial) * (1 - fee)
  const values = []

  for(let y=1; y<=yearsMax; y++){
    const monthsCum = (13 - startMonth) + 12*(y-1) // mois cumulés jusqu'à fin de l'année y
    const val = initNet * (1 + r * (monthsCum/12))
    values.push( (y <= durYears) ? val : undefined )
  }
  return values
}

/** Intérêt simple avec versements programmés (nets de frais)
 *  - capital début d'année (fin N-1) rémunéré au pro-rata de l'année
 *  - initial (A1) rémunéré au pro-rata nbMois/12
 *  - mensuel: mStart→12 (A1), 1→12 (A>=2), chaque mois reçoit (13-m)/12
 *  - annuel: un versement au mois de souscription chaque année, rémunéré (13-startMonth)/12
 */
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
    // capital début d'année + intérêts pro-rata
    total += endPrevYear
    total += endPrevYear * r * (nbMois/12)

    // initial (A1)
    if (y === 1 && initialNet > 0){
      total += initialNet
      total += initialNet * r * (nbMois/12)
    }

    // versements (nets de frais)
    if (contrib && contrib.amount > 0){
      const amtNet = toNum(contrib.amount) * (1 - fee)
      if (contrib.freq === 'mensuel'){
        const mFirst = (y === 1 ? mStart : 1)
        for(let m = mFirst; m <= 12; m++){
          const monthsRem = 13 - m
          total += amtNet
          total += amtNet * r * (monthsRem/12)
        }
      }else{ // annuel au mois de souscription
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
   Composant principal
=========================================================== */
export default function Placement(){
  const [startMonth, setStartMonth] = useState(1) // Janvier=1
  const [products,   setProducts]   = useState(DEFAULT_PRODUCTS)
  const [durations,  setDurations]  = useState(defaultDurations)
  const [contribs,   setContribs]   = useState(defaultContribs)

  // Reset global (optionnel si tu utilises onResetEvent)
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
        <select value={startMonth} onChange={e=> setStartMonth(Number(e.target.value))} style={{height:32}}>
          {MONTHS.map((m,idx)=> <option key={idx} value={idx+1}>{m}</option>)}
        </select>
        <span className="cell-muted" style={{fontSize:13}}>
          (les intérêts de l’année 1 sont au pro-rata du mois de souscription)
        </span>
      </div>

      <div className="plac-table-wrap">
        <table className="plac-table" role="grid" aria-label="tableau placement">
          <thead>
            <tr>
              <th></th>
              {products.map((p,i)=>(
                <th key={i} style={{lineHeight:1.1}}>
                  {p.name.split(' ').slice(0,2).join(' ')}<br/>
                  {p.name.split(' ').slice(2).join(' ')}
                </th>
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
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
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

            {/* Placement initial */}
            <tr>
              <td className="cell-strong">Placement Initial</td>
              {products.map((p,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                    <input
                      type="text" inputMode="numeric"
                      value={fmtInt(p.initial)}
                      onChange={e=> setProd(i,{initial: toNum(e.target.value)})}
                      onBlur={e=> e.target.value = fmtInt(toNum(e.target.value))}
                      style={{width:'100%', textAlign:'right'}}
                    />
                    <span>€</span>
                  </div>
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
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
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

            {/* Versement programmé (— pour 3 & 4) */}
            <tr>
              <td className="cell-strong">Versement programmé</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  {i < 2 ? (
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                      <input
                        type="text" inputMode="numeric"
                        value={fmtInt(contribs[i].amount)}
                        onChange={e=> setContrib(i,{amount: toNum(e.target.value)})}
                        onBlur={e=> e.target.value = fmtInt(toNum(e.target.value))}
                        style={{width:AMOUNT_W_IN_VERS, textAlign:'right'}}
                        maxLength={6}
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

            {/* Durée en année (label non gras) */}
            <tr>
              <td>Durée en année</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:COL_INPUT_W}}>
                    <input
                      type="number" min="1"
                      value={durations[i]}
                      onChange={e=> setDuration(i, +e.target.value||1)}
                      style={{width:'100%', textAlign:'right'}}
                    />
                    <span>an(s)</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Lignes Année N (valeurs centrées) */}
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
      <div className="chart-card" style={{marginTop:20, border:'none', boxShadow:'none', outline:'none'}}>
        <SmoothChart res={result}/>
      </div>
    </div>
  )
}

/* ===== Graphique responsive avec légende à droite — Axe en K€, labels anti-chevauchement ===== */

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

  // Ne garder que les séries avec au moins une valeur > 0
  const filtered = res.series.map(s=>{
    const vals = (s.values || []).map(v => (v !== undefined && v > 0) ? v : undefined)
    const anyPos = vals.some(v => v !== undefined && v > 0)
    return anyPos ? { ...s, values: vals } : null
  }).filter(Boolean)
  if(!filtered.length) return null

  // Mise en page
  const LEG_W = 180
  const PAD   = 40
  const W     = Math.max(600, wrapW - 24)
  const SVG_W = Math.max(420, W - LEG_W)
  const SVG_H = 360

  const years = res.years || []
  const N     = years.length

  // Max Y
  let maxY = 0
  filtered.forEach(s => s.values.forEach(v => { if(v!==undefined && v>maxY) maxY = v }))
  if(maxY <= 0) maxY = 1

  // Axe K€: pas 10k si top ≤ 200k, sinon 100k
  const maxK = Math.ceil(maxY / 1000)
  const stepK = (maxK <= 200 ? 10 : 100)
  const topK  = Math.ceil(maxK / stepK) * stepK
  const topY  = topK * 1000

  const x = (i) => PAD + (N>1 ? i*((SVG_W-2*PAD)/(N-1)) : 0)
  const y = (v) => SVG_H - PAD - ((v/topY)*(SVG_H-2*PAD))

  // Ticks Y (K€)
  const ticksY = []
  for(let k=0; k<=topK; k+=stepK){
    const valEur = k * 1000
    ticksY.push({ k, valEur, y: y(valEur) })
  }

  // Prépare les “last points” pour gérer le placement anti-chevauchement des labels
  const lastPoints = filtered.map((s,si)=>{
    let lastIdx = -1
    s.values.forEach((v,i)=> { if(v!==undefined) lastIdx = i })
    const lastVal = s.values[lastIdx]
    return {
      si, name: s.name, color: COLORS[si%COLORS.length],
      lastIdx, lastVal,
      lx: x(lastIdx),
      ly: y(lastVal)
    }
  }).filter(p => p.lastIdx >= 0)

  // Place les labels sans chevauchement
  const MIN_GAP = 16
  lastPoints.sort((a,b)=> a.ly - b.ly)
  const placed = []
  lastPoints.forEach(pt=>{
    let labelY = pt.ly - 8
    if (placed.length){
      const prev = placed[placed.length-1]
      if (labelY < prev.labelY + MIN_GAP) {
        labelY = prev.labelY + MIN_GAP
      }
    }
    labelY = Math.min(SVG_H - PAD - 6, Math.max(PAD + 12, labelY))
    const lbl = (pt.lastVal/1000).toFixed(2) + ' k€'
    const estW = 7 * lbl.length
    const labelX = Math.min(SVG_W - PAD - estW - 4, pt.lx + 8)
    placed.push({...pt, labelY, labelX, label: lbl})
  })

  return (
    <div ref={wrapRef} style={{display:'flex', alignItems:'stretch', gap:12, width:'100%'}}>
      {/* === GRAPHE sans cadre === */}
      <svg width={SVG_W} height={SVG_H} role="img" aria-label="Évolution des placements" style={{display:'block'}}>
        {/* Axes */}
        <line x1={PAD} y1={SVG_H-PAD} x2={SVG_W-PAD} y2={SVG_H-PAD} stroke="#bbb"/>
        <line x1={PAD} y1={PAD}       x2={PAD}       y2={SVG_H-PAD} stroke="#bbb"/>

        {/* Grille Y + labels K€ */}
        {ticksY.map((t,i)=>(
          <g key={'gy'+i}>
            <line x1={PAD-4} y1={t.y} x2={SVG_W-PAD} y2={t.y} stroke="#eee"/>
            <text x={PAD-8} y={t.y+4} fontSize="11" fill="#666" textAnchor="end">
              {t.k} k€
            </text>
          </g>
        ))}

        {/* Ticks X (années) */}
        {years.map((yr,i)=>(
          <g key={'gx'+i}>
            <line x1={x(i)} y1={SVG_H-PAD} x2={x(i)} y2={SVG_H-PAD+4} stroke="#bbb"/>
            {(i===0 || i===N-1 || (i%2===0 && N>10)) && (
              <text x={x(i)} y={SVG_H-PAD+16} fontSize="11" fill="#666" textAnchor="middle">{yr}</text>
            )}
          </g>
        ))}

        {/* Titres axes */}
        <text x={(SVG_W)/2} y={SVG_H-6} fontSize="12" fill="#444" textAnchor="middle">Années</text>
        <text x={12} y={PAD-10} fontSize="12" fill="#444" textAnchor="start">Valeur (K€)</text>

        {/* Courbes */}
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
              {s.values.map((v,i)=> v!==undefined ? <circle key={i} cx={x(i)} cy={y(v)} r="2.2" fill={color}/> : null)}
            </g>
          )
        })}

        {/* Labels finaux anti-chevauchement */}
        {placed.map((p,i)=>(
          <g key={'lbl'+i}>
            <circle cx={p.lx} cy={p.ly} r="3.5" fill={p.color}/>
            <rect x={p.labelX-2} y={p.labelY-11} width={(p.label.length*7)+6} height="16" fill="#fff" opacity="0.9" rx="2"/>
            <text x={p.labelX} y={p.labelY} fontSize="12" fill="#333">{p.label}</text>
          </g>
        ))}
      </svg>

      {/* === LÉGENDE à droite === */}
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
