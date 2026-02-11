/**
 * SessionExpiredBanner — Bandeau UX "session expirée" (P0-06 / P0-09)
 *
 * Affiche un message non-dismissible quand la session TTL a expiré.
 * Propose un bouton de reconnexion.
 */

import React from 'react';

interface Props {
  visible: boolean;
  minutesRemaining?: number;
  isWarning?: boolean;
}

export function SessionExpiredBanner({ visible, minutesRemaining, isWarning }: Props): React.ReactElement | null {
  if (!visible) return null;

  if (isWarning && typeof minutesRemaining === 'number' && minutesRemaining > 0) {
    return (
      <div
        role="alert"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: '#996600',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          fontSize: 14,
          fontWeight: 500,
          maxWidth: 360,
        }}
      >
        Votre session expire dans {minutesRemaining} min.
        Effectuez une action pour rester connecté.
      </div>
    );
  }

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '32px 40px',
          textAlign: 'center',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
          Session expirée
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#555' }}>
          Votre session a expiré après une période d'inactivité. Vos données de simulateur ont été purgées pour des raisons de sécurité.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'var(--color-c1, #2b3e37)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Se reconnecter
        </button>
      </div>
    </div>
  );
}
