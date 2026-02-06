import React from 'react';

/**
 * SettingsSectionCard — Carte premium réutilisable pour les sections Settings.
 *
 * Réplique exactement le pattern visuel de Settings.jsx :
 * - Carte blanche avec bordure et radius (`.settings-premium-card`)
 * - Header avec badge icône + titre + sous-titre optionnel
 * - Zone actions à droite du titre (boutons)
 * - Contenu libre en children
 *
 * @param {Object} props
 * @param {string} props.title - Titre de la section
 * @param {string} [props.subtitle] - Sous-titre optionnel
 * @param {React.ReactNode} props.icon - SVG inline (stroke="currentColor", fill="none")
 * @param {React.ReactNode} [props.actions] - Boutons d'action (droite du header)
 * @param {React.ReactNode} props.children - Contenu de la section
 * @param {Object} [props.style] - Styles additionnels sur la carte
 */
export default function SettingsSectionCard({ title, subtitle, icon, actions, children, style }) {
  return (
    <section className="settings-premium-card" style={style}>
      <header className="settings-premium-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div className="settings-action-icon">
          {icon}
        </div>
        <div className="settings-action-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minHeight: 32 }}>
          <div>
            <h3 className="settings-premium-title" style={{ margin: 0 }}>{title}</h3>
            {subtitle && <p className="settings-premium-subtitle">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{actions}</div>}
        </div>
      </header>
      {children}
    </section>
  );
}
