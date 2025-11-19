import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Placement from './pages/Placement';

export default function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isRecoveryMode = window.location.hash.includes('type=recovery');

  return (
    <div>
      <div className="topbar">
        <div className="brandbar">SER1 — Simulateur épargne retraite</div>
        {session && !isRecoveryMode && (
          <div className="top-actions">
            <Link className="chip" to="/">HOME</Link>
            <button className="chip" onClick={handleLogout}>Déconnexion</button>
          </div>
        )}
      </div>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
        <Route path="/" element={session && !isRecoveryMode ? <Home /> : <Login onLogin={() => navigate('/')} />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/placement" element={<Placement />} />
      </Routes>
    </div>
  );
}
