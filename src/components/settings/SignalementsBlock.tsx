import React, { useState } from 'react';
import { useSignalements } from './hooks/useSignalements';
import './SignalementsBlock.css';

const REPORT_PAGE_OPTIONS = [
  { value: '', label: 'Sélectionner une page...' },
  { value: 'ir', label: 'Simulateur IR' },
  { value: 'credit', label: 'Simulateur Crédit' },
  { value: 'placement', label: 'Simulateur Placement' },
  { value: 'audit', label: 'Audit Patrimonial' },
  { value: 'strategy', label: 'Stratégie' },
  { value: 'settings', label: 'Paramètres' },
  { value: 'other', label: 'Autre' },
];

const REPORT_STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const getPageLabel = (value: string): string => {
  const page = REPORT_PAGE_OPTIONS.find((option) => option.value === value);
  return page?.label || value;
};

const getStatusLabel = (status: string): string => REPORT_STATUS_LABELS[status] || status;

export default function SignalementsBlock(): React.ReactElement {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [page, setPage] = useState('');

  const {
    reports,
    loadingReports,
    loadError,
    submitting,
    submitSuccess,
    submitError,
    submitReport,
  } = useSignalements();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!title.trim() || !page) return;

    const success = await submitReport({ title: title.trim(), description: description.trim(), page });
    if (success) {
      setTitle('');
      setDescription('');
      setPage('');
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
          Vous avez rencontré un bug ou souhaitez suggérer une amélioration ?
          Décrivez le problème ci-dessous.
        </p>

        <form onSubmit={handleSubmit} className="signalement-form">
          <div className="form-group">
            <label htmlFor="report-page">Page concernée *</label>
            <select
              id="report-page"
              value={page}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPage(e.target.value)}
              disabled={submitting}
              required
            >
              {REPORT_PAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Décrivez le problème en détail : étapes, comportement attendu et observé..."
              disabled={submitting}
              rows={4}
            />
          </div>

          {submitError && <div className="alert alert-error">{submitError}</div>}
          {submitSuccess && <div className="alert alert-success">Signalement envoyé avec succès !</div>}

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
                  <span>{getPageLabel(report.page)}</span>
                  <span className="report-meta-separator">•</span>
                  <span>{formatDate(report.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
