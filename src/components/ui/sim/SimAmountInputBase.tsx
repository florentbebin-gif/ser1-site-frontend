import { useId, useState, type ReactNode } from 'react';
import { SimFieldShell } from './SimFieldShell';

export type SimAmountInputEnterKeyHint =
  | 'enter'
  | 'done'
  | 'go'
  | 'next'
  | 'previous'
  | 'search'
  | 'send';

export interface SimAmountInputPublicProps {
  id?: string;
  value: number;
  onChange: (_value: number) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  min?: number;
  max?: number;
  readOnly?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  'aria-label'?: string;
  testId?: string;
  unit?: string;
  enterKeyHint?: SimAmountInputEnterKeyHint;
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;
  rowClassName?: string;
  unitClassName?: string;
}

interface SimAmountInputBaseProps extends SimAmountInputPublicProps {
  inputMode: 'numeric' | 'decimal';
  parseValue: (_raw: string) => number;
  formatValue: (_value: number) => string;
  formatFocusedValue?: (_value: number) => string;
  normalizeValue?: (_value: number) => number;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function clampNumber(value: number, min?: number, max?: number): number {
  const withMin = min === undefined ? value : Math.max(min, value);
  return max === undefined ? withMin : Math.min(max, withMin);
}

export function SimAmountInputBase({
  id,
  value,
  onChange,
  label,
  hint,
  error,
  placeholder = '0',
  min,
  max,
  readOnly = false,
  disabled = false,
  ariaLabel,
  'aria-label': ariaLabelAttribute,
  testId,
  unit,
  enterKeyHint = 'next',
  className,
  fieldClassName,
  labelClassName,
  rowClassName,
  unitClassName,
  inputMode,
  parseValue,
  formatValue,
  formatFocusedValue = formatValue,
  normalizeValue,
}: SimAmountInputBaseProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const [raw, setRaw] = useState<string | null>(null);
  const displayValue = raw === null ? formatValue(value) : raw;
  const resolvedAriaLabel = ariaLabelAttribute ?? ariaLabel;

  const commitRawValue = (nextRaw: string) => {
    const parsed = parseValue(nextRaw);
    const normalized = normalizeValue ? normalizeValue(parsed) : parsed;
    onChange(clampNumber(normalized, min, max));
  };

  return (
    <SimFieldShell
      label={label}
      hint={hint}
      error={error}
      controlId={controlId}
      className={fieldClassName}
      labelClassName={labelClassName}
      rowClassName={rowClassName}
    >
      <input
        id={controlId}
        type="text"
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        className={joinClasses('sim-field__control', className)}
        value={displayValue}
        aria-label={resolvedAriaLabel}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        data-testid={testId}
        onFocus={() => setRaw(formatFocusedValue(value))}
        onBlur={() => {
          if (raw !== null && !readOnly && !disabled) {
            commitRawValue(raw);
          }
          setRaw(null);
        }}
        onChange={(event) => {
          if (readOnly || disabled) return;
          const nextRaw = event.target.value;
          setRaw(nextRaw);
          commitRawValue(nextRaw);
        }}
      />
      {unit ? <span className={joinClasses('sim-field__unit', unitClassName)}>{unit}</span> : null}
    </SimFieldShell>
  );
}
