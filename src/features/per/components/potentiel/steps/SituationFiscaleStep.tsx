/**
 * SituationFiscaleStep - Generic fiscal input screen for N-1 reconstruction or N projection.
 */

import React, { useState } from 'react';
import {
  SimActionButton,
  SimAmountInputEuro,
  SimInfoButton,
  SimModalShell,
  SimSelect,
} from '@/components/ui/sim';
import type { DeclarantRevenus, PlafondMadelinDetail } from '@/engine/per';
import type { PerDeclarantPatch } from '@/features/per/hooks/usePerPotentiel';
import type { PerChildDraft } from '@/features/per/utils/perParts';
import { PerMadelinInfoModal } from '../PerMadelinInfoModal';
import {
  PerIncomeTable,
  SectionHeader,
  type PerAbattementConfig,
  type PerIncomeFilters,
} from './PerIncomeTable';

type FiscalStepVariant = 'revenus-n1' | 'projection-n' | 'versements-n';

interface SituationFiscaleStepProps {
  variant: FiscalStepVariant;
  yearLabel: string;
  showFoyerCard: boolean;
  showIncomeCard: boolean;
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
  onUpdateSituation: (
    _patch: Partial<{
      situationFamiliale: 'celibataire' | 'marie';
      isole: boolean;
      mutualisationConjoints: boolean;
    }>,
  ) => void;
  onAddChild: () => void;
  onUpdateChildMode: (_id: number, _mode: PerChildDraft['mode']) => void;
  onRemoveChild: (_id: number) => void;
  onToggleIncomeFilter: (_key: keyof PerIncomeFilters) => void;
  onUpdateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
  onUpdateDeclarants: (_patches: PerDeclarantPatch[]) => void;
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
  showIncomeCard,
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
  onUpdateDeclarants,
}: SituationFiscaleStepProps): React.ReactElement {
  const [showMadelinInfo, setShowMadelinInfo] = useState(false);
  const [versementsInfoOpen, setVersementsInfoOpen] = useState(false);
  const showTnsContributionRows = declarant1.statutTns || declarant2.statutTns;
  const contributionRows: {
    label: string;
    note: string;
    key: ContributionFieldKey;
    tnsOnly?: boolean;
    infoAction?: boolean;
  }[] = [
    {
      label: 'PER 163 quatervicies',
      note: variant === 'revenus-n1' ? '2042 : 6NS / 6NT' : 'année en cours',
      key: 'cotisationsPer163Q',
    },
    {
      label: 'PERP et assimilés',
      note: variant === 'revenus-n1' ? '2042 : 6RS / 6RT' : 'année en cours',
      key: 'cotisationsPerp',
    },
    {
      label: 'Art. 83 employeur + salarié',
      note: variant === 'revenus-n1' ? '2042 : 6QS / 6QT' : 'année en cours',
      key: 'cotisationsArt83',
    },
    {
      label: 'PER 154 bis',
      note: variant === 'revenus-n1' ? '2042 : 6OS / 6OT' : 'année en cours',
      key: 'cotisationsMadelin154bis',
      tnsOnly: true,
      infoAction: true,
    },
    {
      label: 'Madelin retraite',
      note: 'contribue à 6QS / 6QT',
      key: 'cotisationsMadelinRetraite',
      tnsOnly: true,
    },
    { label: 'Abondement PERCO', note: 'contribue à 6QS / 6QT', key: 'abondementPerco' },
    {
      label: 'Prévoyance Madelin',
      note: "nécessaire pour le calcul de l'assiette de versement 154 bis",
      key: 'cotisationsPrevo',
      tnsOnly: true,
    },
  ];
  const visibleContributionRows = contributionRows.filter(
    (row) => !row.tnsOnly || showTnsContributionRows,
  );

  return (
    <div className="per-step per-step--situation">
      {showFoyerCard && (
        <div className="premium-card premium-card--guide sim-card--guide per-situation-card">
          <SectionHeader title="Situation familiale" icon="foyer" />

          <div className="per-situation-foyer-grid">
            <div
              className="per-field premium-field per-field--no-label"
              data-testid="per-situation-field"
            >
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
              <SimActionButton
                variant="add"
                mode="text"
                label="Ajouter un enfant"
                className="per-child-add-action"
                onClick={onAddChild}
              />
              {children.length > 0 && (
                <div className="per-children-list">
                  {children.map((child, index) => (
                    <div key={child.id} className="per-child-row">
                      <span className="per-child-row__label">E{index + 1}</span>
                      <SimSelect
                        value={child.mode}
                        onChange={(value) =>
                          onUpdateChildMode(child.id, value as PerChildDraft['mode'])
                        }
                        options={[
                          { value: 'charge', label: 'À charge' },
                          { value: 'shared', label: 'Garde alternée' },
                        ]}
                        className="per-child-row__select"
                      />
                      <SimActionButton
                        variant="delete"
                        mode="icon"
                        label={`Supprimer enfant ${index + 1}`}
                        ariaLabel={`Supprimer enfant ${index + 1}`}
                        className="per-child-remove-action"
                        danger
                        onClick={() => onRemoveChild(child.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showIncomeCard && (
        <PerIncomeTable
          isCouple={isCouple}
          declarant1={declarant1}
          declarant2={declarant2}
          incomeFilters={incomeFilters}
          abat10SalCfg={abat10SalCfg}
          abat10RetCfg={abat10RetCfg}
          onToggleIncomeFilter={onToggleIncomeFilter}
          onUpdateDeclarant={onUpdateDeclarant}
          onUpdateDeclarants={onUpdateDeclarants}
        />
      )}

      <div className="premium-card premium-card--guide sim-card--guide per-contribution-card">
        <SectionHeader
          title="Versements retraite"
          icon="versements"
          actions={
            <SimInfoButton
              ariaLabel="Comprendre les versements retraite"
              onClick={() => setVersementsInfoOpen(true)}
            />
          }
        />

        {variant === 'versements-n' && !showTnsContributionRows ? (
          <div className="per-tns-guide" role="note">
            <strong>PER 154 bis</strong>
            <span>
              Pour saisir ce montant : activez la projection de l’année en cours, activez TNS,
              renseignez un revenu TNS puis complétez la ligne PER 154 bis.
            </span>
          </div>
        ) : null}

        <div
          className="per-contribution-section"
          role="group"
          aria-label="Détail des versements retraite"
        >
          <div className={`per-contribution-table ${isCouple ? 'is-couple' : ''}`}>
            <div className="per-contribution-table-head per-contribution-table-head--label">
              Catégorie
            </div>
            <div className="per-contribution-table-head">Déclarant 1</div>
            {isCouple && <div className="per-contribution-table-head">Déclarant 2</div>}

            {visibleContributionRows.map((row) => (
              <React.Fragment key={row.key}>
                <div className="per-contribution-table-label">
                  <span className="per-contribution-table-label__text">
                    {row.label}
                    {row.infoAction && (
                      <SimInfoButton
                        ariaLabel="Afficher le détail des enveloppes Madelin 154 bis"
                        onClick={() => setShowMadelinInfo(true)}
                      />
                    )}
                  </span>
                  <small>{row.note}</small>
                </div>
                <div className="per-contribution-table-cell">
                  <span className="per-contribution-mobile-label">Déclarant 1</span>
                  <SimAmountInputEuro
                    value={declarant1[row.key]}
                    ariaLabel={`${row.label} déclarant 1`}
                    className="per-contribution-input"
                    unit=""
                    disabled={Boolean(row.tnsOnly && !declarant1.statutTns)}
                    onChange={(value) => onUpdateDeclarant(1, { [row.key]: value })}
                  />
                </div>
                {isCouple && (
                  <div className="per-contribution-table-cell">
                    <span className="per-contribution-mobile-label">Déclarant 2</span>
                    <SimAmountInputEuro
                      value={declarant2[row.key]}
                      ariaLabel={`${row.label} déclarant 2`}
                      className="per-contribution-input"
                      unit=""
                      disabled={Boolean(row.tnsOnly && !declarant2.statutTns)}
                      onChange={(value) => onUpdateDeclarant(2, { [row.key]: value })}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {isCouple && (
          <label className="per-toggle-label per-toggle-label--panel per-contribution-toggle">
            <input
              type="checkbox"
              checked={mutualisationConjoints}
              onChange={(event) =>
                onUpdateSituation({ mutualisationConjoints: event.target.checked })
              }
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

      {versementsInfoOpen ? (
        <SimModalShell
          title="Versements retraite"
          subtitle={`Aide de saisie ${yearLabel}`}
          onClose={() => setVersementsInfoOpen(false)}
          modalClassName="sim-modal--lg"
          bodyClassName="sim-info-modal-content"
        >
          <p>
            Saisissez les montants par déclarant et par enveloppe. Les lignes Madelin apparaissent
            lorsque le profil TNS est activé dans les revenus imposables.
          </p>
        </SimModalShell>
      ) : null}
    </div>
  );
}
