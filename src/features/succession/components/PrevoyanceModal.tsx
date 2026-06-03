import { SimAmountInputEuro, SimModalShell } from '@/components/ui/sim';
import type { SuccessionPersonParty, SuccessionPrevoyanceDecesEntry } from '../successionDraft';
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
  onImportFromSimulator?: () => void;
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
  onImportFromSimulator,
}: PrevoyanceModalProps) {
  return (
    <SimModalShell
      title="Prévoyance décès"
      onClose={onClose}
      closeLabel="Fermer"
      overlayClassName="sc-member-modal-overlay"
      modalClassName="sc-member-modal sim-modal--lg"
      headerClassName="sc-member-modal__header"
      titleClassName="sc-member-modal__title"
      bodyClassName="sc-member-modal__body sc-assurance-vie-modal__body"
      footerClassName="sc-member-modal__footer"
      closeClassName="sc-member-modal__close"
      footer={
        <>
          {onImportFromSimulator ? (
            <button
              type="button"
              className="sim-modal-btn sim-modal-btn--ghost"
              onClick={onImportFromSimulator}
            >
              Importer depuis le simulateur Prévoyance
            </button>
          ) : null}
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--primary"
            onClick={onValidate}
          >
            Valider
          </button>
        </>
      }
    >
      <div className="sc-assurance-vie-grid sc-assurance-vie-grid--premium">
        <div className="sc-field">
          <label htmlFor="sc-prevoyance-assure">Assuré</label>
          <ScSelect
            id="sc-prevoyance-assure"
            className="sc-assurance-vie-select"
            value={entry.assure}
            onChange={(value) => onUpdate('assure', value)}
            options={partyOptions}
          />
        </div>
        <div className="sc-field">
          <label htmlFor="sc-prevoyance-capital-deces">Capital décès</label>
          <SimAmountInputEuro
            id="sc-prevoyance-capital-deces"
            value={entry.capitalDeces || 0}
            min={0}
            onChange={(val) => onUpdate('capitalDeces', val)}
            placeholder="Montant"
          />
        </div>
        <div className="sc-field">
          <label htmlFor="sc-prevoyance-derniere-prime">Dernière prime versée</label>
          <SimAmountInputEuro
            id="sc-prevoyance-derniere-prime"
            value={entry.dernierePrime || 0}
            min={0}
            onChange={(val) => onUpdate('dernierePrime', val)}
            placeholder="Montant"
          />
        </div>
        <div className="sc-field">
          <div className="sc-field-label">Régime fiscal</div>
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
          <label htmlFor="sc-prevoyance-clause-beneficiaire">Clause bénéficiaire</label>
          <ScSelect
            id="sc-prevoyance-clause-beneficiaire"
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
