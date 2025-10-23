import React, { useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
const euro = (n)=> (n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'

// Palette stable (mémo pour éviter re-rendu inutile)
const COLORS = ['#2B5A52','#C0B5AA','#E4D0BB','#7A7A7A','#444555']

const DEFAULT_INPUT = {
  duration: 16,
  custom1Years: 20,
  products: [
    { name:'Placement 1', rate:0.05,  initial:563750, entryFeePct:0.00 },
    { name:'Placement 2', rate:0.04,  initial:570000, entryFeePct:0.00 },
    { name:'Placement 3', rate:0.035, initial:100000, entryFeePct:0.00 },
    { name:'Assurance vie (SCPI)', rate:0.04, initial:97000, entryFeePct:0.085 },
    { name:'Compte titre', rate:0.05, initial:100000, entryFeePct:0.00 },
  ]
}

export default function Placement(){
  const [inp, setInp] = useState(()=>{
    const saved = localStorage.getItem('ser1:sim:placement:inp')
    return saved ? JSON.parse(saved) : DEFAULT_INPUT
  })
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const setField = (k,v)=> setInp(p=>({...p,[k]:v}))
  const setProd  = (i,patch)=> setInp(p=>({...p, products:p.products.map((x,idx)=> idx===i?{...x,...patch}:x)}))

  const onCalc = async ()=>{
    setLoading(true); setError(null)
    try{
      const r = await fetch(`${API_BASE}/api/placement`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(inp)
      })
      const txt = await r.text(); const j = txt? JSON.parse(txt):null
      if(!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j); localStorage.setItem('ser1:sim:placement:inp', JSON.stringify(inp))
    }catch(e){ setError(e.message) }
    finally{ setLoading(false) }
  }

  return (
    <div className="panel">
      <div className="plac-title">Comparer différents placements</div>

      <div className="plac-layout">
        {/* ---- Tableau ---- */}
        <div className="plac-table-wrap">
          <table className="plac-table" role="grid" aria-label="tableau placement">
            <thead>
              <tr>
                <th></th>
                {inp.products.map((p,i)=> <th key={i}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {/* Rendement */}
              <tr>
                <td className="cell-muted">Rendement Net de FG</td>
                {inp.products.map((p,i)=>(
                  <td key={i} className="input-cell">
                    <input type="number" step="0.001" value={p.rate}
                      onChange={e=>setProd(i,{rate:+e.target.value||0})}/>
                  </td>
                ))}
              </tr>
              {/* Placement initial */}
              <tr>
                <td className="cell-strong">Placement Initial</td>
                {inp.products.map((p,i)=>(
                  <td key={i} className="input-cell">
                    <input type="number" value={p.initial}
                      onChange={e=>setProd(i,{initial:+e.target.value||0})}/>
                  </td>
                ))}
              </tr>
              {/* Frais d’entrée */}
              <tr>
                <td className="cell-muted">Frais d’entrée</td>
                {inp.products.map((p,i)=>(
                  <td key={i} className="input-cell">
                    <input type="number" step="0.001" value={p.entryFeePct}
                      onChange={e=>setProd(i,{entryFeePct:+e.target.value||0})}/>
                  </td>
                ))}
              </tr>

              {/* Lignes d'années (après calcul) */}
              {res?.years?.map((y,yi)=>(
                <tr key={yi}>
                  <td>{`Année ${y}`}</td>
                  {res.series.filter(s=>s.name!=='Total').map((s,si)=>(
                    <td key={si} className="cell-strong">{euro(s.values[yi])}</td>
                  ))}
                </tr>
              ))}

              {/* Ligne horizon */}
              {res?.horizon && (
                <tr>
                  <td className="cell-strong">Durée “sur mesure” du placement 1</td>
                  <td className="cell-strong">{res.horizon.year}</td>
                  {Array.from({length: Math.max(0, (res.series.length-2))}).map((_,i)=> <td key={i}></td>)}
                  <td className="cell-strong">{euro(res.horizon.total)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{marginTop:10, display:'flex', gap:8}}>
            <button className="chip" onClick={onCalc} disabled={loading}>
              {loading?'Calcul…':'Calculer'}
            </button>
            {error && <span className="cell-muted" style={{color:'#b00'}}>Erreur : {error}</span>}
          </div>
        </div>

        {/* ---- Graphique ---- */}
        <div className="chart-card">
          <SmoothChart res={res}/>
        </div>
      </div>
    </div>
  )
}

function SmoothChart({res}){
  if(!res?.series?.length) return <div className="cell-muted">Le graphique s’affichera après calcul.</div>

  const { W, H, P, x, y, paths } = useMemo(()=>{
    const W=720, H=420, P=40
    let max=0
    res.series.forEach(s=>s.values.forEach(v=>{ if(v>max) max=v }))
    const x = i => P + i*((W-2*P)/(res.years.length-1||1))
    const y = v => H-P - ((v/max)*(H-2*P))
    const paths = res.series.map(s => s.values.map((v,i)=>`${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' '))
    return { W,H,P,x,y,paths }
  },[res])

  return (
    <>
      <svg width={W} height={H} role="img" aria-label="évolution des placements">
        <rect x="0" y="0" width={W} height={H} fill="#fff"/>
        <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="#bbb"/>
        <line x1={P} y1={P}   x2={P}   y2={H-P} stroke="#bbb"/>

        {res.series.map((s,si)=>(
          <path key={si} d={paths[si]} fill="none" stroke={COLORS[si%COLORS.length]} strokeWidth="2.5"/>
        ))}

        {res.series.map((s,si)=>{
          const i=s.values.length-1, v=s.values[i]
          return (
            <g key={'lbl'+si}>
              <circle cx={x(i)} cy={y(v)} r="3" fill={COLORS[si%COLORS.length]}/>
              <text x={x(i)+6} y={y(v)-6} fontSize="12" fill="#333">{s.name}</text>
              <text x={x(i)+6} y={y(v)+10} fontSize="12" fill="#333">{euro(v)}</text>
            </g>
          )
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
