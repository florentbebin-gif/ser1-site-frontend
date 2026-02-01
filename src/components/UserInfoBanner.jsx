import React from 'react';
import { useAuth, useUserRole } from '../auth';
import { useUserMode } from '../services/userModeService';

/**
 * Composant réutilisable pour le bandeau d'informations utilisateur
 * Affiche : Utilisateur, Statut, Mode
 */
export function UserInfoBanner() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { mode: userMode, isLoading: modeLoading } = useUserMode();

  return (
    <div className="settings-field-row" style={{ 
      display: 'flex',
      alignItems: 'center',
      fontSize: 14,
      padding: '12px 16px', 
      background: 'var(--color-c7)', 
      borderRadius: 8, 
      border: '1px solid var(--color-c8)', 
      gap: 24, 
      marginBottom: 16 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: 'var(--color-c10)', fontSize: 14 }}>Utilisateur :</span>
        <span style={{ color: 'var(--color-c10)', fontSize: 14 }}>{user?.email || 'Non connecté'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: 'var(--color-c10)', fontSize: 14 }}>Statut :</span>
        <span style={{ color: 'var(--color-c10)', fontSize: 14 }}>
          {isAdmin ? 'Admin' : 'User'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: 'var(--color-c10)', fontSize: 14 }}>Mode :</span>
        <span style={{ color: 'var(--color-c10)', fontSize: 14 }}>
          {modeLoading ? 'Chargement...' : (userMode === 'expert' ? 'Expert' : 'Simplifié')}
        </span>
      </div>
    </div>
  );
}
