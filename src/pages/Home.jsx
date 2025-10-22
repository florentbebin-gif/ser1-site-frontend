import React from 'react'
import { Link } from 'react-router-dom'

const sims = [
  { id:'potentiel', label:'Contrôle du potentiel Épargne retraite' },
  { id:'transfert', label:'Transfert vers PER' },
  { id:'perin', label:'Ouverture PERin' },
  { id:'ir', label:'Impôt sur le revenu' },
  { id:'placement', label:'Placement' },
  { id:'credit', label:'Crédit' },
  { id:'is', label:'Stratégie trésorerie IS (préparation retraite)' }
]

export default function Home(){
  return (
    <div className='excel'>
      <h2>Tableau de bord</h2>
      <div className='board'>
        {sims.map(s => (
          <Link key={s.id} className='tile' to={'/sim/'+s.id}>
            <div style={{fontWeight:600, marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:12, color:'#666'}}>Ouvrir</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
