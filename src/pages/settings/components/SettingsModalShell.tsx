import { useEffect, useId, useRef, type ReactNode } from 'react';

let bodyScrollLockCount = 0;
let previousBodyOverflow = '';

export interface SettingsModalShellProps {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  subtitle?: ReactNode;
  headerLeading?: ReactNode;
  beforeBody?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  overlayClassName?: string;
  modalClassName?: string;
  headerClassName?: string;
  titleSectionClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeClassName?: string;
  titleId?: string;
  modalTestId?: string;
  closeTestId?: string;
  withBodyContainer?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

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

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  bodyScrollLockCount += 1;

  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
      previousBodyOverflow = '';
    }
  };
}

function getFocusableElements(modal: HTMLElement): HTMLElement[] {
  return Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex >= 0 && element.getAttribute('aria-hidden') !== 'true',
  );
}

export default function SettingsModalShell({
  title,
  children,
  footer,
  subtitle,
  headerLeading,
  beforeBody,
  onClose,
  closeLabel = 'Fermer',
  size = 'lg',
  overlayClassName,
  modalClassName,
  headerClassName,
  titleSectionClassName,
  titleClassName,
  subtitleClassName,
  bodyClassName,
  footerClassName,
  closeClassName,
  titleId,
  modalTestId,
  closeTestId,
  withBodyContainer = true,
}: SettingsModalShellProps) {
  const generatedTitleId = useId();
  const resolvedTitleId = titleId ?? generatedTitleId;
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => lockBodyScroll(), []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const isTopModal = () => {
      const modals = Array.from(document.querySelectorAll('.settings-modal-shell'));
      return modals[modals.length - 1] === modal;
    };

    window.setTimeout(() => {
      if (!isTopModal() || modal.contains(document.activeElement)) return;
      (closeButtonRef.current ?? getFocusableElements(modal)[0] ?? modal).focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal()) return;

      if (event.key === 'Escape' && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusableElements = getFocusableElements(modal);
      if (focusableElements.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, []);

  return (
    <div className={joinClasses('settings-modal-shell-overlay', overlayClassName)}>
      <div
        ref={modalRef}
        className={joinClasses(
          'settings-modal-shell',
          `settings-modal-shell--${size}`,
          modalClassName,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        data-testid={modalTestId}
        tabIndex={-1}
      >
        <div className={joinClasses('settings-modal-shell__header', headerClassName)}>
          <div
            className={joinClasses('settings-modal-shell__title-section', titleSectionClassName)}
          >
            {headerLeading}
            <h3
              id={resolvedTitleId}
              className={joinClasses('settings-modal-shell__title', titleClassName)}
            >
              {title}
            </h3>
            {subtitle ? (
              <span className={joinClasses('settings-modal-shell__subtitle', subtitleClassName)}>
                {subtitle}
              </span>
            ) : null}
          </div>
          {onClose ? (
            <button
              ref={closeButtonRef}
              className={joinClasses('settings-modal-shell__close', closeClassName)}
              onClick={onClose}
              type="button"
              aria-label={closeLabel}
              data-testid={closeTestId}
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>

        {beforeBody}

        {withBodyContainer ? (
          <div className={joinClasses('settings-modal-shell__body', bodyClassName)}>{children}</div>
        ) : (
          children
        )}

        {footer ? (
          <div className={joinClasses('settings-modal-shell__footer', footerClassName)}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
