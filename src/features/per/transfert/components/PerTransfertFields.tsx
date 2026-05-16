import { useEffect, useState } from 'react';
import { SimFieldShell, SimSelect } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';
import { PerAmountInput } from '@/features/per/components/potentiel/PerAmountInput';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
}

interface MoneyFieldProps {
  label: string;
  value: number;
  onChange: (_value: number) => void;
  hint?: string;
  min?: number;
}

interface RateFieldProps {
  label: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
}

interface IntegerFieldProps {
  label: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (_value: string) => void;
  hint?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SimSelectOption[];
  onChange: (_value: string) => void;
  placeholder?: string;
  hint?: string;
}

function parseFrenchNumber(value: string): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRateFr(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';
}

function clamp(value: number, min?: number, max?: number): number {
  const floor = min ?? Number.NEGATIVE_INFINITY;
  const ceiling = max ?? Number.POSITIVE_INFINITY;
  return Math.min(ceiling, Math.max(floor, value));
}

export function PerTransfertMoneyField({ label, value, onChange, hint, min = 0 }: MoneyFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <PerAmountInput
        value={value}
        onChange={onChange}
        ariaLabel={label}
        min={min}
      />
      <span className="per-transfert-field-suffix">€</span>
    </SimFieldShell>
  );
}

export function PerTransfertRateField({
  label,
  value,
  onChange,
  min,
  max,
  suffix = '%',
  hint,
}: RateFieldProps) {
  const [text, setText] = useState(formatRateFr(value));

  useEffect(() => {
    setText(formatRateFr(value));
  }, [value]);

  function commit(nextText = text) {
    const nextValue = clamp(parseFrenchNumber(nextText), min, max);
    setText(formatRateFr(nextValue));
    onChange(nextValue);
  }

  return (
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="text"
        inputMode="decimal"
        value={text}
        aria-label={label}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => commit()}
      />
      <span className="per-transfert-field-suffix">{suffix}</span>
    </SimFieldShell>
  );
}

export function PerTransfertIntegerField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  hint,
}: IntegerFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={Number.isFinite(value) ? value : 0}
        aria-label={label}
        onChange={(event) => onChange(Math.round(Number(event.target.value) || 0))}
      />
      {suffix ? <span className="per-transfert-field-suffix">{suffix}</span> : null}
    </SimFieldShell>
  );
}

export function PerTransfertNumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  hint,
}: NumberFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {suffix ? <span className="per-transfert-field-suffix">{suffix}</span> : null}
    </SimFieldShell>
  );
}

export function PerTransfertTextField({ label, value, onChange, hint }: TextFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="text"
        value={value}
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
}: SelectFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <SimSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        align="right"
      />
    </SimFieldShell>
  );
}
