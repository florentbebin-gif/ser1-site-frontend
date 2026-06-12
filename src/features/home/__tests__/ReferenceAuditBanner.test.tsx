// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ReferenceAuditReportSummary } from '@/hooks/useReferenceAuditNotification';

import { ReferenceAuditBanner } from '../ReferenceAuditBanner';

const report: ReferenceAuditReportSummary = {
  id: 'report-1',
  createdAt: '2026-06-12T08:00:00.000Z',
  ok: false,
  requiresAction: true,
  bindingCount: 444,
  referencedUrlCount: 173,
  staleBindingCount: 2,
  staleReferenceCount: 1,
  urlFailureCount: 1,
  urlBlockedCount: 0,
  urlInconclusiveCount: 0,
  dbFindingCount: 0,
  warningCount: 1,
  errorCount: 4,
  runUrl: 'https://github.com/florentbebin-gif/ser1-site-frontend/actions/runs/123',
};

describe('ReferenceAuditBanner', () => {
  it('affiche un résumé actionnable et appelle l’acquittement', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <ReferenceAuditBanner
        report={report}
        isSubmitting={false}
        error={null}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId('home-reference-audit-banner')).toHaveTextContent(
      'Références Settings à revérifier',
    );
    expect(screen.getByTestId('home-reference-audit-banner')).toHaveTextContent(
      '4 points à traiter',
    );
    expect(screen.getByRole('link', { name: 'Ouvrir le run GitHub' })).toHaveAttribute(
      'href',
      report.runUrl,
    );

    await user.click(screen.getByRole('button', { name: /Vu/ }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
