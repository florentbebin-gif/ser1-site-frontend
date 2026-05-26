import { useEffect, useState, type ReactNode } from 'react';
import { IconBarChart, IconChevronRight } from '@/icons/ui';

export interface SimViewSynthesisCTAProps {
  ready: boolean;
  targetId: string;
  variant?: 'inline' | 'floating';
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
  variant = 'inline',
  label = 'Voir la synthèse',
  hint,
  className,
}: SimViewSynthesisCTAProps) {
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    if (!ready || variant !== 'floating' || typeof document === 'undefined') {
      setTargetVisible(false);
      return undefined;
    }

    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === 'undefined') {
      setTargetVisible(false);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setTargetVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: '0px 0px -20% 0px', threshold: [0.1, 0.5] },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, [ready, targetId, variant]);

  if (!ready || (variant === 'floating' && targetVisible)) return null;

  return (
    <button
      type="button"
      className={joinClasses(
        'sim-view-synthesis-cta',
        variant === 'floating' && 'sim-view-synthesis-cta--floating',
        className,
      )}
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
