import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="tiles-root">
      {/* Styles portés par le composant pour éviter tout conflit */}
      <style>{`
        :root{
          --green:#2C3D38; --beige:#E8DED5; --ink:#222; --muted:#666;
          --border:#EAEAEA; --shadow:0 10px 30px rgba(0,0,0,.06);
        }
        .tiles-root{ padding:28px 22px 60px; }
        .tiles-wrap{
          max-width:1200px; margin: 0 auto;
          display:grid; grid-template-columns:1fr 1fr; gap:28px;
        }
        .tiles-col{ background:#fff; border-radius:14px; box-shadow:var(--shadow); padding:22px; }
        .tiles-title{
          font-size:22px; font-weight:800; color:var(--ink);
          display:flex; align-items:center; gap:12px; margin-bottom:18px;
        }
        .tiles-title::after{
          content:""; height:2px; background:#e7e0d8; flex:1; border-radius:2px;
        }
        .card{
          display:flex; align-items:center; gap:14px;
          background:#fff; border:1px solid var(--border);
          border-radius:12px; padding:16px 18px; transition:transform .15s ease, box-shadow .2s ease;
          text-decoration:none; color:var(--ink);
        }
        .card + .card{ margin-top:14px; }
        .card:hover{ transform:translateY(-2px); box-shadow:0 14px 34px rgba(0,0,0,.08); }
        .card.is-disabled{ opacity:.55; pointer-events:none; }
        .ic{
          width:36px; height:36px; display:grid; place-items:center;
          border-radius:10px; background:#F6F5F3; border:1px solid var(--border);
          font-weight:700; color:#7b7b7b;
        }
        .lbl{ font-size:16px; font-weight:700; }
        .hint{ font-size:13px; color:var(--muted); margin-left:6px; font-style:italic; }
        @media (max-width: 980px){
          .tiles-wrap{ grid-template-columns:1fr; }
        }
      `}</style>

      <div className="tiles-wrap">
        {/* Colonne gauche */}
        <section className="tiles-col">
          <h2 className="tiles-title">Simulateurs épargne retraite</h2>

          <div className="card is-disabled" title="À venir">
            <span className="ic">↗</span>
            <span className="lbl">Contrôle du potentiel Epargne retraite</span>
          </div>

          <div className="card is-disabled" title="À venir">
            <span className="ic">＋</span>
            <span className="lbl">Transfert vers PER</span>
          </div>

          <div className="card is-disabled" title="À venir">
            <span className="ic">▣</span>
            <span className="lbl">Ouverture PERin</span>
          </div>
        </section>

        {/* Colonne droite */}
        <section className="tiles-col">
          <h2 className="tiles-title">Simulateurs rapides</h2>

          <div className="card is-disabled" title="À venir">
            <span className="ic">€</span>
            <span className="lbl">Impôt sur le revenu</span>
          </div>

          {/* ► LIENS ACTIFS */}
          <Link className="card" to="/placement">
            <span className="ic">📈</span>
            <span className="lbl">Placement</span>
          </Link>

          <Link className="card" to="/credit">
            <span className="ic">💳</span>
            <span className="lbl">Crédit</span>
          </Link>

          <div className="card is-disabled" title="À venir">
            <span className="ic">🏠</span>
            <span className="lbl">
              Stratégie trésorerie IS <span className="hint">(préparation retraite)</span>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
