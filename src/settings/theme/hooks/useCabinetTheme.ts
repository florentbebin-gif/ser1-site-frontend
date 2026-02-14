/**
 * Cabinet Theme RPC — Fonctions de chargement thème/logo cabinet via Supabase
 *
 * Fonctions pures (pas de React state) qui encapsulent les appels RPC et Edge Function.
 */

import React from 'react';
import { supabase } from '../../../supabaseClient';
import { DEFAULT_COLORS, type ThemeColors } from '../../theme';
import type { LogoPlacement } from '../../../pptx/theme/types';

// ─── Helpers de conversion ───────────────────────────────────────────

/**
 * Convertit les couleurs Settings (color1-10) vers le format interne (c1-10)
 */
export function convertFromSettingsFormat(settingsColors: Record<string, string>): ThemeColors {
  return {
    c1: settingsColors.color1 || DEFAULT_COLORS.c1,
    c2: settingsColors.color2 || DEFAULT_COLORS.c2,
    c3: settingsColors.color3 || DEFAULT_COLORS.c3,
    c4: settingsColors.color4 || DEFAULT_COLORS.c4,
    c5: settingsColors.color5 || DEFAULT_COLORS.c5,
    c6: settingsColors.color6 || DEFAULT_COLORS.c6,
    c7: settingsColors.color7 || DEFAULT_COLORS.c7,
    c8: settingsColors.color8 || DEFAULT_COLORS.c8,
    c9: settingsColors.color9 || DEFAULT_COLORS.c9,
    c10: settingsColors.color10 || DEFAULT_COLORS.c10,
  };
}

/**
 * Convertit une palette DB (c1..c10) vers ThemeColors avec fallback DEFAULT_COLORS
 */
export function convertDbPaletteToThemeColors(palette: any): ThemeColors | null {
  if (!palette) return null;
  return {
    c1: palette.c1 || DEFAULT_COLORS.c1,
    c2: palette.c2 || DEFAULT_COLORS.c2,
    c3: palette.c3 || DEFAULT_COLORS.c3,
    c4: palette.c4 || DEFAULT_COLORS.c4,
    c5: palette.c5 || DEFAULT_COLORS.c5,
    c6: palette.c6 || DEFAULT_COLORS.c6,
    c7: palette.c7 || DEFAULT_COLORS.c7,
    c8: palette.c8 || DEFAULT_COLORS.c8,
    c9: palette.c9 || DEFAULT_COLORS.c9,
    c10: palette.c10 || DEFAULT_COLORS.c10,
  };
}

export async function loadCabinetBrandingKey(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', userId)
      .maybeSingle();

    if (error) return null;
    const cabinetId = data?.cabinet_id;
    if (!cabinetId) return null;
    return `cabinet:${cabinetId}`;
  } catch {
    return null;
  }
}

// ─── RPC: Cabinet Logo ───────────────────────────────────────────────

/**
 * Load cabinet logo for user via RPC (contourne RLS)
 * Returns data URI (base64) for direct use in PPTX exports
 */
export async function loadCabinetLogo(_userId: string): Promise<{ logo?: string; placement?: LogoPlacement }> {
  try {
    // Utiliser RPC SECURITY DEFINER pour récupérer le storage_path et placement sans RLS
    const { data: result, error: rpcError } = await supabase
      .rpc('get_my_cabinet_logo');
      
    if (rpcError) {
      return {};
    }
    
    if (!result) {
      return {};
    }
    
    // Handle both old format (string) and new format (array of objects from TABLE)
    const row = Array.isArray(result) ? result[0] : result;
    const storagePath = typeof row === 'string' ? row : row?.storage_path;
    const placement = typeof row === 'string' ? 'center-bottom' : row?.placement;
    
    if (!storagePath) {
      return {};
    }
    
    // Download blob from Storage (works with public AND private buckets)
    const { data: blob, error: downloadError } = await supabase.storage
      .from('logos')
      .download(storagePath);
    
    if (downloadError || !blob) {
      return {};
    }
    
    // Convert blob to data URI for direct use in PPTX
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    return { logo: dataUri, placement: (placement || 'center-bottom') as LogoPlacement };
  } catch {
    // Silently fail - logo loading is not critical
    return {};
  }
}

// ─── RPC: Cabinet Theme ──────────────────────────────────────────────

/**
 * Load cabinet theme for user via RPC (contourne RLS)
 * Retourne null si pas de cabinet, ThemeColors si palette existe
 */
export async function loadCabinetTheme(_userId: string): Promise<ThemeColors | null> {
  try {
    // Utiliser RPC SECURITY DEFINER pour récupérer la palette sans RLS
    const { data: palette, error: rpcError } = await supabase
      .rpc('get_my_cabinet_theme_palette');
      
    if (rpcError) {
      // Erreur RPC = on considère qu'il n'y a pas de cabinet
      return null;
    }
    
    if (!palette) {
      // PAS de cabinet = retourner null (pas DEFAULT_COLORS)
      return null;
    }
    
    // Convertir palette DB vers format ThemeColors
    return convertDbPaletteToThemeColors(palette);
  } catch (error) {
    console.error('[ThemeProvider] Error loading cabinet theme:', error);
    // Erreur = on considère qu'il n'y a pas de cabinet
    return null;
  }
}

// ─── Edge Function: Original Theme ──────────────────────────────────

/**
 * Load original theme from DB (for users without cabinet)
 */
export async function loadOriginalTheme(): Promise<ThemeColors | null> {
  try {
    // Appel Edge Function authentifié pour récupérer le thème original
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return null;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin?action=get_original_theme`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.palette) {
      return null;
    }

    return convertDbPaletteToThemeColors(data.palette);
  } catch (error) {
    console.error('[ThemeProvider] Error loading original theme:', error);
    return null;
  }
}

// ─── Retry helper ────────────────────────────────────────────────────

/**
 * Retry helper for cabinet theme with exponential backoff (first login timing issue)
 * Retourne null si pas de cabinet, ThemeColors si palette existe
 */
export async function loadCabinetThemeWithRetry(
  userId: string,
  mountedRef: React.MutableRefObject<boolean>,
  requestIdRef: React.MutableRefObject<number>,
  requestId: number
): Promise<ThemeColors | null> {
  const delays: number[] = []; // Retry disabled to avoid repeated RPCs per session
  
  for (let attempt = 0; attempt < delays.length + 1; attempt++) {
    // Abort if unmounted or request is stale (user changed)
    if (!mountedRef.current || requestId !== requestIdRef.current) {
      return null;
    }
    
    const palette = await loadCabinetTheme(userId);
    
    // Si on a une palette (pas null), c'est le cabinet
    if (palette !== null) {
      return palette;
    }
    
    // Last attempt: pas de cabinet = retourner null (pas fallback)
    if (attempt === delays.length) {
      return null;
    }
    
    // Wait before next retry (but check if still valid)
    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
  }
  
  return null;
}
