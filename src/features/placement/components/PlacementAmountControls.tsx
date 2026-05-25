import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
} from '@/components/ui/sim';

const inputClasses = {
  fieldClassName: 'pl-field',
  rowClassName: 'pl-input',
  className: 'pl-input__field',
  unitClassName: 'pl-input__unit',
};

type AmountProps = {
  label?: string;
  disabled?: boolean;
  value: number | null | undefined;
  onChange: (_value: number) => void;
};

export const PlacementEuroField = ({ value, ...props }: AmountProps) => (
  <SimAmountInputEuro {...inputClasses} {...props} value={value ?? 0} />
);

export const PlacementPercentField = ({ value, onChange, ...props }: AmountProps) => (
  <SimAmountInputPercent
    {...inputClasses}
    {...props}
    value={(value ?? 0) * 100}
    min={0}
    max={100}
    onChange={(nextValue) => onChange(nextValue / 100)}
  />
);

type NumberProps = {
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  inline?: boolean;
  value: number | null | string;
  onChange: (_value: number | null) => void;
};

export const PlacementNumberField = ({
  value,
  onChange,
  inline = false,
  ...props
}: NumberProps) => (
  <SimAmountInputNumeric
    {...inputClasses}
    {...props}
    fieldClassName={inline ? undefined : inputClasses.fieldClassName}
    className={`${inputClasses.className}${inline ? ' pl-input__field--inline' : ''}`}
    value={value === null || value === '' ? 0 : Number(value)}
    onEmpty={() => onChange(null)}
    onChange={(nextValue) => onChange(Math.round(nextValue))}
  />
);
