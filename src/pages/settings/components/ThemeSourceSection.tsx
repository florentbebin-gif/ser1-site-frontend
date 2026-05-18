import type { ThemeColors } from '@/settings/theme';
import type { ThemeMode } from '@/settings/theme/types';
import { PREDEFINED_THEMES, type ThemeCard } from '../hooks/useThemePaletteEditor';

interface ThemeSourceSectionProps {
  themeMode: ThemeMode;
  presetId: string | null;
  myPalette: ThemeColors | null;
  onCabinetSelect: () => void;
  onCustomSelect: () => void;
  onMyThemeSelect: () => void;
  onPresetSelect: (_theme: ThemeCard) => void;
}

export function ThemeSourceSection({
  themeMode,
  presetId,
  myPalette,
  onCabinetSelect,
  onCustomSelect,
  onMyThemeSelect,
  onPresetSelect,
}: ThemeSourceSectionProps) {
  return (
    <div className="settings-premium-section">
      <h3 className="settings-section-title">Source du thème</h3>
      <div className="settings-source-options">
        <label className="settings-radio-option">
          <input
            type="radio"
            name="themeSource"
            value="cabinet"
            checked={themeMode === 'cabinet'}
            onChange={onCabinetSelect}
          />
          <span>Thème du cabinet</span>
        </label>
        <label className="settings-radio-option">
          <input
            type="radio"
            name="themeSource"
            value="custom"
            checked={themeMode !== 'cabinet'}
            onChange={onCustomSelect}
          />
          <span>Thème personnalisé</span>
        </label>
      </div>
      {themeMode !== 'cabinet' && (
        <div className="settings-premium-section">
          <div className="settings-theme-cards">
            {myPalette && (
              <button
                type="button"
                className={`settings-theme-card ${themeMode === 'my' ? 'is-selected' : ''}`}
                onClick={onMyThemeSelect}
                aria-pressed={themeMode === 'my'}
              >
                <div className="settings-theme-preview">
                  {Object.values(myPalette)
                    .slice(0, 5)
                    .map((color, index) => (
                      <div
                        key={index}
                        className="settings-theme-preview-bar"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                </div>
                <div className="settings-theme-name">Mon thème</div>
              </button>
            )}

            {PREDEFINED_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`settings-theme-card ${
                  themeMode === 'preset' && presetId === theme.id ? 'is-selected' : ''
                }`}
                onClick={() => onPresetSelect(theme)}
                aria-pressed={themeMode === 'preset' && presetId === theme.id}
              >
                <div className="settings-theme-preview">
                  {Object.values(theme.colors)
                    .slice(0, 5)
                    .map((color, index) => (
                      <div
                        key={index}
                        className="settings-theme-preview-bar"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                </div>
                <div className="settings-theme-name">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
