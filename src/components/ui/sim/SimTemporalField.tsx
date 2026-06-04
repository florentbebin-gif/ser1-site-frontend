import { useId } from 'react';

export type SimTemporalGranularity = 'day' | 'month';

export interface SimTemporalFieldProps {
  /** Valeur ISO interne : `YYYY-MM-DD` (jour) ou `YYYY-MM` (mois). */
  value: string;
  onChange: (_value: string) => void;
  granularity?: SimTemporalGranularity;
  id?: string;
  ariaLabel?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  className?: string;
  testId?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Champ temporel unifié des simulateurs (date ou mois).
 *
 * Centralise la saisie temporelle pour un visuel cohérent avec les autres champs
 * `Sim*` : la valeur reste en ISO en interne (rattachable au dossier / exports),
 * l'affichage suit la locale. Remplace les `<input type="date"|"month">` bruts en
 * `/sim/*` (cf. garde-fou `check:no-raw-temporal-input`).
 */
export function SimTemporalField({
  value,
  onChange,
  granularity = 'day',
  id,
  ariaLabel,
  min,
  max,
  disabled = false,
  ariaInvalid = false,
  className,
  testId,
}: SimTemporalFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `sim-temporal-${generatedId}`;

  return (
    <input
      id={inputId}
      type={granularity === 'month' ? 'month' : 'date'}
      className={joinClasses('sim-field__control', 'sim-field__control--temporal', className)}
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid || undefined}
      data-testid={testId}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
