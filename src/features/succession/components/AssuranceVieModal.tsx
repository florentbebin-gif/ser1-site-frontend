import type { FamilyMember, SuccessionAssuranceVieContractType, SuccessionAssuranceVieEntry, SuccessionEnfant } from '../successionDraft';
import { getEnfantParentLabel } from '../successionEnfants';
import {
  ASSURANCE_VIE_TYPE_OPTIONS,
  CLAUSE_BENEFICIAIRE_PRESETS,
  CLAUSE_CONJOINT_LABEL,
  CLAUSE_ENFANTS_LABEL,
} from '../successionSimulator.constants';
import {
  fmt,
  getClausePreset,
  labelMember,
  parseCustomClause,
  serializeCustomClause,
} from '../successionSimulator.helpers';
import { ScSelect } from './ScSelect';

interface AssuranceVieModalProps {
  assuranceVieDraft: SuccessionAssuranceVieEntry[];
  assuranceVieDraftTotals: {
    capitaux: number;
    versementsApres70: number;
  };
  assuranceViePartyOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  isMarried: boolean;
  isPacsed: boolean;
  onClose: () => void;
  onValidate: () => void;
  onAddContract: () => void;
  onRemoveContract: (_id: string) => void;
  onUpdateContract: (
    _id: string,
    _field: keyof SuccessionAssuranceVieEntry,
    _value: string | number | undefined,
  ) => void;
}

export default function AssuranceVieModal({
  assuranceVieDraft,
  assuranceVieDraftTotals,
  assuranceViePartyOptions,
  enfantsContext,
  familyMembers,
  isMarried,
  isPacsed,
  onClose,
  onValidate,
  onAddContract,
  onRemoveContract,
  onUpdateContract,
}: AssuranceVieModalProps) {
  return (
    <div
      className="sc-member-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sc-member-modal sc-member-modal--wide">
        <div className="sc-member-modal__header">
          <h3 className="sc-member-modal__title">Assurance-vie</h3>
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
          {assuranceVieDraft.length > 0 ? (
            <div className="sc-assurance-vie-list">
              {assuranceVieDraft.map((entry, idx) => (
                <div key={entry.id} className="sc-assurance-vie-contract">
                  <div className="sc-assurance-vie-contract__header">
                    <div className="sc-assurance-vie-contract__heading">
                      <strong className="sc-donation-card__title">Contrat {idx + 1}</strong>
                      <span className="sc-assurance-vie-contract__subtitle">
                        {entry.typeContrat === 'demembree' ? 'Clause demembree' : 'Clause standard'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="sc-remove-btn sc-remove-btn--quiet"
                      onClick={() => onRemoveContract(entry.id)}
                      title="Supprimer ce contrat"
                      aria-label="Supprimer ce contrat"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="sc-assurance-vie-grid sc-assurance-vie-grid--premium">
                    <div className="sc-field">
                      <label>Type de clause</label>
                      <ScSelect
                        className="sc-assurance-vie-select"
                        value={entry.typeContrat}
                        onChange={(value) => onUpdateContract(
                          entry.id,
                          'typeContrat',
                          value as SuccessionAssuranceVieContractType,
                        )}
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
                          onChange={(e) => onUpdateContract(
                            entry.id,
                            'ageUsufruitier',
                            e.target.value ? Number(e.target.value) : undefined,
                          )}
                          placeholder="ex. 68"
                        />
                        <p className="sc-hint sc-hint--compact sc-assurance-vie-contract__hint">
                          Ventilation art. 669 CGI - conjoint = usufruit, enfants = nue-propriété.
                        </p>
                      </div>
                    )}
                    <div className="sc-field">
                      <label>Souscripteur</label>
                      <ScSelect
                        className="sc-assurance-vie-select"
                        value={entry.souscripteur}
                        onChange={(value) => onUpdateContract(entry.id, 'souscripteur', value)}
                        options={assuranceViePartyOptions}
                      />
                    </div>
                    <div className="sc-field">
                      <label>Assuré</label>
                      <ScSelect
                        className="sc-assurance-vie-select"
                        value={entry.assure}
                        onChange={(value) => onUpdateContract(entry.id, 'assure', value)}
                        options={assuranceViePartyOptions}
                      />
                    </div>
                  </div>
                  <div className="sc-assurance-vie-contract__section">
                    <p className="sc-assurance-vie-contract__section-title">Clause beneficiaire</p>
                    <div className="sc-assurance-vie-grid sc-assurance-vie-grid--stack">
                      <div className="sc-field sc-field--full">
                        <label>Clause bénéficiaire</label>
                        <ScSelect
                          className="sc-assurance-vie-select"
                          value={getClausePreset(entry.clauseBeneficiaire)}
                          onChange={(preset) => {
                            if (preset === 'conjoint_enfants') {
                              onUpdateContract(entry.id, 'clauseBeneficiaire', CLAUSE_CONJOINT_LABEL);
                            } else if (preset === 'enfants_parts_egales') {
                              onUpdateContract(entry.id, 'clauseBeneficiaire', CLAUSE_ENFANTS_LABEL);
                            } else {
                              onUpdateContract(entry.id, 'clauseBeneficiaire', 'CUSTOM:');
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
                                    onUpdateContract(
                                      entry.id,
                                      'clauseBeneficiaire',
                                      serializeCustomClause(newParts),
                                    );
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
                        <input
                          type="number"
                          min={0}
                          value={entry.capitauxDeces || ''}
                          onChange={(e) => onUpdateContract(
                            entry.id,
                            'capitauxDeces',
                            Number(e.target.value) || 0,
                          )}
                          placeholder="Montant"
                        />
                      </div>
                      <div className="sc-field">
                        <label>Versements après 70 ans (€)</label>
                        <input
                          type="number"
                          min={0}
                          value={entry.versementsApres70 || ''}
                          onChange={(e) => onUpdateContract(
                            entry.id,
                            'versementsApres70',
                            Number(e.target.value) || 0,
                          )}
                          placeholder="Montant"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sc-hint sc-hint--compact">
              Aucun contrat d&apos;assurance-vie saisi pour l&apos;instant.
            </p>
          )}

          <div className="sc-inline-actions sc-inline-actions--compact">
            <button
              type="button"
              className="sc-child-add-btn"
              onClick={onAddContract}
            >
              + Ajouter un contrat
            </button>
          </div>

          {assuranceVieDraft.length > 0 && (
            <div className="sc-assurance-vie-modal-summary">
              <div className="sc-summary-row">
                <span>Capitaux décès</span>
                <strong>{fmt(assuranceVieDraftTotals.capitaux)}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Versements après 70 ans</span>
                <strong>{fmt(assuranceVieDraftTotals.versementsApres70)}</strong>
              </div>
            </div>
          )}
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
