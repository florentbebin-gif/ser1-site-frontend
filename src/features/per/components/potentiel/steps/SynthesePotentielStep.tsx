/**
 * SynthesePotentielStep - Step 4: declarative restitution and live projection.
 */

import React from 'react';
import type { PerPotentielResult, PlafondDetail, PlafondMadelinDetail } from '../../../../../engine/per';

interface SynthesePotentielStepProps {
  result: PerPotentielResult | null;
  isCouple: boolean;
  modeVersement: boolean;
  versementEnvisage: number;
  onSetVersement: (_value: number) => void;
}

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const fmtPercent = (value: number): string =>
  `${(value <= 1 ? value * 100 : value).toFixed(1)} %`;

function PlafondBreakdownCard({
  label,
  detail,
}: {
  label: string;
  detail: PlafondDetail;
}): React.ReactElement {
  const rows = [
    { label: 'Plafond calcule annee N', value: detail.plafondCalculeN },
    { label: 'Report N-3', value: detail.nonUtiliseN3 },
    { label: 'Report N-2', value: detail.nonUtiliseN2 },
    { label: 'Report N-1', value: detail.nonUtiliseN1 },
    { label: 'Cotisations deja versees', value: detail.cotisationsDejaVersees },
  ];

  return (
    <div className="premium-card-compact per-summary-breakdown-card">
      <div className="per-summary-card-head">
        <p className="premium-section-title">Plafond personnel</p>
        <h4 className="per-summary-card-title">{label}</h4>
      </div>

      <div className="per-summary-breakdown-list">
        {rows.map((row) => (
          <div key={row.label} className="per-summary-breakdown-row">
            <span>{row.label}</span>
            <strong>{fmtCurrency(row.value)}</strong>
          </div>
        ))}
        <div className="per-summary-breakdown-row per-summary-breakdown-row--total">
          <span>Total disponible</span>
          <strong>{fmtCurrency(detail.totalDisponible)}</strong>
        </div>
        <div className={`per-summary-breakdown-row per-summary-breakdown-row--highlight ${detail.depassement ? 'is-alert' : ''}`}>
          <span>Disponible restant</span>
          <strong>{fmtCurrency(detail.disponibleRestant)}</strong>
        </div>
      </div>
    </div>
  );
}

