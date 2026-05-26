import type { ReactNode } from 'react';
import { SimFieldShell } from '@/components/ui/sim';
import {
  IconBarChart,
  IconBriefcase,
  IconClock,
  IconFileText,
  IconShield,
  IconUsers,
} from '@/icons/ui';
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
  if (name === 'contracts') return <IconFileText />;
  if (name === 'arret') return <IconClock />;
  if (name === 'invalidite') return <IconBarChart />;
  if (name === 'deces') return <IconShield />;
  if (name === 'frais') return <IconBriefcase />;
  return <IconUsers />;
}

export function NumberInput({
  value,
  onChange,
  suffix,
  min,
  ariaLabel,
  showZero = false,
  disabled = false,
  title,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  ariaLabel?: string;
  showZero?: boolean;
  disabled?: boolean;
  title?: string;
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
        disabled={disabled}
        title={title}
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
      <div className="sim-divider sim-divider--soft prevoyance-card__divider" />
      {children}
    </section>
  );
}

export function SideCard({
  title,
  icon,
  children,
  actions,
  compact = false,
}: {
  title: string;
  icon: SectionIconName;
  children: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact
          ? 'premium-card premium-card--guide sim-card--guide prevoyance-side-card prevoyance-side-card--compact'
          : 'premium-card premium-card--guide sim-card--guide prevoyance-side-card'
      }
    >
      <div className="sim-card__header sim-card__header--bleed prevoyance-side-card__header">
        <div className="prevoyance-side-card__title-row">
          <h2 className="sim-card__title sim-card__title-row">
            <span className="sim-card__icon sim-card__icon--sm">
              <SectionIcon name={icon} />
            </span>
            <span>{title}</span>
          </h2>
          {actions ? <div className="prevoyance-side-card__actions">{actions}</div> : null}
        </div>
      </div>
      <div className="sim-divider sim-divider--tight" />
      {children}
    </section>
  );
}

export { SectionIcon, SimFieldShell };
