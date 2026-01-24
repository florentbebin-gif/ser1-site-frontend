import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from './cors.ts'

type AdminPayload = Record<string, unknown>

const ADMIN_VERSION = '2026-01-23-v1'

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^\s*Bearer\s+(.+?)\s*$/i)
  return match?.[1] ?? null
}

interface ReportAgg {
  total_reports: number
  unread_reports: number
  latest_report_id: string | null
  latest_report_created_at: string | null
  latest_report_is_unread: boolean
}

function getSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

serve(async (req: Request) => {
  const reqStart = Date.now()
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
  const origin = req.headers.get('origin') ?? 'unknown'
  const method = req.method
  const url = req.url

  console.log(`[admin] START ${ADMIN_VERSION} | rid=${requestId} | method=${method} | url=${url} | origin=${origin}`)

  const corsHeaders = getCorsHeaders(req)
  const responseHeaders = { 
    ...corsHeaders, 
    'x-request-id': requestId,
    'x-admin-version': ADMIN_VERSION
  }
  const hasAuthHeader = !!req.headers.get('Authorization')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders })
  }

  // === PING_PUBLIC: healthcheck sans auth ===
  // Doit être AVANT toute vérification d'auth
  const urlCheck = new URL(req.url)
  const actionFromQuery = urlCheck.searchParams.get('action')
  if (actionFromQuery === 'ping_public') {
    const duration = Date.now() - reqStart
    console.log(`[admin] ping_public | rid=${requestId} | ${duration}ms | 200 | origin=${origin}`)
    return new Response(JSON.stringify({ 
      ok: true, 
      ts: Date.now(),
      requestId,
      durationMs: duration
    }), {
      headers: { ...responseHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = getSupabaseServiceClient()

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get('Authorization')
    const token = parseBearerToken(authHeader)
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing bearer token' }), {
        status: 401,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    const adminUserId = user.id

    const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user'
    if (userRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { method } = req
    const url = new URL(req.url)
    
    // Lecture robuste du body
    let payload: AdminPayload = {}
    let rawBodyPreview = '(empty)'
    try {
      const rawBody = await req.text()
      rawBodyPreview = rawBody.slice(0, 100) + (rawBody.length > 100 ? '...' : '')
      if (rawBody) {
        payload = JSON.parse(rawBody)
      }
    } catch (_err) {
      console.log(`[admin] Body parse error, raw preview: ${rawBodyPreview}`)
    }
    
    const action = (payload?.action as string | null) ?? url.searchParams.get('action') ?? null
    const payloadKeys = Object.keys(payload).join(',') || '(none)'
    
    console.log(`[EDGE_REQ] rid=${requestId} method=${method} origin=${origin} hasAuth=${hasAuthHeader} action=${action} payloadKeys=${payloadKeys}`)
    
    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mettre à jour le rôle d'un utilisateur
    if (action === 'update_user_role') {
      const userId = (payload.userId ?? payload.user_id) as string | undefined
      const role = payload.role as string | undefined

      if (!userId || !role) {
        return new Response(JSON.stringify({ error: 'User ID and role required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: existing, error: getError } = await supabase.auth.admin.getUserById(userId)
      if (getError || !existing?.user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const nextUserMetadata = { ...(existing.user.user_metadata ?? {}), role }
      const nextAppMetadata = { ...(existing.user.app_metadata ?? {}), role }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: nextUserMetadata,
        app_metadata: nextAppMetadata,
      })
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }
    // Lister les utilisateurs avec count de signalements
    // Support GET + "users" (compat) et POST + "list_users" (frontend)
    if (action === 'users' || action === 'list_users') {
      const { data: users, error } = await supabase.auth.admin.listUsers()
      if (error) throw error

      // Compter les signalements par user (total + unread) et latest
      const { data: reports, error: reportsError } = await supabase
        .from('issue_reports')
        .select('user_id, created_at, admin_read_at, id')
      
      if (reportsError) {
        console.log('[admin:list_users] Reports query error:', reportsError.message)
      }

      // Agréger les données par user
      const reportStats = (reports ?? []).reduce<Record<string, ReportAgg>>((acc, report) => {
        if (!acc[report.user_id]) {
          acc[report.user_id] = {
            total_reports: 0,
            unread_reports: 0,
            latest_report_id: report.id,
            latest_report_created_at: report.created_at,
            latest_report_is_unread: report.admin_read_at === null
          }
        }
        
        acc[report.user_id].total_reports++
        if (report.admin_read_at === null) {
          acc[report.user_id].unread_reports++
        }
        
        // Garder le plus récent
        const currentLatest = acc[report.user_id].latest_report_created_at
        if (!currentLatest || new Date(report.created_at) > new Date(currentLatest)) {
          acc[report.user_id].latest_report_id = report.id
          acc[report.user_id].latest_report_created_at = report.created_at
          acc[report.user_id].latest_report_is_unread = report.admin_read_at === null
        }
        
        return acc
      }, {})

      const usersWithReports = users.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: user.user_metadata?.role || user.app_metadata?.role || 'user',
        total_reports: reportStats[user.id]?.total_reports || 0,
        unread_reports: reportStats[user.id]?.unread_reports || 0,
        latest_report_id: reportStats[user.id]?.latest_report_id || null,
        latest_report_is_unread: reportStats[user.id]?.latest_report_is_unread || false
      }))

      return new Response(JSON.stringify({ users: usersWithReports }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Créer/inviter un utilisateur
    if (action === 'create_user_invite') {
      const { email } = payload
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email)
      if (error) throw error

      return new Response(JSON.stringify({ success: true, user: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer un utilisateur
    if (action === 'delete_user') {
      const { userId } = payload
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Reset password / renvoyer invitation
    if (action === 'reset_password') {
      let { userId, email } = payload as { userId?: string; email?: string }
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID and email required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (!email) {
        const { data: existing, error: getError } = await supabase.auth.admin.getUserById(userId)
        if (getError || !existing?.user?.email) {
          return new Response(JSON.stringify({ error: 'User email not found' }), {
            status: 404,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
        email = existing.user.email
      }
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${new URL(req.url).origin}/set-password`
        }
      })
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Lister les signalements avec counts par user
    if (action === 'list_issue_counts') {
      const { data: reports, error } = await supabase
        .from('issue_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify({ reports }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Lister les signalements d'un utilisateur
    if (action === 'list_issue_reports') {
      const userId = (payload.userId ?? payload.user_id) as string | undefined
      console.log(`[admin:list_issue_reports] Received request for user_id: ${userId}`, { payload })
      
      if (!userId) {
        console.log('[admin:list_issue_reports] Error: User ID required')
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      try {
        const { error: tableCheckError } = await supabase
          .from('issue_reports')
          .select('id')
          .limit(1)
        
        if (tableCheckError) {
          console.error('[admin:list_issue_reports] Table check error:', tableCheckError)
          return new Response(JSON.stringify({ 
            error: 'Table check failed', 
            details: tableCheckError.message,
            reports: []
          }), {
            status: 500,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        const { data: reports, error } = await supabase
          .from('issue_reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[admin:list_issue_reports] Query error:', error)
          throw error
        }

        return new Response(JSON.stringify({ reports: reports || [] }), {
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      } catch (e) {
        console.error('[admin:list_issue_reports] Exception:', e)
        return new Response(JSON.stringify({ 
          error: 'Internal server error', 
          details: e instanceof Error ? e.message : 'unknown error',
          reports: []
        }), {
          status: 500,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    // Obtenir le dernier signalement pour un utilisateur
    if (action === 'get_latest_issue_for_user') {
      const { userId } = payload
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: reports, error } = await supabase
        .from('issue_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      return new Response(JSON.stringify({ report: reports?.[0] || null }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Marquer un signalement comme lu
    if (action === 'mark_issue_read') {
      const { reportId } = payload
      if (!reportId) {
        return new Response(JSON.stringify({ error: 'Report ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('issue_reports')
        .update({ admin_read_at: new Date().toISOString() })
        .eq('id', reportId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Marquer un signalement comme non lu
    if (action === 'mark_issue_unread' || action === 'mark_issue_report_unread') {
      const reportId = payload.reportId ?? payload.report_id
      if (!reportId) {
        return new Response(JSON.stringify({ error: 'Report ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('issue_reports')
        .update({ admin_read_at: null })
        .eq('id', reportId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer un signalement
    if (action === 'delete_issue') {
      const { reportId } = payload
      if (!reportId) {
        return new Response(JSON.stringify({ error: 'Report ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('issue_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer tous les signalements d'un utilisateur
    if (action === 'delete_all_issues_for_user') {
      const { userId } = payload
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Compter avant suppression
      const { data: reportsToDelete } = await supabase
        .from('issue_reports')
        .select('id')
        .eq('user_id', userId)

      const { error } = await supabase
        .from('issue_reports')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      return new Response(JSON.stringify({ 
        success: true, 
        deleted: reportsToDelete?.length || 0 
      }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Ping endpoint for connectivity/latency testing (requires auth)
    if (action === 'ping') {
      const duration = Date.now() - reqStart
      console.log(`[admin] END | rid=${requestId} | action=ping | ${duration}ms | 200`)
      return new Response(JSON.stringify({ 
        ok: true,
        ts: Date.now(),
        requestId,
        durationMs: duration
      }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Echo endpoint for debugging headers/origin
    if (action === 'echo') {
      const headerKeys = Array.from(req.headers.keys())
      return new Response(JSON.stringify({
        ok: true,
        origin,
        hasAuthHeader,
        headersKeys: headerKeys,
        requestId,
      }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ============================================================================
    // V1: CABINETS, THEMES, LOGOS ACTIONS
    // ============================================================================

    // Lister les cabinets
    if (action === 'list_cabinets') {
      const { data, error } = await supabase
        .from('cabinets')
        .select(`
          id, 
          name, 
          created_at, 
          updated_at,
          default_theme_id,
          logo_id,
          themes:default_theme_id(name, is_system),
          logos:logo_id(sha256, storage_path, mime, width, height, bytes)
        `)
        .order('name')

      if (error) throw error

      return new Response(JSON.stringify({ cabinets: data || [] }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Créer un cabinet
    if (action === 'create_cabinet') {
      const { name, default_theme_id } = payload as { name?: string; default_theme_id?: string }
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Cabinet name required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier si le thème existe si fourni
      if (default_theme_id) {
        const { data: themeCheck, error: themeError } = await supabase
          .from('themes')
          .select('id')
          .eq('id', default_theme_id)
          .single()
        
        if (themeError || !themeCheck) {
          return new Response(JSON.stringify({ error: 'Invalid theme_id' }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const { data, error } = await supabase
        .from('cabinets')
        .insert({ 
          name: name.trim(),
          default_theme_id: default_theme_id || null
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ cabinet: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mettre à jour un cabinet
    if (action === 'update_cabinet') {
      const { id, name, default_theme_id, logo_id } = payload as { 
        id?: string; 
        name?: string; 
        default_theme_id?: string | null;
        logo_id?: string | null;
      }
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'Cabinet ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = {}
      
      if (name !== undefined) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return new Response(JSON.stringify({ error: 'Valid cabinet name required' }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
        updateData.name = name.trim()
      }

      if (default_theme_id !== undefined) {
        if (default_theme_id) {
          const { data: themeCheck, error: themeError } = await supabase
            .from('themes')
            .select('id')
            .eq('id', default_theme_id)
            .single()
          
          if (themeError || !themeCheck) {
            return new Response(JSON.stringify({ error: 'Invalid theme_id' }), {
              status: 400,
              headers: { ...responseHeaders, 'Content-Type': 'application/json' }
            })
          }
        }
        updateData.default_theme_id = default_theme_id
      }

      if (logo_id !== undefined) {
        if (logo_id) {
          const { data: logoCheck, error: logoError } = await supabase
            .from('logos')
            .select('id')
            .eq('id', logo_id)
            .single()
          
          if (logoError || !logoCheck) {
            return new Response(JSON.stringify({ error: 'Invalid logo_id' }), {
              status: 400,
              headers: { ...responseHeaders, 'Content-Type': 'application/json' }
            })
          }
        }
        updateData.logo_id = logo_id
      }

      const { data, error } = await supabase
        .from('cabinets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ cabinet: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer un cabinet
    if (action === 'delete_cabinet') {
      const { id } = payload as { id?: string }
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'Cabinet ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier qu'aucun profil n'est assigné à ce cabinet
      const { count: assignedUsersCount, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('cabinet_id', id)

      if (countError) throw countError

      if ((assignedUsersCount ?? 0) > 0) {
        return new Response(JSON.stringify({ 
          error: 'Cannot delete cabinet: users are still assigned to it',
          assigned_users: assignedUsersCount
        }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('cabinets')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Lister les thèmes
    if (action === 'list_themes') {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name')

      if (error) throw error

      return new Response(JSON.stringify({ themes: data || [] }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Créer un thème
    if (action === 'create_theme') {
      const { name, palette } = payload as { name?: string; palette?: any }
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Theme name required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!palette || typeof palette !== 'object') {
        return new Response(JSON.stringify({ error: 'Palette object required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Valider que la palette contient les 10 couleurs requises
      const requiredColors = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10']
      const missingColors = requiredColors.filter(color => !(color in palette))
      if (missingColors.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Palette missing required colors', 
          missing: missingColors 
        }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase
        .from('themes')
        .insert({ 
          name: name.trim(),
          palette,
          is_system: false
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ theme: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mettre à jour un thème
    if (action === 'update_theme') {
      const { id, name, palette } = payload as { 
        id?: string; 
        name?: string; 
        palette?: any;
      }
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'Theme ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier que le thème n'est pas système
      const { data: existingTheme, error: fetchError } = await supabase
        .from('themes')
        .select('is_system')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (existingTheme?.is_system) {
        return new Response(JSON.stringify({ error: 'Cannot modify system theme' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = {}
      
      if (name !== undefined) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return new Response(JSON.stringify({ error: 'Valid theme name required' }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
        updateData.name = name.trim()
      }

      if (palette !== undefined) {
        if (!palette || typeof palette !== 'object') {
          return new Response(JSON.stringify({ error: 'Palette object required' }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Valider que la palette contient les 10 couleurs requises
        const requiredColors = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10']
        const missingColors = requiredColors.filter(color => !(color in palette))
        if (missingColors.length > 0) {
          return new Response(JSON.stringify({ 
            error: 'Palette missing required colors', 
            missing: missingColors 
          }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }

        updateData.palette = palette
      }

      const { data, error } = await supabase
        .from('themes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ theme: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer un thème
    if (action === 'delete_theme') {
      const { id } = payload as { id?: string }
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'Theme ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier que le thème n'est pas système
      const { data: existingTheme, error: fetchError } = await supabase
        .from('themes')
        .select('is_system')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (existingTheme?.is_system) {
        return new Response(JSON.stringify({ error: 'Cannot delete system theme' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier qu'aucun cabinet n'utilise ce thème
      const { data: cabinetsCount, error: countError } = await supabase
        .from('cabinets')
        .select('id', { count: 'exact' })
        .eq('default_theme_id', id)

      if (countError) throw countError

      if (cabinetsCount && cabinetsCount.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Cannot delete theme: still assigned to cabinets',
          assigned_cabinets: cabinetsCount.length
        }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Assigner un utilisateur à un cabinet
    if (action === 'assign_user_cabinet') {
      const { user_id, cabinet_id } = payload as { 
        user_id?: string; 
        cabinet_id?: string | null;
      }
      
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Si cabinet_id est fourni, vérifier qu'il existe
      if (cabinet_id) {
        const { data: cabinetCheck, error: cabinetError } = await supabase
          .from('cabinets')
          .select('id')
          .eq('id', cabinet_id)
          .single()
        
        if (cabinetError || !cabinetCheck) {
          return new Response(JSON.stringify({ error: 'Invalid cabinet_id' }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ cabinet_id: cabinet_id || null })
        .eq('id', user_id)
        .select()
        .single()

      if (error) {
        // Gérer le cas où le profile n'existe pas (PGRST116)
        if (error.code === 'PGRST116') {
          console.log(`[admin] assign_user_cabinet: profile not found for user_id=${user_id}`)
          return new Response(JSON.stringify({ error: 'Profile not found for user' }), {
            status: 404,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
        throw error
      }

      return new Response(JSON.stringify({ profile: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Assigner un thème à un cabinet
    if (action === 'assign_cabinet_theme') {
      const { cabinet_id, theme_id } = payload as { 
        cabinet_id?: string; 
        theme_id?: string | null;
      }
      
      if (!cabinet_id) {
        return new Response(JSON.stringify({ error: 'Cabinet ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Si theme_id est fourni, vérifier qu'il existe
      if (theme_id) {
        const { data: themeCheck, error: themeError } = await supabase
          .from('themes')
          .select('id')
          .eq('id', theme_id)
          .single()
        
        if (themeError || !themeCheck) {
          return new Response(JSON.stringify({ error: 'Invalid theme_id' }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const { data, error } = await supabase
        .from('cabinets')
        .update({ default_theme_id: theme_id || null })
        .eq('id', cabinet_id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ cabinet: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Vérifier si un logo existe par SHA256
    if (action === 'check_logo_exists') {
      const { sha256 } = payload as { sha256?: string }
      
      if (!sha256 || typeof sha256 !== 'string') {
        return new Response(JSON.stringify({ error: 'SHA256 hash required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase
        .from('logos')
        .select('id, storage_path, mime, width, height, bytes')
        .eq('sha256', sha256)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de résultat = logo n'existe pas
          return new Response(JSON.stringify({ exists: false }), {
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
        throw error
      }

      return new Response(JSON.stringify({ exists: true, logo: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Créer un logo
    if (action === 'create_logo') {
      const { sha256, storage_path, mime, width, height, bytes } = payload as { 
        sha256?: string; 
        storage_path?: string; 
        mime?: string; 
        width?: number; 
        height?: number; 
        bytes?: number;
      }
      
      if (!sha256 || !storage_path || !mime) {
        return new Response(JSON.stringify({ error: 'sha256, storage_path, and mime required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (typeof width !== 'number' || typeof height !== 'number' || typeof bytes !== 'number') {
        return new Response(JSON.stringify({ error: 'width, height, and bytes must be numbers' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase
        .from('logos')
        .insert({ 
          sha256,
          storage_path,
          mime,
          width,
          height,
          bytes,
          created_by: adminUserId
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ logo: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Assigner un logo à un cabinet
    if (action === 'assign_cabinet_logo') {
      const { cabinet_id, logo_id } = payload as { 
        cabinet_id?: string; 
        logo_id?: string | null;
      }
      
      if (!cabinet_id) {
        return new Response(JSON.stringify({ error: 'Cabinet ID required' }), {
          status: 400,
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Si logo_id est fourni, vérifier qu'il existe
      if (logo_id) {
        const { data: logoCheck, error: logoError } = await supabase
          .from('logos')
          .select('id')
          .eq('id', logo_id)
          .single()
        
        if (logoError || !logoCheck) {
          return new Response(JSON.stringify({ error: 'Invalid logo_id' }), {
            status: 400,
            headers: { ...responseHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const { data, error } = await supabase
        .from('cabinets')
        .update({ logo_id: logo_id || null })
        .eq('id', cabinet_id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ cabinet: data }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ============================================================================
    // ACTIONS EXISTANTES (non modifiées)
    // ============================================================================

    // Version endpoint for deployment verification
    if (action === 'version') {
      return new Response(JSON.stringify({ 
        version: ADMIN_VERSION,
        deployedAt: new Date().toISOString()
      }), {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      })
    }

    const duration = Date.now() - reqStart
    console.log(`[admin] END | rid=${requestId} | action=${action} | ${duration}ms | 400 invalid`)
    return new Response(JSON.stringify({ error: 'Invalid action', requestId }), {
      status: 400,
      headers: { ...responseHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const duration = Date.now() - reqStart
    console.error(`[admin] ERROR | rid=${requestId} | ${duration}ms | 500`, error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message, requestId }), {
      status: 500,
      headers: { ...responseHeaders, 'Content-Type': 'application/json' }
    })
  }
})
