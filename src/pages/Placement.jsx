import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
const euro = (n)=> (n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const COLORS = ['#2B5A52','#C0B5AA','#E4D0BB','#7A7A7A','#444555']

// helpers € formaté
const toNumber = (str) => {
  if (typeof str === 'number') return str
  if (!str) return 0
  const cleaned = String(str).replace(/[^\d.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}
const formatIntFr = (n) => (Math.round(n) || 0).toLocaleString('fr-FR')

// largeurs homogènes des inputs d’en-tête
const INPUT_W = 120
const INPUT_W_DUR = 110 // un poil plus court pour caler visuellement “Durée en année”

const DEFAULT_INPUT = {
  duration: 16,          // horizon back (sera remplacé par le max des durées demandées)
  custom1Years: 20,      // compat back
  products: [
    { name:'Placement 1 Capitalisation', rate:0.05,  initial:563750, entryFeePct:0.00 },
    { name:'Placement 2 Capitalisation', rate:0.04,  initial:570000, entryFeePct:0.00 },
    { name:'Placement 3 Distribution',   rate:0.04,  initial:97000,  entryFeePct:0.085 },
    { name:'Placement 4 Distribution',   rate:0.05,  initial:100000, entryFeePct:0.00 },
  ]
}

// rend “Placement 1 <br/> Capitalisation”
function TwoLineName({name}){
  const m = name.match(/^(.*)\s+(Capitalisation|Distribution)$/i)
  if(!m) return name
  return (<span>{m[1]}<br/>{m[2]}</span>)
}

export default function Placement(){
  const [inp, setInp] = useState(()=>{
    const saved = localStorage.getItem('ser1:sim:placement:inp')
    const base = saved ? JSON.parse(saved) : DEFAULT_INPUT
    // normalise/renomme aux nouveaux intitulés
    const names = DEFAULT_INPUT.products.map(p=>p.name)
    const products = (base.products || []).slice(0,4).map((p,i)=> ({...p, name: names[i] || p.name}))
    return { ...base, products }
  })

  // Durées par colonne (par défaut 20 ans)
  const [durations, setDurations] = useState(() => Array.from({length: DEFAULT_INPUT.products.length}, () => 20))
  // Versements programmés (montant + fréquence) — uniquement colonnes 0 et 1
  const [contribs, setContribs] = useState(() =>
    Array.from({length: DEFAULT_INPUT.products.length}, (_,i)=> ({
      amount: (i<2)? 0 : 0,
      freq:   (i<2)? 'annuel' : 'annuel'  // 'mensuel' | 'annuel'
    }))
  )

  useEffect(()=>{
    // recadre si nb de colonnes change
    setDurations(prev=>{
      const n = inp.products.length
      return Array.from({length:n}, (_,i)=> prev[i] ?? 20)
    })
    setContribs(prev=>{
      const n = inp.products.length
      return Array.from({length:n}, (_,i)=> prev[i] ?? {amount:0, freq:'annuel'})
    })
  }, [inp.products.length])

  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const setProd  = (i,patch)=> setInp(p=>({
    ...p,
    products:p.products.map((x,idx)=> idx===i?{...x,...patch}:x)
  }))

  const onCalc = async ()=>{
    setLoading(true); setError(null)
    try{
      const maxDur = Math.max(...durations, inp.duration || 0, 1)
      // on greffe les versements sur les produits pour un back futur-compat
      const productsWithContrib = inp.products.map((p,i)=> ({
        ...p,
        contribAmount: contribs[i]?.amount || 0,
        contribFreq: contribs[i]?.freq || 'annuel'
      }))

      const payload = {
        ...inp,
        products: productsWithContrib,
        duration: maxDur,                 // garantit un calcul jusqu’à l’année max demandée
        custom1Years: durations[0] || inp.custom1Years
      }

      const r = await fetch(`${API_BASE}/api/placement`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
      })
      const txt = await r.text(); const j = txt? JSON.parse(txt):null
      if(!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j)
      localStorage.setItem('ser1:sim:placement:inp', JSON.stringify(inp))
    }catch(e){ setError(e.message) }
    finally{ setLoading(false) }
  }

  // séries affichées (sans Total)
  const yearsAll = res?.years ?? []
  const maxDisplay = Math.max(...durations, 0)
  const years = yearsAll.slice(0, maxDisplay) // n’affiche que jusqu’à l’année max demandée
  const series = useMemo(()=> (res?.series ?? []).filter(s=> s.name !== 'Total'), [res])

  return (
    <div className="panel">
      <div className="plac-title">Comparer différents placements</div>

      <div className="plac-table-wrap">
        <table className="plac-table" role="grid" aria-label="tableau placement">
          <thead>
            <tr>
              <th></th>
              {inp.products.map((p,i)=> (
                <th key={i}>
                  <TwoLineName name={p.name}/>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Rendement Net de FG — % */}
            <tr>
              <td className="cell-muted">Rendement Net de FG</td>
              {inp.products.map((p,i)=>{
                const ratePct = (p.rate ?? 0) * 100
                return (
                  <td key={i} className="input-cell">
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                      <input
                        type="number" step="0.01" value={Number(ratePct.toFixed(2))}
                        onChange={e=>setProd(i,{rate:(+e.target.value||0)/100})}
                        style={{width:INPUT_W, textAlign:'right'}}
                      />
                      <span>%</span>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Placement initial — € */}
            <tr>
              <td className="cell-strong">Placement Initial</td>
              {inp.products.map((p,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatIntFr(p.initial ?? 0)}
                      onChange={e=> {
                        const val = toNumber(e.target.value)
                        setProd(i,{initial: val})
                      }}
                      onBlur={e=>{
                        const val = toNumber(e.target.value)
                        setProd(i,{initial: val})
                        e.target.value = formatIntFr(val)
                      }}
                      style={{width:INPUT_W, textAlign:'right'}}
                    />
                    <span>€</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Frais d’entrée — % */}
            <tr>
              <td className="cell-muted">Frais d’entrée</td>
              {inp.products.map((p,i)=>{
                const feePct = (p.entryFeePct ?? 0) * 100
                return (
                  <td key={i} className="input-cell">
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                      <input
                        type="number" step="0.01" value={Number(feePct.toFixed(2))}
                        onChange={e=>setProd(i,{entryFeePct:(+e.target.value||0)/100})}
                        style={{width:INPUT_W, textAlign:'right'}}
                      />
                      <span>%</span>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Versement programmé — € + fréquence (seulement col 1 & 2) */}
            <tr>
              <td className="cell-strong">Versement programmé</td>
              {inp.products.map((_,i)=>(
                <td key={i} className="input-cell">
                  {i < 2 ? (
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatIntFr(contribs[i].amount)}
                        onChange={e=>{
                          const v = toNumber(e.target.value)
                          setContribs(prev=>{
                            const c = prev.slice(); c[i] = {...c[i], amount:v}; return c
                          })
                        }}
                        onBlur={e=>{
                          const v = toNumber(e.target.value)
                          e.target.value = formatIntFr(v)
                        }}
                        style={{width:INPUT_W-20, textAlign:'right'}}
                      />
                      <span>€</span>
                      <select
                        value={contribs[i].freq}
                        onChange={e=>{
                          setContribs(prev=>{
                            const c = prev.slice(); c[i] = {...c[i], freq:e.target.value}; return c
                          })
                        }}
                        style={{height:32}}
                      >
                        <option value="mensuel">mensuel</option>
                        <option value="annuel">annuel</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{textAlign:'right', color:'#777'}}>—</div>
                  )}
                </td>
              ))}
            </tr>

            {/* Durée en année — par colonne */}
            <tr>
              <td className="cell-strong">Durée en année</td>
              {inp.products.map((_,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                    <input
                      type="number"
                      min="1"
                      value={durations[i]}
                      onChange={e=>{
                        const v = Math.max(1, +e.target.value||1)
                        setDurations(prev=>{
                          const copy = prev.slice()
                          copy[i] = v
                          return copy
                        })
                      }}
                      style={{width:INPUT_W_DUR, textAlign:'right'}}
                    />
                    <span>an(s)</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Lignes Année N — on tronque par colonne et on limite à année max */}
            {years.map((y, yi)=>(
              <tr key={yi}>
                <td>{`Année ${y}`}</td>
                {series.map((s, si)=> {
                  const show = (yi + 1) <= (durations[si] || 1)
                  return (
                    <td key={si} className="cell-strong">
                      {show ? euro(s.values[yi]) : ''}
                    </td>
                  )
                })}
              </tr>
            ))}

          </tbody>
        </table>

        <div style={{marginTop:10, display:'flex', gap:8}}>
          <button className="chip" onClick={onCalc} disabled={loading}>
            {loading ? 'Calcul…' : 'Calculer'}
          </button>
          {error && <span className="cell-muted" style={{color:'#b00'}}>Erreur : {error}</span>}
        </div>
      </div>

      {/* Graphique dessous */}
      <div className="chart-card" style={{marginTop:20}}>
        <SmoothChart res={res}/>
      </div>
    </div>
  )
}

/** Graphique SVG fluide + labels non chevauchants */
function SmoothChart({res}){
  if(!res?.series?.length) return <div className="cell-muted">Le graphique s’affichera après calcul.</div>

  const { W,H,P,paths } = useMemo(()=>{
    const W=720, H=420, P=40
    let max=0
    res.series.forEach(s=>s.values.forEach(v=>{ if(v>max) max=v }))
    const x = i => P + i*((W-2*P)/(res.years.length-1||1))
    const y = v => H-P - ((v/max)*(H-2*P))
    const paths = res.series.map(s => s.values.map((v,i)=>`${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' '))
    return { W,H,P,paths }
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
      </svg>

      <div className="chart-legend">
        {res.series.map((s,si)=>(
          <div key={si}><span className="legend-dot" style={{background:COLORS[si%COLORS.length]}}/> {s.name}</div>
        ))}
      </div>
    </>
  )
}
