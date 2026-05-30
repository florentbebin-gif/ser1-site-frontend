import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useSignalements } from '@/hooks/settings/useSignalements';
import { validateIssueAttachmentFile } from '@/settings/issueReports';
import SettingsModalShell from './SettingsModalShell';

interface BaseCgRetraiteAssistanceModalProps {
  onClose: () => void;
}

export default function BaseCgRetraiteAssistanceModal({
  onClose,
}: BaseCgRetraiteAssistanceModalProps) {
  const titleId = useId();
  const formId = useId();
  const [description, setDescription] = useState('');
  const [pdfAttachment, setPdfAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const { submitting, submitError, submitSuccess, submitReport } = useSignalements();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.currentTarget.files?.[0] ?? null;
    setAttachmentError('');

    if (!file) {
      setPdfAttachment(null);
      return;
    }

    try {
      validateIssueAttachmentFile(file, 'pdf');
      setPdfAttachment(file);
    } catch (error) {
      setPdfAttachment(null);
      event.currentTarget.value = '';
      setAttachmentError(error instanceof Error ? error.message : 'PDF invalide.');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!description.trim() || attachmentError) return;

    const success = await submitReport({
      title: 'Mise à jour Base CG retraite',
      description: description.trim(),
      pdfAttachment,
      context: 'base_cg_retraite',
    });

    if (success) onClose();
  }

  return (
    <SettingsModalShell
      title="Assistance & Suggestions — Base CG retraite"
      titleId={titleId}
      onClose={onClose}
      overlayClassName="base-cg-modal-overlay"
      modalClassName="base-cg-modal base-cg-assistance-modal"
      headerClassName="base-cg-modal__header"
      footerClassName="base-cg-modal__footer"
      withBodyContainer={false}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button
            type="submit"
            form={formId}
            className="base-cg-button base-cg-button--primary"
            disabled={submitting || !description.trim() || Boolean(attachmentError)}
          >
            {submitting ? 'Envoi…' : 'Envoyer'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <div className="base-cg-modal__body base-cg-assistance-modal__body">
          <label className="base-cg-modal__wide">
            Description *
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              disabled={submitting}
              required
              placeholder="Décrivez la mise à jour à vérifier : contrat, compagnie, version, point d’attention..."
            />
          </label>

          <label className="base-cg-modal__wide">
            Conditions générales PDF (facultatif)
            <input
              type="file"
              accept="application/pdf"
              disabled={submitting}
              onChange={handleFileChange}
            />
            {pdfAttachment ? (
              <span className="base-cg-modal__hint">{pdfAttachment.name}</span>
            ) : (
              <span className="base-cg-modal__hint">PDF privé, limité à 25 Mo.</span>
            )}
          </label>

          {attachmentError ? (
            <p className="base-cg-documents__error base-cg-modal__wide">{attachmentError}</p>
          ) : null}
          {submitError ? (
            <p className="base-cg-documents__error base-cg-modal__wide">{submitError}</p>
          ) : null}
          {submitSuccess ? (
            <p className="base-cg-bulk-status base-cg-modal__wide" role="status">
              Demande envoyée.
            </p>
          ) : null}
        </div>
      </form>
    </SettingsModalShell>
  );
}
