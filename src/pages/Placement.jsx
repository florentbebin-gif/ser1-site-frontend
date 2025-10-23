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

/* ===== Largeurs pour alignement ===== */
const W_MAIN = 150;  // % / € / etc.
const W_DUR  = 140;  // Durée
const W_VERS = 84;   // Montant "Versement programmé" (XX XXX)

/* ===== Données par défaut ===== */
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

const DEFAULT_PRODUCTS = [
  { name:'Placement 1 Capitalisation', rate:0.05,  initial:100000, entryFeePct:0.00 },
  { name:'Placement 2 Capitalisation', rate:0.04,  initial:0,      entryFeePct:0.00 },
  { name:'Placement 3 Distribution',   rate:0.04,  initial:97000,  entryFeePct:0.085 },
  { name:'Placement 4 Distribution',   rate:0.05,  initial:100000, entryFeePct:0.00 },
]

const defaultDurations = [10,25,5,5]
const defaultContribs  = DEFAULT_PRODUCTS.map((_,i)=>({
  amount: (i<2)? 0 : 0,
  freq:   (i<2)? 'mensuel' : 'annuel', // 1 & 2 actifs, 3 & 4 affichent "—"
}))

/* ===========================================================
   CALCULS — intérêts mensuels NON composés (pro-rata simple)
   -----------------------------------------------------------
   - nbMoisAnnée = 13 - mStart (mStart = mois de souscription en A1, sinon 1)
   - Capital de début d’année (fin N-1) → intérêts : capital * taux * (nbMois/12)
   - Initial (A1) : net de frais, intérêts pro-rata nbMois/12
   - Mensuels : pour m de mStart→12 (A1), puis 1→12 (A>=2) :
       intérêts = versementNet * taux * ((13 - m)/12)
   - Annuels : un versement au mois de souscription mSub chaque année :
       intérêts = versementNet * taux * ((13 - mSub)/12)
   - versementNet = montant * (1 - frais)
=========================================================== */
function simulateProductLinear({ rate, initial, entryFeePct }, startMonth, contrib, durYears, yearsMax){
  const r = rate || 0
  const fee = entryFeePct || 0
  const initialNet = toNum(initial) * (1 - fee)

  const values = []
  let endPrevYear = 0

  for(let y=1; y<=yearsMax; y++){
    const mStart = (y === 1 ? startMonth : 1)            // mois de départ pour l'année y
    const nbMois = 13 - mStart                           // nb de mois réellement courus dans l'année y

    let total = 0

    // 1) capital de début d’année (fin N-1) + intérêts pro-rata
    total += endPrevYear
    total += endPrevYear * r * (nbMois/12)

    // 2) placement initial (uniquement A1)
    if (y === 1 && initialNet > 0){
      total += initialNet
      total += initialNet * r * (nbMois/12)
    }

    // 3) versements programmés (nets de frais d’entrée)
    if (contrib && contrib.amount > 0){
      const amtNet = toNum(contrib.amount) * (1 - fee)

      if (contrib.freq === 'mensuel'){
        // A1 : de mStart → 12, A>=2 : 1 → 12
        const mFirst = (y === 1 ? mStart : 1)
        for(let m = mFirst; m <= 12; m++){
          const monthsRem = 13 - m
          total += amtNet
          total += amtNet * r * (monthsRem/12)
        }
      } else { // 'annuel' — au mois de souscription chaque année
        const monthsRem = 13 - startMonth
        total += amtNet
        total += amtNet * r * (monthsRem/12)
      }
    }

    // 4) fin d’année
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

  const setProd     = (i,patch)=> setProducts(a=>a.map((p,idx)=> idx===i ? {...p, ...patch} : p))
  const setDuration = (i,v)=> setDurations(a=>a.map((x,idx)=> idx===i ? Math.max(1, v||1) : x))
  const setContrib  = (i,patch)=> setContribs(a=>a.map((c,idx)=> idx===i ? {...c, ...patch} : c))

  // Résultats (calculés côté front)
  const result = useMemo(()=>{
    const yearsMax = Math.max(...durations, 1)
    const sims = products.map((p,i)=>
      simulateProductLinear(
        {
          rate: Number(p.rate)||0,
          initial: toNum(p.initial),
          entryFeePct: Number(p.entryFeePct)||0
        },
        startMonth,
        (i<2 && contribs[i]?.amount>0) ? { amount: toNum(contribs[i].amount), freq: contribs[i].freq } : null,
        durations[i],
        yearsMax
      )
    )
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
          (Décembre ⇒ 1/12 d’intérêts la 1ʳᵉ année ; les versements annuels se font au mois de souscription)
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
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                      <input
                        type="number" step="0.01"
                        value={Number(ratePct.toFixed(2))}
                        onChange={e=> setProd(i,{rate:(+e.target.value||0)/100})}
                        style={{width:W_MAIN, textAlign:'right'}}
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
                  <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                    <input
                      type="text" inputMode="numeric"
                      value={fmtInt(p.initial)}
                      onChange={e=> setProd(i,{initial: toNum(e.target.value)})}
                      onBlur={e=> e.target.value = fmtInt(toNum(e.target.value))}
                      style={{width:W_MAIN, textAlign:'right'}}
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
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                      <input
                        type="number" step="0.01"
                        value={Number(feePct.toFixed(2))}
                        onChange={e=> setProd(i,{entryFeePct:(+e.target.value||0)/100})}
                        style={{width:W_MAIN, textAlign:'right'}}
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
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                      <input
                        type="text" inputMode="numeric"
                        value={fmtInt(contribs[i].amount)}
                        onChange={e=> setContrib(i,{amount: toNum(e.target.value)})}
                        onBlur={e=> e.target.value = fmtInt(toNum(e.target.value))}
                        style={{width:W_VERS, textAlign:'right'}}
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
                    <div style={{textAlign:'right', color:'#777'}}>—</div>
                  )}
                </td>
              ))}
            </tr>

            {/* Durée en année */}
            <tr>
              <td className="cell-strong">Durée en année</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end'}}>
                    <input
                      type="number" min="1"
                      value={durations[i]}
                      onChange={e=> setDuration(i, +e.target.value||1)}
                      style={{width:W_DUR, textAlign:'right'}}
                    />
                    <span>an(s)</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Lignes Année N (limitées à l'année max & masquées par colonne si > durée) */}
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
    </div>
  )
}
