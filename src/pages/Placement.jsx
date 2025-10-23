import React, { useMemo, useState } from 'react'

/** ---------- Helpers formatting ---------- */
const euro = (n)=> (n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtInt = (n)=> (Math.round(n) || 0).toLocaleString('fr-FR')
const toNumber = (v)=> {
  if (typeof v === 'number') return v
  const s = String(v || '').replace(/[^\d.-]/g,'')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/** ---------- UI constants (alignements) ---------- */
const W_MAIN = 140;       // largeur champs “classiques” (% / €)
const W_DUR  = 130;       // largeur “Durée en année”
const W_VERS = 100;       // largeur montant “Versement programmé” (un peu réduit)

/** ---------- Domain defaults ---------- */
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

// Les 4 placements, déjà renommés
const DEFAULT_PRODUCTS = [
  { name:'Placement 1 Capitalisation', rate:0.05,  initial:563750, entryFeePct:0.00 },
  { name:'Placement 2 Capitalisation', rate:0.04,  initial:570000, entryFeePct:0.00 },
  { name:'Placement 3 Distribution',   rate:0.04,  initial:97000,  entryFeePct:0.085 },
  { name:'Placement 4 Distribution',   rate:0.05,  initial:100000, entryFeePct:0.00 },
]

// ligne de saisie “versement programmé” (actif que pour les 2 premières colonnes)
const defaultContribs = DEFAULT_PRODUCTS.map((_,i)=> ({
  amount: (i < 2) ? 0 : 0,
  freq:   (i < 2) ? 'annuel' : 'annuel', // 'mensuel' | 'annuel'
}))

const defaultDurations = [10, 25, 5, 5]  // exemple de durées par colonne

/** =========================================================
 *        Calcul local : intérêts au mois + versements
 * ======================================================== */

/**
 * Simule un placement mois par mois.
 * - startMonth: 1..12 (1 = Janvier, ... 12 = Décembre)
 * - rate: taux net annuel (ex 0.05)
 * - entryFeePct: frais d’entrée (0..1) appliqués au placement initial uniquement
 * - contrib: { amount, freq: 'mensuel'|'annuel' }
 * - durYears: durée (années) jusqu’où on affiche pour cette colonne
 * - yearsMax: horizon global de calcul (max des durées des colonnes)
 */
function simulateProduct({rate, initial, entryFeePct}, startMonth, contrib, durYears, yearsMax){
  const rM = (rate ?? 0) / 12
  const values = []
  let balance = 0
  let initialApplied = false

  for(let y=1; y<=yearsMax; y++){
    const mStart = (y === 1) ? startMonth : 1
    for(let m=mStart; m<=12; m++){
      // 1) placement initial net au mois de souscription (1 seule fois)
      if(!initialApplied && y===1 && m===startMonth){
        balance += (toNumber(initial) || 0) * (1 - (entryFeePct || 0))
        initialApplied = true
      }

      // 2) versement programmé
      if(contrib && contrib.amount > 0){
        if(contrib.freq === 'mensuel'){
          // versement chaque mois (à partir du mois de souscription en année 1)
          if(y>1 || m>=startMonth) balance += contrib.amount
        }else{
          // versement annuel en DÉCEMBRE uniquement (m === 12)
          if(m === 12) balance += contrib.amount
        }
      }

      // 3) intérêts du mois
      balance *= (1 + rM)
    }

    // valeur de fin d'année
    values.push(balance)
  }

  // Au-delà de la durée de la colonne, on masque (undefined pour l’affichage)
  return values.map((v,idx)=> (idx+1) <= durYears ? v : undefined)
}

/** =========================================================
 *             Composant principal
 * ======================================================== */
export default function Placement(){
  const [startMonth, setStartMonth] = useState(12) // Décembre par défaut (1=Janvier,...,12=Décembre)
  const [products, setProducts]     = useState(DEFAULT_PRODUCTS)
  const [durations, setDurations]   = useState(defaultDurations)
  const [contribs, setContribs]     = useState(defaultContribs)

  // champs contrôlés : setters par colonne
  const setProd = (i, patch) =>
    setProducts(arr => arr.map((p,idx)=> idx===i ? {...p, ...patch} : p))

  const setDuration = (i, v) =>
    setDurations(arr => arr.map((x,idx)=> idx===i ? Math.max(1, v||1) : x))

  const setContrib = (i, patch) =>
    setContribs(arr => arr.map((c,idx)=> idx===i ? {...c, ...patch} : c))

  // Calcul local sur clic “Calculer”
  const result = useMemo(()=>{
    const yearsMax = Math.max(...durations)
    // transforme les champs formatés en nombres (pour éviter surprises)
    const normalized = products.map((p,i)=> ({
      rate:       Number(p.rate) || 0,
      initial:    toNumber(p.initial),
      entryFeePct:Number(p.entryFeePct) || 0,
      name:       p.name
    }))
    const sims = normalized.map((p,i)=>
      simulateProduct(
        p,
        startMonth,
        (contribs[i]?.amount>0 ? { amount: toNumber(contribs[i].amount), freq: contribs[i].freq } : null),
        durations[i],
        yearsMax
      )
    )
    return {
      years: Array.from({length: yearsMax}, (_,k)=> k+1),
      series: sims.map((vals,i)=> ({ name: normalized[i].name, values: vals }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, durations, contribs, startMonth])

  const years  = result.years
  const series = result.series

  return (
    <div className="panel">
      <div className="plac-title">Comparer différents placements</div>

      {/* Mois de souscription : à gauche (au-dessus du tableau) */}
      <div style={{display:'flex', alignItems:'center', gap:12, margin:'0 0 10px 0'}}>
        <div className="cell-strong">Mois de souscription</div>
        <select
          value={startMonth}
          onChange={e=> setStartMonth(Number(e.target.value))}
          style={{height:32}}
        >
          {MONTHS.map((m,idx)=> <option key={idx} value={idx+1}>{m}</option>)}
        </select>
        <span className="cell-muted" style={{fontSize:13}}>
          (Décembre ⇒ 1/12 d’intérêts la 1ʳᵉ année ; les versements annuels sont versés en décembre)
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
            {/* Rendement Net de FG — % */}
            <tr>
              <td className="cell-muted">Rendement Net de FG</td>
              {products.map((p,i)=>{
                const ratePct = (Number(p.rate)||0)*100
                return (
                  <td key={i} className="input-cell">
                    <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                      <input
                        type="number" step="0.01"
                        value={Number(ratePct.toFixed(2))}
                        onChange={e=> setProd(i,{rate:(+e.target.value||0)/100})}
                        style={{width:W_MAIN,textAlign:'right'}}
                      />
                      <span>%</span>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Placement initial — € formaté */}
            <tr>
              <td className="cell-strong">Placement Initial</td>
              {products.map((p,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                    <input
                      type="text" inputMode="numeric"
                      value={fmtInt(p.initial)}
                      onChange={e=> setProd(i,{initial: toNumber(e.target.value)})}
                      onBlur={e=> e.target.value = fmtInt(toNumber(e.target.value))}
                      style={{width:W_MAIN,textAlign:'right'}}
                    />
                    <span>€</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Frais d’entrée — % */}
            <tr>
              <td className="cell-muted">Frais d’entrée</td>
              {products.map((p,i)=>{
                const feePct = (Number(p.entryFeePct)||0)*100
                return (
                  <td key={i} className="input-cell">
                    <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                      <input
                        type="number" step="0.01"
                        value={Number(feePct.toFixed(2))}
                        onChange={e=> setProd(i,{entryFeePct:(+e.target.value||0)/100})}
                        style={{width:W_MAIN,textAlign:'right'}}
                      />
                      <span>%</span>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Versement programmé : colonnes 0 & 1 uniquement */}
            <tr>
              <td className="cell-strong">Versement programmé</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  {i < 2 ? (
                    <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                      <input
                        type="text" inputMode="numeric"
                        value={fmtInt(contribs[i].amount)}
                        onChange={e=> setContrib(i,{amount: toNumber(e.target.value)})}
                        onBlur={e=> e.target.value = fmtInt(toNumber(e.target.value))}
                        style={{width:W_VERS,textAlign:'right'}}
                      />
                      <span>€</span>
                      <select
                        value={contribs[i].freq}
                        onChange={e=> setContrib(i,{freq:e.target.value})}
                        style={{height:32}}
                      >
                        <option value="mensuel">mensuel</option>
                        <option value="annuel">annuel (déc.)</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{textAlign:'right', color:'#777'}}>—</div>
                  )}
                </td>
              ))}
            </tr>

            {/* Durée en année — par colonne (alignée à gauche visuellement) */}
            <tr>
              <td className="cell-strong">Durée en année</td>
              {products.map((_,i)=>(
                <td key={i} className="input-cell">
                  <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                    <input
                      type="number" min="1"
                      value={durations[i]}
                      onChange={e=> setDuration(i, +e.target.value||1)}
                      style={{width:W_DUR,textAlign:'right'}}
                    />
                    <span>an(s)</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Lignes Année N : affichage tronqué par colonne et limité à l'année max */}
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

        <div style={{marginTop:12}}>
          <button className="chip">Calculer</button>
          <span className="cell-muted" style={{marginLeft:10,fontSize:13}}>
            (le tableau ci-dessus se met à jour immédiatement)
          </span>
        </div>
      </div>

      {/* Graphique dessous (facultatif – garde les mêmes années max) */}
      {/* Tu peux conserver ton composant de graphe existant si besoin */}
    </div>
  )
}
