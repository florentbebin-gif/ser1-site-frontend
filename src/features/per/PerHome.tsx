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
  description: string;
  path: string;
  active: boolean;
}

const PER_SIMS: SimCard[] = [
  {
    id: 'potentiel',
    title: 'Controle du potentiel epargne retraite',
    description:
      "Verifiez vos plafonds de versement, simulez l'impact fiscal et preparez la lecture declarative 2042.",
    path: '/sim/per/potentiel',
    active: true,
  },
  {
    id: 'transfert',
    title: 'Transfert epargne retraite',
    description:
      'Comparez un contrat existant avec un nouveau PER : frais, rendement, capital et rente projetee.',
    path: '/sim/per/transfert',
    active: false,
  },
  {
    id: 'ouverture',
    title: 'Ouverture PER',
    description:
      "Simulez l'ouverture d'un PER individuel et structurez le scenario de versement et de sortie.",
    path: '/sim/per/ouverture',
    active: false,
  },
];

export default function PerHome(): React.ReactElement {
  const navigate = useNavigate();
  const activeSim = PER_SIMS.find((sim) => sim.active);
  const upcomingSims = PER_SIMS.filter((sim) => !sim.active);

  return (
    <div className="per-home">
      <section className="per-home-hero">
        <p className="per-home-kicker">Epargne retraite</p>
        <h1 className="per-home-title">SIMULATEURS PER</h1>
        <p className="per-home-subtitle">
          Controlez un potentiel de versement aujourd&apos;hui, puis preparez demain
          les parcours transfert et ouverture avec la meme lecture metier.
        </p>

        {activeSim && (
          <button
            type="button"
            className="per-home-focus-card"
            onClick={() => navigate(activeSim.path)}
          >
            <div className="per-home-focus-icon" aria-hidden="true">
              <IconGauge />
            </div>
            <div className="per-home-focus-copy">
              <span className="per-home-focus-badge">Disponible maintenant</span>
              <span className="per-home-focus-title">{activeSim.title}</span>
              <span className="per-home-focus-desc">{activeSim.description}</span>
            </div>
            <div className="per-home-focus-chevron" aria-hidden="true">
              <IconChevron />
            </div>
          </button>
        )}
      </section>

      <div className="per-home-divider" />

      <section className="per-home-secondary">
        <h2 className="per-home-secondary-title">A venir dans le hub PER</h2>
        <div className="per-home-secondary-card">
          <div className="per-home-secondary-grid">
            {upcomingSims.map((sim) => (
              <button
                key={sim.id}
                type="button"
                className="per-home-tile"
                onClick={() => navigate(sim.path)}
              >
                <div className="per-home-tile-content">
                  <div className="per-home-tile-icon" aria-hidden="true">
                    {sim.id === 'transfert' ? <IconTransfer /> : <IconCompass />}
                  </div>
                  <div className="per-home-tile-copy">
                    <div className="per-home-tile-header">
                      <span className="per-home-tile-title">{sim.title}</span>
                      <span className="per-home-tile-badge">Bientot disponible</span>
                    </div>
                    <p className="per-home-tile-desc">{sim.description}</p>
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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

function IconChevron(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
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
