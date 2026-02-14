import type { ThemeSource } from './types';

const THEME_SOURCE_LEGACY_KEY = 'themeSource';
const THEME_SOURCE_DEFAULT_BRANDING_KEY = 'cabinet:none';

export function getThemeSourceStorageKey(cabinetBrandingKey: string | null): string {
  return `themeSource:${cabinetBrandingKey ?? THEME_SOURCE_DEFAULT_BRANDING_KEY}`;
}

export function readThemeSourceFromStorage(cabinetBrandingKey: string | null): ThemeSource {
  if (typeof window === 'undefined') return 'cabinet';

  const scoped = localStorage.getItem(getThemeSourceStorageKey(cabinetBrandingKey));
  if (scoped === 'cabinet' || scoped === 'custom') return scoped;

  if (!cabinetBrandingKey) {
    const legacy = localStorage.getItem(THEME_SOURCE_LEGACY_KEY);
    if (legacy === 'cabinet' || legacy === 'custom') return legacy;
  }

  return 'cabinet';
}

export function writeThemeSourceToStorage(cabinetBrandingKey: string | null, source: ThemeSource): void {
  if (typeof window === 'undefined') return;
  // Gouvernance P0-03: themeSource doit être scindé par cabinet pour éviter les fuites cross-tenant.
  localStorage.setItem(getThemeSourceStorageKey(cabinetBrandingKey), source);
}
