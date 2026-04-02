import { SimModalShell } from '@/components/ui/sim';
import type {
  SuccessionPersonParty,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

interface PrevoyanceModalProps {
  entry: SuccessionPrevoyanceDecesEntry;
  partyOptions: { value: SuccessionPersonParty; label: string }[];
  clauseOptions: { value: string; label: string }[];
  regimeLabel: string;
  regimeWarning?: string;
  onClose: () => void;
  onValidate: () => void;
  onUpdate: (_field: keyof SuccessionPrevoyanceDecesEntry, _value: string | number) => void;
}

export default function PrevoyanceModal({
  entry,
  partyOptions,
  clauseOptions,
  regimeLabel,
  regimeWarning,
  onClose,
  onValidate,
  onUpdate,
}: PrevoyanceModalProps) {
  return (
    <SimModalShell
      title="Prévoyance décès"
      onClose={onClose}
      closeLabel="Fermer"
      overlayClassName="sc-member-modal-overlay"
      modalClassName="sc-member-modal sc-member-modal--wide"
      headerClassName="sc-member-modal__header"
      titleClassName="sc-member-modal__title"
      bodyClassName="sc-member-modal__body sc-assurance-vie-modal__body"
      footerClassName="sc-member-modal__footer"
      closeClassName="sc-member-modal__close"
      footer={(
        <>
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="sc-member-modal__btn sc-member-modal__btn--primary"
            onClick={onValidate}
          >
            Valider
          </button>
        </>
      )}
    >
      <div className="sc-assurance-vie-grid sc-assurance-vie-grid--premium">
        <div className="sc-field">
          <label>Assuré</label>
          <ScSelect
            className="sc-assurance-vie-select"
            value={entry.assure}
            onChange={(value) => onUpdate('assure', value)}
            options={partyOptions}
          />
        </div>
        <div className="sc-field">
          <label>Capital décès (€)</label>
          <ScNumericInput
            value={entry.capitalDeces || 0}
            min={0}
            onChange={(val) => onUpdate('capitalDeces', val)}
            placeholder="Montant"
          />
        </div>
        <div className="sc-field">
          <label>Dernière prime versée (€)</label>
          <ScNumericInput
            value={entry.dernierePrime || 0}
            min={0}
            onChange={(val) => onUpdate('dernierePrime', val)}
            placeholder="Montant"
          />
        </div>
        <div className="sc-field">
          <label>Régime fiscal</label>
          <div className="sc-read-only-field">
            <span>{regimeLabel}</span>
            {regimeWarning && (
              <p className="sc-hint sc-hint--compact sc-hint--warning">{regimeWarning}</p>
            )}
          </div>
        </div>
      </div>
      <div className="sc-assurance-vie-contract__section">
        <p className="sc-assurance-vie-contract__section-title">Clause bénéficiaire</p>
        <div className="sc-field sc-field--full">
          <label>Clause bénéficiaire</label>
          <ScSelect
            className="sc-assurance-vie-select"
            value={entry.clauseBeneficiaire ?? clauseOptions[0]?.value ?? ''}
            onChange={(value) => onUpdate('clauseBeneficiaire', value)}
            options={clauseOptions}
          />
        </div>
      </div>
    </SimModalShell>
  );
}
