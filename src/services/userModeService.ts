import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth';

export type UserMode = 'expert' | 'simplifie';

/**
 * Charge le mode utilisateur depuis Supabase
 */
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
    
    return data?.mode || 'simplifie'; // Valeur par défaut
  } catch (error) {
    console.error('[UserModeService] Error loading user mode:', error);
    return 'simplifie'; // Valeur par défaut en cas d'erreur
  }
}

/**
 * Sauvegarde le mode utilisateur dans Supabase
 */
export async function saveUserMode(userId: string, mode: UserMode): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ui_settings')
      .upsert({
        user_id: userId,
        mode: mode,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[UserModeService] Error saving user mode:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Hook React pour gérer le mode utilisateur
 */
export function useUserMode() {
  const { user } = useAuth();
  const [mode, setMode] = useState<UserMode>('simplifie');
  const [isLoading, setIsLoading] = useState(true);

  // Charger le mode au démarrage
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
        setMode('simplifie'); // Valeur par défaut
      } finally {
        setIsLoading(false);
      }
    };

    loadMode();
  }, [user?.id]);

  // Sauvegarder le mode quand il change
  const updateMode = async (newMode: UserMode) => {
    if (!user?.id) return;

    setMode(newMode); // Optimistic update
    
    try {
      const result = await saveUserMode(user.id, newMode);
      if (!result.success) {
        // En cas d'erreur, on revient à l'ancien mode
        console.error('[useUserMode] Failed to save mode:', result.error);
        // Optionnel: afficher une notification à l'utilisateur
      }
    } catch (error) {
      console.error('[useUserMode] Error updating mode:', error);
      // Optionnel: afficher une notification à l'utilisateur
    }
  };

  return { mode, setMode: updateMode, isLoading };
}