function MadelinCard({
  label,
  detail,
}: {
  label: string;
  detail: PlafondMadelinDetail;
}): React.ReactElement {
  return (
    <div className="premium-card-compact per-summary-breakdown-card">
      <div className="per-summary-card-head">
        <p className="premium-section-title">Potentiel 154 bis</p>
        <h4 className="per-summary-card-title">{label}</h4>
      </div>

      <div className="per-summary-breakdown-list">
        <div className="per-summary-breakdown-row">
          <span>Assiette Madelin</span>
          <strong>{fmtCurrency(detail.assiette)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Enveloppe 15 %</span>
          <strong>{fmtCurrency(detail.enveloppe15)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Enveloppe 10 %</span>
          <strong>{fmtCurrency(detail.enveloppe10)}</strong>
        </div>
        <div className="per-summary-breakdown-row per-summary-breakdown-row--total">
          <span>Potentiel total</span>
          <strong>{fmtCurrency(detail.potentielTotal)}</strong>
        </div>
        <div className={`per-summary-breakdown-row per-summary-breakdown-row--highlight ${detail.depassement ? 'is-alert' : ''}`}>
          <span>Disponible restant</span>
          <strong>{fmtCurrency(detail.disponibleRestant)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function SynthesePotentielStep({
  result,
  isCouple,
  modeVersement,
  versementEnvisage,
  onSetVersement,
}: SynthesePotentielStepProps): React.ReactElement {
  if (!result) {
    return (
      <div className="per-step">
        <p style={{ color: 'var(--color-c9)' }}>
          Completez les etapes precedentes pour afficher la restitution fiscale.
        </p>
      </div>
    );
  }

  const {
    situationFiscale,
    plafond163Q,
    plafondMadelin,
    estTNS,
    declaration2042,
    simulation,
    warnings,
  } = result;

  const totalDisponible = plafond163Q.declarant1.disponibleRestant + (plafond163Q.declarant2?.disponibleRestant ?? 0);
  const totalDisponibleAvantVersement = plafond163Q.declarant1.totalDisponible + (plafond163Q.declarant2?.totalDisponible ?? 0);
  const declarationRows = [
    {
      label: 'PER 163 quatervicies',
      d1Case: '6NS',
      d1Value: declaration2042.case6NS,
      d2Case: '6NT',
      d2Value: declaration2042.case6NT ?? 0,
    },
    {
      label: 'PERP et assimiles',
      d1Case: '6RS',
      d1Value: declaration2042.case6RS,
      d2Case: '6RT',
      d2Value: declaration2042.case6RT ?? 0,
    },
    {
      label: 'Art. 83',
      d1Case: '6QS',
      d1Value: declaration2042.case6QS,
      d2Case: '6QT',
      d2Value: declaration2042.case6QT ?? 0,
    },
    {
      label: 'PER 154 bis',
      d1Case: '6OS',
      d1Value: declaration2042.case6OS,
      d2Case: '6OT',
      d2Value: declaration2042.case6OT ?? 0,
    },
  ];

  return (
    <div className="per-step per-step--summary">
      <div className="per-step-copy">
        <p className="per-step-eyebrow">Restitution</p>
        <h3 className="per-step-title">Synthese declarative et potentiel disponible</h3>
        <p className="per-step-hint">
          La synthese remet les calculs dans l ordre utile pour un conseiller : resultat principal,
          cases 2042, detail des plafonds et, le cas echeant, projection du versement.
        </p>
      </div>

      <div className="per-summary-top">
        <div className="premium-card premium-card--guide per-summary-hero">
          <div className="per-summary-hero-head">
            <div>
              <p className="premium-section-title">Resultat principal</p>
              <h4 className="per-summary-hero-title">
                {modeVersement ? 'Montant encore deductible aujourd hui' : 'Plafond restant apres declaration'}
              </h4>
            </div>
            <span className="per-summary-hero-chip">
              {modeVersement ? 'Versement N' : 'Declaration N-1'}
            </span>
          </div>

          <div className="per-summary-hero-grid">
            <div className="per-summary-primary-metric">
              <span className="per-summary-primary-label">Disponible total</span>
              <strong className="per-summary-primary-value">{fmtCurrency(totalDisponible)}</strong>
              <p className="per-summary-primary-note">
                Base avant simulation : {fmtCurrency(totalDisponibleAvantVersement)}
                {isCouple && declaration2042.case6QR ? ' - mutualisation active (6QR)' : ''}
              </p>
            </div>

            <div className="per-summary-stat-grid">
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">TMI</span>
                <strong className="per-summary-stat-value">{fmtPercent(situationFiscale.tmi)}</strong>
              </div>
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">IR estime</span>
                <strong className="per-summary-stat-value">{fmtCurrency(situationFiscale.irEstime)}</strong>
              </div>
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">Marge dans la TMI</span>
                <strong className="per-summary-stat-value">{fmtCurrency(situationFiscale.montantDansLaTMI)}</strong>
              </div>
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">CEHR</span>
                <strong className="per-summary-stat-value">{fmtCurrency(situationFiscale.cehr)}</strong>
              </div>
            </div>
          </div>

          {modeVersement && (
            <div className="per-summary-simulation">
              <div className="per-summary-simulation-head">
                <div>
                  <p className="premium-section-title">Simulation de versement</p>
                  <h5 className="per-summary-simulation-title">Projection immediate du gain fiscal</h5>
                </div>
                <label className="per-summary-simulation-input">
                  <span>Versement envisage</span>
                  <input
                    type="number"
                    min={0}
                    className="premium-input"
                    value={versementEnvisage || ''}
                    placeholder="5000"
                    onChange={(event) => onSetVersement(Number(event.target.value) || 0)}
                  />
                </label>
              </div>

              {simulation ? (
                <div className="per-summary-simulation-grid">
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Versement deductible</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.versementDeductible)}</strong>
                  </div>
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Economie IR</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.economieIRAnnuelle)}</strong>
                  </div>
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Cout net</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.coutNetApresFiscalite)}</strong>
                  </div>
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Plafond restant apres</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.plafondRestantApres)}</strong>
                  </div>
                </div>
              ) : (
                <p className="per-summary-primary-note">
                  Saisissez un versement pour obtenir l economie d impot correspondante.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="per-summary-side-stack">
          <PlafondBreakdownCard label="Declarant 1" detail={plafond163Q.declarant1} />
          {isCouple && plafond163Q.declarant2 && (
            <PlafondBreakdownCard label="Declarant 2" detail={plafond163Q.declarant2} />
          )}
        </div>
      </div>

      <div className="per-summary-columns">
        <div className="premium-card per-summary-section-card">
          <div className="per-summary-card-head">
            <p className="premium-section-title">Restitution 2042</p>
            <h4 className="per-summary-card-title">Cases a reporter</h4>
          </div>

          <table className="premium-table per-summary-table">
            <thead>
              <tr>
                <th>Rubrique</th>
                <th>Declarant 1</th>
                {isCouple && <th>Declarant 2</th>}
              </tr>
            </thead>
            <tbody>
              {declarationRows.map((row) => (
                <tr key={row.label}>
                  <td>
                    <div className="per-summary-case-label">{row.label}</div>
                  </td>
                  <td className="value-cell">
                    {row.d1Case} - {fmtCurrency(row.d1Value)}
                  </td>
                  {isCouple && (
                    <td className="value-cell">
                      {row.d2Case} - {fmtCurrency(row.d2Value)}
                    </td>
                  )}
                </tr>
              ))}
              {isCouple && (
                <tr>
                  <td>Mutualisation des plafonds</td>
                  <td colSpan={2} className="value-cell">
                    6QR - {declaration2042.case6QR ? 'Oui' : 'Non'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="premium-card per-summary-section-card">
          <div className="per-summary-card-head">
            <p className="premium-section-title">Lecture des plafonds</p>
            <h4 className="per-summary-card-title">Reconstitution du disponible</h4>
          </div>

          <div className={`per-summary-breakdown-grid ${isCouple ? 'is-couple' : ''}`}>
            <PlafondBreakdownCard label="Declarant 1" detail={plafond163Q.declarant1} />
            {isCouple && plafond163Q.declarant2 && (
              <PlafondBreakdownCard label="Declarant 2" detail={plafond163Q.declarant2} />
            )}
          </div>
        </div>
      </div>

      {estTNS && plafondMadelin && (
        <div className="premium-card per-summary-section-card">
          <div className="per-summary-card-head">
            <p className="premium-section-title">Madelin</p>
            <h4 className="per-summary-card-title">Potentiel 154 bis pour travailleurs non salaries</h4>
          </div>

          <div className={`per-summary-breakdown-grid ${isCouple ? 'is-couple' : ''}`}>
            {plafondMadelin.declarant1 && (
              <MadelinCard label="Declarant 1" detail={plafondMadelin.declarant1} />
            )}
            {isCouple && plafondMadelin.declarant2 && (
              <MadelinCard label="Declarant 2" detail={plafondMadelin.declarant2} />
            )}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="per-warnings per-warnings--stack">
          {warnings.map((warning) => (
            <div key={warning.code} className={`per-warning per-warning--${warning.severity}`}>
              {warning.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
