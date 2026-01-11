import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ModeToggle } from '../components/ModeToggle';
import './Home.css';

export default function Home(){
  const [loadedFilename, setLoadedFilename] = useState(null);

  useEffect(() => {
    try {
      let fileName = sessionStorage.getItem('ser1:loadedFilename');
      // Retirer l'extension .ser1 ou .json pour l'affichage
      if (fileName) {
        fileName = fileName.replace(/\.(ser1|json)$/i, '');
      }
      setLoadedFilename(fileName || null);
    } catch {}
  }, []);

  return (
    <div className="home-layout">
      {/* Carte statut dossier */}
      <aside className="status-card">
        <div className="status-row">
          <span className="status-label">Dossier chargé</span>
          <span className="status-value status-value--filename">{loadedFilename || '—'}</span>
        </div>
        <div className="status-disclaimer">
          Les données seront effacées à la fermeture du navigateur ou de l'onglet.
        </div>
      </aside>

      {/* Carte mode utilisateur */}
      <aside className="mode-card">
        <ModeToggle />
      </aside>

      {/* Contenu principal */}
      <main className="home-main">
        {/* Bloc principal — AUDIT & STRATÉGIE */}
        <section className="home-hero">
          <h1 className="hero-title">AUDIT & STRATÉGIE</h1>
          <p className="hero-subtitle">
            Analyser la situation patrimoniale, puis la projeter et définir une nouvelle stratégie adaptée.
          </p>
          <Link to="/audit" className="hero-tile">
            <div className="hero-tile-content">
              <div className="hero-tile-icon"><IconStrategy /></div>
              <div className="hero-tile-text">
                <span className="hero-tile-label">Nouvelle Stratégie</span>
              </div>
              <div className="hero-tile-chevron"><IconChevron /></div>
            </div>
          </Link>
        </section>

        {/* Séparation premium */}
        <div className="home-divider" />

        {/* Bloc secondaire — SIMULATEURS */}
        <section className="home-tools">
          <h2 className="tools-title">SIMULATEURS</h2>
          <div className="tools-card">
            <div className="tools-grid">
              <ToolTile to="/potentiel" icon={<IconGauge/>} title="Potentiel retraite" />
              <ToolTile to="/sim/credit" icon={<IconPercent/>} title="Crédit" />
              <ToolTile to="/transfert" icon={<IconTransfer/>} title="Transfert PER" />
              <ToolTile to="/sim/ir" icon={<IconCalc/>} title="Impôt sur le revenu" />
              <ToolTile to="/sim/placement" icon={<IconChart/>} title="Placement" />
              <ToolTile to="/prevoyance" icon={<IconShield/>} title="Prévoyance" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ToolTile({to, icon, title}){
  return (
    <Link to={to} className="tool-tile">
      <div className="tool-tile-content">
        <div className="tool-tile-icon">{icon}</div>
        <div className="tool-tile-title">{title}</div>
        <div className="tool-tile-chevron"><IconChevronSmall /></div>
      </div>
    </Link>
  );
}

function IconChevronSmall(){ return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>)}

// Icônes
function IconStrategy(){ return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>)}
function IconChevron(){ return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>)}
function IconGauge(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 13l3-3"/><path d="M20 14A8 8 0 1 0 4 14"/></svg>)}
function IconTransfer(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 10l-3 3 3 3"/><path d="M17 14l3-3-3-3"/><path d="M4 13h16"/></svg>)}
function IconPercent(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><line x1="6" y1="18" x2="18" y2="6"/></svg>)}
function IconCalc(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h8"/></svg>)}
function IconShield(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>)}
function IconChart(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 20h18"/><path d="M7 16l3-3 3 2 5-6"/></svg>)}
