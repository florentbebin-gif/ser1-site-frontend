import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ResetBox({ open, onClose }) {
  const panelRef = useRef(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Close on ESC / click outside
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    function onClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setLoading(false);
      setSuccess(false);
      setError("");
    }
  }, [open]);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError("");
    setSuccess(false);

    const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isMail) {
      setError("Merci d’entrer une adresse email valide.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`, // IMPORTANT
      });
      if (error) throw error;
      setSuccess(true);
    } catch (_err) {
      // Message neutre pour ne pas divulguer l’existence d’un compte
      setError("Si ce compte existe, un email vient d’être envoyé.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .reset-overlay{
            position: fixed; inset: 0; background: rgba(0,0,0,.28);
            display:flex; align-items:center; justify-content:center; z-index: 60;
          }
          .reset-panel{
            width:min(520px, 92vw); background:#fff; border-radius:16px;
            box-shadow:0 10px 30px rgba(0,0,0,.15); border:1px solid var(--border);
            padding: 20px 20px 16px; color:var(--ink); position:relative;
            animation: rb-fade-in .18s ease-out;
          }
          @keyframes rb-fade-in { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
          .reset-header{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
          .reset-header h3{ margin:0; font-size:20px; font-weight:700; color:var(--green); }
          .reset-close{ background:transparent; border:none; font-size:24px; line-height:1; cursor:pointer; padding:4px; }
          .reset-sub{ margin:10px 0 16px; color:#444; }
          .reset-form{ display:grid; gap:10px; }
          .reset-form label{ font-weight:600; }
          .reset-form input{
            width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:10px;
            font-size:14px; outline:none;
          }
          .reset-form input:focus{ border-color: var(--green); box-shadow: 0 0 0 3px rgba(44,61,56,.12); }
          .reset-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:8px; }
          .btn-primary, .btn-secondary{
            padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:600; border:1px solid transparent;
          }
          .btn-primary{ background:var(--green); color:#fff; }
          .btn-primary:disabled{ opacity:.6; cursor:not-allowed; }
          .btn-secondary{ background:#f6f6f6; border-color: var(--border); }
          .reset-error{
            background:#fff3f3; border:1px solid #ffd3d3; color:#b00020; padding:8px 10px; border-radius:8px;
          }
          .reset-success{
            background:#f1fff5; border:1px solid #c7efd6; color:#1b5e20; padding:8px 10px; border-radius:8px;
          }
        `,
        }}
      />
      <div className="reset-overlay" aria-modal="true" role="dialog" aria-labelledby="reset-title">
        <div className="reset-panel" ref={panelRef}>
          <div className="reset-header">
            <h3 id="reset-title">Réinitialiser votre mot de passe</h3>
            <button type="button" className="reset-close" aria-label="Fermer" onClick={onClose}>×</button>
          </div>

          <p className="reset-sub">
            Entrez l’adresse email associée à votre compte. Nous vous enverrons un lien sécurisé.
          </p>

          <form onSubmit={handleSubmit} className="reset-form">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="prenom.nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              required
            />

            {error && <div className="reset-error" role="alert">{error}</div>}
            {success && (
              <div className="reset-success" role="status">
                Si ce compte existe, un email de réinitialisation vient d’être envoyé.
                <br />Vérifiez aussi votre dossier “indésirables”.
              </div>
            )}

            <div className="reset-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={loading || success}>
                {loading ? "Envoi…" : "Envoyer le lien"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
