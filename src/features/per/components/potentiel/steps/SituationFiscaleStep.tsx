/**
 * SituationFiscaleStep - Generic fiscal input screen for N-1 reconstruction or N projection.
 */

import React, { useState } from 'react';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type { DeclarantRevenus, PlafondMadelinDetail } from '../../../../../engine/per';
import type { PerChildDraft } from '../../../utils/perParts';
import { PerAmountInput } from '../PerAmountInput';
import { PerMadelinInfoModal } from '../PerMadelinInfoModal';
import {
  PerIncomeTable,
  SectionHeader,
  type PerAbattementConfig,
  type PerIncomeFilters,
} from './PerIncomeTable';

export type FiscalStepVariant = 'revenus-n1' | 'projection-n' | 'versements-n';

interface SituationFiscaleStepProps {
  variant: FiscalStepVariant;
  yearLabel: string;
  showFoyerCard: boolean;
  situationFamiliale: 'celibataire' | 'marie';
  isole: boolean;
  children: PerChildDraft[];
  isCouple: boolean;
  mutualisationConjoints: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
  plafondMadelin?: {
    declarant1: PlafondMadelinDetail;
    declarant2?: PlafondMadelinDetail;
  };
  incomeFilters: PerIncomeFilters;
  abat10SalCfg: PerAbattementConfig;
  abat10RetCfg: PerAbattementConfig;
  onUpdateSituation: (_patch: Partial<{
    situationFamiliale: 'celibataire' | 'marie';
    isole: boolean;
    mutualisationConjoints: boolean;
  }>) => void;
  onAddChild: () => void;
  onUpdateChildMode: (_id: number, _mode: PerChildDraft['mode']) => void;
  onRemoveChild: (_id: number) => void;
  onToggleIncomeFilter: (_key: keyof PerIncomeFilters) => void;
  onUpdateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
}

type ContributionFieldKey =
  | 'cotisationsPer163Q'
  | 'cotisationsPerp'
  | 'cotisationsArt83'
  | 'cotisationsMadelin154bis'
  | 'cotisationsMadelinRetraite'
  | 'abondementPerco'
  | 'cotisationsPrevo';

