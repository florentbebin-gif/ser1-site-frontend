// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeColorsSection } from './ThemeColorsSection';
import { PREDEFINED_THEMES, type LegacyColors } from '../hooks/useThemePaletteEditor';

const COLORS: LegacyColors = {
  color1: '#0E1426',
  color2: '#1F3056',
  color3: '#5B73A0',
  color4: '#C6CFE2',
  color5: '#475061',
  color6: '#C2733A',
  color7: '#F2EEE8',
  color8: '#C9CCDA',
  color9: '#424659',
  color10: '#060A18',
};

describe('ThemeColorsSection', () => {
  it('duplique le thème choisi dans Couleurs de l’interface', async () => {
    const user = userEvent.setup();
    const onDuplicateTheme = vi.fn();

    render(
      <ThemeColorsSection
        colorsLegacy={COLORS}
        colorText={COLORS}
        showAdvancedColors={false}
        duplicateThemes={PREDEFINED_THEMES}
        duplicateThemeId="ser1-aubergine-2026"
        onDuplicateThemeChange={vi.fn()}
        onDuplicateTheme={onDuplicateTheme}
        onToggleAdvancedColors={vi.fn()}
        onColorChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Thème à dupliquer' })).toHaveValue(
      'ser1-aubergine-2026',
    );

    const duplicateButton = screen.getByRole('button', { name: 'Dupliquer le thème choisi' });
    expect(duplicateButton).toHaveClass('sim-action-btn--duplicate');

    await user.click(duplicateButton);

    expect(onDuplicateTheme).toHaveBeenCalledTimes(1);
  });
});
