import React from 'react';
import { getErrorMessage } from '../utils/errorHandling';

/** Props for ErrorState component */
interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

/**
 * Standardized error state component
 * Use this to display consistent error UI across the app
 */
export function ErrorState({ error, onRetry, title = 'Erreur' }: ErrorStateProps): React.ReactElement {
  const message = getErrorMessage(error);
  
  return (
    <div style={{
      padding: '24px',
      margin: '16px',
      border: '1px solid var(--color-c7)',
      borderRadius: '8px',
      backgroundColor: 'var(--color-c1)',
      color: 'var(--color-c10)',
    }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '16px',
        fontWeight: 500,
      }}>
        {title}
      </h3>
      <p style={{ 
        margin: '0 0 16px 0',
        fontSize: '14px',
        color: 'var(--color-c8)',
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            border: '1px solid var(--color-c7)',
            borderRadius: '4px',
            backgroundColor: 'var(--color-c3)',
            color: 'var(--color-c10)',
          }}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
