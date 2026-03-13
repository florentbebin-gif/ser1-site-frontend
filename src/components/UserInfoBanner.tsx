import React from 'react';
import { useAuth, useUserRole } from '../auth';
import { useUserMode } from '../services/userModeService';

/**
 * Composant reutilisable pour le bandeau d'informations utilisateur.
 * Affiche : utilisateur, statut, mode.
 */
export function UserInfoBanner(): React.ReactElement {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { mode: userMode, isLoading: modeLoading } = useUserMode();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginLeft: 'auto',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          border: '1px solid var(--color-c8)',
          borderRadius: 99,
          gap: 8,
          background: 'transparent',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--color-c9)',
          }}
        >
          Utilisateur
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-c10)',
          }}
        >
          {user?.email || 'Non connecte'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            border: '1px solid var(--color-c8)',
            borderRadius: 99,
            gap: 8,
            background: 'transparent',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-c9)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Statut
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-c10)',
            }}
          >
            {isAdmin ? 'Admin' : 'User'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            border: '1px solid var(--color-c8)',
            borderRadius: 99,
            gap: 8,
            background: 'transparent',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-c9)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Mode
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-c10)',
            }}
          >
            {modeLoading ? '...' : userMode === 'expert' ? 'Expert' : 'Simplifie'}
          </span>
        </div>
      </div>
    </div>
  );
}
