// src/pages/Home.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home-root">
      <div className="tiles">
        <Link to="/placement" className="tile">Placement</Link>
        <Link to="/credit" className="tile">Crédit</Link>
        <Link to="/sim/potentiel" className="tile">Simulateur</Link>
        <Link to="/params" className="tile">Paramètres</Link>
      </div>

      {/* Styles locaux, sans impacter le reste */}
      <style>{`
        .home-root{
          width:100%;
          min-height:calc(100vh - 64px); /* laisse la topbar intacte */
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .tiles{
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          width: min(940px, 92vw);
        }
        .tile{
          display:flex;
          align-items:center;
          justify-content:center;
          height:120px;
          border-radius:16px;
          text-decoration:none;
          font-weight:600;
          font-size:18px;
          background:#ffffff;
          color:#2C3D38;
          border:1px solid #E6E6E6;
          box-shadow: 0 8px 20px rgba(0,0,0,.06);
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
        }
        .tile:hover{
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(0,0,0,.09);
          background:#F9F9F9;
        }
      `}</style>
    </div>
  )
}
