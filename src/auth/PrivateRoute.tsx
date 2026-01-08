/**
 * PrivateRoute - Composant de route protégée
 * 
 * Redirige vers /login si l'utilisateur n'est pas connecté.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps): React.ReactElement {
  const { authReady, user } = useAuth();
  const location = useLocation();

  // Affiche un loader pendant la vérification
  if (!authReady) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#788781',
      }}>
        Chargement session (PrivateRoute)…
      </div>
    );
  }

  // Redirige vers login si non connecté
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
