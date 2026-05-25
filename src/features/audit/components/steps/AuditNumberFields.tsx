import { SimAmountInputEuro, SimAmountInputNumeric } from '@/components/ui/sim';

interface AuditAmountFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  unit?: string;
}

const fieldClasses = {
  fieldClassName: 'audit-form-row',
  className: 'audit-number-field',
  unitClassName: 'audit-number-unit',
};

export function AuditEuroField({ id, label, value, onChange }: AuditAmountFieldProps) {
  return (
    <SimAmountInputEuro {...fieldClasses} id={id} label={label} value={value} onChange={onChange} />
  );
}

export function AuditNumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  integer = false,
  unit,
}: AuditAmountFieldProps) {
  return (
    <SimAmountInputNumeric
      {...fieldClasses}
      id={id}
      label={label}
      value={value}
      min={min}
      max={max}
      unit={unit}
      onChange={(nextValue) => onChange(integer ? Math.round(nextValue) : nextValue)}
    />
  );
}
