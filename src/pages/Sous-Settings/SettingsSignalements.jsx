/**
 * SettingsSignalements - Page de signalement de problèmes intégrée aux Settings
 * 
 * Remplace le FAB (IssueReportButton) par un formulaire dans les paramètres
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { UserInfoBanner } from '../../components/UserInfoBanner';
import './SettingsSignalements.css';

const PAGE_OPTIONS = [
  { value: '', label: 'Sélectionner une page...' },
  { value: 'ir', label: 'Simulateur IR' },
  { value: 'credit', label: 'Simulateur Crédit' },
  { value: 'placement', label: 'Simulateur Placement' },
  { value: 'audit', label: 'Audit Patrimonial' },
  { value: 'strategy', label: 'Stratégie' },
  { value: 'settings', label: 'Paramètres' },
  { value: 'other', label: 'Autre' },
];

export default function SettingsSignalements() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [page, setPage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    try {
      setLoadingReports(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('issue_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err) {
      console.error('[SettingsSignalements] Error loading reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !page) {
      setError('Veuillez remplir le titre et sélectionner une page.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour soumettre un signalement.');
        return;
      }

      const metadata = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      };

      const { error: insertError } = await supabase
        .from('issue_reports')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          page,
          metadata,
          status: 'new',
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTitle('');
      setDescription('');
      setPage('');
      loadMyReports();
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('[SettingsSignalements] Submit error:', err);
      setError('Erreur lors de l\'envoi du signalement. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'Nouveau',
      in_progress: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
    };
    return labels[status] || status;
  };

  return (
    <div className="settings-signalements">
      <UserInfoBanner />

      <div className="signalements-section">
        <h3>Signaler un problème</h3>
        <p className="signalements-intro">
          Vous avez rencontré un bug ou souhaitez suggérer une amélioration ? 
          Décrivez le problème ci-dessous.
        </p>

        <form onSubmit={handleSubmit} className="signalement-form">
          <div className="form-group">
            <label htmlFor="page">Page concernée *</label>
            <select
              id="page"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              disabled={submitting}
              required
            >
              {PAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Titre *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Résumez le problème en quelques mots"
              disabled={submitting}
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème en détail : étapes pour reproduire, comportement attendu vs observé..."
              disabled={submitting}
              rows={5}
            />
          </div>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">Signalement envoyé avec succès !</div>}

          <button type="submit" disabled={submitting} className="btn-submit">
            {submitting ? 'Envoi...' : 'Envoyer le signalement'}
          </button>
        </form>
      </div>

      <div className="signalements-section" style={{ marginTop: 24 }}>
        <h3>Mes signalements récents</h3>
        {loadingReports ? (
          <p className="loading-text">Chargement...</p>
        ) : reports.length === 0 ? (
          <p className="empty-text">Aucun signalement pour le moment.</p>
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
                  <span>{PAGE_OPTIONS.find(p => p.value === report.page)?.label || report.page}</span>
                  <span>•</span>
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
