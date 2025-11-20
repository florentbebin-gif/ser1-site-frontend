import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SettingsNav from './SettingsNav';

export default function Settings() {
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
