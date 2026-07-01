import { useEffect, useId, useRef, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { IconClose } from '@/icons/ui';

export type AuditDrawerSize = 'md' | 'lg' | 'xl';

interface AuditDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: AuditDrawerSize;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function AuditDrawer({
  open,
  title,
  subtitle,
  children,
  footer,
  size = 'xl',
  onClose,
}: AuditDrawerProps): ReactElement | null {
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? drawerRef.current)?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements =
        drawerRef.current == null
          ? []
          : Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
              (element) =>
                !element.hasAttribute('disabled') &&
                element.getAttribute('aria-hidden') !== 'true' &&
                element.tabIndex !== -1,
            );

      if (focusableElements.length === 0) {
        event.preventDefault();
        drawerRef.current?.focus();
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="sim-drawer-overlay" role="presentation">
      <aside
        ref={drawerRef}
        className={`sim-drawer sim-drawer--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
      >
        <header className="sim-modal__header">
          <div>
            <p className="sim-modal__eyebrow">Audit patrimonial</p>
            <h2 id={titleId} className="sim-modal__title">
              {title}
            </h2>
            {subtitle ? (
              <p id={subtitleId} className="sim-modal__subtitle">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button type="button" className="sim-modal__close" aria-label="Fermer" onClick={onClose}>
            <IconClose />
          </button>
        </header>

        <div className="sim-modal__body">
          <div className="sim-drawer__layout sim-drawer__layout--no-sources">
            <div className="sim-drawer__main">{children}</div>
          </div>
        </div>

        {footer ? <footer className="sim-modal__footer">{footer}</footer> : null}
      </aside>
    </div>,
    document.body,
  );
}
