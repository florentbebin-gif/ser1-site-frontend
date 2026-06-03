import React, { useMemo, useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';
import { COLOR_USAGE_GUIDELINES } from '@/settings/theme/colorUsageGuidelines';
import { DEFAULT_COLORS } from '@/settings/theme';
import SettingsModalShell from './SettingsModalShell';

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
  const [form, setForm] = useState<ThemeFormState>(() =>
    theme
      ? {
          name: theme.name || '',
          palette: { ...defaultPalette, ...(theme.palette || {}) },
        }
      : {
          name: '',
          palette: { ...defaultPalette },
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const colorFields = useMemo(
    () =>
      COLOR_USAGE_GUIDELINES.map(({ themeKey, token, usage }) => ({
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
      setError('Le nom du thème est requis.');
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
      setError(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement du thème.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsModalShell
      title={theme ? 'Modifier le thème' : 'Nouveau thème'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose} type="button">
            Annuler
          </button>
          <button
            className="sim-modal-btn sim-modal-btn--primary"
            onClick={() => {
              void handleSaveTheme();
            }}
            disabled={saving}
            type="button"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>
      }
    >
      {error && (
        <div className="settings-feedback-panel settings-feedback-panel--error settings-modal-message">
          {error}
        </div>
      )}
      {theme?.is_system && (
        <div className="settings-feedback-panel settings-feedback-panel--info settings-modal-message">
          Thème système : modifiable mais non supprimable.
        </div>
      )}
      <div className="settings-modal-field">
        <label className="settings-modal-label" htmlFor="theme-name">
          Nom du thème *
        </label>
        <input
          id="theme-name"
          type="text"
          value={form.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, name: e.target.value }));
          }}
          placeholder="Ex: Thème cabinet"
          className="settings-modal-control"
        />
      </div>
      <div className="settings-modal-field">
        <div className="settings-modal-label">Palette (10 couleurs)</div>
        <p className="theme-palette-help">Survolez C1 à C10 pour voir la norme d’usage.</p>
        <div className="theme-palette-grid">
          {colorFields.map(({ key, token, help }) => {
            const tooltipId = `theme-color-help-${key}`;
            const colorValue = form.palette[key] || defaultPalette[key];

            return (
              <div key={key} className="theme-palette-item">
                <span className="theme-palette-token-wrap">
                  <button
                    type="button"
                    className="theme-palette-token"
                    aria-describedby={tooltipId}
                  >
                    {token}
                  </button>
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
    </SettingsModalShell>
  );
}
