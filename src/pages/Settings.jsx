import React, { useEffect, useState } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
import { useTheme } from '../settings/ThemeProvider';
import { UserInfoBanner } from '../components/UserInfoBanner';
import { recalculatePaletteFromC1 } from '../utils/paletteGenerator';

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
    name: 'Vert investissement durable',
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
  { key: 'color1', label: 'Couleur 1' },
  { key: 'color2', label: 'Couleur 2' },
  { key: 'color3', label: 'Couleur 3' },
  { key: 'color4', label: 'Couleur 4' },
  { key: 'color5', label: 'Couleur 5' },
  { key: 'color6', label: 'Couleur 6' },
  { key: 'color7', label: 'Couleur 7' },
  { key: 'color8', label: 'Couleur 8' },
  { key: 'color9', label: 'Couleur 9' },
  { key: 'color10', label: 'Couleur 10' },
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

  // Synchroniser avec ThemeProvider
  const { themeSource: providerThemeSource, setThemeSource: setProviderThemeSource } = useTheme();

  useEffect(() => {
    localStorage.setItem('themeSource', themeSource);
    // Synchroniser avec ThemeProvider
    if (providerThemeSource !== themeSource) {
      setProviderThemeSource?.(themeSource);
    }
  }, [themeSource, providerThemeSource, setProviderThemeSource]);

  // V3.1: Advanced colors visibility
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  // Legacy states (kept for compatibility)
  const [selectedTheme, setSelectedTheme] = useState('Personnalisé');
  
  // TODO: themeScope will be removed fully in V3.3 when PPTX is cabinet-governed
  // Default stable value for compatibility
  const themeScope = 'ui-only';

  // Convertir les couleurs du ThemeProvider vers l'ancien format
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
      
      // Détecter si c'est un thème prédéfini
      const matchingTheme = PREDEFINED_THEMES.find(theme => 
        Object.entries(theme.colors).every(([key, value]) => legacyColors[key] === value)
      );
      setSelectedTheme(matchingTheme ? matchingTheme.name : 'Personnalisé');
    }
  }, [colors, themeLoading]);

  // NOTE: themeScope is now loaded by ThemeProvider, no need for local loading

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
        if (DEBUG_AUTH) console.log('[Settings] loadUser:start');
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

        if (DEBUG_AUTH) console.log('[Settings] loadUser:success', { hasUser: !!u, userId: u?.id });

        setUser(u);

        if (u) {
          const meta = u.user_metadata || {};

          // rôle Admin / User
          const isAdmin =
            (typeof meta.role === 'string' &&
              meta.role.toLowerCase() === 'admin') ||
            meta.is_admin === true;

          if (DEBUG_AUTH) {
            console.log('[Settings] role detected', { userId: u.id, isAdmin, role: meta.role });
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
    
    // 🔄 UX: Si on modifie une couleur manuellement, basculer sur "Personnalisé"
    if (selectedTheme !== 'Personnalisé') {
      setSelectedTheme('Personnalisé');
    }
    
    // If changing c1, recalculate other colors automatically
    if (key === 'color1' && themeSource === 'custom') {
      const recalculated = recalculatePaletteFromC1(value);
      setColorsLegacy(prev => ({ ...prev, ...recalculated }));
      setColorText(prev => ({ ...prev, ...Object.fromEntries(
        Object.entries(recalculated).map(([k, v]) => [k, v.toUpperCase()])
      ) }));
      syncThemeColors({ ...newColors, ...recalculated });
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
      
      // 🔄 UX: Si on modifie une couleur manuellement, basculer sur "Personnalisé"
      if (selectedTheme !== 'Personnalisé') {
        setSelectedTheme('Personnalisé');
      }
      
      // If changing c1 via text input, recalculate other colors automatically
      if (key === 'color1' && themeSource === 'custom') {
        const recalculated = recalculatePaletteFromC1(hex);
        setColorsLegacy(prev => ({ ...prev, ...recalculated }));
        setColorText(prev => ({ ...prev, ...Object.fromEntries(
          Object.entries(recalculated).map(([k, v]) => [k, v.toUpperCase()])
        ) }));
        syncThemeColors({ ...newColors, ...recalculated });
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

      // Construire le nom du thème avec le scope
      const themeName = selectedTheme === 'Personnalisé' 
        ? `custom${themeScope === 'ui-only' ? '-ui-only' : ''}`
        : selectedTheme;

      // Sauvegarder avec le nouveau système ui_settings
      const result = await saveThemeToUiSettings({
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
      }, themeName);
      
      if (result.success) {
        setSaveMessage('Thème enregistré avec succès.');
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
  const handleThemeSelect = (themeName) => {
    setSelectedTheme(themeName);
    
    if (themeName === 'Personnalisé') {
      return; // Ne rien faire, l'utilisateur garde ses couleurs personnalisées
    }
    
    const theme = PREDEFINED_THEMES.find(t => t.name === themeName);
    if (theme) {
      // 🔄 UX: Appliquer les couleurs du preset (copie immuable)
      setColorsLegacy({ ...theme.colors });
      setColorText({ ...theme.colors });
      syncThemeColors(theme.colors);
      setSaveMessage('');
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
          <div>
            <h3 style={{ marginBottom: 8 }}>Personnalisation avancée du thème</h3>
            <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-c9)' }}>
              Personnalisez l'interface complète avec des thèmes prédéfinis ou des couleurs sur mesure.
            </p>

            {/* Thèmes prédéfinis */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--color-c10)' }}>
                Source du thème
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-c10)' }}>
                  <input
                    type="radio"
                    name="themeSource"
                    value="cabinet"
                    checked={themeSource === 'cabinet'}
                    onChange={(e) => setThemeSource(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px' }}>Thème du cabinet</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-c10)' }}>
                  <input
                    type="radio"
                    name="themeSource"
                    value="custom"
                    checked={themeSource === 'custom'}
                    onChange={(e) => setThemeSource(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px' }}>Thème personnalisé</span>
                </label>
              </div>
              {themeSource === 'custom' && (
                <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <select
                    value={selectedTheme}
                    onChange={(e) => handleThemeSelect(e.target.value)}
                    style={{
                      flex: 1,
                      maxWidth: '300px',
                      padding: '8px 12px',
                      border: '1px solid var(--color-c8)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'var(--color-c7)',
                      cursor: 'pointer',
                      color: 'var(--color-c10)'
                    }}
                  >
                    <option value="Personnalisé">Personnalisé</option>
                    {PREDEFINED_THEMES.map((theme) => (
                      <option key={theme.name} value={theme.name}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="chip"
                    onClick={handleSaveColors}
                    disabled={savingColors || !user || themeSource === 'cabinet'}
                    style={{ opacity: (user && themeSource !== 'cabinet') ? 1 : 0.5 }}
                    title={
                      !user 
                        ? 'Utilisateur non connecté' 
                        : themeSource === 'cabinet'
                        ? 'Le thème cabinet est géré par l\'administrateur'
                        : ''
                    }
                  >
                    {savingColors ? 'Enregistrement…' : 'Enregistrer le thème'}
                  </button>
                </div>
              )}
            </div>

            {saveMessage && (
              <div className="settings-success-message" style={{ 
                fontSize: 14, 
                marginTop: 12, 
                padding: '12px 16px', 
                background: saveMessage.includes('Erreur') ? 'var(--color-error-bg)' : 'var(--color-success-bg)', 
                border: saveMessage.includes('Erreur') ? '1px solid var(--color-error-border)' : '1px solid var(--color-success-border)', 
                borderRadius: 6, 
                color: saveMessage.includes('Erreur') ? 'var(--color-error-text)' : 'var(--color-success-text)',
                fontWeight: 500
              }}>
                {saveMessage}
              </div>
            )}


            {/* Éditeur de couleurs */}
            {themeSource === 'custom' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid var(--color-c8)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-c7)',
                      color: 'var(--color-c10)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{showAdvancedColors ? '▼' : '▶'}</span>
                    <span>Couleurs avancées</span>
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {/* Always show color1 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--color-c7)',
                      border: '1px solid var(--color-c8)',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ minWidth: 80, fontSize: 13, fontWeight: 500, color: 'var(--color-c10)', flexShrink: 0 }}>Couleur 1</span>
                    
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '4px',
                        backgroundColor: colorsLegacy.color1,
                        border: '1px solid var(--color-c8)',
                        flexShrink: 0,
                      }}
                    />

                    <input
                      type="color"
                      value={colorsLegacy.color1}
                      onChange={(e) => handleColorChange('color1', e.target.value)}
                      style={{
                        width: 32,
                        height: 32,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />

                    <input
                      type="text"
                      value={colorText.color1 || ''}
                      onChange={(e) => handleColorTextChange('color1', e.target.value)}
                      onBlur={() => handleColorTextBlur('color1')}
                      placeholder="#RRGGBB"
                      style={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        maxWidth: '140px',
                        padding: '6px 8px',
                        border: '1px solid var(--color-c8)',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--color-c7)',
                        color: 'var(--color-c10)',
                      }}
                    />
                  </div>

                  {/* Advanced colors */}
                  {showAdvancedColors && COLOR_FIELDS.filter(({ key }) => key !== 'color1').map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'var(--color-c7)',
                        border: '1px solid var(--color-c8)',
                        minWidth: 0,
                      }}
                    >
                      <span style={{ minWidth: 80, fontSize: 13, fontWeight: 500, color: 'var(--color-c10)', flexShrink: 0 }}>{label}</span>
                      
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          backgroundColor: colorsLegacy[key],
                          border: '1px solid var(--color-c8)',
                          flexShrink: 0,
                        }}
                      />

                      <input
                        type="color"
                        value={colorsLegacy[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        style={{
                          width: 32,
                          height: 32,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />

                      <input
                        type="text"
                        value={colorText[key] || ''}
                        onChange={(e) => handleColorTextChange(key, e.target.value)}
                        onBlur={() => handleColorTextBlur(key)}
                        placeholder="#RRGGBB"
                        style={{
                          flex: '1 1 auto',
                          minWidth: 0,
                          maxWidth: '140px',
                          padding: '6px 8px',
                          border: '1px solid var(--color-c8)',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          backgroundColor: 'var(--color-c7)',
                          color: 'var(--color-c10)',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
    </>
  );
}
