/**
 * ThemeProvider - Fournit le thème à toute l'application
 * 
 * Gère :
 * - Chargement des couleurs depuis Supabase user_metadata
 * - Application des CSS variables
 * - Contexte React pour accéder aux couleurs partout
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Debug flag for theme-related logs (set to true for troubleshooting)
const DEBUG_THEME = false;
import { resolvePptxColors } from '../pptx/theme/resolvePptxColors';

// Cache local pour les thèmes (performance) - ISOLÉ PAR USER
const THEME_CACHE_KEY_PREFIX = 'ser1_theme_cache_';
const THEME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures
const CABINET_THEME_CACHE_KEY_PREFIX = 'ser1_cabinet_theme_cache_';
const CABINET_LOGO_CACHE_KEY_PREFIX = 'ser1_cabinet_logo_cache_';
const CABINET_CACHE_TTL = THEME_CACHE_TTL;

interface ThemeCache {
  colors: ThemeColors;
  timestamp: number;
  themeName?: string;
}

interface CabinetThemeCache {
  colors: ThemeColors;
  timestamp: number;
}

interface CabinetLogoCache {
  logo: string;
  timestamp: number;
}

function getThemeFromCache(userId: string | null): ThemeColors | null {
  if (!userId) return null;
  
  try {
    const cacheKey = `${THEME_CACHE_KEY_PREFIX}${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache: ThemeCache = JSON.parse(cached);
      const now = Date.now();
      
      // Valider le cache
      if (now - cache.timestamp < THEME_CACHE_TTL) {
        if (DEBUG_THEME) console.info('[ThemeProvider] Using cached theme for user:', userId);
        return cache.colors;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {
    console.warn('[ThemeProvider] Cache read error:', e);
  }
  return null;
}

function saveThemeToCache(colors: ThemeColors, userId: string | null, themeName?: string): void {
  if (!userId) return;
  
  try {
    const cacheKey = `${THEME_CACHE_KEY_PREFIX}${userId}`;
    const cache: ThemeCache = {
      colors,
      timestamp: Date.now(),
      themeName
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cache write error:', e);
  }
}

const CABINET_LOGO_EMPTY = '__none__';

function getCabinetThemeFromCache(userId: string | null): ThemeColors | null {
  if (!userId) return null;

  try {
    const cacheKey = `${CABINET_THEME_CACHE_KEY_PREFIX}${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache: CabinetThemeCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.timestamp < CABINET_CACHE_TTL) {
        if (DEBUG_THEME) console.info('[ThemeProvider] Using cached cabinet theme for user:', userId);
        return cache.colors;
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet cache read error:', e);
  }
  return null;
}

function saveCabinetThemeToCache(colors: ThemeColors, userId: string | null): void {
  if (!userId) return;

  try {
    const cacheKey = `${CABINET_THEME_CACHE_KEY_PREFIX}${userId}`;
    const cache: CabinetThemeCache = {
      colors,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet cache write error:', e);
  }
}

function getCabinetLogoFromCache(userId: string | null): string | null | undefined {
  if (!userId) return undefined;

  try {
    const cacheKey = `${CABINET_LOGO_CACHE_KEY_PREFIX}${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache: CabinetLogoCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.timestamp < CABINET_CACHE_TTL) {
        if (DEBUG_THEME) console.info('[ThemeProvider] Using cached cabinet logo for user:', userId);
        return cache.logo === CABINET_LOGO_EMPTY ? null : cache.logo;
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet logo cache read error:', e);
  }
  return undefined;
}

function saveCabinetLogoToCache(logo: string | undefined | null, userId: string | null): void {
  if (!userId) return;

  try {
    const cacheKey = `${CABINET_LOGO_CACHE_KEY_PREFIX}${userId}`;
    const cache: CabinetLogoCache = {
      logo: logo ? logo : CABINET_LOGO_EMPTY,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet logo cache write error:', e);
  }
}

function clearThemeCacheForUser(userId: string | null): void {
  if (!userId) return;
  
  try {
    const cacheKey = `${THEME_CACHE_KEY_PREFIX}${userId}`;
    localStorage.removeItem(cacheKey);
    if (DEBUG_THEME) console.info('[ThemeProvider] Cache cleared for user:', userId);
  } catch (e) {
    console.warn('[ThemeProvider] Cache clear error:', e);
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

function getThemeBootstrap(): { colors: ThemeColors; userId?: string | null } | null {
  if (typeof window === 'undefined') return null;
  const bootstrap = (window as any).__ser1ThemeBootstrap;
  if (!bootstrap?.colors) return null;
  return {
    colors: bootstrap.colors as ThemeColors,
    userId: bootstrap.userId ?? null
  };
}

// SER1 Classic colors centralized in pptx/theme/resolvePptxColors.ts
// (not imported here - only used by resolvePptxColors for PPTX exports)

export type ThemeScope = 'all' | 'ui-only';
export type ThemeSource = 'cabinet' | 'custom';

interface ThemeContextValue {
  colors: ThemeColors;
  setColors: (_colors: ThemeColors) => void;
  saveThemeToUiSettings: (_colors: ThemeColors, _themeName?: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  themeReady: boolean; // true when CSS variables are applied (safe to render routes)
  logo?: string;
  setLogo: (_logo: string | undefined) => void;
  cabinetLogo?: string; // Logo cabinet (via RPC)
  cabinetColors: ThemeColors | null; // Couleurs cabinet (chargées 1x au login, read-only)
  themeScope: ThemeScope;
  setThemeScope: (_scope: ThemeScope) => void; // Allow Settings to update scope globally
  pptxColors: ThemeColors; // Colors to use for PPTX (respects scope)
  themeSource: ThemeSource;
  setThemeSource: (_source: ThemeSource) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DEFAULT_COLORS,
  setColors: (_colors: ThemeColors) => {},
  saveThemeToUiSettings: async (_colors: ThemeColors, _themeName?: string) => ({ success: false, error: 'Not implemented' }),
  isLoading: true,
  themeReady: false,
  logo: undefined,
  setLogo: (_logo: string | undefined) => {},
  cabinetLogo: undefined,
  cabinetColors: null,
  themeScope: 'all',
  setThemeScope: (_scope: ThemeScope) => {},
  pptxColors: DEFAULT_COLORS,
  themeSource: 'cabinet',
  setThemeSource: (_source: ThemeSource) => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
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
  const themeBootstrap = getThemeBootstrap();
  const [colorsState, setColorsState] = useState<ThemeColors>(() => themeBootstrap?.colors ?? DEFAULT_COLORS);
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [cabinetLogo, setCabinetLogo] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [themeReady, setThemeReady] = useState(false); // true when CSS vars applied
  const [themeScope, setThemeScope] = useState<ThemeScope>('all');
  // Lire themeSource depuis localStorage pour persister la préférence user
  const [themeSource, setThemeSource] = useState<ThemeSource>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('themeSource');
      if (stored === 'cabinet' || stored === 'custom') return stored;
    }
    return 'cabinet';
  });
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  // Couleurs cabinet stockées séparément (chargées 1x, read-only pour PPTX)
  const [cabinetColors, setCabinetColors] = useState<ThemeColors | null>(null);
  // Thème Original depuis DB (pour users sans cabinet)
  const [originalColors, setOriginalColors] = useState<ThemeColors | null>(null);

  // Compute PPTX colors - PRIORITÉ: cabinet > original (sans cabinet) > custom selon scope
  // RÈGLE MÉTIER: PPTX = cabinet si dispo, sinon original ou custom selon scope
  const pptxColors: ThemeColors = resolvePptxColors(colorsState, themeScope, cabinetColors, originalColors);

  // Load cabinet logo for user via RPC (contourne RLS)
  // Returns data URI (base64) for direct use in PPTX exports
  const loadCabinetLogo = async (userId: string): Promise<string | undefined> => {
    try {
      // Utiliser RPC SECURITY DEFINER pour récupérer le storage_path sans RLS
      const { data: storagePath, error: rpcError } = await supabase
        .rpc('get_my_cabinet_logo');
        
      if (rpcError) {
        if (DEBUG_THEME) console.warn('[ThemeProvider] Cabinet logo RPC error:', rpcError);
        return undefined;
      }
      
      if (!storagePath) {
        if (DEBUG_THEME) console.info('[ThemeProvider] No cabinet logo found for user:', userId);
        return undefined;
      }
      
      // Download blob from Storage (works with public AND private buckets)
      const { data: blob, error: downloadError } = await supabase.storage
        .from('logos')
        .download(storagePath);
      
      if (downloadError || !blob) {
        if (DEBUG_THEME) console.warn('[ThemeProvider] Cabinet logo download error:', downloadError);
        return undefined;
      }
      
      // Convert blob to data URI for direct use in PPTX
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      if (DEBUG_THEME) console.info('[ThemeProvider] Cabinet logo loaded as dataURI, size:', dataUri.length);
      return dataUri;
    } catch (error) {
      console.error('[ThemeProvider] Error loading cabinet logo:', error);
      return undefined;
    }
  };

  // Load cabinet theme for user via RPC (contourne RLS)
  const loadCabinetTheme = async (userId: string): Promise<ThemeColors> => {
    try {
      // Utiliser RPC SECURITY DEFINER pour récupérer la palette sans RLS
      const { data: palette, error: rpcError } = await supabase
        .rpc('get_my_cabinet_theme_palette');
        
      if (rpcError) {
        if (DEBUG_THEME) console.warn('[ThemeProvider] RPC error:', rpcError);
        return DEFAULT_COLORS;
      }
      
      if (!palette) {
        if (DEBUG_THEME) console.warn('[ThemeProvider] No cabinet theme found for user:', userId);
        return DEFAULT_COLORS;
      }
      
      // Convertir palette DB vers format ThemeColors
      const cabinetColors: ThemeColors = {
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
      
      if (DEBUG_THEME) console.info('[ThemeProvider] Cabinet theme loaded for user:', userId);
      return cabinetColors;
    } catch (error) {
      console.error('[ThemeProvider] Error loading cabinet theme:', error);
      return DEFAULT_COLORS;
    }
  };

  // Load original theme from DB (for users without cabinet)
  const loadOriginalTheme = async (): Promise<ThemeColors | null> => {
    try {
      // Appel Edge Function authentifié pour récupérer le thème original
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (DEBUG_THEME) console.warn('[ThemeProvider] No session for original theme fetch');
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
        if (DEBUG_THEME) console.warn('[ThemeProvider] Original theme fetch error:', response.status);
        return null;
      }

      const data = await response.json();
      if (!data.palette) {
        if (DEBUG_THEME) console.warn('[ThemeProvider] No palette in original theme response');
        return null;
      }

      const original: ThemeColors = {
        c1: data.palette.c1 || DEFAULT_COLORS.c1,
        c2: data.palette.c2 || DEFAULT_COLORS.c2,
        c3: data.palette.c3 || DEFAULT_COLORS.c3,
        c4: data.palette.c4 || DEFAULT_COLORS.c4,
        c5: data.palette.c5 || DEFAULT_COLORS.c5,
        c6: data.palette.c6 || DEFAULT_COLORS.c6,
        c7: data.palette.c7 || DEFAULT_COLORS.c7,
        c8: data.palette.c8 || DEFAULT_COLORS.c8,
        c9: data.palette.c9 || DEFAULT_COLORS.c9,
        c10: data.palette.c10 || DEFAULT_COLORS.c10,
      };

      if (DEBUG_THEME) console.info('[ThemeProvider] Original theme loaded from DB');
      return original;
    } catch (error) {
      console.error('[ThemeProvider] Error loading original theme:', error);
      return null;
    }
  };

  // Retry helper for cabinet theme with exponential backoff (first login timing issue)
  const loadCabinetThemeWithRetry = async (
    userId: string,
    mountedRef: React.MutableRefObject<boolean>,
    requestIdRef: React.MutableRefObject<number>,
    requestId: number
  ): Promise<ThemeColors> => {
    const delays: number[] = []; // Retry disabled to avoid repeated RPCs per session
    
    // Helper to check if colors are default fallback
    const isDefaultFallback = (colors: ThemeColors): boolean => {
      return Object.keys(DEFAULT_COLORS).every(
        (key) => colors[key as keyof ThemeColors] === DEFAULT_COLORS[key as keyof ThemeColors]
      );
    };
    
    for (let attempt = 0; attempt < delays.length + 1; attempt++) {
      // Abort if unmounted or request is stale (user changed)
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        if (DEBUG_THEME) console.info('[ThemeProvider] Cabinet retry aborted (stale request)');
        return DEFAULT_COLORS;
      }
      
      const palette = await loadCabinetTheme(userId);
      
      // Success: got a real cabinet theme (not fallback)
      if (!isDefaultFallback(palette)) {
        if (DEBUG_THEME) console.info(`[ThemeProvider] Cabinet theme loaded on attempt ${attempt + 1}`);
        return palette;
      }
      
      // Last attempt: accept fallback
      if (attempt === delays.length) {
        if (DEBUG_THEME) console.warn('[ThemeProvider] Cabinet theme fallback after max attempts');
        return DEFAULT_COLORS;
      }
      
      // Wait before next retry (but check if still valid)
      if (DEBUG_THEME) console.info(`[ThemeProvider] Retry cabinet theme in ${delays[attempt]}ms (attempt ${attempt + 1})`);
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
    
    return DEFAULT_COLORS;
  };

  const ensureCabinetThemeFetch = (userId: string): Promise<ThemeColors> => {
    if (cabinetThemeLoadedRef.current === userId && cabinetThemePromiseRef.current) {
      return cabinetThemePromiseRef.current;
    }

    if (cabinetThemeLoadedRef.current === userId && !cabinetThemePromiseRef.current) {
      return Promise.resolve(cabinetColors || DEFAULT_COLORS);
    }

    cabinetThemeLoadedRef.current = userId;
    const requestId = ++cabinetThemeRequestIdRef.current;
    const promise = (async () => {
      const colors = await loadCabinetThemeWithRetry(userId, mountedRef, cabinetThemeRequestIdRef, requestId);
      if (!mountedRef.current || requestId !== cabinetThemeRequestIdRef.current) {
        return colors;
      }

      setCabinetColors(colors);
      saveCabinetThemeToCache(colors, userId);

      if (themeSourceRef.current === 'cabinet') {
        setColorsState(colors);
        applyColorsToCSSWithGuard(colors, userId, 'cabinet-theme');
      }

      return colors;
    })();

    cabinetThemePromiseRef.current = promise;
    return promise;
  };

  const ensureCabinetLogoFetch = (userId: string): Promise<string | undefined> => {
    if (cabinetLogoLoadedRef.current === userId && cabinetLogoPromiseRef.current) {
      return cabinetLogoPromiseRef.current;
    }

    if (cabinetLogoLoadedRef.current === userId && !cabinetLogoPromiseRef.current) {
      return Promise.resolve(cabinetLogo);
    }

    cabinetLogoLoadedRef.current = userId;
    const requestId = ++cabinetLogoRequestIdRef.current;
    const promise = (async () => {
      const logoUrl = await loadCabinetLogo(userId);
      if (!mountedRef.current || requestId !== cabinetLogoRequestIdRef.current) {
        return logoUrl;
      }

      setCabinetLogo(logoUrl);
      saveCabinetLogoToCache(logoUrl ?? null, userId);
      return logoUrl;
    })();

    cabinetLogoPromiseRef.current = promise;
    return promise;
  };

  // 🚨 DIAGNOSTIC: Track hash and user ID to prevent unnecessary reapplications
  const lastAppliedHashRef = useRef<string>('');
  const lastAppliedUserIdRef = useRef<string>('');
  const mountIdRef = useRef<string>(Date.now().toString());
  const cacheAppliedRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const activeRequestIdRef = useRef<number>(0);
  const cabinetThemePromiseRef = useRef<Promise<ThemeColors> | null>(null);
  const cabinetLogoPromiseRef = useRef<Promise<string | undefined> | null>(null);
  const cabinetThemeLoadedRef = useRef<string | null>(null);
  const cabinetLogoLoadedRef = useRef<string | null>(null);
  const cabinetThemeRequestIdRef = useRef<number>(0);
  const cabinetLogoRequestIdRef = useRef<number>(0);
  const themeSourceRef = useRef<ThemeSource>(themeSource);
  const cabinetColorsRef = useRef<ThemeColors | null>(cabinetColors);
  const cabinetLogoRef = useRef<string | undefined>(cabinetLogo);
  const ensureCabinetThemeFetchRef = useRef<((_userId: string) => Promise<ThemeColors>) | null>(null);
  const ensureCabinetLogoFetchRef = useRef<((_userId: string) => Promise<string | undefined>) | null>(null);
  const applyColorsToCSSWithGuardRef = useRef(applyColorsToCSSWithGuard);

  // Debug: Log mount/unmount
  if (DEBUG_THEME) console.info(`[ThemeProvider] MOUNTING - ID: ${mountIdRef.current}`);

  // Apply default immediately on mount
  const initialApplyDone = useRef(false);
  if (!initialApplyDone.current) {
    if (themeBootstrap?.colors) {
      applyColorsToCSSWithGuard(themeBootstrap.colors, themeBootstrap.userId ?? undefined, 'bootstrap-cache');
      if (DEBUG_THEME) console.info('[ThemeProvider] Bootstrap theme applied on mount');
    } else {
      applyColorsToCSSWithGuard(DEFAULT_COLORS, undefined, 'default-sync-init');
      if (DEBUG_THEME) console.info('[ThemeProvider] Default theme applied on mount');
    }
    initialApplyDone.current = true;
  }

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    const mountId = mountIdRef.current;
    return () => {
      mountedRef.current = false;
      if (DEBUG_THEME) console.info(`[ThemeProvider] UNMOUNTING - ID: ${mountId}`);
    };
  }, []);

  useEffect(() => {
    themeSourceRef.current = themeSource;
  }, [themeSource]);

  // 🚨 DIAGNOSTIC: Hash function to detect if colors actually changed
  function getThemeHash(colors: ThemeColors, userId?: string): string {
    const colorString = Object.values(colors).join('').toLowerCase();
    return `${colorString}-${userId || 'anonymous'}`;
  }

  // 🚨 DIAGNOSTIC: Enhanced applyColorsToCSS with change detection
  function applyColorsToCSSWithGuard(colors: ThemeColors, userId?: string, source: string = 'unknown'): void {
    const hash = getThemeHash(colors, userId);
    
    if (lastAppliedHashRef.current === hash) {
      if (DEBUG_THEME) console.info(`[ThemeProvider] SKIPPED - Same colors already applied (source: ${source})`);
      return;
    }

    if (DEBUG_THEME) console.info(`[ThemeProvider] APPLYING - Hash: ${hash.substring(0, 20)}... (source: ${source})`);
    
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
    
    // Mark theme as ready for rendering routes
    if (!themeReady) {
      setThemeReady(true);
      if (DEBUG_THEME) console.info('[ThemeProvider] themeReady = true');
    }
  }

  applyColorsToCSSWithGuardRef.current = applyColorsToCSSWithGuard;
  ensureCabinetThemeFetchRef.current = ensureCabinetThemeFetch;
  ensureCabinetLogoFetchRef.current = ensureCabinetLogoFetch;
  cabinetColorsRef.current = cabinetColors;
  cabinetLogoRef.current = cabinetLogo;

  // Watch auth state changes and load theme when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (DEBUG_THEME) console.info('[ThemeProvider] Auth event:', event, 'User:', session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        // Clear theme immediately on logout
        if (activeUserId) {
          clearThemeCacheForUser(activeUserId);
        }
        cabinetThemePromiseRef.current = null;
        cabinetLogoPromiseRef.current = null;
        cabinetThemeLoadedRef.current = null;
        cabinetLogoLoadedRef.current = null;
        cabinetThemeRequestIdRef.current += 1;
        cabinetLogoRequestIdRef.current += 1;
        setActiveUserId(null);
        setColorsState(DEFAULT_COLORS);
        applyColorsToCSSWithGuardRef.current(DEFAULT_COLORS, undefined, 'signed-out');
        setLogo(undefined);
        setCabinetLogo(undefined);
        setIsLoading(false);
        if (DEBUG_THEME) console.info('[ThemeProvider] User signed out - reset to defaults');
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        const newUserId = session?.user?.id || null;
        if (newUserId !== activeUserId) {
          if (DEBUG_THEME) console.info('[ThemeProvider] User changed:', activeUserId, '->', newUserId);
          setActiveUserId(newUserId);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [activeUserId]);

  // Load theme when activeUserId or themeSource changes
  useEffect(() => {
    if (!activeUserId) {
      setIsLoading(false);
      return;
    }
    
    const requestId = ++activeRequestIdRef.current;
    if (DEBUG_THEME) console.info('[ThemeProvider] Loading theme for user:', activeUserId, 'request:', requestId);

    async function loadTheme() {
      try {
        // Guard: abort if request is stale
        if (!mountedRef.current || requestId !== activeRequestIdRef.current) {
          if (DEBUG_THEME) console.info('[ThemeProvider] Request aborted (stale)');
          return;
        }

        const cachedCabinetColors = getCabinetThemeFromCache(activeUserId);
        const cachedCabinetLogo = getCabinetLogoFromCache(activeUserId);

        if (cachedCabinetColors && !cabinetColorsRef.current) {
          setCabinetColors(cachedCabinetColors);
        }

        if (cachedCabinetLogo !== undefined && cabinetLogoRef.current === undefined) {
          setCabinetLogo(cachedCabinetLogo ?? undefined);
        }

        const immediateCabinetColors = cabinetColorsRef.current ?? cachedCabinetColors;
        if (themeSource === 'cabinet' && immediateCabinetColors) {
          setColorsState(immediateCabinetColors);
          applyColorsToCSSWithGuardRef.current(immediateCabinetColors, activeUserId || undefined, cachedCabinetColors ? 'cabinet-cache' : 'cabinet-state');
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!mountedRef.current || requestId !== activeRequestIdRef.current || !user) return;
        if (user.id !== activeUserId) return; // User changed during load

        // Hiérarchie modifiée selon themeSource
        let finalColors = DEFAULT_COLORS;
        let source = 'default';

        // Charger original theme (une seule fois par session)
        if (!originalColors) {
          const loadedOriginal = await loadOriginalTheme();
          if (loadedOriginal) {
            setOriginalColors(loadedOriginal);
          }
        }

        void ensureCabinetThemeFetchRef.current?.(user.id);
        void ensureCabinetLogoFetchRef.current?.(user.id);

        // Maintenant déterminer les couleurs UI selon themeSource
        if (themeSource === 'cabinet') {
          // Mode cabinet: utiliser les couleurs cabinet pour l'UI, ou original si pas de cabinet
          finalColors = immediateCabinetColors ?? originalColors ?? DEFAULT_COLORS;
          source = immediateCabinetColors ? (cachedCabinetColors ? 'cabinet-cache' : 'cabinet-state') : (originalColors ? 'original-db' : 'cabinet-default');
        } else {
          // themeSource='custom' : logique normale avec cache/ui_settings
          const cachedColors = getThemeFromCache(user.id);
          if (cachedColors) {
            finalColors = cachedColors;
            source = 'cache';
            cacheAppliedRef.current = true;
          } else {
            // 1) Essayer ui_settings (nouveau système)
            try {
              const { data: uiSettings, error: uiError } = await supabase
                .from('ui_settings')
                .select('colors')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

              if (!uiError && uiSettings?.colors) {
                finalColors = convertFromSettingsFormat(uiSettings.colors);
                source = 'ui_settings';
                saveThemeToCache(finalColors, user.id);
              } else if (user.user_metadata?.theme_colors) {
                // 2) Fallback metadata (legacy admin)
                finalColors = convertFromSettingsFormat(user.user_metadata.theme_colors);
                source = 'user_metadata (legacy)';
                saveThemeToCache(finalColors, user.id);
              }
            } catch {
              if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;
              // 2) Fallback metadata (legacy admin)
              if (user.user_metadata?.theme_colors) {
                finalColors = convertFromSettingsFormat(user.user_metadata.theme_colors);
                source = 'user_metadata (fallback)';
                saveThemeToCache(finalColors, user.id);
              }
            }
          }
        }

        if (mountedRef.current && requestId === activeRequestIdRef.current) {
          setColorsState(finalColors);
          applyColorsToCSSWithGuardRef.current(finalColors, user.id, source);
          if (DEBUG_THEME) console.info(`[ThemeProvider] Theme loaded: ${source}`);
        }

        // Load logo from user_metadata
        if (user.user_metadata?.cover_slide_url && mountedRef.current) {
          setLogo(user.user_metadata.cover_slide_url);
          if (DEBUG_THEME) console.info('[ThemeProvider] Logo loaded');
        }
      } catch (error) {
        if (mountedRef.current && requestId === activeRequestIdRef.current) {
          console.error('[ThemeProvider] Error loading theme:', error);
          applyColorsToCSSWithGuardRef.current(DEFAULT_COLORS, undefined, 'error-fallback');
        }
      } finally {
        if (mountedRef.current && requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadTheme();
  }, [activeUserId, themeSource, originalColors]);

  // Met à jour les couleurs et applique immédiatement
  const setColors = useCallback((newColors: ThemeColors) => {
    setColorsState(newColors);
    applyColorsToCSSWithGuardRef.current(newColors, lastAppliedUserIdRef.current, 'setColors-manual');
  }, []);

  // Sauvegarde le thème dans ui_settings (nouveau système)
  const saveThemeToUiSettings = useCallback(async (colors: ThemeColors, themeName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Format pour Supabase
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

      const { error } = await supabase
        .from('ui_settings')
        .upsert({
          user_id: user.id,
          theme_name: themeName || 'custom',
          colors: settingsColors,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Également sauvegarder dans le cache local isolé par user
      saveThemeToCache(colors, user.id, themeName);

      return { success: true };
    } catch (error: any) {
      console.error('Error saving theme to ui_settings:', error);
      return { success: false, error: error.message };
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
    <ThemeContext.Provider value={{ colors: colorsState, setColors, saveThemeToUiSettings, isLoading, themeReady, logo, setLogo, cabinetLogo, cabinetColors, themeScope, setThemeScope, pptxColors, themeSource, setThemeSource }}>
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
