import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container">
      <div className="tiles-wrap">
        {/* Colonne gauche */}
        <div className="tile-column">
          <h2 className="tile-title">Simulateurs épargne retraite</h2>
          <Tile to="/sim/potentiel" icon={<IconGauge />} title="Epargne retraite, contrôle du potentiel" />
          <Tile to="/sim/transfert" icon={<IconTarget />} title="PER, transfert d'un dispositif" />
          <Tile
            to="/sim/strategie-is"
            icon={<IconHome />}
            title={
              <>
                <span>SERenity</span>
                <span className="tile-note">, une approche de la capacité d'épargne</span>
              </>
            }
          />
        </div>

        {/* Colonne droite */}
        <div className="tile-column">
          <h2 className="tile-title">Simulateurs rapides</h2>
          <Tile to="/sim/impot" icon={<IconCalc />} title="Impôt sur le revenu" />
          <Tile to="/sim/placement" icon={<IconChart />} title="Placement" />
          <Tile to="/sim/credit" icon={<IconCredit />} title="Crédit" />
        </div>
      </div>
    </div>
  );
}

function Tile({ to, icon, title }) {
  return (
    <Link to={to} className="tile">
      <div className="tile-icon">{icon}</div>
      <div>{title}</div>
    </Link>
  );
}

/* Icônes */
function IconGauge() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 12l4-4" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7" />
      <path d="M9 22V12h6v10" />
   ="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="8" y1="8" x2="8" y2="8" />
      <line x1="16" y1="8" x2="16" y2="8" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
 line x1="4" y1="20" x2="4" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="20" y1="20" x2="20" y2="14" />
    </svg>
  );
}

function IconCredit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="14" x2="10" y2="14" />
    </svg>
  );
}
