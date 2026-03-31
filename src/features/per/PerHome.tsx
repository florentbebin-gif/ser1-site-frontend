/**
 * PerHome — Landing page for PER simulators
 *
 * Hub with 3 cards: Potentiel (active), Transfert (upcoming), Ouverture (upcoming).
 * Follows /sim/* baseline (GOUVERNANCE.md).
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
    title: 'Contrôle du potentiel épargne retraite',
    description:
      'Vérifiez vos plafonds de versement (163 quatervicies et Madelin), simulez l\'impact fiscal et accompagnez la déclaration 2042.',
    path: '/sim/per/potentiel',
    active: true,
  },
  {
    id: 'transfert',
    title: 'Transfert épargne retraite',
    description:
      'Comparez votre contrat actuel avec un nouveau PER : frais, rendement, rente et capital simulés.',
    path: '/sim/per/transfert',
    active: false,
  },
  {
    id: 'ouverture',
    title: 'Ouverture PER',
    description:
      'Simulez l\'ouverture d\'un PER individuel : versements, capitalisation, économie d\'impôt et sortie.',
    path: '/sim/per/ouverture',
    active: false,
  },
];

export default function PerHome(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="per-home">
      <div className="per-home-header">
        <h1>Simulateurs PER</h1>
        <p className="per-home-subtitle">
          Choisissez le simulateur adapté à votre besoin
        </p>
      </div>

      <div className="per-home-grid">
        {PER_SIMS.map((sim) => (
          <button
            key={sim.id}
            type="button"
            className={`per-home-card ${sim.active ? 'per-home-card--active' : 'per-home-card--upcoming'}`}
            onClick={() => navigate(sim.path)}
            disabled={false}
          >
            <div className="per-home-card-badge">
              {sim.active ? 'Disponible' : 'Bientôt disponible'}
            </div>
            <h2 className="per-home-card-title">{sim.title}</h2>
            <p className="per-home-card-desc">{sim.description}</p>
            <span className="per-home-card-cta">
              {sim.active ? 'Accéder →' : 'En savoir plus →'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
