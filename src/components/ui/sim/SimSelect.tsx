import React, { useEffect, useRef, useState } from 'react';

export interface SimSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SimSelectProps {
  value: string;
  onChange: (_value: string) => void;
  options: SimSelectOption[];
  placeholder?: string;
  align?: 'right' | 'left';
  forced?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

export function SimSelect({
  value,
  onChange,
  options,
  placeholder,
  align = 'right',
  forced = false,
  disabled = false,
  className,
  style,
  testId,
}: SimSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const wrapperClass = [
    'sim-select-wrapper',
    align === 'left' ? 'sim-select-wrapper--left' : '',
    open ? 'is-open' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  const triggerClass = [
    'sim-field__select-trigger',
    open ? 'is-open' : '',
    forced ? 'is-forced' : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={wrapperClass} style={style}>
      <button
        type="button"
        className={triggerClass}
        disabled={disabled}
        onClick={() => { if (!forced) setOpen((v) => !v); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid={testId}
      >
        <span className={`sim-field__select-value${!selected && placeholder ? ' sim-field__select-value--placeholder' : ''}`}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <svg
          className="sim-field__select-arrow"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          aria-hidden="true"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Options" className="sim-field__dropdown">
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={[
                'sim-field__option',
                o.value === value ? 'is-selected' : '',
                o.disabled ? 'is-disabled' : '',
              ].filter(Boolean).join(' ')}
              onMouseDown={() => {
                if (o.disabled) return;
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
              {o.description && (
                <span className="sim-field__option-description">{o.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
