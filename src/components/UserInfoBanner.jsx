import React from 'react';
import { useAuth, useUserRole } from '../auth';
import { useUserMode } from '../services/userModeService';

/**
 * Composant réutilisable pour le bandeau d'informations utilisateur
 * Affiche : Utilisateur, Statut, Mode
 * 
 * Design "Carte de présence" - élégance gestion privée
 * Conforme gouvernance couleur : C4 (badges), C6 (ligne accent), C8 (séparateurs), C9 (labels), C10 (valeurs)
 */
export function UserInfoBanner() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { mode: userMode, isLoading: modeLoading } = useUserMode();

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginLeft: 'auto',
      gap: 12,
      marginBottom: 24,
      flexWrap: 'wrap'
    }}>
      {/* Email - Pill Style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        border: '1px solid var(--color-c8)',
        borderRadius: 99,
        gap: 8,
        background: 'transparent'
      }}>
        <span style={{ 
          fontSize: 11, 
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--color-c9)'
        }}>
          Utilisateur
        </span>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 600,
          color: 'var(--color-c10)'
        }}>
          {user?.email || 'Non connecté'}
        </span>
      </div>

      {/* Badges Statut & Mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Badge Statut */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          border: '1px solid var(--color-c8)',
          borderRadius: 99,
          gap: 8,
          background: 'transparent'
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--color-c9)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Statut
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-c10)'
          }}>
            {isAdmin ? 'Admin' : 'User'}
          </span>
        </div>

        {/* Badge Mode */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          border: '1px solid var(--color-c8)',
          borderRadius: 99,
          gap: 8,
          background: 'transparent'
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--color-c9)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Mode
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-c10)'
          }}>
            {modeLoading ? '...' : (userMode === 'expert' ? 'Expert' : 'Simplifié')}
          </span>
        </div>
      </div>
    </div>
  );
}

