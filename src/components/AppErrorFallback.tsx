import React from 'react';
import './AppErrorFallback.css';

interface AppErrorFallbackProps {
  error?: unknown;
  type?: 'config' | 'runtime';
}

export default function AppErrorFallback({
  error,
  type = 'config',
}: AppErrorFallbackProps): React.ReactElement {
  const isConfigError = type === 'config';
  const errorMessage = error ? String(error) : null;

  return (
    <div className="app-error-page">
      <div className="app-error-card">
        <div className="app-error-icon">
          {isConfigError ? '🔧' : '⚠️'}
        </div>

        <h1 className="app-error-title">
          {isConfigError ? 'Configuration Requise' : 'Application Indisponible'}
        </h1>

        <p className="app-error-message">
          {isConfigError
            ? "L'application ne peut pas démarrer car la configuration technique est incomplète (Supabase URL/Key manquants)."
            : "Une erreur critique empêche le chargement de l'application."
          }
        </p>

        {errorMessage && (
          <pre className="app-error-details">
            {errorMessage}
          </pre>
        )}

        <button
          onClick={() => window.location.reload()}
          className="app-error-retry"
        >
          Réessayer
        </button>
      </div>

      <div className="app-error-footer">
        SER1 &bull; Gestion Privée
      </div>
    </div>
  );
}

