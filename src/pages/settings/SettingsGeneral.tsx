import { useSearchParams } from 'react-router';

import { UserInfoBanner } from '@/components/UserInfoBanner';
import { useThemePaletteEditor } from './hooks/useThemePaletteEditor';
import { useSettingsUser } from './hooks/useSettingsUser';
import { SignalementsSection } from './components/SignalementsSection';
import { ThemeColorsSection } from './components/ThemeColorsSection';
import { ThemeSourceSection } from './components/ThemeSourceSection';

export default function SettingsGeneral() {
  const { user, loading } = useSettingsUser();
  const palette = useThemePaletteEditor();
  const [searchParams] = useSearchParams();
  const openAssistance = searchParams.get('focus') === 'assistance';

  if (loading) {
    return <p>Chargement…</p>;
  }

  if (!user) {
    return <p>Aucun utilisateur connecté.</p>;
  }

  return (
    <div className="settings-stack settings-stack--spacious">
      <UserInfoBanner />

      <section className="settings-premium-card">
        <header className="settings-premium-header settings-premium-header--row">
          <div className="settings-action-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="13.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="10.5" r="2.5" />
              <circle cx="8.5" cy="7.5" r="2.5" />
              <circle cx="6.5" cy="12.5" r="2.5" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.6 1.6 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </div>
          <div className="settings-action-text">
            <h2 className="settings-premium-title">Personnalisation avancée du thème</h2>
            <p className="settings-premium-subtitle">
              Adaptez l'interface à votre identité visuelle : couleurs de marque, accents graphiques
              et ambiance générale.
            </p>
          </div>
        </header>

        <div className="settings-section-divider" />

        <ThemeSourceSection
          themeMode={palette.themeMode}
          presetId={palette.presetId}
          myPalette={palette.myPalette}
          onCabinetSelect={() => void palette.applyThemeMode('cabinet')}
          onCustomSelect={palette.handleCustomSourceSelect}
          onMyThemeSelect={() => void palette.handleMyThemeSelect()}
          onPresetSelect={(theme) => void palette.handlePresetSelect(theme)}
        />

        {palette.themeMode === 'my' && (
          <div className="settings-premium-actions settings-premium-actions--end">
            <button
              type="button"
              className="settings-action-btn"
              onClick={() => void palette.handleSaveMyPalette()}
              disabled={palette.savingColors || !user}
              title="Enregistrer votre palette personnalisée"
            >
              {palette.savingColors ? 'Enregistrement…' : 'Enregistrer mon thème'}
            </button>
          </div>
        )}

        {palette.saveMessage && (
          <div className="settings-premium-section">
            <div
              className={`settings-feedback-panel ${
                palette.saveMessage.includes('Erreur')
                  ? 'settings-feedback-panel--error'
                  : 'settings-feedback-panel--success'
              }`}
            >
              {palette.saveMessage}
            </div>
          </div>
        )}

        {palette.themeMode === 'my' && (
          <ThemeColorsSection
            colorsLegacy={palette.colorsLegacy}
            colorText={palette.colorText}
            showAdvancedColors={palette.showAdvancedColors}
            duplicateThemes={palette.duplicateThemes}
            duplicateThemeId={palette.duplicateThemeId}
            onDuplicateThemeChange={palette.setDuplicateThemeId}
            onDuplicateTheme={() => palette.handleDuplicateThemeToMyTheme()}
            onToggleAdvancedColors={palette.toggleAdvancedColors}
            onColorChange={palette.handleColorChange}
          />
        )}
      </section>

      <SignalementsSection initialOpen={openAssistance} />
    </div>
  );
}
