import {
  errorResponse,
  jsonResponse,
  type AdminActionHandler,
} from '../lib/http.ts'
import { loadLogoOrThrow, loadThemeOrThrow } from '../lib/loaders.ts'

const VALID_LOGO_PLACEMENTS = [
  'center-bottom',
  'center-top',
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
]

const listCabinets: AdminActionHandler = async (ctx) => {
  const { data, error } = await ctx.supabase
    .from('cabinets')
    .select(`
      id,
      name,
      created_at,
      updated_at,
      default_theme_id,
      logo_id,
      logo_placement,
      themes:default_theme_id(name, is_system),
      logos:logo_id(sha256, storage_path, mime, width, height, bytes)
    `)
    .order('name')

  if (error) throw error

  return jsonResponse({ cabinets: data || [] }, ctx.responseHeaders)
}

const createCabinet: AdminActionHandler = async (ctx) => {
  const { name, default_theme_id } = ctx.payload as {
    name?: string
    default_theme_id?: string
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return errorResponse('Nom du cabinet requis', ctx.responseHeaders, 400)
  }

  if (default_theme_id) {
    await loadThemeOrThrow(ctx.supabase, default_theme_id)
  }

  const { data, error } = await ctx.supabase
    .from('cabinets')
    .insert({
      name: name.trim(),
      default_theme_id: default_theme_id || null,
    })
    .select()
    .single()

  if (error) throw error

  return jsonResponse({ cabinet: data }, ctx.responseHeaders)
}

const updateCabinet: AdminActionHandler = async (ctx) => {
  const { id, name, default_theme_id, logo_id, logo_placement } = ctx.payload as {
    id?: string
    name?: string
    default_theme_id?: string | null
    logo_id?: string | null
    logo_placement?: string | null
  }

  if (!id) {
    return errorResponse('ID cabinet requis', ctx.responseHeaders, 400)
  }

  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Nom du cabinet valide requis', ctx.responseHeaders, 400)
    }
    updateData.name = name.trim()
  }

  if (default_theme_id !== undefined) {
    if (default_theme_id) {
      await loadThemeOrThrow(ctx.supabase, default_theme_id)
    }
    updateData.default_theme_id = default_theme_id
  }

  if (logo_id !== undefined) {
    if (logo_id) {
      await loadLogoOrThrow(ctx.supabase, logo_id)
    }
    updateData.logo_id = logo_id
  }

  if (logo_placement !== undefined) {
    if (logo_placement && VALID_LOGO_PLACEMENTS.includes(logo_placement)) {
      updateData.logo_placement = logo_placement
    }
  }

  const { data, error } = await ctx.supabase
    .from('cabinets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return jsonResponse({ cabinet: data }, ctx.responseHeaders)
}

const deleteCabinet: AdminActionHandler = async (ctx) => {
  const { id } = ctx.payload as { id?: string }

  if (!id) {
    return errorResponse('ID cabinet requis', ctx.responseHeaders, 400)
  }

  const { count: assignedUsersCount, error: countError } = await ctx.supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('cabinet_id', id)

  if (countError) throw countError

  if ((assignedUsersCount ?? 0) > 0) {
    return jsonResponse({
      error: 'Impossible de supprimer le cabinet : des utilisateurs y sont encore assignés',
      assigned_users: assignedUsersCount,
    }, ctx.responseHeaders, 400)
  }

  const { error } = await ctx.supabase
    .from('cabinets')
    .delete()
    .eq('id', id)

  if (error) throw error

  return jsonResponse({ success: true }, ctx.responseHeaders)
}

const assignCabinetTheme: AdminActionHandler = async (ctx) => {
  const { cabinet_id, theme_id } = ctx.payload as {
    cabinet_id?: string
    theme_id?: string | null
  }

  if (!cabinet_id) {
    return errorResponse('ID cabinet requis', ctx.responseHeaders, 400)
  }

  if (theme_id) {
    await loadThemeOrThrow(ctx.supabase, theme_id)
  }

  const { data, error } = await ctx.supabase
    .from('cabinets')
    .update({ default_theme_id: theme_id || null })
    .eq('id', cabinet_id)
    .select()
    .single()

  if (error) throw error

  return jsonResponse({ cabinet: data }, ctx.responseHeaders)
}

export const cabinetActionHandlers: Record<string, AdminActionHandler> = {
  list_cabinets: listCabinets,
  create_cabinet: createCabinet,
  update_cabinet: updateCabinet,
  delete_cabinet: deleteCabinet,
  assign_cabinet_theme: assignCabinetTheme,
}
