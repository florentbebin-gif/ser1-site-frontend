/* eslint-disable no-console */
import {
  errorResponse,
  jsonResponse,
  type AdminActionHandler,
} from '../lib/http.ts'
import { loadThemeOrThrow } from '../lib/loaders.ts'
import { recordAdminAction } from '../lib/audit.ts'

export const REQUIRED_THEME_COLORS = [
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8',
  'c9',
  'c10',
] as const

type ThemeColorKey = typeof REQUIRED_THEME_COLORS[number]
type ThemePalette = Record<ThemeColorKey, string>
type ThemePaletteValidation =
  | { ok: true; palette: ThemePalette }
  | {
      ok: false
      error: string
      missing?: string[]
      extra?: string[]
      invalid?: string[]
    }

const REQUIRED_THEME_COLOR_SET = new Set<string>(REQUIRED_THEME_COLORS)
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

function isPaletteObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateThemePalette(value: unknown): ThemePaletteValidation {
  if (!isPaletteObject(value)) {
    return { ok: false, error: 'Objet palette requis' }
  }

  const keys = Object.keys(value)
  const missing = REQUIRED_THEME_COLORS.filter((color) => !(color in value))
  const extra = keys.filter((key) => !REQUIRED_THEME_COLOR_SET.has(key)).sort()
  const invalid = REQUIRED_THEME_COLORS.filter((color) => {
    if (!(color in value)) return false
    const colorValue = value[color]
    return typeof colorValue !== 'string' || !HEX_COLOR_RE.test(colorValue)
  })

  if (missing.length > 0 || extra.length > 0 || invalid.length > 0) {
    return {
      ok: false,
      error: missing.length > 0
        ? 'Palette incomplète : couleurs manquantes'
        : extra.length > 0
          ? 'Palette invalide : couleurs inconnues'
          : 'Palette invalide : couleurs hex #RRGGBB requises',
      ...(missing.length > 0 ? { missing } : {}),
      ...(extra.length > 0 ? { extra } : {}),
      ...(invalid.length > 0 ? { invalid } : {}),
    }
  }

  return { ok: true, palette: value as ThemePalette }
}

function paletteValidationErrorExtra(
  validation: Extract<ThemePaletteValidation, { ok: false }>,
): Record<string, string[]> {
  return {
    ...(validation.missing ? { missing: validation.missing } : {}),
    ...(validation.extra ? { extra: validation.extra } : {}),
    ...(validation.invalid ? { invalid: validation.invalid } : {}),
  }
}

const listThemes: AdminActionHandler = async (ctx) => {
  const { data, error } = await ctx.supabase
    .from('themes')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name')

  if (error) throw error

  return jsonResponse({ themes: data || [] }, ctx.responseHeaders)
}

const createTheme: AdminActionHandler = async (ctx) => {
  const { name, palette } = ctx.payload as { name?: string; palette?: unknown }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return errorResponse('Nom du thème requis', ctx.responseHeaders, 400)
  }

  const paletteValidation = validateThemePalette(palette)
  if (!paletteValidation.ok) {
    return errorResponse(
      paletteValidation.error,
      ctx.responseHeaders,
      400,
      paletteValidationErrorExtra(paletteValidation),
    )
  }

  const { data, error } = await ctx.supabase
    .from('themes')
    .insert({
      name: name.trim(),
      palette: paletteValidation.palette,
      is_system: false,
    })
    .select()
    .single()

  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'create_theme',
    targetType: 'theme',
    targetId: data?.id,
  })
  return jsonResponse({ theme: data }, ctx.responseHeaders)
}

const updateTheme: AdminActionHandler = async (ctx) => {
  const { id, name, palette } = ctx.payload as {
    id?: string
    name?: string
    palette?: unknown
  }

  if (!id) {
    return errorResponse('ID thème requis', ctx.responseHeaders, 400)
  }

  await loadThemeOrThrow(ctx.supabase, id)

  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Nom du thème valide requis', ctx.responseHeaders, 400)
    }
    updateData.name = name.trim()
  }

  if (palette !== undefined) {
    const paletteValidation = validateThemePalette(palette)
    if (!paletteValidation.ok) {
      return errorResponse(
        paletteValidation.error,
        ctx.responseHeaders,
        400,
        paletteValidationErrorExtra(paletteValidation),
      )
    }

    updateData.palette = paletteValidation.palette
  }

  const { data, error } = await ctx.supabase
    .from('themes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  console.log(`[admin] update_theme success | rid=${ctx.requestId} | themeId=${id} | name=${data?.name}`)

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'update_theme',
    targetType: 'theme',
    targetId: id,
  })
  return jsonResponse({ theme: data }, ctx.responseHeaders)
}

const deleteTheme: AdminActionHandler = async (ctx) => {
  const { id } = ctx.payload as { id?: string }

  if (!id) {
    return errorResponse('ID thème requis', ctx.responseHeaders, 400)
  }

  const existingTheme = await loadThemeOrThrow(ctx.supabase, id)

  if (existingTheme.is_system) {
    return errorResponse('Impossible de supprimer un thème système', ctx.responseHeaders, 400)
  }

  const { data: assignedCabinets, error: countError } = await ctx.supabase
    .from('cabinets')
    .select('id')
    .eq('default_theme_id', id)

  if (countError) throw countError

  const unassignedCount = assignedCabinets?.length ?? 0
  if (unassignedCount > 0) {
    const { error: unassignError } = await ctx.supabase
      .from('cabinets')
      .update({ default_theme_id: null })
      .eq('default_theme_id', id)

    if (unassignError) throw unassignError
    console.log(`[admin] delete_theme: unassigned ${unassignedCount} cabinet(s) from theme ${id}`)
  }

  const { error } = await ctx.supabase
    .from('themes')
    .delete()
    .eq('id', id)

  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'delete_theme',
    targetType: 'theme',
    targetId: id,
  })
  return jsonResponse({
    success: true,
    unassigned_cabinets: unassignedCount,
  }, ctx.responseHeaders)
}

export const themeActionHandlers: Record<string, AdminActionHandler> = {
  list_themes: listThemes,
  create_theme: createTheme,
  update_theme: updateTheme,
  delete_theme: deleteTheme,
}
