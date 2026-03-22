import type { ChangeEvent, ChangeEventHandler, CSSProperties } from 'react';

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
    <div
      className={`ir-table-input${className ? ` ${className}` : ''}`}
      style={style}
    >
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        data-testid={testId}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />
      <span className="ir-table-input__unit" aria-hidden="true">€</span>
    </div>
  );
}
