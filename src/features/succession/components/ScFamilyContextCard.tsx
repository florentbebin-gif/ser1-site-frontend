import type { Dispatch, SetStateAction } from 'react';
import { SimActionButton } from '@/components/ui/sim';
import { IconUsers } from '@/icons/ui';
import { REGIMES_MATRIMONIAUX } from '../../../engine/succession/civil';
import type { DEFAULT_SUCCESSION_CIVIL_CONTEXT } from '../successionDraft';
import {
  type FamilyMember,
  type SuccessionEnfant,
  type SituationMatrimoniale,
} from '../successionDraft';
import type { getEnfantRattachementOptions } from '../successionEnfants';
import { getEnfantNodeLabel } from '../successionEnfants';
import { PACS_CONVENTION_OPTIONS, SITUATION_OPTIONS } from '../successionSimulator.constants';
import { labelMember } from '../successionSimulator.helpers';
import { ScSelect } from './ScSelect';

interface ScFamilyContextCardProps {
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  birthDateLabels: { primary: string; secondary?: string };
  showSecondBirthDate: boolean;
  canOpenDispositionsModal: boolean;
  enfantRattachementOptions: ReturnType<typeof getEnfantRattachementOptions>;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  onSituationChange: (_situationMatrimoniale: SituationMatrimoniale) => void;
  setCivilContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT>>;
  onOpenDispositions: () => void;
  onAddEnfant: () => void;
  onToggleAddMemberPanel: () => void;
  onUpdateEnfantRattachement: (_id: string, _rattachement: 'commun' | 'epoux1' | 'epoux2') => void;
  onToggleEnfantDeceased: (_id: string, _deceased: boolean) => void;
  onRemoveEnfant: (_id: string) => void;
  onRemoveFamilyMember: (_id: string) => void;
}

