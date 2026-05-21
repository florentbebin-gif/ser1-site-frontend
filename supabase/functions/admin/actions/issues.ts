import {
  errorResponse,
  jsonResponse,
  type AdminActionHandler,
} from '../lib/http.ts'
import { loadIssueReportOrThrow } from '../lib/loaders.ts'
import { recordAdminAction } from '../lib/audit.ts'
import type { SupabaseClient } from '../lib/auth.ts'

const ISSUE_REPORTS_BUCKET = 'issue-reports'

interface IssueReportWithAttachments {
  attachments?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function collectIssueAttachmentStoragePaths(
  reports: IssueReportWithAttachments | IssueReportWithAttachments[] | null | undefined,
): string[] {
  const rows = Array.isArray(reports) ? reports : reports ? [reports] : []
  const paths = rows.flatMap((report) => {
    if (!Array.isArray(report.attachments)) return []
    return report.attachments.flatMap((attachment) => {
      if (!isRecord(attachment)) return []
      const storagePath = attachment.storagePath
      return typeof storagePath === 'string' && storagePath.length > 0 ? [storagePath] : []
    })
  })

  return Array.from(new Set(paths))
}

async function removeIssueAttachmentObjects(
  supabase: SupabaseClient,
  storagePaths: string[],
): Promise<void> {
  if (storagePaths.length === 0) return
  const { error } = await supabase.storage.from(ISSUE_REPORTS_BUCKET).remove(storagePaths)
  if (error) throw error
}

const listIssueCounts: AdminActionHandler = async (ctx) => {
  const { data: reports, error } = await ctx.supabase
    .from('issue_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return jsonResponse({ reports }, ctx.responseHeaders)
}

const listIssueReports: AdminActionHandler = async (ctx) => {
  const userId = (ctx.payload.userId ?? ctx.payload.user_id) as string | undefined

  if (!userId) {
    return errorResponse('ID utilisateur requis', ctx.responseHeaders, 400)
  }

  try {
    const { error: tableCheckError } = await ctx.supabase
      .from('issue_reports')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.error('[admin:list_issue_reports] Table check error:', tableCheckError)
      return jsonResponse({
        error: 'Table check failed',
        details: tableCheckError.message,
        reports: [],
      }, ctx.responseHeaders, 500)
    }

    const { data: reports, error } = await ctx.supabase
      .from('issue_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin:list_issue_reports] Query error:', error)
      throw error
    }

    return jsonResponse({ reports: reports || [] }, ctx.responseHeaders)
  } catch (error) {
    console.error('[admin:list_issue_reports] Exception:', error)
    return jsonResponse({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'unknown error',
      reports: [],
    }, ctx.responseHeaders, 500)
  }
}

const getLatestIssueForUser: AdminActionHandler = async (ctx) => {
  const { userId } = ctx.payload as { userId?: string }

  if (!userId) {
    return errorResponse('ID utilisateur requis', ctx.responseHeaders, 400)
  }

  const { data: reports, error } = await ctx.supabase
    .from('issue_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error

  return jsonResponse({ report: reports?.[0] || null }, ctx.responseHeaders)
}

const markIssueRead: AdminActionHandler = async (ctx) => {
  const { reportId } = ctx.payload as { reportId?: string }

  if (!reportId) {
    return errorResponse('ID signalement requis', ctx.responseHeaders, 400)
  }

  const report = await loadIssueReportOrThrow(ctx.supabase, reportId)
  await removeIssueAttachmentObjects(
    ctx.supabase,
    collectIssueAttachmentStoragePaths(report),
  )

  const { error } = await ctx.supabase
    .from('issue_reports')
    .update({ admin_read_at: new Date().toISOString() })
    .eq('id', reportId)

  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'mark_issue_read',
    targetType: 'issue',
    targetId: reportId,
  })
  return jsonResponse({ success: true }, ctx.responseHeaders)
}

const markIssueUnread: AdminActionHandler = async (ctx) => {
  const reportId = (ctx.payload.reportId ?? ctx.payload.report_id) as string | undefined

  if (!reportId) {
    return errorResponse('ID signalement requis', ctx.responseHeaders, 400)
  }

  await loadIssueReportOrThrow(ctx.supabase, reportId)

  const { error } = await ctx.supabase
    .from('issue_reports')
    .update({ admin_read_at: null })
    .eq('id', reportId)

  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'mark_issue_unread',
    targetType: 'issue',
    targetId: reportId,
  })
  return jsonResponse({ success: true }, ctx.responseHeaders)
}

const deleteIssue: AdminActionHandler = async (ctx) => {
  const { reportId } = ctx.payload as { reportId?: string }

  if (!reportId) {
    return errorResponse('ID signalement requis', ctx.responseHeaders, 400)
  }

  await loadIssueReportOrThrow(ctx.supabase, reportId)

  const { error } = await ctx.supabase
    .from('issue_reports')
    .delete()
    .eq('id', reportId)

  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'delete_issue',
    targetType: 'issue',
    targetId: reportId,
  })
  return jsonResponse({ success: true }, ctx.responseHeaders)
}

const deleteAllIssuesForUser: AdminActionHandler = async (ctx) => {
  const { userId } = ctx.payload as { userId?: string }

  if (!userId) {
    return errorResponse('ID utilisateur requis', ctx.responseHeaders, 400)
  }

  const { data: reportsToDelete } = await ctx.supabase
    .from('issue_reports')
    .select('id, attachments')
    .eq('user_id', userId)

  await removeIssueAttachmentObjects(
    ctx.supabase,
    collectIssueAttachmentStoragePaths(reportsToDelete),
  )

  const { error } = await ctx.supabase
    .from('issue_reports')
    .delete()
    .eq('user_id', userId)

  if (error) throw error

  await recordAdminAction(ctx.supabase, {
    requestId: ctx.requestId,
    principal: ctx.principal,
    action: 'delete_all_issues_for_user',
    targetType: 'user',
    targetId: userId,
  })
  return jsonResponse({
    success: true,
    deleted: reportsToDelete?.length || 0,
  }, ctx.responseHeaders)
}

export const issueActionHandlers: Record<string, AdminActionHandler> = {
  list_issue_counts: listIssueCounts,
  list_issue_reports: listIssueReports,
  get_latest_issue_for_user: getLatestIssueForUser,
  mark_issue_read: markIssueRead,
  mark_issue_unread: markIssueUnread,
  mark_issue_report_unread: markIssueUnread,
  delete_issue: deleteIssue,
  delete_all_issues_for_user: deleteAllIssuesForUser,
}
