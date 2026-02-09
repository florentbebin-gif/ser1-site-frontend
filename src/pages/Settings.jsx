import React, { useEffect, useState } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
import { useTheme } from '../settings/ThemeProvider';
import { UserInfoBanner } from '../components/UserInfoBanner';
import { recalculatePaletteFromC1 } from '../utils/paletteGenerator';
import SignalementsBlock from '../components/settings/SignalementsBlock';
import { DEFAULT_COLORS as DEFAULT_THEME_COLORS } from '../settings/theme';
import { PRESET_THEMES } from '../settings/presets';

// Mapper les couleurs du format theme (c1-c10) vers le format legacy (color1-color10)
const DEFAULT_COLORS = {
  color1: DEFAULT_THEME_COLORS.c1,
  color2: DEFAULT_THEME_COLORS.c2,
  color3: DEFAULT_THEME_COLORS.c3,
  color4: DEFAULT_THEME_COLORS.c4,
  color5: DEFAULT_THEME_COLORS.c5,
  color6: DEFAULT_THEME_COLORS.c6,
  color7: DEFAULT_THEME_COLORS.c7,
  color8: DEFAULT_THEME_COLORS.c8,
  color9: DEFAULT_THEME_COLORS.c9,
  color10: DEFAULT_THEME_COLORS.c10,
};

// Dériver le format legacy (color1-color10) depuis les presets partagés
const PREDEFINED_THEMES = PRESET_THEMES.map(t => ({
  id: t.id,
  name: t.name,
  description: t.description,
  colors: {
    color1: t.colors.c1, color2: t.colors.c2, color3: t.colors.c3,
    color4: t.colors.c4, color5: t.colors.c5, color6: t.colors.c6,
    color7: t.colors.c7, color8: t.colors.c8, color9: t.colors.c9,
    color10: t.colors.c10,
  },
}));

