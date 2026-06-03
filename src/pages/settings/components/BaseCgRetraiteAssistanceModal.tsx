import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { SimFieldShell } from '@/components/ui/sim';
import { useSignalements } from '@/hooks/settings/useSignalements';
import { validateIssueAttachmentFile } from '@/settings/issueReports';
import { BaseCgTextareaField } from './BaseCgRetraiteModalFields';
import SettingsModalShell from './SettingsModalShell';

interface BaseCgRetraiteAssistanceModalProps {
  onClose: () => void;
}

export default function BaseCgRetraiteAssistanceModal({
  onClose,
}: BaseCgRetraiteAssistanceModalProps) {
  const titleId = useId();
  const formId = useId();
  const fileInputId = useId();
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
      subtitle="Décrire une mise à jour catalogue ou joindre une CG"
      titleId={titleId}
      onClose={onClose}
      size="md"
      overlayClassName="base-cg-modal-overlay"
      modalClassName="base-cg-modal base-cg-assistance-modal"
      headerClassName="base-cg-modal__header"
      footerClassName="base-cg-modal__footer"
      withBodyContainer={false}
      footer={
        <>
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            form={formId}
            className="sim-modal-btn sim-modal-btn--primary"
            disabled={submitting || !description.trim() || Boolean(attachmentError)}
          >
            {submitting ? 'Envoi…' : 'Envoyer'}
          </button>
        </>
      }
    >
      <form id={formId} className="base-cg-assistance-modal__form" onSubmit={handleSubmit}>
        <div className="base-cg-modal__body base-cg-assistance-modal__body">
          <BaseCgTextareaField
            label="Description *"
            value={description}
            onChange={setDescription}
            rows={6}
            disabled={submitting}
            required
            placeholder="Décrivez la mise à jour à vérifier : contrat, compagnie, version, point d’attention..."
            className="base-cg-modal__wide base-cg-assistance-modal__description"
          />

          <SimFieldShell
            label="Conditions générales PDF (facultatif)"
            controlId={fileInputId}
            hint={pdfAttachment ? pdfAttachment.name : 'PDF privé, limité à 25 Mo.'}
            error={attachmentError}
            className="base-cg-modal-field base-cg-modal__wide base-cg-assistance-modal__file"
          >
            <input
              id={fileInputId}
              className="sim-field__control sim-field__control--left base-cg-file-input"
              type="file"
              accept="application/pdf"
              disabled={submitting}
              onChange={handleFileChange}
            />
          </SimFieldShell>

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
