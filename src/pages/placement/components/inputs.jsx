/**
 * Placement Input Components — Composants de saisie réutilisables
 */

import React, { useEffect, useState } from 'react';
import { fmt } from '../utils/formatters.js';

// ─── Helpers ─────────────────────────────────────────────────────────

function formatPctInput(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '';
  return numeric.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function parsePctInput(input) {
  const trimmed = input.trim();
  if (trimmed === '') return { numeric: null };
  const normalized = trimmed.replace(',', '.').replace(/[^\d.-]/g, '');
  if (normalized === '' || normalized === '-' || normalized === '.') {
    return { numeric: null };
  }
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return { numeric: null };
  return { numeric: num };
}

// ─── InputEuro ───────────────────────────────────────────────────────

export function InputEuro({ value, onChange, label, disabled }) {
  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <div className="pl-input">
        <input
          type="text"
          className="pl-input__field"
          value={fmt(value)}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
            onChange(clean === '' ? 0 : Number(clean));
          }}
          disabled={disabled}
        />
        <span className="pl-input__unit">€</span>
      </div>
    </div>
  );
}

// ─── InputPct ────────────────────────────────────────────────────────

export function InputPct({ value, onChange, label, disabled }) {
  const [local, setLocal] = useState(() => formatPctInput(value * 100));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocal(formatPctInput(value * 100));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    // IMPORTANT: ne pas pousser dans le state parent pendant la frappe.
    // Sinon, une re-normalisation / re-render peut écraser la saisie.
    setLocal(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);

    const parsed = parsePctInput(local);
    const numeric = parsed.numeric;
    const clamped = numeric === null ? 0 : Math.min(100, Math.max(0, numeric));
    onChange(clamped / 100);
    setLocal(formatPctInput(clamped));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <div className="pl-input">
        <input
          type="text"
          inputMode="decimal"
          className="pl-input__field"
          value={local}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <span className="pl-input__unit">%</span>
      </div>
    </div>
  );
}

// ─── InputNumber ─────────────────────────────────────────────────────

export function InputNumber({ value, onChange, label, unit, min = 0, max = 999, inline = false }) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    // Permettre la saisie libre de chiffres
    if (/^\d*$/.test(raw)) {
      setLocalValue(raw);
    }
  };

  const handleBlur = () => {
    const num = localValue === '' ? min : Number(localValue);
    const clamped = Math.min(max, Math.max(min, num));
    setLocalValue(String(clamped));
    onChange(clamped);
  };

  const inputEl = (
    <input
      type="text"
      inputMode="numeric"
      className="pl-input__field"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{ width: inline ? 70 : '100%' }}
    />
  );

  if (inline) {
    return (
      <div className="pl-input">
        {inputEl}
        {unit && <span className="pl-input__unit">{unit}</span>}
      </div>
    );
  }
  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <div className="pl-input">
        {inputEl}
        {unit && <span className="pl-input__unit">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────

export function Select({ value, onChange, options, label }) {
  return (
    <div className="pl-field">
      {label && <label>{label}</label>}
      <select className="pl-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="pl-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="pl-toggle__label">{label}</span>
    </label>
  );
}
