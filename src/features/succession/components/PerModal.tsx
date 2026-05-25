import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
  SimModalShell,
} from '@/components/ui/sim';
import type {
  FamilyMember,
  SuccessionAssuranceVieContractType,
  SuccessionEnfant,
  SuccessionPerEntry,
  SuccessionPersonParty,
} from '../successionDraft';
import { getEnfantParentLabel } from '../successionEnfants';
import {
  ASSURANCE_VIE_TYPE_OPTIONS,
  CLAUSE_BENEFICIAIRE_PRESETS,
  CLAUSE_CONJOINT_LABEL,
  CLAUSE_ENFANTS_LABEL,
} from '../successionSimulator.constants';
import { labelMember } from '../successionSimulator.helpers';
import {
  getClausePreset,
  parseCustomClause,
  serializeCustomClause,
} from '../successionClauseOptions';
import { ScSelect } from './ScSelect';

interface PerModalProps {
  entry: SuccessionPerEntry;
  assuranceViePartyOptions: { value: SuccessionPersonParty; label: string }[];
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  isMarried: boolean;
  isPacsed: boolean;
  onClose: () => void;
  onValidate: () => void;
  onUpdate: (_field: keyof SuccessionPerEntry, _value: string | number | undefined) => void;
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
    <SimModalShell
      title="PER assurance"
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
            onClick={onValidate}
          >
            Valider
          </button>
        </>
      }
    >
      <div className="sc-assurance-vie-grid sc-assurance-vie-grid--premium">
        <div className="sc-field">
          <label htmlFor="sc-per-type-contrat">Type de clause</label>
          <ScSelect
            id="sc-per-type-contrat"
            className="sc-assurance-vie-select"
            value={entry.typeContrat}
            onChange={(value) =>
              onUpdate('typeContrat', value as SuccessionAssuranceVieContractType)
            }
            options={ASSURANCE_VIE_TYPE_OPTIONS}
          />
        </div>
        {entry.typeContrat === 'demembree' && (
          <div className="sc-field">
            <label htmlFor="sc-per-age-usufruitier">Âge de l&apos;usufruitier</label>
            <SimAmountInputNumeric
              id="sc-per-age-usufruitier"
              unit="ans"
              min={0}
              max={120}
              value={entry.ageUsufruitier ?? 0}
              onChange={(value) =>
                onUpdate('ageUsufruitier', value > 0 ? Math.round(value) : undefined)
              }
              placeholder="ex. 68"
            />
            <p className="sc-hint sc-hint--compact sc-assurance-vie-contract__hint">
              Ventilation art. 669 CGI - conjoint = usufruit, enfants = nue-propriété.
            </p>
          </div>
        )}
        <div className="sc-field">
          <label htmlFor="sc-per-assure">Assuré</label>
          <ScSelect
            id="sc-per-assure"
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
            <label htmlFor="sc-per-clause-beneficiaire">Clause bénéficiaire</label>
            <ScSelect
              id="sc-per-clause-beneficiaire"
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
              <div className="sc-field-label">Répartition (%)</div>
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
                    <SimAmountInputPercent
                      aria-label={`Répartition ${label}`}
                      min={0}
                      max={100}
                      value={parts[id] || 0}
                      onChange={(value) => {
                        const newParts = { ...parts, [id]: value };
                        onUpdate('clauseBeneficiaire', serializeCustomClause(newParts));
                      }}
                      placeholder="0"
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="sc-field">
            <label htmlFor="sc-per-capitaux-deces">Capitaux décès</label>
            <SimAmountInputEuro
              id="sc-per-capitaux-deces"
              value={entry.capitauxDeces || 0}
              min={0}
              onChange={(val) => onUpdate('capitauxDeces', val)}
              placeholder="Montant"
            />
          </div>
        </div>
      </div>
    </SimModalShell>
  );
}
