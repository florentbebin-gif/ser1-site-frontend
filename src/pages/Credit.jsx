import React, { useMemo, useState } from 'react'

/* ---------- Utils format ---------- */
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]
const fmt0 = (n)=> (Math.round(Number(n)||0)).toLocaleString('fr-FR')
const euro0 = (n)=> fmt0(n) + ' €'
const toNum  = (v)=> {
  if (typeof v === 'number') return v
  const s = String(v || '').replace(/[^\d.-]/g,'')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/* ---------- Composant principal ---------- */
export default function Credit(){

  /* ---- États principaux ---- */
  const [creditType, setCreditType] = useState('amortissable') // 'amortissable' | 'infine'
  const [startMonth, setStartMonth] = useState(1)              // Janvier=1
  const [capital, setCapital]       = useState(300000)         // Montant emprunté (8 chiffres max)
  const [duree, setDuree]           = useState(240)            // Durée en mois (3 chiffres max)
  const [taux, setTaux]             = useState(3.50)           // % annuel
  const [tauxAssur, setTauxAssur]   = useState(0.30)           // % annuel
  const [mensuBase, setMensuBase]   = useState('')             // champ de saisie (string formaté)

  // Paliers: { id, start, months, mensu, taux }
  const [paliers, setPaliers] = useState([])

  /* ---- Handlers inputs bornés ---- */
  const onChangeCapital = (val) => {
    const clean = String(val).replace(/\D/g,'').slice(0,8)     // 8 chiffres
    setCapital(toNum(clean))
  }
  const onChangeDuree = (val) => {
    const clean = String(val).replace(/\D/g,'').slice(0,3)     // 3 chiffres
    setDuree(Math.max(1, toNum(clean)))
  }
  const onChangeMensuBase = (val) => {
    const clean = String(val).replace(/[^\d]/g,'').slice(0,8)
    setMensuBase(clean ? Number(clean).toLocaleString('fr-FR') : '')
  }

  /* ---- Taux mensuels ---- */
  const rAn  = Math.max(0, Number(taux) || 0)/100
  const rAss = Math.max(0, Number(tauxAssur) || 0)/100
  const r    = rAn / 12
  const rA   = rAss / 12
  const N    = Math.max(1, Math.floor(duree || 0))

  /* ---- Mensualité de base ou calcul du capital si saisie mensu ---- */
  const mensuHorsAssurance_base = useMemo(()=>{
    if (creditType === 'infine') {
      // intérêt seul (hors assurance), capital remboursé au dernier mois
      return r === 0 ? 0 : capital * r
    }
    // Amortissable standard
    if (r === 0) return capital / N
    return (capital * r) / (1 - Math.pow(1 + r, -N))
  }, [creditType, capital, r, N])

  // Si l'utilisateur saisit une mensualité (sans paliers), recalculer le capital
  const effectiveCapital = useMemo(()=>{
    const hasPaliers = paliers.length > 0
    const mensuUser = toNum(mensuBase)
    if (!mensuUser || hasPaliers) return capital // pas de recalcul si paliers
    if (creditType === 'infine') {
      // m = C * r  => C = m/r  (si r=0, on ne peut pas déterminer)
      return (r === 0) ? capital : Math.floor(mensuUser / r)
    }
    // amortissable : C = m * (1 - (1+r)^-N) / r   (si r=0 => C = m*N)
    if (r === 0) return Math.floor(mensuUser * N)
    const C = mensuUser * (1 - Math.pow(1+r, -N)) / r
    return Math.floor(C)
  }, [capital, paliers.length, mensuBase, creditType, r, N])

  const mensuBaseEffective = useMemo(()=>{
    const hasPaliers = paliers.length > 0
    const mensuUser = toNum(mensuBase)
    if (hasPaliers) return mensuHorsAssurance_base // les paliers dictent ensuite
    return mensuUser ? mensuUser : mensuHorsAssurance_base
  }, [paliers.length, mensuBase, mensuHorsAssurance_base])

  /* ---- Construction de la timeline de paliers (mois 1..N) ---- */
  const palMap = useMemo(()=>{
    // génère un tableau de N entrées { mensu:?, taux:? } si défini
    const arr = Array.from({length:N}, () => ({}))
    paliers.forEach(p=>{
      const s = Math.max(1, Math.floor(p.start || 1))
      const d = Math.max(1, Math.floor(p.months || 0))
      const e = Math.min(N, s + d - 1)
      for(let m=s; m<=e; m++){
        const i = m-1
        if (p.mensu !== '' && p.mensu != null) {
          arr[i].mensu = Math.max(0, toNum(String(p.mensu).replace(/\D/g,'')))
        }
        if (p.taux !== '' && p.taux != null) {
          const t = Math.max(0, Number(p.taux)||0)/100/12
          arr[i].taux = t
        }
      }
    })
    return arr
  }, [paliers, N])

  /* ---- Calcul du tableau d’amortissement ---- */
  const table = useMemo(()=>{
    const rows = []
    let crd = effectiveCapital
    for(let m=1; m<=N; m++){
      const idx = m-1
      const rM  = palMap[idx].taux ?? r   // taux du mois
      // mensualité hors assurance pour ce mois :
      let mHorsAss = palMap[idx].mensu ?? mensuBaseEffective
      if (creditType === 'infine'){
        // Paiement d'intérêt uniquement, CRD remboursé au dernier mois
        const interet = crd * rM
        let amort = (m === N) ? crd : 0
        // Si l'utilisateur a saisi une mensualité (ou palier), on respecte ce montant,
        // mais on s'assure au mois N de solder le capital
        if (mHorsAss > 0 && m !== N) {
          // l'utilisateur peut payer + que les intérêts : on amortit le surplus
          const surplus = Math.max(0, mHorsAss - interet)
          amort = Math.min(crd, surplus)
        }
        crd = Math.max(0, crd - amort)
        const assur = crd * rA
        const mTotal = mHorsAss + assur
        rows.push({ mois: m, interet, assurance: assur, amort, mensu: mHorsAss, mensuTotal: mTotal, crd })
      } else {
        // Amortissable
        const interet = crd * rM
        // si la mensualité définie est insuffisante pour couvrir les intérêts, on la rehausse
        if (mHorsAss < interet && rM > 0) mHorsAss = interet
        let amort = Math.min(crd, mHorsAss - interet)
        if (!Number.isFinite(amort) || amort < 0) amort = 0
        crd = Math.max(0, crd - amort)
        const assur = crd * rA
        const mTotal = mHorsAss + assur
        rows.push({ mois: m, interet, assurance: assur, amort, mensu: mHorsAss, mensuTotal: mTotal, crd })
      }
    }
    return rows
  }, [creditType, effectiveCapital, N, palMap, mensuBaseEffective, rA])

  const coutInterets = useMemo(()=> table.reduce((s,l)=> s + l.interet, 0), [table])
  const coutAssur    = useMemo(()=> table.reduce((s,l)=> s + l.assurance,0), [table])

  /* ---- UI helpers ---- */
  const addPalier = () => {
    setPaliers(arr => [
      ...arr,
      { id:cryptoRandom(), start:1, months:12, mensu:'', taux:'' }
    ])
  }
  const updatePalier = (id, patch) => {
    setPaliers(arr => arr.map(p => p.id === id ? {...p, ...patch} : p))
  }
  const removePalier = (id) => setPaliers(arr => arr.filter(p => p.id !== id))
  function cryptoRandom() {
    // petit id unique
    return Math.random().toString(36).slice(2,9)
  }

  return (
    <div className="panel">
      <div className="plac-title">Simulateur de crédit</div>

      {/* Bandeau paramètres globaux */}
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12, flexWrap:'wrap'}}>
        <div className="cell-strong">Type de crédit</div>
        <select value={creditType} onChange={e=> setCreditType(e.target.value)} style={{height:32}}>
          <option value="amortissable">Amortissable</option>
          <option value="infine">In fine</option>
        </select>

        <div className="cell-strong" style={{marginLeft:18}}>Mois de souscription</div>
        <select value={startMonth} onChange={e=> setStartMonth(Number(e.target.value))} style={{height:32}}>
          {MONTHS.map((m,idx)=> <option key={idx} value={idx+1}>{m}</option>)}
        </select>
      </div>

      {/* Tuiles de saisie */}
      <div className="plac-table-wrap" style={{padding:12}}>
        <table className="plac-table" role="grid" aria-label="paramètres crédit">
          <tbody>
            <tr>
              <td className="cell-strong">Montant emprunté</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:220}}>
                  <input
                    type="text" inputMode="numeric"
                    value={fmt0(effectiveCapital)}
                    onChange={e=> onChangeCapital(e.target.value)}
                    style={{width:'100%', textAlign:'right', height:32, lineHeight:'32px'}}
                  />
                  <span>€</span>
                </div>
              </td>

              <td className="cell-strong">Durée (mois)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:220}}>
                  <input
                    type="text" inputMode="numeric"
                    value={String(N)}
                    onChange={e=> onChangeDuree(e.target.value)}
                    style={{width:'100%', textAlign:'right', height:32, lineHeight:'32px'}}
                  />
                  <span>mois</span>
                </div>
              </td>
            </tr>

            <tr>
              <td className="cell-muted">Taux annuel (crédit)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:220}}>
                  <input
                    type="number" step="0.01"
                    value={Number((taux).toFixed(2))}
                    onChange={e=> setTaux(+e.target.value || 0)}
                    style={{width:'100%', textAlign:'right', height:32}}
                  />
                  <span>%</span>
                </div>
              </td>

              <td className="cell-muted">Taux annuel (assurance)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:220}}>
                  <input
                    type="number" step="0.01"
                    value={Number((tauxAssur).toFixed(2))}
                    onChange={e=> setTauxAssur(+e.target.value || 0)}
                    style={{width:'100%', textAlign:'right', height:32}}
                  />
                  <span>%</span>
                </div>
              </td>
            </tr>

            <tr>
              <td className="cell-strong">Mensualité (hors assurance)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:220}}>
                  <input
                    type="text" inputMode="numeric"
                    placeholder={fmt0(mensuHorsAssurance_base)}
                    value={mensuBase}
                    onChange={e=> onChangeMensuBase(e.target.value)}
                    style={{width:'100%', textAlign:'right', height:32, lineHeight:'32px'}}
                  />
                  <span>€</span>
                </div>
                <div className="cell-muted" style={{textAlign:'right', fontSize:12, marginTop:2}}>
                  Saisie ici = recalcul du montant emprunté (hors assurance) lorsqu’il n’y a pas de palier.
                </div>
              </td>

              <td className="cell-strong">Coût total</td>
              <td className="input-cell" style={{textAlign:'right', paddingRight:12, fontWeight:600}}>
                {euro0(coutInterets + coutAssur)}
                <div className="cell-muted" style={{fontSize:12}}>
                  dont intérêts {euro0(coutInterets)} • assurance {euro0(coutAssur)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Paliers */}
      <div style={{marginTop:14}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div className="cell-strong">Paliers (optionnel)</div>
          <button className="chip" onClick={addPalier}>+ Ajouter un palier</button>
        </div>
        {paliers.length > 0 && (
          <div className="plac-table-wrap" style={{padding:12, marginTop:8}}>
            <table className="plac-table" role="grid" aria-label="paliers crédit">
              <thead>
                <tr>
                  <th>Début (mois)</th>
                  <th>Durée (mois)</th>
                  <th>Mensualité (€, hors assur.)</th>
                  <th>Taux annuel (%)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paliers.map(p=>(
                  <tr key={p.id}>
                    <td className="input-cell" style={{textAlign:'right'}}>
                      <input
                        type="text" inputMode="numeric"
                        value={String(p.start)}
                        onChange={e=> updatePalier(p.id, { start: Math.max(1, toNum(e.target.value)) })}
                        style={{width:100, textAlign:'right', height:28}}
                      />
                    </td>
                    <td className="input-cell" style={{textAlign:'right'}}>
                      <input
                        type="text" inputMode="numeric"
                        value={String(p.months)}
                        onChange={e=> updatePalier(p.id, { months: Math.max(1, toNum(e.target.value)) })}
                        style={{width:100, textAlign:'right', height:28}}
                      />
                    </td>
                    <td className="input-cell" style={{textAlign:'right'}}>
                      <input
                        type="text" inputMode="numeric"
                        value={p.mensu === '' ? '' : (toNum(p.mensu).toLocaleString('fr-FR'))}
                        onChange={e=> updatePalier(p.id, { mensu: e.target.value })}
                        placeholder="(laisser vide = base)"
                        style={{width:150, textAlign:'right', height:28}}
                      />
                    </td>
                    <td className="input-cell" style={{textAlign:'right'}}>
                      <input
                        type="number" step="0.01"
                        value={p.taux === '' ? '' : Number(p.taux)}
                        onChange={e=> updatePalier(p.id, { taux: e.target.value })}
                        placeholder="(base)"
                        style={{width:120, textAlign:'right', height:28}}
                      />
                    </td>
                    <td style={{textAlign:'center'}}>
                      <button className="chip" onClick={()=> removePalier(p.id)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tableau d’amortissement complet */}
      <div className="plac-table-wrap" style={{marginTop:16}}>
        <table className="plac-table" role="grid" aria-label="amortissement">
          <thead>
            <tr>
              <th>Mois</th>
              <th style={{textAlign:'right'}}>Intérêts</th>
              <th style={{textAlign:'right'}}>Assurance</th>
              <th style={{textAlign:'right'}}>Amort.</th>
              <th style={{textAlign:'right'}}>Mensualité</th>
              <th style={{textAlign:'right'}}>Mensualité + Assur.</th>
              <th style={{textAlign:'right'}}>CRD</th>
            </tr>
          </thead>
          <tbody>
            {table.map((l) => (
              <tr key={l.mois}>
                <td>{l.mois}</td>
                <td style={{textAlign:'right'}}>{euro0(l.interet)}</td>
                <td style={{textAlign:'right'}}>{euro0(l.assurance)}</td>
                <td style={{textAlign:'right'}}>{euro0(l.amort)}</td>
                <td style={{textAlign:'right', fontWeight:600}}>{euro0(l.mensu)}</td>
                <td style={{textAlign:'right', fontWeight:600}}>{euro0(l.mensuTotal)}</td>
                <td style={{textAlign:'right'}}>{euro0(l.crd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
