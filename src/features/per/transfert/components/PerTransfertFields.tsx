import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SimFieldShell, SimSelect } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';
import { PerAmountInput } from '@/features/per/components/potentiel/PerAmountInput';

interface NumberFieldProps {
  label: ReactNode;
  ariaLabel?: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
}

interface MoneyFieldProps {
  label: ReactNode;
  ariaLabel?: string;
  value: number;
  onChange: (_value: number) => void;
  hint?: string;
  min?: number;
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

function ariaText(label: ReactNode, ariaLabel?: string): string {
  return ariaLabel ?? (typeof label === 'string' ? label : 'Champ PER transfert');
}

export function PerTransfertMoneyField({ label, ariaLabel, value, onChange, hint, min = 0 }: MoneyFieldProps) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <PerAmountInput
        value={value}
        onChange={onChange}
        ariaLabel={ariaText(label, ariaLabel)}
        min={min}
      />
      <span className="per-transfert-field-suffix">€</span>
    </SimFieldShell>
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
        aria-label={ariaText(label, ariaLabel)}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => commit()}
      />
      <span className="per-transfert-field-suffix">{suffix}</span>
    </SimFieldShell>
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
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={Number.isFinite(value) ? value : 0}
        aria-label={ariaText(label, ariaLabel)}
        onChange={(event) => onChange(Math.round(Number(event.target.value) || 0))}
      />
      {suffix ? <span className="per-transfert-field-suffix">{suffix}</span> : null}
    </SimFieldShell>
  );
}

export function PerTransfertNumberField({
  label,
  ariaLabel,
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
        aria-label={ariaText(label, ariaLabel)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {suffix ? <span className="per-transfert-field-suffix">{suffix}</span> : null}
    </SimFieldShell>
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
