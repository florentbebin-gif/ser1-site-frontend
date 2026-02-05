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
import { resolvePptxColors } from '../pptx/theme/resolvePptxColors';
import { DEFAULT_COLORS, type ThemeColors } from './theme';

// Re-export for backward compatibility
export { DEFAULT_COLORS } from './theme';

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
  } catch (e) {
    console.warn('[ThemeProvider] Cache clear error:', e);
  }
}

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
  saveCustomPalette: (_colors: ThemeColors) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  themeReady: boolean;
  logo?: string;
  setLogo: (_logo: string | undefined) => void;
  cabinetLogo?: string;
  logoPlacement?: import('../pptx/theme/types').LogoPlacement;
  cabinetColors: ThemeColors | null | undefined;
  themeScope: ThemeScope;
  setThemeScope: (_scope: ThemeScope) => void;
  pptxColors: ThemeColors;
  themeSource: ThemeSource;
  setThemeSource: (_source: ThemeSource) => void;
  customPalette: ThemeColors | null;
  selectedThemeRef: string;
  setSelectedThemeRef: (_ref: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DEFAULT_COLORS,
  setColors: (_colors: ThemeColors) => {},
  saveThemeToUiSettings: async (_colors: ThemeColors, _themeName?: string) => ({ success: false, error: 'Not implemented' }),
  saveCustomPalette: async (_colors: ThemeColors) => ({ success: false, error: 'Not implemented' }),
  isLoading: true,
  themeReady: false,
  logo: undefined,
  setLogo: (_logo: string | undefined) => {},
  cabinetLogo: undefined,
  logoPlacement: 'center-bottom',
  cabinetColors: null,
  themeScope: 'all',
  setThemeScope: (_scope: ThemeScope) => {},
  pptxColors: DEFAULT_COLORS,
  themeSource: 'cabinet',
  setThemeSource: (_source: ThemeSource) => {},
  customPalette: null,
  selectedThemeRef: 'cabinet',
  setSelectedThemeRef: (_ref: string) => {},
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
  const [logoPlacement, setLogoPlacement] = useState<import('../pptx/theme/types').LogoPlacement>('center-bottom');
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
  // Tri-état: undefined = pas encore chargé, null = pas de cabinet confirmé, ThemeColors = palette cabinet
  const [cabinetColors, setCabinetColors] = useState<ThemeColors | null | undefined>(undefined);
  // Thème Original depuis DB (pour users sans cabinet)
  const [originalColors, setOriginalColors] = useState<ThemeColors | null>(null);
  // 🎨 V4.0: Palette personnalisée persistée (séparée du thème sélectionné)
  const [customPalette, setCustomPalette] = useState<ThemeColors | null>(null);
  // Référence du thème actuellement sélectionné
  const [selectedThemeRef, setSelectedThemeRef] = useState<string>('cabinet');

  // Compute PPTX colors - PRIORITÉ: cabinet > original (sans cabinet) > custom selon scope
  // RÈGLE MÉTIER: PPTX = cabinet si dispo, sinon original ou custom selon scope
  const pptxColors: ThemeColors = resolvePptxColors(colorsState, themeScope, cabinetColors, originalColors);

  // Load cabinet logo for user via RPC (contourne RLS)
  // Returns data URI (base64) for direct use in PPTX exports
  const loadCabinetLogo = async (_userId: string): Promise<{ logo?: string; placement?: import('../pptx/theme/types').LogoPlacement }> => {
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
      
      return { logo: dataUri, placement: placement || 'center-bottom' };
    } catch {
      // Silently fail - logo loading is not critical
      return {};
    }
  };

  // Load cabinet theme for user via RPC (contourne RLS)
  // Retourne null si pas de cabinet, ThemeColors si palette existe
  const loadCabinetTheme = async (_userId: string): Promise<ThemeColors | null> => {
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
      
      return cabinetColors;
    } catch (error) {
      console.error('[ThemeProvider] Error loading cabinet theme:', error);
      // Erreur = on considère qu'il n'y a pas de cabinet
      return null;
    }
  };

  // Load original theme from DB (for users without cabinet)
  const loadOriginalTheme = async (): Promise<ThemeColors | null> => {
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

      return original;
    } catch (error) {
      console.error('[ThemeProvider] Error loading original theme:', error);
      return null;
    }
  };

  // Retry helper for cabinet theme with exponential backoff (first login timing issue)
  // Retourne null si pas de cabinet, ThemeColors si palette existe
  const loadCabinetThemeWithRetry = async (
    userId: string,
    mountedRef: React.MutableRefObject<boolean>,
    requestIdRef: React.MutableRefObject<number>,
    requestId: number
  ): Promise<ThemeColors | null> => {
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
  };

  const ensureCabinetThemeFetch = (userId: string): Promise<ThemeColors | null> => {
    if (cabinetThemeLoadedRef.current === userId && cabinetThemePromiseRef.current) {
      return cabinetThemePromiseRef.current;
    }

    if (cabinetThemeLoadedRef.current === userId && !cabinetThemePromiseRef.current) {
      // Si cabinetColors est undefined (pas encore chargé), on recharge
      // Si cabinetColors est null (pas de cabinet confirmé), on retourne null
      // Si cabinetColors est un objet, on le retourne
      return Promise.resolve(cabinetColorsRef.current ?? null);
    }

    cabinetThemeLoadedRef.current = userId;
    const requestId = ++cabinetThemeRequestIdRef.current;
    const promise = (async () => {
      const colors = await loadCabinetThemeWithRetry(userId, mountedRef, cabinetThemeRequestIdRef, requestId);
      if (!mountedRef.current || requestId !== cabinetThemeRequestIdRef.current) {
        return colors;
      }

      // 🚨 FIX: Gestion tri-état
      if (colors === null) {
        // Pas de cabinet confirmé: set null et PURGER le cache existant
        setCabinetColors(null);
        localStorage.removeItem(`ser1_cabinet_theme_cache_${userId}`);
      } else {
        // Cabinet existe: sauvegarder dans state et cache
        setCabinetColors(colors);
        saveCabinetThemeToCache(colors, userId);
      }

      return colors;
    })();

    cabinetThemePromiseRef.current = promise;
    return promise;
  };

  const ensureCabinetLogoFetch = (userId: string): Promise<{ logo?: string; placement?: import('../pptx/theme/types').LogoPlacement }> => {
    if (cabinetLogoLoadedRef.current === userId && cabinetLogoPromiseRef.current) {
      return cabinetLogoPromiseRef.current;
    }

    if (cabinetLogoLoadedRef.current === userId && !cabinetLogoPromiseRef.current) {
      return Promise.resolve({ logo: cabinetLogo, placement: logoPlacement });
    }

    cabinetLogoLoadedRef.current = userId;
    const requestId = ++cabinetLogoRequestIdRef.current;
    const promise = (async () => {
      const result = await loadCabinetLogo(userId);
      if (!mountedRef.current || requestId !== cabinetLogoRequestIdRef.current) {
        return result;
      }

      setCabinetLogo(result.logo);
      if (result.placement) {
        setLogoPlacement(result.placement);
      }
      saveCabinetLogoToCache(result.logo ?? null, userId);
      return result;
    })();

    cabinetLogoPromiseRef.current = promise;
    return promise;
  };

  // 🚨 DIAGNOSTIC: Track hash and user ID to prevent unnecessary reapplications
  const lastAppliedHashRef = useRef<string>('');
  const lastAppliedUserIdRef = useRef<string>('');
  const lastAppliedSourceRankRef = useRef<number>(0);
  const cacheAppliedRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const activeRequestIdRef = useRef<number>(0);
  const cabinetThemePromiseRef = useRef<Promise<ThemeColors | null> | null>(null);
  const cabinetLogoPromiseRef = useRef<Promise<{ logo?: string; placement?: import('../pptx/theme/types').LogoPlacement }> | null>(null);
  const cabinetThemeLoadedRef = useRef<string | null>(null);
  const cabinetLogoLoadedRef = useRef<string | null>(null);
  const cabinetThemeRequestIdRef = useRef<number>(0);
  const cabinetLogoRequestIdRef = useRef<number>(0);
  const themeSourceRef = useRef<ThemeSource>(themeSource);
  const cabinetColorsRef = useRef<ThemeColors | null | undefined>(cabinetColors);
  const cabinetLogoRef = useRef<string | undefined>(cabinetLogo);
  const ensureCabinetThemeFetchRef = useRef<((_userId: string) => Promise<ThemeColors | null>) | null>(null);
  const ensureCabinetLogoFetchRef = useRef<((_userId: string) => Promise<{ logo?: string; placement?: import('../pptx/theme/types').LogoPlacement }>) | null>(null);
  const applyColorsToCSSWithGuardRef = useRef(applyColorsToCSSWithGuard);

  // Debug: Log mount/unmount

  // Apply default immediately on mount
  const initialApplyDone = useRef(false);
  if (!initialApplyDone.current) {
    if (themeBootstrap?.colors) {
      applyColorsToCSSWithGuard(themeBootstrap.colors, themeBootstrap.userId ?? undefined, 'bootstrap-cache');
    } else {
      applyColorsToCSSWithGuard(DEFAULT_COLORS, undefined, 'default-sync-init');
    }
    initialApplyDone.current = true;
  }

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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

  // 🚨 DIAGNOSTIC: Enhanced applyColorsToCSS with change detection AND source ranking
  // Ranking: cabinet(3) > original-db(2) > custom/ui_settings(1) > default/bootstrap(0)
  function applyColorsToCSSWithGuard(colors: ThemeColors, userId?: string, source: string = 'unknown'): void {
    const hash = getThemeHash(colors, userId);
    
    // Source ranking pour empêcher qu'une source faible écrase une forte
    const sourceRanks: Record<string, number> = {
      'cabinet-cache': 3,
      'cabinet-state': 3,
      'cabinet-theme': 3,
      'original-db': 2,
      'ui_settings': 1,
      'user_metadata (legacy)': 1,
      'user_metadata (fallback)': 1,
      'cache': 1,
      'custom': 1,
      'default': 0,
      'default-sync-init': 0,
      'bootstrap-cache': 0,
      'signed-out': 0,
      'error-fallback': 0,
    };
    const currentRank = sourceRanks[source] ?? 0;
    const lastRank = lastAppliedSourceRankRef.current;
    
    // Si même hash, skip
    if (lastAppliedHashRef.current === hash) {
      return;
    }
    
    // Si source actuelle a un rank inférieur à la dernière source, refuser l'application
    // Exception: permettre la mise à jour si c'est le même user et une source différente
    if (currentRank < lastRank && lastAppliedUserIdRef.current === (userId || '')) {
      console.warn(`[ThemeProvider] BLOCKED - Source ${source}(rank ${currentRank}) tried to overwrite rank ${lastRank}`);
      return;
    }

    
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
    lastAppliedSourceRankRef.current = currentRank;
    
    // Mark theme as ready for rendering routes
    if (!themeReady) {
      setThemeReady(true);
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
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        const newUserId = session?.user?.id || null;
        if (newUserId !== activeUserId) {
          setActiveUserId(newUserId);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [activeUserId]);

  function convertDbPaletteToThemeColors(palette: any): ThemeColors | null {
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

// Load theme when activeUserId or themeSource changes
  useEffect(() => {
    if (!activeUserId) {
      setIsLoading(false);
      return;
    }
    
    const requestId = ++activeRequestIdRef.current;

    async function loadTheme() {
      try {
        // Guard: abort if request is stale
        if (!mountedRef.current || requestId !== activeRequestIdRef.current) {
          return;
        }

        const cachedCabinetColors = getCabinetThemeFromCache(activeUserId);
        const cachedCabinetLogo = getCabinetLogoFromCache(activeUserId);

        // 🚨 FIX: Ne charger le cache que si cabinetColors n'est pas encore chargé (undefined)
        // Si cabinetColors est null (pas de cabinet confirmé) ou un objet, ne pas écraser avec le cache
        if (cachedCabinetColors && cabinetColorsRef.current === undefined) {
          setCabinetColors(cachedCabinetColors);
        }

        if (cachedCabinetLogo !== undefined && cabinetLogoRef.current === undefined) {
          setCabinetLogo(cachedCabinetLogo ?? undefined);
        }

        // 🚨 FIX: Respecter le tri-état:
        // - cabinetColors === undefined : pas encore chargé, utiliser le cache si disponible
        // - cabinetColors === null : pas de cabinet confirmé, ne PAS utiliser le cache
        // - cabinetColors === ThemeColors : cabinet existe
        const immediateCabinetColors = cabinetColorsRef.current === undefined 
          ? cachedCabinetColors 
          : cabinetColorsRef.current; // peut être null ou ThemeColors
        
        // 🚨 FIX: Toujours charger originalColors s'ils ne sont pas encore chargés
        let loadedOriginal = originalColors;
        if (!originalColors) {
          loadedOriginal = await loadOriginalTheme();
          if (loadedOriginal) {
            setOriginalColors(loadedOriginal);
          }
        }

        // 🚨 FIX: Ne pas appliquer de CSS ici, attendre la décision finale après ensureCabinetThemeFetch
        // (Le premier apply rapide avec le cache est OK mais doit être cohérent)
        if (themeSource === 'cabinet' && immediateCabinetColors) {
          // Seulement si on a un vrai cabinet (pas null)
          setColorsState(immediateCabinetColors);
          applyColorsToCSSWithGuardRef.current(immediateCabinetColors, activeUserId || undefined, cachedCabinetColors ? 'cabinet-cache' : 'cabinet-state');
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!mountedRef.current || requestId !== activeRequestIdRef.current || !user) return;
        if (user.id !== activeUserId) return; // User changed during load

        // Charger le cabinet (ou confirmer qu'il n'y en a pas)
        const fetchedCabinetColors = await ensureCabinetThemeFetchRef.current?.(user.id);
        void ensureCabinetLogoFetchRef.current?.(user.id);

        // Hiérarchie modifiée selon themeSource
        let finalColors = DEFAULT_COLORS;
        let source = 'default';

        // Maintenant déterminer les couleurs UI selon themeSource
        if (themeSource === 'cabinet') {
          // 🚨 FIX: Mode cabinet avec tri-état
          // fetchedCabinetColors = ThemeColors si cabinet existe, null si pas de cabinet
          // Si pas de cabinet (null), utiliser originalColors
          if (fetchedCabinetColors) {
            finalColors = fetchedCabinetColors;
            source = 'cabinet-theme';
          } else if (loadedOriginal) {
            finalColors = loadedOriginal;
            source = 'original-db';
          } else {
            finalColors = DEFAULT_COLORS;
            source = 'default';
          }
        } else {
          // themeSource='custom' : logique normale avec cache/ui_settings
          const cachedColors = getThemeFromCache(user.id);
          if (cachedColors) {
            finalColors = cachedColors;
            source = 'cache';
            cacheAppliedRef.current = true;
          } else {
            // 1) Essayer ui_settings (nouveau système V4.0)
            try {
              const { data: uiSettings, error: uiError } = await supabase
                .from('ui_settings')
                .select('colors, custom_palette, selected_theme_ref, active_palette')
                .eq('user_id', user.id)
                .maybeSingle();

              if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

              if (!uiError && uiSettings) {
                // 🎨 V4.0: Charger la palette personnalisée si présente
                if (uiSettings.custom_palette) {
                  const customColors = convertDbPaletteToThemeColors(uiSettings.custom_palette);
                  if (customColors) {
                    setCustomPalette(customColors);
                  }
                }
                
                // 🎨 V4.0: Charger la référence du thème sélectionné
                if (uiSettings.selected_theme_ref) {
                  setSelectedThemeRef(uiSettings.selected_theme_ref);
                }
                
                // Déterminer les couleurs finales selon selected_theme_ref
                const themeRef = uiSettings.selected_theme_ref || 'cabinet';
                
                if (themeRef === 'custom' && uiSettings.custom_palette) {
                  // Utiliser la palette personnalisée
                  finalColors = convertDbPaletteToThemeColors(uiSettings.custom_palette) || DEFAULT_COLORS;
                  source = 'custom-palette';
                } else if (themeRef === 'cabinet' && fetchedCabinetColors) {
                  // Utiliser le thème du cabinet
                  finalColors = fetchedCabinetColors;
                  source = 'cabinet-theme';
                } else if (themeRef === 'original' && loadedOriginal) {
                  // Utiliser le thème original
                  finalColors = loadedOriginal;
                  source = 'original-db';
                } else if (uiSettings.active_palette) {
                  // Fallback sur active_palette (dénormalisé)
                  finalColors = convertDbPaletteToThemeColors(uiSettings.active_palette) || DEFAULT_COLORS;
                  source = 'active-palette';
                } else if (uiSettings.colors) {
                  // Fallback legacy sur colors
                  finalColors = convertFromSettingsFormat(uiSettings.colors);
                  source = 'ui_settings (legacy)';
                }
                
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
        }

        // Load logo from user_metadata
        if (user.user_metadata?.cover_slide_url && mountedRef.current) {
          setLogo(user.user_metadata.cover_slide_url);
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

  // 🎨 V4.0: Sauvegarde explicite de la palette personnalisée
  const saveCustomPalette = useCallback(async (colors: ThemeColors): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('ui_settings')
        .upsert({
          user_id: user.id,
          custom_palette: colors,
          selected_theme_ref: 'custom',
          active_palette: colors,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Mettre à jour le state local
      setCustomPalette(colors);
      setSelectedThemeRef('custom');
      
      // Sauvegarder dans le cache
      saveThemeToCache(colors, user.id, 'custom');

      return { success: true };
    } catch (error: any) {
      console.error('Error saving custom palette:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Sauvegarde le thème dans ui_settings (nouveau système)
  // V4.0: Met à jour selected_theme_ref sans écraser custom_palette
  const saveThemeToUiSettings = useCallback(async (colors: ThemeColors, themeRef?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Déterminer la référence du thème
      const ref = themeRef || 'custom';
      
      // Upsert: met à jour selected_theme_ref et active_palette
      // Ne touche PAS à custom_palette (préservé)
      const { error } = await supabase
        .from('ui_settings')
        .upsert({
          user_id: user.id,
          selected_theme_ref: ref,
          active_palette: colors,
          // Legacy: garder pour compatibilité
          theme_name: ref,
          colors: {
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
          },
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Mettre à jour le state local
      setSelectedThemeRef(ref);
      
      // Sauvegarder dans le cache
      saveThemeToCache(colors, user.id, ref);

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

  // Écouter les modifications du Thème Original pour recharger
  useEffect(() => {
    const handleOriginalThemeUpdated = async () => {
      const loadedOriginal = await loadOriginalTheme();
      if (loadedOriginal) {
        setOriginalColors(loadedOriginal);
      }
    };

    window.addEventListener('ser1-original-theme-updated', handleOriginalThemeUpdated);
    return () => {
      window.removeEventListener('ser1-original-theme-updated', handleOriginalThemeUpdated);
    };
  }, []);

  // 🚨 FIX: Écouter l'événement 'ser1-theme-updated' pour application immédiate après sauvegarde
  useEffect(() => {
    const handleThemeUpdated = (event: CustomEvent) => {
      const { themeSource: updatedSource, colors } = event.detail || {};
      
      
      if (updatedSource === 'custom' && colors) {
        // 🚨 FIX: Réinitialiser le rank pour permettre l'application du custom
        // après une sauvegarde explicite par l'utilisateur
        const prevRank = lastAppliedSourceRankRef.current;
        if (prevRank > 1) {
          // Si rank était > 1 (cabinet ou original-db), on le baisse temporairement
          // pour permettre l'application du custom
          lastAppliedSourceRankRef.current = 0;
        }
        
        // Appliquer immédiatement les couleurs
        setColorsState(colors);
        applyColorsToCSSWithGuardRef.current(colors, lastAppliedUserIdRef.current, 'custom');
        
      }
    };

    window.addEventListener('ser1-theme-updated', handleThemeUpdated as (_e: Event) => void);
    return () => {
      window.removeEventListener('ser1-theme-updated', handleThemeUpdated as (_e: Event) => void);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ colors: colorsState, setColors, saveThemeToUiSettings, saveCustomPalette, isLoading, themeReady, logo, setLogo, cabinetLogo, logoPlacement, cabinetColors, themeScope, setThemeScope, pptxColors, themeSource, setThemeSource, customPalette, selectedThemeRef, setSelectedThemeRef }}>
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
