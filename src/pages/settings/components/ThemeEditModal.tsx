// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { invokeAdmin } from '@/services/apiAdmin';
import { COLOR_USAGE_GUIDELINES } from '@/constants/colorUsageGuidelines';
import { DEFAULT_COLORS } from '@/settings/theme';

export default function ThemeEditModal({
  theme,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState(() => (
    theme
      ? {
        name: theme.name || '',
        palette: theme.palette || { ...DEFAULT_COLORS },
      }
      : {
        name: '',
        palette: { ...DEFAULT_COLORS },
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

  const handleThemePaletteChange = (colorKey, value) => {
    setForm((prev) => ({
      ...prev,
      palette: { ...prev.palette, [colorKey]: value },
    }));
  };

  const handleSaveTheme = async () => {
    if (!form.name.trim()) {
      setError('Le nom du thème est requis.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (theme) {
        const { error: invokeError } = await invokeAdmin('update_theme', {
          id: theme.id,
          name: form.name.trim(),
          palette: form.palette,
        });
        if (invokeError) throw new Error(invokeError.message);

        if (theme.is_system) {
          window.dispatchEvent(new CustomEvent('ser1-original-theme-updated'));
        }
      } else {
        const { error: invokeError } = await invokeAdmin('create_theme', {
          name: form.name.trim(),
          palette: form.palette,
        });
        if (invokeError) throw new Error(invokeError.message);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="report-modal-header">
          <h3>{theme ? 'Modifier le thème' : 'Nouveau thème'}</h3>
          <button className="report-modal-close" onClick={onClose}>✕</button>
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
              Thème système : modifiable mais ne peut pas être supprimé.
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Nom du thème *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Palette (10 couleurs)</label>
            <p className="theme-palette-help">
              Survolez C1 a C10 pour voir la norme d usage.
            </p>
            <div className="theme-palette-grid">
              {colorFields.map(({ key, token, help }) => {
                const tooltipId = `theme-color-help-${key}`;
                const colorValue = form.palette?.[key] || DEFAULT_COLORS[key];
                return (
                  <div key={key} className="theme-palette-item">
                    <span className="theme-palette-token-wrap">
                      <span
                        className="theme-palette-token"
                        tabIndex={0}
                        aria-describedby={tooltipId}
                      >
                        {token}
                      </span>
                      <span id={tooltipId} role="tooltip" className="theme-palette-tooltip">
                        {help}
                      </span>
                    </span>
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => handleThemePaletteChange(key, e.target.value)}
                      style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={colorValue}
                      onChange={(e) => handleThemePaletteChange(key, e.target.value)}
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
          <button onClick={onClose}>Annuler</button>
          <button
            className="chip"
            onClick={handleSaveTheme}
            disabled={saving}
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

