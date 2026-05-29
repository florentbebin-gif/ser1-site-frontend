/**
 * CreditInputs.tsx - Composants de saisie réutilisables pour le simulateur de crédit
 */

import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
  SimFieldShell,
  SimSelect,
} from '@/components/ui/sim';
import { parseDecimalInput } from '@/utils/numbers';
import type { InputMonthProps, SelectProps, ToggleProps } from '../types';

function creditControlClass(error?: string, highlight = false): string {
  return `sim-field__control${error ? ' sim-field__control--error' : ''}${highlight ? ' sim-field__control--guide' : ''}`;
}

interface CreditEuroFieldProps {
  label?: string;
  value: number;
  onChange: (_value: number) => void;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
  dataTestId?: string;
  highlight?: boolean;
}

export function CreditEuroField({
  label,
  value,
  onChange,
  disabled = false,
  hint,
  error,
  testId,
  dataTestId,
  highlight = false,
}: CreditEuroFieldProps) {
  return (
    <SimAmountInputEuro
      label={label}
      hint={hint}
      error={error}
      fieldClassName="ci-field"
      rowClassName="ci-field-row"
      unitClassName="ci-unit"
      className={creditControlClass(error, highlight)}
      value={value}
      onChange={onChange}
      disabled={disabled}
      testId={dataTestId || testId}
    />
  );
}

interface CreditPercentFieldProps {
  label?: string;
  rawValue?: string;
  onChange?: (_value: number) => void;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
  placeholder?: string;
  highlight?: boolean;
}

export function CreditPercentField({
  label,
  rawValue,
  onChange,
  disabled = false,
  hint,
  error,
  testId,
  placeholder = '0,00',
  highlight = false,
}: CreditPercentFieldProps) {
  return (
    <SimAmountInputPercent
      label={label}
      hint={hint}
      error={error}
      fieldClassName="ci-field"
      rowClassName="ci-field-row"
      unitClassName="ci-unit"
      className={creditControlClass(error, highlight)}
      value={parseDecimalInput(rawValue, 0)}
      onChange={(nextValue) => onChange?.(nextValue)}
      disabled={disabled}
      placeholder={placeholder}
      testId={testId}
      minimumFractionDigits={2}
      maximumFractionDigits={2}
    />
  );
}

interface CreditNumberFieldProps {
  label?: string;
  value: number;
  onChange: (_value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
  highlight?: boolean;
}

export function CreditNumberField({
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
  highlight = false,
}: CreditNumberFieldProps) {
  return (
    <SimAmountInputNumeric
      label={label}
      hint={hint}
      error={error}
      fieldClassName="ci-field"
      rowClassName="ci-field-row"
      unitClassName="ci-unit"
      className={creditControlClass(error, highlight)}
      value={value || 0}
      onChange={(nextValue) => onChange(Math.round(nextValue))}
      unit={unit}
      min={min}
      max={max}
      disabled={disabled}
      testId={testId}
    />
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
        className={`sim-field__control sim-field__control--left${error ? ' sim-field__control--error' : ''}`}
      />
    </SimFieldShell>
  );
}

export function Select<TValue extends string>({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  hint,
  error,
  testId,
}: SelectProps<TValue>) {
  return (
    <SimFieldShell
      label={label}
      hint={hint}
      error={error}
      testId={testId}
      className="ci-field"
      rowClassName="ci-field-row"
    >
      <SimSelect
        value={value}
        onChange={(nextValue) => onChange(nextValue as TValue)}
        options={options}
        disabled={disabled}
        testId={testId}
        className={error ? 'cv-select cv-select--error' : 'cv-select'}
        ariaLabel={label}
      />
    </SimFieldShell>
  );
}

export function Toggle({ checked, onChange, label, disabled = false, testId }: ToggleProps) {
  return (
    <div className="ci-toggle" data-testid={testId}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`ci-toggle__switch${checked ? ' is-active' : ''}`}
        aria-checked={checked}
        aria-label={label ?? 'Activer/désactiver'}
        role="switch"
      >
        <span className="ci-toggle__knob" />
      </button>
      {label && <span className="ci-toggle__label">{label}</span>}
    </div>
  );
}
