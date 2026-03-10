import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { supabase } from '../../../supabaseClient';
import { DEFAULT_COLORS, type ThemeColors } from '../../theme';
import type { ThemeMode, ThemeScope, ThemeSource } from '../types';
import type { LogoPlacement } from '../../../pptx/theme/types';
import { resolvePresetColors } from '../../presets';
import {
  getThemeBootstrap,
  saveCabinetLogoToCache,
  saveCabinetThemeToCache,
  saveThemeToCache,
  clearThemeCacheForUser,
  CABINET_THEME_CACHE_KEY_PREFIX,
} from './useThemeCache';
import {
  convertDbPaletteToThemeColors,
  convertFromSettingsFormat,
  loadCabinetBrandingKey,
  loadCabinetLogo,
  loadCabinetThemeWithRetry,
  loadOriginalTheme,
} from './useCabinetTheme';
import { readThemeSourceFromStorage, writeThemeSourceToStorage } from '../themeSourceStorage';

type ApplyColorsFn = (_colors: ThemeColors, _userId?: string, _source?: string) => void;

interface UseThemeSessionArgs {
  applyColorsToCSSWithGuardRef: MutableRefObject<ApplyColorsFn>;
  lastAppliedHashRef: MutableRefObject<string>;
  lastAppliedSourceRankRef: MutableRefObject<number>;
}

interface ThemeBootstrapValue {
  colors: ThemeColors;
  userId?: string | null;
}

interface UiSettingsRow {
  theme_mode?: string | null;
  preset_id?: string | null;
  my_palette?: Record<string, unknown> | null;
  selected_theme_ref?: string | null;
  custom_palette?: Record<string, unknown> | null;
  active_palette?: Record<string, unknown> | null;
  colors?: Record<string, string> | null;
  theme_name?: string | null;
}

const CABINET_BRANDING_KEY_BY_USER_PREFIX = 'ser1_cabinet_branding_key_';

export interface ThemeSessionState {
  themeBootstrap: ThemeBootstrapValue | null;
  colorsState: ThemeColors;
  setColorsState: Dispatch<SetStateAction<ThemeColors>>;
  logo: string | undefined;
  setLogo: Dispatch<SetStateAction<string | undefined>>;
  cabinetLogo: string | undefined;
  logoPlacement: LogoPlacement;
  isLoading: boolean;
  themeReady: boolean;
  setThemeReady: Dispatch<SetStateAction<boolean>>;
  themeScope: ThemeScope;
  setThemeScope: Dispatch<SetStateAction<ThemeScope>>;
  cabinetBrandingKey: string | null;
  themeSource: ThemeSource;
  setThemeSource: Dispatch<SetStateAction<ThemeSource>>;
  cabinetColors: ThemeColors | null | undefined;
  originalColors: ThemeColors | null;
  setOriginalColors: Dispatch<SetStateAction<ThemeColors | null>>;
  themeMode: ThemeMode;
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>;
  presetId: string | null;
  setPresetId: Dispatch<SetStateAction<string | null>>;
  myPalette: ThemeColors | null;
  setMyPalette: Dispatch<SetStateAction<ThemeColors | null>>;
  customPalette: ThemeColors | null;
  setCustomPalette: Dispatch<SetStateAction<ThemeColors | null>>;
  selectedThemeRef: string;
  setSelectedThemeRef: Dispatch<SetStateAction<string>>;
  cabinetColorsRef: MutableRefObject<ThemeColors | null | undefined>;
  cabinetBrandingKeyRef: MutableRefObject<string | null>;
  myPaletteRef: MutableRefObject<ThemeColors | null>;
  themeModeRef: MutableRefObject<ThemeMode>;
  ensureCabinetThemeFetch: (_userId: string, _brandingKey: string | null) => Promise<ThemeColors | null>;
}

