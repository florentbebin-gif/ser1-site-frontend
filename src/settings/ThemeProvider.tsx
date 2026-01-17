/**
 * ThemeProvider - Fournit le thème à toute l'application
 * 
 * Gère :
 * - Chargement des couleurs depuis Supabase user_metadata
 * - Application des CSS variables
 * - Contexte React pour accéder aux couleurs partout
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
import { resolvePptxColors } from '../pptx/theme/resolvePptxColors';

// Cache local pour les thèmes (performance)
const THEME_CACHE_KEY = 'ser1_theme_cache';
const THEME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

interface ThemeCache {
  colors: ThemeColors;
  timestamp: number;
  themeName?: string;
}

function getThemeFromCache(): ThemeColors | null {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (cached) {
      const cache: ThemeCache = JSON.parse(cached);
      const now = Date.now();
      
      // Valider le cache
      if (now - cache.timestamp < THEME_CACHE_TTL) {
        console.info('[ThemeProvider] Using cached theme');
        return cache.colors;
      } else {
        localStorage.removeItem(THEME_CACHE_KEY);
      }
    }
  } catch (e) {
    console.warn('[ThemeProvider] Cache read error:', e);
  }
  return null;
}

function saveThemeToCache(colors: ThemeColors, themeName?: string): void {
  try {
    const cache: ThemeCache = {
      colors,
      timestamp: Date.now(),
      themeName
    };
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cache write error:', e);
  }
}

export interface ThemeColors {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

export const DEFAULT_COLORS: ThemeColors = {
  c1: '#2B3E37',
  c2: '#709B8B',
  c3: '#9FBDB2',
  c4: '#CFDED8',
  c5: '#788781',
  c6: '#CEC1B6',
  c7: '#F5F3F0',
  c8: '#D9D9D9',
  c9: '#7F7F7F',
  c10: '#000000',
};

// SER1 Classic colors are now centralized in pptx/theme/resolvePptxColors.ts
// Import from there to ensure consistency across PPTX exports
import { SER1_CLASSIC_COLORS } from '../pptx/theme/resolvePptxColors';

export type ThemeScope = 'all' | 'ui-only';

interface ThemeContextValue {
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  saveThemeToUiSettings: (colors: ThemeColors, themeName?: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  logo?: string;
  setLogo: (logo: string | undefined) => void;
  themeScope: ThemeScope;
  setThemeScope: (scope: ThemeScope) => void; // Allow Settings to update scope globally
  pptxColors: ThemeColors; // Colors to use for PPTX (respects scope)
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DEFAULT_COLORS,
  setColors: () => {},
  saveThemeToUiSettings: async () => ({ success: false, error: 'Not implemented' }),
  isLoading: true,
  logo: undefined,
  setLogo: () => {},
  themeScope: 'all',
  setThemeScope: () => {},
  pptxColors: DEFAULT_COLORS,
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Applique les couleurs en CSS variables sur :root
 */
function applyColorsToCSS(colors: ThemeColors): void {
  const root = document.documentElement;
  root.style.setProperty('--color-c1', colors.c1);
  root.style.setProperty('--color-c2', colors.c2);
  root.style.setProperty('--color-c3', colors.c3);
  root.style.setProperty('--color-c4', colors.c4);
  root.style.setProperty('--color-c5', colors.c5);
  root.style.setProperty('--color-c6', colors.c6);
  root.style.setProperty('--color-c7', colors.c7);
  root.style.setProperty('--color-c8', colors.c8);
  root.style.setProperty('--color-c9', colors.c9);
  root.style.setProperty('--color-c10', colors.c10);
}

/**
 * Convertit les couleurs Settings (color1-10) vers le format interne (c1-10)
 */
