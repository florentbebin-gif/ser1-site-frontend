/**
 * Hook pour récupérer le rôle de l'utilisateur connecté
 * 
 * Le rôle est lu depuis la table public.profiles (colonne role).
 * Si absent, fallback sur user_metadata pour compatibilité.
 * Par défaut, un utilisateur est "user". Seuls les admins ont role="admin".
 */

import { useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from './AuthProvider';

export type UserRole = 'admin' | 'user' | 'loading' | null;

export interface UserRoleState {
  role: UserRole;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useUserRole(): UserRoleState {
  const { authReady, user, role, isAdmin } = useAuth();

  return useMemo(() => {
    const normalizedRole: UserRole = authReady ? ((role as any) ?? null) : 'loading';
    return {
      role: normalizedRole,
      user,
      isAdmin,
      isLoading: !authReady,
    };
  }, [authReady, isAdmin, role, user]);
}

/**
 * Vérifie si l'utilisateur actuel est admin (fonction utilitaire)
 */
export async function checkIsAdmin(): Promise<boolean> {
  // Cette fonction est conservée pour compatibilité, mais ne devrait pas être
  // utilisée comme source-of-truth côté UI.
  const { data: { user } } = await (await import('../supabaseClient')).supabase.auth.getUser();
  if (!user) return false;
  const role = user.user_metadata?.role || user.app_metadata?.role || 'user';
  return role === 'admin';
}
