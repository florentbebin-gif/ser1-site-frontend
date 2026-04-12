/**
 * SituationFiscaleStep - Generic fiscal input screen for N-1 reconstruction or N projection.
 */

import React from 'react';
import type { DeclarantRevenus } from '../../../../../engine/per';
import { PerAmountInput } from '../PerAmountInput';
import type { PerChildDraft } from '../../../utils/perParts';

export type FiscalStepVariant = 'revenus-n1' | 'projection-n' | 'versements-n';

interface SituationFiscaleStepProps {
  variant: FiscalStepVariant;
  yearLabel: string;
  showFoyerCard: boolean;
  incomeCardsOptional?: boolean;
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  children: PerChildDraft[];
  isCouple: boolean;
  mutualisationConjoints: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
  onUpdateSituation: (_patch: Partial<{
    situationFamiliale: 'celibataire' | 'marie';
    isole: boolean;
    mutualisationConjoints: boolean;
  }>) => void;
  onAddChild: () => void;
  onUpdateChildMode: (_id: number, _mode: PerChildDraft['mode']) => void;
  onRemoveChild: (_id: number) => void;
  onUpdateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
}

type IncomeFieldKey =
  | 'salaires'
  | 'art62'
  | 'bic'
  | 'retraites'
  | 'fonciersNets'
  | 'autresRevenus';

type ContributionFieldKey =
  | 'cotisationsPer163Q'
  | 'cotisationsPerp'
  | 'cotisationsArt83'
  | 'cotisationsMadelin154bis'
  | 'cotisationsMadelinRetraite'
  | 'abondementPerco'
  | 'cotisationsPrevo';

const incomeFields: { label: string; key: IncomeFieldKey }[] = [
  { label: 'Traitements et salaires', key: 'salaires' },
  { label: 'Revenus art. 62', key: 'art62' },
  { label: 'BIC / BNC / BA', key: 'bic' },
  { label: 'Pensions et retraites', key: 'retraites' },
  { label: 'Revenus fonciers nets', key: 'fonciersNets' },
  { label: 'Autres revenus', key: 'autresRevenus' },
];

function SectionIcon({ kind }: { kind: 'foyer' | 'revenus' | 'versements' }): React.ReactElement {
  if (kind === 'foyer') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (kind === 'revenus') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h18" />
      <path d="M6 11h12" />
      <path d="M8 15h8" />
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: 'foyer' | 'revenus' | 'versements';
}): React.ReactElement {
  return (
    <>
      <div className="sim-card__header sim-card__header--bleed per-section-header">
        <div className="sim-card__title-row">
          <div className="sim-card__icon">
            <SectionIcon kind={icon} />
          </div>
          <div className="per-section-title-block">
            <p className="premium-section-title">{eyebrow}</p>
            <h3 className="sim-card__title">{title}</h3>
          </div>
        </div>
        {subtitle && <p className="per-section-subtitle">{subtitle}</p>}
      </div>
      <div className="sim-divider" />
    </>
  );
}

