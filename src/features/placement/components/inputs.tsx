/**
 * Placement Input Components - Composants de saisie reutilisables
 */

import React, { useEffect, useState } from 'react';
import { SimFieldShell, SimSelect } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';
import { fmt } from '../utils/formatters';

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
    <SimFieldShell label={label} className="pl-field" rowClassName="pl-input">
      <input
        type="text"
        className="pl-input__field sim-field__control"
        value={fmt(value)}
        onChange={(event) => {
          const clean = event.target.value.replace(/\D/g, '').slice(0, 9);
          onChange(clean === '' ? 0 : Number(clean));
        }}
        disabled={disabled}
      />
      <span className="pl-input__unit sim-field__unit">€</span>
    </SimFieldShell>
  );
}

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

  return (
    <SimFieldShell label={label} className="pl-field" rowClassName="pl-input">
      <input
        type="text"
        inputMode="decimal"
        className="pl-input__field sim-field__control"
        value={local}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
      />
      <span className="pl-input__unit sim-field__unit">%</span>
    </SimFieldShell>
  );
}

interface InputNumberProps {
  value: number | null | string;
  onChange: (_value: number | null) => void;
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
  const [localValue, setLocalValue] = useState(value === null ? '' : String(value));

  useEffect(() => {
    setLocalValue(value === null ? '' : String(value));
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (/^\d*$/.test(raw)) {
      setLocalValue(raw);
    }
  };

  const handleBlur = () => {
    if (localValue === '') {
      onChange(null);
      return;
    }
    const num = Number(localValue);
    const clamped = Math.min(max, Math.max(min, num));
    setLocalValue(String(clamped));
    onChange(clamped);
  };

  const inputEl = (
    <input
      type="text"
      inputMode="numeric"
      className={`pl-input__field sim-field__control${inline ? ' pl-input__field--inline' : ''}`}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );

  if (inline) {
    return (
      <div className="pl-input sim-field__row">
        {inputEl}
        {unit && <span className="pl-input__unit sim-field__unit">{unit}</span>}
      </div>
    );
  }

  return (
    <SimFieldShell label={label} className="pl-field" rowClassName="pl-input">
      {inputEl}
      {unit && <span className="pl-input__unit sim-field__unit">{unit}</span>}
    </SimFieldShell>
  );
}

export type PlacementSelectOption = SimSelectOption;

interface SelectProps {
  value: string;
  onChange: (_value: string) => void;
  options: PlacementSelectOption[];
  label?: string;
}

export function Select({ value, onChange, options, label }: SelectProps) {
  return (
    <SimFieldShell label={label} className="pl-field">
      <SimSelect value={value} onChange={onChange} options={options} />
    </SimFieldShell>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
}

export function Toggle({ checked, onChange, label, ariaLabel }: ToggleProps) {
  return (
    <div className="pl-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || 'Activer l’option'}
        className={`pl-toggle__switch${checked ? ' is-active' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="pl-toggle__knob" />
      </button>
      {label ? <span className="pl-toggle__label">{label}</span> : null}
    </div>
  );
}
