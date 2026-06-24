import type { ReactElement, ReactNode } from 'react';

import { SimAmountInputPercent } from '@/components/ui/sim';
import { IconLock } from '@/icons/ui';

export function PercentField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
}): ReactElement {
  return (
    <SimAmountInputPercent
      label={label}
      value={value ?? 0}
      min={min}
      max={max}
      maximumFractionDigits={2}
      onChange={onChange}
      onEmpty={() => onChange(undefined)}
    />
  );
}

/** Pastille booléenne partagée (même vocabulaire que les tags de la carte Filiation). */
export function TagToggle({
  label,
  checked,
  onChange,
  tone = 'fiscal',
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tone?: 'fiscal' | 'impact';
}): ReactElement {
  return (
    <button
      type="button"
      className="audit-tag-toggle"
      aria-pressed={checked}
      data-selected={checked ? 'true' : undefined}
      data-tone={tone}
      onClick={() => onChange(!checked)}
    >
      <span aria-hidden="true" />
      {label}
    </button>
  );
}

/** Rangée de pastilles (wrap, pas de scroll horizontal). */
export function TagRow({ children }: { children: ReactNode }): ReactElement {
  return <div className="audit-tag-row">{children}</div>;
}

/** Bande fine « module verrouillé / à venir » — alternative calme à un gros panneau. */
export function LockedRow({
  icon,
  title,
  detail,
}: {
  icon: ReactElement;
  title: string;
  detail: string;
}): ReactElement {
  return (
    <div className="audit-locked-row" aria-disabled="true">
      <span className="audit-locked-row__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="audit-locked-row__copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <IconLock className="audit-locked-row__lock" />
    </div>
  );
}

export function ChipMultiSelect<T extends string>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  values: T[];
  onChange: (values: T[]) => void;
}): ReactElement {
  return (
    <div className="audit-chip-field" role="group" aria-label={label}>
      <span className="audit-chip-field__label">{label}</span>
      <div className="audit-chip-field__choices">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              type="button"
              key={option.value}
              className="audit-chip-field__choice"
              data-selected={selected ? 'true' : undefined}
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  selected
                    ? values.filter((value) => value !== option.value)
                    : [...values, option.value],
                )
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
