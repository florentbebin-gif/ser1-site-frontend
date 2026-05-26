import type { ReactNode } from 'react';
import { IconBarChart, IconChevronRight } from '@/icons/ui';

export interface SimViewSynthesisCTAProps {
  ready: boolean;
  targetId: string;
  label?: ReactNode;
  hint?: ReactNode;
  className?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SimViewSynthesisCTA({
  ready,
  targetId,
  label = 'Voir la synthèse',
  hint,
  className,
}: SimViewSynthesisCTAProps) {
  if (!ready) return null;

  return (
    <button
      type="button"
      className={joinClasses('sim-view-synthesis-cta', className)}
      onClick={() => {
        if (typeof document === 'undefined') return;
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
    >
      <IconBarChart className="sim-view-synthesis-cta__icon" />
      <span className="sim-view-synthesis-cta__content">
        <span className="sim-view-synthesis-cta__label">{label}</span>
        {hint ? <span className="sim-view-synthesis-cta__hint">{hint}</span> : null}
      </span>
      <IconChevronRight className="sim-view-synthesis-cta__arrow" />
    </button>
  );
}
