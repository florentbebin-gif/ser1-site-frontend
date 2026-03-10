import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { ThemeColors } from '../../theme';
import { loadOriginalTheme } from './useCabinetTheme';

type ApplyColorsFn = (_colors: ThemeColors, _userId?: string, _source?: string) => void;

interface ThemeUpdatedDetail {
  themeSource?: string;
  colors?: ThemeColors;
}

interface UseThemeEventsArgs {
  setOriginalColors: Dispatch<SetStateAction<ThemeColors | null>>;
  setColorsState: Dispatch<SetStateAction<ThemeColors>>;
  applyColorsToCSSWithGuardRef: MutableRefObject<ApplyColorsFn>;
  lastAppliedSourceRankRef: MutableRefObject<number>;
  lastAppliedUserIdRef: MutableRefObject<string>;
}

export function useThemeEvents({
  setOriginalColors,
  setColorsState,
  applyColorsToCSSWithGuardRef,
  lastAppliedSourceRankRef,
  lastAppliedUserIdRef,
}: UseThemeEventsArgs): void {
  useEffect(() => {
    const handleOriginalThemeUpdated = async (): Promise<void> => {
      const loadedOriginal = await loadOriginalTheme();
      if (loadedOriginal) {
        setOriginalColors(loadedOriginal);
      }
    };

    window.addEventListener('ser1-original-theme-updated', handleOriginalThemeUpdated);
    return () => {
      window.removeEventListener('ser1-original-theme-updated', handleOriginalThemeUpdated);
    };
  }, [setOriginalColors]);

  useEffect(() => {
    const handleThemeUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<ThemeUpdatedDetail>;
      const { themeSource, colors } = customEvent.detail || {};

      if (themeSource === 'custom' && colors) {
        const previousRank = lastAppliedSourceRankRef.current;
        if (previousRank > 1) {
          lastAppliedSourceRankRef.current = 0;
        }

        setColorsState(colors);
        applyColorsToCSSWithGuardRef.current(colors, lastAppliedUserIdRef.current, 'custom');
      }
    };

    window.addEventListener('ser1-theme-updated', handleThemeUpdated);
    return () => {
      window.removeEventListener('ser1-theme-updated', handleThemeUpdated);
    };
  }, [applyColorsToCSSWithGuardRef, lastAppliedSourceRankRef, lastAppliedUserIdRef, setColorsState]);
}
