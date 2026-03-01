/**
 * CreditInputs.jsx - Composants de saisie réutilisables pour le simulateur de crédit
 *
 * Inspiré de placement/components/inputs.jsx
 * Tous les inputs respectent la gouvernance UI :
 * - Fond BLANC (#FFFFFF) impératif
 * - Bordure C8, focus C2 + ring C4
 * - Typo héritée, 13px
 *
 * Styles extraits dans CreditInputs.css (classes .ci-*)
 * Zéro inline style, zéro Object.assign sur e.target.style
 */

import React, { useState, useEffect } from 'react';
import { parseCapital, parseTaux, formatTauxInput } from '../utils/creditFormatters.js';
import './CreditInputs.css';

// ============================================================================
// INPUT EURO (Montant avec unité €)
// ============================================================================

export function InputEuro({
  label,
  value,
  onChange,
  disabled = false,
  hint,
  error,
  testId,
  dataTestId,
  onBlur,
  highlight = false,
}) {
  const fmt = (n) => (Math.round(Number(n) || 0)).toLocaleString('fr-FR');

  const handleChange = (e) => {
    const parsed = parseCapital(e.target.value);
    onChange(parsed);
  };

  return (
    <div className="ci-field">
      {label && <label className="ci-label">{label}</label>}
      <div className="ci-field-row">
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={fmt(value)}
          onChange={handleChange}
          data-testid={dataTestId || testId}
          aria-invalid={!!error}
          className={`ci-input${error ? ' ci-input--error' : ''}${highlight ? ' ci-input--guide' : ''}`}
          onBlur={onBlur}
        />
        <span className="ci-unit">€</span>
      </div>
      {error && <span className="ci-error" role="alert">{error}</span>}
      {!error && hint && <span className="ci-hint">{hint}</span>}
    </div>
  );
}

// ============================================================================
// INPUT POURCENTAGE (Taux avec unité %)
// ============================================================================

export function InputPct({
  label,
  rawValue,
  onBlur,
  disabled = false,
  hint,
  error,
  testId,
  placeholder = "0,00",
  highlight = false,
}) {
  const [local, setLocal] = useState(rawValue || '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(rawValue || '');
  }, [rawValue, focused]);

  const handleChange = (e) => {
    setLocal(formatTauxInput(e.target.value));
  };

  const handleBlur = () => {
    setFocused(false);
    const num = parseTaux(local);
    setLocal(num.toFixed(2).replace('.', ','));
    onBlur?.(num);
  };

  return (
    <div className="ci-field" data-testid={testId}>
      {label && <label className="ci-label">{label}</label>}
      <div className="ci-field-row">
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={local}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          aria-invalid={!!error}
          className={`ci-input${error ? ' ci-input--error' : ''}${highlight ? ' ci-input--guide' : ''}`}
        />
        <span className="ci-unit">%</span>
      </div>
      {error && <span className="ci-error" role="alert">{error}</span>}
      {!error && hint && <span className="ci-hint">{hint}</span>}
    </div>
  );
}

// ============================================================================
// INPUT NOMBRE (Durée, Quotité, etc.)
// ============================================================================

export function InputNumber({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 999,
  disabled = false,
  hint,
  error,
  testId,
  onBlur,
  highlight = false,
}) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
    const num = Math.min(max, Math.max(min, parseInt(raw) || 0));
    onChange(num);
  };

  return (
    <div className="ci-field" data-testid={testId}>
      {label && <label className="ci-label">{label}</label>}
      <div className="ci-field-row">
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={String(value || 0)}
          onChange={handleChange}
          aria-invalid={!!error}
          className={`ci-input${error ? ' ci-input--error' : ''}${highlight ? ' ci-input--guide' : ''}`}
          onBlur={onBlur}
        />
        {unit && <span className="ci-unit">{unit}</span>}
      </div>
      {error && <span className="ci-error" role="alert">{error}</span>}
      {!error && hint && <span className="ci-hint">{hint}</span>}
    </div>
  );
}

// ============================================================================
// INPUT MOIS (type="month" pour dates YYYY-MM)
// ============================================================================

export function InputMonth({
  label,
  value,
  onChange,
  disabled = false,
  hint,
  error,
  testId,
}) {
  return (
    <div className="ci-field" data-testid={testId}>
      {label && <label className="ci-label">{label}</label>}
      <input
        type="month"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`ci-input ci-input--left${error ? ' ci-input--error' : ''}`}
      />
      {error && <span className="ci-error" role="alert">{error}</span>}
      {!error && hint && <span className="ci-hint">{hint}</span>}
    </div>
  );
}

// ============================================================================
// SELECT
// ============================================================================

export function Select({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  hint,
  error,
  testId,
}) {
  return (
    <div className="ci-field" data-testid={testId}>
      {label && <label className="ci-label">{label}</label>}
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`ci-select${error ? ' ci-select--error' : ''}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="ci-error" role="alert">{error}</span>}
      {!error && hint && <span className="ci-hint">{hint}</span>}
    </div>
  );
}

// ============================================================================
// TOGGLE (Switch binaire)
// ============================================================================

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  testId,
}) {
  return (
    <div className="ci-toggle" data-testid={testId}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`ci-toggle__switch${checked ? ' is-active' : ''}`}
        aria-checked={checked}
        role="switch"
      >
        <span className="ci-toggle__knob" />
      </button>
      {label && <span className="ci-toggle__label">{label}</span>}
    </div>
  );
}
