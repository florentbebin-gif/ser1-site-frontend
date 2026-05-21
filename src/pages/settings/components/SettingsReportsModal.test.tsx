// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsReportsModal from './SettingsReportsModal';

vi.mock('@/settings/admin/issueReportAttachments', () => ({
  createIssueReportAttachmentSignedUrl: vi.fn(),
}));

describe('SettingsReportsModal', () => {
  it('affiche le contexte lisible et les pièces jointes sans colonne Page', () => {
    render(
      <SettingsReportsModal
        show
        selectedReport={
          {
            id: 'report-1',
            created_at: '2026-05-21T08:00:00.000Z',
            title: 'Mise à jour Base CG retraite',
            description: 'CG à vérifier.',
            admin_read_at: null,
            meta: { context: 'base_cg_retraite' },
            attachments: [
              {
                storagePath: 'user-1/cg.pdf',
                fileName: 'cg.pdf',
                mime: 'application/pdf',
                bytes: 1024,
                kind: 'pdf',
              },
            ],
          } as any
        }
        selectedReportUser={{ id: 'user-1', email: 'client@example.com' }}
        reportLoading={false}
        userReports={[]}
        onClose={vi.fn()}
        onBackToList={vi.fn()}
        onSelectReport={vi.fn()}
        onDeleteAllReports={vi.fn()}
        onMarkAsRead={vi.fn()}
        onDeleteReport={vi.fn()}
      />,
    );

    expect(screen.queryByText('Page :')).not.toBeInTheDocument();
    expect(screen.getByText('Base CG retraite')).toBeInTheDocument();
    expect(screen.getByText('cg.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Télécharger cg.pdf' })).toBeInTheDocument();
  });
});
