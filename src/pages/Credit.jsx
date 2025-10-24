import React, { useMemo, useState } from 'react'

/* ---------- Helpers format ---------- */
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

/* ===============================
   Échéanciers de prêts
================================ */
function mensualiteAmortissable(C, r, N) {
  if (N <= 0) return 0
  if (r === 0) return C / N
  return (C * r) / (1 - Math.pow(1 + r, -N))
}

function scheduleAmortissable({ capital, r, rAss, N, assurMode, mensuOverride }) {
  // r, rAss = taux mensuels
  const rows = []
  let crd = capital
  const mensuFixe = (typeof mensuOverride === 'number' && mensuOverride > 0)
    ? mensuOverride
    : mensualiteAmortissable(capital, r, N)

  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null

  for (let m = 1; m <= N; m++) {
    const interet = crd * r
    let mensu = mensuFixe
    if (mensu < interet && r > 0) mensu = interet // évite l’augmentation du CRD
    let amort = Math.min(crd, mensu - interet)
    if (!Number.isFinite(amort) || amort < 0) amort = 0
    crd = Math.max(0, crd - amort)
    const assur = (assurMode === 'CI') ? assurFixe : (crd * rAss)
    const mensuTotal = mensu + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu, mensuTotal, crd })
  }
  return rows
}

function scheduleInFine({ capital, r, rAss, N, assurMode, mensuOverride }) {
  const rows = []
  let crd = capital
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null

  for (let m = 1; m <= N; m++) {
    const interet = crd * r
    let mensu = (typeof mensuOverride === 'number' && mensuOverride > 0) ? mensuOverride : interet
    let amort = 0
    if (m === N) {
      // solde du capital
      amort = crd
      // si une mensualité hors assur. a été saisie, on la respecte si elle suffit
      mensu = Math.max(mensu, interet + amort)
      amort = mensu - interet
      if (amort > crd) amort = crd
    } else if (mensu > interet) {
      amort = Math.min(crd, mensu - interet)
    }
    crd = Math.max(0, crd - amort)
    const assur = (assurMode === 'CI') ? assurFixe : (crd * rAss)
    const mensuTotal = mensu + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort, mensu, mensuTotal, crd })
  }
  return rows
}

/* Lissage du prêt 1 en fonction des autres prêts (hors assurance) */
function scheduleLisseePret1({ pret1, autresPretsRows, cibleMensuTotale }) {
  // pret1: {capital, r, rAss, N, assurMode, type, mensuBase}
  const { capital, r, rAss, N, assurMode, type } = pret1
  const rows = []
  let crd = capital
  const assurFixe = (assurMode === 'CI') ? (capital * rAss) : null

  const sumMensuAutresAtMonth = (m) =>
    autresPretsRows.reduce((s, arr) => s + (arr[m-1]?.mensu || 0), 0)

  for (let m = 1; m <= N; m++) {
    const interet = crd * r
    const mensuAutres = sumMensuAutresAtMonth(m)
    let mensu1 = Math.max(0, cibleMensuTotale - mensuAutres) // pour respecter la cible
    if (type === 'infine') {
      // In fine lissé : paie au moins les intérêts, on solde au dernier mois
      if (m === N) {
        const due = interet + crd
        mensu1 = Math.max(mensu1, due)
      } else if (mensu1 < interet && r > 0) {
        mensu1 = interet
      }
      let amort = Math.max(0, mensu1 - interet)
      if (m === N) amort = crd
      crd = Math.max(0, crd - amort)
    } else {
      // Amortissable lissé
      if (mensu1 < interet && r > 0) mensu1 = interet
      let amort = Math.max(0, mensu1 - interet)
      if (m === N) {
        // ajustement final pour solder
        amort = crd
        mensu1 = interet + amort
      }
      crd = Math.max(0, crd - amort)
    }
    const assur = (assurMode === 'CI') ? assurFixe : (crd * rAss)
    const mensuTotal = mensu1 + (assur || 0)
    rows.push({ mois:m, interet, assurance:(assur||0), amort:(mensu1 - interet > 0 ? mensu1 - interet : (m===N ? capital : 0)), mensu:mensu1, mensuTotal, crd })
  }
  return rows
}

/* id utilitaire */
const rid = () => Math.random().toString(36).slice(2,9)

