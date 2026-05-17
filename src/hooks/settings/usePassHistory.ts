import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { broadcastInvalidation, invalidate } from '../../utils/cache/fiscalSettingsCache';

export interface PassHistoryRow {
  year: number;
  pass_amount: number | null;
}

interface UsePassHistoryReturn {
  rows: PassHistoryRow[];
  loading: boolean;
  saving: boolean;
  message: string;
  handleChange: (index: number, value: string) => void;
  handleSave: () => Promise<void>;
}

/**
 * Hook settings pour l'historique du PASS.
 * Les appels Supabase restent dans src/hooks, pas dans src/components.
 */
export function usePassHistory(isAdmin: boolean): UsePassHistoryReturn {
  const [rows, setRows] = useState<PassHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function init(): Promise<void> {
      try {
        if (isAdmin) {
          await supabase.rpc('ensure_pass_history_current');
        }

        const { data, error } = await supabase
          .from('pass_history')
          .select('year, pass_amount')
          .order('year', { ascending: true });

        if (!mounted) return;

        if (error) {
          console.error('Erreur chargement pass_history :', error);
        } else {
          const normalizedRows = (data ?? []).map((row) => ({
            year: Number(row.year),
            pass_amount:
              typeof row.pass_amount === 'number'
                ? row.pass_amount
                : row.pass_amount == null
                  ? null
                  : Number(row.pass_amount),
          }));
          setRows(normalizedRows);
        }
      } catch (error) {
        console.error('Erreur init pass_history :', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void init();

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const handleChange = (index: number, value: string): void => {
    setRows((prev) => {
      const copy = [...prev];
      const row = copy[index];
      if (!row) return prev;
      copy[index] = { ...row, pass_amount: value === '' ? null : Number(value) };
      return copy;
    });
    setMessage('');
  };

  const handleSave = async (): Promise<void> => {
    if (!isAdmin) return;

    try {
      setSaving(true);
      setMessage('');

      const payload: PassHistoryRow[] = rows.map((row) => ({
        year: row.year,
        pass_amount: row.pass_amount,
      }));

      const { error } = await supabase.from('pass_history').upsert(payload, { onConflict: 'year' });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement du PASS.");
      } else {
        await invalidate('pass');
        broadcastInvalidation('pass');
        setMessage('Historique du PASS enregistré.');
      }
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de l'enregistrement du PASS.");
    } finally {
      setSaving(false);
    }
  };

  return { rows, loading, saving, message, handleChange, handleSave };
}