export default function SituationFiscaleStep({
  variant,
  yearLabel,
  showFoyerCard,
  situationFamiliale,
  isole,
  children,
  isCouple,
  mutualisationConjoints,
  declarant1,
  declarant2,
  plafondMadelin,
  incomeFilters,
  abat10SalCfg,
  abat10RetCfg,
  onUpdateSituation,
  onAddChild,
  onUpdateChildMode,
  onRemoveChild,
  onToggleIncomeFilter,
  onUpdateDeclarant,
}: SituationFiscaleStepProps): React.ReactElement {
  const [showMadelinInfo, setShowMadelinInfo] = useState(false);
  const showTnsContributionRows = declarant1.statutTns || declarant2.statutTns;
  const contributionRows: {
    label: string;
    note: string;
    key: ContributionFieldKey;
    tnsOnly?: boolean;
    infoAction?: boolean;
  }[] = [
    { label: 'PER 163 quatervicies', note: variant === 'revenus-n1' ? '2042 : 6NS / 6NT' : 'année en cours', key: 'cotisationsPer163Q' },
    { label: 'PERP et assimilés', note: variant === 'revenus-n1' ? '2042 : 6RS / 6RT' : 'année en cours', key: 'cotisationsPerp' },
    { label: 'Art. 83 employeur + salarié', note: variant === 'revenus-n1' ? '2042 : 6QS / 6QT' : 'année en cours', key: 'cotisationsArt83' },
    { label: 'PER 154 bis', note: variant === 'revenus-n1' ? '2042 : 6OS / 6OT' : 'année en cours', key: 'cotisationsMadelin154bis', tnsOnly: true, infoAction: true },
    { label: 'Madelin retraite', note: 'contribue à 6QS / 6QT', key: 'cotisationsMadelinRetraite', tnsOnly: true },
    { label: 'Abondement PERCO', note: 'contribue à 6QS / 6QT', key: 'abondementPerco' },
    { label: 'Prévoyance Madelin', note: 'nécessaire pour le calcul de l\'assiette de versement 154 bis', key: 'cotisationsPrevo', tnsOnly: true },
  ];

  return (
    <div className="per-step per-step--situation">
      {showFoyerCard && (
        <div className="premium-card premium-card--guide sim-card--guide per-situation-card">
          <SectionHeader
            title="Situation familiale"
            icon="foyer"
          />

          <div className="per-situation-foyer-grid">
            <div className="per-field premium-field per-field--no-label" data-testid="per-situation-field">
              <SimSelect
                ariaLabel="Situation familiale"
                value={situationFamiliale}
                onChange={(value) => {
                  onUpdateSituation({
                    situationFamiliale: value as 'celibataire' | 'marie',
                  });
                }}
                options={[
                  { value: 'celibataire', label: 'Célibataire / Veuf / Divorcé' },
                  { value: 'marie', label: 'Marié / Pacsé' },
                ]}
              />
              {situationFamiliale === 'celibataire' && (
                <label className="per-checkbox-label per-checkbox-label--small per-checkbox-label--isole">
                  <input
                    type="checkbox"
                    className="per-checkbox"
                    checked={isole}
                    onChange={(event) => onUpdateSituation({ isole: event.target.checked })}
                  />
                  <span className="per-checkbox-label__text">Parent isolé</span>
                </label>
              )}
            </div>

            <div className="per-children-zone">
              <button
                type="button"
                className="per-child-add-btn"
                onClick={onAddChild}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ajouter un enfant
              </button>
              {children.length > 0 && (
                <div className="per-children-list">
                  {children.map((child, index) => (
                    <div key={child.id} className="per-child-row">
                      <span className="per-child-row__label">E{index + 1}</span>
                      <SimSelect
                        value={child.mode}
                        onChange={(value) => onUpdateChildMode(child.id, value as PerChildDraft['mode'])}
                        options={[
                          { value: 'charge', label: 'À charge' },
                          { value: 'shared', label: 'Garde alternée' },
                        ]}
                        className="per-child-row__select"
                      />
                      <button
                        type="button"
                        className="per-child-remove-btn"
                        onClick={() => onRemoveChild(child.id)}
                        aria-label={`Supprimer enfant ${index + 1}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PerIncomeTable
        isCouple={isCouple}
        declarant1={declarant1}
        declarant2={declarant2}
        incomeFilters={incomeFilters}
        abat10SalCfg={abat10SalCfg}
        abat10RetCfg={abat10RetCfg}
        onToggleIncomeFilter={onToggleIncomeFilter}
        onUpdateDeclarant={onUpdateDeclarant}
      />

      <div className="premium-card premium-card--guide sim-card--guide per-contribution-card">
        <SectionHeader
          title="Versements retraite"
          subtitle={`Renseignez les montants ${yearLabel} par déclarant pour chaque enveloppe de retraite.`}
          icon="versements"
        />

        <div className={`per-contribution-table ${isCouple ? 'is-couple' : ''}`}>
          <div className="per-contribution-table-head per-contribution-table-head--label">Catégorie</div>
          <div className="per-contribution-table-head">Déclarant 1</div>
          {isCouple && <div className="per-contribution-table-head">Déclarant 2</div>}

          {contributionRows.filter(row => !row.tnsOnly || showTnsContributionRows).map((row) => (
            <React.Fragment key={row.key}>
              <div className="per-contribution-table-label">
                <span className="per-contribution-table-label__text">
                  {row.label}
                  {row.infoAction && (
                    <button
                      type="button"
                      className="per-info-btn"
                      onClick={() => setShowMadelinInfo(true)}
                      aria-label="Afficher le détail des enveloppes Madelin 154 bis"
                    >
                      i
                    </button>
                  )}
                </span>
                <small>{row.note}</small>
              </div>
              <div className="per-contribution-table-cell">
                <span className="per-contribution-mobile-label">Déclarant 1</span>
                <PerAmountInput
                  value={declarant1[row.key]}
                  ariaLabel={`${row.label} déclarant 1`}
                  className="per-contribution-input"
                  disabled={Boolean(row.tnsOnly && !declarant1.statutTns)}
                  onChange={(value) => onUpdateDeclarant(1, { [row.key]: value })}
                />
              </div>
              {isCouple && (
                <div className="per-contribution-table-cell">
                  <span className="per-contribution-mobile-label">Déclarant 2</span>
                  <PerAmountInput
                    value={declarant2[row.key]}
                    ariaLabel={`${row.label} déclarant 2`}
                    className="per-contribution-input"
                    disabled={Boolean(row.tnsOnly && !declarant2.statutTns)}
                    onChange={(value) => onUpdateDeclarant(2, { [row.key]: value })}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {isCouple && (
          <label className="per-toggle-label per-toggle-label--panel per-contribution-toggle">
            <input
              type="checkbox"
              checked={mutualisationConjoints}
              onChange={(event) => onUpdateSituation({ mutualisationConjoints: event.target.checked })}
            />
            <span>Mutualisation des plafonds (case 6QR)</span>
          </label>
        )}
      </div>

      {showMadelinInfo && (
        <PerMadelinInfoModal
          declarant1={plafondMadelin?.declarant1}
          declarant2={plafondMadelin?.declarant2}
          isCouple={isCouple}
          onClose={() => setShowMadelinInfo(false)}
        />
      )}
    </div>
  );
}
