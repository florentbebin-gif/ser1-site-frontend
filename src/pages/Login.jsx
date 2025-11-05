import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH === "1";

export default function Login(){
  // --- états communs ---
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [info, setInfo]             = useState('')
  const inFlight                    = useRef(false)

  // --- mode récupération ---
  const [isRecovery, setIsRecovery] = useState(false)
  const [newPwd, setNewPwd]         = useState('')
  const [newPwd2, setNewPwd2]       = useState('')
  const [recoBusy, setRecoBusy]     = useState(false)
  const [recoDebug, setRecoDebug]   = useState('')
  const recoveryAccessRef           = useRef(null)

  const addDbg = (msg) => {
    if (!DEBUG_AUTH) return;
    setRecoDebug(prev => (prev ? prev + "\n" : "") + msg);
    console.log("[LOGIN:RECOVERY]", msg);
  };

  function parseHashPreservingPlus(raw){
    const out = {};
    if (!raw) return out;
    const s = raw.replace(/^#/, '');
    for(const part of s.split('&')){
      if (!part) continue;
      const eq = part.indexOf('=');
      const k = eq >= 0 ? part.slice(0, eq) : part;
      const v = eq >= 0 ? part.slice(eq+1) : '';
      out[decodeURIComponent(k)] = decodeURIComponent(v);
    }
    return out;
  }

  useEffect(() => {
    const raw = window.location.hash || '';
    if (!raw) return;

    const p = parseHashPreservingPlus(raw);
    const err = p.error_code || p.error;
    if (err){
      setError(err === "otp_expired"
        ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
        : "Lien de réinitialisation invalide."
      );
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const access = p.access_token;
    const refresh = p.refresh_token;
    const type = p.type;

    if (type === "recovery" && access && refresh){
      recoveryAccessRef.current = access;
      addDbg(`hash=${raw}`);

      (async () => {
        try {
          addDbg("→ setSession");
          const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
          if (error){
            addDbg("setSession ERROR: " + error.message);
            setError("Lien invalide ou expiré.");
            return;
          }
          addDbg("setSession OK");

          const { data } = await supabase.auth.getSession();
          addDbg("session now=" + !!data?.session);

          setIsRecovery(true);
          try {
            const clean = window.location.pathname + window.location.search;
            window.history.replaceState(null, '', clean);
          } catch {}
        } catch(e){
          addDbg("RECOVERY ERROR: " + e?.message);
          setError("Erreur lors du chargement du lien.");
        }
      })();
    }
  }, []);

  async function onSubmit(e){
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setError(''); setInfo(''); setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.assign('/');
    } catch(e){
      setError(e?.message || "Impossible de se connecter.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  async function sendReset(e){
    e.preventDefault();
    if(!email) return setError("Saisissez votre email.");
    setError(''); setInfo(''); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      });
      if (error) throw error;
      setInfo("Si ce compte existe, un email vient d’être envoyé.");
    } catch(e){
      setError(e?.message || "Échec de l’envoi.");
    } finally {
      setLoading(false);
    }
  }

  // === Soumission du NOUVEAU mot de passe (avec fallback REST) ===
  async function submitNewPwd(e){
    e.preventDefault();
    setError('');
    if (newPwd.length < 8) return setError("Au moins 8 caractères.");
    if (newPwd !== newPwd2) return setError("Les deux mots de passe ne correspondent pas.");

    setRecoBusy(true);
    const direct = await supabase.auth.updateUser({ password: newPwd })
      .catch(e => e);

    if (!(direct instanceof Error) && !direct?.error){
      setRecoBusy(false);
      await supabase.auth.signOut().catch(()=>{});
      return window.location.assign('/login');
    }

    addDbg("⚠ updateUser bloqué → fallback REST");

    const access = recoveryAccessRef.current;
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access}`,
        "apikey": SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ password: newPwd })
    }).catch(e=>e);

    setRecoBusy(false);

    if (!res || res.status >= 400){
      setError("Impossible de mettre à jour le mot de passe. Renvoyez un nouveau lien.");
      return;
    }

    await supabase.auth.signOut().catch(()=>{});
    return window.location.assign('/login');
  }

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />

      <div className="login-grid">
        <div className="login-title">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        <div className="login-card">
          <div className="card-title">Connexion</div>
          {error && !isRecovery && <div className="alert error">{error}</div>}
          {info  && !isRecovery && <div className="alert success">{info}</div>}

          <form onSubmit={onSubmit} className="form-grid" style={{opacity: isRecovery ? .35 : 1, pointerEvents: isRecovery ? 'none' : 'auto'}}>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-row btns">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
              <button type="button" className="btn-outline" onClick={sendReset} disabled={loading || !email}>
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        </div>
      </div>

      {isRecovery && (
        <div className="login-recovery">
          <div className="login-card">
            <div className="card-title">Réinitialisation</div>
            {error && <div className="alert error">{error}</div>}

            <form onSubmit={submitNewPwd} className="form-grid">
              <div className="form-row">
                <label>Nouveau mot de passe</label>
                <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>Confirmer</label>
                <input type="password" value={newPwd2} onChange={e=>setNewPwd2(e.target.value)} required />
              </div>

              <div className="form-row btns">
                <button className="btn" disabled={recoBusy}>
                  {recoBusy ? 'Validation…' : 'Valider'}
                </button>
                <a className="btn-outline" href="/login">Annuler</a>
              </div>
            </form>

            {DEBUG_AUTH && recoDebug && (
              <pre style={{marginTop:12, background:'#f6f6f6', padding:12, borderRadius:8, fontSize:12, whiteSpace:'pre-wrap'}}>
                {recoDebug}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
