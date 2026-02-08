import React from 'react';

export default function AppErrorFallback({ error, type = 'config' }) {
  const isConfigError = type === 'config';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-c7)', // Fond page C7
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: 'var(--color-c1)', // Texte principal C1
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>
          {isConfigError ? '🔧' : '⚠️'}
        </div>
        
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: 'var(--color-c1)'
        }}>
          {isConfigError ? 'Configuration Requise' : 'Application Indisponible'}
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          lineHeight: '1.5', 
          color: 'var(--color-c9)', // Texte secondaire C9
          marginBottom: '24px'
        }}>
          {isConfigError 
            ? "L'application ne peut pas démarrer car la configuration technique est incomplète (Supabase URL/Key manquants)."
            : "Une erreur critique empêche le chargement de l'application."
          }
        </p>

        {error && (
          <pre style={{
            backgroundColor: 'var(--color-c7)', // Fond code C7
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--color-c1)', // Danger/erreur = C1 selon gouvernance
            overflowX: 'auto',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            {error.toString()}
          </pre>
        )}

        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: 'var(--color-c2)', // CTA C2
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '999px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
        >
          Réessayer
        </button>
      </div>
      
      <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--color-c9)' }}>
        SER1 &bull; Gestion Privée
      </div>
    </div>
  );
}
