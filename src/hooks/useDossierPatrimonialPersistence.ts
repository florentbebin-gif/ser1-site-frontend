import { useCallback, useEffect, useState } from 'react';
import type { DossierPatrimonial, DossierPatrimonialRow } from '@/domain/dossier';
import {
  DOSSIERS_PATRIMONIAUX_TABLE,
  fromDossierPatrimonialRow,
  toDossierPatrimonialUpsertRow,
} from '@/domain/dossier';
import { supabase } from '@/supabaseClient';

export type DossierPatrimonialSaveResult =
  | { ok: true; reason: 'saved'; dossier: DossierPatrimonial }
  | { ok: false; reason: 'missing-user' | 'supabase-error'; message?: string };

export type DossierPatrimonialLoadResult =
  | { ok: true; dossier: DossierPatrimonial }
  | {
      ok: false;
      reason: 'missing-user' | 'not-found' | 'supabase-error' | 'invalid-row';
      message?: string;
    };

export type DossierPatrimonialListResult =
  | { ok: true; dossiers: DossierPatrimonialSummary[] }
  | { ok: false; reason: 'missing-user' | 'supabase-error'; message?: string };

export interface DossierPatrimonialSummary {
  id: string;
  title: string;
  status: DossierPatrimonial['status'];
  completionStatus: DossierPatrimonial['completion']['status'];
  createdAt: string;
  updatedAt: string;
}

export interface DossierPatrimonialPersistenceState {
  ownerUserId: string | null;
  loading: boolean;
  saving: boolean;
  currentDossier: DossierPatrimonial | null;
  lastSavedAt: string | null;
  lastLoadedAt: string | null;
  error: string | null;
  saveDossier: (dossier: DossierPatrimonial) => Promise<DossierPatrimonialSaveResult>;
  loadDossier: (id: string) => Promise<DossierPatrimonialLoadResult>;
  loadLatestDossier: () => Promise<DossierPatrimonialLoadResult>;
  listDossiers: () => Promise<DossierPatrimonialListResult>;
}

export function useDossierPatrimonialPersistence(): DossierPatrimonialPersistenceState {
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDossier, setCurrentDossier] = useState<DossierPatrimonial | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser(): Promise<void> {
      const { data, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError) {
        setError(authError.message);
        setOwnerUserId(null);
        return;
      }
      setOwnerUserId(data.user?.id ?? null);
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveDossier = useCallback(
    async (dossier: DossierPatrimonial): Promise<DossierPatrimonialSaveResult> => {
      if (!ownerUserId) {
        setError(null);
        return { ok: false, reason: 'missing-user' };
      }

      setSaving(true);
      setError(null);
      const row = toDossierPatrimonialUpsertRow(
        {
          ...dossier,
          ownerUserId,
        },
        ownerUserId,
      );
      const { data, error: upsertError } = await supabase
        .from(DOSSIERS_PATRIMONIAUX_TABLE)
        .upsert(row, { onConflict: 'id' })
        .select('*')
        .single();

      setSaving(false);

      if (upsertError) {
        setError(upsertError.message);
        return {
          ok: false,
          reason: 'supabase-error',
          message: upsertError.message,
        };
      }

      const parsed = parseDossierRow(data as DossierPatrimonialRow | null);
      if (!parsed.ok) {
        setError(parsed.message ?? 'Ligne dossier invalide');
        return { ok: false, reason: 'supabase-error', message: parsed.message };
      }

      setCurrentDossier(parsed.dossier);
      setLastSavedAt(parsed.dossier.updatedAt);
      return { ok: true, reason: 'saved', dossier: parsed.dossier };
    },
    [ownerUserId],
  );

  const loadDossier = useCallback(
    async (id: string): Promise<DossierPatrimonialLoadResult> => {
      if (!ownerUserId) {
        setError(null);
        return { ok: false, reason: 'missing-user' };
      }

      setLoading(true);
      setError(null);
      const { data, error: loadError } = await supabase
        .from(DOSSIERS_PATRIMONIAUX_TABLE)
        .select('*')
        .eq('id', id)
        .eq('user_id', ownerUserId)
        .maybeSingle();
      setLoading(false);

      if (loadError) {
        setError(loadError.message);
        return { ok: false, reason: 'supabase-error', message: loadError.message };
      }

      return applyLoadedRow(
        data as DossierPatrimonialRow | null,
        setCurrentDossier,
        setLastLoadedAt,
        setError,
      );
    },
    [ownerUserId],
  );

  const loadLatestDossier = useCallback(async (): Promise<DossierPatrimonialLoadResult> => {
    if (!ownerUserId) {
      setError(null);
      return { ok: false, reason: 'missing-user' };
    }

    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase
      .from(DOSSIERS_PATRIMONIAUX_TABLE)
      .select('*')
      .eq('user_id', ownerUserId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLoading(false);

    if (loadError) {
      setError(loadError.message);
      return { ok: false, reason: 'supabase-error', message: loadError.message };
    }

    return applyLoadedRow(
      data as DossierPatrimonialRow | null,
      setCurrentDossier,
      setLastLoadedAt,
      setError,
    );
  }, [ownerUserId]);

  const listDossiers = useCallback(async (): Promise<DossierPatrimonialListResult> => {
    if (!ownerUserId) {
      setError(null);
      return { ok: false, reason: 'missing-user' };
    }

    setLoading(true);
    setError(null);
    const { data, error: listError } = await supabase
      .from(DOSSIERS_PATRIMONIAUX_TABLE)
      .select('id,title,status,completion_status,created_at,updated_at')
      .eq('user_id', ownerUserId)
      .order('updated_at', { ascending: false });
    setLoading(false);

    if (listError) {
      setError(listError.message);
      return { ok: false, reason: 'supabase-error', message: listError.message };
    }

    const dossiers = ((data ?? []) as DossierPatrimonialListDatabaseRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      completionStatus: row.completion_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return { ok: true, dossiers };
  }, [ownerUserId]);

  return {
    ownerUserId,
    loading,
    saving,
    currentDossier,
    lastSavedAt,
    lastLoadedAt,
    error,
    saveDossier,
    loadDossier,
    loadLatestDossier,
    listDossiers,
  };
}

interface DossierPatrimonialListDatabaseRow {
  id: string;
  title: string;
  status: DossierPatrimonial['status'];
  completion_status: DossierPatrimonial['completion']['status'];
  created_at: string;
  updated_at: string;
}

function parseDossierRow(
  row: DossierPatrimonialRow | null,
): { ok: true; dossier: DossierPatrimonial } | { ok: false; message?: string } {
  if (!row) return { ok: false, message: 'Dossier patrimonial introuvable' };
  try {
    return { ok: true, dossier: fromDossierPatrimonialRow(row) };
  } catch (parseError) {
    return {
      ok: false,
      message: parseError instanceof Error ? parseError.message : 'Ligne dossier invalide',
    };
  }
}

function applyLoadedRow(
  row: DossierPatrimonialRow | null,
  setCurrentDossier: (dossier: DossierPatrimonial | null) => void,
  setLastLoadedAt: (date: string | null) => void,
  setError: (error: string | null) => void,
): DossierPatrimonialLoadResult {
  if (!row) return { ok: false, reason: 'not-found' };

  const parsed = parseDossierRow(row);
  if (!parsed.ok) {
    setError(parsed.message ?? 'Ligne dossier invalide');
    return { ok: false, reason: 'invalid-row', message: parsed.message };
  }

  setCurrentDossier(parsed.dossier);
  setLastLoadedAt(parsed.dossier.updatedAt);
  return { ok: true, dossier: parsed.dossier };
}
