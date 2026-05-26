import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { supabase } from '../../../supabaseClient';
import { DEFAULT_COLORS, type ThemeColors } from '../../theme';
import type { ThemeMode, ThemeSource } from '../types';
import { resolvePresetColors } from '../../presets';
import { saveThemeToCache } from './useThemeCache';
import { writeThemeSourceToStorage } from '../themeSourceStorage';

type ApplyColorsFn = (_colors: ThemeColors, _userId?: string, _source?: string) => void;

interface ThemeMutationResult {
  success: boolean;
  error?: string;
}

interface UseThemeActionsArgs {
  setColorsState: Dispatch<SetStateAction<ThemeColors>>;
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>;
  setPresetId: Dispatch<SetStateAction<string | null>>;
  setThemeSource: Dispatch<SetStateAction<ThemeSource>>;
  setMyPalette: Dispatch<SetStateAction<ThemeColors | null>>;
  cabinetColorsRef: MutableRefObject<ThemeColors | null | undefined>;
  cabinetBrandingKeyRef: MutableRefObject<string | null>;
  ensureCabinetThemeFetch: (
    _userId: string,
    _brandingKey: string | null,
  ) => Promise<ThemeColors | null>;
  myPaletteRef: MutableRefObject<ThemeColors | null>;
  themeModeRef: MutableRefObject<ThemeMode>;
  lastAppliedHashRef: MutableRefObject<string>;
  lastAppliedSourceRankRef: MutableRefObject<number>;
  lastAppliedUserIdRef: MutableRefObject<string>;
  applyColorsToCSSWithGuardRef: MutableRefObject<ApplyColorsFn>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function useThemeActions({
  setColorsState,
  setThemeMode,
  setPresetId,
  setThemeSource,
  setMyPalette,
  cabinetColorsRef,
  cabinetBrandingKeyRef,
  ensureCabinetThemeFetch,
  myPaletteRef,
  themeModeRef,
  lastAppliedHashRef,
  lastAppliedSourceRankRef,
  lastAppliedUserIdRef,
  applyColorsToCSSWithGuardRef,
}: UseThemeActionsArgs): {
  setColors: (_colors: ThemeColors) => void;
  applyThemeMode: (_mode: ThemeMode, _presetId?: string) => Promise<ThemeMutationResult>;
  saveMyPalette: (_colors: ThemeColors) => Promise<ThemeMutationResult>;
} {
  const setColors = useCallback(
    (newColors: ThemeColors) => {
      setColorsState(newColors);
      applyColorsToCSSWithGuardRef.current(
        newColors,
        lastAppliedUserIdRef.current,
        'setColors-manual',
      );
    },
    [applyColorsToCSSWithGuardRef, lastAppliedUserIdRef, setColorsState],
  );

  const applyThemeMode = useCallback(
    async (mode: ThemeMode, presetId?: string): Promise<ThemeMutationResult> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }

        let colorsToApply: ThemeColors;

        if (mode === 'cabinet') {
          const cabinetPalette = cabinetColorsRef.current;
          if (cabinetPalette) {
            colorsToApply = cabinetPalette;
          } else {
            const fetchedPalette = await ensureCabinetThemeFetch(
              user.id,
              cabinetBrandingKeyRef.current ?? null,
            );
            colorsToApply = fetchedPalette || DEFAULT_COLORS;
          }
        } else if (mode === 'preset' && presetId) {
          colorsToApply = resolvePresetColors(presetId) || DEFAULT_COLORS;
        } else if (mode === 'my') {
          colorsToApply = myPaletteRef.current || DEFAULT_COLORS;
        } else {
          return { success: false, error: 'Invalid mode' };
        }

        const { error } = await supabase.from('ui_settings').upsert(
          {
            user_id: user.id,
            theme_mode: mode,
            preset_id: mode === 'preset' ? presetId || null : null,
          },
          { onConflict: 'user_id' },
        );

        if (error) {
          throw error;
        }

        setThemeMode(mode);
        setPresetId(mode === 'preset' ? presetId || null : null);
        const derivedSource: ThemeSource = mode === 'cabinet' ? 'cabinet' : 'custom';
        setThemeSource(derivedSource);
        writeThemeSourceToStorage(cabinetBrandingKeyRef.current ?? null, derivedSource);

        lastAppliedSourceRankRef.current = 0;
        lastAppliedHashRef.current = '';
        setColorsState(colorsToApply);
        applyColorsToCSSWithGuardRef.current(colorsToApply, user.id, `apply-${mode}`);
        saveThemeToCache(colorsToApply, user.id, derivedSource);

        return { success: true };
      } catch (error: unknown) {
        console.error('[ThemeProvider] applyThemeMode error:', error);
        return { success: false, error: getErrorMessage(error) };
      }
    },
    [
      applyColorsToCSSWithGuardRef,
      cabinetBrandingKeyRef,
      cabinetColorsRef,
      ensureCabinetThemeFetch,
      lastAppliedHashRef,
      lastAppliedSourceRankRef,
      myPaletteRef,
      setColorsState,
      setPresetId,
      setThemeMode,
      setThemeSource,
    ],
  );

  const saveMyPalette = useCallback(
    async (colors: ThemeColors): Promise<ThemeMutationResult> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }

        const isMyMode = themeModeRef.current === 'my';
        const upsertData: Record<string, unknown> = {
          user_id: user.id,
          my_palette: colors,
        };

        if (isMyMode) {
          upsertData.theme_mode = 'my';
        }

        const { error } = await supabase
          .from('ui_settings')
          .upsert(upsertData, { onConflict: 'user_id' });

        if (error) {
          throw error;
        }

        setMyPalette(colors);

        if (isMyMode) {
          lastAppliedSourceRankRef.current = 0;
          lastAppliedHashRef.current = '';
          setColorsState(colors);
          applyColorsToCSSWithGuardRef.current(colors, user.id, 'save-my-palette');
          saveThemeToCache(colors, user.id, 'custom');
        }

        return { success: true };
      } catch (error: unknown) {
        console.error('[ThemeProvider] saveMyPalette error:', error);
        return { success: false, error: getErrorMessage(error) };
      }
    },
    [
      applyColorsToCSSWithGuardRef,
      lastAppliedHashRef,
      lastAppliedSourceRankRef,
      setColorsState,
      setMyPalette,
      themeModeRef,
    ],
  );

  return {
    setColors,
    applyThemeMode,
    saveMyPalette,
  };
}
