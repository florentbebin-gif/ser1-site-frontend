import React from 'react';
import { usePassHistory } from './hooks/usePassHistory';
import { numberOrEmpty } from './settingsHelpers';

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
  const { rows, loading, saving, message, handleChange, handleSave } = usePassHistory(isAdmin);

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
