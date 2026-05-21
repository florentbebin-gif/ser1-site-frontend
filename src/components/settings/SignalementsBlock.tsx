import React, { useState } from 'react';
import { useSignalements } from '@/hooks/settings/useSignalements';
import { validateIssueAttachmentFile, type IssueAttachmentKind } from '@/settings/issueReports';
import './SignalementsBlock.css';

const REPORT_STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const getStatusLabel = (status: string): string => REPORT_STATUS_LABELS[status] || status;

export default function SignalementsBlock(): React.ReactElement {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfAttachment, setPdfAttachment] = useState<File | null>(null);
  const [imageAttachment, setImageAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [fileInputResetKey, setFileInputResetKey] = useState(0);

  const {
    reports,
    loadingReports,
    loadError,
    submitting,
    submitSuccess,
    submitError,
    submitReport,
  } = useSignalements();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    expectedKind: IssueAttachmentKind,
  ): void => {
    const file = e.currentTarget.files?.[0] ?? null;
    setAttachmentError('');

    if (!file) {
      if (expectedKind === 'pdf') setPdfAttachment(null);
      else setImageAttachment(null);
      return;
    }

    try {
      validateIssueAttachmentFile(file, expectedKind);
      if (expectedKind === 'pdf') setPdfAttachment(file);
      else setImageAttachment(file);
    } catch (error) {
      if (expectedKind === 'pdf') setPdfAttachment(null);
      else setImageAttachment(null);
      e.currentTarget.value = '';
      setAttachmentError(error instanceof Error ? error.message : 'Pièce jointe invalide.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!title.trim() || attachmentError) return;

    const success = await submitReport({
      title: title.trim(),
      description: description.trim(),
      pdfAttachment,
      imageAttachment,
    });
    if (success) {
      setTitle('');
      setDescription('');
      setPdfAttachment(null);
      setImageAttachment(null);
      setAttachmentError('');
      setFileInputResetKey((value) => value + 1);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="signalements-block">
      <div className="signalements-section">
        <h4 className="signalements-section-title">Signaler un problème</h4>
        <p className="signalements-intro">
          Vous avez rencontré un bug ou souhaitez suggérer une amélioration ? Décrivez le problème
          ci-dessous.
        </p>

        <form onSubmit={handleSubmit} className="signalement-form">
          <div className="form-group">
            <label htmlFor="report-title">Titre *</label>
            <input
              id="report-title"
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Résumez le problème en quelques mots"
              disabled={submitting}
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-description">Description</label>
            <textarea
              id="report-description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Décrivez le problème en détail : étapes, comportement attendu et observé..."
              disabled={submitting}
              rows={4}
            />
          </div>

          <div className="signalement-files">
            <div className="form-group form-group--file">
              <label htmlFor="report-pdf">PDF (facultatif)</label>
              <input
                key={`report-pdf-${fileInputResetKey}`}
                id="report-pdf"
                type="file"
                accept="application/pdf"
                disabled={submitting}
                onChange={(e) => handleFileChange(e, 'pdf')}
              />
              {pdfAttachment ? (
                <span className="signalement-file-name">{pdfAttachment.name}</span>
              ) : null}
            </div>

            <div className="form-group form-group--file">
              <label htmlFor="report-image">Image ou capture d'écran (facultatif)</label>
              <input
                key={`report-image-${fileInputResetKey}`}
                id="report-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={submitting}
                onChange={(e) => handleFileChange(e, 'image')}
              />
              {imageAttachment ? (
                <span className="signalement-file-name">{imageAttachment.name}</span>
              ) : null}
            </div>
          </div>

          {attachmentError && <div className="alert alert-error">{attachmentError}</div>}
          {submitError && <div className="alert alert-error">{submitError}</div>}
          {submitSuccess && (
            <div className="alert alert-success">Signalement envoyé avec succès !</div>
          )}

          <button type="submit" disabled={submitting} className="btn-submit">
            {submitting ? 'Envoi...' : 'Envoyer le signalement'}
          </button>
        </form>
      </div>

      <div className="signalements-section">
        <h4 className="signalements-section-title">Mes signalements récents</h4>

        {loadingReports ? (
          <p className="signalements-loading">Chargement...</p>
        ) : loadError ? (
          <p className="signalements-error">{loadError}</p>
        ) : reports.length === 0 ? (
          <p className="signalements-empty">Aucun signalement pour le moment.</p>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report.id} className="report-item">
                <div className="report-header">
                  <span className="report-title">{report.title}</span>
                  <span className={`report-status status-${report.status}`}>
                    {getStatusLabel(report.status)}
                  </span>
                </div>
                <div className="report-meta">
                  <span>{formatDate(report.created_at)}</span>
                  {report.attachments.length > 0 ? (
                    <>
                      <span className="report-meta-separator">•</span>
                      <span>
                        {report.attachments.length} pièce
                        {report.attachments.length > 1 ? 's' : ''} jointe
                        {report.attachments.length > 1 ? 's' : ''}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
