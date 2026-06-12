import React from 'react';

import type { ReferenceAuditReportSummary } from '@/hooks/useReferenceAuditNotification';
import { IconCheck, IconInfo } from '@/icons/ui';

interface ReferenceAuditBannerProps {
  report: ReferenceAuditReportSummary;
  isSubmitting: boolean;
  error: string | null;
  onDismiss: () => void;
}

function formatAuditDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'date inconnue';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function countActionItems(report: ReferenceAuditReportSummary): number {
  const detailedCount =
    report.staleBindingCount +
    report.staleReferenceCount +
    report.urlFailureCount +
    report.dbFindingCount;

  return Math.max(detailedCount, report.errorCount);
}

export function ReferenceAuditBanner({
  report,
  isSubmitting,
  error,
  onDismiss,
}: ReferenceAuditBannerProps): React.ReactElement {
  const actionCount = countActionItems(report);

  return (
    <section
      className="home-reference-audit-banner"
      data-testid="home-reference-audit-banner"
      aria-live="polite"
    >
      <span className="home-reference-audit-banner__icon" aria-hidden="true">
        <IconInfo className="home-reference-audit-banner__svg" />
      </span>

      <div className="home-reference-audit-banner__copy">
        <p className="home-reference-audit-banner__title">Références Settings à revérifier</p>
        <p className="home-reference-audit-banner__text">
          Audit du {formatAuditDate(report.createdAt)} : {actionCount} point
          {actionCount > 1 ? 's' : ''} à traiter sur {report.bindingCount} bindings.
        </p>
        {report.runUrl && (
          <a className="home-reference-audit-banner__link" href={report.runUrl}>
            Ouvrir le run GitHub
          </a>
        )}
        {error && (
          <p className="home-reference-audit-banner__error" role="alert">
            Acquittement impossible : {error}
          </p>
        )}
      </div>

      <button
        type="button"
        className="home-reference-audit-banner__button"
        onClick={onDismiss}
        disabled={isSubmitting}
      >
        <IconCheck className="home-reference-audit-banner__button-icon" />
        <span>{isSubmitting ? 'En cours' : 'Vu'}</span>
      </button>
    </section>
  );
}
