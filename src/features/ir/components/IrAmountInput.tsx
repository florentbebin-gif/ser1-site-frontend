import type { ChangeEvent, ChangeEventHandler, CSSProperties } from 'react';
import { SimFieldShell } from '@/components/ui/sim';

const ZERO_PLACEHOLDER = '0';

export function parseIntegerInput(event: ChangeEvent<HTMLInputElement>): number {
  const raw = event.target.value.replace(/[^\d]/g, '');
  return raw === '' ? 0 : Number(raw);
}

interface IrAmountInputProps {
  value: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  readOnly?: boolean;
  testId?: string;
  style?: CSSProperties;
  className?: string;
}

export function IrAmountInput({
  value,
  onChange,
  placeholder = ZERO_PLACEHOLDER,
  readOnly = false,
  testId,
  style,
  className,
}: IrAmountInputProps) {
  return (
    <SimFieldShell
      className={`ir-table-input${className ? ` ${className}` : ''}`}
      rowClassName="ir-table-input__row"
    >
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        data-testid={testId}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        style={style}
        className="sim-field__control"
      />
      <span className="ir-table-input__unit sim-field__unit" aria-hidden="true">€</span>
    </SimFieldShell>
  );
}
