import { useState } from 'react';
import type { CatalogProduct } from '@/domain/base-contrat/catalog';
import {
  BASE_CONTRAT_REVIEW_STATUS_LABELS,
  normalizeBaseContratReviewStatus,
} from '@/domain/base-contrat/overrides';
import type {
  BaseContratOverride,
  BaseContratOverrideInput,
  BaseContratReviewStatus,
} from '@/domain/base-contrat/overrides';

const REVIEW_STATUS_OPTIONS = (Object.keys(BASE_CONTRAT_REVIEW_STATUS_LABELS) as BaseContratReviewStatus[])
  .map((value) => ({
    value,
    label: BASE_CONTRAT_REVIEW_STATUS_LABELS[value],
  }));

export function ReviewStatusDetails({ override }: { override: BaseContratOverride }) {
  const reviewLabel = BASE_CONTRAT_REVIEW_STATUS_LABELS[override.review_status];

  return (
    <div className="base-contrat-review" aria-label="Statut de revue admin">
      <span className={`base-contrat-review__status base-contrat-review__status--${override.review_status}`}>
        Revue : {reviewLabel}
      </span>
      {override.review_reason && (
        <p className="base-contrat-review__line">
          <span>Motif : </span>
          <span>{override.review_reason}</span>
        </p>
      )}
      {override.next_review_at && (
        <p className="base-contrat-review__line">
          <span>Prochaine revue : </span>
          <time dateTime={override.next_review_at}>{override.next_review_at}</time>
        </p>
      )}
    </div>
  );
}

export function OverrideModal({
  product,
  override,
  onClose,
  onSave,
}: {
  product: CatalogProduct;
  override: BaseContratOverride | undefined;
  onClose: () => void;
  onSave: (_o: BaseContratOverrideInput) => void;
}) {
  const isClosed = override?.closed_date != null;
  const [closedDate, setClosedDate] = useState(override?.closed_date ?? '');
  const [note, setNote] = useState(override?.note_admin ?? '');
  const [reviewStatus, setReviewStatus] = useState<BaseContratReviewStatus>(
    normalizeBaseContratReviewStatus(override?.review_status),
  );
  const [reviewReason, setReviewReason] = useState(override?.review_reason ?? '');
  const [nextReviewAt, setNextReviewAt] = useState(override?.next_review_at ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        product_id: product.id,
        closed_date: closedDate || null,
        note_admin: note.trim() || null,
        review_status: reviewStatus,
        review_reason: reviewReason.trim() || null,
        next_review_at: nextReviewAt || null,
      });
    } finally {
      setSaving(false);
    }
  }

  const closedDateId = `base-contrat-closed-date-${product.id}`;
  const noteId = `base-contrat-note-${product.id}`;
  const reviewStatusId = `base-contrat-review-status-${product.id}`;
  const reviewReasonId = `base-contrat-review-reason-${product.id}`;
  const nextReviewAtId = `base-contrat-next-review-${product.id}`;

  return (
    <div className="report-modal-overlay">
      <div className="report-modal base-contrat-modal">
        <div className="report-modal-header">
          <h3>{isClosed ? 'Rouvrir' : 'Clôturer'} - {product.label}</h3>
          <button className="report-modal-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="report-modal-content base-contrat-modal__content">
          <label className="base-contrat-modal__label" htmlFor={closedDateId}>
            Date de clôture <span>(laisser vide = produit ouvert)</span>
          </label>
          <input
            id={closedDateId}
            className="base-contrat-modal__field"
            type="date"
            value={closedDate}
            onChange={(event) => setClosedDate(event.target.value)}
          />
          <label className="base-contrat-modal__label" htmlFor={noteId}>
            Note admin <span>(optionnel)</span>
          </label>
          <textarea
            id={noteId}
            className="base-contrat-modal__field base-contrat-modal__field--textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Ex : dispositif supprimé par la loi de finances 2025"
          />
          <div className="base-contrat-modal__review-fields">
            <label className="base-contrat-modal__label" htmlFor={reviewStatusId}>
              Statut de revue
            </label>
            <select
              id={reviewStatusId}
              className="base-contrat-modal__field"
              value={reviewStatus}
              onChange={(event) => setReviewStatus(normalizeBaseContratReviewStatus(event.target.value))}
            >
              {REVIEW_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="base-contrat-modal__label" htmlFor={reviewReasonId}>
              Raison de revue <span>(optionnel)</span>
            </label>
            <textarea
              id={reviewReasonId}
              className="base-contrat-modal__field base-contrat-modal__field--textarea"
              value={reviewReason}
              onChange={(event) => setReviewReason(event.target.value)}
              rows={2}
              placeholder="Ex : obsolescence législative à confirmer"
            />
            <label className="base-contrat-modal__label" htmlFor={nextReviewAtId}>
              Prochaine revue <span>(optionnel)</span>
            </label>
            <input
              id={nextReviewAtId}
              className="base-contrat-modal__field"
              type="date"
              value={nextReviewAt}
              onChange={(event) => setNextReviewAt(event.target.value)}
            />
          </div>
        </div>
        <div className="report-modal-actions">
          <button onClick={onClose}>Annuler</button>
          <button
            className="chip"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
