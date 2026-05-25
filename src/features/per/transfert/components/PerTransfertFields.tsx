import type { ReactNode } from 'react';
import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
  SimFieldShell,
  SimSelect,
} from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';

interface MoneyFieldProps {
  label: ReactNode;
  ariaLabel?: string;
  value: number;
  onChange: (_value: number) => void;
  hint?: string;
  min?: number;
}

interface DecimalMoneyFieldProps extends MoneyFieldProps {
  decimals?: number;
}

interface RateFieldProps {
  label: ReactNode;
  ariaLabel?: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
}

interface IntegerFieldProps {
  label: ReactNode;
  ariaLabel?: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
}

interface TextFieldProps {
  label: ReactNode;
  ariaLabel?: string;
  value: string;
  onChange: (_value: string) => void;
  hint?: string;
}

interface SelectFieldProps {
  label: ReactNode;
  value: string;
  options: SimSelectOption[];
  onChange: (_value: string) => void;
  placeholder?: string;
  hint?: string;
  clearable?: boolean;
}

function ariaText(label: ReactNode, ariaLabel?: string): string {
  return ariaLabel ?? (typeof label === 'string' ? label : 'Champ PER transfert');
}

export function PerTransfertMoneyField({
  label,
  ariaLabel,
  value,
  onChange,
  hint,
  min = 0,
}: MoneyFieldProps) {
  return (
    <SimAmountInputEuro
      label={label}
      hint={hint}
      value={value}
      onChange={onChange}
      ariaLabel={ariaText(label, ariaLabel)}
      min={min}
      unitClassName="per-transfert-field-suffix"
    />
  );
}

export function PerTransfertDecimalMoneyField({
  label,
  ariaLabel,
  value,
  onChange,
  hint,
  min = 0,
  decimals = 4,
}: DecimalMoneyFieldProps) {
  return (
    <SimAmountInputNumeric
      label={label}
      hint={hint}
      value={value}
      onChange={onChange}
      ariaLabel={ariaText(label, ariaLabel)}
      min={min}
      unit="€"
      unitClassName="per-transfert-field-suffix"
      minimumFractionDigits={decimals}
      maximumFractionDigits={decimals}
    />
  );
}

export function PerTransfertRateField({
  label,
  ariaLabel,
  value,
  onChange,
  min,
  max,
  suffix = '%',
  hint,
}: RateFieldProps) {
  return (
    <SimAmountInputPercent
      label={label}
      hint={hint}
      value={value}
      onChange={onChange}
      ariaLabel={ariaText(label, ariaLabel)}
      min={min}
      max={max}
      unit={suffix}
      unitClassName="per-transfert-field-suffix"
      minimumFractionDigits={2}
      maximumFractionDigits={2}
    />
  );
}

export function PerTransfertIntegerField({
  label,
  ariaLabel,
  value,
  onChange,
  min,
  max,
  suffix,
  hint,
}: IntegerFieldProps) {
  return (
    <SimAmountInputNumeric
      label={label}
      hint={hint}
      value={value}
      ariaLabel={ariaText(label, ariaLabel)}
      min={min}
      max={max}
      unit={suffix}
      unitClassName="per-transfert-field-suffix"
      onChange={(nextValue) => onChange(Math.round(nextValue))}
    />
  );
}

export function PerTransfertTextField({ label, ariaLabel, value, onChange, hint }: TextFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="text"
        value={value}
        aria-label={ariaText(label, ariaLabel)}
        onChange={(event) => onChange(event.target.value)}
      />
    </SimFieldShell>
  );
}

export function PerTransfertSelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  hint,
  clearable = false,
}: SelectFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <SimSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        align="right"
        clearable={clearable}
      />
    </SimFieldShell>
  );
}