const COLOR_FIELDS = [
  { key: 'color1', description: 'Couleur principale de l\'interface — titres, barre supérieure et éléments structurants' },
  { key: 'color2', description: 'Couleur d\'accent et d\'interaction — boutons, liens, survol des éléments cliquables' },
  { key: 'color3', description: 'Couleur de validation et états positifs — succès, confirmations, étapes actives' },
  { key: 'color4', description: 'Fond d\'accent pour mettre en valeur — sections actives, lignes survolées, infos' },
  { key: 'color5', description: 'Bordures et séparateurs accentués — pour structurer sans agresser' },
  { key: 'color6', description: 'Touche chaude et élégante — lignes d\'accent décoratives, séparateurs raffinés' },
  { key: 'color7', description: 'Fond général de l\'interface — l\'arrière-plan discret de l\'application' },
  { key: 'color8', description: 'Bordures fines et légères — structure discrète des éléments' },
  { key: 'color9', description: 'Texte secondaire et explications — labels, métadonnées, informations complémentaires' },
  { key: 'color10', description: 'Texte principal et titres — le contraste maximum pour la lisibilité' },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Format legacy (color1-color10) pour les inputs couleur
  const [colorsLegacy, setColorsLegacy] = useState(DEFAULT_COLORS);
  const [colorText, setColorText] = useState(DEFAULT_COLORS);
  const [savingColors, setSavingColors] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // V5: useTheme — source de vérité unique
  const { 
    colors, 
    setColors, 
    isLoading: themeLoading, 
    logo, 
    setLogo,
    // V5 API
    themeMode,
    presetId,
    myPalette,
    applyThemeMode,
    saveMyPalette,
  } = useTheme();

  // Signalements block visibility
  const [showSignalements, setShowSignalements] = useState(false);
  
  // Advanced colors visibility
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  // V5: Synchroniser colorsLegacy depuis Provider quand les couleurs changent
  useEffect(() => {
    if (colors && !themeLoading) {
      const legacyColors = {
        color1: colors.c1, color2: colors.c2, color3: colors.c3,
        color4: colors.c4, color5: colors.c5, color6: colors.c6,
        color7: colors.c7, color8: colors.c8, color9: colors.c9,
        color10: colors.c10,
      };
      setColorsLegacy(legacyColors);
      setColorText(legacyColors);
    }
  }, [colors, themeLoading]);

  // Fonction pour synchroniser les couleurs avec ThemeProvider (preview live)
  const syncThemeColors = (settingsColors) => {
    setColors({
      c1: settingsColors.color1, c2: settingsColors.color2, c3: settingsColors.color3,
      c4: settingsColors.color4, c5: settingsColors.color5, c6: settingsColors.color6,
      c7: settingsColors.color7, c8: settingsColors.color8, c9: settingsColors.color9,
      c10: settingsColors.color10,
    });
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    async function loadUser() {
      try {
        if (DEBUG_AUTH) {
          // eslint-disable-next-line no-console
          console.debug('[Settings] loadUser:start');
        }
        // Timeout de 6s pour éviter le blocage infini
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('[Settings] Timeout lors du chargement utilisateur, utilisation des valeurs par défaut');
            setLoading(false);
          }
        }, 6000);

        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Erreur chargement user :', error);
          return;
        }

        const u = data?.user || null;
        if (!mounted) return;

        if (DEBUG_AUTH) {
          // eslint-disable-next-line no-console
          console.debug('[Settings] loadUser:success', { hasUser: !!u, userId: u?.id });
        }

        setUser(u);

        if (u) {
          const meta = u.user_metadata || {};

          // rôle Admin / User
          const isAdmin =
            (typeof meta.role === 'string' &&
              meta.role.toLowerCase() === 'admin') ||
            meta.is_admin === true;

          if (DEBUG_AUTH) {
            // eslint-disable-next-line no-console
            console.debug('[Settings] role detected', { userId: u.id, isAdmin, role: meta.role });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        // Annuler le timeout et forcer loading=false dans tous les cas
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [logo, setLogo]);

  /* ══════════ V5: Handlers déterministes ══════════ */

  const handleColorChange = (key, value) => {
    // Bloquer l'édition sauf en mode 'my'
    if (themeMode !== 'my') return;
    
    const newColors = { ...colorsLegacy, [key]: value };
    setColorsLegacy(newColors);
    setColorText(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setSaveMessage('');
    
    // If changing c1, recalculate other colors automatically
    if (key === 'color1') {
      const recalculated = recalculatePaletteFromC1(value);
      const finalColors = { ...newColors, ...recalculated };
      setColorsLegacy(finalColors);
      setColorText(prev => ({ ...prev, ...Object.fromEntries(
        Object.entries(recalculated).map(([k, v]) => [k, v.toUpperCase()])
      ) }));
      syncThemeColors(finalColors);
    } else {
      syncThemeColors(newColors);
    }
  };

  // V5: Clic sur un preset → applique + persiste theme_mode='preset'
  const handlePresetSelect = async (presetTheme) => {
    setSaveMessage('');
    await applyThemeMode('preset', presetTheme.id);
  };

  // V5: Clic sur "Mon thème" → applique + persiste theme_mode='my'
  const handleMyThemeSelect = async () => {
    setSaveMessage('');
    await applyThemeMode('my');
  };

  // V5: "Enregistrer Mon thème" → écrit my_palette + passe en mode 'my'
  const handleSaveMyPalette = async () => {
    try {
      setSavingColors(true);
      setSaveMessage('');

      // Protéger: ne sauvegarder que si mode = 'my' (l'utilisateur édite sa palette)
      if (themeMode !== 'my') {
        setSaveMessage('Passez sur "Mon thème" pour modifier et enregistrer votre palette.');
        return;
      }

      const paletteToSave = {
        c1: colorsLegacy.color1, c2: colorsLegacy.color2, c3: colorsLegacy.color3,
        c4: colorsLegacy.color4, c5: colorsLegacy.color5, c6: colorsLegacy.color6,
        c7: colorsLegacy.color7, c8: colorsLegacy.color8, c9: colorsLegacy.color9,
        c10: colorsLegacy.color10,
      };

      const result = await saveMyPalette(paletteToSave);

      if (result.success) {
        setSaveMessage('Thème personnalisé enregistré avec succès.');
      } else {
        setSaveMessage("Erreur lors de l'enregistrement : " + result.error);
      }
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSavingColors(false);
    }
  };

  /* ---------- Rendu ---------- */

  if (loading) {
    return <p>Chargement…</p>;
  }

  if (!user) {
    return <p>Aucun utilisateur connecté.</p>;
  }

  return (
    <>
      {/* Contenu onglet Généraux */}
      <div
          style={{
            fontSize: 16,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Infos utilisateur */}
          <UserInfoBanner />

          {/* Personnalisation avancée du thème */}
          <section className="settings-premium-card">
            <header className="settings-premium-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div className="settings-action-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r="2.5"/>
                  <circle cx="17.5" cy="10.5" r="2.5"/>
                  <circle cx="8.5" cy="7.5" r="2.5"/>
                  <circle cx="6.5" cy="12.5" r="2.5"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.6 1.6 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                </svg>
              </div>
              <div className="settings-action-text">
                <h2 className="settings-premium-title">Personnalisation avancée du thème</h2>
                <p className="settings-premium-subtitle">
                  Adaptez l'interface à votre identité visuelle : couleurs de marque,
                  accents graphiques et ambiance générale.
                </p>
              </div>
            </header>

            <div className="settings-premium-divider" />

            {/* V5: Section Source du thème */}
            <div className="settings-premium-section">
              <h3 className="settings-section-title">Source du thème</h3>
              <div className="settings-source-options">
                <label className="settings-radio-option">
                  <input
                    type="radio"
                    name="themeSource"
                    value="cabinet"
                    checked={themeMode === 'cabinet'}
                    onChange={() => applyThemeMode('cabinet')}
                  />
                  <span>Thème du cabinet</span>
                </label>
                <label className="settings-radio-option">
                  <input
                    type="radio"
                    name="themeSource"
                    value="custom"
                    checked={themeMode !== 'cabinet'}
                    onChange={() => {
                      // Passer en mode perso: appliquer "Mon thème" si existant, sinon premier preset
                      if (myPalette) {
                        applyThemeMode('my');
                      } else {
                        applyThemeMode('preset', PRESET_THEMES[0].id);
                      }
                    }}
                  />
                  <span>Thème personnalisé</span>
                </label>
              </div>
              {themeMode !== 'cabinet' && (
                <div style={{ marginTop: 20 }}>
                  <div className="settings-theme-cards" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '20px',
                    marginTop: '12px',
                  }}>
                    {/* V5: Tile "Mon thème" visible dès que myPalette existe */}
                    {myPalette && (
                      <div
                        className={`settings-theme-card ${themeMode === 'my' ? 'is-selected' : ''}`}
                        onClick={handleMyThemeSelect}
                      >
                        <div className="settings-theme-preview">
                          {Object.values(myPalette).slice(0, 5).map((color, i) => (
                            <div
                              key={i}
                              className="settings-theme-preview-bar"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="settings-theme-name">Mon thème</div>
                      </div>
                    )}

                    {/* V5: Preset cards */}
                    {PREDEFINED_THEMES.map((theme) => (
                      <div
                        key={theme.id}
                        className={`settings-theme-card ${themeMode === 'preset' && presetId === theme.id ? 'is-selected' : ''}`}
                        onClick={() => handlePresetSelect(theme)}
                      >
                        <div className="settings-theme-preview">
                          {Object.values(theme.colors).slice(0, 5).map((color, i) => (
                            <div
                              key={i}
                              className="settings-theme-preview-bar"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="settings-theme-name">{theme.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* V5: Bouton "Enregistrer" uniquement en mode 'my' */}
                  {themeMode === 'my' && (
                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button
                        type="button"
                        className="settings-action-btn"
                        onClick={handleSaveMyPalette}
                        disabled={savingColors || !user}
                        title="Enregistrer votre palette personnalisée"
                      >
                        {savingColors ? 'Enregistrement…' : 'Enregistrer mon thème'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {saveMessage && (
              <div className="settings-premium-section">
                <div style={{
                  padding: '12px 16px',
                  background: saveMessage.includes('Erreur') ? 'var(--color-error-bg)' : 'var(--color-success-bg)',
                  border: saveMessage.includes('Erreur') ? '1px solid var(--color-error-border)' : '1px solid var(--color-success-border)',
                  borderRadius: 8,
                  color: saveMessage.includes('Erreur') ? 'var(--color-error-text)' : 'var(--color-success-text)',
                  fontWeight: 500,
                  fontSize: 14
                }}>
                  {saveMessage}
                </div>
              </div>
            )}

            {/* V5: Section Couleurs — uniquement en mode 'my' */}
            {themeMode === 'my' && (
              <div className="settings-premium-section">
                <h3 className="settings-section-title">Couleurs de l'interface</h3>
                <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                  Modifiez la couleur principale (C1) pour adapter automatiquement toute la palette.
                  Les autres couleurs se calculent intelligemment à partir de celle-ci.
                </p>

                {/* Always show color1 */}
                <div className="settings-colors-grid" style={{ marginBottom: 12 }}>
                  <div className="settings-color-row">
                    <div className="settings-color-info">
                      <span className="settings-color-desc">{COLOR_FIELDS[0].description}</span>
                    </div>
                    <div className="settings-color-inputs">
                      <input
                        type="color"
                        value={colorsLegacy.color1 ?? '#000000'}
                        onChange={(e) => handleColorChange('color1', e.target.value)}
                      />
                      <code className="settings-color-hex">{(colorText.color1 ?? colorsLegacy.color1 ?? '#000000').toUpperCase()}</code>
                    </div>
                  </div>
                </div>

                {/* Button to show/hide advanced colors */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--color-c8)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-c7)',
                    color: 'var(--color-c10)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: showAdvancedColors ? 12 : 0
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: showAdvancedColors ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <span>{showAdvancedColors ? 'Masquer les couleurs avancées' : 'Afficher les couleurs avancées'}</span>
                </button>

                {/* Advanced colors - only shown when expanded */}
                {showAdvancedColors && (
                  <div className="settings-colors-grid">
                    {COLOR_FIELDS.slice(1).map(({ key, description }) => (
                      <div key={key} className="settings-color-row">
                        <div className="settings-color-info">
                          <span className="settings-color-desc">{description}</span>
                        </div>
                        <div className="settings-color-inputs">
                          <input
                            type="color"
                            value={colorsLegacy[key] ?? '#000000'}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                          />
                          <code className="settings-color-hex">{(colorText[key] ?? colorsLegacy[key] ?? '#000000').toUpperCase()}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Signalements */}
          <section className="settings-premium-card settings-action-card">
            <header className="settings-premium-header">
              <div className="settings-action-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="settings-action-text">
                <h2 className="settings-premium-title">Assistance & Suggestions</h2>
                <p className="settings-premium-subtitle">
                  Une question ou une suggestion ? Notre équipe est à votre écoute.
                </p>
              </div>
            </header>

            <div className="settings-action-footer">
              <button
                type="button"
                className="settings-action-btn"
                onClick={() => setShowSignalements(!showSignalements)}
              >
                <span>{showSignalements ? 'Fermer' : 'Nous contacter'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showSignalements ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>

            {showSignalements && (
              <div className="settings-action-content">
                <SignalementsBlock />
              </div>
            )}
          </section>
        </div>
    </>
  );
}
