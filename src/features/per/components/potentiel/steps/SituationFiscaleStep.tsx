/**
 * SituationFiscaleStep - Generic fiscal input screen for N-1 reconstruction or N projection.
 */

import React from 'react';
import type { DeclarantRevenus, PerPotentielResult } from '../../../../../engine/per';

export type FiscalStepVariant = 'revenus-n1' | 'projection-n' | 'versements-n';

interface SituationFiscaleStepProps {
  variant: FiscalStepVariant;
  yearLabel: string;
  showFoyerCard: boolean;
  incomeCardsOptional?: boolean;
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  isCouple: boolean;
  mutualisationConjoints: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
  result: PerPotentielResult | null;
  onUpdateSituation: (_patch: Partial<{
    situationFamiliale: 'celibataire' | 'marie';
    nombreParts: number;
    isole: boolean;
    mutualisationConjoints: boolean;
  }>) => void;
  onUpdateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
}

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

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

function NumberField({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (_value: number) => void;
  min?: number;
}): React.ReactElement {
  return (
    <label className="per-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        className="per-input"
        value={value || ''}
        placeholder="0"
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  );
}

function IncomeCard({
  label,
  declarant,
  onChange,
}: {
  label: string;
  declarant: DeclarantRevenus;
  onChange: (_patch: Partial<DeclarantRevenus>) => void;
}): React.ReactElement {
  const fields: { label: string; key: IncomeFieldKey }[] = [
    { label: 'Traitements et salaires', key: 'salaires' },
    { label: 'Revenus art. 62', key: 'art62' },
    { label: 'BIC / BNC / BA', key: 'bic' },
    { label: 'Pensions et retraites', key: 'retraites' },
    { label: 'Revenus fonciers nets', key: 'fonciersNets' },
    { label: 'Autres revenus', key: 'autresRevenus' },
  ];

  return (
    <div className="premium-card per-income-card">
      <div className="per-income-card-header">
        <p className="premium-section-title">Déclarant</p>
        <h4 className="per-income-card-title">{label}</h4>
      </div>

      <div className="per-income-grid">
        {fields.map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            value={declarant[field.key]}
            onChange={(value) => onChange({ [field.key]: value })}
          />
        ))}
      </div>

      <div className="per-income-toggle-row">
        <label className="per-toggle-label per-toggle-label--inline">
          <input
            type="checkbox"
            checked={declarant.fraisReels}
            onChange={(event) => onChange({ fraisReels: event.target.checked })}
          />
          <span>Frais réels</span>
        </label>

        {declarant.fraisReels && (
          <div className="per-income-toggle-field">
            <NumberField
              label="Montant des frais réels"
              value={declarant.fraisReelsMontant}
              onChange={(value) => onChange({ fraisReelsMontant: value })}
            />
          </div>
        )}
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
  isCouple,
  mutualisationConjoints,
  declarant1,
  declarant2,
  result,
  onUpdateSituation,
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
    { label: 'Madelin retraite', note: 'hors 154 bis', key: 'cotisationsMadelinRetraite' },
    { label: 'Abondement PERCO', note: 'employeur', key: 'abondementPerco' },
    { label: 'Prévoyance Madelin', note: 'part non retraite', key: 'cotisationsPrevo' },
  ];

  return (
    <div className="per-step per-step--situation">
      <div className={`per-situation-top ${showFoyerCard ? '' : 'per-situation-top--single'}`}>
        {showFoyerCard && (
          <div className="premium-card per-situation-card">
            <div className="per-situation-card-header">
              <p className="premium-section-title">Foyer</p>
              <h4 className="per-situation-card-title">Situation familiale</h4>
            </div>

            <div className="per-situation-foyer-grid">
              <label className="per-field">
                <span>Situation familiale</span>
                <select
                  className="per-select"
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

              <NumberField
                label="Nombre de parts"
                value={nombreParts}
                min={1}
                onChange={(value) => onUpdateSituation({ nombreParts: Math.max(1, value) })}
              />

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
          </div>
        )}

        <div className="premium-card per-situation-card per-situation-card--accent">
          <div className="per-situation-card-header">
            <p className="premium-section-title">Aperçu fiscal</p>
            <h4 className="per-situation-card-title">Estimation mise à jour en direct</h4>
          </div>

          {result ? (
            <div className="per-situation-kpis">
              <div className="per-situation-kpi">
                <span className="per-situation-kpi-label">TMI</span>
                <strong className="per-situation-kpi-value">
                  {(result.situationFiscale.tmi <= 1
                    ? result.situationFiscale.tmi * 100
                    : result.situationFiscale.tmi).toFixed(1)} %
                </strong>
              </div>
              <div className="per-situation-kpi">
                <span className="per-situation-kpi-label">IR estimé</span>
                <strong className="per-situation-kpi-value">
                  {fmtCurrency(result.situationFiscale.irEstime)}
                </strong>
              </div>
              <div className="per-situation-kpi">
                <span className="per-situation-kpi-label">Revenu imposable D1</span>
                <strong className="per-situation-kpi-value">
                  {fmtCurrency(result.situationFiscale.revenuImposableD1)}
                </strong>
              </div>
              {isCouple && (
                <div className="per-situation-kpi">
                  <span className="per-situation-kpi-label">Revenu imposable D2</span>
                  <strong className="per-situation-kpi-value">
                    {fmtCurrency(result.situationFiscale.revenuImposableD2)}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <p className="per-situation-note">
              Le moteur fiscal se met à jour dès que les revenus et versements sont saisis.
            </p>
          )}
        </div>
      </div>

      <div className="premium-card per-contribution-card">
        <div className="per-situation-card-header">
          <p className="premium-section-title">Versements retraite</p>
          <h4 className="per-situation-card-title">Montants {yearLabel} par déclarant</h4>
        </div>

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
                <input
                  type="number"
                  min={0}
                  className="per-input"
                  value={declarant1[row.key] || ''}
                  placeholder="0"
                  onChange={(event) => onUpdateDeclarant(1, { [row.key]: Number(event.target.value) || 0 })}
                />
              </div>
              {isCouple && (
                <div className="per-contribution-table-cell">
                  <span className="per-contribution-mobile-label">Déclarant 2</span>
                  <input
                    type="number"
                    min={0}
                    className="per-input"
                    value={declarant2[row.key] || ''}
                    placeholder="0"
                    onChange={(event) => onUpdateDeclarant(2, { [row.key]: Number(event.target.value) || 0 })}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="per-situation-income-copy">
        <p className="premium-section-title">Revenus</p>
        <p className="per-situation-note">
          {incomeCardsOptional
            ? `Les revenus ${yearLabel} sont facultatifs sur cet écran. Renseignez-les si vous souhaitez affiner la fiscalité liée au versement.`
            : `Renseignez les revenus ${yearLabel} pour reconstruire le calcul fiscal et les plafonds associés.`}
        </p>
      </div>

      <div className={`per-declarants-grid ${isCouple ? 'is-couple' : ''}`}>
        <IncomeCard
          label="Déclarant 1"
          declarant={declarant1}
          onChange={(patch) => onUpdateDeclarant(1, patch)}
        />

        {isCouple && (
          <IncomeCard
            label="Déclarant 2"
            declarant={declarant2}
            onChange={(patch) => onUpdateDeclarant(2, patch)}
          />
        )}
      </div>
    </div>
  );
}
