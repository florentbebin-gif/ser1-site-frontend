// src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
// Remarque : dans les futures sous-pages (Impôts, Prélèvements…),  réutiliser exactement <SettingsNav activeKey="impots" />, <SettingsNav activeKey="prelevements" />, etc. en important le même composant.
// --- navigation en pilules pour les sous-pages Paramètres ---

const SETTINGS_TABS = [
  { key: 'general', label: 'Généraux', path: '/settings' },
  { key: 'impots', label: 'Impôts', path: '/settings/impots' },
  { key: 'prelevements', label: 'Prélèvements sociaux', path: '/settings/prelevements-sociaux' },
  { key: 'fiscalites', label: 'Fiscalités contrats', path: '/settings/fiscalites-contrats' },
  { key: 'base-contrat', label: 'Base contrats', path: '/settings/base-contrat' },
  { key: 'table-mortalite', label: 'Table de mortalité', path: '/settings/table-mortalite' },
];

function SettingsNav({ activeKey, navigate }) {
  return (
    <div className="settings-nav">
      {SETTINGS_TABS.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            className={`settings-pill${isActive ? ' is-active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Page Paramètres / Général ---

export default function Settings({ navigate }) {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('User');
  const [loading, setLoading] = useState(true);

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

          const isAdmin =
            (typeof meta.role === 'string' &&
              meta.role.toLowerCase() === 'admin') ||
            meta.is_admin === true;

          setRoleLabel(isAdmin ? 'Admin' : 'User');
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

  if (loading) {
    return (
      <div className="settings-page">
        <div className="section-card">
          <div className="section-title">Paramètres</div>
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
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  // on récupère navigate depuis les props ou depuis window.location au besoin
  const go = navigate || ((path) => (window.location.href = path));

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>

        {/* Nav en pilules */}
        <SettingsNav activeKey="general" navigate={go} />

        {/* Contenu de la page "Général" */}
        <div style={{ fontSize: 16, marginTop: 24 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Utilisateur :</strong>{' '}
            <span>{user.email}</span>
          </div>
          <div>
            <strong>Statut :</strong>{' '}
            <span>{roleLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
