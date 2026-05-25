import { useMemo } from 'react';
import { useFiscalContext } from '@/hooks/useFiscalContext';

export interface SimAuditTrailProps {
  calculatedAt?: Date;
  sourceLabel?: string;
  className?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatAuditDate(date: Date): string {
  return [
    `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`,
  ].join(' ');
}

export function SimAuditTrail({
  calculatedAt,
  sourceLabel = 'Source Bercy',
  className,
}: SimAuditTrailProps) {
  const { fiscalContext } = useFiscalContext({ strict: false });
  const auditDate = useMemo(() => calculatedAt ?? new Date(), [calculatedAt]);
  const incomeTaxLabel = fiscalContext.irCurrentYearLabel;

  return (
    <p className={joinClasses('sim-audit-trail', className)}>
      Simulation calculée le {formatAuditDate(auditDate)} · Barème IR {incomeTaxLabel} ·{' '}
      {sourceLabel}
    </p>
  );
}
