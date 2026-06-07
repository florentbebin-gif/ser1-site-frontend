import { useCallback, useEffect, useState } from 'react';
import type { DossierPatrimonial } from '@/domain/dossier';
import { DOSSIERS_PATRIMONIAUX_TABLE, toDossierPatrimonialRow } from '@/domain/dossier';
import { supabase } from '@/supabaseClient';

export type DossierPatrimonialSaveResult =
  | { ok: true; reason: 'saved' }
  | { ok: false; reason: 'missing-user' | 'supabase-error'; message?: string };

export interface DossierPatrimonialPersistenceState {
  ownerUserId: string | null;
  saving: boolean;
  lastSavedAt: string | null;
  error: string | null;
  saveDossier: (dossier: DossierPatrimonial) => Promise<DossierPatrimonialSaveResult>;
}

export function useDossierPatrimonialPersistence(): DossierPatrimonialPersistenceState {
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
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
      const savedAt = new Date().toISOString();
      const row = toDossierPatrimonialRow(
        {
          ...dossier,
          ownerUserId,
          updatedAt: savedAt,
        },
        ownerUserId,
      );
      const { error: upsertError } = await supabase
        .from(DOSSIERS_PATRIMONIAUX_TABLE)
        .upsert(row, { onConflict: 'id' });

      setSaving(false);

      if (upsertError) {
        setError(upsertError.message);
        return {
          ok: false,
          reason: 'supabase-error',
          message: upsertError.message,
        };
      }

      setLastSavedAt(savedAt);
      return { ok: true, reason: 'saved' };
    },
    [ownerUserId],
  );

  return {
    ownerUserId,
    saving,
    lastSavedAt,
    error,
    saveDossier,
  };
}
