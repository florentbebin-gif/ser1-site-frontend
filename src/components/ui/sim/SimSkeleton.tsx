import type { HTMLAttributes } from 'react';

type SimSkeletonDivProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export interface SimSkeletonTextProps extends SimSkeletonDivProps {
  lines?: number;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getLineCount(lines: number | undefined) {
  return Math.max(1, Math.floor(lines ?? 1));
}

export function SimSkeletonText({ className, lines, ...props }: SimSkeletonTextProps) {
  return (
    <div {...props} className={joinClasses('sim-skeleton-text', className)} aria-hidden="true">
      {Array.from({ length: getLineCount(lines) }).map((_, index) => (
        <span className="sim-skeleton sim-skeleton--text" key={`sim-skeleton-text-${index}`} />
      ))}
    </div>
  );
}

export function SimSkeletonCard({ className, ...props }: SimSkeletonDivProps) {
  return (
    <div {...props} className={joinClasses('sim-skeleton-card', className)} aria-hidden="true">
      <span className="sim-skeleton sim-skeleton-card__title" />
      <div className="sim-skeleton-card__body">
        <span className="sim-skeleton sim-skeleton--text" />
        <span className="sim-skeleton sim-skeleton--text" />
        <span className="sim-skeleton sim-skeleton--text" />
      </div>
    </div>
  );
}

export function SimSkeletonKpi({ className, ...props }: SimSkeletonDivProps) {
  return (
    <div {...props} className={joinClasses('sim-skeleton-kpi', className)} aria-hidden="true">
      <span className="sim-skeleton sim-skeleton-kpi__label" />
      <span className="sim-skeleton sim-skeleton-kpi__value" />
      <span className="sim-skeleton sim-skeleton-kpi__note" />
    </div>
  );
}
