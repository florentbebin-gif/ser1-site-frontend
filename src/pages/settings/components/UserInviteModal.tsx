import React, { useState } from 'react';
import { invokeAdmin } from '@/settings/admin/invokeAdmin';

interface CabinetOption {
  value: string;
  label: string;
}

interface UserInviteModalProps {
  cabinetOptions: CabinetOption[];
  cabinetsLoading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserInviteModal({
  cabinetOptions,
  cabinetsLoading,
  onClose,
  onSuccess,
}: UserInviteModalProps): React.ReactElement {
  const [email, setEmail] = useState('');
  const [cabinetId, setCabinetId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInviteUser = async (): Promise<void> => {
    if (!email.trim()) {
      setError("L'email est requis.");
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload: { email: string; cabinet_id?: string } = { email: email.trim() };
      if (cabinetId) {
        payload.cabinet_id = cabinetId;
      }

      const { error: invokeError } = await invokeAdmin('create_user_invite', payload);
      if (invokeError) throw new Error(invokeError.message);

      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur lors de l'invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="report-modal-header">
          <h3>Nouvel utilisateur</h3>
          <button className="report-modal-close" onClick={onClose} type="button">X</button>
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="utilisateur@exemple.com"
              disabled={submitting}
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
              Cabinet (optionnel)
            </label>
            <select
              value={cabinetId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCabinetId(e.target.value)}
              disabled={submitting || cabinetsLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--color-c8)',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <option value="">-- Aucun cabinet --</option>
              {cabinetOptions.map((cabinet) => (
                <option key={cabinet.value} value={cabinet.value}>
                  {cabinet.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="report-modal-actions">
          <button onClick={onClose} disabled={submitting} type="button">Annuler</button>
          <button
            className="chip"
            onClick={() => {
              void handleInviteUser();
            }}
            disabled={submitting}
            style={{ opacity: submitting ? 0.6 : 1 }}
            type="button"
          >
            {submitting ? 'Envoi...' : 'Inviter'}
          </button>
        </div>
      </div>
    </div>
  );
}
