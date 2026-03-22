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
      <div className="report-modal" style={{ maxWidth: 600 }}>
        <div className="report-modal-header">
          <h3>{theme ? 'Modifier le theme' : 'Nouveau theme'}</h3>
          <button className="report-modal-close" onClick={onClose} type="button">X</button>
        </div>
        <div className="report-modal-content">
          {error && (
            <div
              style={{
                padding: '12px',
                background: 'var(--color-error-bg)',
                border: '1px solid var(--color-error-border)',
                color: 'var(--color-error-text)',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          {theme?.is_system && (
            <div
              style={{
                padding: 12,
                marginBottom: 16,
                background: 'var(--color-c3)',
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              Theme systeme : modifiable mais non supprimable.
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
              Nom du theme *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Ex: Bleu patrimonial"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--color-c8)',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
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
                      style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={colorValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleThemePaletteChange(key, e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '4px',
                        border: '1px solid var(--color-c8)',
                        borderRadius: 4,
                        fontSize: 10,
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        marginTop: 4,
                      }}
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
            style={{ opacity: saving ? 0.6 : 1 }}
            type="button"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
