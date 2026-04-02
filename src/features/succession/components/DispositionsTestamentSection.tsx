import type { Dispatch, SetStateAction } from 'react';
import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SituationMatrimoniale,
  type SuccessionBeneficiaryRef,
  type SuccessionDispositionTestamentaire,
  type SuccessionEnfant,
  type SuccessionPrimarySide,
  type SuccessionTestamentConfig,
} from '../successionDraft';
import type { SuccessionTestamentBeneficiaryOption } from '../successionTestament';
import {
  getQuotiteDisponiblePctForSide,
  getReserveHintForSide,
  getTestamentCardTitle,
} from '../successionTestament';
import { TESTAMENT_TYPE_DESCRIPTIONS } from '../successionTestament.constants';
import { DISPOSITION_TESTAMENTAIRE_OPTIONS, OUI_NON_OPTIONS } from '../successionSimulator.constants';
import type { DispositionsDraftState } from '../successionSimulator.helpers';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';

interface DispositionsTestamentSectionProps {
  dispositionsDraft: DispositionsDraftState;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  testamentSides: SuccessionPrimarySide[];
  testamentBeneficiaryOptionsBySide: Record<
    SuccessionPrimarySide,
    SuccessionTestamentBeneficiaryOption[]
  >;
  descendantBranchesBySide: Record<SuccessionPrimarySide, number>;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  civilSituation: SituationMatrimoniale;
  updateDispositionsTestament: (
    side: SuccessionPrimarySide,
    updater: (current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
  ) => void;
  getFirstTestamentBeneficiaryRef: (side: SuccessionPrimarySide) => SuccessionBeneficiaryRef | null;
  onAddParticularLegacy: (side: SuccessionPrimarySide) => void;
  onUpdateParticularLegacy: (
    side: SuccessionPrimarySide,
    legacyId: string,
    field: 'beneficiaryRef' | 'amount' | 'label',
    value: string | number | SuccessionBeneficiaryRef | null,
  ) => void;
  onRemoveParticularLegacy: (side: SuccessionPrimarySide, legacyId: string) => void;
}

function clampPercentage(value: string): number {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

export function DispositionsTestamentSection({
  dispositionsDraft,
  setDispositionsDraft,
  testamentSides,
  testamentBeneficiaryOptionsBySide,
  descendantBranchesBySide,
  enfantsContext,
  familyMembers,
  civilSituation,
  updateDispositionsTestament,
  getFirstTestamentBeneficiaryRef,
  onAddParticularLegacy,
  onUpdateParticularLegacy,
  onRemoveParticularLegacy,
}: DispositionsTestamentSectionProps) {
  return (
    <div className="sc-dispositions-modal__section sc-dispositions-modal__section--testament">
      <div className="sc-dispositions-modal__section-header">
        <h4 className="sc-dispositions-modal__section-title">Testament</h4>
      </div>
      <div className={`sc-testament-grid${testamentSides.length === 1 ? ' sc-testament-grid--single' : ''}`}>
        {testamentSides.map((side) => {
          const testament = dispositionsDraft.testamentsBySide[side];
          const beneficiarySelectOptions = [
            { value: '', label: 'Choisir...', disabled: true },
            ...testamentBeneficiaryOptionsBySide[side],
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
                  className="sc-testament-select"
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
                        <label>Bénéficiaire</label>
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
                            ? `Bénéficiaires réservataires : ${reserveHint}.`
                            : 'Aucune réserve héréditaire détectée sur cette branche.'}
                        </p>
                      </div>

                      {selectedDisposition === 'legs_titre_universel' && (
                        <div className="sc-field">
                          <label>Quote-part du legs à titre universel (%)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={testament.quotePartPct}
                            onChange={(e) => updateDispositionsTestament(side, (current) => ({
                              ...current,
                              quotePartPct: clampPercentage(e.target.value),
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
                            <ScNumericInput
                              value={entry.amount || 0}
                              min={0}
                              onChange={(value) => onUpdateParticularLegacy(side, entry.id, 'amount', value)}
                            />
                            <input
                              type="text"
                              className="sc-input--left"
                              value={entry.label ?? ''}
                              onChange={(e) => onUpdateParticularLegacy(side, entry.id, 'label', e.target.value)}
                              placeholder="Libellé optionnel"
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
                          Oui - déduit des membres ajoutés
                        </span>
                      ) : (
                        <ScSelect
                          className="sc-testament-select"
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
  );
}
