import type { ReactNode } from 'react';

export interface SimMobileStickyActionsProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimMobileStickyActions({
  children,
  className,
  ariaLabel,
}: SimMobileStickyActionsProps) {
  return (
    <div className={cx('sim-mobile-sticky-actions', className)} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
