import React from 'react';

/**
 * SettingsSectionCard - Carte premium reutilisable pour les sections Settings.
 *
 * Replique exactement le pattern visuel de Settings.jsx :
 * - Carte blanche avec bordure et radius (`.settings-premium-card`)
 * - Header avec badge icone + titre + sous-titre optionnel
 * - Zone actions a droite du titre (boutons)
 * - Contenu libre en children
 */
interface SettingsSectionCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function SettingsSectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  style,
}: SettingsSectionCardProps): React.ReactElement {
  return (
    <section className="settings-premium-card" style={style}>
      <header className="settings-premium-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div className="settings-action-icon">
          {icon}
        </div>
        <div
          className="settings-action-text"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minHeight: 32 }}
        >
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
