import { useId, useRef, type KeyboardEvent } from 'react';

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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  function selectOptionAt(index: number) {
    const option = options[index];
    if (!option) return;

    onChange(option.value);
    optionRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (options.length === 0) return;

    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + options.length) % options.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = options.length - 1;
        break;
      default:
        break;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    selectOptionAt(nextIndex);
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`sim-segmented sim-segmented--${size}`}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(element) => {
            optionRefs.current[index] = element;
          }}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.ariaLabel ?? option.label}
          id={`${groupId}-${option.value}`}
          tabIndex={index === activeIndex ? 0 : -1}
          className={`sim-segmented__option${option.value === value ? ' is-active' : ''}`}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
