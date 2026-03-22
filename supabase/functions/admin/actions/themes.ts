/* eslint-disable no-console */
import {
  errorResponse,
  jsonResponse,
  type AdminActionHandler,
} from '../lib/http.ts'

const REQUIRED_THEME_COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10']

function isPaletteObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getMissingPaletteColors(palette: Record<string, unknown>): string[] {
  return REQUIRED_THEME_COLORS.filter((color) => !(color in palette))
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

  if (!isPaletteObject(palette)) {
    return errorResponse('Objet palette requis', ctx.responseHeaders, 400)
  }

  const missingColors = getMissingPaletteColors(palette)
  if (missingColors.length > 0) {
    return jsonResponse({
      error: 'Palette incomplète : couleurs manquantes',
      missing: missingColors,
    }, ctx.responseHeaders, 400)
  }

  const { data, error } = await ctx.supabase
    .from('themes')
    .insert({
      name: name.trim(),
      palette,
      is_system: false,
    })
    .select()
    .single()

  if (error) throw error

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

  const { error: fetchError } = await ctx.supabase
    .from('themes')
    .select('is_system, name')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Nom du thème valide requis', ctx.responseHeaders, 400)
    }
    updateData.name = name.trim()
  }

  if (palette !== undefined) {
    if (!isPaletteObject(palette)) {
      return errorResponse('Objet palette requis', ctx.responseHeaders, 400)
    }

    const missingColors = getMissingPaletteColors(palette)
    if (missingColors.length > 0) {
      return jsonResponse({
        error: 'Palette incomplète : couleurs manquantes',
        missing: missingColors,
      }, ctx.responseHeaders, 400)
    }

    updateData.palette = palette
  }

  const { data, error } = await ctx.supabase
    .from('themes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  console.log(`[admin] update_theme success | rid=${ctx.requestId} | themeId=${id} | name=${data?.name} | rowsReturned=${data ? 1 : 0}`)

  return jsonResponse({ theme: data }, ctx.responseHeaders)
}

const deleteTheme: AdminActionHandler = async (ctx) => {
  const { id } = ctx.payload as { id?: string }

  if (!id) {
    return errorResponse('ID thème requis', ctx.responseHeaders, 400)
  }

  const { data: existingTheme, error: fetchError } = await ctx.supabase
    .from('themes')
    .select('is_system')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  if (existingTheme?.is_system) {
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
