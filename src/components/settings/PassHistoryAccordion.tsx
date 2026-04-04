import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { numberOrEmpty } from './settingsHelpers';

interface PassHistoryRow {
  year: number;
  pass_amount: number | null;
}

interface PassHistoryAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  isAdmin: boolean;
}

/**
 * Historique du PASS chargé depuis public.pass_history.
 */
export default function PassHistoryAccordion({
  isOpen,
  onToggle,
  isAdmin,
}: PassHistoryAccordionProps): React.ReactElement {
  const [rows, setRows] = useState<PassHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function init(): Promise<void> {
      try {
        await supabase.rpc('ensure_pass_history_current');

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
  }, []);

  const handleChange = (index: number, value: string): void => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], pass_amount: value === '' ? null : Number(value) };
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
        setMessage('Historique du PASS enregistré.');
      }
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de l'enregistrement du PASS.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="prelev-header-pass"
        aria-expanded={isOpen}
        aria-controls="prelev-panel-pass"
        onClick={onToggle}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Historique du PASS (8 valeurs)
        </span>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-pass"
          role="region"
          aria-labelledby="prelev-header-pass"
        >
          {loading ? (
            <p className="settings-inline-note">Chargement...</p>
          ) : (
            <>
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th className="taux-col">PASS (EUR)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td className="taux-col">
                        <input
                          type="number"
                          value={numberOrEmpty(row.pass_amount)}
                          placeholder="À renseigner"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, e.target.value)}
                          disabled={!isAdmin}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isAdmin && (
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    void handleSave();
                  }}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer le PASS'}
                </button>
              )}

              {message && (
                <div className={`settings-feedback-message settings-feedback-message--compact ${message.includes('Erreur') ? 'settings-feedback-message--error' : 'settings-feedback-message--success'}`}>
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
