/**
 * PerHome - Landing page for PER simulators.
 *
 * Visual direction:
 * - same calm hierarchy as Home
 * - one hero entry for the active simulator
 * - one secondary block for upcoming modules
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Per.css';

interface SimCard {
  id: string;
  title: string;
  path: string;
}

const PER_SIMS: SimCard[] = [
  {
    id: 'potentiel',
    title: 'Potentiel',
    path: '/sim/per/potentiel',
  },
  {
    id: 'transfert',
    title: 'Transfert',
    path: '/sim/per/transfert',
  },
  {
    id: 'ouverture',
    title: 'Projection',
    path: '/sim/per/ouverture',
  },
];

export default function PerHome(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="per-home">
      <section className="per-home-hero">
        <h1 className="per-home-title">SIMULATEURS PER</h1>
        <p className="per-home-subtitle">
          Vérifiez les plafonds de versement, comparez un contrat existant et projetez un PER dans le temps
        </p>
      </section>

      <div className="per-home-divider" />

      <section className="per-home-secondary">
        <div className="per-home-secondary-card">
          <div className="per-home-secondary-grid">
            {PER_SIMS.map((sim) => (
              <button
                key={sim.id}
                type="button"
                className="per-home-tile"
                onClick={() => navigate(sim.path)}
              >
                <div className="per-home-tile-content">
                  <div className="per-home-tile-icon" aria-hidden="true">
                    {sim.id === 'potentiel' ? <IconGauge /> : sim.id === 'transfert' ? <IconTransfer /> : <IconCompass />}
                  </div>
                  <div className="per-home-tile-copy">
                    <span className="per-home-tile-title">{sim.title}</span>
                  </div>
                  <div className="per-home-tile-chevron" aria-hidden="true">
                    <IconChevronSmall />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function IconGauge(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 13l3-3" />
      <path d="M20 14A8 8 0 1 0 4 14" />
      <path d="M12 21v-3" />
    </svg>
  );
}

function IconTransfer(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10l-3 3 3 3" />
      <path d="M17 14l3-3-3-3" />
      <path d="M4 13h16" />
    </svg>
  );
}

function IconCompass(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2l-1.9 5.6-5.7 1.9 1.9-5.7 5.7-1.8z" />
    </svg>
  );
}

function IconChevronSmall(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
