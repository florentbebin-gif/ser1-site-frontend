import React from 'react';
import { UserInfoBanner } from '../../components/UserInfoBanner';
import './SettingsBaseContrats.css';

export default function SettingsBaseContrats() {
  return (
    <div className="settings-base-contrats" style={{ marginTop: 16 }}>
      {/* Bandeau utilisateur */}
      <UserInfoBanner />
      
      {/* Placeholder Card - Niveau 1 UI Governance */}
      <div className="placeholder-card" style={{
        marginTop: 24,
        padding: '32px 48px',
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid var(--color-c8)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: 20, 
          fontWeight: 600, 
          color: 'var(--color-c10)',
          marginBottom: 12 
        }}>
          Base contrats
        </h2>
        <p style={{ 
          fontSize: 14, 
          color: 'var(--color-c9)',
          maxWidth: 400,
          margin: '0 auto'
        }}>
          Configuration des données de base des contrats d'assurance-vie, PER et autres supports patrimoniaux.
        </p>
        <p style={{ 
          fontSize: 13, 
          color: 'var(--color-c9)',
          marginTop: 16,
          fontStyle: 'italic'
        }}>
          Cette section sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
