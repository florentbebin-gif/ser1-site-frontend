import type { ReactNode } from 'react';

interface SimFieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  rowClassName?: string;
  testId?: string;
  controlId?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimFieldShell({
  label,
  hint,
  error,
  children,
  className,
  labelClassName,
  rowClassName,
  testId,
  controlId,
}: SimFieldShellProps) {
  return (
    <div className={joinClasses('sim-field', className)} data-testid={testId}>
      {label ? (
        <label htmlFor={controlId} className={joinClasses('sim-field__label', labelClassName)}>
          {label}
        </label>
      ) : null}

      <div className={joinClasses('sim-field__row', rowClassName)}>
        {children}
      </div>

      {error ? (
        <span className="sim-field__error" role="alert">{error}</span>
      ) : null}
      {!error && hint ? <span className="sim-field__hint">{hint}</span> : null}
    </div>
  );
}
