import type { Dispatch, SetStateAction } from 'react';
import { REGIMES_MATRIMONIAUX } from '../../../engine/civil';
import {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  type FamilyMember,
  type SuccessionEnfant,
  type SituationMatrimoniale,
} from '../successionDraft';
import { getEnfantNodeLabel, getEnfantRattachementOptions } from '../successionEnfants';
import {
  PACS_CONVENTION_OPTIONS,
  SITUATION_OPTIONS,
} from '../successionSimulator.constants';
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
    <div className="premium-card sc-card sc-card--guide">
      <header className="sc-card__header">
        <div className="sc-card__title-row">
          <div className="sc-section-icon-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="sc-card__title">Contexte familial</h2>
        </div>
      </header>
      <div className="sc-card__divider" />
      <div className="sc-context-grid">
        <div className="sc-civil-grid">
          <div className={`sc-civil-grid__top-row${showSecondBirthDate ? ' sc-civil-grid__top-row--triple' : ''}`}>
            <div className="sc-field">
              <label>Situation familiale</label>
              <ScSelect
                value={civilContext.situationMatrimoniale}
                onChange={(value) => onSituationChange(value as SituationMatrimoniale)}
                options={SITUATION_OPTIONS}
              />
            </div>
            <div className="sc-field">
              <label>{birthDateLabels.primary}</label>
              <input
                type="date"
                className="sc-input--left"
                value={civilContext.dateNaissanceEpoux1 ?? ''}
                onChange={(e) => setCivilContext((prev) => ({
                  ...prev,
                  dateNaissanceEpoux1: e.target.value || undefined,
                }))}
              />
            </div>
            {showSecondBirthDate && (
              <div className="sc-field">
                <label>{birthDateLabels.secondary}</label>
                <input
                  type="date"
                  className="sc-input--left"
                  value={civilContext.dateNaissanceEpoux2 ?? ''}
                  onChange={(e) => setCivilContext((prev) => ({
                    ...prev,
                    dateNaissanceEpoux2: e.target.value || undefined,
                  }))}
                />
              </div>
            )}
          </div>

          {civilContext.situationMatrimoniale === 'marie' && (
            <div className="sc-field">
              <label>Régime matrimonial</label>
              <ScSelect
                value={civilContext.regimeMatrimonial ?? 'communaute_legale'}
                onChange={(value) =>
                  setCivilContext((prev) => ({
                    ...prev,
                    regimeMatrimonial: value as keyof typeof REGIMES_MATRIMONIAUX,
                  }))}
                options={Object.values(REGIMES_MATRIMONIAUX).map((regime) => ({
                  value: regime.id,
                  label: regime.label,
                }))}
              />
            </div>
          )}
          {civilContext.situationMatrimoniale === 'pacse' && (
            <div className="sc-field">
              <label>Convention PACS</label>
              <ScSelect
                value={civilContext.pacsConvention}
                onChange={(value) =>
                  setCivilContext((prev) => ({
                    ...prev,
                    pacsConvention: value as 'separation' | 'indivision',
                  }))}
                options={PACS_CONVENTION_OPTIONS}
              />
            </div>
          )}
          <div className="sc-dispositions-trigger">
            <button
              type="button"
              className="sc-child-add-btn"
              onClick={onOpenDispositions}
              disabled={!canOpenDispositionsModal}
              title={!canOpenDispositionsModal ? 'Merci de renseigner un contexte familial au préalable' : undefined}
            >
              + Dispositions
            </button>
            {!canOpenDispositionsModal && (
              <p className="sc-hint sc-hint--compact">
                Merci de renseigner un contexte familial au préalable.
              </p>
            )}
          </div>
        </div>

        <div className="sc-children-zone">
          <div className="sc-children-actions">
            <button
              type="button"
              className="sc-child-add-btn"
              onClick={onAddEnfant}
            >
              + Ajouter un enfant
            </button>
            <button
              type="button"
              className="sc-member-add-icon-btn"
              onClick={onToggleAddMemberPanel}
              aria-label="Ajouter un membre de la famille"
              title="Ajouter un membre"
            >
              +
            </button>
          </div>

          {enfantsContext.length === 0 && familyMembers.length === 0 ? (
            <p className="sc-hint sc-hint--compact">Aucun enfant ni membre déclaré pour l&apos;instant.</p>
          ) : (
            <>
              {enfantsContext.length > 0 && (
                <div className="sc-children-list">
                  {enfantsContext.map((enfant, idx) => (
                    <div key={enfant.id} className={`sc-child-row${enfant.deceased ? ' sc-child-row--deceased' : ''}`}>
                      <span className="sc-child-row__label">{getEnfantNodeLabel(idx, enfant.deceased)}</span>
                      {enfantRattachementOptions.length > 1 && (
                        <ScSelect
                          className="sc-child-select"
                          value={enfant.rattachement}
                          onChange={(value) => onUpdateEnfantRattachement(enfant.id, value as 'commun' | 'epoux1' | 'epoux2')}
                          options={enfantRattachementOptions}
                        />
                      )}
                      <label className="sc-checkbox-label">
                        <input
                          type="checkbox"
                          className="sc-checkbox"
                          checked={!!enfant.deceased}
                          onChange={(e) => onToggleEnfantDeceased(enfant.id, e.target.checked)}
                        />
                        Décédé
                      </label>
                      <button
                        type="button"
                        className="sc-child-remove-btn"
                        onClick={() => onRemoveEnfant(enfant.id)}
                        aria-label={`Supprimer enfant ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {familyMembers.length > 0 && (
                <div className="sc-members-list">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="sc-member-chip">
                      <span className="sc-member-chip__icon">⊕</span>
                      <span className="sc-member-chip__label">{labelMember(member, enfantsContext)}</span>
                      <button
                        type="button"
                        className="sc-child-remove-btn"
                        onClick={() => onRemoveFamilyMember(member.id)}
                        aria-label={`Supprimer ${labelMember(member, enfantsContext)}`}
                      >
                        ✕
                      </button>
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
