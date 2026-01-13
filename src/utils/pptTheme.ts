import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { DEFAULT_COLORS } from '../settings/ThemeProvider';
import type { ThemeColors } from '../settings/ThemeProvider';

export type ThemeScope = 'all' | 'ui-only';

export type PptxColors = Record<
  'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8' | 'c9' | 'c10',
  string
>;

interface ResolvePptThemeParams {
  themeScope?: ThemeScope | string | null;
  pptxColorsFromHook: Record<string, string>;
  defaultColors?: ThemeColors;
}

function normalizeScope(scope?: string | null): ThemeScope {
  return scope === 'ui-only' ? 'ui-only' : 'all';
}

function stripHash(hex?: string): string | undefined {
  if (!hex) return undefined;
  return hex.replace('#', '');
}

function ensureUser(user?: User | null): user is User {
  return Boolean(user);
}

export function resolvePptTheme({
  themeScope,
  pptxColorsFromHook,
  defaultColors = DEFAULT_COLORS,
}: ResolvePptThemeParams): PptxColors {
  const scope = normalizeScope(themeScope ?? 'all');
  const fallback = Object.entries(defaultColors).reduce<Record<string, string>>((acc, [k, v]) => {
    const normalized = stripHash(v);
    if (normalized) acc[k] = normalized;
    return acc;
  }, {});

  if (scope === 'ui-only') {
    return fallback as PptxColors;
  }

  return {
    ...fallback,
    ...(pptxColorsFromHook || {}),
  } as PptxColors;
}

async function fetchCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('[pptTheme] Unable to fetch user metadata', error);
  }
  return data?.user ?? null;
}

async function inferThemeScopeFromUiSettings(userId: string): Promise<ThemeScope | null> {
  try {
    const { data, error } = await supabase
      .from('ui_settings')
      .select('theme_name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    const themeName = (data as { theme_name?: unknown } | null)?.theme_name;
    if (typeof themeName !== 'string') return null;
    return themeName.includes('ui-only') ? 'ui-only' : 'all';
  } catch (error) {
    console.warn('[pptTheme] Unable to infer theme_scope from ui_settings', error);
    return null;
  }
}

export async function getThemeScope(user?: User | null): Promise<ThemeScope> {
  const resolvedUser = user ?? (await fetchCurrentUser());
  return normalizeScope(resolvedUser?.user_metadata?.theme_scope);
}

export async function getCoverSlideUrl(user?: User | null): Promise<string | null> {
  const resolvedUser = user ?? (await fetchCurrentUser());
  if (!ensureUser(resolvedUser)) return null;
  const url = resolvedUser.user_metadata?.cover_slide_url;
  return typeof url === 'string' && url.trim().length > 0 ? url : null;
}

export async function getPptBrandingPreferences(): Promise<{
  themeScope: ThemeScope;
  coverUrl: string | null;
  user: User | null;
}> {
  const user = await fetchCurrentUser();
  let themeScope = normalizeScope(user?.user_metadata?.theme_scope);

  if (user) {
    const hasExplicitScope =
      typeof user.user_metadata?.theme_scope === 'string' &&
      user.user_metadata.theme_scope.length > 0;

    if (!hasExplicitScope) {
      const inferred = await inferThemeScopeFromUiSettings(user.id);
      if (inferred) themeScope = inferred;
    }
  }

  const coverUrl = await getCoverSlideUrl(user);

  return { themeScope, coverUrl, user };
}
