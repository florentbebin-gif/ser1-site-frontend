import React, { useRef, useState } from 'react';
import { invokeAdmin } from '@/services/apiAdmin';
import { getLogoPublicUrl, uploadLogoWithDedup } from '@/utils/logoUpload';

const DEFAULT_FORM = {
  name: '',
  default_theme_id: '',
  logo_id: '',
  logo_placement: 'center-bottom',
};

const LOGO_PLACEMENT_OPTIONS = [
  { key: 'top-left', label: 'Haut Gauche' },
  { key: 'center-top', label: 'Centre Haut' },
  { key: 'top-right', label: 'Haut Droite' },
  { key: 'bottom-left', label: 'Bas Gauche' },
  { key: 'center-bottom', label: 'Centre Bas' },
  { key: 'bottom-right', label: 'Bas Droite' },
];

export default function CabinetEditModal({
  cabinet,
  themes,
  onClose,
  onSuccess,
}) {
  const inputRef = useRef(null);
  const [form, setForm] = useState(() => (
    cabinet
      ? {
        name: cabinet.name || '',
        default_theme_id: cabinet.default_theme_id || '',
        logo_id: cabinet.logo_id || '',
        logo_placement: cabinet.logo_placement || 'center-bottom',
      }
      : DEFAULT_FORM
  ));
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(
    cabinet?.logos?.storage_path ? getLogoPublicUrl(cabinet.logos.storage_path) : null,
  );
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState('');

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (jpg ou png).');
      return;
    }
    setError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveCabinet = async () => {
    if (!form.name.trim()) {
      setError('Le nom du cabinet est requis.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      let logoId = form.logo_id;

      if (logoFile && cabinet?.id) {
        setLogoUploading(true);
        const result = await uploadLogoWithDedup(logoFile, cabinet.id);
        setLogoUploading(false);

        if (result.error) {
          setError(`Logo upload failed: ${result.error}`);
          setSaving(false);
          return;
        }
        logoId = result.logo_id;
      }

      if (cabinet) {
        const { error: invokeError } = await invokeAdmin('update_cabinet', {
          id: cabinet.id,
          name: form.name.trim(),
          default_theme_id: form.default_theme_id || null,
          logo_id: logoId || null,
          logo_placement: form.logo_placement || 'center-bottom',
        });
        if (invokeError) throw new Error(invokeError.message);
      } else {
        const { data, error: invokeError } = await invokeAdmin('create_cabinet', {
          name: form.name.trim(),
          default_theme_id: form.default_theme_id || null,
        });
        if (invokeError) throw new Error(invokeError.message);

        if (logoFile && data?.cabinet?.id) {
          setLogoUploading(true);
          const result = await uploadLogoWithDedup(logoFile, data.cabinet.id);
          setLogoUploading(false);

          if (!result.error && result.logo_id) {
            await invokeAdmin('assign_cabinet_logo', {
              cabinet_id: data.cabinet.id,
              logo_id: result.logo_id,
            });
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setLogoUploading(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="report-modal-header">
          <h3>{cabinet ? 'Modifier le cabinet' : 'Nouveau cabinet'}</h3>
          <button className="report-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="report-modal-content">
          {error && (
            <div
              style={{
                padding: '12px',
                background: 'var(--color-error-bg)',
                border: '1px solid var(--color-error-border)',
                color: 'var(--color-error-text)',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Nom du cabinet *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Cabinet Dupont"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--color-c8)',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Thème par défaut</label>
            <select
              value={form.default_theme_id}
              onChange={(e) => setForm((prev) => ({ ...prev, default_theme_id: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--color-c8)',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="">— Aucun thème —</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Logo du cabinet</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="chip"
                style={{ padding: '8px 16px', fontWeight: 500 }}
              >
                Choisir une image...
              </button>
              <span style={{ fontSize: 13, color: 'var(--color-c9)' }}>
                {logoFile ? logoFile.name : (logoPreview ? 'Logo sélectionné' : 'Aucun fichier')}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleLogoFileChange}
                style={{ display: 'none' }}
              />
            </div>
            {logoPreview && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={logoPreview}
                  alt="Aperçu logo"
                  style={{ maxWidth: 150, maxHeight: 80, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--color-c8)' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreview(null);
                    setLogoFile(null);
                    setForm((prev) => ({ ...prev, logo_id: '' }));
                  }}
                  className="icon-btn danger"
                  title="Supprimer le logo"
                  aria-label="Supprimer le logo"
                  style={{ width: 32, height: 32 }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
            {logoUploading && <p style={{ fontSize: 13, color: 'var(--color-c9)', marginTop: 8 }}>Upload en cours...</p>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Position du logo</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {LOGO_PLACEMENT_OPTIONS.map((position) => (
                <button
                  key={position.key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, logo_placement: position.key }))}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    border: `2px solid ${form.logo_placement === position.key ? 'var(--color-c4)' : 'var(--color-c8)'}`,
                    borderRadius: 6,
                    background: form.logo_placement === position.key ? 'var(--color-c4)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: form.logo_placement === position.key ? 'var(--color-c1)' : 'var(--color-c10)',
                  }}
                >
                  {position.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-c9)', marginTop: 8 }}>
              Le logo ne sera jamais positionné sur la zone titre de la slide.
            </p>
          </div>
        </div>
        <div className="report-modal-actions">
          <button onClick={onClose}>Annuler</button>
          <button
            className="chip"
            onClick={handleSaveCabinet}
            disabled={saving || logoUploading}
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
