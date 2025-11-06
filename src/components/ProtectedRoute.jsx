// src/components/ProtectedRoute.jsx
// Si tu laisses ce fichier à la racine "src/", remplace l'import suivant par:  import { supabase } from "./supabaseClient";
import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

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

  // Si pas de session une fois prêt → on redirige vers /login
  // On préserve un éventuel hash (#type=recovery|invite|signup) par sécurité.
  useEffect(() => {
    if (!ready) return;
    if (session) return;

    const hash = window.location.hash || "";
    navigate("/login" + hash, { replace: true, state: { from: location } });
  }, [ready, session, navigate, location]);

  // Petite attente silencieuse tant que la session n'est pas déterminée.
  if (!ready) return null;

  // Quand on n'a pas de session, on laisse la redirection faire (return null pour éviter un flash).
  if (!session) return null;

  // Session OK → on affiche la page protégée
  return children;
}
