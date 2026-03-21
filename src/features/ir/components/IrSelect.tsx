import React, { useEffect, useRef, useState } from 'react';

/**
 * Select custom IR — trigger button + dropdown (GOUVERNANCE.md §5).
 * Props:
 *   value      — valeur courante
 *   onChange   — callback(value: string)
 *   options    — [{ value, label }]
 *   className  — classe CSS additionnelle sur le wrapper
 *   style      — style inline sur le wrapper (ex: { flex: 1 })
 *   testId     — data-testid sur le trigger
 */
export interface IrSelectOption {
  value: string;
  label: string;
}

interface IrSelectProps {
  value: string;
  onChange: (_value: string) => void;
  options: IrSelectOption[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

export function IrSelect({ value, onChange, options, placeholder, className, style, testId }: IrSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`ir-select${className ? ` ${className}` : ''}`} style={style}>
      <button
        type="button"
        className={`ir-select__trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid={testId}
      >
        <span className={`ir-select__label${!selected && placeholder ? ' ir-select__label--placeholder' : ''}`}>{selected?.label || placeholder || ''}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`ir-select__chevron${open ? ' is-open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="ir-select__dropdown" role="listbox">
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`ir-select__option${o.value === value ? ' is-selected' : ''}`}
              onMouseDown={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

