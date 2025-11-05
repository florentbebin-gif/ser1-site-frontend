import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// --- util: parse "#a=b&c=d" en préservant les "+" ---
function parseHashPreservingPlus(rawHash) {
  const out = {};
  if (!rawHash) return out;
  const s = rawHash.replace(/^#/, "");
  for (const pair of s.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const k = eq >= 0 ? pair.slice(0, eq) : pair;
    const v = eq >= 0 ? pair.slice(eq + 1) : "";
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

export default function ResetPassword() {
  const [step, setStep] = useState("start");
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const addDbg = (l) => {
    setDebug((p) => (p ? p + "\n" : "") + l);
    try { console.debug("[RESET]", l); } catch {}
  };

  // ---- helpers timeout / race ----
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      (async () => {
        await delay(ms);
        const e = new Error(`TIMEOUT:${label}:${ms}`);
        e._timeout = true;
        throw e;
      })(),
    ]);
  }

  useEffect(() => {
    const unsub = supabase.auth.onAuthStateChange((evt) => {
      addDbg(`onAuthStateChange → ${evt}`);
    }).data.subscription;

    (async () => {
      try {
        setError("");
        setDebug("");
        setStep("parse-hash");
        addDbg("→ Étape: parse-hash");

        const rawHash = window.location.hash || "";
        const onlySharp = rawHash === "#";
        const hasHashParams = rawHash && !onlySharp;
        addDbg(`URL = ${window.location.href}`);
        addDbg(`hashRaw = "${rawHash}" (onlySharp=${onlySharp}, hasParams=${hasHashParams})`);

        if (!hasHashParams) {
          // Pas de hash → vérifier si une session existe déjà
          setStep("handle-no-hash");
          addDbg("→ Étape: handle-no-hash");
          const { data, error } = await withTimeout(supabase.auth.getSession(), 5000, "getSession(no-hash)");
          if (error) {
            addDbg(`getSession ERROR: ${error.message}`);
            setError("Impossible de vérifier la session. Ouvrez le lien depuis l’email ou renvoyez-en un.");
            setStep("ready");
            return;
          }
          addDbg(`getSession OK: has session=${!!data?.session}`);
          if (!data?.session) {
            setError("Lien absent/expiré. Merci d’ouvrir le lien reçu par email (ou renvoyez-en un).");
          }
          setStep("ready");
          return;
        }

        // On a des params dans le hash
        const p = parseHashPreservingPlus(rawHash);
        addDbg(`hashParsed = ${JSON.stringify(p)}`);

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

        const type = p.type;
        const access = p.access_token;
        const refresh = p.refresh_token;
        if (type !== "recovery" || !access || !refresh) {
          addDbg(`type="${type}", access=${!!access}, refresh=${!!refresh}`);
          setError("Lien incomplet. Ouvrez le lien directement depuis l’email sans le modifier.");
          try {
            const clean = window.location.pathname + window.location.search;
            window.history.replaceState(null, "", clean);
          } catch {}
          setStep("ready");
          return;
        }

        // TENTATIVE A: setSession (avec timeout court)
        setStep("set-session");
        addDbg("→ Étape: set-session (tentative A)");
        try {
          const { data } = await withTimeout(
            supabase.auth.setSession({ access_token: access, refresh_token: refresh }),
            6500,
            "setSession(A)"
          );
          addDbg(`setSession(A) OK: has session=${!!data?.session}`);
        } catch (e) {
          if (e?._timeout) {
            addDbg("setSession(A) TIMEOUT → on tente le fallback B");
          } else {
            addDbg(`setSession(A) ERROR: ${e?.message || e}`);
          }

          // FALLBACK B: vérifier access_token puis retenter setSession une fois
          setStep("fallback-verify");
          addDbg("→ Étape: fallback-verify (getUser(access))");
          try {
            const u = await withTimeout(supabase.auth.getUser(access), 5000, "getUser(access)");
            if (u.error) {
              addDbg(`getUser(access) ERROR: ${u.error.message}`);
              setError("Le lien semble invalide. Renvoyez-vous un nouveau lien depuis la page de connexion.");
              setStep("ready");
              return;
            }
            addDbg(`getUser(access) OK user.id=${u.data?.user?.id || "unknown"}`);

            setStep("set-session-2");
            addDbg("→ Étape: set-session-2 (tentative B)");
            const { data, error } = await withTimeout(
              supabase.auth.setSession({ access_token: access, refresh_token: refresh }),
              6500,
              "setSession(B)"
            );
            if (error) {
              addDbg(`setSession(B) ERROR: ${error.message}`);
              setError("Impossible d’initialiser la session. Renvoyez-vous un nouveau lien.");
              setStep("ready");
              return;
            }
            addDbg(`setSession(B) OK: has session=${!!data?.session}`);
          } catch (e2) {
            if (e2?._timeout) {
              addDbg("getUser/access ou setSession(B) TIMEOUT");
              setError(
                "Temps d’attente dépassé pendant l’initialisation. Fermez l’onglet et rouvrez le lien depuis l’email."
              );
            } else {
              addDbg(`Fallback TRY/CATCH: ${e2?.message || e2}`);
              setError("Erreur pendant l’initialisation. Renvoyez-vous un nouveau lien.");
            }
            setStep("ready");
            return;
          }
        }

        // Nettoyage du hash après succès
        setStep("cleanup-url");
        addDbg("→ Étape: cleanup-url");
        try {
          const clean = window.location.pathname + window.location.search;
          window.history.replaceState(null, "", clean);
        } catch {}

        // prêt
        setStep("ready");
      } catch (fatal) {
        addDbg(`FATAL: ${fatal?.message || fatal}`);
        setError("Erreur inattendue. Renvoyez-vous un nouveau lien et réessayez.");
        setStep("ready");
      }
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return setError(error.message || "Impossible de mettre à jour le mot de passe.");
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
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => window.location.reload()}
                style={{ background: "#f6f6f6", border: "1px solid #D9D9D9", borderRadius: 8, padding: "6px 10px" }}
              >
                Réessayer
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

            {debug && (
              <details open style={{ marginTop: 12 }}>
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
