import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SettingsNav from './SettingsNav';

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
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);

  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [savingColors, setSavingColors] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [coverName, setCoverName] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erreur chargement user :', error);
          if (mounted) setLoading(false);
          return;
        }

        const u = data?.user || null;
        if (!mounted) return;

        setUser(u);

        if (u) {
          const meta = u.user_metadata || {};

          // rôle Admin / User
          const isAdmin =
            (typeof meta.role === 'string' &&
              meta.role.toLowerCase() === 'admin') ||
            meta.is_admin === true;

          setRoleLabel(isAdmin ? 'Admin' : 'User');

          // couleurs sauvegardées (si déjà présentes)
          const savedColors = meta.theme_colors || {};
          setColors({
            color1: savedColors.color1 || DEFAULT_COLORS.color1,
            color2: savedColors.color2 || DEFAULT_COLORS.color2,
            color3: savedColors.color3 || DEFAULT_COLORS.color3,
            color4: savedColors.color4 || DEFAULT_COLORS.color4,
            color5: savedColors.color5 || DEFAULT_COLORS.color5,
            color6: savedColors.color6 || DEFAULT_COLORS.color6,
            color7: savedColors.color7 || DEFAULT_COLORS.color7,
            color8: savedColors.color8 || DEFAULT_COLORS.color8,
            color9: savedColors.color9 || DEFAULT_COLORS.color9,
            color10: savedColors.color10 || DEFAULT_COLORS.color10,
          });

          // nom de la page de garde (si déjà enregistré)
          if (meta.cover_slide_name) {
            setCoverName(meta.cover_slide_name);
          }
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const handleColorChange = (key, value) => {
    setColors((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaveMessage('');
  };

  const handleSaveColors = async () => {
    try {
      setSavingColors(true);
      setSaveMessage('');

      const { error } = await supabase.auth.updateUser({
        data: {
          theme_colors: colors,
          // on laisse aussi le nom de la page de garde si disponible
          ...(coverName ? { cover_slide_name: coverName } : {}),
        },
      });

      if (error) {
        console.error('Erreur sauvegarde couleurs :', error);
        setSaveMessage("Erreur lors de l'enregistrement.");
      } else {
        setSaveMessage('Code couleur enregistré.');
      }
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSavingColors(false);
    }
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // On mémorise uniquement le nom pour le moment.
    setCoverName(file.name);
    setSaveMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          cover_slide_name: file.name,
          theme_colors: colors, // on conserve aussi les couleurs actuelles
        },
      });

      if (error) {
        console.error('Erreur enregistrement page de garde :', error);
        setSaveMessage("Erreur lors de l'enregistrement de la page de garde.");
      } else {
        setSaveMessage('Page de garde enregistrée (nom mémorisé).');
      }
    } catch (err) {
      console.error(err);
      setSaveMessage("Erreur lors de l'enregistrement de la page de garde.");
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <SettingsNav />
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>

        {/* Nav en pilules */}
        <SettingsNav />

        {/* Contenu de l’onglet Généraux */}
        <div style={{ fontSize: 16, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Infos utilisateur */}
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Utilisateur :</strong>{' '}
              <span>{user.email}</span>
            </div>
            <div>
              <strong>Statut :</strong>{' '}
              <span>{roleLabel}</span>
            </div>
          </div>

          {/* Choix du code couleur */}
          <div>
            <h3 style={{ marginBottom: 8 }}>Choix du code couleur de l’étude</h3>
            <p style={{ marginBottom: 12, fontSize: 14, color: '#555' }}>
              Ces couleurs seront utilisées dans les futures éditions PowerPoint de l’étude.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
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
                    background: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <span style={{ minWidth: 90, fontSize: 13 }}>{label}</span>
                  <input
                    type="color"
                    value={colors[key]}
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
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {colors[key].toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="chip"
              onClick={handleSaveColors}
              disabled={savingColors}
              style={{ marginTop: 14 }}
            >
              {savingColors ? 'Enregistrement…' : 'Enregistrer le code couleur'}
            </button>
          </div>

          {/* Choix de la page de garde */}
          // Pour la page de garde : on mémorise aujourd’hui le nom dans Supabase.Le jour où tu feras réellement la génération PowerPoint, on branchera un upload dans Supabase Storage et on stockera l’URL du fichier au lieu (ou en plus) du nom.
          // définir ensemble la forme exacte de theme_colors et cover_slide_name côté générateur PowerPoint, préparer un petit helper /utils/theme.js qui les charge et fournit une palette prête à appliquer aux slides.

          <div>
            <h3 style={{ marginBottom: 8 }}>Choix de la page de garde de l’étude</h3>
            <p style={{ marginBottom: 8, fontSize: 14, color: '#555' }}>
              Chargez une seule diapositive PowerPoint (.ppt ou .pptx). Cette page sera utilisée comme
              page de garde dans les futures éditions PowerPoint de l’étude.
            </p>

            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={handleCoverFileChange}
            />

            <div style={{ marginTop: 8, fontSize: 13, color: '#444' }}>
              <strong>Fichier sélectionné :</strong>{' '}
              {coverName || 'Aucun'}
            </div>
          </div>

          {saveMessage && (
            <div style={{ fontSize: 13, color: '#2B3E37' }}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
