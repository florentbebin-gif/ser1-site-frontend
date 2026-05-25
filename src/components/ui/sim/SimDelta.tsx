import type { ReactNode } from 'react';

export interface SimDeltaProps {
  value: number;
  unit?: ReactNode;
  precision?: number;
  formatValue?: (absoluteValue: number) => ReactNode;
  className?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatDefault(value: number, precision: number): string {
  return value.toLocaleString('fr-FR', {
    maximumFractionDigits: precision,
  });
}

export function SimDelta({ value, unit, precision = 2, formatValue, className }: SimDeltaProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const tone = safeValue > 0 ? 'positive' : safeValue < 0 ? 'negative' : 'neutral';
  const sign = safeValue > 0 ? '+' : safeValue < 0 ? '−' : '';
  const absoluteValue = Math.abs(safeValue);
  const formattedValue = formatValue
    ? formatValue(absoluteValue)
    : formatDefault(absoluteValue, precision);

  return (
    <span className={cx('sim-delta', `sim-delta--${tone}`, className)}>
      <span className="sim-delta__sign">{sign}</span>
      <span className="sim-delta__value">{formattedValue}</span>
      {unit ? <span className="sim-delta__unit">{unit}</span> : null}
    </span>
  );
}
