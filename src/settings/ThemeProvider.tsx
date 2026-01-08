/**
 * ThemeProvider - Fournit le thème à toute l'application
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
// ⚠️ adapte l'import si besoin (ex: '../auth' ou '../auth/AuthProvider')
import { useAuth } from '../auth';

// Cache local pour les thèmes (performance)
const THEME_CACHE_KEY = 'ser1_theme_cache';
const THEME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

export interface ThemeColors {
  c1: string; c2: string; c3: string; c4: string; c5: string;
  c6: string; c7: string; c8: string; c9: string; c10: string;
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

interface ThemeCache {
  colors: ThemeColors;
  timestamp: number;
  themeName?: string;
}

function getThemeFromCache(): ThemeColors | null {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (!cached) return null;
    const cache: ThemeCache = JSON.parse(cached);
    const now = Date.now();
    if (now - cache.timestamp < THEME_CACHE_TTL) {
      return cache.colors;
    }
    localStorage.removeItem(THEME_CACHE_KEY);
  } catch (e) {
    console.warn('[ThemeProvider] Cache read error:', e);
  }
  return null;
}

function saveThemeToCache(colors: ThemeColors, themeName?: string): void {
  try {
    const cache: ThemeCache = { colors, timestamp: Date.now(), themeName };
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cache write error:', e);
  }
}

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

interface ThemeContextValue {
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  saveThemeToUiSettings: (colors: ThemeColors, themeName?: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  logo?: string;
  setLogo: (logo: string | undefined) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DEFAULT_COLORS,
  setColors: () => {},
  saveThemeToUiSettings: async () => ({ success: false, error: 'Not implemented' }),
  isLoading: true,
  logo: undefined,
  setLogo: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const { user, ensureSession, authReady } = useAuth();

  // init: si cache dispo, on le prend pour éviter le flash
  const [colors, setColorsState] = useState<ThemeColors>(() => getThemeFromCache() || DEFAULT_COLORS);
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // anti réponses hors-ordre
  const requestIdRef = useRef(0);
  const lastLoadedUserRef = useRef<string | null>(null);

  // applique immédiatement le cache/default au premier render (une seule fois)
  const initialAppliedRef = useRef(false);
  if (!initialAppliedRef.current) {
    const cached = getThemeFromCache();
    applyColorsToCSS(cached || DEFAULT_COLORS);
    initialAppliedRef.current = true;
  }

  const loadThemeForUser = useCallback(async (u: any, reason: string) => {
    if (!u?.id) return;

    const myReq = ++requestIdRef.current;

    try {
      if (lastLoadedUserRef.current !== u.id) {
        await ensureSession?.(`theme:${reason}`);
        lastLoadedUserRef.current = u.id;
      }

      // base = cache si présent, sinon default
      let finalColors = getThemeFromCache() || DEFAULT_COLORS;
      let source = finalColors === DEFAULT_COLORS ? 'default' : 'cache';

      // ui_settings (prioritaire)
      const { data: uiSettings, error } = await supabase
        .from('ui_settings')
        .select('colors, updated_at')
        .eq('user_id', u.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (myReq !== requestIdRef.current) return; // stale

      if (!error && uiSettings?.colors) {
        finalColors = convertFromSettingsFormat(uiSettings.colors);
        source = 'ui_settings';
        saveThemeToCache(finalColors);
      } else if (u.user_metadata?.theme_colors) {
        finalColors = convertFromSettingsFormat(u.user_metadata.theme_colors);
        source = 'user_metadata';
        saveThemeToCache(finalColors);
      }

      setColorsState(finalColors);
      applyColorsToCSS(finalColors);

      if (u.user_metadata?.cover_slide_url) setLogo(u.user_metadata.cover_slide_url);

      if (DEBUG_AUTH) console.log('[ThemeProvider] loaded theme:', { source, userId: u.id });
    } catch (e) {
      console.error('[ThemeProvider] Error loading theme:', e);
      setColorsState(DEFAULT_COLORS);
      applyColorsToCSS(DEFAULT_COLORS);
    } finally {
      if (myReq === requestIdRef.current) setIsLoading(false);
    }
  }, [ensureSession]);

  // 1) chargement initial quand authReady+user
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setIsLoading(false);
      lastLoadedUserRef.current = null;
      return;
    }
    setIsLoading(true);
    loadThemeForUser(user, 'initial');
  }, [authReady, user, loadThemeForUser]);

  // 2) écoute changements auth (login/logout/refresh)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (DEBUG_AUTH) console.log('[ThemeProvider] auth event', event, session?.user?.id);

      if (!session?.user) {
        // si logout, on remet default (ou cache si tu préfères)
        const fallback = getThemeFromCache() || DEFAULT_COLORS;
        setColorsState(fallback);
        applyColorsToCSS(fallback);
        setLogo(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      await loadThemeForUser(session.user, `auth:${event}`);
    });

    return () => subscription.unsubscribe();
  }, [loadThemeForUser]);

  // Met à jour les couleurs et applique immédiatement
  const setColors = useCallback((newColors: ThemeColors) => {
    setColorsState(newColors);
    applyColorsToCSS(newColors);
  }, []);

  // Sauvegarde le thème dans ui_settings
  const saveThemeToUiSettings = useCallback(async (newColors: ThemeColors, themeName: string = 'custom') => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      const settingsColors = {
        color1: newColors.c1, color2: newColors.c2, color3: newColors.c3, color4: newColors.c4, color5: newColors.c5,
        color6: newColors.c6, color7: newColors.c7, color8: newColors.c8, color9: newColors.c9, color10: newColors.c10,
      };

      await ensureSession?.('theme-save');

      const { error } = await supabase
        .from('ui_settings')
        .upsert({
          user_id: user.id,
          theme_name: themeName,
          colors: settingsColors
        }, { onConflict: 'user_id' });

      if (error) throw error;

      saveThemeToCache(newColors, themeName);
      setColorsState(newColors);
      applyColorsToCSS(newColors);

      return { success: true };
    } catch (err) {
      console.error('[ThemeProvider] Error saving theme:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  }, [user, ensureSession]);

  return (
    <ThemeContext.Provider value={{ colors, setColors, saveThemeToUiSettings, isLoading, logo, setLogo }}>
      {children}
    </ThemeContext.Provider>
  );
}

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

