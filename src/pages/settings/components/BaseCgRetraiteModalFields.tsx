import { useId, type ReactNode } from 'react';
import { SimFieldShell, SimSelect, type SimSelectOption } from '@/components/ui/sim';

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface BaseCgTextFieldProps {
  label: ReactNode;
  value: string;
  onChange: (_value: string) => void;
  className?: string;
  hint?: ReactNode;
  inputMode?: 'decimal' | 'numeric' | 'text';
  placeholder?: string;
}

export function BaseCgTextField({
  label,
  value,
  onChange,
  className,
  hint,
  inputMode,
  placeholder,
}: BaseCgTextFieldProps) {
  const controlId = useId();

  return (
    <SimFieldShell
      label={label}
      hint={hint}
      controlId={controlId}
      className={joinClasses('base-cg-modal-field', className)}
    >
      <input
        id={controlId}
        className="sim-field__control sim-field__control--left base-cg-modal__control"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </SimFieldShell>
  );
}

interface BaseCgTextareaFieldProps {
  label: ReactNode;
  value: string;
  onChange: (_value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export function BaseCgTextareaField({
  label,
  value,
  onChange,
  className,
  disabled,
  placeholder,
  required,
  rows = 3,
}: BaseCgTextareaFieldProps) {
  const controlId = useId();

  return (
    <SimFieldShell
      label={label}
      controlId={controlId}
      className={joinClasses('base-cg-modal-field', className)}
    >
      <textarea
        id={controlId}
        className="sim-field__control sim-field__control--left base-cg-modal__textarea"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
    </SimFieldShell>
  );
}

interface BaseCgSelectFieldProps {
  label: ReactNode;
  value: string;
  onChange: (_value: string) => void;
  options: SimSelectOption[];
  className?: string;
}

export function BaseCgSelectField({
  label,
  value,
  onChange,
  options,
  className,
}: BaseCgSelectFieldProps) {
  const controlId = useId();

  return (
    <SimFieldShell
      label={label}
      controlId={controlId}
      className={joinClasses('base-cg-modal-field', className)}
    >
      <SimSelect id={controlId} value={value} onChange={onChange} options={options} align="left" />
    </SimFieldShell>
  );
}
