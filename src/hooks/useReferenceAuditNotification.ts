import { useCallback, useEffect, useState } from 'react';

import { useUserRole } from '@/auth/useUserRole';
import { supabase } from '@/supabaseClient';

const REPORT_SELECT = [
  'id',
  'created_at',
  'ok',
  'requires_action',
  'binding_count',
  'referenced_url_count',
  'stale_binding_count',
  'stale_reference_count',
  'url_failure_count',
  'url_blocked_count',
  'url_inconclusive_count',
  'db_finding_count',
  'warning_count',
  'error_count',
  'run_url',
].join(', ');

export interface ReferenceAuditReportSummary {
  id: string;
  createdAt: string;
  ok: boolean;
  requiresAction: boolean;
  bindingCount: number;
  referencedUrlCount: number;
  staleBindingCount: number;
  staleReferenceCount: number;
  urlFailureCount: number;
  urlBlockedCount: number;
  urlInconclusiveCount: number;
  dbFindingCount: number;
  warningCount: number;
  errorCount: number;
  runUrl: string | null;
}

interface ReferenceAuditReportRow {
  id: unknown;
  created_at: unknown;
  ok: unknown;
  requires_action: unknown;
  binding_count: unknown;
  referenced_url_count: unknown;
  stale_binding_count: unknown;
  stale_reference_count: unknown;
  url_failure_count: unknown;
  url_blocked_count: unknown;
  url_inconclusive_count: unknown;
  db_finding_count: unknown;
  warning_count: unknown;
  error_count: unknown;
  run_url: unknown;
}

export interface ReferenceAuditNotificationState {
  isLoading: boolean;
  isSubmitting: boolean;
  isVisible: boolean;
  report: ReferenceAuditReportSummary | null;
  error: string | null;
  acknowledge: () => Promise<void>;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function toBooleanValue(value: unknown): boolean {
  return value === true;
}

function toNumberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function mapReferenceAuditReport(row: ReferenceAuditReportRow): ReferenceAuditReportSummary {
  return {
    id: toStringValue(row.id),
    createdAt: toStringValue(row.created_at),
    ok: toBooleanValue(row.ok),
    requiresAction: toBooleanValue(row.requires_action),
    bindingCount: toNumberValue(row.binding_count),
    referencedUrlCount: toNumberValue(row.referenced_url_count),
    staleBindingCount: toNumberValue(row.stale_binding_count),
    staleReferenceCount: toNumberValue(row.stale_reference_count),
    urlFailureCount: toNumberValue(row.url_failure_count),
    urlBlockedCount: toNumberValue(row.url_blocked_count),
    urlInconclusiveCount: toNumberValue(row.url_inconclusive_count),
    dbFindingCount: toNumberValue(row.db_finding_count),
    warningCount: toNumberValue(row.warning_count),
    errorCount: toNumberValue(row.error_count),
    runUrl: toNullableString(row.run_url),
  };
}

function hiddenState(): Omit<ReferenceAuditNotificationState, 'acknowledge'> {
  return {
    isLoading: false,
    isSubmitting: false,
    isVisible: false,
    report: null,
    error: null,
  };
}

export function useReferenceAuditNotification(): ReferenceAuditNotificationState {
  const { isAdmin, isLoading: isRoleLoading, user } = useUserRole();
  const userId = user?.id ?? null;
  const [state, setState] = useState<Omit<ReferenceAuditNotificationState, 'acknowledge'>>({
    ...hiddenState(),
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    if (isRoleLoading) {
      setState((current) => ({ ...current, isLoading: true }));
      return () => {
        mounted = false;
      };
    }

    if (!isAdmin || !userId) {
      setState(hiddenState());
      return () => {
        mounted = false;
      };
    }

    async function loadLatestReport() {
      setState((current) => ({ ...current, isLoading: true, error: null }));

      const { data: reportRow, error: reportError } = await supabase
        .from('reference_audit_reports')
        .select(REPORT_SELECT)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (reportError) {
        setState({
          ...hiddenState(),
          error: reportError.message,
        });
        return;
      }

      if (!reportRow) {
        setState(hiddenState());
        return;
      }

      const report = mapReferenceAuditReport(reportRow as unknown as ReferenceAuditReportRow);
      if (!report.requiresAction || report.ok) {
        setState({ ...hiddenState(), report });
        return;
      }

      const { data: acknowledgement, error: acknowledgementError } = await supabase
        .from('reference_audit_acknowledgements')
        .select('report_id')
        .eq('report_id', report.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!mounted) return;

      if (acknowledgementError) {
        setState({
          ...hiddenState(),
          report,
          error: acknowledgementError.message,
        });
        return;
      }

      setState({
        isLoading: false,
        isSubmitting: false,
        isVisible: !acknowledgement,
        report,
        error: null,
      });
    }

    void loadLatestReport();

    return () => {
      mounted = false;
    };
  }, [isAdmin, isRoleLoading, userId]);

  const acknowledge = useCallback(async () => {
    if (!userId || !state.report) return;

    setState((current) => ({ ...current, isSubmitting: true, error: null }));
    const { error } = await supabase.from('reference_audit_acknowledgements').upsert(
      {
        report_id: state.report.id,
        user_id: userId,
        acknowledged_at: new Date().toISOString(),
      },
      { onConflict: 'report_id,user_id' },
    );

    if (error) {
      setState((current) => ({ ...current, isSubmitting: false, error: error.message }));
      return;
    }

    setState((current) => ({ ...current, isSubmitting: false, isVisible: false }));
  }, [state.report, userId]);

  return {
    ...state,
    acknowledge,
  };
}
