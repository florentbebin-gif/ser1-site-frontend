import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { useParamsGlobal } from '../context/ParamsProvider.jsx'
import { toNumber } from '../utils/number.js'

/**
 * Page Params — version fonctionnelle et sûre (hooks À L’INTÉRIEUR du composant)
 */
export default function Params(){
  // Hooks du provider : à l’intérieur du composant (pas en top-level)
  const { params: globalParams, loading: gLoading, error: gError, reload } = useParamsGlobal()

  // état local du formulaire (valeurs défaut – seront écrasées par globalParams au chargement)
  const [form, setForm] = useState({
    irVersion: '2025',
    defaultLoanRate: 4.0,
    defaultInflation: 2.0,
    amortOnlySmoothing: true,
    pptxTemplateUrl: '',
  })

  // session + profil (pour savoir si admin)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  const isAdmin = useMemo(()=> (profile?.role || '').toLowerCase() === 'admin', [profile])

  // Charger session + profil
  useEffect(() => {
    let mounted = true
    ;(async ()=>{
      const { data: s } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(s?.session || null)
      if (s?.session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id,email,role')
          .eq('id', s.session.user.id)
          .maybeSingle()
        if (mounted) setProfile(prof || null)
      } else {
        setProfile(null)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Quand les params globaux arrivent, on remplit le formulaire
  useEffect(() => {
    if (globalParams) {
      setForm(prev => ({ ...prev, ...globalParams }))
    }
  }, [globalParams])

  function onChange(e){
    const { name, value, type, checked } = e.target
    setOkMsg(''); setError('')
    setForm(prev => ({
      ...prev,
       [name]: type === 'checkbox'
         ? !!checked
         : (name.includes('Rate') || name.includes('Inflation') ? toNumber(value) : value)
    }))
  }

  async function onSave(e){
    e.preventDefault()
    setSaving(true); setError(''); setOkMsg('')
    // mini validation
    const numOk = (n)=> typeof n === 'number' && isFinite(n)
    if (!['2024','2025','2026'].includes(String(form.irVersion))) {
      setError("irVersion doit être 2024, 2025 ou 2026."); setSaving(false); return
    }
    if (!numOk(form.defaultLoanRate) || !numOk(form.defaultInflation)) {
      setError("Les champs numériques doivent être valides."); setSaving(false); return
    }

    const payload = {
      key: 'global',
      value: {
        irVersion: String(form.irVersion),
        defaultLoanRate: Number(form.defaultLoanRate),
        defaultInflation: Number(form.defaultInflation),
        amortOnlySmoothing: !!form.amortOnlySmoothing,
        pptxTemplateUrl: String(form.pptxTemplateUrl || '')
      }
    }

    const { error: uerr } = await supabase
      .from('params')
      .upsert(payload, { onConflict: 'key' })

    setSaving(false)
    if (uerr) {
      console.error('params upsert error', uerr)
      setError("Échec de l'enregistrement.")
    } else {
      setOkMsg('Paramètres enregistrés.')
      // recharge le provider pour propager aux autres pages
      reload?.()
    }
  }

  return (
    <div className="panel">
      <div className="plac-title">Paramètres globaux</div>

      <div className="chip" style={{marginBottom:12}}>
        Connecté: <strong style={{marginLeft:6}}>{profile?.email || session?.user?.email || '—'}</strong>
        <span style={{marginLeft:10, opacity:.7}}>rôle:</span> <strong style={{marginLeft:6}}>{profile?.role || 'user'}</strong>
      </div>

      {(gLoading) && <div className="hint">Chargement des paramètres…</div>}
      {gError && <div className="alert error">{gError}</div>}
      {error && <div className="alert error">{error}</div>}
      {okMsg && <div className="alert success">{okMsg}</div>}

      <form onSubmit={onSave} className="form-grid" style={{opacity: gLoading ? .6 : 1}}>
        <div className="form-row">
          <label>Version barème IR (ex: 2025)</label>
          <input name="irVersion" value={form.irVersion} onChange={onChange} disabled={!isAdmin} placeholder="2025" />
        </div>

        <div className="form-row two">
          <div>
            <label>Taux par défaut des prêts (%)</label>
            <input name="defaultLoanRate" type="number" step="0.01" value={form.defaultLoanRate} onChange={onChange} disabled={!isAdmin} />
          </div>
          <div>
            <label>Inflation par défaut (%)</label>
            <input name="defaultInflation" type="number" step="0.01" value={form.defaultInflation} onChange={onChange} disabled={!isAdmin} />
          </div>
        </div>

        <div className="form-row">
          <label className="checkbox">
            <input type="checkbox" name="amortOnlySmoothing" checked={!!form.amortOnlySmoothing} onChange={onChange} disabled={!isAdmin} />
            Appliquer le lissage « amortissable only » par défaut
          </label>
        </div>

        <div className="form-row">
          <label>Modèle PPTX (URL publique)</label>
          <input name="pptxTemplateUrl" value={form.pptxTemplateUrl} onChange={onChange} disabled={!isAdmin} placeholder="https://…" />
          <small className="hint">Optionnel : sera utilisé pour l'export PowerPoint (à venir).</small>
        </div>

        <div className="form-row">
          <button className="btn" type="submit" disabled={!isAdmin || saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {!isAdmin && <span className="hint" style={{marginLeft:10}}>Lecture seule — réservé aux admins.</span>}
        </div>
      </form>
    </div>
  )
}
