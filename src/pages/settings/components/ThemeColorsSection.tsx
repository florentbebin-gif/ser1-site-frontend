import { SimActionButton } from '@/components/ui/sim';
import {
  COLOR_FIELDS,
  type LegacyColorKey,
  type LegacyColors,
  type ThemeCard,
} from '../hooks/useThemePaletteEditor';

interface ThemeColorsSectionProps {
  colorsLegacy: LegacyColors;
  colorText: LegacyColors;
  showAdvancedColors: boolean;
  duplicateThemes: ThemeCard[];
  duplicateThemeId: string;
  onDuplicateThemeChange: (_themeId: string) => void;
  onDuplicateTheme: () => void;
  onToggleAdvancedColors: () => void;
  onColorChange: (_key: LegacyColorKey, _value: string) => void;
}

export function ThemeColorsSection({
  colorsLegacy,
  colorText,
  showAdvancedColors,
  duplicateThemes,
  duplicateThemeId,
  onDuplicateThemeChange,
  onDuplicateTheme,
  onToggleAdvancedColors,
  onColorChange,
}: ThemeColorsSectionProps) {
  return (
    <div className="settings-premium-section">
      <h3 className="settings-section-title">Couleurs de l'interface</h3>
      <p className="settings-premium-note">
        Modifiez la couleur principale (C1) pour adapter automatiquement toute la palette. Les
        couleurs structurelles se calculent à partir de celle-ci ; C6 reste la signature cuivre.
      </p>
      <div className="settings-theme-duplicate">
        <label className="settings-theme-duplicate__label" htmlFor="theme-duplicate-source">
          Thème à dupliquer
        </label>
        <div className="settings-theme-duplicate__controls">
          <select
            id="theme-duplicate-source"
            className="settings-theme-duplicate__select"
            value={duplicateThemeId}
            onChange={(event) => onDuplicateThemeChange(event.target.value)}
          >
            {duplicateThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
          <SimActionButton
            variant="duplicate"
            mode="icon"
            label="Dupliquer"
            ariaLabel="Dupliquer le thème choisi"
            className="settings-theme-duplicate__button"
            onClick={onDuplicateTheme}
            disabled={duplicateThemes.length === 0}
          />
        </div>
      </div>

      <div className="settings-colors-grid">
        <ColorRow
          colorKey="color1"
          description={COLOR_FIELDS[0]?.description ?? ''}
          colorsLegacy={colorsLegacy}
          colorText={colorText}
          onColorChange={onColorChange}
        />
      </div>

      <button type="button" onClick={onToggleAdvancedColors} className="settings-premium-toggle">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            showAdvancedColors ? 'settings-chevron settings-chevron--open' : 'settings-chevron'
          }
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span>
          {showAdvancedColors ? 'Masquer les couleurs avancées' : 'Afficher les couleurs avancées'}
        </span>
      </button>

      {showAdvancedColors && (
        <div className="settings-colors-grid">
          {COLOR_FIELDS.slice(1).map(({ key, description }) => (
            <ColorRow
              key={key}
              colorKey={key}
              description={description}
              colorsLegacy={colorsLegacy}
              colorText={colorText}
              onColorChange={onColorChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ColorRowProps {
  colorKey: LegacyColorKey;
  description: string;
  colorsLegacy: LegacyColors;
  colorText: LegacyColors;
  onColorChange: (_key: LegacyColorKey, _value: string) => void;
}

function ColorRow({
  colorKey,
  description,
  colorsLegacy,
  colorText,
  onColorChange,
}: ColorRowProps) {
  return (
    <div className="settings-color-row">
      <div className="settings-color-info">
        <span className="settings-color-desc">{description}</span>
      </div>
      <div className="settings-color-inputs">
        <input
          type="color"
          value={colorsLegacy[colorKey]}
          onChange={(event) => onColorChange(colorKey, event.target.value)}
        />
        <code className="settings-color-hex">
          {(colorText[colorKey] ?? colorsLegacy[colorKey]).toUpperCase()}
        </code>
      </div>
    </div>
  );
}
