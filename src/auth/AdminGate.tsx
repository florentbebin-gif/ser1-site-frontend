/**
 * AdminGate - Composant pour protéger les fonctionnalités admin
 * 
 * Deux modes :
 * - hide: cache le contenu pour les non-admins
 * - disable: affiche le contenu mais désactive les actions
 */

import React from 'react';
import { useUserRole } from './useUserRole';

interface AdminGateProps {
  children: React.ReactNode;
  mode?: 'hide' | 'disable';
  fallback?: React.ReactNode;
}

export function AdminGate({ 
  children, 
  mode = 'hide',
  fallback = null 
}: AdminGateProps): React.ReactElement | null {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    if (mode === 'hide') {
      return <>{fallback}</>;
    }
    
    // Mode disable : wrap dans un div désactivé
    return (
      <div 
        style={{ 
          opacity: 0.5, 
          pointerEvents: 'none',
          position: 'relative',
        }}
        title="Réservé aux administrateurs"
      >
        {children}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: 'not-allowed',
        }} />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook pour vérifier si une action admin est autorisée
 */
export function useAdminAction() {
  const { isAdmin, isLoading } = useUserRole();

  const canPerformAction = !isLoading && isAdmin;

  const requireAdmin = (action: () => void) => {
    if (!canPerformAction) {
      alert('Cette action est réservée aux administrateurs.');
      return;
    }
    action();
  };

  return {
    canPerformAction,
    requireAdmin,
    isLoading,
  };
}
