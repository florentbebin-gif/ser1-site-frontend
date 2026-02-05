import React, { useEffect, useState } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
import { useTheme } from '../settings/ThemeProvider';
import { UserInfoBanner } from '../components/UserInfoBanner';
import { recalculatePaletteFromC1 } from '../utils/paletteGenerator';
import SignalementsBlock from '../components/settings/SignalementsBlock';

// Couleurs par défaut
const DEFAULT_COLORS = {
  color1: '#2B3E37',
  color2: '#709B8B',
  color3: '#9FBDB2',
  color4: '#CFDED8',
  color5: '#788781',
  color6: '#CEC1B6',
  color7: '#F5F3F0',
  color8: '#D9D9D9',
  color9: '#7F7F7F',
  color10: '#000000',
};

// Thèmes prédéfinis (objets immuables)
const PREDEFINED_THEMES = Object.freeze([
  {
    id: 'ser1-classic',
    name: 'Thème Original',
    description: 'Thème original élégant et professionnel',
    colors: Object.freeze({
      color1: '#2B3E37',
      color2: '#709B8B',
      color3: '#9FBDB2',
      color4: '#CFDED8',
      color5: '#788781',
      color6: '#CEC1B6',
      color7: '#F5F3F0',
      color8: '#D9D9D9',
      color9: '#7F7F7F',
      color10: '#000000',
    })
  },
  {
    id: 'blue-patrimonial',
    name: 'Bleu patrimonial',
    description: 'Bleu sobre pour la gestion de patrimoine',
    colors: Object.freeze({
      color1: '#1e3a5f',
      color2: '#2c5282',
      color3: '#3182ce',
      color4: '#bee3f8',
      color5: '#4a5568',
      color6: '#e2e8f0',
      color7: '#f7fafc',
      color8: '#cbd5e0',
      color9: '#718096',
      color10: '#1a202c',
    })
  },
  {
    id: 'green-sustainable',
    name: 'Vert durable',
    description: 'Vert profond pour l\'investissement durable',
    colors: Object.freeze({
      color1: '#22543d',
      color2: '#2f855a',
      color3: '#48bb78',
      color4: '#c6f6d5',
      color5: '#4a5568',
      color6: '#e2e8f0',
      color7: '#f7fafc',
      color8: '#cbd5e0',
      color9: '#718096',
      color10: '#1a202c',
    })
  },
  {
    id: 'grey-modern',
    name: 'Gris moderne',
    description: 'Gris minimaliste et épuré',
    colors: Object.freeze({
      color1: '#2d3748',
      color2: '#4a5568',
      color3: '#718096',
      color4: '#e2e8f0',
      color5: '#4a5568',
      color6: '#edf2f7',
      color7: '#f7fafc',
      color8: '#cbd5e0',
      color9: '#718096',
      color10: '#1a202c',
    })
  },
  {
    id: 'gold-elite',
    name: 'Or élite',
    description: 'Or subtil et noir pour le patrimoine haut de gamme',
    colors: Object.freeze({
      color1: '#4a3426',      // Brun profond (remplace jaune flashy)
      color2: '#8b6914',      // Or patiné
      color3: '#b8860b',      // Or doux
      color4: '#f4e4c1',      // Crème délicat
      color5: '#4a5568',      // Gris neutre
      color6: '#e8e3d3',      // Beige subtil
      color7: '#faf8f3',      // Fond très clair
      color8: '#d4c4a0',      // Or en bordure
      color9: '#6b5d54',      // Texte secondaire
      color10: '#1a1a1a',     // Texte principal (noir doux)
    })
  }
]);

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
  const { colors, setColors, saveThemeToUiSettings, isLoading: themeLoading, logo, setLogo } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Convertir le format ThemeProvider vers l'ancien format pour compatibilité
  const [colorsLegacy, setColorsLegacy] = useState(DEFAULT_COLORS);
  const [colorText, setColorText] = useState(DEFAULT_COLORS);
  const [savingColors, setSavingColors] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // V3.1: Theme source state (cabinet vs custom) - synchronisé avec ThemeProvider
  const [themeSource, setThemeSource] = useState(() => {
    return localStorage.getItem('themeSource') || 'cabinet';
  });

  // V3.1: Advanced colors visibility
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  // Synchroniser avec ThemeProvider
  const { themeSource: providerThemeSource, setThemeSource: setProviderThemeSource } = useTheme();

  useEffect(() => {
    localStorage.setItem('themeSource', themeSource);
    // Synchroniser avec ThemeProvider
    if (providerThemeSource !== themeSource) {
      setProviderThemeSource?.(themeSource);
    }
  }, [themeSource, providerThemeSource, setProviderThemeSource]);

  // Signalements block visibility
  const [showSignalements, setShowSignalements] = useState(false);

  // Legacy states (kept for compatibility)
  const [selectedTheme, setSelectedTheme] = useState('Personnalisé');

  // 🎨 V4.0: Use ThemeProvider for custom palette persistence
  const { customPalette, selectedThemeRef, setSelectedThemeRef, saveCustomPalette } = useTheme();
  useEffect(() => {
    if (colors && !themeLoading) {
      const legacyColors = {
        color1: colors.c1,
        color2: colors.c2,
        color3: colors.c3,
        color4: colors.c4,
        color5: colors.c5,
        color6: colors.c6,
        color7: colors.c7,
        color8: colors.c8,
        color9: colors.c9,
        color10: colors.c10,
      };
      setColorsLegacy(legacyColors);
      setColorText(legacyColors);
      
      // 🎨 V4.0: Synchroniser selectedTheme avec selectedThemeRef
      if (selectedThemeRef === 'custom') {
        setSelectedTheme('Personnalisé');
      } else if (selectedThemeRef === 'cabinet') {
        setSelectedTheme('Cabinet');
      } else if (selectedThemeRef === 'original') {
        setSelectedTheme('Thème Original');
      } else {
        // Vérifier si c'est un thème prédéfini
        const matchingTheme = PREDEFINED_THEMES.find(theme => theme.name === selectedThemeRef);
        setSelectedTheme(matchingTheme ? matchingTheme.name : 'Personnalisé');
      }
    }
  }, [colors, themeLoading, selectedThemeRef]);

  // Fonction pour synchroniser les couleurs avec ThemeProvider
  const syncThemeColors = (settingsColors) => {
    const themeColors = {
      c1: settingsColors.color1,
      c2: settingsColors.color2,
      c3: settingsColors.color3,
      c4: settingsColors.color4,
      c5: settingsColors.color5,
      c6: settingsColors.color6,
      c7: settingsColors.color7,
      c8: settingsColors.color8,
      c9: settingsColors.color9,
      c10: settingsColors.color10,
    };
    
    setColors(themeColors);
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

          // TODO: Logo handling deprecated in V3.1 - cabinet logos now managed in admin
          // Kept for compatibility only
          if (meta.cover_slide_url && !logo) {
            setLogo(meta.cover_slide_url);
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

  /* ---------- Gestion des couleurs ---------- */

  const handleColorChange = (key, value) => {
    // Bloquer l'édition en mode cabinet
    if (themeSource === 'cabinet') {
      return;
    }
    
    // l'utilisateur clique sur un swatch de couleur
    const newColors = { ...colorsLegacy, [key]: value };
    setColorsLegacy(newColors);
    setColorText(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setSaveMessage('');
    
    // If changing c1, recalculate other colors automatically
    if (key === 'color1' && themeSource === 'custom') {
      const recalculated = recalculatePaletteFromC1(value);
      const finalColors = { ...newColors, ...recalculated };
      setColorsLegacy(finalColors);
      setColorText(prev => ({ ...prev, ...Object.fromEntries(
        Object.entries(recalculated).map(([k, v]) => [k, v.toUpperCase()])
      ) }));
      syncThemeColors(finalColors);
    } else {
      // Synchronisation temps réel avec le nouveau thème
      syncThemeColors(newColors);
    }
  };

  const handleColorTextChange = (key, value) => {
    // l’utilisateur tape dans le champ texte
    setColorText(prev => ({ ...prev, [key]: value }));
    setSaveMessage('');
  };

  const handleColorTextBlur = (key) => {
    const v = (colorText[key] || '').trim();
    const hex = v.startsWith('#') ? v : `#${v}`;

    // hex complet #RRGGBB
    const isValid = /^#[0-9a-fA-F]{6}$/.test(hex);

    if (isValid) {
      const newColors = { ...colorsLegacy, [key]: hex };
      setColorsLegacy(newColors);
      setColorText(prev => ({ ...prev, [key]: hex.toUpperCase() }));
      
      // If changing c1 via text input, recalculate other colors automatically
      if (key === 'color1' && themeSource === 'custom') {
        const recalculated = recalculatePaletteFromC1(hex);
        const finalColors = { ...newColors, ...recalculated };
        setColorsLegacy(prev => ({ ...prev, ...recalculated }));
        setColorText(prev => ({ ...prev, ...Object.fromEntries(
          Object.entries(recalculated).map(([k, v]) => [k, v.toUpperCase()])
        ) }));
        syncThemeColors(finalColors);
      } else {
        // Synchronisation temps réel avec le nouveau thème
        syncThemeColors(newColors);
      }
    } else {
      // invalide → on revient à la couleur réelle
      setColorText(prev => ({ ...prev, [key]: prev[key] || colorsLegacy[key] || '' }));
    }
  };

  const handleSaveColors = async () => {
    try {
      setSavingColors(true);
      setSaveMessage('');

      // 🎨 V4.0: Sauvegarder explicitement comme thème personnalisé
      const result = await saveCustomPalette({
        c1: colorsLegacy.color1,
        c2: colorsLegacy.color2,
        c3: colorsLegacy.color3,
        c4: colorsLegacy.color4,
        c5: colorsLegacy.color5,
        c6: colorsLegacy.color6,
        c7: colorsLegacy.color7,
        c8: colorsLegacy.color8,
        c9: colorsLegacy.color9,
        c10: colorsLegacy.color10,
      });
      
      if (result.success) {
        setSaveMessage('Thème personnalisé enregistré avec succès.');
        setSelectedTheme('Personnalisé');
        
        // Dispatcher un événement pour notifier ThemeProvider
        window.dispatchEvent(new CustomEvent('ser1-theme-updated', {
          detail: { themeSource: 'custom', colors: {
            c1: colorsLegacy.color1,
            c2: colorsLegacy.color2,
            c3: colorsLegacy.color3,
            c4: colorsLegacy.color4,
            c5: colorsLegacy.color5,
            c6: colorsLegacy.color6,
            c7: colorsLegacy.color7,
            c8: colorsLegacy.color8,
            c9: colorsLegacy.color9,
            c10: colorsLegacy.color10,
          }}
        }));
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

  // Gestionnaire de sélection de thème prédéfini
  const handleThemeSelect = async (themeName) => {
    setSelectedTheme(themeName);
    
    if (themeName === 'Personnalisé') {
      // 🎨 V4.0: Restaurer le thème personnalisé depuis ThemeProvider
      if (customPalette) {
        const legacyColors = {
          color1: customPalette.c1,
          color2: customPalette.c2,
          color3: customPalette.c3,
          color4: customPalette.c4,
          color5: customPalette.c5,
          color6: customPalette.c6,
          color7: customPalette.c7,
          color8: customPalette.c8,
          color9: customPalette.c9,
          color10: customPalette.c10,
        };
        setColorsLegacy(legacyColors);
        setColorText(legacyColors);
        syncThemeColors(legacyColors);
      }
      // Mettre à jour la référence
      setSelectedThemeRef('custom');
      await saveThemeToUiSettings(customPalette || colorsLegacy, 'custom');
      return;
    }
    
    const theme = PREDEFINED_THEMES.find(t => t.name === themeName);
    if (theme) {
      // 🔄 UX: Appliquer les couleurs du preset (copie immuable)
      setColorsLegacy({ ...theme.colors });
      setColorText({ ...theme.colors });
      syncThemeColors(theme.colors);
      setSaveMessage('');
      
      // 🎨 V4.0: Sauvegarder la sélection SANS écraser custom_palette
      setSelectedThemeRef(themeName);
      await saveThemeToUiSettings(theme.colors, themeName);
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
            <header className="settings-premium-header">
              <h2 className="settings-premium-title">Personnalisation avancée du thème</h2>
              <p className="settings-premium-subtitle">
                Adaptez l'interface à votre identité visuelle : couleurs de marque,
                accents graphiques et ambiance générale.
              </p>
            </header>

            <div className="settings-premium-divider" />

            {/* Section Source du thème */}
            <div className="settings-premium-section">
              <h3 className="settings-section-title">Source du thème</h3>
              <div className="settings-source-options">
                <label className="settings-radio-option">
                  <input
                    type="radio"
                    name="themeSource"
                    value="cabinet"
                    checked={themeSource === 'cabinet'}
                    onChange={(e) => setThemeSource(e.target.value)}
                  />
                  <span>Thème du cabinet</span>
                </label>
                <label className="settings-radio-option">
                  <input
                    type="radio"
                    name="themeSource"
                    value="custom"
                    checked={themeSource === 'custom'}
                    onChange={(e) => setThemeSource(e.target.value)}
                  />
                  <span>Thème personnalisé</span>
                </label>
              </div>
              {themeSource === 'custom' && (
                <div style={{ marginTop: 20 }}>
                  <div className="settings-theme-cards" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '20px',
                    marginTop: '12px',
                  }}>
                    {/* Personnalisé card - only shown if custom palette exists */}
                    {customPalette && (
                      <div
                        className={`settings-theme-card ${selectedTheme === 'Personnalisé' ? 'is-selected' : ''}`}
                        onClick={() => handleThemeSelect('Personnalisé')}
                      >
                        <div className="settings-theme-preview">
                          {Object.values(customPalette).slice(0, 5).map((color, i) => (
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

                    {/* Predefined theme cards */}
                    {PREDEFINED_THEMES.map((theme) => (
                      <div
                        key={theme.name}
                        className={`settings-theme-card ${selectedTheme === theme.name ? 'is-selected' : ''}`}
                        onClick={() => handleThemeSelect(theme.name)}
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

                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      className="settings-action-btn"
                      onClick={handleSaveColors}
                      disabled={savingColors || !user || themeSource === 'cabinet'}
                      title={
                        !user
                          ? 'Utilisateur non connecté'
                          : themeSource === 'cabinet'
                          ? 'Le thème cabinet est géré par l\'administrateur'
                          : 'Sauvegarder les couleurs actuelles comme thème personnalisé'
                      }
                    >
                      {savingColors ? 'Enregistrement…' : 'Sauvegarder comme mon thème'}
                    </button>
                  </div>
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

            {/* Section Couleurs avancées */}
            {themeSource === 'custom' && (
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
                        value={colorsLegacy.color1}
                        onChange={(e) => handleColorChange('color1', e.target.value)}
                        disabled={themeSource === 'cabinet'}
                      />
                      <code className="settings-color-hex">{colorText.color1?.toUpperCase() || colorsLegacy.color1?.toUpperCase()}</code>
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
                            value={colorsLegacy[key]}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            disabled={themeSource === 'cabinet'}
                          />
                          <code className="settings-color-hex">{colorText[key]?.toUpperCase() || colorsLegacy[key]?.toUpperCase()}</code>
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