/* ===============================
   Composant principal
================================ */
export default function Credit(){

  /* ---- États principaux ---- */
  const [creditType, setCreditType]   = useState('amortissable') // 'amortissable' | 'infine'
  const [startMonth, setStartMonth]   = useState(1)              // Janvier=1
  const [assurMode, setAssurMode]     = useState('CRD')          // 'CI' (capital initial) | 'CRD'
  const [capital, setCapital]         = useState(300000)         // 8 chiffres max
  const [duree, setDuree]             = useState(240)            // 3 chiffres max
  const [taux, setTaux]               = useState(3.50)           // % annuel
  const [tauxAssur, setTauxAssur]     = useState(0.30)           // % annuel
  const [mensuBase, setMensuBase]     = useState('')             // saisie mensu prêt 1

  // Prêts additionnels (max 2)
  const [pretsPlus, setPretsPlus] = useState([]) // {id, capital, duree, taux}

  // Lissage actif ?
  const [lisserPret1, setLisserPret1] = useState(false)

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

  /* ---- Mensualité de base prêt 1 (hors assurance) et capital effectif ---- */
  const mensuHorsAssurance_base = useMemo(()=>{
    if (creditType === 'infine') {
      return r === 0 ? 0 : capital * r
    }
    return mensualiteAmortissable(capital, r, N)
  }, [creditType, capital, r, N])

  const effectiveCapitalPret1 = useMemo(()=>{
    const hasOthers = pretsPlus.length > 0
    const mensuUser = toNum(mensuBase)
    if (!mensuUser || hasOthers) return capital // si autres prêts, on ne recalcule pas le capital du prêt 1
    if (creditType === 'infine') {
      return (r === 0) ? capital : Math.floor(mensuUser / r)
    }
    if (r === 0) return Math.floor(mensuUser * N)
    const C = mensuUser * (1 - Math.pow(1+r, -N)) / r
    return Math.floor(C)
  }, [capital, pretsPlus.length, mensuBase, creditType, r, N])

  const mensuBaseEffectivePret1 = useMemo(()=>{
    const hasOthers = pretsPlus.length > 0
    const mensuUser = toNum(mensuBase)
    if (hasOthers) return mensuHorsAssurance_base
    return mensuUser ? mensuUser : mensuHorsAssurance_base
  }, [pretsPlus.length, mensuBase, mensuHorsAssurance_base])

  /* ---- Échéanciers des prêts additionnels ---- */
  const autresRows = useMemo(()=>{
    return pretsPlus.map(p=>{
      const rM = (Math.max(0, Number(p.taux)||0)/100)/12
      const Np = Math.max(1, Math.floor(p.duree||0))
      if (creditType === 'infine') {
        return scheduleInFine({
          capital: Math.max(0, toNum(p.capital)),
          r: rM,
          rAss: rA,
          N: Np,
          assurMode,
        })
      }
      return scheduleAmortissable({
        capital: Math.max(0, toNum(p.capital)),
        r: rM,
        rAss: rA,
        N: Np,
        assurMode,
      })
    })
  }, [pretsPlus, creditType, rA, assurMode])

  /* ---- Cible de lissage et échéancier du prêt 1 ---- */
  const pret1Rows = useMemo(()=>{
    const basePret1 = {
      capital: effectiveCapitalPret1,
      r,
      rAss: rA,
      N,
      assurMode,
      type: creditType
    }
    if (!lisserPret1 || autresRows.length === 0) {
      // pas de lissage → échéancier standard avec mensualité de base (ou type in fine)
      if (creditType === 'infine') {
        return scheduleInFine({ ...basePret1, mensuOverride: mensuBaseEffectivePret1 })
      }
      return scheduleAmortissable({ ...basePret1, mensuOverride: mensuBaseEffectivePret1 })
    }
    // LISSAGE
    const mensuAutresM1 = autresRows.reduce((s,arr)=> s + (arr[0]?.mensu || 0), 0)
    const cible = mensuBaseEffectivePret1 + mensuAutresM1
    return scheduleLisseePret1({
      pret1: basePret1,
      autresPretsRows: autresRows,
      cibleMensuTotale: cible
    })
  }, [
    effectiveCapitalPret1, r, rA, N, assurMode, creditType,
    mensuBaseEffectivePret1, lisserPret1, autresRows
  ])

  /* ---- Agrégation (tous prêts) ---- */
  const maxMois = useMemo(()=>{
    return Math.max(
      pret1Rows.length,
      ...autresRows.map(r => r.length),
      N
    )
  }, [pret1Rows.length, autresRows, N])

  const table = useMemo(()=>{
    const rows = []
    for (let m = 1; m <= maxMois; m++) {
      let interet = 0, assurance = 0, amort = 0, mensu = 0, mensuTotal = 0, crdTot = 0

      const addLine = l => {
        if (!l) return
        interet    += l.interet || 0
        assurance  += l.assurance || 0
        amort      += l.amort || 0
        mensu      += l.mensu || 0
        mensuTotal += l.mensuTotal || 0
        crdTot     += l.crd || 0
      }
      addLine(pret1Rows[m-1])
      autresRows.forEach(arr => addLine(arr[m-1]))

      rows.push({ mois:m, interet, assurance, amort, mensu, mensuTotal, crd:crdTot })
    }
    return rows
  }, [pret1Rows, autresRows, maxMois])

  const coutInterets = useMemo(()=> table.reduce((s,l)=> s + l.interet, 0), [table])
  const coutAssur    = useMemo(()=> table.reduce((s,l)=> s + l.assurance,0), [table])

  /* ---- UI actions prêts additionnels ---- */
  const addPret = () => {
    if (pretsPlus.length >= 2) return
    setPretsPlus(arr => [...arr, { id: rid(), capital: 100000, duree: 120, taux: 2.50 }])
  }
  const updatePret = (id, patch) => {
    setPretsPlus(arr => arr.map(p => p.id === id ? { ...p, ...patch } : p))
  }
  const removePret = (id) => setPretsPlus(arr => arr.filter(p => p.id !== id))

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

        <div className="cell-strong" style={{marginLeft:18}}>Mode de l’assurance</div>
        <select value={assurMode} onChange={e=> setAssurMode(e.target.value)} style={{height:32}}>
          <option value="CI">Capital initial</option>
          <option value="CRD">Capital restant dû</option>
        </select>
      </div>

      {/* Tuiles de saisie (Prêt 1) */}
      <div className="plac-table-wrap" style={{padding:12}}>
        <table className="plac-table" role="grid" aria-label="paramètres crédit">
          <tbody>
            <tr>
              <td className="cell-strong">Montant emprunté (Prêt 1)</td>
              <td className="input-cell">
                <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', width:220}}>
                  <input
                    type="text" inputMode="numeric"
                    value={fmt0(effectiveCapitalPret1)}
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
              <td className="cell-strong">Mensualité (hors assurance) — Prêt 1</td>
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
                  Saisie ici = recalcul du montant emprunté (hors assurance) lorsqu’il n’y a pas de prêt additionnel.
                </div>
              </td>

              <td className="cell-strong">Coût total (intérêts + assurance)</td>
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

      {/* Prêts additionnels & Lissage */}
      <div style={{marginTop:14}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
          <div className="cell-strong">Prêts additionnels (max 2)</div>
          <div style={{display:'flex', gap:8}}>
            <button className="chip" onClick={addPret} disabled={pretsPlus.length>=2}>+ Ajouter un prêt</button>
            <button
              className={`chip ${lisserPret1 ? 'active' : ''}`}
              onClick={()=> setLisserPret1(v => !v)}
              title="Lisser la mensualité totale en ajustant le prêt 1"
            >
              {lisserPret1 ? 'Lissage prêt 1 : ON' : 'Lisser le prêt 1'}
            </button>
          </div>
        </div>

        {pretsPlus.length > 0 && (
          <div className="plac-table-wrap" style={{padding:12, marginTop:8}}>
            <table className="plac-table" role="grid" aria-label="prêts additionnels">
              <thead>
                <tr>
                  <th>#</th>
                  <th style={{textAlign:'right'}}>Capital (€)</th>
                  <th style={{textAlign:'right'}}>Durée (mois)</th>
                  <th style={{textAlign:'right'}}>Taux annuel (%)</th>
                  <th style={{textAlign:'right'}}>Mensualité (hors assur.)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pretsPlus.map((p,idx)=>{
                  const rM = (Math.max(0, Number(p.taux)||0)/100)/12
                  const Np = Math.max(1, Math.floor(p.duree||0))
                  const C  = Math.max(0, toNum(p.capital))
                  const mensu = (creditType === 'infine')
                    ? (rM === 0 ? 0 : C * rM)
                    : mensualiteAmortissable(C, rM, Np)
                  return (
                    <tr key={p.id}>
                      <td>{idx+2}</td>
                      <td className="input-cell" style={{textAlign:'right'}}>
                        <input
                          type="text" inputMode="numeric"
                          value={fmt0(C)}
                          onChange={e=> updatePret(p.id, { capital: String(e.target.value).replace(/\D/g,'').slice(0,8) })}
                          style={{width:140, textAlign:'right', height:28}}
                        />
                      </td>
                      <td className="input-cell" style={{textAlign:'right'}}>
                        <input
                          type="text" inputMode="numeric"
                          value={String(Np)}
                          onChange={e=> updatePret(p.id, { duree: String(e.target.value).replace(/\D/g,'').slice(0,3) })}
                          style={{width:110, textAlign:'right', height:28}}
                        />
                      </td>
                      <td className="input-cell" style={{textAlign:'right'}}>
                        <input
                          type="number" step="0.01"
                          value={Number((Number(p.taux)||0).toFixed(2))}
                          onChange={e=> updatePret(p.id, { taux: +e.target.value || 0 })}
                          style={{width:120, textAlign:'right', height:28}}
                        />
                      </td>
                      <td style={{textAlign:'right', fontWeight:600}}>{euro0(mensu)}</td>
                      <td style={{textAlign:'center'}}>
                        <button className="chip" onClick={()=> removePret(p.id)}>Supprimer</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tableau d’amortissement complet (agrégé) */}
      <div className="plac-table-wrap" style={{marginTop:16}}>
        <table className="plac-table" role="grid" aria-label="amortissement agrégé">
          <thead>
            <tr>
              <th>Mois</th>
              <th style={{textAlign:'right'}}>Intérêts</th>
              <th style={{textAlign:'right'}}>Assurance</th>
              <th style={{textAlign:'right'}}>Amort.</th>
              <th style={{textAlign:'right'}}>Mensualité</th>
              <th style={{textAlign:'right'}}>Mensualité + Assur.</th>
              <th style={{textAlign:'right'}}>CRD total</th>
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
