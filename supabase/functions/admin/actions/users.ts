import {
  errorResponse,
  jsonResponse,
  type AdminActionHandler,
} from '../lib/http.ts'
import { loadUserOrThrow } from '../lib/loaders.ts'
import { recordAdminAction } from '../lib/audit.ts'

interface ReportAgg {
  total_reports: number
  unread_reports: number
  latest_report_id: string | null
  latest_report_created_at: string | null
  latest_report_is_unread: boolean
}

interface ReportRow {
  user_id: string
  created_at: string
  admin_read_at: string | null
  id: string
}

interface ProfileRow {
  id: string
  cabinet_id: string | null
}

interface AuthUser {
  id: string
  email?: string | null
  created_at?: string
  last_sign_in_at?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

interface AdminAccountRow {
  user_id: string
  account_kind: string
}

const updateUserRole: AdminActionHandler = async (ctx) => {
  // SÉCURITÉ : action réservée au propriétaire (owner) uniquement
  if (ctx.principal.accountKind !== 'owner') {
    return errorResponse('Action réservée au propriétaire', ctx.responseHeaders, 403)
  }

  const userId = (ctx.payload.userId ?? ctx.payload.user_id) as string | undefined
  const role = ctx.payload.role as string | undefined

  if (!userId || !role) {
    return errorResponse('ID utilisateur et rôle requis', ctx.responseHeaders, 400)
  }

  const existing = await loadUserOrThrow(ctx.supabase, userId)

  // SÉCURITÉ : écrire uniquement app_metadata.role (source de vérité auth)
  // user_metadata est modifiable par l'utilisateur — ne jamais y stocker le rôle
  const nextAppMetadata = { ...(existing.app_metadata ?? {}), role }

  const { error } = await ctx.supabase.auth.admin.updateUserById(userId, {
    app_metadata: nextAppMetadata,
  })

  if (error) throw error

  // Synchroniser profiles.role (miroir SQL pour is_admin(uid) et RLS)
  // Upsert car le profil peut ne pas exister (prouvé par assignUserCabinet)
  const { error: syncError } = await ctx.supabase
    .from('profiles')
    .upsert({ id: userId, role }, { onConflict: 'id', ignoreDuplicates: false })

  if (syncError) {
    console.warn(`[admin:update_user_role] profiles.role sync failed for ${userId}:`, syncError.message)
  }

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'update_user_role',
    targetType: 'user',
    targetId: userId,
  })
  return jsonResponse({ success: true }, ctx.responseHeaders)
}

const listUsers: AdminActionHandler = async (ctx) => {
  const { data: users, error } = await ctx.supabase.auth.admin.listUsers()
  if (error) throw error

  const { data: reports, error: reportsError } = await ctx.supabase
    .from('issue_reports')
    .select('user_id, created_at, admin_read_at, id')

  if (reportsError) {
    console.warn('[admin:list_users] Reports query error:', reportsError.message)
  }

  const reportStats = (reports ?? []).reduce<Record<string, ReportAgg>>((acc, report: ReportRow) => {
    if (!acc[report.user_id]) {
      acc[report.user_id] = {
        total_reports: 0,
        unread_reports: 0,
        latest_report_id: report.id,
        latest_report_created_at: report.created_at,
        latest_report_is_unread: report.admin_read_at === null,
      }
    }

    acc[report.user_id].total_reports++
    if (report.admin_read_at === null) {
      acc[report.user_id].unread_reports++
    }

    const currentLatest = acc[report.user_id].latest_report_created_at
    if (!currentLatest || new Date(report.created_at) > new Date(currentLatest)) {
      acc[report.user_id].latest_report_id = report.id
      acc[report.user_id].latest_report_created_at = report.created_at
      acc[report.user_id].latest_report_is_unread = report.admin_read_at === null
    }

    return acc
  }, {})

  const userIds = users.users.map((user: AuthUser) => user.id)
  const { data: profiles, error: profilesError } = await ctx.supabase
    .from('profiles')
    .select('id, cabinet_id')
    .in('id', userIds)

  if (profilesError) {
    console.warn('[admin:list_users] profiles query error:', profilesError.message)
  }

  const cabinetByUserId = new Map((profiles ?? []).map((profile: ProfileRow) => [profile.id, profile.cabinet_id]))

  // Joindre admin_accounts pour exposer account_kind et filtrer les comptes e2e
  const { data: adminRows } = await ctx.supabase
    .from('admin_accounts')
    .select('user_id, account_kind')

  const adminMap = new Map((adminRows ?? []).map((r: AdminAccountRow) => [r.user_id, r.account_kind]))

  const includeTest = (ctx.payload.include_test_accounts as boolean | undefined) ?? false

  const usersWithReports = users.users
    .filter((user: AuthUser) => {
      const kind = adminMap.get(user.id) ?? null
      if (!includeTest && kind === 'e2e') return false
      return true
    })
    .map((user: AuthUser) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: (user.app_metadata?.role as string | undefined) || 'user',
      cabinet_id: cabinetByUserId.get(user.id) ?? null,
      account_kind: adminMap.get(user.id) ?? null,
      is_test_account: adminMap.get(user.id) === 'e2e',
      total_reports: reportStats[user.id]?.total_reports || 0,
      unread_reports: reportStats[user.id]?.unread_reports || 0,
      latest_report_id: reportStats[user.id]?.latest_report_id || null,
      latest_report_is_unread: reportStats[user.id]?.latest_report_is_unread || false,
    }))

  return jsonResponse({ users: usersWithReports }, ctx.responseHeaders)
}

