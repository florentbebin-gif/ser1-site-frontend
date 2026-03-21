import type {
  FamilyMember,
  SuccessionAssuranceVieContractType,
  SuccessionEnfant,
  SuccessionPerEntry,
} from '../successionDraft';
import { getEnfantParentLabel } from '../successionEnfants';
import {
  ASSURANCE_VIE_TYPE_OPTIONS,
  CLAUSE_BENEFICIAIRE_PRESETS,
  CLAUSE_CONJOINT_LABEL,
  CLAUSE_ENFANTS_LABEL,
} from '../successionSimulator.constants';
import {
  getClausePreset,
  labelMember,
  parseCustomClause,
  serializeCustomClause,
} from '../successionSimulator.helpers';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

interface PerModalProps {
  entry: SuccessionPerEntry;
  assuranceViePartyOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  isMarried: boolean;
  isPacsed: boolean;
  onClose: () => void;
  onValidate: () => void;
  onUpdate: (
    _field: keyof SuccessionPerEntry,
    _value: string | number | undefined,
  ) => void;
}

export default function PerModal({
  entry,
  assuranceViePartyOptions,
  enfantsContext,
  familyMembers,
  isMarried,
  isPacsed,
  onClose,
  onValidate,
  onUpdate,
}: PerModalProps) {
  return (
    <div
      className="sc-member-modal-overlay"
      onClick={() => {}}
    >
      <div className="sc-member-modal sc-member-modal--wide">
        <div className="sc-member-modal__header">
          <h3 className="sc-member-modal__title">PER assurance</h3>
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
              <label>Type de clause</label>
              <ScSelect
                className="sc-assurance-vie-select"
                value={entry.typeContrat}
                onChange={(value) => onUpdate('typeContrat', value as SuccessionAssuranceVieContractType)}
                options={ASSURANCE_VIE_TYPE_OPTIONS}
              />
            </div>
            {entry.typeContrat === 'demembree' && (
              <div className="sc-field">
                <label>Âge de l&apos;usufruitier</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={entry.ageUsufruitier ?? ''}
                  onChange={(e) => onUpdate('ageUsufruitier', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="ex. 68"
                />
                <p className="sc-hint sc-hint--compact sc-assurance-vie-contract__hint">
                  Ventilation art. 669 CGI - conjoint = usufruit, enfants = nue-propriété.
                </p>
              </div>
            )}
            <div className="sc-field">
              <label>Assuré</label>
              <ScSelect
                className="sc-assurance-vie-select"
                value={entry.assure}
                onChange={(value) => onUpdate('assure', value)}
                options={assuranceViePartyOptions}
              />
            </div>
          </div>
          <div className="sc-assurance-vie-contract__section">
            <p className="sc-assurance-vie-contract__section-title">Clause bénéficiaire</p>
            <div className="sc-assurance-vie-grid sc-assurance-vie-grid--stack">
              <div className="sc-field sc-field--full">
                <label>Clause bénéficiaire</label>
                <ScSelect
                  className="sc-assurance-vie-select"
                  value={getClausePreset(entry.clauseBeneficiaire)}
                  onChange={(preset) => {
                    if (preset === 'conjoint_enfants') {
                      onUpdate('clauseBeneficiaire', CLAUSE_CONJOINT_LABEL);
                    } else if (preset === 'enfants_parts_egales') {
                      onUpdate('clauseBeneficiaire', CLAUSE_ENFANTS_LABEL);
                    } else {
                      onUpdate('clauseBeneficiaire', 'CUSTOM:');
                    }
                  }}
                  options={CLAUSE_BENEFICIAIRE_PRESETS}
                />
              </div>
              {getClausePreset(entry.clauseBeneficiaire) === 'conjoint_enfants' && (
                <div className="sc-field sc-field--full">
                  <p className="sc-hint sc-hint--compact">
                    Le conjoint survivant est exonéré de droits de succession (art. 796-0 bis CGI).
                  </p>
                </div>
              )}
              {getClausePreset(entry.clauseBeneficiaire) === 'personnalisee' && (
                <div className="sc-field sc-field--full sc-clause-custom">
                  <label>Répartition (%)</label>
                  {[
                    ...(isMarried || isPacsed
                      ? [{ id: 'conjoint', label: isPacsed ? 'Partenaire' : 'Conjoint(e)' }]
                      : []),
                    ...enfantsContext.map((enfant, index) => ({
                      id: enfant.id,
                      label: getEnfantParentLabel(enfant, index),
                    })),
                    ...familyMembers.map((member) => ({
                      id: member.id,
                      label: labelMember(member, enfantsContext),
                    })),
                  ].map(({ id, label }) => {
                    const parts = parseCustomClause(entry.clauseBeneficiaire ?? '');
                    return (
                      <div key={id} className="sc-clause-custom-row">
                        <span className="sc-clause-custom-row__label">{label}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={parts[id] || ''}
                          onChange={(e) => {
                            const newParts = { ...parts, [id]: Number(e.target.value) || 0 };
                            onUpdate('clauseBeneficiaire', serializeCustomClause(newParts));
                          }}
                          placeholder="0"
                        />
                        <span className="sc-clause-custom-row__unit">%</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="sc-field">
                <label>Capitaux décès (€)</label>
                <ScNumericInput
                  value={entry.capitauxDeces || 0}
                  min={0}
                  onChange={(val) => onUpdate('capitauxDeces', val)}
                  placeholder="Montant"
                />
              </div>
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
