import { useState } from 'react';
import { SimModalShell } from '@/components/ui/sim';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssetLegalNature,
  SuccessionAssetOrigin,
  SuccessionMeubleImmeubleLegal,
} from '../successionDraft';
import {
  SUCCESSION_ASSET_LEGAL_NATURE_OPTIONS,
  SUCCESSION_ASSET_ORIGIN_OPTIONS,
  SUCCESSION_MEUBLE_IMMEUBLE_LEGAL_OPTIONS,
} from '../successionLegalQualification';
import { ScSelect } from './ScSelect';

interface AssetLegalQualificationModalProps {
  entry: SuccessionAssetDetailEntry;
  onClose: () => void;
  onSave: (
    _id: string,
    _fields: {
      legalNature: SuccessionAssetLegalNature;
      origin: SuccessionAssetOrigin;
      meubleImmeubleLegal: SuccessionMeubleImmeubleLegal;
    },
  ) => void;
}

export default function AssetLegalQualificationModal({
  entry,
  onClose,
  onSave,
}: AssetLegalQualificationModalProps) {
  const [legalNature, setLegalNature] = useState<SuccessionAssetLegalNature>(
    entry.legalNature ?? 'non_qualifie',
  );
  const [origin, setOrigin] = useState<SuccessionAssetOrigin>(entry.origin ?? 'non_precise');
  const [meubleImmeubleLegal, setMeubleImmeubleLegal] = useState<SuccessionMeubleImmeubleLegal>(
    entry.meubleImmeubleLegal ?? 'non_qualifie',
  );

  return (
    <SimModalShell
      title={`Qualification juridique${entry.subCategory ? ` — ${entry.subCategory}` : ''}`}
      onClose={onClose}
      closeLabel="Fermer"
      overlayClassName="sc-member-modal-overlay"
      modalClassName="sc-member-modal sc-member-modal--wide"
      headerClassName="sc-member-modal__header"
      titleClassName="sc-member-modal__title"
      bodyClassName="sc-member-modal__body sc-assurance-vie-modal__body"
      footerClassName="sc-member-modal__footer"
      closeClassName="sc-member-modal__close"
      footer={
        <>
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--primary"
            onClick={() => onSave(entry.id, { legalNature, origin, meubleImmeubleLegal })}
          >
            Valider
          </button>
        </>
      }
    >
      <div className="sc-assurance-vie-grid sc-assurance-vie-grid--premium">
        <div className="sc-field">
          <label htmlFor="sc-asset-legal-nature">Qualification juridique</label>
          <ScSelect
            id="sc-asset-legal-nature"
            className="sc-assurance-vie-select"
            value={legalNature}
            onChange={(v) => setLegalNature(v as SuccessionAssetLegalNature)}
            options={SUCCESSION_ASSET_LEGAL_NATURE_OPTIONS}
          />
        </div>
        <div className="sc-field">
          <label htmlFor="sc-asset-origin">Origine</label>
          <ScSelect
            id="sc-asset-origin"
            className="sc-assurance-vie-select"
            value={origin}
            onChange={(v) => setOrigin(v as SuccessionAssetOrigin)}
            options={SUCCESSION_ASSET_ORIGIN_OPTIONS}
          />
        </div>
        <div className="sc-field">
          <label htmlFor="sc-asset-meuble-immeuble">Meuble / immeuble</label>
          <ScSelect
            id="sc-asset-meuble-immeuble"
            className="sc-assurance-vie-select"
            value={meubleImmeubleLegal}
            onChange={(v) => setMeubleImmeubleLegal(v as SuccessionMeubleImmeubleLegal)}
            options={SUCCESSION_MEUBLE_IMMEUBLE_LEGAL_OPTIONS}
          />
        </div>
      </div>
    </SimModalShell>
  );
}
