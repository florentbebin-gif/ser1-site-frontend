import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setChecked(true);
      if (!session) {
        // on protège seulement ici
        navigate("/login", { replace: true });
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s);
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
      mounted = false;
    };
  }, [navigate]);

  if (!checked) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        Initialisation…
      </div>
    );
  }

  if (!session) {
    // Une redirection a déjà été déclenchée ci-dessus.
    return null;
  }

  return children;
}
