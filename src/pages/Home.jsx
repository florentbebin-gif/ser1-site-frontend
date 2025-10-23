import React from 'react'
import { Link } from 'react-router-dom'

function IconBarChart(){return (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="10" width="3" height="7" rx="1" strokeWidth="1.6"/>
    <rect x="10" y="6" width="3" height="11" rx="1" strokeWidth="1.6"/>
    <rect x="16" y="13" width="3" height="4" rx="1" strokeWidth="1.6"/>
  </svg>
)}
function IconCoin(){return (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" strokeWidth="1.6"/>
    <path d="M9 10h6M9 14h6" strokeWidth="1.6"/>
  </svg>
)}
function IconFolder(){return (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeWidth="1.6"/>
  </svg>
)}
function IconCalc(){return (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth="1.6"/>
    <path d="M8 7h8M8 11h3M8 15h3M13 11h3M13 15h3" strokeWidth="1.6"/>
  </svg>
)}
function IconChartUp(){return (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M4 18h16M6 14l4-4 3 3 5-5" strokeWidth="1.6"/>
  </svg>
)}
function IconDoc(){return (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="4" width="14" height="16" rx="2" strokeWidth="1.6"/>
    <path d="M8 8h8M8 12h8M8 16h5" strokeWidth="1.6"/>
  </svg>
)}
function IconBank(){return (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M4 9l8-5 8 5v10H4V9z" strokeWidth="1.6"/>
    <path d="M7 12v4M12 12v4M17 12v4" strokeWidth="1.6"/>
  </svg>
)}

function Tile({to, icon, label, italic}){
  return (
    <Link className="tile" to={to}>
      <div className="ico">{icon}</div>
      <div className="label">
        <div className="bar"></div>
        <div><b>{label}{italic && <span className="muted"> {italic}</span>}</b></div>
      </div>
    </Link>
  )
}

export default function Home(){
  return (
    <div className="panel">
      <div className="grid-2">
        <div>
          <div className="section-title">
            <h2>Simulateurs épargne retraite</h2>
            <div className="rule"></div>
          </div>
          <div className="tiles">
            <Tile to="/sim/potentiel" icon={<IconBarChart/>} label="Contrôle du potentiel Epargne retraite" />
            <Tile to="/sim/transfert" icon={<IconCoin/>} label="Transfert vers PER" />
            <Tile to="/sim/perin" icon={<IconFolder/>} label="Ouverture PERin" />
          </div>
        </div>
        <div>
          <div className="section-title" style={{justifyContent:'center'}}>
            <h2 style={{color:'#6f7673'}}>Simulateurs divers</h2>
          </div>
          <div className="tiles">
            <Tile to="/sim/ir" icon={<IconCalc/>} label="Impôt sur le revenu" />
            <Tile to="/sim/placement" icon={<IconChartUp/>} label="Placement" />
            <Tile to="/sim/credit" icon={<IconDoc/>} label="Crédit" />
            <Tile to="/sim/is" icon={<IconBank/>} label="Stratégie trésorerie IS" italic="(préparation retraite)" />
          </div>
        </div>
      </div>
      <div className="footer-note">Icônes et couleurs seront harmonisées exactement à votre charte à la prochaine passe.</div>
    </div>
  )
}
