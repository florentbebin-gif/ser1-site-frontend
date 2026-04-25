import React, { useState, useCallback } from 'react';
import { formatIntegerInput } from '@/utils/formatNumber';

interface PerAmountInputProps {
  value: number;
  onChange: (_value: number) => void;
  ariaLabel?: string;
  label?: string;
  placeholder?: string;
  min?: number;
  className?: string;
  disabled?: boolean;
}


const parseInput = (raw: string): number => {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
};

export function PerAmountInput({
  value,
  onChange,
  ariaLabel,
  label,
  placeholder = '0',
  min = 0,
  className = '',
  disabled = false,
}: PerAmountInputProps) {
  const [raw, setRaw] = useState<string | null>(null);
  const isFocused = raw !== null;

  const handleFocus = useCallback(() => {
    setRaw(value === 0 ? '' : String(value));
  }, [value]);

  const handleBlur = useCallback(() => {
    if (raw !== null) {
      const parsed = parseInput(raw);
      const clamped = Math.max(min, parsed);
      onChange(clamped);
    }
    setRaw(null);
  }, [raw, min, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    const parsed = parseInput(v);
    onChange(Math.max(min, parsed));
  }, [min, onChange]);

  const displayValue = isFocused ? (raw ?? '') : formatIntegerInput(value);

  const input = (
    <input
      type="text"
      inputMode="numeric"
      className={`per-input sim-field__control ${className}`.trim()}
      value={displayValue}
      aria-label={ariaLabel}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  );

  if (!label) return input;

  return (
    <label className="per-field">
      <span>{label}</span>
      {input}
    </label>
  );
}
