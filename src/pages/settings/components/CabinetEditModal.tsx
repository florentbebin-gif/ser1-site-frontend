import React, { useRef, useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';
import { getLogoPublicUrl, uploadLogoWithDedup } from '@/settings/admin/logoUpload';

interface ThemeOption {
  id: string;
  name: string;
}

interface CabinetRecord {
  id?: string;
  name?: string | null;
  default_theme_id?: string | null;
  logo_id?: string | null;
  logo_placement?: string | null;
  logos?: {
    storage_path?: string | null;
  } | null;
}

interface CabinetEditModalProps {
  cabinet?: CabinetRecord | null;
  themes: ThemeOption[];
  onClose: () => void;
  onSuccess: () => void;
}

interface CabinetFormState {
  name: string;
  default_theme_id: string;
  logo_id: string;
  logo_placement: string;
}


const DEFAULT_FORM: CabinetFormState = {
  name: '',
  default_theme_id: '',
  logo_id: '',
  logo_placement: 'center-bottom',
};

const LOGO_PLACEMENT_OPTIONS = [
  { key: 'top-left', label: 'Haut gauche' },
  { key: 'center-top', label: 'Centre haut' },
  { key: 'top-right', label: 'Haut droite' },
  { key: 'bottom-left', label: 'Bas gauche' },
  { key: 'center-bottom', label: 'Centre bas' },
  { key: 'bottom-right', label: 'Bas droite' },
];

export default function CabinetEditModal({
  cabinet,
  themes,
  onClose,
  onSuccess,
}: CabinetEditModalProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<CabinetFormState>(() => (
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    cabinet?.logos?.storage_path ? getLogoPublicUrl(cabinet.logos.storage_path) : null,
  );
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState('');

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez selectionner une image (jpg ou png).');
      return;
    }

    setError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveCabinet = async (): Promise<void> => {
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

        logoId = result.logo_id || '';
      }

      if (cabinet?.id) {
        await adminClient.updateCabinet({
          id: cabinet.id,
          name: form.name.trim(),
          defaultThemeId: form.default_theme_id || null,
          logoId: logoId || null,
          logoPlacement: form.logo_placement || 'center-bottom',
        });
      } else {
        const createdCabinet = await adminClient.createCabinet({
          name: form.name.trim(),
          defaultThemeId: form.default_theme_id || null,
        });
        if (logoFile && createdCabinet?.id) {
          setLogoUploading(true);
          const result = await uploadLogoWithDedup(logoFile, createdCabinet.id);
          setLogoUploading(false);

          if (!result.error && result.logo_id) {
            await adminClient.assignCabinetLogo({
              cabinetId: createdCabinet.id,
              logoId: result.logo_id,
            });
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement du cabinet.");
    } finally {
      setSaving(false);
      setLogoUploading(false);
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal report-modal--sm">
        <div className="report-modal-header">
          <h3>{cabinet ? 'Modifier le cabinet' : 'Nouveau cabinet'}</h3>
          <button className="report-modal-close" onClick={onClose} type="button">X</button>
        </div>
        <div className="report-modal-content">
          {error && (
            <div className="settings-feedback-panel settings-feedback-panel--error settings-modal-message">
              {error}
            </div>
          )}
          <div className="settings-modal-field">
            <label className="settings-modal-label">
              Nom du cabinet *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Ex: Cabinet Dupont"
              className="settings-modal-control"
            />
          </div>
          <div className="settings-modal-field">
            <label className="settings-modal-label" htmlFor="cabinet-theme-select">
              Theme par defaut
            </label>
            <select
              id="cabinet-theme-select"
              value={form.default_theme_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setForm((prev) => ({ ...prev, default_theme_id: e.target.value }));
              }}
              className="settings-modal-control"
            >
              <option value="">-- Aucun theme --</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>
          <div className="settings-modal-field">
            <label className="settings-modal-label">
              Logo du cabinet
            </label>
            <div className="settings-modal-file-row">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="chip"
              >
                Choisir une image...
              </button>
              <span className="settings-modal-hint">
                {logoFile ? logoFile.name : logoPreview ? 'Logo selectionne' : 'Aucun fichier'}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleLogoFileChange}
                className="settings-modal-file-input--hidden"
                aria-label="Logo du cabinet"
              />
            </div>
            {logoPreview && (
              <div className="settings-modal-preview">
                <img
                  src={logoPreview}
                  alt="Apercu logo"
                  className="settings-modal-preview-image"
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
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
            {logoUploading && (
              <p className="settings-modal-hint settings-modal-hint--compact">Upload en cours...</p>
            )}
          </div>
          <div className="settings-modal-field">
            <label className="settings-modal-label">
              Position du logo
            </label>
            <div className="settings-modal-grid-3">
              {LOGO_PLACEMENT_OPTIONS.map((position) => (
                <button
                  key={position.key}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, logo_placement: position.key }));
                  }}
                  className={`settings-modal-placement-button${form.logo_placement === position.key ? ' is-active' : ''}`}
                >
                  {position.label}
                </button>
              ))}
            </div>
            <p className="settings-modal-hint settings-modal-hint--compact">
              Le logo ne sera jamais positionne sur la zone titre de la slide.
            </p>
          </div>
        </div>
        <div className="report-modal-actions">
          <button onClick={onClose} type="button">Annuler</button>
          <button
            className="chip"
            onClick={() => {
              void handleSaveCabinet();
            }}
            disabled={saving || logoUploading}
            type="button"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
