import React from 'react'
import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <div className="panel">
      <div className="grid-2">
        <div>
          <div className="section-title">
            <h2 style={{margin:0}}>Simulateurs épargne retraite</h2>
            <div className="rule"></div>
          </div>
          <div className="tiles">
            <Link className="tile" to="/sim/potentiel">
              <div className="ico">📊</div>
              <div><b>Contrôle du potentiel Epargne retraite</b></div>
            </Link>
            <Link className="tile" to="/sim/transfert">
              <div className="ico">🪙</div>
              <div><b>Transfert vers PER</b></div>
            </Link>
            <Link className="tile" to="/sim/perin">
              <div className="ico">🗂️</div>
              <div><b>Ouverture PERin</b></div>
            </Link>
          </div>
        </div>
        <div>
          <div className="section-title" style={{justifyContent:'center'}}>
            <h2 style={{margin:0, color:'#7c8480', fontWeight:600}}>Simulateurs divers</h2>
          </div>
          <div className="tiles">
            <Link className="tile" to="/sim/ir">
              <div className="ico">🧮</div>
              <div><b>Impôt sur le revenu</b></div>
            </Link>
            <Link className="tile" to="/sim/placement">
              <div className="ico">📈</div>
              <div><b>Placement</b></div>
            </Link>
            <Link className="tile" to="/sim/credit">
              <div className="ico">📑</div>
              <div><b>Crédit</b></div>
            </Link>
            <Link className="tile" to="/sim/is">
              <div className="ico">🏛️</div>
              <div><b>Stratégie trésorerie IS <span className="muted">(préparation retraite)</span></b></div>
            </Link>
          </div>
        </div>
      </div>
      <div className="footer-note">Icônes et couleurs seront harmonisées avec votre charte lors de la prochaine passe.</div>
    </div>
  )
}
