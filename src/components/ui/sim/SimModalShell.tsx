import { useEffect, useId, useRef, type ReactNode } from 'react';

export type SimModalMobileVariant = 'bottom-sheet' | 'fullscreen';

export interface SimModalShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  mobileVariant?: SimModalMobileVariant;
  onClose?: () => void;
  closeLabel?: string;
  overlayClassName?: string;
  modalClassName?: string;
  headerClassName?: string;
  headerContentClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeClassName?: string;
  titleId?: string;
  modalTestId?: string;
  closeTestId?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SimModalShell({
  title,
  subtitle,
  icon,
  children,
  footer,
  mobileVariant = 'bottom-sheet',
  onClose,
  closeLabel = 'Fermer la modale',
  overlayClassName,
  modalClassName,
  headerClassName,
  headerContentClassName,
  iconClassName,
  titleClassName,
  subtitleClassName,
  bodyClassName,
  footerClassName,
  closeClassName,
  titleId,
  modalTestId,
  closeTestId,
}: SimModalShellProps) {
  const generatedTitleId = useId();
  const resolvedTitleId = titleId ?? generatedTitleId;
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusable = () =>
      Array.from(modal.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute('disabled') && element.offsetParent !== null,
      );
    const isTopModal = () => {
      const modals = Array.from(document.querySelectorAll('.sim-modal'));
      return modals[modals.length - 1] === modal;
    };

    window.setTimeout(() => {
      if (!isTopModal() || modal.contains(document.activeElement)) return;
      (getFocusable()[0] ?? modal).focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal()) return;

      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      className={joinClasses(
        'sim-modal-overlay',
        `sim-modal-overlay--${mobileVariant}`,
        overlayClassName,
      )}
    >
      <div
        ref={modalRef}
        className={joinClasses('sim-modal', `sim-modal--${mobileVariant}`, modalClassName)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        data-testid={modalTestId}
        tabIndex={-1}
      >
        <div className={joinClasses('sim-modal__header', headerClassName)}>
          <div className={joinClasses('sim-modal__header-content', headerContentClassName)}>
            {icon ? (
              <div className={joinClasses('sim-modal__icon', iconClassName)}>{icon}</div>
            ) : null}
            <div>
              <h2 id={resolvedTitleId} className={joinClasses('sim-modal__title', titleClassName)}>
                {title}
              </h2>
              {subtitle ? (
                <p className={joinClasses('sim-modal__subtitle', subtitleClassName)}>{subtitle}</p>
              ) : null}
            </div>
          </div>

          {onClose ? (
            <button
              type="button"
              className={joinClasses('sim-modal__close', closeClassName)}
              onClick={onClose}
              aria-label={closeLabel}
              data-testid={closeTestId}
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>

        <div className={joinClasses('sim-modal__body', bodyClassName)}>{children}</div>

        {footer ? (
          <div className={joinClasses('sim-modal__footer', footerClassName)}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
