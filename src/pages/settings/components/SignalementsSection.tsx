import { useState } from 'react';
import SignalementsBlock from '@/components/settings/SignalementsBlock';

export function SignalementsSection() {
  const [showSignalements, setShowSignalements] = useState(false);

  return (
    <section className="settings-premium-card settings-action-card">
      <header className="settings-premium-header">
        <div className="settings-action-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="settings-action-text">
          <h2 className="settings-premium-title">Assistance & Suggestions</h2>
          <p className="settings-premium-subtitle">
            Une question ou une suggestion ? Notre équipe est à votre écoute.
          </p>
        </div>
      </header>

      <div className="settings-action-footer">
        <button
          type="button"
          className="settings-action-btn"
          onClick={() => setShowSignalements((value) => !value)}
        >
          <span>{showSignalements ? 'Fermer' : 'Nous contacter'}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              showSignalements ? 'settings-chevron settings-chevron--open' : 'settings-chevron'
            }
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {showSignalements && (
        <div className="settings-action-content">
          <SignalementsBlock />
        </div>
      )}
    </section>
  );
}
