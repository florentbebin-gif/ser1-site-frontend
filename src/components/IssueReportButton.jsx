import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './IssueReport.css';

export default function IssueReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setMessage('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.auth.getSession();

      if (!user) {
        setMessage('Erreur : utilisateur non connecté');
        return;
      }

      const { error } = await supabase.from('issue_reports').insert({
        user_id: user.id,
        page: window.location.pathname,
        title: title.trim(),
        description: description.trim(),
        meta: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }
      });

      if (error) {
        const errorMsg = error.status 
          ? `Erreur HTTP ${error.status} : ${error.message}`
          : `Erreur lors de l'envoi : ${error.message}`;
        setMessage(errorMsg);
      } else {
        setMessage('Problème signalé avec succès !');
        setTitle('');
        setDescription('');
        setTimeout(() => {
          setIsOpen(false);
          setMessage('');
        }, 2000);
      }
    } catch (err) {
      console.error('🔍 IssueReport - Exception catch:', err);
      setMessage('Erreur inattendue : ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        className="issue-report-button"
        onClick={() => setIsOpen(true)}
        title="Signaler un problème"
        aria-label="Signaler un problème"
      >
        <svg className="issue-report-icon" viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path
            d="M12 3 2.5 20.5h19L12 3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="9"
            x2="12"
            y2="14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="17" r="1.2" fill="currentColor" />
        </svg>
      </button>
    );
  }

  return (
    <div className="issue-report-overlay">
      <div className="issue-report-modal">
        <div className="issue-report-header">
          <h3>Signaler un problème</h3>
          <button
            className="issue-report-close"
            onClick={() => {
              setIsOpen(false);
              setMessage('');
              setTitle('');
              setDescription('');
            }}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="issue-report-form">
          <div className="form-group">
            <label>Titre du problème *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Calcul incorrect sur la page IR"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description détaillée *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème, les étapes pour le reproduire, et ce que vous attendiez..."
              rows={4}
              required
            />
          </div>
          
          {message && (
            <div className={`issue-report-message ${message.includes('succès') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          <div className="issue-report-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
