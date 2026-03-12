// @ts-nocheck
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
export function IrSelect({ value, onChange, options, className, style, testId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
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
        <span className="ir-select__label">{selected?.label || ''}</span>
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

