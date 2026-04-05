/**
 * SessionExpiredBanner — Bandeau UX "session expirée" (P0-06 / P0-09)
 *
 * Affiche un message non-dismissible quand la session TTL a expiré.
 * Propose un bouton de reconnexion.
 */

import React from 'react';
import './SessionExpiredBanner.css';

interface Props {
  visible: boolean;
  minutesRemaining?: number;
  isWarning?: boolean;
}

export function SessionExpiredBanner({ visible, minutesRemaining, isWarning }: Props): React.ReactElement | null {
  if (!visible) return null;

  if (isWarning && typeof minutesRemaining === 'number' && minutesRemaining > 0) {
    return (
      <div role="alert" className="session-warning-toast">
        Votre session expire dans {minutesRemaining} min.
        Effectuez une action pour rester connecté.
      </div>
    );
  }

  return (
    <div role="alert" className="session-expired-overlay">
      <div className="session-expired-card">
        <h2 className="session-expired-title">
          Session expirée
        </h2>
        <p className="session-expired-message">
          Votre session a expiré après une période d'inactivité. Vos données de simulateur ont été purgées pour des raisons de sécurité.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="session-expired-btn"
        >
          Se reconnecter
        </button>
      </div>
    </div>
  );
}
