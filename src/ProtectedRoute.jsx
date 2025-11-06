// src/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient"; // ✅ Bon chemin si le fichier est dans /src

export default function ProtectedRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session ?? null);
      setReady(true);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!mounted) return;
      setSession(sess ?? null);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (session) return;

    const hash = window.location.hash || "";
    navigate("/login" + hash, { replace: true, state: { from: location } });
  }, [ready, session, navigate, location]);

  if (!ready) return null;
  if (!session) return null;

  return children;
}
