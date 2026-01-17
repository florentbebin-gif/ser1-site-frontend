import React, { useEffect, useState } from 'react';
import { supabase, DEBUG_AUTH } from '../supabaseClient';
import { useTheme } from '../settings/ThemeProvider';
import { UserInfoBanner } from '../components/UserInfoBanner';

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
    name: 'SER1 Classique – Thème original',
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

export default function Settings({ isAdmin = false }) {
  const { colors, setColors, saveThemeToUiSettings, isLoading: themeLoading } = useTheme();
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);

  // Convertir le format ThemeProvider vers l'ancien format pour compatibilité
  const [colorsLegacy, setColorsLegacy] = useState(DEFAULT_COLORS);
  const [colorText, setColorText] = useState(DEFAULT_COLORS);
  const [savingColors, setSavingColors] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('Personnalisé');
  const [themeScope, setThemeScope] = useState('all'); // 'all' or 'ui-only'

  const [coverUrl, setCoverUrl] = useState('');

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

  // Charger le scope du thème depuis ui_settings
  useEffect(() => {
    async function loadThemeScope() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: uiSettings, error } = await supabase
            .from('ui_settings')
            .select('theme_name')
            .eq('user_id', user.id)
            .maybeSingle(); // ✅ maybeSingle() ne lève pas d'erreur si aucune ligne
          
          if (!error && uiSettings?.theme_name) {
            // Le scope est encodé dans theme_name: "custom-ui-only" ou "custom"
            if (uiSettings.theme_name.includes('ui-only')) {
              setThemeScope('ui-only');
            } else {
              setThemeScope('all');
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement scope thème:', err);
      }
    }
    
    if (user) {
      loadThemeScope();
    }
  }, [user]);

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

          setRoleLabel(isAdmin ? 'Admin' : 'User');

          // URL du logo (si déjà enregistré)
          if (meta.cover_slide_url) {
            setCoverUrl(meta.cover_slide_url);
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
  }, []);

  /* ---------- Gestion des couleurs ---------- */

  const handleColorChange = (key, value) => {
    // changement via palette → on met à jour la valeur réelle ET le texte
    const newColors = { ...colorsLegacy, [key]: value };
    setColorsLegacy(newColors);
    setColorText(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setSaveMessage('');
    
    // 🔄 UX: Si on modifie une couleur manuellement, basculer sur "Personnalisé"
    if (selectedTheme !== 'Personnalisé') {
      setSelectedTheme('Personnalisé');
    }
    
    // Synchronisation temps réel avec le nouveau thème
    syncThemeColors(newColors);
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
      
      // Synchronisation temps réel avec le nouveau thème
      syncThemeColors(newColors);
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

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaveMessage('');

    if (!file.type.startsWith('image/')) {
      setSaveMessage('Veuillez sélectionner une image (jpg ou png).');
      return;
    }

    // vérif dimensions
    const imageCheck = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    let dimensions;
    try {
      dimensions = await imageCheck;
    } catch {
      setSaveMessage("Impossible de lire l'image.");
      return;
    }

    // Suppression de la vérification de taille minimale
    // if (dimensions.width < 1200 || dimensions.height < 700) {
    //   setSaveMessage("L'image doit faire au minimum 1200 × 700 pixels.");
    //   return;
    // }

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const filePath = `${user.id}/page_de_garde.${ext}`;

      // upload dans le bucket covers
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Erreur upload :', uploadError);
        setSaveMessage(
          "Erreur lors de l'upload dans Supabase Storage : " +
          (uploadError.message || uploadError.error_description || '')
        );
        return;
      }

      const { data: publicData } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      const publicUrl = publicData.publicUrl;

      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          cover_slide_url: publicUrl,
          theme_colors: colors,
        },
      });

      if (metaError) {
        console.error('Erreur metadata :', metaError);
        setSaveMessage("Erreur lors de l'enregistrement dans les métadonnées.");
        return;
      }

      setCoverUrl(publicUrl);
      setSaveMessage('Logo enregistré avec succès.');
    } catch (err) {
      console.error(err);
      setSaveMessage("Erreur lors de l'enregistrement du logo.");
    }
  };

  const handleRemoveCover = async () => {
    if (!coverUrl) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          cover_slide_url: null,
        },
      });
      if (error) {
        console.error('Erreur suppression cover :', error);
        setSaveMessage("Erreur lors de la suppression du logo.");
        return;
      }
      setCoverUrl('');
      setSaveMessage('Logo supprimé.');
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur lors de la suppression du logo.");
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
                Thèmes prédéfinis
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
                  disabled={savingColors || !user}
                  style={{ opacity: user ? 1 : 0.5 }}
                  title={user ? '' : 'Utilisateur non connecté'}
                >
                  {savingColors ? 'Enregistrement…' : 'Enregistrer le thème'}
                </button>
              </div>
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

            {/* Scope d'application du thème */}
            <div style={{ marginBottom: 20, padding: '12px', backgroundColor: 'var(--color-c7)', borderRadius: '6px' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--color-c10)' }}>
                Application du thème
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-c10)' }}>
                  <input
                    type="radio"
                    name="themeScope"
                    value="all"
                    checked={themeScope === 'all'}
                    onChange={(e) => setThemeScope(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    Appliquer le thème à toute l'interface et aux études PowerPoint
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-c10)' }}>
                  <input
                    type="radio"
                    name="themeScope"
                    value="ui-only"
                    checked={themeScope === 'ui-only'}
                    onChange={(e) => setThemeScope(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    Appliquer le thème à l'interface uniquement
                  </span>
                </label>
              </div>
            </div>

            {/* Éditeur de couleurs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              {COLOR_FIELDS.map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: 'var(--color-c7)',
                    border: '1px solid var(--color-c8)',
                  }}
                >
                  <span style={{ minWidth: 90, fontSize: 13, color: 'var(--color-c10)' }}>{label}</span>

                  {/* Palette */}
                  <input
                    type="color"
                    value={colorsLegacy[key] || DEFAULT_COLORS[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    style={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  />

                  {/* Saisie hexadécimale */}
                  <input
                    type="text"
                    value={colorText[key] || DEFAULT_COLORS[key]}
                    onChange={(e) => handleColorTextChange(key, e.target.value)}
                    onBlur={() => handleColorTextBlur(key)}
                    style={{
                      width: 90,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--color-c8)',
                    }}
                    placeholder="var(--color-c10)"
                  />
                </div>
              ))}
            </div>

          </div>

          {/* Choix du logo */}
          <div>
            <h3 style={{ marginBottom: 8 }}>Choix du logo de l’étude</h3>
            <p style={{ marginBottom: 8, fontSize: 14, color: 'var(--color-c9)' }}>
              Chargez une image (.jpg ou .png). Cette image est utilisée comme logo sur la page de garde dans vos éditions d'étude PowerPoint.
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleCoverFileChange}
            />

            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-c9)' }}>
              <strong>Logo sélectionné :</strong>{' '}
              {coverUrl ? (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={coverUrl}
                    alt="Logo"
                    style={{
                      maxWidth: '260px',
                      borderRadius: 8,
                      border: '1px solid var(--color-c8)',
                    }}
                  />
                  <div style={{ fontSize: 12, marginTop: 4 }}>{coverUrl}</div>
                  <button
                    type="button"
                    className="chip"
                    onClick={handleRemoveCover}
                    style={{ marginTop: 8 }}
                  >
                    Supprimer le logo
                  </button>
                </div>
              ) : (
                'Aucune'
              )}
            </div>
          </div>

          </div>
    </>
  );
}
