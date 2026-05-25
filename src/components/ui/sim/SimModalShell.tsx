import { useId, type ReactNode } from 'react';

interface SimModalShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
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

  return (
    <div className={joinClasses('sim-modal-overlay', overlayClassName)}>
      <div
        className={joinClasses('sim-modal', modalClassName)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        data-testid={modalTestId}
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
