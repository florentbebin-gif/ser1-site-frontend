import type { ReactNode } from 'react';

interface SimCardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  iconClassName?: string;
  bleed?: boolean;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimCardHeader({
  title,
  subtitle,
  icon,
  className,
  titleClassName,
  subtitleClassName,
  iconClassName,
  bleed = false,
}: SimCardHeaderProps) {
  return (
    <div className={joinClasses('sim-card__header', bleed && 'sim-card__header--bleed', className)}>
      <div className="sim-card__title sim-card__title-row">
        {icon ? <div className={joinClasses('sim-card__icon', iconClassName)}>{icon}</div> : null}
        <span className={titleClassName}>{title}</span>
      </div>
      {subtitle ? <p className={joinClasses('sim-card__subtitle', subtitleClassName)}>{subtitle}</p> : null}
    </div>
  );
}
