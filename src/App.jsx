import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Placement from './pages/Placement';
import { triggerPageReset } from './utils/reset';
import {  HomeIcon,  FolderIcon,  CloudArrowUpIcon} from "https://esm.sh/@heroicons/react/24/outline";

export default function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, s) => setSession(s));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isRecoveryMode = window.location.hash.includes('type=recovery');

  // ✅ Redirection si pas connecté
  useEffect(() => {
    if (!session && !isRecoveryMode) {
      navigate('/login');
    }
  }, [session, isRecoveryMode, navigate]);

  return (
    <>
      <div className="topbar">
        <div className="brandbar">SER1 — Simulateur épargne retraite</div>
        {session && !isRecoveryMode && (
<div className="top-actions">
  {/* HOME — affiché dans les simulateurs */}
  {window.location.pathname.startsWith("/sim") && (
    <button className="chip icon-btn" onClick={() => navigate("/")}>
      <HomeIcon className="icon" />
    </button>
  )}

  {/* SAVE */}
  {window.location.pathname.startsWith("/sim") && (
    <button
      className="chip icon-btn"
      onClick={() => console.log("SAVE TODO")}
    >
      <CloudArrowUpIcon className="icon" />
    </button>
  )}

  {/* CHARGER */}
  {window.location.pathname.startsWith("/sim") && (
    <button
      className="chip icon-btn"
      onClick={() => console.log("LOAD TODO")}
    >
      <FolderIcon className="icon" />
    </button>
  )}

  {/* RESET */}
  {window.location.pathname.includes("placement") && (
    <button className="chip" onClick={() => triggerPageReset("placement")}>
      Reset
    </button>
  )}

  {/* Déconnexion */}
  <button className="chip" onClick={handleLogout}>
    Déconnexion
  </button>
</div>
        )}
      </div>
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />

  {/* Nouvelle route avec le préfixe /sim */}
  <Route path="/sim/placement" element={<Placement />} />

  {/* Optionnel : compat pour /placement tout court */}
  <Route path="/placement" element={<Navigate to="/sim/placement" replace />} />
</Routes>
    </>
  );
}
