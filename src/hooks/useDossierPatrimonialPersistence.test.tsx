// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyDossierPatrimonial } from '@/domain/dossier';
import {
  type DossierPatrimonialSaveResult,
  useDossierPatrimonialPersistence,
} from './useDossierPatrimonialPersistence';

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: supabaseMocks.getUser,
    },
    from: supabaseMocks.from,
  },
}));

describe('useDossierPatrimonialPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.from.mockReturnValue({ upsert: supabaseMocks.upsert });
    supabaseMocks.upsert.mockResolvedValue({ error: null });
  });

  it('sauvegarde le dossier patrimonial dans la table Supabase dédiée', async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    const dossier = createEmptyDossierPatrimonial({
      id: '00000000-0000-4000-8000-000000000001',
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });

    const { result } = renderHook(() => useDossierPatrimonialPersistence());

    await waitFor(() => expect(result.current.ownerUserId).toBe('user-1'));

    let saveResult: DossierPatrimonialSaveResult | null = null;
    await act(async () => {
      saveResult = await result.current.saveDossier(dossier);
    });

    expect(saveResult).toEqual({ ok: true, reason: 'saved' });
    expect(supabaseMocks.from).toHaveBeenCalledWith('dossiers_patrimoniaux');
    expect(supabaseMocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: dossier.id,
        user_id: 'user-1',
        title: 'Foyer patrimonial',
        status: 'draft',
      }),
      { onConflict: 'id' },
    );
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it("n'appelle pas Supabase si aucun utilisateur n'est authentifié", async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const dossier = createEmptyDossierPatrimonial({
      id: '00000000-0000-4000-8000-000000000002',
      now: '2026-06-07T10:00:00.000Z',
    });

    const { result } = renderHook(() => useDossierPatrimonialPersistence());

    await waitFor(() => expect(supabaseMocks.getUser).toHaveBeenCalledTimes(1));

    let saveResult: DossierPatrimonialSaveResult | null = null;
    await act(async () => {
      saveResult = await result.current.saveDossier(dossier);
    });

    expect(saveResult).toEqual({ ok: false, reason: 'missing-user' });
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("remonte l'erreur Supabase sans masquer l'échec", async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    supabaseMocks.upsert.mockResolvedValue({
      error: { message: 'RLS rejected' },
    });
    const dossier = createEmptyDossierPatrimonial({
      id: '00000000-0000-4000-8000-000000000003',
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });

    const { result } = renderHook(() => useDossierPatrimonialPersistence());

    await waitFor(() => expect(result.current.ownerUserId).toBe('user-1'));

    let saveResult: DossierPatrimonialSaveResult | null = null;
    await act(async () => {
      saveResult = await result.current.saveDossier(dossier);
    });

    expect(saveResult).toEqual({
      ok: false,
      reason: 'supabase-error',
      message: 'RLS rejected',
    });
    expect(result.current.error).toBe('RLS rejected');
  });
});
