// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_COLORS } from '@/settings/theme';
import { useTheme } from '@/settings/ThemeProvider';
import { PREDEFINED_THEMES, useThemePaletteEditor } from './useThemePaletteEditor';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: vi.fn(),
}));

const setColors = vi.fn();
const applyThemeMode = vi.fn();
const saveMyPalette = vi.fn();

describe('useThemePaletteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      colors: DEFAULT_COLORS,
      setColors,
      isLoading: false,
      themeMode: 'my',
      presetId: null,
      myPalette: DEFAULT_COLORS,
      applyThemeMode,
      saveMyPalette,
    } as unknown as ReturnType<typeof useTheme>);
  });

  it('expose Cuivre tranché comme thème à dupliquer par défaut', () => {
    const { result } = renderHook(() => useThemePaletteEditor());

    expect(result.current.duplicateThemes[0]?.id).toBe('ser1-cuivre-tranche');
    expect(result.current.duplicateThemeId).toBe('ser1-cuivre-tranche');
  });

  it('duplique un preset dans Mon thème sans sauvegarde immédiate', () => {
    const { result } = renderHook(() => useThemePaletteEditor());
    const aubergine = PREDEFINED_THEMES.find((theme) => theme.id === 'ser1-aubergine-2026');

    act(() => {
      result.current.handleDuplicateThemeToMyTheme('ser1-aubergine-2026');
    });

    expect(setColors).toHaveBeenCalledWith({
      c1: aubergine?.colors.color1,
      c2: aubergine?.colors.color2,
      c3: aubergine?.colors.color3,
      c4: aubergine?.colors.color4,
      c5: aubergine?.colors.color5,
      c6: aubergine?.colors.color6,
      c7: aubergine?.colors.color7,
      c8: aubergine?.colors.color8,
      c9: aubergine?.colors.color9,
      c10: aubergine?.colors.color10,
    });
    expect(saveMyPalette).not.toHaveBeenCalled();
    expect(result.current.saveMessage).toContain('dupliquée');
  });

  it('ouvre Mon thème même sans palette personnalisée enregistrée', () => {
    vi.mocked(useTheme).mockReturnValue({
      colors: DEFAULT_COLORS,
      setColors,
      isLoading: false,
      themeMode: 'preset',
      presetId: 'ser1-cuivre-tranche',
      myPalette: null,
      applyThemeMode,
      saveMyPalette,
    } as unknown as ReturnType<typeof useTheme>);

    const { result } = renderHook(() => useThemePaletteEditor());

    act(() => {
      result.current.handleCustomSourceSelect();
    });

    expect(applyThemeMode).toHaveBeenCalledWith('my');
  });
});
