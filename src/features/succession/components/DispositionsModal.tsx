import type { Dispatch, SetStateAction } from 'react';
import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SituationMatrimoniale,
  type SuccessionBeneficiaryRef,
  type SuccessionDispositionTestamentaire,
  type SuccessionDonationEntreEpouxOption,
  type SuccessionEnfant,
  type SuccessionPrimarySide,
  type SuccessionTestamentConfig,
} from '../successionDraft';
import {
  buildTestamentBeneficiaryOptions,
  getQuotiteDisponiblePctForSide,
  getReserveHintForSide,
  getTestamentCardTitle,
  TESTAMENT_TYPE_DESCRIPTIONS,
} from '../successionTestament';
import {
  CHOIX_LEGAL_CONJOINT_OPTIONS,
  DISPOSITION_TESTAMENTAIRE_OPTIONS,
  DONATION_ENTRE_EPOUX_OPTIONS,
  OUI_NON_OPTIONS,
} from '../successionSimulator.constants';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import { ScSelect } from './ScSelect';

interface DispositionsModalProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  testamentSides: SuccessionPrimarySide[];
  testamentBeneficiaryOptionsBySide: Record<
    SuccessionPrimarySide,
    ReturnType<typeof buildTestamentBeneficiaryOptions>
  >;
  descendantBranchesBySide: Record<SuccessionPrimarySide, number>;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  civilSituation: SituationMatrimoniale;
  showSharedTransmissionPct: boolean;
  isPacsIndivision: boolean;
  showDonationEntreEpoux: boolean;
  nbDescendantBranches: number;
  nbEnfantsNonCommuns: number;
  isCommunityRegime: boolean;
  updateDispositionsTestament: (
    _side: SuccessionPrimarySide,
    _updater: (_current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
  ) => void;
  getFirstTestamentBeneficiaryRef: (_side: SuccessionPrimarySide) => SuccessionBeneficiaryRef | null;
  onAddParticularLegacy: (_side: SuccessionPrimarySide) => void;
  onUpdateParticularLegacy: (
    _side: SuccessionPrimarySide,
    _legacyId: string,
    _field: 'beneficiaryRef' | 'amount' | 'label',
    _value: string | number | SuccessionBeneficiaryRef | null,
  ) => void;
  onRemoveParticularLegacy: (_side: SuccessionPrimarySide, _legacyId: string) => void;
  onClose: () => void;
  onValidate: () => void;
}

