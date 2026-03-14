import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { supabase } from '../supabaseClient';

export type UserMode = 'expert' | 'simplifie';

export async function loadUserMode(userId: string): Promise<UserMode> {
  try {
    const { data, error } = await supabase
      .from('ui_settings')
      .select('mode')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data?.mode || 'simplifie';
  } catch (error) {
    console.error('[UserMode] Error loading user mode:', error);
    return 'simplifie';
  }
}

export async function saveUserMode(
  userId: string,
  mode: UserMode,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('ui_settings').upsert(
      {
        user_id: userId,
        mode,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      },
    );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[UserMode] Error saving user mode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

export function useUserMode() {
  const { user } = useAuth();
  const [mode, setMode] = useState<UserMode>('simplifie');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadMode = async () => {
      setIsLoading(true);
      try {
        const userMode = await loadUserMode(user.id);
        setMode(userMode);
      } catch (error) {
        console.error('[useUserMode] Error loading mode:', error);
        setMode('simplifie');
      } finally {
        setIsLoading(false);
      }
    };

    loadMode();
  }, [user?.id]);

  const updateMode = async (newMode: UserMode) => {
    if (!user?.id) return;

    setMode(newMode);

    try {
      const result = await saveUserMode(user.id, newMode);
      if (!result.success) {
        console.error('[useUserMode] Failed to save mode:', result.error);
      }
    } catch (error) {
      console.error('[useUserMode] Error updating mode:', error);
    }
  };

  return { mode, setMode: updateMode, isLoading };
}