export function useThemeSession({
  applyColorsToCSSWithGuardRef,
  lastAppliedHashRef,
  lastAppliedSourceRankRef,
}: UseThemeSessionArgs): ThemeSessionState {
  const themeBootstrap = getThemeBootstrap();
  const [colorsState, setColorsState] = useState<ThemeColors>(() => themeBootstrap?.colors ?? DEFAULT_COLORS);
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [cabinetLogo, setCabinetLogo] = useState<string | undefined>(undefined);
  const [logoPlacement, setLogoPlacement] = useState<LogoPlacement>('center-bottom');
  const [isLoading, setIsLoading] = useState(true);
  const [themeReady, setThemeReady] = useState(false);
  const [themeScope, setThemeScope] = useState<ThemeScope>('all');
  const [cabinetBrandingKey, setCabinetBrandingKey] = useState<string | null>(null);
  const [themeSource, setThemeSource] = useState<ThemeSource>(() => readThemeSourceFromStorage(null));
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [cabinetColors, setCabinetColors] = useState<ThemeColors | null | undefined>(undefined);
  const [originalColors, setOriginalColors] = useState<ThemeColors | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('cabinet');
  const [presetId, setPresetId] = useState<string | null>(null);
  const [myPalette, setMyPalette] = useState<ThemeColors | null>(null);
  const [customPalette, setCustomPalette] = useState<ThemeColors | null>(null);
  const [selectedThemeRef, setSelectedThemeRef] = useState<string>('cabinet');

  const mountedRef = useRef<boolean>(true);
  const activeRequestIdRef = useRef<number>(0);
  const cabinetThemePromiseRef = useRef<Promise<ThemeColors | null> | null>(null);
  const cabinetLogoPromiseRef = useRef<Promise<{ logo?: string; placement?: LogoPlacement }> | null>(null);
  const cabinetThemeLoadedRef = useRef<string | null>(null);
  const cabinetLogoLoadedRef = useRef<string | null>(null);
  const cabinetThemeRequestIdRef = useRef<number>(0);
  const cabinetLogoRequestIdRef = useRef<number>(0);
  const themeModeRef = useRef<ThemeMode>(themeMode);
  const myPaletteRef = useRef<ThemeColors | null>(myPalette);
  const cabinetColorsRef = useRef<ThemeColors | null | undefined>(cabinetColors);
  const cabinetLogoRef = useRef<string | undefined>(cabinetLogo);
  const logoPlacementRef = useRef<LogoPlacement>(logoPlacement);
  const cabinetBrandingKeyRef = useRef<string | null>(cabinetBrandingKey);

  themeModeRef.current = themeMode;
  myPaletteRef.current = myPalette;
  cabinetColorsRef.current = cabinetColors;
  cabinetLogoRef.current = cabinetLogo;
  logoPlacementRef.current = logoPlacement;
  cabinetBrandingKeyRef.current = cabinetBrandingKey;

  const ensureCabinetThemeFetch = useCallback(async (userId: string, brandingKey: string | null): Promise<ThemeColors | null> => {
    const loadKey = `${userId}::${brandingKey ?? 'cabinet:none'}`;

    if (cabinetThemeLoadedRef.current === loadKey && cabinetThemePromiseRef.current) {
      return cabinetThemePromiseRef.current;
    }

    if (cabinetThemeLoadedRef.current === loadKey && !cabinetThemePromiseRef.current) {
      return Promise.resolve(cabinetColorsRef.current ?? null);
    }

    cabinetThemeLoadedRef.current = loadKey;
    const requestId = ++cabinetThemeRequestIdRef.current;
    const promise = (async () => {
      const colors = await loadCabinetThemeWithRetry(userId, mountedRef, cabinetThemeRequestIdRef, requestId);
      if (!mountedRef.current || requestId !== cabinetThemeRequestIdRef.current) {
        return colors;
      }

      if (colors === null) {
        setCabinetColors(null);
        if (brandingKey) {
          localStorage.removeItem(`${CABINET_THEME_CACHE_KEY_PREFIX}${brandingKey}`);
        }
      } else {
        setCabinetColors(colors);
        saveCabinetThemeToCache(colors, brandingKey);
      }

      return colors;
    })();

    cabinetThemePromiseRef.current = promise;
    return promise;
  }, []);

  const ensureCabinetLogoFetch = useCallback(async (userId: string, brandingKey: string | null): Promise<{ logo?: string; placement?: LogoPlacement }> => {
    const loadKey = `${userId}::${brandingKey ?? 'cabinet:none'}`;

    if (cabinetLogoLoadedRef.current === loadKey && cabinetLogoPromiseRef.current) {
      return cabinetLogoPromiseRef.current;
    }

    if (cabinetLogoLoadedRef.current === loadKey && !cabinetLogoPromiseRef.current) {
      return Promise.resolve({ logo: cabinetLogoRef.current, placement: logoPlacementRef.current });
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
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
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
  }, [activeUserId, applyColorsToCSSWithGuardRef]);

  useEffect(() => {
    if (!activeUserId) {
      setIsLoading(false);
      return;
    }

    const requestId = ++activeRequestIdRef.current;

    async function loadTheme(): Promise<void> {
      try {
        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!mountedRef.current || requestId !== activeRequestIdRef.current || !user) return;
        if (user.id !== activeUserId) return;

        let uiSettings: UiSettingsRow | null = null;

        try {
          const { data, error } = await supabase
            .from('ui_settings')
            .select('theme_mode, preset_id, my_palette, selected_theme_ref, custom_palette, active_palette, colors')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!error) {
            uiSettings = data;
          }
        } catch (error) {
          console.warn('[ThemeProvider] Failed to load ui_settings:', error);
        }

        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

        const brandingKey = await loadCabinetBrandingKey(user.id);
        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;
        setCabinetBrandingKey(brandingKey);
        if (typeof window !== 'undefined') {
          const storageKey = `${CABINET_BRANDING_KEY_BY_USER_PREFIX}${user.id}`;
          if (brandingKey) {
            localStorage.setItem(storageKey, brandingKey);
          } else {
            localStorage.removeItem(storageKey);
          }
        }

        let mode: ThemeMode;
        let nextPresetId: string | null = null;

        if (uiSettings?.theme_mode && ['cabinet', 'preset', 'my'].includes(uiSettings.theme_mode)) {
          mode = uiSettings.theme_mode as ThemeMode;
          nextPresetId = uiSettings.preset_id || null;
        } else {
          const legacySelectedThemeRef = uiSettings?.selected_theme_ref || 'cabinet';
          mode = legacySelectedThemeRef === 'cabinet' ? 'cabinet' : 'my';
        }

        const rawMyPalette = uiSettings?.my_palette || uiSettings?.custom_palette;
        if (rawMyPalette) {
          const convertedMyPalette = convertDbPaletteToThemeColors(rawMyPalette);
          if (convertedMyPalette) {
            setMyPalette(convertedMyPalette);
            setCustomPalette(convertedMyPalette);
          }
        }

        let loadedOriginal = originalColors;
        if (!originalColors) {
          loadedOriginal = await loadOriginalTheme();
          if (loadedOriginal) {
            setOriginalColors(loadedOriginal);
          }
        }

        const fetchedCabinetTheme = await ensureCabinetThemeFetch(user.id, brandingKey);
        void ensureCabinetLogoFetch(user.id, brandingKey);

        if (!mountedRef.current || requestId !== activeRequestIdRef.current) return;

        let finalColors = DEFAULT_COLORS;
        let source = 'default';

        switch (mode) {
          case 'cabinet':
            if (fetchedCabinetTheme) {
              finalColors = fetchedCabinetTheme;
              source = 'cabinet-theme';
            } else if (loadedOriginal) {
              finalColors = loadedOriginal;
              source = 'original-db';
            }
            break;

          case 'preset':
            if (nextPresetId) {
              const presetColors = resolvePresetColors(nextPresetId);
              if (presetColors) {
                finalColors = presetColors;
                source = 'preset';
              }
            }
            if (source === 'default' && uiSettings?.active_palette) {
              const activePalette = convertDbPaletteToThemeColors(uiSettings.active_palette);
              if (activePalette) {
                finalColors = activePalette;
                source = 'active-palette-fallback';
              }
            }
            break;

          case 'my': {
            const convertedMyPalette = rawMyPalette ? convertDbPaletteToThemeColors(rawMyPalette) : null;
            if (convertedMyPalette) {
              finalColors = convertedMyPalette;
              source = 'my-palette';
            } else if (uiSettings?.active_palette) {
              const activePalette = convertDbPaletteToThemeColors(uiSettings.active_palette);
              if (activePalette) {
                finalColors = activePalette;
                source = 'active-palette-legacy';
              }
            } else if (uiSettings?.colors) {
              finalColors = convertFromSettingsFormat(uiSettings.colors);
              source = 'ui_settings-legacy';
            } else if (user.user_metadata?.theme_colors) {
              finalColors = convertFromSettingsFormat(user.user_metadata.theme_colors as Record<string, string>);
              source = 'user_metadata-legacy';
            }
            break;
          }
        }

        setThemeMode(mode);
        setPresetId(nextPresetId);
        const derivedSource: ThemeSource = mode === 'cabinet' ? 'cabinet' : 'custom';
        setSelectedThemeRef(mode === 'cabinet' ? 'cabinet' : 'custom');
        setThemeSource(derivedSource);
        writeThemeSourceToStorage(brandingKey, derivedSource);

        lastAppliedSourceRankRef.current = 0;
        lastAppliedHashRef.current = '';

        if (mountedRef.current && requestId === activeRequestIdRef.current) {
          setColorsState(finalColors);
          applyColorsToCSSWithGuardRef.current(finalColors, user.id, source);
          saveThemeToCache(finalColors, user.id, derivedSource);
        }

        if (user.user_metadata?.cover_slide_url && mountedRef.current) {
          setLogo(user.user_metadata.cover_slide_url as string);
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

    void loadTheme();
  }, [activeUserId, originalColors, ensureCabinetLogoFetch, ensureCabinetThemeFetch, applyColorsToCSSWithGuardRef, lastAppliedHashRef, lastAppliedSourceRankRef]);

  useEffect(() => {
    async function loadThemeScope(): Promise<void> {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: uiSettings, error } = await supabase
            .from('ui_settings')
            .select('theme_name')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && uiSettings?.theme_name) {
            if (uiSettings.theme_name.includes('ui-only')) {
              setThemeScope('ui-only');
            } else {
              setThemeScope('all');
            }
          }
        }
      } catch (error) {
        console.error('[ThemeProvider] Error loading theme scope:', error);
      }
    }

    void loadThemeScope();
  }, []);

  return {
    themeBootstrap,
    colorsState,
    setColorsState,
    logo,
    setLogo,
    cabinetLogo,
    logoPlacement,
    isLoading,
    themeReady,
    setThemeReady,
    themeScope,
    setThemeScope,
    cabinetBrandingKey,
    themeSource,
    setThemeSource,
    cabinetColors,
    originalColors,
    setOriginalColors,
    themeMode,
    setThemeMode,
    presetId,
    setPresetId,
    myPalette,
    setMyPalette,
    customPalette,
    setCustomPalette,
    selectedThemeRef,
    setSelectedThemeRef,
    cabinetColorsRef,
    cabinetBrandingKeyRef,
    myPaletteRef,
    themeModeRef,
    ensureCabinetThemeFetch,
  };
}
