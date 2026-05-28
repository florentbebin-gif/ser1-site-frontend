import React from 'react';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import type { ThemeSummary } from './SettingsComptesSections.types';
import { DeleteIcon, EditIcon, ThemesIcon } from './SettingsComptesIcons';

interface SettingsThemesSectionProps {
  themes: ThemeSummary[];
  themesLoading: boolean;
  onCreateTheme: () => void;
  onEditTheme: (theme: ThemeSummary) => void;
  onDeleteTheme: (theme: ThemeSummary) => void;
}

export function SettingsThemesSection({
  themes,
  themesLoading,
  onCreateTheme,
  onEditTheme,
  onDeleteTheme,
}: SettingsThemesSectionProps): React.ReactElement {
  return (
    <div className="settings-section-card--mt">
      <SettingsSectionCard
        title={`Thèmes globaux (${themes.length})`}
        subtitle="Palettes de couleurs appliquées aux cabinets."
        icon={<ThemesIcon />}
        collapsible
        defaultOpen={false}
        actions={
          <button
            className="chip admin-section-chip"
            onClick={onCreateTheme}
            disabled={themesLoading}
            type="button"
          >
            + Nouveau thème
          </button>
        }
      >
        {themesLoading ? (
          <p>Chargement des thèmes...</p>
        ) : themes.length === 0 ? (
          <p className="admin-section-empty">Aucun thème créé.</p>
        ) : (
          <div className="admin-cards-grid">
            {themes.map((theme) => (
              <div key={theme.id} className="admin-card-compact">
                <div className="admin-card-compact__info">
                  <div className="admin-card-compact__name admin-card-compact__name--flex">
                    {theme.name}
                  </div>
                  <div className="admin-card-compact__palette">
                    {theme.palette &&
                      Object.entries(theme.palette)
                        .slice(0, 6)
                        .map(([key, color]) => (
                          <div
                            key={key}
                            className="admin-card-compact__palette-color"
                            style={{ backgroundColor: color }}
                            title={`${key}: ${color}`}
                          />
                        ))}
                  </div>
                </div>
                <div className="admin-card-compact__actions">
                  {theme.is_system && (
                    <span className="theme-badge-sys theme-badge-sys--mr">SYS</span>
                  )}
                  <button
                    className="icon-btn admin-card-compact__action-btn--sm"
                    onClick={() => onEditTheme(theme)}
                    title="Modifier"
                    aria-label="Modifier le thème"
                    type="button"
                  >
                    <EditIcon />
                  </button>
                  {!theme.is_system && (
                    <button
                      className="icon-btn danger admin-card-compact__action-btn--sm"
                      onClick={() => onDeleteTheme(theme)}
                      title="Supprimer"
                      aria-label="Supprimer le thème"
                      type="button"
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSectionCard>
    </div>
  );
}
