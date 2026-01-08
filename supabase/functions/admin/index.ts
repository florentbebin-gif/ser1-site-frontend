import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEBUG_ADMIN = (Deno.env.get('DEBUG_ADMIN') ?? '').toLowerCase() === 'true'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user'
    if (userRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { method } = req
    const url = new URL(req.url)
    
    // Lecture robuste du body
    let payload: any = {}
    try {
      payload = await req.json()
    } catch (e) {
      console.log('Body vide ou invalide, utilisation payload vide')
    }
    
    const action = payload?.action ?? url.searchParams.get('action') ?? null
    
    // Logs légers pour debug
    if (DEBUG_ADMIN) {
      console.log(`Method: ${method}, Action: ${action}, Body vide: ${Object.keys(payload).length === 0}`)
    }
    
    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mettre à jour le rôle d'un utilisateur
    if (action === 'update_user_role') {
      const userId = payload.userId ?? payload.user_id
      const { role } = payload

      if (!userId || !role) {
        return new Response(JSON.stringify({ error: 'User ID and role required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: existing, error: getError } = await supabase.auth.admin.getUserById(userId)
      if (getError || !existing?.user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Lister les utilisateurs avec count de signalements
    // Support GET + "users" (compat) et POST + "list_users" (frontend)
    if (action === 'users' || action === 'list_users') {
      const { data: users, error } = await supabase.auth.admin.listUsers()
      if (error) throw error

      // Compter les signalements par user (total + unread) et latest
      const { data: reports } = await supabase
        .from('issue_reports')
        .select('user_id, created_at, admin_read_at, id')

      // Trier par created_at DESC pour garantir latest_report_* correct
      const sortedReports = (reports ?? []).slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Agréger les données par user
      const reportStats = sortedReports.reduce((acc, report) => {
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
        if (new Date(report.created_at) > new Date(acc[report.user_id].latest_report_created_at)) {
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
        latest_report_created_at: reportStats[user.id]?.latest_report_created_at || null,
        latest_report_is_unread: reportStats[user.id]?.latest_report_is_unread || false
      }))

      if (DEBUG_ADMIN) {
        const sample = usersWithReports.slice(0, 3).map((u) => ({
          id: u.id,
          total_reports: u.total_reports,
          unread_reports: u.unread_reports,
          latest_report_id: u.latest_report_id,
          latest_report_created_at: u.latest_report_created_at,
        }))
        console.log('[admin:list_users] usersWithReports', { usersCount: usersWithReports.length, sample })
      }

      return new Response(JSON.stringify({ users: usersWithReports }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Créer/inviter un utilisateur
    if (action === 'create_user_invite' || action === 'invite_user') {
      const { email } = payload
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email)
      if (error) throw error

      return new Response(JSON.stringify({ success: true, user: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer un utilisateur
    if (action === 'delete_user') {
      const userId = payload.userId ?? payload.user_id
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Reset password / renvoyer invitation
    if (action === 'reset_password') {
      const userId = payload.userId ?? payload.user_id
      let email = payload.email

      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!email) {
        const { data: existing, error: getError } = await supabase.auth.admin.getUserById(userId)
        if (getError || !existing?.user?.email) {
          return new Response(JSON.stringify({ error: 'User email not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Lister les signalements d'un utilisateur
    if (action === 'list_issue_reports') {
      const userId = payload.userId ?? payload.user_id
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: reports, error } = await supabase
        .from('issue_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify({ reports }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Obtenir le dernier signalement pour un utilisateur
    if (action === 'get_latest_issue_for_user') {
      const userId = payload.userId ?? payload.user_id
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Marquer un signalement comme lu
    if (action === 'mark_issue_read' || action === 'mark_issue_report_read') {
      const reportId = payload.reportId ?? payload.report_id
      if (!reportId) {
        return new Response(JSON.stringify({ error: 'Report ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('issue_reports')
        .update({ admin_read_at: new Date().toISOString() })
        .eq('id', reportId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer un signalement
    if (action === 'delete_issue' || action === 'delete_issue_report') {
      const reportId = payload.reportId ?? payload.report_id
      if (!reportId) {
        return new Response(JSON.stringify({ error: 'Report ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('issue_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supprimer tous les signalements d'un utilisateur
    if (action === 'delete_all_issues_for_user' || action === 'delete_all_issue_reports') {
      const userId = payload.userId ?? payload.user_id
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Version endpoint for deployment verification
    if (action === 'version') {
      return new Response(JSON.stringify({ 
        version: 'SER1-admin-20250106-01',
        deployedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