function PerIncomeTable({
  yearLabel,
  incomeCardsOptional,
  isCouple,
  declarant1,
  declarant2,
  onUpdateDeclarant,
}: {
  yearLabel: string;
  incomeCardsOptional: boolean;
  isCouple: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
  onUpdateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
}): React.ReactElement {
  const subtitle = incomeCardsOptional
    ? `Les revenus ${yearLabel} sont facultatifs sur cet écran. Renseignez-les si vous souhaitez affiner la fiscalité liée au versement.`
    : `Renseignez les revenus ${yearLabel} pour reconstruire le calcul fiscal et les plafonds associés.`;

  return (
    <div className="premium-card premium-card--guide sim-card--guide per-income-table-card">
      <SectionHeader
        eyebrow="Revenus"
        title="Revenus imposables"
        subtitle={subtitle}
        icon="revenus"
      />

      <div className="per-income-table-wrap">
        <table className={`per-income-table ${isCouple ? '' : 'per-income-table--single'}`} aria-label="Revenus imposables">
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: isCouple ? '30%' : '60%' }} />
            {isCouple && <col style={{ width: '30%' }} />}
          </colgroup>
          <thead>
            <tr>
              <th aria-label="Catégorie"></th>
              <th>Déclarant 1</th>
              {isCouple && <th>Déclarant 2</th>}
            </tr>
          </thead>
          <tbody>
            {incomeFields.map((field) => (
              <tr key={field.key}>
                <td>{field.label}</td>
                <td data-column-label="Déclarant 1">
                  <PerAmountInput
                    value={declarant1[field.key]}
                    ariaLabel={`${field.label} déclarant 1`}
                    className="per-income-table-input"
                    onChange={(value) => onUpdateDeclarant(1, { [field.key]: value })}
                  />
                </td>
                {isCouple && (
                  <td data-column-label="Déclarant 2">
                    <PerAmountInput
                      value={declarant2[field.key]}
                      ariaLabel={`${field.label} déclarant 2`}
                      className="per-income-table-input"
                      onChange={(value) => onUpdateDeclarant(2, { [field.key]: value })}
                    />
                  </td>
                )}
              </tr>
            ))}
            <tr className="per-income-table-row-title">
              <td>Frais réels ou abattement 10 %</td>
              <td data-column-label="Déclarant 1">
                <div className="per-income-real-cell">
                  <select
                    className="per-select sim-field__control per-income-real-select"
                    value={declarant1.fraisReels ? 'reels' : 'abat10'}
                    onChange={(event) => onUpdateDeclarant(1, { fraisReels: event.target.value === 'reels' })}
                  >
                    <option value="abat10">10 %</option>
                    <option value="reels">FR</option>
                  </select>
                  {declarant1.fraisReels ? (
                    <PerAmountInput
                      value={declarant1.fraisReelsMontant}
                      ariaLabel="Montant des frais réels déclarant 1"
                      className="per-income-table-input"
                      onChange={(value) => onUpdateDeclarant(1, { fraisReelsMontant: value })}
                    />
                  ) : (
                    <div className="per-income-readonly">Abattement 10 % automatique</div>
                  )}
                </div>
              </td>
              {isCouple && (
                <td data-column-label="Déclarant 2">
                  <div className="per-income-real-cell">
                    <select
                      className="per-select sim-field__control per-income-real-select"
                      value={declarant2.fraisReels ? 'reels' : 'abat10'}
                      onChange={(event) => onUpdateDeclarant(2, { fraisReels: event.target.value === 'reels' })}
                    >
                      <option value="abat10">10 %</option>
                      <option value="reels">FR</option>
                    </select>
                    {declarant2.fraisReels ? (
                      <PerAmountInput
                        value={declarant2.fraisReelsMontant}
                        ariaLabel="Montant des frais réels déclarant 2"
                        className="per-income-table-input"
                        onChange={(value) => onUpdateDeclarant(2, { fraisReelsMontant: value })}
                      />
                    ) : (
                      <div className="per-income-readonly">Abattement 10 % automatique</div>
                    )}
                  </div>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SituationFiscaleStep({
  variant,
  yearLabel,
  showFoyerCard,
  incomeCardsOptional = false,
  situationFamiliale,
  nombreParts,
  isole,
  children,
  isCouple,
  mutualisationConjoints,
  declarant1,
  declarant2,
  onUpdateSituation,
  onAddChild,
  onUpdateChildMode,
  onRemoveChild,
  onUpdateDeclarant,
}: SituationFiscaleStepProps): React.ReactElement {
  const contributionRows: {
    label: string;
    note: string;
    key: ContributionFieldKey;
  }[] = [
    { label: 'PER 163 quatervicies', note: variant === 'revenus-n1' ? '2042 : 6NS / 6NT' : 'année en cours', key: 'cotisationsPer163Q' },
    { label: 'PERP et assimilés', note: variant === 'revenus-n1' ? '2042 : 6RS / 6RT' : 'année en cours', key: 'cotisationsPerp' },
    { label: 'Art. 83 employeur + salarié', note: variant === 'revenus-n1' ? '2042 : 6QS / 6QT' : 'année en cours', key: 'cotisationsArt83' },
    { label: 'PER 154 bis', note: variant === 'revenus-n1' ? '2042 : 6OS / 6OT' : 'année en cours', key: 'cotisationsMadelin154bis' },
    { label: 'Madelin retraite', note: 'contrat retraite, distinct du PER 154 bis', key: 'cotisationsMadelinRetraite' },
    { label: 'Abondement PERCO', note: 'employeur, réduit le plafond 163Q', key: 'abondementPerco' },
    { label: 'Prévoyance Madelin', note: 'part non retraite', key: 'cotisationsPrevo' },
  ];

  return (
    <div className="per-step per-step--situation">
      {showFoyerCard && (
        <div className="premium-card premium-card--guide sim-card--guide per-situation-card">
          <SectionHeader
            eyebrow="Foyer"
            title="Situation familiale"
            subtitle="Renseignez le foyer pour recalculer automatiquement le nombre de parts."
            icon="foyer"
          />

          <div className="per-situation-foyer-grid">
            <label className="per-field">
              <span>Situation familiale</span>
              <select
                className="per-select sim-field__control"
                value={situationFamiliale}
                onChange={(event) => {
                  onUpdateSituation({
                    situationFamiliale: event.target.value as 'celibataire' | 'marie',
                  });
                }}
              >
                <option value="marie">Marié / Pacsé</option>
                <option value="celibataire">Célibataire / Veuf / Divorcé</option>
              </select>
            </label>

            <div className="per-parts-summary" aria-live="polite">
              <span className="per-parts-summary__label">Nombre de parts calculé</span>
              <strong className="per-parts-summary__value">{nombreParts.toLocaleString('fr-FR')}</strong>
            </div>

            {situationFamiliale === 'celibataire' && (
              <label className="per-toggle-label per-toggle-label--panel">
                <input
                  type="checkbox"
                  checked={isole}
                  onChange={(event) => onUpdateSituation({ isole: event.target.checked })}
                />
                <span>Parent isolé</span>
              </label>
            )}

            {isCouple && (
              <label className="per-toggle-label per-toggle-label--panel">
                <input
                  type="checkbox"
                  checked={mutualisationConjoints}
                  onChange={(event) => onUpdateSituation({ mutualisationConjoints: event.target.checked })}
                />
                <span>Mutualisation des plafonds (case 6QR)</span>
              </label>
            )}
          </div>

          <div className="per-children-zone">
            <div className="per-children-header">
              <p className="per-children-title">Enfants à charge</p>
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
            </div>

            {children.length === 0 ? (
              <p className="per-situation-note">Aucun enfant renseigné.</p>
            ) : (
              <div className="per-children-list">
                {children.map((child, index) => (
                  <div key={child.id} className="per-child-row">
                    <span className="per-child-row__label">E{index + 1}</span>
                    <select
                      className="per-select sim-field__control per-child-row__select"
                      value={child.mode}
                      onChange={(event) => onUpdateChildMode(child.id, event.target.value as PerChildDraft['mode'])}
                    >
                      <option value="charge">À charge</option>
                      <option value="shared">Garde alternée</option>
                    </select>
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
      )}

      <PerIncomeTable
        yearLabel={yearLabel}
        incomeCardsOptional={incomeCardsOptional}
        isCouple={isCouple}
        declarant1={declarant1}
        declarant2={declarant2}
        onUpdateDeclarant={onUpdateDeclarant}
      />

      <div className="premium-card premium-card--guide sim-card--guide per-contribution-card">
        <SectionHeader
          eyebrow="Versements retraite"
          title={`Montants ${yearLabel} par déclarant`}
          subtitle="Renseignez les montants déclarés ou estimés pour chaque enveloppe de retraite."
          icon="versements"
        />

        <div className={`per-contribution-table ${isCouple ? 'is-couple' : ''}`}>
          <div className="per-contribution-table-head per-contribution-table-head--label">Catégorie</div>
          <div className="per-contribution-table-head">Déclarant 1</div>
          {isCouple && <div className="per-contribution-table-head">Déclarant 2</div>}

          {contributionRows.map((row) => (
            <React.Fragment key={row.key}>
              <div className="per-contribution-table-label">
                <span>{row.label}</span>
                <small>{row.note}</small>
              </div>
              <div className="per-contribution-table-cell">
                <span className="per-contribution-mobile-label">Déclarant 1</span>
                <PerAmountInput
                  value={declarant1[row.key]}
                  ariaLabel={`${row.label} déclarant 1`}
                  className="per-contribution-input"
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
                    onChange={(value) => onUpdateDeclarant(2, { [row.key]: value })}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
