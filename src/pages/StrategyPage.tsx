/**
 * StrategyPage - Page wrapper pour le Strategy Builder
 * Charge le dossier audit depuis la session storage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { loadDraftFromSession } from '../features/audit';
import { StrategyBuilder } from '../features/strategy';
import './StrategyPage.css';

export default function StrategyPage(): React.ReactElement {
  const dossier = loadDraftFromSession();

  if (!dossier) {
    return (
      <section className="strategy-empty-page premium-page" data-testid="strategy-empty-page">
        <div className="strategy-empty-card premium-card">
          <p className="premium-section-title">Workflow privé P7</p>
          <h1 className="premium-title">Aucun audit en cours</h1>
          <p className="premium-subtitle strategy-empty-subtitle">
            Veuillez d&apos;abord compléter un audit patrimonial avant de construire une stratégie.
          </p>
          <Link to="/audit" className="premium-btn premium-btn-primary strategy-empty-link">
            Démarrer un audit
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="strategy-page-shell">
      <StrategyBuilder dossier={dossier} />
    </section>
  );
}
