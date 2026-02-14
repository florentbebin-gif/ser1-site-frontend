import React from 'react';
import { Link } from 'react-router-dom';
import './UpcomingSimulatorPage.css';

export default function UpcomingSimulatorPage({
  title = 'Simulateur à venir',
  subtitle = 'Ce simulateur sera bientôt disponible.',
}) {
  return (
    <div className="upcoming-page" data-testid="upcoming-simulator-page">
      <div className="upcoming-card">
        <p className="upcoming-eyebrow">SIMULATEUR PREMIUM</p>
        <h1 className="upcoming-title">{title}</h1>
        <p className="upcoming-subtitle">{subtitle}</p>

        <div className="upcoming-actions">
          <Link to="/" className="upcoming-btn upcoming-btn--primary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
