import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface SimSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SimSelectProps {
  id?: string;
  value: string;
  onChange: (_value: string) => void;
  options: SimSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  align?: 'right' | 'left';
  forced?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
  clearable?: boolean;
}

export function SimSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  align = 'right',
  forced = false,
  disabled = false,
  className,
  style,
  testId,
  clearable = false,
}: SimSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLUListElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const gap = 4;
    const edgeMargin = 8;
    const spaceBelow = viewportHeight - rect.bottom - gap - edgeMargin;
    const spaceAbove = rect.top - gap - edgeMargin;
    const opensAbove = spaceBelow < 120 && spaceAbove > spaceBelow;
    const availableSpace = opensAbove ? spaceAbove : spaceBelow;
    const estimatedMenuHeight = Math.min(240, Math.max(40, options.length * 38 + 8));
    const maxHeight = Math.min(estimatedMenuHeight, Math.max(80, availableSpace));
    const top = opensAbove
      ? Math.max(edgeMargin, rect.top - gap - maxHeight)
      : Math.min(rect.bottom + gap, viewportHeight - maxHeight - edgeMargin);
    const left = Math.min(
      Math.max(edgeMargin, rect.left),
      Math.max(edgeMargin, viewportWidth - rect.width - edgeMargin),
    );

    setDropdownStyle({
      top,
      left,
      width: rect.width,
      maxHeight,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

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
  ]
    .filter(Boolean)
    .join(' ');

  const triggerClass = [
    'sim-field__select-trigger',
    open ? 'is-open' : '',
    forced ? 'is-forced' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={wrapperClass} style={style}>
      <button
        id={id}
        type="button"
        ref={triggerRef}
        className={triggerClass}
        disabled={disabled}
        onClick={() => {
          if (!forced) setOpen((v) => !v);
        }}
        onKeyDown={(event) => {
          if (clearable && value && (event.key === 'Delete' || event.key === 'Backspace')) {
            event.preventDefault();
            onChange('');
            setOpen(false);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        data-testid={testId}
      >
        <span
          className={`sim-field__select-value${!selected && placeholder ? ' sim-field__select-value--placeholder' : ''}`}
        >
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
      {open &&
        createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            aria-label="Options"
            className="sim-field__dropdown"
            style={dropdownStyle}
          >
            {options.map((o) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                className={[
                  'sim-field__option',
                  o.value === value ? 'is-selected' : '',
                  o.disabled ? 'is-disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
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
          </ul>,
          document.body,
        )}
    </div>
  );
}
