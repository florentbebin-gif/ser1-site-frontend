import React, { useMemo, useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';
import { COLOR_USAGE_GUIDELINES } from '@/settings/theme/colorUsageGuidelines';
import { DEFAULT_COLORS } from '@/settings/theme';

type ThemePalette = Record<string, string>;

interface ThemeRecord {
  id?: string;
  name?: string | null;
  palette?: ThemePalette | null;
  is_system?: boolean;
}

interface ThemeEditModalProps {
  theme?: ThemeRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ThemeFormState {
  name: string;
  palette: ThemePalette;
}

const defaultPalette: ThemePalette = { ...DEFAULT_COLORS };

export default function ThemeEditModal({
  theme,
  onClose,
  onSuccess,
}: ThemeEditModalProps): React.ReactElement {
  const [form, setForm] = useState<ThemeFormState>(() => (
    theme
      ? {
          name: theme.name || '',
          palette: { ...defaultPalette, ...(theme.palette || {}) },
        }
      : {
          name: '',
          palette: { ...defaultPalette },
        }
  ));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const colorFields = useMemo(
    () => COLOR_USAGE_GUIDELINES.map(({ themeKey, token, usage }) => ({
      key: themeKey,
      token,
      help: usage,
    })),
    [],
  );

  const handleThemePaletteChange = (colorKey: string, value: string): void => {
    setForm((prev) => ({
      ...prev,
      palette: { ...prev.palette, [colorKey]: value },
    }));
  };

  const handleSaveTheme = async (): Promise<void> => {
    if (!form.name.trim()) {
      setError('Le nom du theme est requis.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (theme?.id) {
        await adminClient.updateTheme({
          id: theme.id,
          name: form.name.trim(),
          palette: form.palette,
        });

        if (theme.is_system) {
          window.dispatchEvent(new CustomEvent('ser1-original-theme-updated'));
        }
      } else {
        await adminClient.createTheme({
          name: form.name.trim(),
          palette: form.palette,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement du theme.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal report-modal--md">
        <div className="report-modal-header">
          <h3>{theme ? 'Modifier le theme' : 'Nouveau theme'}</h3>
          <button className="report-modal-close" onClick={onClose} type="button">X</button>
        </div>
        <div className="report-modal-content">
          {error && (
            <div className="settings-feedback-panel settings-feedback-panel--error settings-modal-message">
              {error}
            </div>
          )}
          {theme?.is_system && (
            <div className="settings-feedback-panel settings-feedback-panel--info settings-modal-message">
              Theme systeme : modifiable mais non supprimable.
            </div>
          )}
          <div className="settings-modal-field">
            <label className="settings-modal-label">
              Nom du theme *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Ex: Bleu patrimonial"
              className="settings-modal-control"
            />
          </div>
          <div className="settings-modal-field">
            <label className="settings-modal-label">
              Palette (10 couleurs)
            </label>
            <p className="theme-palette-help">Survolez C1 a C10 pour voir la norme d'usage.</p>
            <div className="theme-palette-grid">
              {colorFields.map(({ key, token, help }) => {
                const tooltipId = `theme-color-help-${key}`;
                const colorValue = form.palette[key] || defaultPalette[key];

                return (
                  <div key={key} className="theme-palette-item">
                    <span className="theme-palette-token-wrap">
                      <span className="theme-palette-token" tabIndex={0} aria-describedby={tooltipId}>
                        {token}
                      </span>
                      <span id={tooltipId} role="tooltip" className="theme-palette-tooltip">
                        {help}
                      </span>
                    </span>
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleThemePaletteChange(key, e.target.value);
                      }}
                      className="settings-modal-color-picker"
                    />
                    <input
                      type="text"
                      value={colorValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleThemePaletteChange(key, e.target.value);
                      }}
                      className="settings-modal-token-input"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="report-modal-actions">
          <button onClick={onClose} type="button">Annuler</button>
          <button
            className="chip"
            onClick={() => {
              void handleSaveTheme();
            }}
            disabled={saving}
            type="button"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
