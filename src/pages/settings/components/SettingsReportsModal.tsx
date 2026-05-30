import React from 'react';
import { createIssueReportAttachmentSignedUrl } from '@/settings/admin/issueReportAttachments';
import { normalizeIssueReportAttachments, type IssueAttachment } from '@/settings/issueReports';
import SettingsModalShell from './SettingsModalShell';

interface ReportUser {
  id?: string;
  email?: string | null;
}

interface SettingsReport {
  id: string;
  created_at: string;
  title?: string | null;
  description?: string | null;
  admin_read_at?: string | null;
  meta?: Record<string, unknown> | null;
  attachments?: IssueAttachment[] | null;
}

interface SettingsReportsModalProps {
  show: boolean;
  selectedReport: SettingsReport | null;
  selectedReportUser: ReportUser | null;
  reportLoading: boolean;
  userReports: SettingsReport[];
  onClose: () => void;
  onBackToList: () => void;
  onSelectReport: (report: SettingsReport) => void;
  onDeleteAllReports: (userId?: string) => void;
  onMarkAsRead: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
}

export default function SettingsReportsModal({
  show,
  selectedReport,
  selectedReportUser,
  reportLoading,
  userReports,
  onClose,
  onBackToList,
  onSelectReport,
  onDeleteAllReports,
  onMarkAsRead,
  onDeleteReport,
}: SettingsReportsModalProps): React.ReactElement | null {
  const [downloadError, setDownloadError] = React.useState('');
  if (!show) return null;
  const selectedAttachments = normalizeIssueReportAttachments(selectedReport?.attachments);
  const context =
    typeof selectedReport?.meta?.context === 'string' ? selectedReport.meta.context : null;
  const contextLabel = context === 'base_cg_retraite' ? 'Base CG retraite' : null;

  const handleDownloadAttachment = async (attachment: IssueAttachment): Promise<void> => {
    try {
      setDownloadError('');
      const url = await createIssueReportAttachmentSignedUrl(attachment.storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Téléchargement impossible.');
    }
  };

  if (!selectedReport) {
    return (
      <SettingsModalShell
        title="Signalements"
        subtitle={selectedReportUser?.email}
        onClose={onClose}
        footer={
          <>
            {userReports.length > 0 && (
              <button
                className="danger"
                onClick={() => onDeleteAllReports(selectedReportUser?.id)}
                type="button"
              >
                Supprimer tout l'historique
              </button>
            )}
            <button onClick={onClose} type="button">
              Fermer
            </button>
          </>
        }
      >
        {reportLoading ? (
          <div className="report-loading">Chargement des signalements...</div>
        ) : userReports.length === 0 ? (
          <div className="report-empty">Aucun signalement pour cet utilisateur.</div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {userReports.map((report) => (
                <tr key={report.id} className={report.admin_read_at ? 'read' : 'unread'}>
                  <td>{new Date(report.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="report-title-cell">{report.title || 'Sans titre'}</td>
                  <td>
                    <span className={`report-status ${report.admin_read_at ? 'read' : 'unread'}`}>
                      {report.admin_read_at ? 'Lu' : 'Non lu'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="report-view-btn"
                      onClick={() => onSelectReport(report)}
                      type="button"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SettingsModalShell>
    );
  }

  return (
    <SettingsModalShell
      title="Détail du signalement"
      onClose={onClose}
      headerLeading={
        <button className="report-back-btn" onClick={onBackToList} type="button">
          {'<-'} Retour
        </button>
      }
      footer={
        <>
          {!selectedReport.admin_read_at && (
            <button onClick={() => onMarkAsRead(selectedReport.id)} type="button">
              Marquer comme lu
            </button>
          )}
          <button
            className="danger"
            onClick={() => onDeleteReport(selectedReport.id)}
            type="button"
          >
            Supprimer
          </button>
          <button onClick={onBackToList} type="button">
            Retour à la liste
          </button>
        </>
      }
    >
      <div className="report-detail-meta">
        <div className="report-detail-field">
          <span className="report-detail-label">Date :</span>
          <span className="report-detail-value">
            {new Date(selectedReport.created_at).toLocaleString('fr-FR')}
          </span>
        </div>
        <div className="report-detail-field">
          <span className="report-detail-label">Statut :</span>
          <span className={`report-status ${selectedReport.admin_read_at ? 'read' : 'unread'}`}>
            {selectedReport.admin_read_at ? 'Lu' : 'Non lu'}
          </span>
        </div>
      </div>

      <div className="report-detail-section">
        {contextLabel ? <span className="report-context-chip">{contextLabel}</span> : null}
        <h4>{selectedReport.title || 'Sans titre'}</h4>
        <div className="report-description-box">
          {selectedReport.description || 'Aucune description fournie.'}
        </div>
      </div>

      {selectedAttachments.length > 0 ? (
        <div className="report-detail-section">
          <h4>Pièces jointes</h4>
          <div className="report-attachments-list">
            {selectedAttachments.map((attachment) => (
              <div key={attachment.storagePath} className="report-attachment-row">
                <span>{attachment.fileName}</span>
                <button
                  type="button"
                  className="report-view-btn"
                  onClick={() => void handleDownloadAttachment(attachment)}
                >
                  Télécharger {attachment.fileName}
                </button>
              </div>
            ))}
          </div>
          {downloadError ? <p className="report-download-error">{downloadError}</p> : null}
        </div>
      ) : null}

      {selectedReport.meta && Object.keys(selectedReport.meta).length > 0 && (
        <details className="report-detail-metadata">
          <summary>Informations techniques</summary>
          <pre>{JSON.stringify(selectedReport.meta, null, 2)}</pre>
        </details>
      )}
    </SettingsModalShell>
  );
}
