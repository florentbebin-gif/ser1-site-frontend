import React, { useMemo, useState } from 'react'

/* ===== Helpers format ===== */
const euro  = (n)=> (n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtInt= (n)=> (Math.round(n) || 0).toLocaleString('fr-FR')
const toNum = (v)=> {
  if (typeof v === 'number') return v
  const s = String(v || '').replace(/[^\d.-]/g,'')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/* ===== Largeurs pour alignement (une seule largeur pour tout) ===== */
const COL_INPUT_W = 160 // même largeur pour TOUTES les entrées afin d’aligner les colonnes

/* ===== Données par défaut ===== */
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

const DEFAULT_PRODUCTS = [
  { name:'Placement 1 Capitalisation', rate:0.05,  initial:1100,   entryFeePct:0.00 },
  { name:'Placement 2 Capitalisation', rate:0.0399, initial:0,      entryFeePct:0.00 },
  { name:'Placement 3 Distribution',   rate:0.04,   initial:97000,  entryFeePct:0.085 },
  { name:'Placement 4 Distribution',   rate:0.05,   initial:100000, entryFeePct:0.00 },
]

const defaultDurations = [20,20,5,5]
const defaultContribs  = [
  { amount:100,   freq:'mensuel' }, // actif col 1
  { amount:1200,  freq:'annuel'  }, // actif col 2
  { amount:0,     freq:'annuel'  }, // ignoré (—)
  { amount:0,     freq:'annuel'  }, // ignoré (—)
]

/* ===========================================================
   CALCULS
=========================================================== */

/** Intérêts simples pro-rata (non composés) sur capital initial net uniquement */
function simulateSimpleOnInitial({ rate, initial, entryFeePct }, startMonth, durYears, yearsMax){
  const r = rate || 0
  const fee = entryFeePct || 0
  const initNet = toNum(initial) * (1 - fee)
  const values = []

  for(let y=1; y<=yearsMax; y++){
    const monthsCum = (13 - startMonth) + 12*(y-1) // pro-rata cumulé jusqu’à fin de l’année y
    const val = initNet * (1 + r * (monthsCum/12))
    values.push( (y <= durYears) ? val : undefined )
  }
  return values
}

/** Intérêt simple avec versements (mensuel/annuel), pro-rata mensuel, net de frais
 *  finAnnée = capitalDébut + capitalDébut * r * (nbMois/12) + Σ(versementNet + versementNet * r * (moisRestants/12))
 *  (capitalDébut = fin année précédente — donc pas de capitalisation intra-annuelle)
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
    // capital début d’année + intérêts pro-rata
    total += endPrevYear
    total += endPrevYear * r * (nbMois/12)

    // initial (A1)
    if (y === 1 && initialNet > 0){
      total += initialNet
      total += initialNet * r * (nbMois/12)
    }

    // versements programmés (nets de frais)
    if (contrib && contrib.amount > 0){
      const amtNet = toNum(contrib.amount) * (1 - fee)
      if (contrib.freq === 'mensuel'){
        const mFirst = (y === 1 ? mStart : 1)
        for(let m = mFirst; m <= 12; m++){
          const monthsRem = 13 - m
          total += amtNet
          total += amtNet * r * (monthsRem/12)
        }
      }else{ // annuel : au mois de souscription, pro-rata (13 - startMonth)/12
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
  const [startMonth, setStartMonth] = useState(12) // Décembre sur ton screenshot
  const [products,   setProducts]   = useState(DEFAULT_PRODUCTS)
  const [durations,  setDurations]  = useState(defaultDurations)
  const [contribs,   setContribs]   = useState(defaultContribs)

  const setProd     = (i,patch)=> setProducts(a=>a.map((p,idx)=> idx===i ? {...p, ...patch} : p))
  const setDuration = (i,v)=> setDurations(a=>a.map((x,idx)=> idx===i ? Math.max(1, v||1) : x))
  const setContrib  = (i,patch)=> setContribs(a=>a.map((c,idx)=> idx===i ? {...c, ...patch} : c))

  // Résultats (calcul local)
  const result = useMemo(()=>{
    const yearsMax = Math.max(...durations, 1)
    const sims = products.map((p,i)=>{
      // Col 3 & 4 : intérêt simple uniquement sur l'initial net
      if(i >= 2){
        return simulateSimpleOnInitial(
          { rate:Number(p.rate)||0, initial:toNum(p.initial), entryFeePct:Number(p.entryFeePct)||0 },
          startMonth,
          durations[i],
          yearsMax
        )
      }
      // Col 1 & 2 : avec versements programmés
      return simulateWithContrib(
        { rate:Number(p.rate)||0, initial:toNum(p.initial), entryFeePct:Number(p.entryFeePct)||0 },
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

            {/* Versement programmé (seulement 2 premières colonnes) */}
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
                        style={{width:'60%', textAlign:'right'}} // montant plus étroit mais CONTENEUR aligné
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

            {/* Durée en année */}
            <tr>
              <td className="cell-strong">Durée en année</td>
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

            {/* Lignes Année N */}
            {years.map((y, yi)=>(
              <tr key={yi}>
                <td>{`Année ${y}`}</td>
                {series.map((s, si)=>(
                  <td key={si} className="cell-strong">
                    {s.values[yi] !== undefined ? euro(s.values[yi]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Graphique dessous === */}
      <div className="chart-card" style={{marginTop:20}}>
        <SmoothChart res={result}/>
      </div>
    </div>
  )
}

/* ===== Graphe simple SVG ===== */
const COLORS = ['#2B5A52','#C0B5AA','#E4D0BB','#7A7A7A','#444555']
function SmoothChart({res}){
  if(!res?.series?.length) return null

  const W=820, H=420, P=40
  // max Y sur les points définis uniquement
  let max=0
  res.series.forEach(s=> s.values.forEach(v=> { if(v!==undefined && v>max) max=v }))
  if(max===0) max=1

  const x = (i, nPts) => P + i*((W-2*P)/Math.max(1, nPts-1))
  const y = (v) => H-P - ((v/max)*(H-2*P))

  return (
    <>
      <svg width={W} height={H} role="img" aria-label="évolution des placements">
        <rect x="0" y="0" width={W} height={H} fill="#fff"/>
        <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="#bbb"/>
        <line x1={P} y1={P}   x2={P}   y2={H-P} stroke="#bbb"/>

        {res.series.map((s,si)=>{
          const pts = s.values
          const n   = res.years.length
          let d = ''
          for(let i=0;i<n;i++){
            const v = pts[i]
            if(v===undefined) continue
            d += (d===''?'M':'L') + ' ' + x(i,n) + ' ' + y(v) + ' '
          }
          return <path key={si} d={d} fill="none" stroke={COLORS[si%COLORS.length]} strokeWidth="2.5"/>
        })}
      </svg>

      <div className="chart-legend">
        {res.series.map((s,si)=>(
          <div key={si}><span className="legend-dot" style={{background:COLORS[si%COLORS.length]}}/> {s.name}</div>
        ))}
      </div>
    </>
  )
}
