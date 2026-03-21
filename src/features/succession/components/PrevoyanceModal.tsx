import type { SuccessionPrevoyanceDecesEntry } from '../successionDraft';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

interface PrevoyanceModalProps {
  entry: SuccessionPrevoyanceDecesEntry;
  partyOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
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
    <div className="sc-member-modal-overlay" onClick={() => {}}>
      <div className="sc-member-modal sc-member-modal--wide">
        <div className="sc-member-modal__header">
          <h3 className="sc-member-modal__title">Prévoyance décès</h3>
          <button
            type="button"
            className="sc-member-modal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="sc-member-modal__body sc-assurance-vie-modal__body">
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
        </div>
        <div className="sc-member-modal__footer">
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
        </div>
      </div>
    </div>
  );
}
