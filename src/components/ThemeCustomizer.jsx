/**
 * Composant de personnalisation du thème
 * Permet aux utilisateurs de modifier les couleurs de l'interface
 */

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

const DEFAULT_COLOR_PRESETS = [
  { name: 'Vert Forêt', colors: { primary: '#2d5a3d', primaryHover: '#1f3d2a', secondary: '#e8c547' } },
  { name: 'Bleu Océan', colors: { primary: '#2563eb', primaryHover: '#1d4ed8', secondary: '#f59e0b' } },
  { name: 'Gris Moderne', colors: { primary: '#374151', primaryHover: '#1f2937', secondary: '#10b981' } },
  { name: 'Rouge Passion', colors: { primary: '#dc2626', primaryHover: '#b91c1c', secondary: '#fbbf24' } }
];

function ThemeCustomizer() {
  const { colors, saveTheme, resetToDefault, isCustom, loading } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [tempColors, setTempColors] = useState(colors);
  const [saving, setSaving] = useState(false);

  const handleColorChange = (colorKey, value) => {
    setTempColors(prev => ({ ...prev, [colorKey]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveTheme(tempColors);
    setSaving(false);
    
    if (result.success) {
      setIsEditing(false);
    } else {
      alert('Erreur lors de la sauvegarde: ' + result.error);
    }
  };

  const handleReset = async () => {
    if (confirm('Réinitialiser au thème par défaut ?')) {
      const result = await resetToDefault();
      if (!result.success) {
        alert('Erreur lors de la réinitialisation: ' + result.error);
      }
    }
  };

  const applyPreset = (preset) => {
    setTempColors(prev => ({ ...prev, ...preset.colors }));
  };

  if (loading) {
    return (
      <div className="theme-customizer-loading">
        <div>Chargement du thème...</div>
      </div>
    );
  }

  return (
    <div className="theme-customizer">
      <div className="theme-customizer-header">
        <h3>Personnalisation du thème</h3>
        <div className="theme-status">
          {isCustom ? (
            <span className="theme-badge theme-custom">✨ Personnalisé</span>
          ) : (
            <span className="theme-badge theme-default">🎨 Par défaut</span>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="theme-preview">
          <div className="color-grid">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="color-item">
                <div 
                  className="color-swatch" 
                  style={{ backgroundColor: value }}
                />
                <div className="color-info">
                  <div className="color-name">{key}</div>
                  <div className="color-value">{value}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="theme-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Modifier
            </button>
            {isCustom && (
              <button 
                className="btn btn-secondary"
                onClick={handleReset}
              >
                🔄 Réinitialiser
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="theme-editor">
          <div className="presets-section">
            <h4>Préréglages rapides</h4>
            <div className="presets-grid">
              {DEFAULT_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className="preset-btn"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="preset-preview">
                    <div style={{ backgroundColor: preset.colors.primary }} />
                    <div style={{ backgroundColor: preset.colors.secondary }} />
                  </div>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="colors-section">
            <h4>Couleurs personnalisées</h4>
            <div className="color-inputs-grid">
              {Object.entries(tempColors).map(([key, value]) => (
                <div key={key} className="color-input">
                  <label>{key}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="editor-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setTempColors(colors);
              }}
            >
              Annuler
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeCustomizer;
