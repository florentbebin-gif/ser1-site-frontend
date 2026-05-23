import type { ReactNode } from 'react';
import { SimFieldShell } from '@/components/ui/sim';
import { numberValue } from '../formatters';

export function NumberInput({
  value,
  onChange,
  suffix,
  min,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <>
      <input
        type="number"
        min={min ?? 0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(numberValue(event.target.value))}
        className="sim-field__control"
      />
      {suffix ? <span className="sim-field__unit">{suffix}</span> : null}
    </>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="premium-card prevoyance-card">
      <div className="prevoyance-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="prevoyance-card__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export { SimFieldShell };
