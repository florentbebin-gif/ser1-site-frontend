// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeSourceSection } from './ThemeSourceSection';

describe('ThemeSourceSection', () => {
  it('affiche Mon thème en mode personnalisé même sans palette enregistrée', () => {
    render(
      <ThemeSourceSection
        themeMode="my"
        presetId={null}
        myPalette={null}
        onCabinetSelect={vi.fn()}
        onCustomSelect={vi.fn()}
        onMyThemeSelect={vi.fn()}
        onPresetSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Mon thème/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mon thème/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
