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
      backgroundColor: '#F5F3F0', // var(--color-c7)
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#2B3E37', // var(--color-c1)
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
          color: '#2B3E37'
        }}>
          {isConfigError ? 'Configuration Requise' : 'Application Indisponible'}
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          lineHeight: '1.5', 
          color: '#7F7F7F', // var(--color-c9)
          marginBottom: '24px'
        }}>
          {isConfigError 
            ? "L'application ne peut pas démarrer car la configuration technique est incomplète (Supabase URL/Key manquants)."
            : "Une erreur critique empêche le chargement de l'application."
          }
        </p>

        {error && (
          <pre style={{
            backgroundColor: '#F5F3F0',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#D32F2F',
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
            backgroundColor: '#709B8B', // var(--color-c2)
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
      
      <div style={{ marginTop: '32px', fontSize: '12px', color: '#7F7F7F' }}>
        SER1 &bull; Gestion Privée
      </div>
    </div>
  );
}
