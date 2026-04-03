import React, { useState } from 'react';
import { adminClient } from '@/settings/admin/adminClient';

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

      await adminClient.createUserInvite({
        email: email.trim(),
        cabinetId: cabinetId || undefined,
      });

      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur lors de l'invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal report-modal--sm">
        <div className="report-modal-header">
          <h3>Nouvel utilisateur</h3>
          <button className="report-modal-close" onClick={onClose} type="button">X</button>
        </div>
        <div className="report-modal-content">
          {error && (
            <div className="settings-feedback-panel settings-feedback-panel--error settings-modal-message">
              {error}
            </div>
          )}
          <div className="settings-modal-field">
            <label className="settings-modal-label">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="utilisateur@exemple.com"
              disabled={submitting}
              className="settings-modal-control"
            />
          </div>
          <div className="settings-modal-field">
            <label className="settings-modal-label">
              Cabinet (optionnel)
            </label>
            <select
              value={cabinetId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCabinetId(e.target.value)}
              disabled={submitting || cabinetsLoading}
              className="settings-modal-control"
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
            type="button"
          >
            {submitting ? 'Envoi...' : 'Inviter'}
          </button>
        </div>
      </div>
    </div>
  );
}
