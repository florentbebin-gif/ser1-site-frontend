import React from 'react';
import { useAuth, useUserRole } from '../auth';
import { useUserMode } from '../settings/userMode';
import './UserInfoBanner.css';

/**
 * Composant réutilisable pour le bandeau d'informations utilisateur.
 * Affiche : utilisateur, statut, mode.
 */
export function UserInfoBanner(): React.ReactElement {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { mode: userMode, isLoading: modeLoading } = useUserMode();

  return (
    <div className="user-info-banner">
      <div className="user-info-banner__chip">
        <span className="user-info-banner__label">Utilisateur</span>
        <span className="user-info-banner__value">{user?.email || 'Non connecté'}</span>
      </div>

      <div className="user-info-banner__group">
        <div className="user-info-banner__chip">
          <span className="user-info-banner__label">Statut</span>
          <span className="user-info-banner__value">{isAdmin ? 'Admin' : 'User'}</span>
        </div>

        <div className="user-info-banner__chip">
          <span className="user-info-banner__label">Mode</span>
          <span className="user-info-banner__value">
            {modeLoading ? '...' : userMode === 'expert' ? 'Expert' : 'Simplifié'}
          </span>
        </div>
      </div>
    </div>
  );
}
