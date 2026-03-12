import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ModeToggle } from '../components/ModeToggle';
import './Home.css';

interface ToolTileProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  testId: string;
}

export default function Home(): React.ReactElement {
  const [loadedFilename, setLoadedFilename] = useState<string | null>(null);

  useEffect(() => {
    try {
      let fileName = sessionStorage.getItem('ser1:loadedFilename');
      if (fileName) {
        fileName = fileName.replace(/\.(ser1|json)$/i, '');
      }
      setLoadedFilename(fileName || null);
    } catch {
      setLoadedFilename(null);
    }
  }, []);

  return (
    <div className="home-layout" data-testid="home-layout">
      <aside className="status-card" data-testid="home-status-card">
        <div className="status-row">
          <span className="status-label">Dossier charge</span>
          <span className="status-value status-value--filename" data-testid="home-loaded-filename">
            {loadedFilename || '-'}
          </span>
        </div>
        <div className="status-disclaimer" data-testid="home-status-disclaimer">
          Les donnees seront effacees a la fermeture du navigateur ou de l'onglet.
        </div>
      </aside>

      <aside className="mode-card" data-testid="home-mode-card">
        <ModeToggle />
      </aside>

      <main className="home-main" data-testid="home-main">
        <section className="home-hero" data-testid="home-hero-section">
          <h1 className="hero-title" data-testid="home-hero-title">AUDIT & STRATEGIE</h1>
          <p className="hero-subtitle" data-testid="home-hero-subtitle">
            Analyser la situation patrimoniale, puis la projeter et definir une nouvelle strategie adaptee.
          </p>
          <Link to="/audit" className="hero-tile" data-testid="home-audit-link">
            <div className="hero-tile-content">
              <div className="hero-tile-icon"><IconStrategy /></div>
              <div className="hero-tile-text">
                <span className="hero-tile-label">Nouvelle Strategie</span>
              </div>
              <div className="hero-tile-chevron"><IconChevron /></div>
            </div>
          </Link>
        </section>

        <div className="home-divider" />

        <section className="home-tools" data-testid="home-tools-section">
          <h2 className="tools-title" data-testid="home-tools-title">SIMULATEURS</h2>
          <div className="tools-card">
            <div className="tools-grid" data-testid="home-tools-grid">
              <ToolTile to="/sim/placement" icon={<IconChart />} title="Epargne" testId="home-tool-epargne" />
              <ToolTile to="/sim/ir" icon={<IconCalc />} title="Impot sur le revenu" testId="home-tool-ir" />
              <ToolTile to="/sim/per" icon={<IconGauge />} title="Epargne retraite" testId="home-tool-epargne-retraite" />
              <ToolTile to="/sim/succession" icon={<IconTransfer />} title="Droits de succession" testId="home-tool-droits-succession" />
              <ToolTile to="/sim/epargne-salariale" icon={<IconWallet />} title="Epargne salariale" testId="home-tool-epargne-salariale" />
              <ToolTile to="/sim/credit" icon={<IconPercent />} title="Credit" testId="home-tool-credit" />
              <ToolTile to="/sim/tresorerie-societe" icon={<IconBuilding />} title="Tresorerie societe" testId="home-tool-tresorerie-societe" />
              <ToolTile to="/sim/prevoyance" icon={<IconShield />} title="Prevoyance" testId="home-tool-prevoyance" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ToolTile({ to, icon, title, testId }: ToolTileProps): React.ReactElement {
  return (
    <Link to={to} className="tool-tile" data-testid={testId}>
      <div className="tool-tile-content">
        <div className="tool-tile-icon">{icon}</div>
        <div className="tool-tile-title">{title}</div>
        <div className="tool-tile-chevron"><IconChevronSmall /></div>
      </div>
    </Link>
  );
}

function IconChevronSmall(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconStrategy(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconChevron(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconGauge(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 13l3-3" />
      <path d="M20 14A8 8 0 1 0 4 14" />
    </svg>
  );
}

function IconTransfer(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 10l-3 3 3 3" />
      <path d="M17 14l3-3-3-3" />
      <path d="M4 13h16" />
    </svg>
  );
}

function IconWallet(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M16 12h4" />
      <circle cx="16" cy="12" r="1" />
    </svg>
  );
}

function IconBuilding(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 10h.01M12 10h.01M15 10h.01M9 14h.01M12 14h.01M15 14h.01" />
    </svg>
  );
}

function IconPercent(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

function IconCalc(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h8" />
    </svg>
  );
}

function IconShield(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconChart(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 20h18" />
      <path d="M7 16l3-3 3 2 5-6" />
    </svg>
  );
}
