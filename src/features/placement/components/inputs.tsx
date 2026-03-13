/**
 * Placement Input Components — Composants de saisie réutilisables
 */

import React, { useEffect, useState } from 'react';
import { fmt } from '../utils/formatters';

// ─── Helpers ─────────────────────────────────────────────────────────

function formatPctInput(value: number | null | undefined): string {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '';
  return numeric.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function parsePctInput(input: string): { numeric: number | null } {
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

interface BaseInputProps {
  label?: string;
  disabled?: boolean;
}

interface InputEuroProps extends BaseInputProps {
  value: number | null | undefined;
  onChange: (_value: number) => void;
}

export function InputEuro({ value, onChange, label, disabled }: InputEuroProps) {
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

interface InputPctProps extends BaseInputProps {
  value: number | null | undefined;
  onChange: (_value: number) => void;
}

export function InputPct({ value, onChange, label, disabled }: InputPctProps) {
  const [local, setLocal] = useState(() => formatPctInput((value ?? 0) * 100));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocal(formatPctInput((value ?? 0) * 100));
    }
  }, [value, isFocused]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // IMPORTANT: ne pas pousser dans le state parent pendant la frappe.
    // Sinon, une re-normalisation / re-render peut écraser la saisie.
    setLocal(event.target.value);
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

interface InputNumberProps {
  value: number | string;
  onChange: (_value: number) => void;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  inline?: boolean;
}

export function InputNumber({
  value,
  onChange,
  label,
  unit,
  min = 0,
  max = 999,
  inline = false,
}: InputNumberProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
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

export interface PlacementSelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (_value: string) => void;
  options: PlacementSelectOption[];
  label?: string;
}

export function Select({ value, onChange, options, label }: SelectProps) {
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

interface ToggleProps {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="pl-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="pl-toggle__label">{label}</span>
    </label>
  );
}

