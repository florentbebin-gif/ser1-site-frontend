import { useEffect, useMemo, useState } from 'react';
import { IconCheck, IconChevronRight } from '@/icons/ui';
import type { SimPageStep } from './simPageUXContract';

export interface SimPageStepperProps {
  steps: SimPageStep[];
  ariaLabel?: string;
  defaultActiveId?: string;
  className?: string;
  onStepSelect?: (_step: SimPageStep) => void;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function scrollToTarget(step: SimPageStep) {
  const targetId = step.targetId ?? step.id;
  if (typeof document === 'undefined') return;
  const target = document.getElementById(targetId);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SimPageStepper({
  steps,
  ariaLabel = 'Étapes du simulateur',
  defaultActiveId,
  className,
  onStepSelect,
}: SimPageStepperProps) {
  const firstEnabledStepId = useMemo(
    () => steps.find((step) => !step.disabled)?.id ?? steps[0]?.id,
    [steps],
  );
  const currentFromProps = steps.find((step) => step.status === 'current')?.id;
  const [activeId, setActiveId] = useState(
    defaultActiveId ?? currentFromProps ?? firstEnabledStepId,
  );

  useEffect(() => {
    setActiveId(defaultActiveId ?? currentFromProps ?? firstEnabledStepId);
  }, [currentFromProps, defaultActiveId, firstEnabledStepId]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || steps.length === 0) return;
    const targets = steps
      .map((step) => document.getElementById(step.targetId ?? step.id))
      .filter((target): target is HTMLElement => Boolean(target));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (!visible?.target.id) return;
        const matchingStep = steps.find((step) => (step.targetId ?? step.id) === visible.target.id);
        if (matchingStep && !matchingStep.disabled) setActiveId(matchingStep.id);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0.15, 0.4, 0.7] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [steps]);

  if (!steps.length) return null;

  return (
    <nav className={joinClasses('sim-page-stepper', className)} aria-label={ariaLabel}>
      {steps.map((step, index) => {
        const isActive = activeId === step.id;
        const status = step.status ?? (isActive ? 'current' : 'todo');
        const isDone = status === 'done';

        return (
          <button
            key={step.id}
            type="button"
            className={joinClasses(
              'sim-page-stepper__item',
              isActive && 'is-active',
              isDone && 'is-done',
            )}
            disabled={step.disabled}
            aria-current={isActive ? 'step' : undefined}
            aria-label={step.label}
            onClick={() => {
              if (step.disabled) return;
              setActiveId(step.id);
              scrollToTarget(step);
              onStepSelect?.(step);
            }}
          >
            <span className="sim-page-stepper__index" aria-hidden="true">
              {isDone ? <IconCheck /> : index + 1}
            </span>
            <span className="sim-page-stepper__label">{step.label}</span>
            {index < steps.length - 1 ? (
              <IconChevronRight className="sim-page-stepper__separator" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
