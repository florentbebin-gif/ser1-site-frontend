/**
 * Theme Cache — Fonctions pures de gestion du cache localStorage
 *
 * Gère 3 caches distincts :
 * - Thème user (couleurs personnalisées)
 * - Thème cabinet (palette du cabinet assigné)
 * - Logo cabinet (data URI du logo)
 *
 * Tri-état pour cabinet : undefined (pas chargé) / null (confirmé absent) / valeur
 */

import type { ThemeColors } from '../../theme';
import type { ThemeCache, CabinetThemeCache, CabinetLogoCache } from '../types';

// ─── Constants ───────────────────────────────────────────────────────

export const THEME_CACHE_KEY_PREFIX = 'ser1_theme_cache_';
export const THEME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures
export const CABINET_THEME_CACHE_KEY_PREFIX = 'ser1_cabinet_theme_cache_';
export const CABINET_LOGO_CACHE_KEY_PREFIX = 'ser1_cabinet_logo_cache_';
export const CABINET_CACHE_TTL = THEME_CACHE_TTL;

export const CABINET_LOGO_EMPTY = '__none__';

// Gouvernance P0-03:
// Les caches branding cabinet DOIVENT être keyés par cabinetBrandingKey (cabinet:<id>)
// pour éviter toute fuite cross-tenant lors de switch d'utilisateurs.

// ─── User theme cache ────────────────────────────────────────────────

export function getThemeFromCache(userId: string | null): ThemeColors | null {
  if (!userId) return null;
  
  try {
    const cacheKey = `${THEME_CACHE_KEY_PREFIX}${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache: ThemeCache = JSON.parse(cached);
      const now = Date.now();
      
      // Valider le cache
      if (now - cache.timestamp < THEME_CACHE_TTL) {
        return cache.colors;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {
    console.warn('[ThemeProvider] Cache read error:', e);
  }
  return null;
}

export function saveThemeToCache(colors: ThemeColors, userId: string | null, themeName?: string): void {
  if (!userId) return;
  
  try {
    const cacheKey = `${THEME_CACHE_KEY_PREFIX}${userId}`;
    const cache: ThemeCache = {
      colors,
      timestamp: Date.now(),
      themeName
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cache write error:', e);
  }
}

export function clearThemeCacheForUser(userId: string | null): void {
  if (!userId) return;
  
  try {
    const cacheKey = `${THEME_CACHE_KEY_PREFIX}${userId}`;
    localStorage.removeItem(cacheKey);
  } catch (e) {
    console.warn('[ThemeProvider] Cache clear error:', e);
  }
}

// ─── Cabinet theme cache ─────────────────────────────────────────────

export function getCabinetThemeFromCache(cabinetBrandingKey: string | null): ThemeColors | null {
  if (!cabinetBrandingKey) return null;

  try {
    const cacheKey = `${CABINET_THEME_CACHE_KEY_PREFIX}${cabinetBrandingKey}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache: CabinetThemeCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.timestamp < CABINET_CACHE_TTL) {
        return cache.colors;
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet cache read error:', e);
  }
  return null;
}

export function saveCabinetThemeToCache(colors: ThemeColors, cabinetBrandingKey: string | null): void {
  if (!cabinetBrandingKey) return;

  try {
    const cacheKey = `${CABINET_THEME_CACHE_KEY_PREFIX}${cabinetBrandingKey}`;
    const cache: CabinetThemeCache = {
      colors,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet cache write error:', e);
  }
}

// ─── Cabinet logo cache ──────────────────────────────────────────────

export function getCabinetLogoFromCache(cabinetBrandingKey: string | null): string | null | undefined {
  if (!cabinetBrandingKey) return undefined;

  try {
    const cacheKey = `${CABINET_LOGO_CACHE_KEY_PREFIX}${cabinetBrandingKey}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache: CabinetLogoCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.timestamp < CABINET_CACHE_TTL) {
        return cache.logo === CABINET_LOGO_EMPTY ? null : cache.logo;
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet logo cache read error:', e);
  }
  return undefined;
}

export function saveCabinetLogoToCache(logo: string | undefined | null, cabinetBrandingKey: string | null): void {
  if (!cabinetBrandingKey) return;

  try {
    const cacheKey = `${CABINET_LOGO_CACHE_KEY_PREFIX}${cabinetBrandingKey}`;
    const cache: CabinetLogoCache = {
      logo: logo ? logo : CABINET_LOGO_EMPTY,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ThemeProvider] Cabinet logo cache write error:', e);
  }
}

// ─── Bootstrap (anti-flash) ──────────────────────────────────────────

export function getThemeBootstrap(): { colors: ThemeColors; userId?: string | null } | null {
  if (typeof window === 'undefined') return null;
  const bootstrap = window.__ser1ThemeBootstrap;
  if (!bootstrap?.colors) return null;
  return {
    colors: bootstrap.colors as ThemeColors,
    userId: bootstrap.userId ?? null
  };
}
