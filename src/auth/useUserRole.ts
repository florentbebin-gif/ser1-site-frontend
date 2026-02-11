/**
 * Hook pour récupérer le rôle de l'utilisateur connecté
 * 
 * SÉCURITÉ : le rôle est lu depuis app_metadata.role UNIQUEMENT.
 * user_metadata est modifiable par l'utilisateur et ne doit JAMAIS
 * servir pour l'autorisation (risque d'élévation de privilèges).
 * Voir docs/technical/security-user-metadata-guidelines.md
 *
 * Par défaut, un utilisateur est "user". Seuls les admins ont role="admin".
 */

import { useEffect, useState } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'user' | 'loading' | null;

export interface UserRoleState {
  role: UserRole;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useUserRole(): UserRoleState {
  const [state, setState] = useState<UserRoleState>({
    role: 'loading',
    user: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchRole() {
      try {
        if (DEBUG_AUTH) {
          // eslint-disable-next-line no-console
          console.debug('[useUserRole] fetchRole:start');
        }
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (!user) {
          if (DEBUG_AUTH) {
            // eslint-disable-next-line no-console
            console.debug('[useUserRole] fetchRole:no user');
          }
          setState({
            role: null,
            user: null,
            isAdmin: false,
            isLoading: false,
          });
          return;
        }

        // SÉCURITÉ : app_metadata uniquement (non modifiable par l'utilisateur)
        const role = (
          user.app_metadata?.role || 
          'user'
        ) as 'admin' | 'user';

        if (DEBUG_AUTH) {
          // eslint-disable-next-line no-console
          console.debug('[useUserRole] fetchRole:success', {
            userId: user.id,
            role,
            isAdmin: role === 'admin',
          });
        }

        setState({
          role,
          user,
          isAdmin: role === 'admin',
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching user role:', error);
        if (mounted) {
          setState({
            role: null,
            user: null,
            isAdmin: false,
            isLoading: false,
          });
        }
      }
    }

    fetchRole();

    // Note: onAuthStateChange est géré par AuthProvider uniquement (règle: un seul listener global)
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Vérifie si l'utilisateur actuel est admin (fonction utilitaire)
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // SÉCURITÉ : app_metadata uniquement (non modifiable par l'utilisateur)
  const role = user.app_metadata?.role || 'user';
  return role === 'admin';
}
