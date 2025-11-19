import React from 'react';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <div className="tiles-wrap">
        <div className="tile-column">
          <h2 className="tile-title strong-title">Simulateurs épargne retraite</h2>
          <Tile to="#" title="Contrôle du potentiel Épargne retraite" icon="📈" />
          <Tile to="#" title="Transfert vers PER" icon="🔄" />
          <Tile to="#" title="Ouverture PERin" icon="📝" />
        </div>
        <div className="tile-column">
          <h2 className="tile-title normal-title">Simulateurs rapides</h2>
          <Tile to="#" title="Impôt sur le revenu" icon="📄" />
          <Tile to="#" title="Placement" icon="💰" />
          <Tile to="#" title="Crédit" icon="🏦" />
          <Tile to="#" title="Stratégie trésorerie IS (préparation retraite)" icon="📊" />
        </div>
      </div>
    </div>
  );
}

function Tile({ to, title, icon }) {
  return (
    <a href={to} className="tile">
      <span className="tile-icon">{icon}</span>
      <span className="tile-separator"></span>
      <span className="tile-text">{title}</span>
    </a>
  );
}