export default function DispositionsModal({
  dispositionsDraft,
  setDispositionsDraft,
  testamentSides,
  testamentBeneficiaryOptionsBySide,
  descendantBranchesBySide,
  enfantsContext,
  familyMembers,
  civilSituation,
  showSharedTransmissionPct,
  isPacsIndivision,
  showDonationEntreEpoux,
  nbDescendantBranches,
  nbEnfantsNonCommuns,
  isCommunityRegime,
  updateDispositionsTestament,
  getFirstTestamentBeneficiaryRef,
  onAddParticularLegacy,
  onUpdateParticularLegacy,
  onRemoveParticularLegacy,
  onClose,
  onValidate,
}: DispositionsModalProps) {
  return (
    <div
      className="sc-member-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sc-member-modal sc-dispositions-modal">
        <div className="sc-member-modal__header">
          <h3 className="sc-member-modal__title">Dispositions particulières</h3>
          <button
            type="button"
            className="sc-member-modal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="sc-member-modal__body sc-dispositions-modal__body">
          <div className="sc-dispositions-modal__section sc-dispositions-modal__section--common">
            {showSharedTransmissionPct && (
              <div className="sc-field">
                <label>
                  {isPacsIndivision
                    ? 'Part indivise transmise au survivant (%)'
                    : 'Attribution des biens communs au survivant (%)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={dispositionsDraft.attributionBiensCommunsPct}
                  onChange={(e) => setDispositionsDraft((prev) => ({
                    ...prev,
                    attributionBiensCommunsPct: Math.min(
                      100,
                      Math.max(0, Number(e.target.value) || 0),
                    ),
                  }))}
                />
                <p className="sc-hint sc-hint--compact">
                  50 = partage usuel ; 100 = attribution intégrale économique.
                </p>
              </div>
            )}

            {showDonationEntreEpoux && (
              <div className="sc-field">
                <label>Donation entre époux</label>
                <ScSelect
                  value={dispositionsDraft.donationEntreEpouxActive ? 'oui' : 'non'}
                  onChange={(value) => setDispositionsDraft((prev) => ({
                    ...prev,
                    donationEntreEpouxActive: value === 'oui',
                  }))}
                  options={OUI_NON_OPTIONS}
                />
              </div>
            )}

            {showDonationEntreEpoux && dispositionsDraft.donationEntreEpouxActive && (
              <div className="sc-field">
                <label>Type de donation entre époux</label>
                <ScSelect
                  value={dispositionsDraft.donationEntreEpouxOption}
                  onChange={(value) => setDispositionsDraft((prev) => ({
                    ...prev,
                    donationEntreEpouxOption: value as SuccessionDonationEntreEpouxOption,
                  }))}
                  options={DONATION_ENTRE_EPOUX_OPTIONS}
                />
                <p className="sc-hint sc-hint--compact">
                  Le choix du type de donation entre époux se fait au moment du décès.
                </p>
              </div>
            )}

            {showDonationEntreEpoux && !dispositionsDraft.donationEntreEpouxActive && nbDescendantBranches > 0 && (
              <div className="sc-field">
                <label>Choix légal du conjoint</label>
                {nbEnfantsNonCommuns > 0 ? (
                  <p className="sc-hint sc-hint--compact">
                    En présence d&apos;enfants non communs, le conjoint survivant n&apos;a droit
                    qu&apos;au quart en pleine propriété (art. 757 CC).
                  </p>
                ) : (
                  <>
                    <ScSelect
                      value={dispositionsDraft.choixLegalConjointSansDDV ?? '__moteur__'}
                      onChange={(value) => setDispositionsDraft((prev) => ({
                        ...prev,
                        choixLegalConjointSansDDV: value === '__moteur__'
                          ? null
                          : value as 'usufruit' | 'quart_pp',
                      }))}
                      options={CHOIX_LEGAL_CONJOINT_OPTIONS}
                    />
                    <p className="sc-hint sc-hint--compact">
                      Sans précision, le simulateur conserve l&apos;hypothèse moteur actuelle ;
                      le droit positif prévoit un choix entre usufruit total et quart en pleine propriété.
                    </p>
                  </>
                )}
              </div>
            )}

            {isCommunityRegime && (
              <div className="sc-field">
                <label>Clause de préciput (€)</label>
                <input
                  type="number"
                  min={0}
                  value={dispositionsDraft.preciputMontant || ''}
                  onChange={(e) => setDispositionsDraft((prev) => ({
                    ...prev,
                    preciputMontant: Math.max(0, Number(e.target.value) || 0),
                  }))}
                  placeholder="Montant"
                />
              </div>
            )}
          </div>

          <div className="sc-dispositions-modal__section sc-dispositions-modal__section--testament">
            <div className="sc-dispositions-modal__section-header">
              <h4 className="sc-dispositions-modal__section-title">Testament</h4>
            </div>
            <div className={`sc-testament-grid${testamentSides.length === 1 ? ' sc-testament-grid--single' : ''}`}>
              {testamentSides.map((side) => {
                const testament = dispositionsDraft.testamentsBySide[side];
                const beneficiaryOptions = testamentBeneficiaryOptionsBySide[side];
                const beneficiarySelectOptions = [
                  { value: '', label: 'Choisir...', disabled: true },
                  ...beneficiaryOptions,
                ];
                const selectedDisposition = testament.dispositionType ?? 'legs_universel';
                const dispositionDescription = testament.dispositionType
                  ? TESTAMENT_TYPE_DESCRIPTIONS[testament.dispositionType]
                  : null;
                const reserveHint = getReserveHintForSide(enfantsContext, familyMembers, side);
                const quotiteDisponiblePct = getQuotiteDisponiblePctForSide(enfantsContext, familyMembers, side);
                const showAscendantsField = descendantBranchesBySide[side] === 0;
                const hasDerivedParents = familyMembers.some(
                  (member) => member.type === 'parent' && (!member.branch ? side === 'epoux1' : member.branch === side),
                );

                return (
                  <div key={side} className="sc-testament-card">
                    <div className="sc-testament-card__header">
                      <h5 className="sc-testament-card__title">
                        {getTestamentCardTitle(civilSituation, side)}
                      </h5>
                      <span className="sc-testament-card__eyebrow">
                        Quotité disponible : {quotiteDisponiblePct.toFixed(2).replace(/\.00$/, '')} %
                      </span>
                    </div>

                    <div className="sc-field">
                      <label>Testament actif</label>
                      <ScSelect
                        value={testament.active ? 'oui' : 'non'}
                        onChange={(value) => updateDispositionsTestament(side, (current) => ({
                          ...current,
                          active: value === 'oui',
                          dispositionType: value === 'oui'
                            ? (current.dispositionType ?? 'legs_universel')
                            : current.dispositionType,
                          beneficiaryRef: value === 'oui'
                            ? (current.beneficiaryRef ?? getFirstTestamentBeneficiaryRef(side))
                            : current.beneficiaryRef,
                          quotePartPct: current.quotePartPct || DEFAULT_SUCCESSION_TESTAMENT_CONFIG.quotePartPct,
                        }))}
                        options={OUI_NON_OPTIONS}
                      />
                    </div>

                    {testament.active && (
                      <>
                        <div className="sc-field">
                          <label>Type de disposition testamentaire</label>
                          <ScSelect
                            className="sc-testament-select"
                            value={selectedDisposition}
                            onChange={(value) => updateDispositionsTestament(side, (current) => ({
                              ...current,
                              dispositionType: value as SuccessionDispositionTestamentaire,
                              beneficiaryRef: value === 'legs_particulier'
                                ? current.beneficiaryRef
                                : (current.beneficiaryRef ?? getFirstTestamentBeneficiaryRef(side)),
                            }))}
                            options={DISPOSITION_TESTAMENTAIRE_OPTIONS}
                          />
                          {dispositionDescription && (
                            <p className="sc-hint sc-hint--compact">{dispositionDescription}</p>
                          )}
                        </div>

                        {selectedDisposition !== 'legs_particulier' && (
                          <>
                            <div className="sc-field">
                              <label>Beneficiaire</label>
                              <ScSelect
                                className="sc-testament-select"
                                value={testament.beneficiaryRef ?? ''}
                                onChange={(value) => updateDispositionsTestament(side, (current) => ({
                                  ...current,
                                  beneficiaryRef: value as SuccessionBeneficiaryRef,
                                }))}
                                options={beneficiarySelectOptions}
                              />
                              <p className="sc-hint sc-hint--compact">
                                {reserveHint
                                  ? `Beneficiaires reservataires : ${reserveHint}.`
                                  : 'Aucune reserve hereditaire detectee sur cette branche.'}
                              </p>
                            </div>

                            {selectedDisposition === 'legs_titre_universel' && (
                              <div className="sc-field">
                                <label>Quote-part du legs a titre universel (%)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={testament.quotePartPct}
                                  onChange={(e) => updateDispositionsTestament(side, (current) => ({
                                    ...current,
                                    quotePartPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                  }))}
                                  placeholder="Ex : 50"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {selectedDisposition === 'legs_particulier' && (
                          <div className="sc-field">
                            <label>Legs particuliers</label>
                            <div className="sc-testament-legacy-list">
                              {testament.particularLegacies.length === 0 && (
                                <p className="sc-hint sc-hint--compact">
                                  Aucun legs particulier saisi pour le moment.
                                </p>
                              )}
                              {testament.particularLegacies.map((entry) => (
                                <div key={entry.id} className="sc-testament-legacy-row">
                                  <ScSelect
                                    className="sc-testament-select"
                                    value={entry.beneficiaryRef ?? ''}
                                    onChange={(value) => onUpdateParticularLegacy(
                                      side,
                                      entry.id,
                                      'beneficiaryRef',
                                      value as SuccessionBeneficiaryRef,
                                    )}
                                    options={beneficiarySelectOptions}
                                  />
                                  <input
                                    type="number"
                                    min={0}
                                    value={entry.amount || ''}
                                    onChange={(e) => onUpdateParticularLegacy(
                                      side,
                                      entry.id,
                                      'amount',
                                      Number(e.target.value) || 0,
                                    )}
                                    placeholder="Montant"
                                  />
                                  <input
                                    type="text"
                                    className="sc-input--left"
                                    value={entry.label ?? ''}
                                    onChange={(e) => onUpdateParticularLegacy(
                                      side,
                                      entry.id,
                                      'label',
                                      e.target.value,
                                    )}
                                    placeholder="Libelle optionnel"
                                  />
                                  <button
                                    type="button"
                                    className="sc-remove-btn sc-remove-btn--quiet"
                                    onClick={() => onRemoveParticularLegacy(side, entry.id)}
                                    title="Supprimer ce legs"
                                    aria-label="Supprimer ce legs"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="sc-child-add-btn"
                              onClick={() => onAddParticularLegacy(side)}
                            >
                              + Ajouter un legs
                            </button>
                          </div>
                        )}

                        {showAscendantsField && (
                          <div className="sc-field">
                            <label>Ascendants survivants</label>
                            {hasDerivedParents ? (
                              <span className="sc-auto-derived">
                                Oui - deduit des membres ajoutes
                              </span>
                            ) : (
                              <ScSelect
                                value={dispositionsDraft.ascendantsSurvivantsBySide[side] ? 'oui' : 'non'}
                                onChange={(value) => setDispositionsDraft((prev) => ({
                                  ...prev,
                                  ascendantsSurvivantsBySide: {
                                    ...prev.ascendantsSurvivantsBySide,
                                    [side]: value === 'oui',
                                  },
                                }))}
                                options={OUI_NON_OPTIONS}
                              />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
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
