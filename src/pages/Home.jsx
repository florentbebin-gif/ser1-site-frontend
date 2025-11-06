import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home-wrap">
      <div className="home-grid">
        {/* Colonne gauche */}
        <section className="panel">
          <h2 className="panel-title">
            Simulateurs épargne retraite <span className="rule" />
          </h2>

          <Link to="/sim/potentiel" className="tile">
            <span className="icon">⌁</span>
            <span className="vsep" />
            <span className="label">Contrôle du potentiel Epargne retraite</span>
          </Link>

          <div className="tile tile-disabled" title="Bientôt disponible">
            <span className="icon">＋</span>
            <span className="vsep" />
            <span className="label">Transfert vers PER</span>
          </div>

          <div className="tile tile-disabled" title="Bientôt disponible">
            <span className="icon">▣</span>
            <span className="vsep" />
            <span className="label">Ouverture PERin</span>
          </div>
        </section>

        {/* Colonne droite */}
        <section className="panel">
          <h2 className="panel-title">
            Simulateurs rapides <span className="rule" />
          </h2>

          <div className="tile tile-disabled" title="Bientôt disponible">
            <span className="icon">≡</span>
            <span className="vsep" />
            <span className="label">Impôt sur le revenu</span>
          </div>

          <Link to="/placement" className="tile">
            <span className="icon">✓</span>
            <span className="vsep" />
            <span className="label">Placement</span>
          </Link>

          <Link to="/credit" className="tile">
            <span className="icon">≣</span>
            <span className="vsep" />
            <span className="label">Crédit</span>
          </Link>

          <div className="tile tile-disabled" title="Préparation retraite (bientôt)">
            <span className="icon">⌂</span>
            <span className="vsep" />
            <span className="label">
              Stratégie trésorerie IS <em className="hint">(préparation retraite)</em>
            </span>
          </div>
        </section>
      </div>

      {/* Styles locaux pour la page Home */}
      <style>{`
        .home-wrap{
          width:100%;
          min-height:calc(100vh - 64px);
          display:flex;
          justify-content:center;
        }
        .home-grid{
          width:min(1200px, 92vw);
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:28px;
          padding:28px 0 42px;
        }
        @media (max-width: 980px){
          .home-grid{ grid-template-columns: 1fr; }
        }
        .panel{
          background:#fff;
          border:1px solid #EAEAEA;
          border-radius:14px;
          padding:22px;
          box-shadow:0 10px 26px rgba(0,0,0,.05);
        }
        .panel + .panel{ /* pour l'alignement visuel */ }

        .panel-title{
          display:flex;
          align-items:center;
          gap:12px;
          margin:0 0 14px 0;
          color:#2C3D38;
          font-size:26px;
          line-height:1.2;
        }
        .panel-title .rule{
          content:"";
          flex:1;
          height:4px;
          background:#e8ded5;
          border-radius:3px;
        }

        .tile{
          display:flex;
          align-items:center;
          gap:14px;
          background:#fff;
          color:#2C3D38;
          text-decoration:none;
          border:1px solid #ECECEC;
          border-radius:12px;
          padding:18px 18px;
          margin-top:14px;
          box-shadow:0 8px 20px rgba(0,0,0,.06);
          transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
        }
        .tile:hover{
          transform:translateY(-2px);
          box-shadow:0 12px 26px rgba(0,0,0,.09);
          background:#FAFAFA;
        }

        .tile-disabled{
          pointer-events:none;
          opacity:.60;
        }

        .icon{
          width:36px;
          height:36px;
          border-radius:10px;
          background:#F2F2F2;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          font-size:16px;
          box-shadow: inset 0 0 0 1px #E1E1E1;
        }
        .vsep{
          width:2px;
          height:22px;
          background:#e8ded5;
          border-radius:2px;
        }
        .label{
          font-weight:600;
          font-size:16px;
        }
        .hint{
          font-weight:400;
          font-size:13px;
          color:#7a7a7a;
          margin-left:6px;
          font-style:normal;
        }
      `}</style>
    </div>
  )
}
