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
import type { ThemeContextValue, ThemeProviderProps, ThemeScope, ThemeSource, ThemeMode } from './theme/types';
import { resolvePresetColors } from './presets';
import { getThemeBootstrap } from './theme/hooks/useThemeCache';
import {
  saveThemeToCache,
  clearThemeCacheForUser,
  saveCabinetThemeToCache,
  saveCabinetLogoToCache,
  CABINET_THEME_CACHE_KEY_PREFIX,
} from './theme/hooks/useThemeCache';
import {
  convertFromSettingsFormat,
  convertDbPaletteToThemeColors,
  loadCabinetBrandingKey,
  loadCabinetLogo,
  loadOriginalTheme,
  loadCabinetThemeWithRetry,
} from './theme/hooks/useCabinetTheme';
import { SOURCE_RANKS, getThemeHash, applyColorsToCSS } from './theme/hooks/useThemeSync';

// Re-export for backward compatibility
export { DEFAULT_COLORS, type ThemeColors } from './theme';
export type { ThemeScope, ThemeSource } from './theme/types';

const ThemeContext = createContext<ThemeContextValue>({
  colors: DEFAULT_COLORS,
  setColors: (_colors: ThemeColors) => {},
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
  // V5
  themeMode: 'cabinet',
  presetId: null,
  myPalette: null,
  applyThemeMode: async () => ({ success: false, error: 'Not implemented' }),
  saveMyPalette: async () => ({ success: false, error: 'Not implemented' }),
  // Compat legacy
  themeSource: 'cabinet',
  setThemeSource: (_source: ThemeSource) => {},
  customPalette: null,
  selectedThemeRef: 'cabinet',
  setSelectedThemeRef: (_ref: string) => {},
  saveThemeToUiSettings: async () => ({ success: false, error: 'Not implemented' }),
  saveCustomPalette: async () => ({ success: false, error: 'Not implemented' }),
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

const THEME_SOURCE_LEGACY_KEY = 'themeSource';
const THEME_SOURCE_DEFAULT_BRANDING_KEY = 'cabinet:none';

function getThemeSourceStorageKey(cabinetBrandingKey: string | null): string {
  return `themeSource:${cabinetBrandingKey ?? THEME_SOURCE_DEFAULT_BRANDING_KEY}`;
}

function readThemeSourceFromStorage(cabinetBrandingKey: string | null): ThemeSource {
  if (typeof window === 'undefined') return 'cabinet';

  const scoped = localStorage.getItem(getThemeSourceStorageKey(cabinetBrandingKey));
  if (scoped === 'cabinet' || scoped === 'custom') return scoped;

  if (!cabinetBrandingKey) {
    const legacy = localStorage.getItem(THEME_SOURCE_LEGACY_KEY);
    if (legacy === 'cabinet' || legacy === 'custom') return legacy;
  }

  return 'cabinet';
}

function writeThemeSourceToStorage(cabinetBrandingKey: string | null, source: ThemeSource): void {
  if (typeof window === 'undefined') return;
  // Gouvernance P0-03: themeSource doit être scindé par cabinet pour éviter les fuites cross-tenant.
  localStorage.setItem(getThemeSourceStorageKey(cabinetBrandingKey), source);
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
  const [cabinetBrandingKey, setCabinetBrandingKey] = useState<string | null>(null);
  const [themeSource, setThemeSource] = useState<ThemeSource>(() => readThemeSourceFromStorage(null));
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  // Couleurs cabinet stockées séparément (chargées 1x, read-only pour PPTX)
  // Tri-état: undefined = pas encore chargé, null = pas de cabinet confirmé, ThemeColors = palette cabinet
  const [cabinetColors, setCabinetColors] = useState<ThemeColors | null | undefined>(undefined);
  // Thème Original depuis DB (pour users sans cabinet)
  const [originalColors, setOriginalColors] = useState<ThemeColors | null>(null);
  // V5: Modèle déterministe à 3 états
  const [themeMode, setThemeMode] = useState<ThemeMode>('cabinet');
  const [presetId, setPresetId] = useState<string | null>(null);
  const [myPalette, setMyPalette] = useState<ThemeColors | null>(null);
  // Compat legacy (dérivés)
  const [customPalette, setCustomPalette] = useState<ThemeColors | null>(null);
  const [selectedThemeRef, setSelectedThemeRef] = useState<string>('cabinet');

  // Compute PPTX colors - PRIORITÉ: cabinet > original (sans cabinet) > custom selon scope
  // RÈGLE MÉTIER: PPTX = cabinet si dispo, sinon original ou custom selon scope
  const pptxColors: ThemeColors = resolvePptxColors(colorsState, themeScope, cabinetColors, originalColors);

  const ensureCabinetThemeFetch = (userId: string, brandingKey: string | null): Promise<ThemeColors | null> => {
    const loadKey = `${userId}::${brandingKey ?? 'cabinet:none'}`;

    if (cabinetThemeLoadedRef.current === loadKey && cabinetThemePromiseRef.current) {
      return cabinetThemePromiseRef.current;
    }

    if (cabinetThemeLoadedRef.current === loadKey && !cabinetThemePromiseRef.current) {
      // Si cabinetColors est undefined (pas encore chargé), on recharge
      // Si cabinetColors est null (pas de cabinet confirmé), on retourne null
      // Si cabinetColors est un objet, on le retourne
      return Promise.resolve(cabinetColorsRef.current ?? null);
    }

    cabinetThemeLoadedRef.current = loadKey;
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
        if (brandingKey) {
          localStorage.removeItem(`${CABINET_THEME_CACHE_KEY_PREFIX}${brandingKey}`);
        }
      } else {
        // Cabinet existe: sauvegarder dans state et cache
        setCabinetColors(colors);
        saveCabinetThemeToCache(colors, brandingKey);
      }

      return colors;
    })();

    cabinetThemePromiseRef.current = promise;
    return promise;
  };

  const ensureCabinetLogoFetch = (userId: string, brandingKey: string | null): Promise<{ logo?: string; placement?: import('../pptx/theme/types').LogoPlacement }> => {
    const loadKey = `${userId}::${brandingKey ?? 'cabinet:none'}`;

    if (cabinetLogoLoadedRef.current === loadKey && cabinetLogoPromiseRef.current) {
      return cabinetLogoPromiseRef.current;
    }

    if (cabinetLogoLoadedRef.current === loadKey && !cabinetLogoPromiseRef.current) {
      return Promise.resolve({ logo: cabinetLogo, placement: logoPlacement });
    }

    cabinetLogoLoadedRef.current = loadKey;
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
      saveCabinetLogoToCache(result.logo ?? null, brandingKey);
      return result;
    })();

    cabinetLogoPromiseRef.current = promise;
    return promise;
  };

  // 🚨 DIAGNOSTIC: Track hash and user ID to prevent unnecessary reapplications
  const lastAppliedHashRef = useRef<string>('');
  const lastAppliedUserIdRef = useRef<string>('');
  const lastAppliedSourceRankRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const activeRequestIdRef = useRef<number>(0);
  const cabinetThemePromiseRef = useRef<Promise<ThemeColors | null> | null>(null);
  const cabinetLogoPromiseRef = useRef<Promise<{ logo?: string; placement?: import('../pptx/theme/types').LogoPlacement }> | null>(null);
  const cabinetThemeLoadedRef = useRef<string | null>(null);
  const cabinetLogoLoadedRef = useRef<string | null>(null);
  const cabinetThemeRequestIdRef = useRef<number>(0);
  const cabinetLogoRequestIdRef = useRef<number>(0);
  const themeSourceRef = useRef<ThemeSource>(themeSource);
  const themeModeRef = useRef<ThemeMode>(themeMode);
  const myPaletteRef = useRef<ThemeColors | null>(myPalette);
  const cabinetColorsRef = useRef<ThemeColors | null | undefined>(cabinetColors);
  const cabinetLogoRef = useRef<string | undefined>(cabinetLogo);
  const cabinetBrandingKeyRef = useRef<string | null>(cabinetBrandingKey);
  const ensureCabinetThemeFetchRef = useRef<((_userId: string, _brandingKey: string | null) => Promise<ThemeColors | null>) | null>(null);
  const ensureCabinetLogoFetchRef = useRef<((_userId: string, _brandingKey: string | null) => Promise<{ logo?: string; placement?: import('../pptx/theme/types').LogoPlacement }>) | null>(null);
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

  useEffect(() => { themeSourceRef.current = themeSource; }, [themeSource]);
  useEffect(() => { themeModeRef.current = themeMode; }, [themeMode]);
  useEffect(() => { myPaletteRef.current = myPalette; }, [myPalette]);
  useEffect(() => { cabinetBrandingKeyRef.current = cabinetBrandingKey; }, [cabinetBrandingKey]);

  // 🚨 DIAGNOSTIC: Enhanced applyColorsToCSS with change detection AND source ranking
  // Ranking: cabinet(3) > original-db(2) > custom/ui_settings(1) > default/bootstrap(0)
  function applyColorsToCSSWithGuard(colors: ThemeColors, userId?: string, source: string = 'unknown'): void {
    const hash = getThemeHash(colors, userId);
    const currentRank = SOURCE_RANKS[source] ?? 0;
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

    applyColorsToCSS(colors);

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
        setCabinetBrandingKey(null);
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

// V5: Load theme — single deterministic switch on theme_mode
  useEffect(() => {
    if (!activeUserId) {
      setIsLoading(false);
      return;
    }
    
    const requestId = ++activeRequestIdRef.current;

    async function loadTheme() {
      try {
        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

        // ─── 1. AUTH
        const { data: { user } } = await supabase.auth.getUser();
        if (!mountedRef.current || requestId !== activeRequestIdRef.current || !user) return;
        if (user.id !== activeUserId) return;

        // ─── 2. Lire ui_settings (colonnes V5 + anciennes pour fallback)
        let uiSettings: {
          theme_mode?: string;
          preset_id?: string;
          my_palette?: any;
          selected_theme_ref?: string;
          custom_palette?: any;
          active_palette?: any;
          colors?: any;
        } | null = null;

        try {
          const { data, error } = await supabase
            .from('ui_settings')
            .select('theme_mode, preset_id, my_palette, selected_theme_ref, custom_palette, active_palette, colors')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!error) uiSettings = data;
        } catch (e) {
          console.warn('[ThemeProvider] Failed to load ui_settings:', e);
        }

        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

        const brandingKey = await loadCabinetBrandingKey(user.id);
        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;
        setCabinetBrandingKey(brandingKey);

        // ─── 3. Déterminer mode (V5 → fallback anciennes colonnes)
        let mode: ThemeMode;
        let pId: string | null = null;

        if (uiSettings?.theme_mode && ['cabinet', 'preset', 'my'].includes(uiSettings.theme_mode)) {
          mode = uiSettings.theme_mode as ThemeMode;
          pId = uiSettings.preset_id || null;
        } else {
          // Fallback: dériver depuis selected_theme_ref (compat V4)
          const ref = uiSettings?.selected_theme_ref || 'cabinet';
          mode = ref === 'cabinet' ? 'cabinet' : 'my';
        }

        // ─── 4. Charger my_palette en mémoire (toujours, pour tile "Mon thème")
        const rawMyPalette = uiSettings?.my_palette || uiSettings?.custom_palette;
        if (rawMyPalette) {
          const mp = convertDbPaletteToThemeColors(rawMyPalette);
          if (mp) {
            setMyPalette(mp);
            setCustomPalette(mp); // compat legacy
          }
        }

        // ─── 5. Charger données complémentaires
        let loadedOriginal = originalColors;
        if (!originalColors) {
          loadedOriginal = await loadOriginalTheme();
          if (loadedOriginal) setOriginalColors(loadedOriginal);
        }

        // Toujours charger cabinet (pour PPTX même si mode != cabinet)
        const fetchedCab = await ensureCabinetThemeFetchRef.current?.(user.id, brandingKey) ?? null;
        void ensureCabinetLogoFetchRef.current?.(user.id, brandingKey);

        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

        // ─── 6. Résoudre couleurs finales — SWITCH DÉTERMINISTE
        let finalColors = DEFAULT_COLORS;
        let source = 'default';

        switch (mode) {
          case 'cabinet':
            if (fetchedCab) {
              finalColors = fetchedCab;
              source = 'cabinet-theme';
            } else if (loadedOriginal) {
              finalColors = loadedOriginal;
              source = 'original-db';
            }
            break;

          case 'preset':
            if (pId) {
              const presetColors = resolvePresetColors(pId);
              if (presetColors) {
                finalColors = presetColors;
                source = 'preset';
              }
            }
            // Fallback: active_palette si preset inconnu
            if (source === 'default' && uiSettings?.active_palette) {
              const ap = convertDbPaletteToThemeColors(uiSettings.active_palette);
              if (ap) { finalColors = ap; source = 'active-palette-fallback'; }
            }
            break;

          case 'my': {
            const mp = rawMyPalette ? convertDbPaletteToThemeColors(rawMyPalette) : null;
            if (mp) {
              finalColors = mp;
              source = 'my-palette';
            } else if (uiSettings?.active_palette) {
              // Fallback V4
              const ap = convertDbPaletteToThemeColors(uiSettings.active_palette);
              if (ap) { finalColors = ap; source = 'active-palette-legacy'; }
            } else if (uiSettings?.colors) {
              finalColors = convertFromSettingsFormat(uiSettings.colors);
              source = 'ui_settings-legacy';
            } else if (user.user_metadata?.theme_colors) {
              finalColors = convertFromSettingsFormat(user.user_metadata.theme_colors);
              source = 'user_metadata-legacy';
            }
            break;
          }
        }

        // ─── 7. Mettre à jour state V5
        setThemeMode(mode);
        setPresetId(pId);
        // Compat legacy
        const derivedSource: ThemeSource = mode === 'cabinet' ? 'cabinet' : 'custom';
        setSelectedThemeRef(mode === 'cabinet' ? 'cabinet' : 'custom');
        if (themeSourceRef.current !== derivedSource) setThemeSource(derivedSource);
        writeThemeSourceToStorage(brandingKey, derivedSource);

        // ─── 8. Application finale (reset guard pour éviter blocage)
        lastAppliedSourceRankRef.current = 0;
        lastAppliedHashRef.current = '';

        if (mountedRef.current && requestId === activeRequestIdRef.current) {
          setColorsState(finalColors);
          applyColorsToCSSWithGuardRef.current(finalColors, user.id, source);
          saveThemeToCache(finalColors, user.id, derivedSource);
        }

        // Logo
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
  }, [activeUserId, originalColors]);

  // Met à jour les couleurs et applique immédiatement
  const setColors = useCallback((newColors: ThemeColors) => {
    setColorsState(newColors);
    applyColorsToCSSWithGuardRef.current(newColors, lastAppliedUserIdRef.current, 'setColors-manual');
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // V5: applyThemeMode — persiste mode + applique immédiatement
  // ═══════════════════════════════════════════════════════════════════
  const applyThemeMode = useCallback(async (mode: ThemeMode, pId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };

      // Résoudre les couleurs à appliquer
      let colorsToApply: ThemeColors;

      if (mode === 'cabinet') {
        const cab = cabinetColorsRef.current;
        if (cab) {
          colorsToApply = cab;
        } else {
          const fetched = await ensureCabinetThemeFetchRef.current?.(user.id, cabinetBrandingKeyRef.current ?? null);
          colorsToApply = fetched || DEFAULT_COLORS;
        }
      } else if (mode === 'preset' && pId) {
        colorsToApply = resolvePresetColors(pId) || DEFAULT_COLORS;
      } else if (mode === 'my') {
        colorsToApply = myPaletteRef.current || DEFAULT_COLORS;
      } else {
        return { success: false, error: 'Invalid mode' };
      }

      // Écriture DB (V5 + compat legacy)
      const { error } = await supabase
        .from('ui_settings')
        .upsert({
          user_id: user.id,
          // V5
          theme_mode: mode,
          preset_id: mode === 'preset' ? (pId || null) : null,
          active_palette: colorsToApply,
          // Compat legacy
          selected_theme_ref: mode === 'cabinet' ? 'cabinet' : 'custom',
          colors: {
            color1: colorsToApply.c1, color2: colorsToApply.c2, color3: colorsToApply.c3,
            color4: colorsToApply.c4, color5: colorsToApply.c5, color6: colorsToApply.c6,
            color7: colorsToApply.c7, color8: colorsToApply.c8, color9: colorsToApply.c9,
            color10: colorsToApply.c10,
          },
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // State V5
      setThemeMode(mode);
      setPresetId(mode === 'preset' ? (pId || null) : null);
      // Compat legacy
      const derivedSource: ThemeSource = mode === 'cabinet' ? 'cabinet' : 'custom';
      setThemeSource(derivedSource);
      setSelectedThemeRef(mode === 'cabinet' ? 'cabinet' : 'custom');
      writeThemeSourceToStorage(cabinetBrandingKeyRef.current ?? null, derivedSource);

      // Appliquer immédiatement
      lastAppliedSourceRankRef.current = 0;
      lastAppliedHashRef.current = '';
      setColorsState(colorsToApply);
      applyColorsToCSSWithGuardRef.current(colorsToApply, user.id, `apply-${mode}`);
      saveThemeToCache(colorsToApply, user.id, derivedSource);

      return { success: true };
    } catch (error: any) {
      console.error('[ThemeProvider] applyThemeMode error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // V5: saveMyPalette — écrit my_palette SANS changer theme_mode
  //     Si déjà en mode 'my', applique aussi immédiatement
  // ═══════════════════════════════════════════════════════════════════
  const saveMyPalette = useCallback(async (colors: ThemeColors): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };

      const isMyMode = themeModeRef.current === 'my';

      const upsertData: Record<string, any> = {
        user_id: user.id,
        my_palette: colors,
        custom_palette: colors, // compat legacy
      };

      // Si mode = 'my', aussi activer et appliquer
      if (isMyMode) {
        upsertData.theme_mode = 'my';
        upsertData.active_palette = colors;
        upsertData.selected_theme_ref = 'custom';
      }

      const { error } = await supabase
        .from('ui_settings')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (error) throw error;

      // State
      setMyPalette(colors);
      setCustomPalette(colors); // compat

      // Si mode = 'my', appliquer immédiatement
      if (isMyMode) {
        lastAppliedSourceRankRef.current = 0;
        lastAppliedHashRef.current = '';
        setColorsState(colors);
        applyColorsToCSSWithGuardRef.current(colors, user.id, 'save-my-palette');
        saveThemeToCache(colors, user.id, 'custom');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ThemeProvider] saveMyPalette error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Legacy wrappers (compat Settings.jsx V4)
  // ═══════════════════════════════════════════════════════════════════
  const saveCustomPalette = useCallback(async (colors: ThemeColors): Promise<{ success: boolean; error?: string }> => {
    // Délègue à saveMyPalette + force mode 'my'
    const result = await saveMyPalette(colors);
    if (result.success) {
      await applyThemeMode('my');
    }
    return result;
  }, [saveMyPalette, applyThemeMode]);

  const saveThemeToUiSettings = useCallback(async (colors: ThemeColors, themeRef?: string): Promise<{ success: boolean; error?: string }> => {
    // Délègue à applyThemeMode
    if (themeRef === 'cabinet') {
      return applyThemeMode('cabinet');
    }
    // Sinon c'est un apply de couleurs custom/preset — utiliser applyThemeMode('my')
    return applyThemeMode('my');
  }, [applyThemeMode]);

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
    <ThemeContext.Provider value={{ colors: colorsState, setColors, isLoading, themeReady, logo, setLogo, cabinetLogo, logoPlacement, cabinetColors, themeScope, setThemeScope, pptxColors, themeMode, presetId, myPalette, applyThemeMode, saveMyPalette, themeSource, setThemeSource, customPalette, selectedThemeRef, setSelectedThemeRef, saveThemeToUiSettings, saveCustomPalette }}>
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
