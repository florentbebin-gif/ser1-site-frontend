import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { IconInfo } from '@/icons/ui';

export interface SimTooltipProps {
  label: ReactNode;
  description: ReactNode;
  ariaLabel?: string;
  className?: string;
  panelClassName?: string;
  id?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getAccessibleLabel(label: ReactNode, ariaLabel?: string) {
  if (ariaLabel) return ariaLabel;
  return typeof label === 'string' ? `Définition : ${label}` : 'Définition métier';
}

export function SimTooltip({
  label,
  description,
  ariaLabel,
  className,
  panelClassName,
  id,
}: SimTooltipProps) {
  const generatedId = useId();
  const panelId = id ?? `sim-tooltip-${generatedId.replace(/:/g, '')}`;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    const panel = panelRef.current;
    if (panel?.matches(':popover-open')) {
      panel.hidePopover?.();
    }
    setOpen(false);
  }, []);

  const show = useCallback(() => {
    const panel = panelRef.current;
    if (panel && !panel.matches(':popover-open')) {
      panel.showPopover?.();
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, open]);

  return (
    <span className={joinClasses('sim-tooltip', className)}>
      <button
        type="button"
        className="sim-tooltip__trigger"
        aria-label={getAccessibleLabel(label, ariaLabel)}
        aria-describedby={panelId}
        aria-expanded={open}
        onClick={() => (open ? close() : show())}
      >
        <span className="sim-tooltip__label">{label}</span>
        <IconInfo className="sim-tooltip__icon" />
      </button>
      <div
        id={panelId}
        ref={panelRef}
        className={joinClasses('sim-tooltip__panel', panelClassName)}
        role="tooltip"
        popover="manual"
        data-open={open ? 'true' : undefined}
      >
        {description}
      </div>
    </span>
  );
}
