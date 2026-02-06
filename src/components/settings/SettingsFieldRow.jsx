/**
 * SettingsFieldRow.jsx
 *
 * Composant générique pour une ligne de formulaire Settings :
 * [label] [input] [unit]
 *
 * Phase 2 — factorisation UI des pages Settings.
 */

import React from 'react';
import { numberOrEmpty } from '../../utils/settingsHelpers';

/**
 * @param {Object} props
 * @param {string} props.label - Texte du label
 * @param {string|string[]} props.path - Chemin dans l'objet settings (array) ou clé simple
 * @param {any} props.value - Valeur actuelle
 * @param {Function} props.onChange - (path, value) => void
 * @param {string} [props.type='number'] - Type de l'input
 * @param {string} [props.step] - Step pour type="number"
 * @param {string} [props.unit] - Unité affichée après l'input (% €)
 * @param {boolean} [props.disabled=false]
 */
export default function SettingsFieldRow({
  label,
  path,
  value,
  onChange,
  type = 'number',
  step,
  unit,
  disabled = false,
}) {
  const pathArray = Array.isArray(path) ? path : [path];

  const handleChange = (e) => {
    const raw = e.target.value;
    const parsed = raw === '' ? null : type === 'number' ? Number(raw) : raw;
    onChange(pathArray, parsed);
  };

  const displayValue = type === 'number' ? numberOrEmpty(value) : value ?? '';

  return (
    <div className={`settings-field-row${type === 'text' ? ' settings-field-row--text' : ''}`}>
      <label>{label}</label>
      <input
        type={type}
        step={step}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
      />
      {unit && <span>{unit}</span>}
    </div>
  );
}
