import {
  errorResponse,
  jsonResponse,
  type AdminActionHandler,
} from '../lib/http.ts'
import { loadLogoOrThrow } from '../lib/loaders.ts'

const checkLogoExists: AdminActionHandler = async (ctx) => {
  const { sha256 } = ctx.payload as { sha256?: string }

  if (!sha256 || typeof sha256 !== 'string') {
    return errorResponse('Hash SHA256 requis', ctx.responseHeaders, 400)
  }

  const { data, error } = await ctx.supabase
    .from('logos')
    .select('id, storage_path, mime, width, height, bytes')
    .eq('sha256', sha256)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse({ exists: false }, ctx.responseHeaders)
    }
    throw error
  }

  return jsonResponse({ exists: true, logo: data }, ctx.responseHeaders)
}

const createLogo: AdminActionHandler = async (ctx) => {
  const { sha256, storage_path, mime, width, height, bytes } = ctx.payload as {
    sha256?: string
    storage_path?: string
    mime?: string
    width?: number
    height?: number
    bytes?: number
  }

  if (!sha256 || !storage_path || !mime) {
    return errorResponse('sha256, storage_path et mime requis', ctx.responseHeaders, 400)
  }

  if (typeof width !== 'number' || typeof height !== 'number' || typeof bytes !== 'number') {
    return errorResponse('width, height et bytes doivent être des nombres', ctx.responseHeaders, 400)
  }

  const { data, error } = await ctx.supabase
    .from('logos')
    .insert({
      sha256,
      storage_path,
      mime,
      width,
      height,
      bytes,
      created_by: ctx.principal.userId,
    })
    .select()
    .single()

  if (error) throw error

  return jsonResponse({ logo: data }, ctx.responseHeaders)
}

const assignCabinetLogo: AdminActionHandler = async (ctx) => {
  const { cabinet_id, logo_id } = ctx.payload as {
    cabinet_id?: string
    logo_id?: string | null
  }

  if (!cabinet_id) {
    return errorResponse('ID cabinet requis', ctx.responseHeaders, 400)
  }

  if (logo_id) {
    await loadLogoOrThrow(ctx.supabase, logo_id)
  }

  const { data, error } = await ctx.supabase
    .from('cabinets')
    .update({ logo_id: logo_id || null })
    .eq('id', cabinet_id)
    .select()
    .single()

  if (error) throw error

  return jsonResponse({ cabinet: data }, ctx.responseHeaders)
}

export const logoActionHandlers: Record<string, AdminActionHandler> = {
  check_logo_exists: checkLogoExists,
  create_logo: createLogo,
  assign_cabinet_logo: assignCabinetLogo,
}
