import React, { useState, useCallback, useEffect } from 'react';
import { formatIntegerInput } from '@/utils/formatNumber';

const fmtThousands = formatIntegerInput;

const parseClean = (raw: string): number => {
  const cleaned = raw.replace(/[^\d-]/g, '');
  return cleaned === '' || cleaned === '-' ? 0 : Number(cleaned);
};

interface ScNumericInputProps {
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ScNumericInput({
  value,
  onChange,
  min,
  max,
  placeholder = '0',
  className,
  disabled = false,
}: ScNumericInputProps) {
  const numericValue = typeof value === 'string' ? Number(value) || 0 : value;
  const [display, setDisplay] = useState(() => fmtThousands(numericValue));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(fmtThousands(numericValue));
    }
  }, [numericValue, focused]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);
    const parsed = parseClean(raw);
    const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, parsed));
    onChange(clamped);
  }, [onChange, min, max]);

  const handleFocus = useCallback(() => {
    setFocused(true);
    setDisplay(numericValue ? String(numericValue) : '');
  }, [numericValue]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    setDisplay(fmtThousands(numericValue));
  }, [numericValue]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}
