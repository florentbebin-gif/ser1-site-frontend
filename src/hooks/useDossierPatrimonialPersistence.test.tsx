// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEmptyDossierPatrimonial,
  toDossierPatrimonialUpsertRow,
  type DossierPatrimonialRow,
} from '@/domain/dossier';
import {
  type DossierPatrimonialLoadResult,
  type DossierPatrimonialSaveResult,
  useDossierPatrimonialPersistence,
} from './useDossierPatrimonialPersistence';

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: supabaseMocks.getUser,
    },
    from: supabaseMocks.from,
  },
}));

function createQueryBuilder() {
  const query = {
    select: vi.fn(() => query),
    upsert: vi.fn(),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    then: vi.fn(),
  };
  return query;
}

describe('useDossierPatrimonialPersistence', () => {
  let query: ReturnType<typeof createQueryBuilder>;

  beforeEach(() => {
    vi.clearAllMocks();
    query = createQueryBuilder();
    query.upsert.mockReturnValue(query);
    query.single.mockResolvedValue({ data: null, error: null });
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    query.then.mockImplementation((onFulfilled, onRejected) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected),
    );
    supabaseMocks.from.mockReturnValue(query);
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
    query.single.mockResolvedValue({
      data: {
        ...toDossierPatrimonialUpsertRow(dossier, 'user-1'),
        created_at: '2026-06-07T10:00:00.000Z',
        updated_at: '2026-06-07T10:01:00.000Z',
      },
      error: null,
    });

    const { result } = renderHook(() => useDossierPatrimonialPersistence());

    await waitFor(() => expect(result.current.ownerUserId).toBe('user-1'));

    let saveResult: DossierPatrimonialSaveResult | null = null;
    await act(async () => {
      saveResult = await result.current.saveDossier(dossier);
    });

    expect(saveResult).toMatchObject({ ok: true, reason: 'saved' });
    expect(supabaseMocks.from).toHaveBeenCalledWith('dossiers_patrimoniaux');
    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: dossier.id,
        user_id: 'user-1',
        title: 'Foyer patrimonial',
        status: 'draft',
      }),
      { onConflict: 'id' },
    );
    expect(query.upsert.mock.calls[0]?.[0]).not.toHaveProperty('created_at');
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
    query.single.mockResolvedValue({
      data: null,
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

  it('prouve le round-trip save puis load depuis Supabase vers le modèle domaine', async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    const dossier = createEmptyDossierPatrimonial({
      id: '00000000-0000-4000-8000-000000000004',
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });
    dossier.membres.push({
      id: 'membre-1',
      role: 'client',
      prenom: 'Alice',
      nom: 'Martin',
      dateNaissance: '1980-01-01',
      sourceRefIds: [],
    });
    dossier.foyer.membrePrincipalId = 'membre-1';
    dossier.objectifs.push({
      id: 'objectif-1',
      code: 'developper_patrimoine',
      label: 'Développer mon patrimoine',
      priority: 1,
      sourceRefIds: [],
    });
    dossier.completion = {
      scope: 'f1_core',
      status: 'complete',
      missingRequiredFields: [],
      updatedAt: '2026-06-07T10:00:00.000Z',
    };
    const storedRow: DossierPatrimonialRow = {
      ...toDossierPatrimonialUpsertRow(dossier, 'user-1'),
      created_at: '2026-06-07T10:00:00.000Z',
      updated_at: '2026-06-07T10:05:00.000Z',
    };
    query.single.mockResolvedValue({ data: storedRow, error: null });
    query.maybeSingle.mockResolvedValue({ data: storedRow, error: null });

    const { result } = renderHook(() => useDossierPatrimonialPersistence());

    await waitFor(() => expect(result.current.ownerUserId).toBe('user-1'));

    await act(async () => {
      await result.current.saveDossier(dossier);
    });

    let loadResult: DossierPatrimonialLoadResult | null = null;
    await act(async () => {
      loadResult = await result.current.loadDossier(dossier.id);
    });

    expect(loadResult).toMatchObject({
      ok: true,
      dossier: {
        id: dossier.id,
        ownerUserId: 'user-1',
        foyer: {
          membrePrincipalId: 'membre-1',
        },
        completion: {
          status: 'complete',
        },
        createdAt: '2026-06-07T10:00:00.000Z',
      },
    });
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('id', dossier.id);
    expect(result.current.currentDossier?.membres[0]?.prenom).toBe('Alice');
  });

  it('relit le dernier dossier central depuis la table Supabase dédiée', async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    const dossier = createEmptyDossierPatrimonial({
      id: '00000000-0000-4000-8000-000000000005',
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });
    dossier.membres.push({
      id: 'membre-latest',
      role: 'client',
      prenom: 'Clara',
      nom: 'Durand',
      dateNaissance: '1975-04-12',
      sourceRefIds: [],
    });
    dossier.foyer.membrePrincipalId = 'membre-latest';
    dossier.objectifs.push({
      id: 'objectif-latest',
      code: 'preparer_transmission',
      label: 'Préparer la transmission',
      priority: 1,
      sourceRefIds: [],
    });
    dossier.completion = {
      scope: 'f1_core',
      status: 'complete',
      missingRequiredFields: [],
      updatedAt: '2026-06-07T10:00:00.000Z',
    };
    const storedRow: DossierPatrimonialRow = {
      ...toDossierPatrimonialUpsertRow(dossier, 'user-1'),
      created_at: '2026-06-07T10:00:00.000Z',
      updated_at: '2026-06-07T10:15:00.000Z',
    };
    query.maybeSingle.mockResolvedValue({ data: storedRow, error: null });

    const { result } = renderHook(() => useDossierPatrimonialPersistence());

    await waitFor(() => expect(result.current.ownerUserId).toBe('user-1'));

    let loadResult: DossierPatrimonialLoadResult | null = null;
    await act(async () => {
      loadResult = await result.current.loadLatestDossier();
    });

    expect(loadResult).toMatchObject({
      ok: true,
      dossier: {
        id: dossier.id,
        ownerUserId: 'user-1',
        completion: {
          status: 'complete',
        },
      },
    });
    expect(supabaseMocks.from).toHaveBeenCalledWith('dossiers_patrimoniaux');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(query.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
    expect(result.current.currentDossier?.membres[0]?.prenom).toBe('Clara');
  });
});
