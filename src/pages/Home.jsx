import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="tiles-wrap">
      <div className="section-card">
        <div className="section-title">Simulateurs épargne retraite</div>
        <Tile to="/sim/potentiel" title="Contrôle du potentiel Epargne retraite" />
        <Tile to="/sim/transfert" title="Transfert vers PER" />
        <Tile to="/sim/ouverture" title="Ouverture PERin" />
      </div>
      <div className="section-card">
        <div className="section-title" style={{fontWeight:400}}>Simulateurs rapides</div>
        <Tile to="/sim/ir" title="Impôt sur le revenu" />
        <Tile to="/sim/placement" title="Placement" />
        <Tile to="/sim/credit" title="Crédit" />
        <Tile to="/sim/strategie-is" title="Stratégie trésorerie IS" />
      </div>
    </div>
  )
}

function Tile({ to, title }) {
  return (
    <Link to={to} className="tile">
      <div className="tile-row">
        <div className="tile-icon">📊</div>
        <div className="tile-sep" />
        <div className="tile-title">{title}</div>
      </div>
    </Link>
  )
}