function convertFromSettingsFormat(settingsColors: Record<string, string>): ThemeColors {
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

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  // ⚡ INIT SYNCHRONE : Lire le cache AVANT le premier render
  // Cela empêche le flash "default" si un cache existe
  const [colors, setColorsState] = useState<ThemeColors>(() => {
    const cached = getThemeFromCache();
    return cached || DEFAULT_COLORS;
  });
  
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [themeScope, setThemeScope] = useState<ThemeScope>('all');
  
  // Compute PPTX colors based on theme scope
  // CRITICAL: Use centralized resolver to ensure PPTX never uses web colors when ui-only
  const pptxColors: ThemeColors = resolvePptxColors(colors, themeScope);

  // 🚨 DIAGNOSTIC: Track hash and user ID to prevent unnecessary reapplications
  const lastAppliedHashRef = useRef<string>('');
  const lastAppliedUserIdRef = useRef<string>('');
  const mountIdRef = useRef<string>(Date.now().toString());
  const cacheAppliedRef = useRef<boolean>(false);

  // 🚨 DIAGNOSTIC: Log mount/unmount
  console.info(`[ThemeProvider] MOUNTING - ID: ${mountIdRef.current}`);

  // ⚡ APPLY IMMEDIATELY : Si cache présent, appliquer tout de suite (avant useEffect)
  // Utilisation d'un ref pour ne le faire qu'une fois au montage initial du composant React
  const initialApplyDone = useRef(false);
  if (!initialApplyDone.current) {
    const cached = getThemeFromCache();
    if (cached) {
      applyColorsToCSSWithGuard(cached, undefined, 'cache-sync-init');
      cacheAppliedRef.current = true;
      console.info('[ThemeProvider] Cache theme applied immediately, skipping default');
    } else {
      // Only apply default if NO cache exists
      applyColorsToCSSWithGuard(DEFAULT_COLORS, undefined, 'default-sync-init');
      cacheAppliedRef.current = false;
      console.info('[ThemeProvider] No cache found, applied default theme');
    }
    initialApplyDone.current = true;
  }

  useEffect(() => {
    return () => {
      console.info(`[ThemeProvider] UNMOUNTING - ID: ${mountIdRef.current}`);
    };
  }, []);

  // 🚨 DIAGNOSTIC: Hash function to detect if colors actually changed
  function getThemeHash(colors: ThemeColors, userId?: string): string {
    const colorString = Object.values(colors).join('').toLowerCase();
    return `${colorString}-${userId || 'anonymous'}`;
  }

  // 🚨 DIAGNOSTIC: Enhanced applyColorsToCSS with change detection
  function applyColorsToCSSWithGuard(colors: ThemeColors, userId?: string, source: string = 'unknown'): void {
    const hash = getThemeHash(colors, userId);
    
    if (lastAppliedHashRef.current === hash) {
      console.info(`[ThemeProvider] SKIPPED - Same colors already applied (source: ${source})`);
      return;
    }

    console.info(`[ThemeProvider] APPLYING - Hash: ${hash.substring(0, 20)}... (source: ${source})`);
    
    const root = document.documentElement;
    root.style.setProperty('--color-c1', colors.c1);
    root.style.setProperty('--color-c2', colors.c2);
    root.style.setProperty('--color-c3', colors.c3);
    root.style.setProperty('--color-c4', colors.c4);
    root.style.setProperty('--color-c5', colors.c5);
    root.style.setProperty('--color-c6', colors.c6);
    root.style.setProperty('--color-c7', colors.c7);
    root.style.setProperty('--color-c8', colors.c8);
    root.style.setProperty('--color-c9', colors.c9);
    root.style.setProperty('--color-c10', colors.c10);

    lastAppliedHashRef.current = hash;
    lastAppliedUserIdRef.current = userId || '';
  }

  // Charge les couleurs depuis Supabase au montage
  useEffect(() => {
    let mounted = true;
    const requestId = Date.now(); // ID unique pour cette requête

    async function loadTheme() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return;

        console.info(`[ThemeProvider] LOAD THEME - User: ${user?.id || 'anonymous'}, Request: ${requestId}`);

        // Si cache déjà appliqué, attendre l'auth sans appliquer de default
        if (cacheAppliedRef.current) {
          console.info('[ThemeProvider] Cache already applied, waiting for auth resolution...');
        } else {
          // Appliquer le thème par défaut uniquement si aucun cache
          applyColorsToCSSWithGuard(DEFAULT_COLORS, user?.id, 'default-initial');
        }

        // Hiérarchie : 1) cache, 2) ui_settings, 3) metadata (legacy), 4) défaut
        let finalColors = cacheAppliedRef.current ? getThemeFromCache() || DEFAULT_COLORS : DEFAULT_COLORS;
        let source = cacheAppliedRef.current ? 'cache/local' : 'default';

        if (user) {
          // 1) Essayer ui_settings (nouveau système)
          try {
            const { data: uiSettings, error: uiError } = await supabase
              .from('ui_settings')
              .select('colors')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false }) // En cas de doublons, prendre le plus récent
              .limit(1)
              .maybeSingle();

            if (!mounted || requestId !== Date.now()) return; // ⚠️ Race condition guard

            if (!uiError && uiSettings?.colors) {
              const userColors = convertFromSettingsFormat(uiSettings.colors);
              const userHash = getThemeHash(userColors, user.id);
              const currentHash = getThemeHash(finalColors, user.id);
              
              // N'appliquer que si différent du cache
              if (userHash !== currentHash) {
                finalColors = userColors;
                source = 'ui_settings';
                // Sauvegarder dans le cache
                saveThemeToCache(finalColors);
              } else {
                source = 'ui_settings (same as cache)';
              }
            } else {
              // 2) Fallback metadata (legacy admin)
              if (user.user_metadata?.theme_colors) {
                const legacyColors = convertFromSettingsFormat(user.user_metadata.theme_colors);
                const legacyHash = getThemeHash(legacyColors, user.id);
                const currentHash = getThemeHash(finalColors, user.id);
                
                if (legacyHash !== currentHash) {
                  finalColors = legacyColors;
                  source = 'user_metadata (legacy)';
                  // Sauvegarder dans le cache
                  saveThemeToCache(finalColors);
                } else {
                  source = 'user_metadata (same as cache)';
                }
              } else {
                source = 'default (no ui_settings row)';
              }
            }
          } catch (uiError) {
            if (!mounted) return;
            // 3) Fallback metadata (legacy admin)
            if (user.user_metadata?.theme_colors) {
              const fallbackColors = convertFromSettingsFormat(user.user_metadata.theme_colors);
              const fallbackHash = getThemeHash(fallbackColors, user.id);
              const currentHash = getThemeHash(finalColors, user.id);
              
              if (fallbackHash !== currentHash) {
                finalColors = fallbackColors;
                source = 'user_metadata (fallback)';
                saveThemeToCache(finalColors);
              } else {
                source = 'user_metadata (same as cache)';
              }
            } else {
              source = 'default (catch)';
            }
          }
        }

        if (mounted) {
          setColorsState(finalColors);
          // Appliquer seulement si différent du thème déjà appliqué
          if (source !== 'cache/local' && source !== 'ui_settings (same as cache)' && source !== 'user_metadata (same as cache)') {
            applyColorsToCSSWithGuard(finalColors, user?.id, source);
          }
          console.info(`[ThemeProvider] Theme source: ${source}`);
        }

        if (user?.user_metadata?.cover_slide_url && mounted) {
          console.log('[ThemeProvider] Loading logo URL:', user.user_metadata.cover_slide_url);
          setLogo(user.user_metadata.cover_slide_url);
        } else {
          console.log('[ThemeProvider] No logo URL in user_metadata');
        }
      } catch (error) {
        if (mounted) {
          console.error('Error loading theme:', error);
          applyColorsToCSSWithGuard(DEFAULT_COLORS, undefined, 'error-fallback');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadTheme();

    // Note: onAuthStateChange est géré par AuthProvider uniquement (règle: un seul listener global)
    // Le thème est chargé au mount via loadTheme() ci-dessus
    return () => {
      mounted = false;
    };
  }, []);

  // Met à jour les couleurs et applique immédiatement
  const setColors = useCallback((newColors: ThemeColors) => {
    setColorsState(newColors);
    applyColorsToCSSWithGuard(newColors, lastAppliedUserIdRef.current, 'setColors-manual');
  }, []);

  // Sauvegarde le thème dans ui_settings (nouveau système)
  const saveThemeToUiSettings = useCallback(async (colors: ThemeColors, themeName: string = 'custom') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Convertir vers le format attendu par ui_settings
      const settingsColors = {
        color1: colors.c1,
        color2: colors.c2,
        color3: colors.c3,
        color4: colors.c4,
        color5: colors.c5,
        color6: colors.c6,
        color7: colors.c7,
        color8: colors.c8,
        color9: colors.c9,
        color10: colors.c10,
      };

      // Utiliser upsert avec onConflict pour éviter les doublons
      const { data, error } = await supabase
        .from('ui_settings')
        .upsert({
          user_id: user.id,
          theme_name: themeName,
          colors: settingsColors
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Sauvegarder dans le cache local
      saveThemeToCache(colors, themeName);
      
      console.info('[ThemeProvider] Theme saved to ui_settings and cache');
      return { success: true, data };

    } catch (err) {
      console.error('[ThemeProvider] Error saving theme to ui_settings:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  }, []);

  // Load theme scope from ui_settings
  useEffect(() => {
    async function loadThemeScope() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: uiSettings, error } = await supabase
            .from('ui_settings')
            .select('theme_name')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (!error && uiSettings?.theme_name) {
            // Le scope est encodé dans theme_name: "custom-ui-only" ou "custom"
            if (uiSettings.theme_name.includes('ui-only')) {
              setThemeScope('ui-only');
            } else {
              setThemeScope('all');
            }
          }
        }
      } catch (err) {
        console.error('[ThemeProvider] Error loading theme scope:', err);
      }
    }
    
    loadThemeScope();
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, setColors, saveThemeToUiSettings, isLoading, logo, setLogo, themeScope, setThemeScope, pptxColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook pour obtenir les couleurs dans un format compatible PPTX
 * Les couleurs PPTX sont sans le # prefix
 */
export function useThemeForPptx(): Record<string, string> {
  const { colors } = useTheme();
  return {
    c1: colors.c1.replace('#', ''),
    c2: colors.c2.replace('#', ''),
    c3: colors.c3.replace('#', ''),
    c4: colors.c4.replace('#', ''),
    c5: colors.c5.replace('#', ''),
    c6: colors.c6.replace('#', ''),
    c7: colors.c7.replace('#', ''),
    c8: colors.c8.replace('#', ''),
    c9: colors.c9.replace('#', ''),
    c10: colors.c10.replace('#', ''),
  };
}
