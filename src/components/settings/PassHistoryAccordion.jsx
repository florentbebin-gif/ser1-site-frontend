import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { numberOrEmpty } from '../../utils/settingsHelpers.js';

/**
 * PassHistoryAccordion — Historique du PASS (8 dernières valeurs)
 * 
 * Données dynamiques depuis public.pass_history.
 * Au mount : appelle ensure_pass_history_current() (rollover au 1er janvier),
 * puis charge les 8 lignes triées par année ASC.
 * Admin peut modifier les montants et enregistrer (upsert).
 *
 * @param {boolean} isOpen - Accordéon ouvert
 * @param {function} onToggle - Callback toggle
 * @param {boolean} isAdmin - Droits admin
 */
export default function PassHistoryAccordion({ isOpen, onToggle, isAdmin }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // --------------------------------------------------
  // Chargement : rollover + fetch
  // --------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Rollover idempotent (SECURITY DEFINER — accessible à tout authentifié)
        await supabase.rpc('ensure_pass_history_current');

        // Fetch les 8 lignes
        const { data, error } = await supabase
          .from('pass_history')
          .select('year, pass_amount')
          .order('year', { ascending: true });

        if (!mounted) return;

        if (error) {
          console.error('Erreur chargement pass_history :', error);
        } else {
          setRows(data || []);
        }
      } catch (e) {
        console.error('Erreur init pass_history :', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  // --------------------------------------------------
  // Modification locale d'un montant
  // --------------------------------------------------
  const handleChange = (index, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], pass_amount: value === '' ? null : Number(value) };
      return copy;
    });
    setMessage('');
  };

  // --------------------------------------------------
  // Sauvegarde (upsert)
  // --------------------------------------------------
  const handleSave = async () => {
    if (!isAdmin) return;
    try {
      setSaving(true);
      setMessage('');

      const payload = rows.map((r) => ({
        year: r.year,
        pass_amount: r.pass_amount,
      }));

      const { error } = await supabase
        .from('pass_history')
        .upsert(payload, { onConflict: 'year' });

      if (error) {
        console.error(error);
        setMessage("Erreur lors de l'enregistrement du PASS.");
      } else {
        setMessage('Historique du PASS enregistré.');
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement du PASS.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Rendu
  // --------------------------------------------------
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
        <span className="fisc-product-title" style={{ margin: 0 }}>
          Historique du PASS (8 valeurs)
        </span>
        <span className="fisc-acc-chevron">{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-pass"
          role="region"
          aria-labelledby="prelev-header-pass"
        >
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>Chargement…</p>
          ) : (
            <>
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th className="taux-col">PASS (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.year}>
                      <td>{r.year}</td>
                      <td className="taux-col">
                        <input
                          type="number"
                          value={numberOrEmpty(r.pass_amount)}
                          placeholder="À renseigner"
                          onChange={(e) => handleChange(idx, e.target.value)}
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
                  onClick={handleSave}
                  disabled={saving}
                  style={{ marginTop: 12 }}
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer le PASS'}
                </button>
              )}

              {message && (
                <div
                  style={{
                    fontSize: 14,
                    marginTop: 8,
                    padding: '10px 14px',
                    background: message.includes('Erreur')
                      ? 'var(--color-error-bg)'
                      : 'var(--color-success-bg)',
                    border: message.includes('Erreur')
                      ? '1px solid var(--color-error-border)'
                      : '1px solid var(--color-success-border)',
                    borderRadius: 6,
                    color: message.includes('Erreur')
                      ? 'var(--color-error-text)'
                      : 'var(--color-success-text)',
                    fontWeight: 500,
                  }}
                >
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
