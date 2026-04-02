/**
 * CreditInputs.tsx - Composants de saisie réutilisables pour le simulateur de crédit
 */

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { SimFieldShell } from '@/components/ui/sim';
import { parseCapital, parseTaux, formatTauxInput } from '../utils/creditFormatters';
import type {
  InputEuroProps,
  InputMonthProps,
  InputNumberProps,
  InputPctProps,
  SelectProps,
  ToggleProps,
} from '../types';
import './CreditInputs.css';

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
}: InputEuroProps) {
  const fmt = (num: number) => (Math.round(Number(num) || 0)).toLocaleString('fr-FR');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(parseCapital(event.target.value));
  };

  return (
    <SimFieldShell label={label} hint={hint} error={error} className="ci-field" rowClassName="ci-field-row">
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={fmt(value)}
        onChange={handleChange}
        data-testid={dataTestId || testId}
        aria-invalid={!!error}
        className={`ci-input sim-field__control${error ? ' ci-input--error sim-field__control--error' : ''}${highlight ? ' ci-input--guide sim-field__control--guide' : ''}`}
        onBlur={onBlur}
      />
      <span className="ci-unit sim-field__unit">€</span>
    </SimFieldShell>
  );
}

export function InputPct({
  label,
  rawValue,
  onBlur,
  disabled = false,
  hint,
  error,
  testId,
  placeholder = '0,00',
  highlight = false,
}: InputPctProps) {
  const [local, setLocal] = useState(rawValue || '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(rawValue || '');
  }, [rawValue, focused]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocal(formatTauxInput(event.target.value));
  };

  const handleBlur = () => {
    setFocused(false);
    const num = parseTaux(local);
    setLocal(num.toFixed(2).replace('.', ','));
    onBlur?.(num);
  };

  return (
    <SimFieldShell label={label} hint={hint} error={error} testId={testId} className="ci-field" rowClassName="ci-field-row">
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
        className={`ci-input sim-field__control${error ? ' ci-input--error sim-field__control--error' : ''}${highlight ? ' ci-input--guide sim-field__control--guide' : ''}`}
      />
      <span className="ci-unit sim-field__unit">%</span>
    </SimFieldShell>
  );
}

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
}: InputNumberProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, '').slice(0, 3);
    const num = Math.min(max, Math.max(min, parseInt(raw, 10) || 0));
    onChange(num);
  };

  return (
    <SimFieldShell label={label} hint={hint} error={error} testId={testId} className="ci-field" rowClassName="ci-field-row">
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={String(value || 0)}
        onChange={handleChange}
        aria-invalid={!!error}
        className={`ci-input sim-field__control${error ? ' ci-input--error sim-field__control--error' : ''}${highlight ? ' ci-input--guide sim-field__control--guide' : ''}`}
        onBlur={onBlur}
      />
      {unit && <span className="ci-unit sim-field__unit">{unit}</span>}
    </SimFieldShell>
  );
}

export function InputMonth({
  label,
  value,
  onChange,
  disabled = false,
  hint,
  error,
  testId,
}: InputMonthProps) {
  return (
    <SimFieldShell label={label} hint={hint} error={error} testId={testId} className="ci-field">
      <input
        type="month"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        className={`ci-input ci-input--left sim-field__control sim-field__control--left${error ? ' ci-input--error sim-field__control--error' : ''}`}
      />
    </SimFieldShell>
  );
}

export function Select<TValue extends string | number>({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  hint,
  error,
  testId,
}: SelectProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const index = options.findIndex((option) => option.value === value);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (index < options.length - 1) onChange(options[index + 1].value);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index > 0) onChange(options[index - 1].value);
    }
  };

  return (
    <SimFieldShell label={label} hint={hint} error={error} testId={testId} className="ci-field">
      <div ref={containerRef} className={`ci-select-wrapper sim-select-wrapper${isOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          className={`ci-select-trigger sim-field__select-trigger${error ? ' ci-select-trigger--error sim-field__control--error' : ''}`}
        >
          <span className="ci-select-trigger__value sim-field__select-value">
            {selectedOption?.label ?? ''}
          </span>
          <svg
            className="ci-select-trigger__arrow sim-field__select-arrow"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            aria-hidden="true"
          >
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {isOpen && (
          <ul role="listbox" className="ci-select-dropdown sim-field__dropdown">
            {options.map((option) => (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={option.value === value}
                className={`ci-select-option sim-field__option${option.value === value ? ' is-selected' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SimFieldShell>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  testId,
}: ToggleProps) {
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
