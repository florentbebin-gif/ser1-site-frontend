// src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

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
  const appMeta = u.app_metadata || {};

  // On collecte tous les champs "candidats" qui pourraient contenir le rôle
  const candidates = [
    meta.role,
    appMeta.role,
    meta.user_role,
    appMeta.user_role,
    meta.profile,
    appMeta.profile,
  ];

  let isAdmin = false;

  // Cas 1 : booléens explicites
  if (meta.is_admin === true || appMeta.is_admin === true) {
    isAdmin = true;
  }

  // Cas 2 : une chaîne contenant "admin" (Admin, ADMIN, Administrateur...)
  if (!isAdmin) {
    isAdmin = candidates.some(
      (v) => typeof v === 'string' && v.toLowerCase().includes('admin')
    );
  }

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
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
        <div className="section-card">
          <div className="section-title">Paramètres</div>
          <p>Aucun utilisateur connecté.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
      <div className="section-card">
        <div className="section-title">Paramètres</div>

        <div style={{ fontSize: 16 }}>
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
