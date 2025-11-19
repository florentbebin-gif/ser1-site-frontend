import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Placement from './pages/Placement';
import { triggerPageReset } from './utils/reset';

export default function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  // ✅ Récupération session Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, s) => setSession(s));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isRecoveryMode = window.location.hash.includes('type=recovery');

  // ✅ Redirection si pas connecté et pas en mode recovery
  useEffect(() => {
    if (!session && !isRecoveryMode) {
      navigate('/login');
    }
  }, [session, isRecoveryMode, navigate]);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="brandbar">SER1 — Simulateur épargne retraite</div>
        {session && !isRecoveryMode && (
          <div className="top-actions">
            {/* Bouton Reset visible uniquement sur simulateurs */}
            {window.location.pathname.includes('placement') && (
              <button
                className="chip"
                onClick={() => triggerPageReset('placement')}
              >
                Reset
              </button>
            )}
            <button className="chip" onClick={handleLogout}>Déconnexion</button>
          </div>
        )}
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/placement" element={<Placement />} />
      </Routes>
    </>
  );
}
