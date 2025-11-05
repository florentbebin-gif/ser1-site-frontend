import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Parse le fragment "#a=b&c=d" en préservant les "+"
function parseHashPreservingPlus(rawHash) {
  const out = {};
  if (!rawHash) return out;
  const s = rawHash.replace(/^#/, "");
  for (const pair of s.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const k = eq >= 0 ? pair.slice(0, eq) : pair;
    const v = eq >= 0 ? pair.slice(eq + 1) : "";
    out[decodeURIComponent(k)] = decodeURIComponent(v); // ne convertit pas "+" en espace
  }
  return out;
}

export default function ResetPassword() {
  const [ready, setReady] = useState(false);      // prêt à afficher le formulaire
  const [error, setError] = useState("");         // message d’erreur lisible
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [debug, setDebug] = useState("");         // facultatif, pratique en dev

  const addDbg = (l) => setDebug((p) => (p ? p + "\n" : "") + l);

  // 1) Au chargement, si on a un hash Supabase (#access_token=...&refresh_token=...&type=recovery)
  //    -> on pose la session, on nettoie l’URL, puis on affiche le formulaire.
  useEffect(() => {
    (async () => {
      const rawHash = window.location.hash || "";
      if (!rawHash) {
        // Pas de hash : on vérifie s'il existe déjà une session (ex: detectSessionInUrl a fait le job)
        const { data } = await supabase.auth.getSession();
        setReady(true);
        if (!data?.session) {
          // pas de session : l'utilisateur est probablement venu sans passer par l’email
          setError("Lien de réinitialisation absent ou invalide. Merci d’utiliser le lien reçu par email.");
        }
        return;
      }

      const p = parseHashPreservingPlus(rawHash);
      addDbg(`hash=${rawHash.replace(/^#/, "")}`);

      const err = p.error_code || p.error;
      if (err) {
        setError(err === "otp_expired"
          ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
          : "Lien de réinitialisation invalide."
        );
        try {
          const clean = window.location.pathname + window.location.search;
          window.history.replaceState(null, "", clean);
        } catch {}
        setReady(true);
        return;
      }

      const type    = p.type;
      const access  = p.access_token;
      const refresh = p.refresh_token;

      if (type !== "recovery" || !access || !refresh) {
        setError("Lien de réinitialisation invalide. Merci d’utiliser le lien reçu par email.");
        try {
          const clean = window.location.pathname + window.location.search;
          window.history.replaceState(null, "", clean);
        } catch {}
        setReady(true);
        return;
      }

      // Pose la session de recovery
      const { data, error } = await supabase.auth.setSession({
        access_token: access,
        refresh_token: refresh,
      });
      if (error) {
        addDbg(`setSession ERROR: ${error.message}`);
        setError("Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
        setReady(true);
        return;
      }
      addDbg(`setSession OK: has session=${!!data?.session}`);

      // Nettoie l'URL (retire le #…)
      try {
        const clean = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", clean);
      } catch {}

      setReady(true);
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      return setError(error.message || "Impossible de mettre à jour le mot de passe.");
    }

    // Succès : redirection vers la page de connexion (ou auto-login si tu préfères)
    window.location.assign("/login");
  }

  return (
    <div className="reset-root" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 16 }}>
      <div className="reset-card" style={{ width: "min(560px, 92vw)", background: "#fff", borderRadius: 14, padding: 22, border: "1px solid #e5e5e5", boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#2C3D38" }}>Réinitialiser votre mot de passe</h1>

        {!ready ? (
          <p style={{ marginTop: 12 }}>Initialisation…</p>
        ) : (
          <>
            {error && (
              <div style={{ marginTop: 12, background: "#fff3f3", border: "1px solid #ffd3d3", color: "#b00020", padding: "8px 10px", borderRadius: 8 }}>
                {error}
              </div>
            )}

            {!error && (
              <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <label>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Nouveau mot de passe</div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #D9D9D9", borderRadius: 10, outline: "none" }}
                  />
                </label>

                <label>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Confirmer le mot de passe</div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #D9D9D9", borderRadius: 10, outline: "none" }}
                  />
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <a href="/login" className="btn-secondary" style={{ background: "#f6f6f6", border: "1px solid #D9D9D9", borderRadius: 10, padding: "10px 14px", textDecoration: "none", color: "#111" }}>
                    Annuler
                  </a>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ background: "#2C3D38", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}>
                    {saving ? "Validation…" : "Valider"}
                  </button>
                </div>
              </form>
            )}

            {/* Débogage (optionnel) */}
            {debug && (
              <details style={{ marginTop: 12 }}>
                <summary>Debug</summary>
                <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap" }}>
                  {debug}
                </pre>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}
