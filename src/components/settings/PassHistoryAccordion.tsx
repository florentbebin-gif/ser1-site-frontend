import React from 'react';
import type { PassHistoryRow } from '@/hooks/settings/usePassHistory';
import SettingsTitleWithIcon from './SettingsTitleWithIcon';
import { numberOrEmpty } from './settingsHelpers';

interface PassHistoryAccordionProps {
  rows: PassHistoryRow[];
  loading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (index: number, value: string) => void;
  isAdmin: boolean;
}

/**
 * Historique du PASS chargé depuis public.pass_history.
 */
export default function PassHistoryAccordion({
  rows,
  loading,
  isOpen,
  onToggle,
  onChange,
  isAdmin,
}: PassHistoryAccordionProps): React.ReactElement {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header fisc-acc-header--with-icon"
        id="prelev-header-pass"
        aria-expanded={isOpen}
        aria-controls="prelev-panel-pass"
        onClick={onToggle}
      >
        <SettingsTitleWithIcon
          icon="calendar-clock"
          className="settings-premium-title settings-premium-title--flush"
        >
          Historique du PASS (8 valeurs)
        </SettingsTitleWithIcon>
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
                    <th className="settings-table-amount-col">PASS (EUR)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td className="settings-table-amount-col">
                        <input
                          type="number"
                          value={numberOrEmpty(row.pass_amount)}
                          placeholder="À renseigner"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onChange(idx, e.target.value)
                          }
                          disabled={!isAdmin}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
