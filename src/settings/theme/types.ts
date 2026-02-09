/**
 * Theme Types — Interfaces et types pour le système de thème SER1
 *
 * Extraits de ThemeProvider.tsx pour centraliser les contrats de données.
 */

import React from 'react';
import type { ThemeColors } from '../theme';
import type { LogoPlacement } from '../../pptx/theme/types';

// Re-export pour usage direct
export type { ThemeColors } from '../theme';

// ─── Cache structures ────────────────────────────────────────────────

export interface ThemeCache {
  colors: ThemeColors;
  timestamp: number;
  themeName?: string;
}

export interface CabinetThemeCache {
  colors: ThemeColors;
  timestamp: number;
}

export interface CabinetLogoCache {
  logo: string;
  timestamp: number;
}

// ─── Theme scope & source ────────────────────────────────────────────

export type ThemeScope = 'all' | 'ui-only';
export type ThemeSource = 'cabinet' | 'custom';

/** V5: Modèle déterministe à 3 états */
export type ThemeMode = 'cabinet' | 'preset' | 'my';

// ─── Context value ───────────────────────────────────────────────────

export interface ThemeContextValue {
  colors: ThemeColors;
  setColors: (_colors: ThemeColors) => void;
  isLoading: boolean;
  themeReady: boolean;
  logo?: string;
  setLogo: (_logo: string | undefined) => void;
  cabinetLogo?: string;
  logoPlacement?: LogoPlacement;
  cabinetColors: ThemeColors | null | undefined;
  themeScope: ThemeScope;
  setThemeScope: (_scope: ThemeScope) => void;
  pptxColors: ThemeColors;
  // V5: modèle déterministe
  themeMode: ThemeMode;
  presetId: string | null;
  myPalette: ThemeColors | null;
  applyThemeMode: (_mode: ThemeMode, _presetId?: string) => Promise<{ success: boolean; error?: string }>;
  saveMyPalette: (_colors: ThemeColors) => Promise<{ success: boolean; error?: string }>;
  // Compat legacy (dérivés)
  themeSource: ThemeSource;
  setThemeSource: (_source: ThemeSource) => void;
  customPalette: ThemeColors | null;
  selectedThemeRef: string;
  setSelectedThemeRef: (_ref: string) => void;
  saveThemeToUiSettings: (_colors: ThemeColors, _themeName?: string) => Promise<{ success: boolean; error?: string }>;
  saveCustomPalette: (_colors: ThemeColors) => Promise<{ success: boolean; error?: string }>;
}

// ─── Provider props ──────────────────────────────────────────────────

export interface ThemeProviderProps {
  children: React.ReactNode;
}
