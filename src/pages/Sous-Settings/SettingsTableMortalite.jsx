import React from 'react';
import { UserInfoBanner } from '../../components/UserInfoBanner';
import './SettingsTableMortalite.css';

export default function SettingsTableMortalite() {
  return (
    <div className="settings-table-mortalite" style={{ marginTop: 16 }}>
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
          Table de mortalité
        </h2>
        <p style={{ 
          fontSize: 14, 
          color: 'var(--color-c9)',
          maxWidth: 400,
          margin: '0 auto'
        }}>
          Configuration des tables de mortalité pour les calculs de rentes viagères et projections patrimoniales.
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
