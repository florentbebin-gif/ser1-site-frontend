/**
 * Hook pour charger / sauvegarder les base_contrat_settings.
 *
 * Consommé uniquement par la page /settings/base-contrat.
 * Ne provoque aucun fetch sur les autres pages.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  getBaseContratSettings,
  saveBaseContratSettings,
  addBaseContratListener,
} from '../utils/baseContratSettingsCache';
import type { BaseContratSettings } from '../types/baseContratSettings';

export interface UseBaseContratSettingsReturn {
  settings: BaseContratSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  message: string;
  reload: () => Promise<void>;
  save: (_data: BaseContratSettings) => Promise<boolean>;
  setSettings: React.Dispatch<React.SetStateAction<BaseContratSettings | null>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

export function useBaseContratSettings(): UseBaseContratSettingsReturn {
  const [settings, setSettings] = useState<BaseContratSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBaseContratSettings({ force: true });
      setSettings(data);
    } catch (err) {
      setError((err as Error)?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getBaseContratSettings();
        if (mounted) setSettings(data);
      } catch (err) {
        if (mounted) setError((err as Error)?.message ?? 'Erreur de chargement');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    // Listen for external invalidation (other tabs, other components)
    const unlisten = addBaseContratListener(() => {
      load();
    });

    return () => {
      mounted = false;
      unlisten();
    };
  }, []);

  const save = useCallback(
    async (data: BaseContratSettings): Promise<boolean> => {
      try {
        setSaving(true);
        setError(null);
        setMessage('');

        const { error: saveErr } = await saveBaseContratSettings(data);
        if (saveErr) {
          setError(saveErr);
          setMessage('Erreur lors de l\u2019enregistrement.');
          return false;
        }

        setSettings(data);
        setMessage('Paramètres enregistrés.');
        return true;
      } catch (err) {
        setError((err as Error)?.message ?? 'Erreur inconnue');
        setMessage('Erreur lors de l\u2019enregistrement.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    settings,
    loading,
    saving,
    error,
    message,
    reload,
    save,
    setSettings,
    setMessage,
  };
}
