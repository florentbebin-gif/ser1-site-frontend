/**
 * Hook pour récupérer le rôle de l'utilisateur connecté
 * 
 * Le rôle est lu depuis la table public.profiles (colonne role).
 * Si absent, fallback sur user_metadata pour compatibilité.
 * Par défaut, un utilisateur est "user". Seuls les admins ont role="admin".
 */

import { useEffect, useState } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
<<<<<<< Updated upstream
=======
import { useAuth } from './AuthProvider';
import { supabase } from '../supabaseClient';
>>>>>>> Stashed changes

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
        if (DEBUG_AUTH) console.log('[useUserRole] fetchRole:start');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (!user) {
          if (DEBUG_AUTH) console.log('[useUserRole] fetchRole:no user');
          setState({
            role: null,
            user: null,
            isAdmin: false,
            isLoading: false,
          });
          return;
        }

        // Utiliser uniquement user_metadata comme source de vérité
        const role = (
          user.user_metadata?.role || 
          user.app_metadata?.role || 
          'user'
        ) as 'admin' | 'user';

        if (DEBUG_AUTH) {
          console.log('[useUserRole] fetchRole:success', {
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

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (DEBUG_AUTH) console.log('[useUserRole] onAuthStateChange', { event: _event, hasSession: !!session });
        
        if (session?.user) {
          // Utiliser uniquement user_metadata comme source de vérité
          const role = (
            session.user.user_metadata?.role || 
            session.user.app_metadata?.role || 
            'user'
          ) as 'admin' | 'user';
          
          if (DEBUG_AUTH) {
            console.log('[useUserRole] onAuthStateChange:session', {
              userId: session.user.id,
              role,
              isAdmin: role === 'admin',
            });
          }
          
          setState({
            role,
            user: session.user,
            isAdmin: role === 'admin',
            isLoading: false,
          });
        } else {
          if (DEBUG_AUTH) console.log('[useUserRole] onAuthStateChange:no session');
          setState({
            role: null,
            user: null,
            isAdmin: false,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Vérifie si l'utilisateur actuel est admin (fonction utilitaire)
 */
export async function checkIsAdmin(): Promise<boolean> {
<<<<<<< Updated upstream
=======
  // Cette fonction est conservée pour compatibilité, mais ne devrait pas être
  // utilisée comme source-of-truth côté UI.
>>>>>>> Stashed changes
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Utiliser uniquement user_metadata comme source de vérité
  const role = user.user_metadata?.role || user.app_metadata?.role || 'user';
  return role === 'admin';
}
