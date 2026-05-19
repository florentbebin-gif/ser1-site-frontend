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
  collapsible?: boolean;
  defaultOpen?: boolean;
  titleId?: string;
  panelId?: string;
}

export default function SettingsSectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  style,
  collapsible = false,
  defaultOpen = true,
  titleId,
  panelId,
}: SettingsSectionCardProps): React.ReactElement {
  const generatedId = React.useId();
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const headingId = titleId ?? `${generatedId}-title`;
  const contentId = panelId ?? `${generatedId}-panel`;

  return (
    <section className="settings-premium-card" style={style}>
      <header className="settings-premium-header settings-premium-header--row">
        <div className="settings-action-icon">{icon}</div>
        <div className="settings-action-text settings-premium-header__body">
          <div>
            <h3 id={headingId} className="settings-premium-title settings-premium-title--flush">
              {title}
            </h3>
            {subtitle && <p className="settings-premium-subtitle">{subtitle}</p>}
          </div>
          {(actions || collapsible) && (
            <div className="settings-premium-actions">
              {actions}
              {collapsible && (
                <button
                  className="settings-section-collapse-btn"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  aria-label={`${isOpen ? 'Replier' : 'Afficher'} la section ${title}`}
                  onClick={() => setIsOpen((current) => !current)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={isOpen ? 'M18 15 12 9 6 15' : 'M6 9l6 6 6-6'} />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      {(!collapsible || isOpen) && (
        <div
          id={contentId}
          className="settings-section-panel"
          role={collapsible ? 'region' : undefined}
          aria-labelledby={collapsible ? headingId : undefined}
        >
          {children}
        </div>
      )}
    </section>
  );
}
