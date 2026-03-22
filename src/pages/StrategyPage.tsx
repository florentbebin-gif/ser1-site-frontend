/**
 * StrategyPage - Page wrapper pour le Strategy Builder
 * Charge le dossier audit depuis la session storage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { loadDraftFromSession } from '../features/audit';
import { StrategyBuilder } from '../features/strategy';

export default function StrategyPage(): React.ReactElement {
  const dossier = loadDraftFromSession();

  if (!dossier) {
    return (
      <div className="audit-wizard" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1>Aucun audit en cours</h1>
        <p style={{ color: 'var(--color-c9)', marginBottom: '24px' }}>
          Veuillez d'abord completer un audit patrimonial avant de construire une strategie.
        </p>
        <Link to="/audit" className="chip" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Demarrer un audit
        </Link>
      </div>
    );
  }

  return <StrategyBuilder dossier={dossier} />;
}
