import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(location.hash);
        if (error) throw error;
        console.log("Session OK:", data);
      } catch (e) {
        console.error(e);
        setError("Lien expiré ou invalide. Demandez un nouveau lien.");
      } finally {
        setLoading(false);
      }
      // Nettoie l’URL
      window.history.replaceState({}, document.title, "/reset");
    }
    init();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (pwd1.length < 8) return setError("Minimum 8 caractères.");
    if (pwd1 !== pwd2) return setError("Les deux mots de passe ne correspondent pas.");

    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    if (error) return setError(error.message);

    setDone(true);
    setTimeout(() => (window.location.href = "/login?reset=success"), 1500);
  }

  if (loading) return <div style={{ padding: 40 }}>Initialisation…</div>;

  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;

  if (done)
    return <div style={{ padding: 40, color: "green" }}>Mot de passe mis à jour, redirection…</div>;

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20, background: "#fff", borderRadius: 12 }}>
      <h2>Réinitialisation du mot de passe</h2>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={pwd1}
          onChange={(e) => setPwd1(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
        />

        <button type="submit" style={{ padding: 10, fontWeight: "bold" }}>
          Valider
        </button>
      </form>
    </div>
  );
}
