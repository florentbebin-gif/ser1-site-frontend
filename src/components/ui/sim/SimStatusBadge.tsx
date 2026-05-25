import type { ReactNode } from 'react';

export type SimStatusBadgeVariant = 'optimal' | 'attention' | 'info';

export interface SimStatusBadgeProps {
  variant: SimStatusBadgeVariant;
  children: ReactNode;
  className?: string;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimStatusBadge({ variant, children, className }: SimStatusBadgeProps) {
  return (
    <span className={cx('sim-status-badge', `sim-status-badge--${variant}`, className)}>
      <span className="sim-status-badge__dot" aria-hidden="true" />
      <span className="sim-status-badge__label">{children}</span>
    </span>
  );
}
