/**
 * Helpers API pour les pages Settings
 * 
 * Centralise les appels Supabase pour les opérations CRUD sur les paramètres.
 * Réduit la duplication dans les composants Settings (Impots, Prelevements, BaseContrat).
 */

import { supabase } from '../supabaseClient';

/** Type pour les tables de settings */
export type SettingsTable = 'fiscality_settings' | 'tax_settings' | 'ps_settings';

/**
 * Charge les paramètres depuis Supabase
 * @param table - Nom de la table
 * @returns Les données ou null si non trouvé
 */
export async function loadSettings<T>(table: SettingsTable): Promise<T | null> {
  const { data: rows, error } = await supabase
    .from(table)
    .select('data')
    .eq('id', 1);

  if (error && error.code !== 'PGRST116') {
    console.error(`[SettingsAPI] Erreur chargement ${table}:`, error);
  }

  if (rows && rows.length > 0 && rows[0].data) {
    return rows[0].data as T;
  }

  return null;
}

/**
 * Sauvegarde les paramètres dans Supabase
 * @param table - Nom de la table
 * @param data - Données à sauvegarder
 * @returns true si succès, false sinon
 */
export async function saveSettings<T>(
  table: SettingsTable,
  data: T
): Promise<boolean> {
  const { error } = await supabase
    .from(table)
    .upsert({ id: 1, data });

  if (error) {
    console.error(`[SettingsAPI] Erreur sauvegarde ${table}:`, error);
    return false;
  }

  return true;
}

/**
 * Récupère l'utilisateur courant
 * @returns L'utilisateur ou null
 */
export async function getCurrentUser() {
  const { data: userData, error } = await supabase.auth.getUser();

  if (error) {
    console.error('[SettingsAPI] Erreur getUser:', error);
    return null;
  }

  return userData.user;
}

/**
 * Hook helper pour merge des données avec valeurs par défaut
 * @param dbData - Données de la DB
 * @param defaults - Valeurs par défaut
 * @returns Objet mergé
 */
export function mergeWithDefaults<T extends object>(
  dbData: Partial<T> | null,
  defaults: T
): T {
  if (!dbData) return defaults;

  return {
    ...defaults,
    ...dbData,
  };
}
