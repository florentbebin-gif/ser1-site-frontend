/**
 * SettingsTable.jsx
 *
 * Composant générique pour les tableaux éditables des pages Settings.
 * Piloté par un schéma de colonnes + données.
 *
 * Phase 3 — factorisation UI des pages Settings.
 */

import React from 'react';
import { numberOrEmpty } from '../../utils/settingsHelpers';

/**
 * @param {Object} props
 * @param {Array<Object>} props.columns - Définition des colonnes
 *   - key: string — clé dans l'objet row
 *   - header: string — texte du <th>
 *   - type: 'number'|'text'|'display' — 'display' = lecture seule sans input
 *   - step?: string — step pour type="number"
 *   - className?: string — classe CSS sur le <th> et <td> (ex: 'taux-col')
 *   - render?: (value, row, idx) => ReactNode — rendu custom (prioritaire sur le rendu par défaut)
 * @param {Array<Object>} props.rows - Données du tableau
 * @param {Function} props.onCellChange - (rowIndex, key, parsedValue) => void
 * @param {boolean} [props.disabled=false]
 * @param {Object} [props.style] - Style inline sur le <table>
 */
export default function SettingsTable({
  columns,
  rows,
  onCellChange,
  disabled = false,
  style,
}) {
  return (
    <table className="settings-table" style={style}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={row._key || rowIdx}>
            {columns.map((col) => {
              const val = row[col.key];

              if (col.render) {
                return (
                  <td key={col.key} className={col.className}>
                    {col.render(val, row, rowIdx)}
                  </td>
                );
              }

              if (col.type === 'display') {
                return (
                  <td key={col.key} className={col.className} style={{ textAlign: 'left' }}>
                    {val}
                  </td>
                );
              }

              return (
                <td key={col.key} className={col.className}>
                  <input
                    type={col.type || 'number'}
                    step={col.step}
                    value={col.type === 'text' ? (val ?? '') : numberOrEmpty(val)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed =
                        raw === ''
                          ? null
                          : col.type === 'text'
                            ? raw
                            : Number(raw);
                      onCellChange(rowIdx, col.key, parsed);
                    }}
                    disabled={disabled}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
