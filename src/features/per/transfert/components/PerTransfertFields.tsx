import { SimFieldShell, SimSelect } from '@/components/ui/sim';
import type { SimSelectOption } from '@/components/ui/sim';

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
        align="left"
      />
    </SimFieldShell>
  );
}
