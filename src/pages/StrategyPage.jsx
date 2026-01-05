/**
 * StrategyPage - Page wrapper pour le Strategy Builder
 * Charge le dossier audit depuis la session storage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { StrategyBuilder } from '../features/strategy';
import { loadDraftFromSession } from '../features/audit/storage';

export default function StrategyPage() {
  const dossier = loadDraftFromSession();

  if (!dossier) {
    return (
      <div className="audit-wizard" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1>Aucun audit en cours</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Veuillez d'abord compléter un audit patrimonial avant de construire une stratégie.
        </p>
        <Link to="/audit" className="chip" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Démarrer un audit
        </Link>
      </div>
    );
  }

  return <StrategyBuilder dossier={dossier} />;
}
