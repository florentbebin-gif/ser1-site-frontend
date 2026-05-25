import type { ReactNode } from 'react';

export interface SimMetricProps {
  variant: 'hero' | 'secondary' | 'inline';
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  note?: ReactNode;
  delta?: ReactNode;
  className?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimMetric({ variant, label, value, unit, note, delta, className }: SimMetricProps) {
  return (
    <div className={cx('sim-metric', `sim-metric--${variant}`, className)}>
      <span className="sim-metric__label">{label}</span>
      <div className="sim-metric__value-row">
        <strong className="sim-metric__value">{value}</strong>
        {unit ? <span className="sim-metric__unit">{unit}</span> : null}
      </div>
      {note ? <span className="sim-metric__note">{note}</span> : null}
      {delta ? <span className="sim-metric__delta">{delta}</span> : null}
    </div>
  );
}
