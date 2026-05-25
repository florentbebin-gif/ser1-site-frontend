import type { ReactNode } from 'react';
import { IconEmptyChart, IconEmptyDocs, IconEmptyTable } from '@/icons/ui';

export type SimEmptyStateIllustration = 'table' | 'chart' | 'docs' | ReactNode;

export interface SimEmptyStateProps {
  illustration: SimEmptyStateIllustration;
  title: ReactNode;
  description?: ReactNode;
  cta?: ReactNode;
  className?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function renderIllustration(illustration: SimEmptyStateIllustration) {
  if (illustration === 'table') return <IconEmptyTable />;
  if (illustration === 'chart') return <IconEmptyChart />;
  if (illustration === 'docs') return <IconEmptyDocs />;
  return illustration;
}

export function SimEmptyState({
  illustration,
  title,
  description,
  cta,
  className,
}: SimEmptyStateProps) {
  return (
    <div className={joinClasses('premium-card', 'sim-summary-card', 'sim-empty-state', className)}>
      <div className="sim-empty-state__illustration">{renderIllustration(illustration)}</div>
      <div className="sim-empty-state__content">
        <h2 className="sim-empty-state__title">{title}</h2>
        {description ? <p className="sim-empty-state__description">{description}</p> : null}
        {cta ? <div className="sim-empty-state__cta">{cta}</div> : null}
      </div>
    </div>
  );
}
