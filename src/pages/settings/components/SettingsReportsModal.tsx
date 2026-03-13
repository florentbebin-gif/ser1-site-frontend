import React from 'react';

interface ReportUser {
  id?: string;
  email?: string | null;
}

interface SettingsReport {
  id: string;
  created_at: string;
  page?: string | null;
  title?: string | null;
  description?: string | null;
  admin_read_at?: string | null;
  meta?: Record<string, unknown> | null;
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
  if (!show) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(event) => event.stopPropagation()}>
        {!selectedReport ? (
          <>
            <div className="report-modal-header">
              <div className="report-modal-title-section">
                <h3>Signalements</h3>
                {selectedReportUser?.email && (
                  <span className="report-modal-subtitle">{selectedReportUser.email}</span>
                )}
              </div>
              <button className="report-modal-close" onClick={onClose} type="button">X</button>
            </div>

            <div className="report-modal-content">
              {reportLoading ? (
                <div className="report-loading">Chargement des signalements...</div>
              ) : userReports.length === 0 ? (
                <div className="report-empty">Aucun signalement pour cet utilisateur.</div>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Page</th>
                      <th>Titre</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userReports.map((report) => (
                      <tr key={report.id} className={report.admin_read_at ? 'read' : 'unread'}>
                        <td>{new Date(report.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="report-page-cell">{report.page || '-'}</td>
                        <td className="report-title-cell">{report.title || 'Sans titre'}</td>
                        <td>
                          <span className={`report-status ${report.admin_read_at ? 'read' : 'unread'}`}>
                            {report.admin_read_at ? 'Lu' : 'Non lu'}
                          </span>
                        </td>
                        <td>
                          <button className="report-view-btn" onClick={() => onSelectReport(report)} type="button">
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="report-modal-actions">
              {userReports.length > 0 && (
                <button className="danger" onClick={() => onDeleteAllReports(selectedReportUser?.id)} type="button">
                  Supprimer tout l'historique
                </button>
              )}
              <button onClick={onClose} type="button">Fermer</button>
            </div>
          </>
        ) : (
          <>
            <div className="report-modal-header">
              <div className="report-modal-title-section">
                <button className="report-back-btn" onClick={onBackToList} type="button">
                  {'<-'} Retour
                </button>
                <h3>Detail du signalement</h3>
              </div>
              <button className="report-modal-close" onClick={onClose} type="button">X</button>
            </div>

            <div className="report-modal-content">
              <div className="report-detail-meta">
                <div className="report-detail-field">
                  <span className="report-detail-label">Date :</span>
                  <span className="report-detail-value">
                    {new Date(selectedReport.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="report-detail-field">
                  <span className="report-detail-label">Page :</span>
                  <span className="report-detail-value">{selectedReport.page || '-'}</span>
                </div>
                <div className="report-detail-field">
                  <span className="report-detail-label">Statut :</span>
                  <span className={`report-status ${selectedReport.admin_read_at ? 'read' : 'unread'}`}>
                    {selectedReport.admin_read_at ? 'Lu' : 'Non lu'}
                  </span>
                </div>
              </div>

              <div className="report-detail-section">
                <h4>{selectedReport.title || 'Sans titre'}</h4>
                <div className="report-description-box">
                  {selectedReport.description || 'Aucune description fournie.'}
                </div>
              </div>

              {selectedReport.meta && Object.keys(selectedReport.meta).length > 0 && (
                <details className="report-detail-metadata">
                  <summary>Informations techniques</summary>
                  <pre>{JSON.stringify(selectedReport.meta, null, 2)}</pre>
                </details>
              )}
            </div>

            <div className="report-modal-actions">
              {!selectedReport.admin_read_at && (
                <button onClick={() => onMarkAsRead(selectedReport.id)} type="button">
                  Marquer comme lu
                </button>
              )}
              <button className="danger" onClick={() => onDeleteReport(selectedReport.id)} type="button">
                Supprimer
              </button>
              <button onClick={onBackToList} type="button">Retour a la liste</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
