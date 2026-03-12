import React from 'react';
import { Link } from 'react-router-dom';
import './UpcomingSimulatorPage.css';

interface UpcomingSimulatorPageProps {
  title?: string;
  subtitle?: string;
}

export default function UpcomingSimulatorPage({
  title = 'Simulateur a venir',
  subtitle = 'Ce simulateur sera bientot disponible.',
}: UpcomingSimulatorPageProps): React.ReactElement {
  return (
    <div className="upcoming-page" data-testid="upcoming-simulator-page">
      <div className="upcoming-card">
        <p className="upcoming-eyebrow">SIMULATEUR PREMIUM</p>
        <h1 className="upcoming-title">{title}</h1>
        <p className="upcoming-subtitle">{subtitle}</p>

        <div className="upcoming-actions">
          <Link to="/" className="upcoming-btn upcoming-btn--primary">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