export default function ScFamilyContextCard({
  civilContext,
  birthDateLabels,
  showSecondBirthDate,
  canOpenDispositionsModal,
  enfantRattachementOptions,
  enfantsContext,
  familyMembers,
  onSituationChange,
  setCivilContext,
  onOpenDispositions,
  onAddEnfant,
  onToggleAddMemberPanel,
  onUpdateEnfantRattachement,
  onToggleEnfantDeceased,
  onRemoveEnfant,
  onRemoveFamilyMember,
}: ScFamilyContextCardProps) {
  return (
    <div className="premium-card sc-card sc-card--guide sim-card--guide">
      <header className="sc-card__header sim-card__header sim-card__header--bleed">
        <div className="sc-card__title-row sim-card__title sim-card__title-row">
          <div className="sim-card__icon">
            <IconUsers />
          </div>
          <h2 className="sc-card__title">Contexte familial</h2>
        </div>
      </header>
      <div className="sc-card__divider sim-divider" />
      <div className="sc-context-grid">
        <div className="sc-civil-grid">
          <div
            className={`sc-civil-grid__top-row${showSecondBirthDate ? ' sc-civil-grid__top-row--triple' : ''}`}
          >
            <div className="sc-field">
              <label htmlFor="sc-family-situation">Situation familiale</label>
              <ScSelect
                id="sc-family-situation"
                value={civilContext.situationMatrimoniale}
                onChange={(value) => onSituationChange(value as SituationMatrimoniale)}
                options={SITUATION_OPTIONS}
              />
            </div>
            <div className="sc-field">
              <label htmlFor="sc-family-date-naissance-epoux1">{birthDateLabels.primary}</label>
              <input
                id="sc-family-date-naissance-epoux1"
                type="date"
                className="sc-input--left"
                value={civilContext.dateNaissanceEpoux1 ?? ''}
                onChange={(e) =>
                  setCivilContext((prev) => ({
                    ...prev,
                    dateNaissanceEpoux1: e.target.value || undefined,
                  }))
                }
              />
            </div>
            {showSecondBirthDate && (
              <div className="sc-field">
                <label htmlFor="sc-family-date-naissance-epoux2">{birthDateLabels.secondary}</label>
                <input
                  id="sc-family-date-naissance-epoux2"
                  type="date"
                  className="sc-input--left"
                  value={civilContext.dateNaissanceEpoux2 ?? ''}
                  onChange={(e) =>
                    setCivilContext((prev) => ({
                      ...prev,
                      dateNaissanceEpoux2: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            )}
          </div>

          {civilContext.situationMatrimoniale === 'marie' && (
            <div className="sc-field">
              <label htmlFor="sc-family-regime-matrimonial">Régime matrimonial</label>
              <ScSelect
                id="sc-family-regime-matrimonial"
                value={civilContext.regimeMatrimonial ?? 'communaute_legale'}
                onChange={(value) =>
                  setCivilContext((prev) => ({
                    ...prev,
                    regimeMatrimonial: value as keyof typeof REGIMES_MATRIMONIAUX,
                  }))
                }
                options={Object.values(REGIMES_MATRIMONIAUX).map((regime) => ({
                  value: regime.id,
                  label: regime.label,
                }))}
              />
            </div>
          )}
          {civilContext.situationMatrimoniale === 'pacse' && (
            <div className="sc-field">
              <label htmlFor="sc-family-pacs-convention">Convention PACS</label>
              <ScSelect
                id="sc-family-pacs-convention"
                value={civilContext.pacsConvention}
                onChange={(value) =>
                  setCivilContext((prev) => ({
                    ...prev,
                    pacsConvention: value as 'separation' | 'indivision',
                  }))
                }
                options={PACS_CONVENTION_OPTIONS}
              />
            </div>
          )}
          <div className="sc-dispositions-trigger">
            <SimActionButton
              variant="edit"
              mode="text"
              label="Dispositions"
              className="sc-child-add-btn"
              onClick={onOpenDispositions}
              disabled={!canOpenDispositionsModal}
              title={
                !canOpenDispositionsModal
                  ? 'Merci de renseigner un contexte familial au préalable'
                  : undefined
              }
            />
            {!canOpenDispositionsModal && (
              <p className="sc-hint sc-hint--compact">
                Merci de renseigner un contexte familial au préalable.
              </p>
            )}
          </div>
        </div>

        <div className="sc-children-zone">
          <div className="sc-children-actions">
            <SimActionButton
              variant="add"
              mode="text"
              label="Ajouter un enfant"
              className="sc-child-add-btn sc-child-add-btn--prominent"
              onClick={onAddEnfant}
            />
            <SimActionButton
              variant="add"
              mode="icon"
              label="Ajouter"
              className="sc-member-add-icon-btn"
              onClick={onToggleAddMemberPanel}
              ariaLabel="Ajouter un membre de la famille"
              title="Ajouter un membre"
            />
          </div>

          {enfantsContext.length === 0 && familyMembers.length === 0 ? (
            <p className="sc-hint sc-hint--compact">
              Aucun enfant ni membre déclaré pour l&apos;instant.
            </p>
          ) : (
            <>
              {enfantsContext.length > 0 && (
                <div className="sc-children-list">
                  {enfantsContext.map((enfant, idx) => (
                    <div
                      key={enfant.id}
                      className={`sc-child-row${enfant.deceased ? ' sc-child-row--deceased' : ''}`}
                    >
                      <span className="sc-child-row__label">
                        {getEnfantNodeLabel(idx, enfant.deceased)}
                      </span>
                      {enfantRattachementOptions.length > 1 && (
                        <ScSelect
                          ariaLabel={`Rattachement de ${getEnfantNodeLabel(idx, enfant.deceased)}`}
                          className="sc-child-select"
                          value={enfant.rattachement}
                          onChange={(value) =>
                            onUpdateEnfantRattachement(
                              enfant.id,
                              value as 'commun' | 'epoux1' | 'epoux2',
                            )
                          }
                          options={enfantRattachementOptions}
                        />
                      )}
                      <label className="sc-checkbox-label sc-checkbox-label--mini">
                        <input
                          type="checkbox"
                          checked={!!enfant.deceased}
                          onChange={(e) => onToggleEnfantDeceased(enfant.id, e.target.checked)}
                        />
                        †
                      </label>
                      <SimActionButton
                        variant="delete"
                        mode="icon"
                        label="Supprimer"
                        className="sc-child-remove-btn"
                        onClick={() => onRemoveEnfant(enfant.id)}
                        ariaLabel={`Supprimer enfant ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {familyMembers.length > 0 && (
                <div className="sc-members-list">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="sc-member-chip">
                      <span className="sc-member-chip__icon">⊕</span>
                      <span className="sc-member-chip__label">
                        {labelMember(member, enfantsContext)}
                      </span>
                      <SimActionButton
                        variant="delete"
                        mode="icon"
                        label="Supprimer"
                        className="sc-child-remove-btn"
                        onClick={() => onRemoveFamilyMember(member.id)}
                        ariaLabel={`Supprimer ${labelMember(member, enfantsContext)}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