const createUserInvite: AdminActionHandler = async (ctx) => {
  const { email, cabinet_id } = ctx.payload as { email?: string; cabinet_id?: string }

  if (!email) {
    return errorResponse('Email requis', ctx.responseHeaders, 400)
  }

  const { data: inviteData, error: inviteError } = await ctx.supabase.auth.admin.inviteUserByEmail(email)
  if (inviteError) throw inviteError

  if (inviteData?.user?.id) {
    const profilePayload: Record<string, unknown> = {
      id: inviteData.user.id,
      email,
      role: 'user',
    }

    if (cabinet_id) {
      profilePayload.cabinet_id = cabinet_id
    }

    const { error: profileError } = await ctx.supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileError) {
      console.error('[admin] Profile upsert error:', profileError)
    }
  }

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'create_user_invite',
    targetType: 'user',
    targetId: inviteData?.user?.id,
  })
  return jsonResponse({ success: true, user: inviteData }, ctx.responseHeaders)
}

const deleteUser: AdminActionHandler = async (ctx) => {
  const { userId } = ctx.payload as { userId?: string }

  if (!userId) {
    return errorResponse('ID utilisateur requis', ctx.responseHeaders, 400)
  }

  const { error } = await ctx.supabase.auth.admin.deleteUser(userId)
  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'delete_user',
    targetType: 'user',
    targetId: userId,
  })
  return jsonResponse({ success: true }, ctx.responseHeaders)
}

const resetPassword: AdminActionHandler = async (ctx) => {
  let { userId, email } = ctx.payload as { userId?: string; email?: string }

  if (!userId) {
    return errorResponse('ID utilisateur et email requis', ctx.responseHeaders, 400)
  }

  if (!email) {
    const existing = await loadUserOrThrow(ctx.supabase, userId)
    if (!existing.email) {
      return errorResponse('Email utilisateur non trouvé', ctx.responseHeaders, 404)
    }
    email = existing.email
  }

  const { error } = await ctx.supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${new URL(ctx.req.url).origin}/set-password`,
    },
  })

  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'reset_password',
    targetType: 'user',
    targetId: userId,
  })
  return jsonResponse({ success: true }, ctx.responseHeaders)
}

const assignUserCabinet: AdminActionHandler = async (ctx) => {
  const { user_id, cabinet_id } = ctx.payload as {
    user_id?: string
    cabinet_id?: string | null
  }

  if (!user_id) {
    return errorResponse('ID utilisateur requis', ctx.responseHeaders, 400)
  }

  if (cabinet_id) {
    const { data: cabinetCheck, error: cabinetError } = await ctx.supabase
      .from('cabinets')
      .select('id')
      .eq('id', cabinet_id)
      .single()

    if (cabinetError || !cabinetCheck) {
      return errorResponse('Cabinet invalide', ctx.responseHeaders, 400)
    }
  }

  const { data, error } = await ctx.supabase
    .from('profiles')
    .update({ cabinet_id: cabinet_id || null })
    .eq('id', user_id)
    .select()
    .maybeSingle()

  if (!error && data) {
    await recordAdminAction(ctx.supabase, {
      requestId: ctx.requestId,
      principal: ctx.principal,
      action: 'assign_user_cabinet',
      targetType: 'user',
      targetId: user_id,
    })
    return jsonResponse({ profile: data }, ctx.responseHeaders)
  }

  if (error?.code === 'PGRST116' || (!error && !data)) {
    console.warn(`[admin] assign_user_cabinet: profile missing for user_id=${user_id}, creating...`)

    const user = await loadUserOrThrow(ctx.supabase, user_id)

    // SÉCURITÉ : lire uniquement app_metadata.role (source de vérité auth)
    const role = (user.app_metadata?.role as string | undefined) || 'user'

    const { data: newProfile, error: insertError } = await ctx.supabase
      .from('profiles')
      .insert({
        id: user_id,
        email: user.email ?? null,
        role,
        cabinet_id: cabinet_id || null,
      })
      .select()
      .single()

    if (insertError) throw insertError

    await recordAdminAction(ctx.supabase, {
      requestId: ctx.requestId,
      principal: ctx.principal,
      action: 'assign_user_cabinet',
      targetType: 'user',
      targetId: user_id,
    })
    return jsonResponse({ profile: newProfile }, ctx.responseHeaders)
  }

  throw error
}

export const userActionHandlers: Record<string, AdminActionHandler> = {
  update_user_role: updateUserRole,
  users: listUsers,
  list_users: listUsers,
  create_user_invite: createUserInvite,
  delete_user: deleteUser,
  reset_password: resetPassword,
  assign_user_cabinet: assignUserCabinet,
}
