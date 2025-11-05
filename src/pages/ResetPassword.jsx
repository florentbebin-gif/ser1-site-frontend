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
    out[decodeURIComponent(k)] = decodeURIComponent(v); // ne transforme pas "+"
  }
  return out;
}

export default function ResetPassword() {
  const [step, setStep] = useState("start"); // start | parse-hash | handle-no-hash | set-session | cleanup-url | ready
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const addDbg = (l) => {
    setDebug((p) => (p ? p + "\n" : "") + l);
    try { console.debug("[RESET]", l); } catch {}
  };

  // Sécurité: si une étape dure trop longtemps, on affiche un message clair
  function stepTimeoutGuard(name, ms, onTimeout) {
    const id = setTimeout(() => {
      addDbg(`⏳ Timeout @${name} (> ${ms}ms)`);
      onTimeout?.();
    }, ms);
    return () => clearTimeout(id);
  }

  async function runInit() {
    setError("");
    setStep("parse-hash");
    addDbg("→ Étape: parse-hash");

    // 1) Lire le hash tel quel (certains navigateurs donnent juste "#")
    const rawHash = window.location.hash || "";
    const onlySharp = rawHash === "#";
    const hasHashParams = rawHash && !onlySharp;
    addDbg(`URL = ${window.location.href}`);
    addDbg(`hashRaw = "${rawHash}" (onlySharp=${onlySharp}, hasParams=${hasHashParams})`);

    if (!hasHashParams) {
      // 2) Pas de hash => peut-être que Supabase (detectSessionInUrl) a déjà posé la session ?
      setStep("handle-no-hash");
      addDbg("→ Étape: handle-no-hash (aucun paramètre dans le hash)");
      const clearTimer = stepTimeoutGuard("getSession(no-hash)", 5000, () => {
        setError(
          "Aucun lien de réinitialisation détecté. Ouvrez le lien depuis l’email, ou renvoyez-vous un nouveau lien depuis la page de connexion."
        );
        setStep("ready");
      });
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          addDbg(`getSession ERROR: ${error.message}`);
          setError("Impossible de vérifier la session. Réessayez depuis le lien reçu par email.");
          setStep("ready");
          clearTimer();
          return;
        }
        addDbg(`getSession OK: has session=${!!data?.session}`);
        if (!data?.session) {
          setError(
            "Lien absent ou expiré. Merci d’utiliser le lien de réinitialisation reçu par email (ou renvoyez-en un depuis la page de connexion)."
          );
        }
        setStep("ready");
      } catch (e) {
        addDbg(`getSession TRY/CATCH: ${e?.message || e}`);
        setError("Erreur inattendue pendant la vérification de session.");
        setStep("ready");
      }
      clearTimer();
      return;
    }

    // 3) On a bien des paramètres dans le hash: on les parse en préservant les '+'
    const p = parseHashPreservingPlus(rawHash);
    addDbg(`hashParsed = ${JSON.stringify(p)}`);

    // 3.a) Erreurs explicites dans l’URL
    const err = p.error_code || p.error;
    if (err) {
      const msg =
        err === "otp_expired"
          ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
          : "Lien de réinitialisation invalide.";
      setError(msg);
      try {
        const clean = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", clean);
      } catch {}
      setStep("ready");
      return;
    }

    // 3.b) Contrôle du type et présence des tokens
    const type = p.type;
    const access = p.access_token;
    const refresh = p.refresh_token;
    if (type !== "recovery" || !access || !refresh) {
      addDbg(`type="${type}", access=${!!access}, refresh=${!!refresh}`);
      setError(
        "Lien de réinitialisation incomplet. Ouvrez le lien directement depuis l’email reçu, sans le modifier."
      );
      try {
        const clean = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", clean);
      } catch {}
      setStep("ready");
      return;
    }

    // 4) Poser la session de recovery
    setStep("set-session");
    addDbg("→ Étape: set-session");
    const clearSetSessionTimer = stepTimeoutGuard("setSession", 7000, () => {
      setError(
        "Temps d’attente dépassé lors de l’initialisation. Fermez cet onglet et rouvrez le lien depuis l’email."
      );
      setStep("ready");
    });

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: access,
        refresh_token: refresh,
      });
      if (error) {
        addDbg(`setSession ERROR: ${error.message}`);
        setError(
          "Lien invalide ou expiré. Renvoyez-vous un nouveau lien de réinitialisation depuis la page de connexion."
        );
        setStep("ready");
        clearSetSessionTimer();
        return;
      }
      addDbg(`setSession OK: has session=${!!data?.session}`);

      // 5) Nettoyer l’URL (retirer le hash)
      setStep("cleanup-url");
      addDbg("→ Étape: cleanup-url");
      try {
        const clean = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", clean);
      } catch {}

      // 6) Prêt : affichage du formulaire
      setStep("ready");
    } catch (e) {
      addDbg(`setSession TRY/CATCH: ${e?.message || e}`);
      setError("Erreur inattendue pendant l’initialisation de la réinitialisation.");
      setStep("ready");
    }
    clearSetSessionTimer();
  }

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (cancel) return;
      setDebug(""); // reset debug à chaque navigation
      setError("");
      setStep("start");
      addDbg("→ Étape: start");

      // Garde-fou global: si rien ne se passe en 10s, on débloque l’UI
      const clearGlobalTimer = stepTimeoutGuard("global-init", 10000, () => {
        if (step !== "ready") {
          addDbg("⏳ Timeout global: passage en ready avec message générique");
          setError(
            "Initialisation trop longue. Fermez cet onglet et rouvrez le lien depuis l’email. Si le problème persiste, renvoyez-vous un nouveau lien."
          );
          setStep("ready");
        }
      });

      await runInit();
      clearGlobalTimer();
    })();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    window.location.assign("/login");
  }

  const isReady = step === "ready";

  return (
    <div className="reset-root" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 16 }}>
      <div
        className="reset-card"
        style={{
          width: "min(560px, 92vw)",
          background: "#fff",
          borderRadius: 14,
          padding: 22,
          border: "1px solid #e5e5e5",
          boxShadow: "0 8px 30px rgba(0,0,0,.08)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#2C3D38" }}>
          Réinitialiser votre mot de passe
        </h1>

        {!isReady ? (
          <div style={{ marginTop: 12 }}>
            <div>Initialisation…</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
              Étape actuelle : <b>{step}</b>
            </div>
            {/* Bouton pour retenter si l’utilisateur est bloqué */}
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => runInit()}
                style={{ background: "#f6f6f6", border: "1px solid #D9D9D9", borderRadius: 8, padding: "6px 10px" }}
              >
                Réessayer l’initialisation
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div
                style={{
                  marginTop: 12,
                  background: "#fff3f3",
                  border: "1px solid #ffd3d3",
                  color: "#b00020",
                  padding: "8px 10px",
                  borderRadius: 8,
                }}
              >
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
                  <a
                    href="/login"
                    className="btn-secondary"
                    style={{ background: "#f6f6f6", border: "1px solid #D9D9D9", borderRadius: 10, padding: "10px 14px", textDecoration: "none", color: "#111" }}
                  >
                    Annuler
                  </a>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                    style={{ background: "#2C3D38", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}
                  >
                    {saving ? "Validation…" : "Valider"}
                  </button>
                </div>
              </form>
            )}

            {/* Debug (repli) */}
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
