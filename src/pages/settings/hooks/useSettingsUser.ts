import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { DEBUG_AUTH, supabase } from '@/supabaseClient';

export interface UseSettingsUserResult {
  user: User | null;
  loading: boolean;
}

export function useSettingsUser(): UseSettingsUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function loadUser() {
      try {
        if (DEBUG_AUTH) {
          // eslint-disable-next-line no-console
          console.debug('[Settings] loadUser:start');
        }
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn(
              '[Settings] Timeout lors du chargement utilisateur, utilisation des valeurs par défaut',
            );
            setLoading(false);
          }
        }, 6000);

        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erreur chargement user :', error);
          return;
        }

        const loadedUser = data?.user || null;
        if (!mounted) return;
        setUser(loadedUser);

        if (loadedUser && DEBUG_AUTH) {
          const role = loadedUser.app_metadata?.role || 'user';
          // eslint-disable-next-line no-console
          console.debug('[Settings] role detected', { userId: loadedUser.id, role });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { user, loading };
}
