import React, { useMemo, useState } from 'react'
<label>Durée (années)
<input type="number" value={inp.duration} onChange={e=>handleChange('duration', +e.target.value)} />
</label>
<label>Horizon perso (années)
<input type="number" value={inp.custom1Years} onChange={e=>handleChange('custom1Years', +e.target.value)} />
</label>
<h3>Produits</h3>
{inp.products.map((p,i)=> (
<div key={i} style={{border:'1px solid #ddd', padding:8, borderRadius:8, marginBottom:8}}>
<input style={{width:'100%'}} value={p.name} onChange={e=>setProd(i,{name:e.target.value})}/>
<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
<label>Taux
<input type="number" step="0.001" value={p.rate} onChange={e=>setProd(i,{rate:+e.target.value})}/>
</label>
<label>Initial (€)
<input type="number" value={p.initial} onChange={e=>setProd(i,{initial:+e.target.value})}/>
</label>
<label>Frais entrée (%)
<input type="number" step="0.001" value={p.entryFeePct} onChange={e=>setProd(i,{entryFeePct:+e.target.value})}/>
</label>
</div>
</div>
))}
<button onClick={onCalc}>Calculer</button>
<div style={{marginTop:8, color:'#666'}}>Total initial : {fmt(totalInitial)} €</div>
</div>


<div>
<h2>Résultats</h2>
<ChartPanel res={res} />
{res?.horizon ? (
<div style={{marginTop:12}}>
<strong>Valeur à {res.horizon.year} ans :</strong> {fmt(res.horizon.total)} €
</div>
) : null}
</div>
</div>
)
}


function ChartPanel({res}){
if(!res?.series?.length) return <div style={{color:'#666'}}>Le graphique s’affichera après calcul.</div>
const W=560,H=320,P=40; let max=0; res.series.forEach(s=>s.values.forEach(v=>{if(v>max)max=v}))
const x=(i)=> P + i*((W-2*P)/(res.years.length-1||1))
const y=(v)=> H-P - ((v/max)*(H-2*P))
const colors=['#2C3D38','#CEC1B6','#E4D0BB','#888888','#444555']
return (
<svg width={W} height={H}>
<line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="#bbb"/>
<line x1={P} y1={P} x2={P} y2={H-P} stroke="#bbb"/>
{res.series.map((s,si)=>{
const d=s.values.map((v,i)=>`${i===0? 'M':'L'} ${x(i)} ${y(v)}`).join(' ')
return <path key={si} d={d} fill="none" stroke={colors[si%colors.length]} strokeWidth="2.5"/>
})}
{res.series.map((s,si)=>{
const i=s.values.length-1; const v=s.values[i]
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
