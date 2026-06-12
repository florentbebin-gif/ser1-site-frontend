// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRoleState } from '@/auth/useUserRole';

import { useReferenceAuditNotification } from './useReferenceAuditNotification';

const mocks = vi.hoisted(() => ({
  roleState: {
    isAdmin: false,
    isLoading: false,
    user: null,
  } as Partial<UserRoleState>,
  from: vi.fn(),
}));

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => mocks.roleState,
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: mocks.from,
  },
}));

function createQueryBuilder() {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return query;
}

const reportRow = {
  id: 'report-1',
  created_at: '2026-06-12T08:00:00.000Z',
  ok: false,
  requires_action: true,
  binding_count: 444,
  referenced_url_count: 173,
  stale_binding_count: 2,
  stale_reference_count: 1,
  url_failure_count: 1,
  url_blocked_count: 0,
  url_inconclusive_count: 0,
  db_finding_count: 0,
  warning_count: 1,
  error_count: 4,
  run_url: 'https://github.com/florentbebin-gif/ser1-site-frontend/actions/runs/123',
};

describe('useReferenceAuditNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.roleState.isAdmin = false;
    mocks.roleState.isLoading = false;
    mocks.roleState.user = null;
  });

  it('ne lit pas Supabase si l’utilisateur n’est pas admin connecté', async () => {
    const { result } = renderHook(() => useReferenceAuditNotification());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mocks.from).not.toHaveBeenCalled();
    expect(result.current.isVisible).toBe(false);
  });

  it('affiche le dernier rapport non OK non acquitté', async () => {
    mocks.roleState.isAdmin = true;
    mocks.roleState.user = { id: 'admin-1' } as UserRoleState['user'];
    const reportQuery = createQueryBuilder();
    const acknowledgementQuery = createQueryBuilder();
    reportQuery.maybeSingle.mockResolvedValue({ data: reportRow, error: null });
    acknowledgementQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.from.mockReturnValueOnce(reportQuery).mockReturnValueOnce(acknowledgementQuery);

    const { result } = renderHook(() => useReferenceAuditNotification());

    await waitFor(() => expect(result.current.isVisible).toBe(true));

    expect(mocks.from).toHaveBeenNthCalledWith(1, 'reference_audit_reports');
    expect(mocks.from).toHaveBeenNthCalledWith(2, 'reference_audit_acknowledgements');
    expect(result.current.report).toMatchObject({
      id: 'report-1',
      requiresAction: true,
      bindingCount: 444,
      errorCount: 4,
    });
  });

  it('n’affiche rien quand le dernier rapport est OK', async () => {
    mocks.roleState.isAdmin = true;
    mocks.roleState.user = { id: 'admin-1' } as UserRoleState['user'];
    const reportQuery = createQueryBuilder();
    reportQuery.maybeSingle.mockResolvedValue({
      data: { ...reportRow, ok: true, requires_action: false },
      error: null,
    });
    mocks.from.mockReturnValueOnce(reportQuery);

    const { result } = renderHook(() => useReferenceAuditNotification());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isVisible).toBe(false);
    expect(result.current.report?.ok).toBe(true);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it('acquitte le rapport pour l’admin courant', async () => {
    mocks.roleState.isAdmin = true;
    mocks.roleState.user = { id: 'admin-1' } as UserRoleState['user'];
    const reportQuery = createQueryBuilder();
    const acknowledgementQuery = createQueryBuilder();
    const upsertQuery = createQueryBuilder();
    reportQuery.maybeSingle.mockResolvedValue({ data: reportRow, error: null });
    acknowledgementQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.from
      .mockReturnValueOnce(reportQuery)
      .mockReturnValueOnce(acknowledgementQuery)
      .mockReturnValueOnce(upsertQuery);

    const { result } = renderHook(() => useReferenceAuditNotification());

    await waitFor(() => expect(result.current.isVisible).toBe(true));
    await act(async () => {
      await result.current.acknowledge();
    });

    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        report_id: 'report-1',
        user_id: 'admin-1',
      }),
      { onConflict: 'report_id,user_id' },
    );
    expect(result.current.isVisible).toBe(false);
  });
});
