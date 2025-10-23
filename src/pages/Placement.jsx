import React, { useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
const fmt = n => n?.toLocaleString?.('fr-FR', { maximumFractionDigits: 0 }) ?? n

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
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const totalInitial = useMemo(
    ()=> inp.products?.reduce((a,p)=>a+(+p.initial||0),0),
    [inp]
  )

  const handleChange = (k, v) => setInp(prev => ({ ...prev, [k]: v }))
  const setProd = (i, patch) => setInp(prev => ({
    ...prev,
    products: prev.products.map((p,idx)=> idx===i ? { ...p, ...patch } : p)
  }))

  const onCalc = async () => {
    setLoading(true); setError(null); setRes(null)
    try{
      const r = await fetch(`${API_BASE}/api/placement`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(inp)
      })
      const text = await r.text()
      const j = text ? JSON.parse(text) : null
      if(!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j)
      localStorage.setItem('ser1:sim:placement:inp', JSON.stringify(inp))
    }catch(e){
      setError(e.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div style={{display:'grid', gap:16, gridTemplateColumns:'1fr 1fr'}}>
      <div>
        <h2>Paramètres</h2>

        <label style={{display:'block', marginBottom:8}}>
          Durée (années)
          <input
            type="number"
            value={inp.duration}
            onChange={e=>handleChange('duration', +e.target.value)}
            style={{display:'block', width:'100%'}}
          />
        </label>

        <label style={{display:'block', marginBottom:8}}>
          Horizon perso (années)
          <input
            type="number"
            value={inp.custom1Years}
            onChange={e=>handleChange('custom1Years', +e.target.value)}
            style={{display:'block', width:'100%'}}
          />
        </label>

        <h3>Produits</h3>
        {inp.products.map((p,i)=> (
          <div key={i} style={{border:'1px solid #ddd', padding:8, borderRadius:8, marginBottom:8}}>
            <input
              style={{width:'100%', marginBottom:8}}
              value={p.name}
              onChange={e=>setProd(i,{name:e.target.value})}
            />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label>
                Taux
                <input
                  type="number"
                  step="0.001"
                  value={p.rate}
                  onChange={e=>setProd(i,{rate:+e.target.value})}
                  style={{display:'block', width:'100%'}}
                />
              </label>
              <label>
                Initial (€)
                <input
                  type="number"
                  value={p.initial}
                  onChange={e=>setProd(i,{initial:+e.target.value})}
                  style={{display:'block', width:'100%'}}
                />
              </label>
              <label>
                Frais entrée (%) (ex: 0.085 = 8.5%)
                <input
                  type="number"
                  step="0.001"
                  value={p.entryFeePct}
                  onChange={e=>setProd(i,{entryFeePct:+e.target.value})}
                  style={{display:'block', width:'100%'}}
                />
              </label>
            </div>
          </div>
        ))}

        <button onClick={onCalc} disabled={loading}>
          {loading ? 'Calcul…' : 'Calculer'}
        </button>

        {error && (
          <div style={{color:'#b00', background:'#fee', padding:8, borderRadius:6, marginTop:8}}>
            Erreur : {error}
          </div>
        )}

        <div style={{marginTop:8, color:'#666'}}>
          Total initial : {fmt(totalInitial)} €
        </div>
      </div>

      <div>
        <h2>Résultats</h2>
        <ChartPanel res={res} />
        {res?.horizon && (
          <div style={{marginTop:12}}>
            <strong>Valeur à {res.horizon.year} ans :</strong> {fmt(res.horizon.total)} €
          </div>
        )}
      </div>
    </div>
  )
}

function ChartPanel({ res }){
  if(!res?.series?.length)
    return <div style={{color:'#666'}}>Le graphique s’affichera après calcul.</div>

  const W=560, H=320, P=40
  let max=0
  res.series.forEach(s => s.values.forEach(v => { if(v>max) max=v }))

  const x = (i) => P + i*((W-2*P)/(res.years.length-1||1))
  const y = (v) => H-P - ((v/max)*(H-2*P))
  const colors = ['#2C3D38','#CEC1B6','#E4D0BB','#888888','#444555']

  return (
    <svg width={W} height={H}>
      <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="#bbb"/>
      <line x1={P} y1={P} x2={P} y2={H-P} stroke="#bbb"/>

      {res.series.map((s,si)=>{
        const d = s.values.map((v,i)=>`${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' ')
        return <path key={si} d={d} fill="none" stroke={colors[si%colors.length]} strokeWidth="2.5"/>
      })}

      {res.series.map((s,si)=>{
        const i = s.values.length-1
        const v = s.values[i]
        return (
          <g key={'lbl'+si}>
            <circle cx={x(i)} cy={y(v)} r={3}/>
            <text x={x(i)+6} y={y(v)-4} fontSize="12" fill="#333">{s.name}</text>
            <text x={x(i)+6} y={y(v)+12} fontSize="12" fill="#333">{fmt(v)} €</text>
          </g>
        )
      })}
    </svg>
  )
}
