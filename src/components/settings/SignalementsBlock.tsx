import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './SignalementsBlock.css';

interface IssueReport {
  id: string;
  title: string;
  page: string;
  status: string;
  created_at: string;
}

const REPORT_PAGE_OPTIONS = [
  { value: '', label: 'Selectionner une page...' },
  { value: 'ir', label: 'Simulateur IR' },
  { value: 'credit', label: 'Simulateur Credit' },
  { value: 'placement', label: 'Simulateur Placement' },
  { value: 'audit', label: 'Audit Patrimonial' },
  { value: 'strategy', label: 'Strategie' },
  { value: 'settings', label: 'Parametres' },
  { value: 'other', label: 'Autre' },
];

const REPORT_STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Resolue',
  closed: 'Ferme',
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
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    void loadMyReports();
  }, []);

  const loadMyReports = async (): Promise<void> => {
    try {
      setLoadingReports(true);
      setLoadError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setLoadError('Vous devez etre connecte pour voir vos signalements.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('issue_reports')
        .select('id, title, page, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      const normalizedReports: IssueReport[] = (data ?? []).map((report) => ({
        id: String(report.id),
        title: String(report.title || ''),
        page: String(report.page || ''),
        status: String(report.status || ''),
        created_at: String(report.created_at || ''),
      }));

      setReports(normalizedReports);
    } catch (error) {
      console.error('[SignalementsBlock] Error loading reports:', error);
      setLoadError('Erreur lors du chargement des signalements.');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!title.trim() || !page) {
      setSubmitError('Veuillez remplir le titre et selectionner une page.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setSubmitError('Vous devez etre connecte pour soumettre un signalement.');
        return;
      }

      const meta = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      };

      const { error: insertError } = await supabase.from('issue_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        page,
        meta,
        status: 'new',
      });

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setPage('');
      void loadMyReports();

      window.setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('[SignalementsBlock] Submit error:', error);
      const message = error instanceof Error ? error.message : 'Veuillez reessayer.';
      setSubmitError(`Erreur lors de l'envoi: ${message}`);
    } finally {
      setSubmitting(false);
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
        <h4 className="signalements-section-title">Signaler un probleme</h4>
        <p className="signalements-intro">
          Vous avez rencontre un bug ou souhaitez suggerer une amelioration ?
          Decrivez le probleme ci-dessous.
        </p>

        <form onSubmit={handleSubmit} className="signalement-form">
          <div className="form-group">
            <label htmlFor="report-page">Page concernee *</label>
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
              placeholder="Resumez le probleme en quelques mots"
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
              placeholder="Decrivez le probleme en detail : etapes, comportement attendu et observe..."
              disabled={submitting}
              rows={4}
            />
          </div>

          {submitError && <div className="alert alert-error">{submitError}</div>}
          {submitSuccess && <div className="alert alert-success">Signalement envoye avec succes !</div>}

          <button type="submit" disabled={submitting} className="btn-submit">
            {submitting ? 'Envoi...' : 'Envoyer le signalement'}
          </button>
        </form>
      </div>

      <div className="signalements-section">
        <h4 className="signalements-section-title">Mes signalements recents</h4>

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
