import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
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

type TooltipAnchorStyle = CSSProperties & {
  anchorName?: string;
  '--sim-tooltip-anchor'?: string;
};

const TOOLTIP_OFFSET_PX = 4;
const TOOLTIP_VIEWPORT_GUTTER_PX = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function supportsAnchorPositioning() {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('position-anchor: --sim-tooltip-anchor') &&
    CSS.supports('top: anchor(bottom)')
  );
}

function buildAnchorName(panelId: string) {
  return `--${panelId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
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
  const anchorName = useMemo(() => buildAnchorName(panelId), [panelId]);
  const wrapperStyle: TooltipAnchorStyle = useMemo(
    () => ({ '--sim-tooltip-anchor': anchorName }),
    [anchorName],
  );
  const triggerStyle: TooltipAnchorStyle = useMemo(() => ({ anchorName }), [anchorName]);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const updatePanelPosition = useCallback(() => {
    if (supportsAnchorPositioning()) return;

    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const panelWidth = panelRect.width || 320;
    const panelHeight = panelRect.height || 0;
    const maxLeft = Math.max(
      TOOLTIP_VIEWPORT_GUTTER_PX,
      viewportWidth - panelWidth - TOOLTIP_VIEWPORT_GUTTER_PX,
    );
    const left = clamp(triggerRect.left, TOOLTIP_VIEWPORT_GUTTER_PX, maxLeft);
    const belowTop = triggerRect.bottom + TOOLTIP_OFFSET_PX;
    const aboveTop = triggerRect.top - panelHeight - TOOLTIP_OFFSET_PX;
    const shouldFlipAbove =
      belowTop + panelHeight > viewportHeight - TOOLTIP_VIEWPORT_GUTTER_PX &&
      aboveTop >= TOOLTIP_VIEWPORT_GUTTER_PX;
    const top = shouldFlipAbove ? aboveTop : belowTop;

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }, []);

  const close = useCallback(() => {
    const panel = panelRef.current;
    if (panel?.matches(':popover-open')) {
      panel.hidePopover?.();
    }
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const show = useCallback(() => {
    const panel = panelRef.current;
    if (panel && !panel.matches(':popover-open')) {
      panel.showPopover?.();
    }
    updatePanelPosition();
    setOpen(true);
  }, [updatePanelPosition]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (!open || supportsAnchorPositioning()) return undefined;

    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  return (
    <span className={joinClasses('sim-tooltip', className)} style={wrapperStyle}>
      <button
        ref={triggerRef}
        type="button"
        className="sim-tooltip__trigger"
        style={triggerStyle}
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
