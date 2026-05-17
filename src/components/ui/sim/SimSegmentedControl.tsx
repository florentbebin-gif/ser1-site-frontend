import { useId } from 'react';

export interface SimSegmentedOption<T extends string> {
  value: T;
  label: string;
  ariaLabel?: string;
}

interface SimSegmentedControlProps<T extends string> {
  value: T;
  options: SimSegmentedOption<T>[];
  onChange: (_value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}

export function SimSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
}: SimSegmentedControlProps<T>) {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`sim-segmented sim-segmented--${size}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.ariaLabel ?? option.label}
          id={`${groupId}-${option.value}`}
          className={`sim-segmented__option${option.value === value ? ' is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
