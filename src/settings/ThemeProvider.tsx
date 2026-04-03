/**
 * ThemeProvider - Fournit le thème à toute l'application
 *
 * Gère :
 * - L'application CSS gardée contre les régressions de ranking/hash
 * - Le contexte React public
 * - L'assemblage des hooks session/actions/events
 */

import React, { createContext, useCallback, useContext, useRef } from 'react';
import { resolvePptxColors } from '../pptx/theme/resolvePptxColors';
import { DEFAULT_COLORS, type ThemeColors } from './theme';
import type { ThemeContextValue, ThemeProviderProps, ThemeScope, ThemeSource } from './theme/types';
import { SOURCE_RANKS, applyColorsToCSS, getThemeHash } from './theme/hooks/useThemeSync';
import { useThemeActions } from './theme/hooks/useThemeActions';
import { useThemeEvents } from './theme/hooks/useThemeEvents';
import { useThemeSession } from './theme/hooks/useThemeSession';

export { DEFAULT_COLORS, type ThemeColors } from './theme';
export type { ThemeScope, ThemeSource } from './theme/types';

type ApplyColorsFn = (_colors: ThemeColors, _userId?: string, _source?: string) => void;

const DEFAULT_THEME_CONTEXT_VALUE: ThemeContextValue = {
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
  themeMode: 'cabinet',
  presetId: null,
  myPalette: null,
  applyThemeMode: async () => ({ success: false, error: 'Not implemented' }),
  saveMyPalette: async () => ({ success: false, error: 'Not implemented' }),
  themeSource: 'cabinet',
  setThemeSource: (_source: ThemeSource) => {},
  customPalette: null,
  selectedThemeRef: 'cabinet',
  setSelectedThemeRef: (_ref: string) => {},
  saveThemeToUiSettings: async () => ({ success: false, error: 'Not implemented' }),
  saveCustomPalette: async () => ({ success: false, error: 'Not implemented' }),
};

const noopApplyColors: ApplyColorsFn = () => {};

const ThemeContext = createContext<ThemeContextValue>(DEFAULT_THEME_CONTEXT_VALUE);

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const lastAppliedHashRef = useRef<string>('');
  const lastAppliedUserIdRef = useRef<string>('');
  const lastAppliedSourceRankRef = useRef<number>(0);
  const applyColorsToCSSWithGuardRef = useRef<ApplyColorsFn>(noopApplyColors);
  const initialApplyDone = useRef(false);

  const session = useThemeSession({
    applyColorsToCSSWithGuardRef,
    lastAppliedHashRef,
    lastAppliedSourceRankRef,
  });
  const { themeReady, setThemeReady } = session;

  const pptxColors: ThemeColors = resolvePptxColors(
    session.colorsState,
    session.themeScope,
    session.cabinetColors,
    session.originalColors,
  );

  const applyColorsToCSSWithGuard = useCallback((colors: ThemeColors, userId?: string, source: string = 'unknown'): void => {
    const hash = getThemeHash(colors, userId);
    const currentRank = SOURCE_RANKS[source] ?? 0;
    const lastRank = lastAppliedSourceRankRef.current;

    if (lastAppliedHashRef.current === hash) {
      return;
    }

    if (currentRank < lastRank && lastAppliedUserIdRef.current === (userId || '')) {
      console.warn(`[ThemeProvider] BLOCKED - Source ${source}(rank ${currentRank}) tried to overwrite rank ${lastRank}`);
      return;
    }

    applyColorsToCSS(colors);

    lastAppliedHashRef.current = hash;
    lastAppliedUserIdRef.current = userId || '';
    lastAppliedSourceRankRef.current = currentRank;

    if (!themeReady) {
      setThemeReady(true);
    }
  }, [setThemeReady, themeReady]);

  applyColorsToCSSWithGuardRef.current = applyColorsToCSSWithGuard;

  if (!initialApplyDone.current) {
    if (session.themeBootstrap?.colors) {
      applyColorsToCSSWithGuard(session.themeBootstrap.colors, session.themeBootstrap.userId ?? undefined, 'bootstrap-cache');
    } else {
      applyColorsToCSSWithGuard(DEFAULT_COLORS, undefined, 'default-sync-init');
    }
    initialApplyDone.current = true;
  }

  const {
    setColors,
    applyThemeMode,
    saveMyPalette,
    saveCustomPalette,
    saveThemeToUiSettings,
  } = useThemeActions({
    setColorsState: session.setColorsState,
    setThemeMode: session.setThemeMode,
    setPresetId: session.setPresetId,
    setThemeSource: session.setThemeSource,
    setMyPalette: session.setMyPalette,
    setCustomPalette: session.setCustomPalette,
    setSelectedThemeRef: session.setSelectedThemeRef,
    cabinetColorsRef: session.cabinetColorsRef,
    cabinetBrandingKeyRef: session.cabinetBrandingKeyRef,
    ensureCabinetThemeFetch: session.ensureCabinetThemeFetch,
    myPaletteRef: session.myPaletteRef,
    themeModeRef: session.themeModeRef,
    lastAppliedHashRef,
    lastAppliedSourceRankRef,
    lastAppliedUserIdRef,
    applyColorsToCSSWithGuardRef,
  });

  useThemeEvents({
    setOriginalColors: session.setOriginalColors,
    setColorsState: session.setColorsState,
    applyColorsToCSSWithGuardRef,
    lastAppliedSourceRankRef,
    lastAppliedUserIdRef,
  });

  return (
    <ThemeContext.Provider
      value={{
        colors: session.colorsState,
        setColors,
        isLoading: session.isLoading,
        themeReady,
        logo: session.logo,
        setLogo: session.setLogo,
        cabinetLogo: session.cabinetLogo,
        logoPlacement: session.logoPlacement,
        cabinetColors: session.cabinetColors,
        themeScope: session.themeScope,
        setThemeScope: session.setThemeScope,
        pptxColors,
        themeMode: session.themeMode,
        presetId: session.presetId,
        myPalette: session.myPalette,
        applyThemeMode,
        saveMyPalette,
        themeSource: session.themeSource,
        setThemeSource: session.setThemeSource,
        customPalette: session.customPalette,
        selectedThemeRef: session.selectedThemeRef,
        setSelectedThemeRef: session.setSelectedThemeRef,
        saveThemeToUiSettings,
        saveCustomPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
