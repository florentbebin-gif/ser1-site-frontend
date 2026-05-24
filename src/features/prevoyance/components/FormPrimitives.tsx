import type { ReactNode } from 'react';
import { SimFieldShell } from '@/components/ui/sim';
import { formatIntegerInput } from '@/utils/numbers';
import { numberValue } from '../formatters';

export type SectionIconName =
  | 'situation'
  | 'contracts'
  | 'arret'
  | 'invalidite'
  | 'deces'
  | 'frais';

function SectionIcon({ name }: { name: SectionIconName }) {
  if (name === 'contracts') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 7h10M7 12h10M7 17h6"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        />
      </svg>
    );
  }
  if (name === 'arret') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 12a9 9 0 1 1-4.2-7.6"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === 'invalidite') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 19v-6M12 19V5M18 19v-9"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M4 19h16"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === 'deces') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4v16M7 9h10"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M6 20h12M8 4h8"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === 'frais') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16v12H4z" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path
          d="M8 7V5h8v2M8 12h8"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  const isEuro = suffix?.includes('€') ?? false;
  return (
    <>
      <input
        type={isEuro ? 'text' : 'number'}
        inputMode={isEuro ? 'numeric' : undefined}
        min={min ?? 0}
        value={isEuro ? formatIntegerInput(value) : Number.isFinite(value) ? value : 0}
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
  icon = 'situation',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  icon?: SectionIconName;
}) {
  return (
    <section className="premium-card premium-card--guide sim-card--guide prevoyance-card">
      <div className="sim-card__header sim-card__header--bleed prevoyance-card__header">
        <div className="sim-card__icon prevoyance-card__icon">
          <SectionIcon name={icon} />
        </div>
        <div className="prevoyance-card__title">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="prevoyance-card__actions">{actions}</div> : null}
      </div>
      <div className="sim-divider" />
      {children}
    </section>
  );
}

export { SectionIcon, SimFieldShell };
