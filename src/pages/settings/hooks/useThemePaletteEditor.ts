import { useEffect, useState } from 'react';
import { useTheme } from '@/settings/ThemeProvider';
import { DEFAULT_COLORS as DEFAULT_THEME_COLORS } from '@/settings/theme';
import { COLOR_USAGE_GUIDELINES } from '@/settings/theme/colorUsageGuidelines';
import { recalculatePaletteFromC1 } from '@/settings/theme/paletteGenerator';
import { PRESET_THEMES, type PresetTheme } from '@/settings/presets';

const DEFAULT_COLORS = {
  color1: DEFAULT_THEME_COLORS.c1,
  color2: DEFAULT_THEME_COLORS.c2,
  color3: DEFAULT_THEME_COLORS.c3,
  color4: DEFAULT_THEME_COLORS.c4,
  color5: DEFAULT_THEME_COLORS.c5,
  color6: DEFAULT_THEME_COLORS.c6,
  color7: DEFAULT_THEME_COLORS.c7,
  color8: DEFAULT_THEME_COLORS.c8,
  color9: DEFAULT_THEME_COLORS.c9,
  color10: DEFAULT_THEME_COLORS.c10,
};

export type LegacyColors = typeof DEFAULT_COLORS;
export type LegacyColorKey = keyof LegacyColors;

export interface ThemeCard {
  id: string;
  name: string;
  description: string;
  colors: LegacyColors;
}

export const COLOR_FIELDS: Array<{ key: LegacyColorKey; description: string }> =
  COLOR_USAGE_GUIDELINES.map(({ legacyKey, usage }) => ({
    key: legacyKey as LegacyColorKey,
    description: usage,
  }));

export const PREDEFINED_THEMES: ThemeCard[] = PRESET_THEMES.map((theme: PresetTheme) => ({
  id: theme.id,
  name: theme.name,
  description: theme.description,
  colors: {
    color1: theme.colors.c1,
    color2: theme.colors.c2,
    color3: theme.colors.c3,
    color4: theme.colors.c4,
    color5: theme.colors.c5,
    color6: theme.colors.c6,
    color7: theme.colors.c7,
    color8: theme.colors.c8,
    color9: theme.colors.c9,
    color10: theme.colors.c10,
  },
}));

export function useThemePaletteEditor() {
  const {
    colors,
    setColors,
    isLoading: themeLoading,
    themeMode,
    presetId,
    myPalette,
    applyThemeMode,
    saveMyPalette,
  } = useTheme();
  const [colorsLegacy, setColorsLegacy] = useState<LegacyColors>(DEFAULT_COLORS);
  const [colorText, setColorText] = useState<LegacyColors>(DEFAULT_COLORS);
  const [savingColors, setSavingColors] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  useEffect(() => {
    if (!colors || themeLoading) return;
    const legacyColors = {
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
    setColorsLegacy(legacyColors);
    setColorText(legacyColors);
  }, [colors, themeLoading]);

  const syncThemeColors = (settingsColors: LegacyColors) => {
    setColors({
      c1: settingsColors.color1,
      c2: settingsColors.color2,
      c3: settingsColors.color3,
      c4: settingsColors.color4,
      c5: settingsColors.color5,
      c6: settingsColors.color6,
      c7: settingsColors.color7,
      c8: settingsColors.color8,
      c9: settingsColors.color9,
      c10: settingsColors.color10,
    });
  };

  const handleColorChange = (key: LegacyColorKey, value: string) => {
    if (themeMode !== 'my') return;

    const newColors = { ...colorsLegacy, [key]: value };
    setColorsLegacy(newColors);
    setColorText((prev) => ({ ...prev, [key]: value.toUpperCase() }));
    setSaveMessage('');

    if (key === 'color1') {
      const recalculated = recalculatePaletteFromC1(value) as LegacyColors;
      const finalColors = { ...newColors, ...recalculated };
      setColorsLegacy(finalColors);
      const recalculatedText = Object.fromEntries(
        Object.entries(recalculated).map(([colorKey, colorValue]) => [
          colorKey,
          colorValue.toUpperCase(),
        ]),
      ) as LegacyColors;
      setColorText((prev) => ({ ...prev, ...recalculatedText }));
      syncThemeColors(finalColors);
      return;
    }

    syncThemeColors(newColors);
  };

  const handlePresetSelect = async (presetTheme: ThemeCard) => {
    setSaveMessage('');
    await applyThemeMode('preset', presetTheme.id);
  };

  const handleMyThemeSelect = async () => {
    setSaveMessage('');
    await applyThemeMode('my');
  };

  const handleCustomSourceSelect = () => {
    if (myPalette) {
      void applyThemeMode('my');
      return;
    }
    const firstPreset = PRESET_THEMES[0];
    if (firstPreset) void applyThemeMode('preset', firstPreset.id);
  };

  const handleSaveMyPalette = async () => {
    try {
      setSavingColors(true);
      setSaveMessage('');

      if (themeMode !== 'my') {
        setSaveMessage('Passez sur "Mon thème" pour modifier et enregistrer votre palette.');
        return;
      }

      const result = await saveMyPalette({
        c1: colorsLegacy.color1,
        c2: colorsLegacy.color2,
        c3: colorsLegacy.color3,
        c4: colorsLegacy.color4,
        c5: colorsLegacy.color5,
        c6: colorsLegacy.color6,
        c7: colorsLegacy.color7,
        c8: colorsLegacy.color8,
        c9: colorsLegacy.color9,
        c10: colorsLegacy.color10,
      });

      setSaveMessage(
        result.success
          ? 'Thème personnalisé enregistré avec succès.'
          : `Erreur lors de l'enregistrement : ${result.error}`,
      );
    } catch (error) {
      console.error(error);
      setSaveMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSavingColors(false);
    }
  };

  return {
    themeMode,
    presetId,
    myPalette,
    colorsLegacy,
    colorText,
    savingColors,
    saveMessage,
    showAdvancedColors,
    applyThemeMode,
    handleCustomSourceSelect,
    handlePresetSelect,
    handleMyThemeSelect,
    handleSaveMyPalette,
    handleColorChange,
    toggleAdvancedColors: () => setShowAdvancedColors((value) => !value),
  };
}
