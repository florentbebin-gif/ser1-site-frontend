import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function Sim(){
  const { id } = useParams()
  const title = useMemo(()=>{
    switch(id){
      case 'potentiel': return 'Contrôle du potentiel Épargne retraite'
      case 'transfert': return 'Transfert vers PER'
      case 'perin': return 'Ouverture PERin'
      case 'ir': return 'Impôt sur le revenu'
      case 'placement': return 'Placement'
      case 'credit': return 'Crédit'
      case 'is': return 'Stratégie trésorerie IS (préparation retraite)'
      default: return id
    }
  },[id])

  const [age, setAge] = useState(45)
  const [revenu, setRevenu] = useState(45000)
  const [epargneAnn, setEpargneAnn] = useState(3000)

  const [res, setRes] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function calc(){
    setError(''); setLoading(true)
    try{
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
      // 🔗 IMPORTANT : on appelle l'endpoint qui correspond au simulateur
      // - /sim/ir       -> POST /api/ir
      // - /sim/potentiel-> POST /api/potentiel
      const endpoint = (id === 'potentiel') ? '/api/potentiel' : `/api/${id}`

      // Pour IR, on envoie les champs requis par l’API IR
      const body = (id === 'ir')
        ? { revenu_imposable: revenu, nb_parts: 1, situation: 'celibataire', charges_deductibles: 0, reductions: 0, credits: 0, annee: 2025 }
        : { age, revenu, epargneAnn }

      const r = await fetch(`${API_BASE}${endpoint}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
      })
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      const json = await r.json()
      setRes(json)
    }catch(e){
      setError(e.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className='excel'>
      <h2>{title}</h2>

      {/* Formulaire simple (communs) */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, maxWidth:600}}>
        {id !== 'ir' && <>
          <label>Âge</label><input type='number' value={age} onChange={e=>setAge(+e.target.value)}/>
          <label>Revenu annuel (€)</label><input type='number' value={revenu} onChange={e=>setRevenu(+e.target.value)}/>
          <label>Épargne annuelle (€)</label><input type='number' value={epargneAnn} onChange={e=>setEpargneAnn(+e.target.value)}/>
        </>}

        {id === 'ir' && <>
          <label>Revenu imposable (€)</label><input type='number' value={revenu} onChange={e=>setRevenu(+e.target.value)} />
          <div style={{gridColumn:'1 / span 2', fontSize:12, color:'#666'}}>
            (Pour la v1 : nb_parts=1, situation=célibataire, charges/réductions/credits=0 — on alignera ensuite au modèle Excel)
          </div>
        </>}
      </div>

      <button className='btn' onClick={calc} disabled={loading} style={{marginTop:16}}>
        {loading ? 'Calcul...' : 'Calculer'}
      </button>

      {error && <div style={{marginTop:12, color:'#b00020'}}>Erreur : {error}</div>}
      {res && (
        id === 'ir'
          ? <pre style={{marginTop:16, background:'#f8fafc', padding:12, borderRadius:8, border:'1px solid #e5e7eb'}}>{JSON.stringify(res, null, 2)}</pre>
          : <div style={{marginTop:16}}>
              Potentiel : <b>{res.potentiel?.toLocaleString?.('fr-FR')} €</b>
              {' '}— IR estimé : <b>{res.ir_est?.toLocaleString?.('fr-FR')} €</b>
            </div>
      )}
    </div>
  )
}
