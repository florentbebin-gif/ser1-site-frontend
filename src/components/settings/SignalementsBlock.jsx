/**
 * SignalementsBlock - Composant rétractable pour les signalements de problèmes
 * Intégré dans Settings.jsx (onglet Généraux)
 * 
 * Fonctionnalités:
 * - Formulaire de signalement de problèmes
 * - Liste des 10 derniers signalements de l'utilisateur
 * - Affichage rétractable (collapsible)
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { REPORT_PAGE_OPTIONS, getPageLabel, getStatusLabel } from '../../constants/reportPages';
import './SignalementsBlock.css';

export default function SignalementsBlock() {
  // État du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [page, setPage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // État de la liste
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Chargement initial des signalements
  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    try {
      setLoadingReports(true);
      setLoadError('');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setLoadError('Vous devez être connecté pour voir vos signalements.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('issue_reports')
        .select('id, title, page, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err) {
      console.error('[SignalementsBlock] Error loading reports:', err);
      setLoadError('Erreur lors du chargement des signalements.');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !page) {
      setSubmitError('Veuillez remplir le titre et sélectionner une page.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setSubmitError('Vous devez être connecté pour soumettre un signalement.');
        return;
      }

      // CORRECTION: utiliser 'meta' et non 'metadata' (nom de colonne Supabase)
      const meta = {
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
          description: description.trim() || null,
          page,
          meta, // ← CORRECTION: 'meta' et non 'metadata'
          status: 'new',
        });

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setPage('');
      loadMyReports();

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('[SignalementsBlock] Submit error:', err);
      setSubmitError(`Erreur lors de l'envoi: ${err.message || 'Veuillez réessayer.'}`);
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

  return (
    <div className="signalements-block">
      {/* Formulaire de signalement */}
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
              onChange={(e) => setPage(e.target.value)}
              disabled={submitting}
              required
            >
              {REPORT_PAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème en détail : étapes pour reproduire, comportement attendu vs observé..."
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

      {/* Liste des signalements */}
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
