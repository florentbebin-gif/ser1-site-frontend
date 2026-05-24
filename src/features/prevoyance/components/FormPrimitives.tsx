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

function SectionIcon({ name, size = 14 }: { name: SectionIconName; size?: number }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'contracts') {
    return (
      <svg {...commonProps}>
        <path d="M8 7h8M8 12h8M8 17h5" />
        <rect x="5" y="3" width="14" height="18" rx="2" />
      </svg>
    );
  }
  if (name === 'arret') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (name === 'invalidite') {
    return (
      <svg {...commonProps}>
        <path d="M5 19V5M5 19h14" />
        <path d="M9 16v-4M13 16V8M17 16v-7" />
      </svg>
    );
  }
  if (name === 'deces') {
    return (
      <svg {...commonProps}>
        <path d="M12 3 19 6v5c0 5-3.4 8-7 10-3.6-2-7-5-7-10V6l7-3Z" />
        <path d="M12 8v7M9.5 10.5h5" />
      </svg>
    );
  }
  if (name === 'frais') {
    return (
      <svg {...commonProps}>
        <path d="M4 8h16v11H4Z" />
        <path d="M9 8V5h6v3M4 12h16" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function NumberInput({
  value,
  onChange,
  suffix,
  min,
  ariaLabel,
  showZero = false,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  ariaLabel?: string;
  showZero?: boolean;
}) {
  const isEuro = suffix?.includes('€') ?? false;
  const hasValue = Number.isFinite(value) && (value > 0 || showZero);
  return (
    <>
      <input
        type={isEuro ? 'text' : 'number'}
        inputMode={isEuro ? 'numeric' : undefined}
        min={min ?? 0}
        value={hasValue ? (isEuro ? formatIntegerInput(value) : value) : ''}
        onChange={(event) => onChange(numberValue(event.target.value))}
        className="sim-field__control"
        aria-label={ariaLabel}
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
        <div className="prevoyance-card__title-row">
          <h2 className="sim-card__title sim-card__title-row">
            <span className="sim-card__icon sim-card__icon--lg">
              <SectionIcon name={icon} />
            </span>
            <span>{title}</span>
          </h2>
          {actions ? <div className="prevoyance-card__actions">{actions}</div> : null}
        </div>
        {subtitle ? <p className="sim-card__subtitle">{subtitle}</p> : null}
      </div>
      <div className="sim-divider" />
      {children}
    </section>
  );
}

export { SectionIcon, SimFieldShell };
