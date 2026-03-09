import React, { useEffect, useRef, useState } from 'react';

export interface ScSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ScSelectProps {
  value: string;
  onChange: (_value: string) => void;
  options: ScSelectOption[];
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

export function ScSelect({
  value,
  onChange,
  options,
  className,
  style,
  testId,
}: ScSelectProps): React.ReactElement {
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

  return (
    <div ref={ref} className={`sc-select${className ? ` ${className}` : ''}`} style={style}>
      <button
        type="button"
        className={`sc-select__trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid={testId}
      >
        <span className="sc-select__label">{selected?.label || ''}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sc-select__chevron${open ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="sc-select__dropdown" role="listbox">
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`sc-select__option${o.value === value ? ' is-selected' : ''}${o.disabled ? ' is-disabled' : ''}`}
              title={o.description ?? o.label}
              onMouseDown={() => {
                if (o.disabled) return;
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span className="sc-select__option-label">{o.label}</span>
              {o.description && (
                <span className="sc-select__option-description">{o.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ScSelect;
