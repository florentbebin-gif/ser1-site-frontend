/**
 * SynthesePotentielStep - Step 5: declarative restitution and live projection.
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
    { label: 'Plafond calculé année N', value: detail.plafondCalculeN },
    { label: 'Report N-3', value: detail.nonUtiliseN3 },
    { label: 'Report N-2', value: detail.nonUtiliseN2 },
    { label: 'Report N-1', value: detail.nonUtiliseN1 },
    { label: 'Cotisations déjà versées', value: detail.cotisationsDejaVersees },
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
          Complétez les étapes précédentes pour afficher la restitution fiscale.
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

  const totalDisponible =
    plafond163Q.declarant1.disponibleRestant + (plafond163Q.declarant2?.disponibleRestant ?? 0);
  const totalDisponibleAvantVersement =
    plafond163Q.declarant1.totalDisponible + (plafond163Q.declarant2?.totalDisponible ?? 0);
  const declarationRows = [
    {
      label: 'PER 163 quatervicies',
      d1Case: '6NS',
      d1Value: declaration2042.case6NS,
      d2Case: '6NT',
      d2Value: declaration2042.case6NT ?? 0,
    },
    {
      label: 'PERP et assimilés',
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
      <div className="per-summary-top">
        <div className="premium-card premium-card--guide per-summary-hero">
          <div className="per-summary-hero-head">
            <div>
              <p className="premium-section-title">Résultat principal</p>
              <h4 className="per-summary-hero-title">
                {modeVersement ? "Montant encore déductible aujourd'hui" : 'Plafond restant après déclaration'}
              </h4>
            </div>
            <span className="per-summary-hero-chip">
              {modeVersement ? 'Versement N' : 'Déclaration N-1'}
            </span>
          </div>

          <div className="per-summary-hero-grid">
            <div className="per-summary-primary-metric">
              <span className="per-summary-primary-label">Disponible total</span>
              <strong className="per-summary-primary-value">{fmtCurrency(totalDisponible)}</strong>
              <p className="per-summary-primary-note">
                Base avant simulation : {fmtCurrency(totalDisponibleAvantVersement)}
                {isCouple && declaration2042.case6QR ? ' — mutualisation active (6QR)' : ''}
              </p>
            </div>

            <div className="per-summary-stat-grid">
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">TMI</span>
                <strong className="per-summary-stat-value">{fmtPercent(situationFiscale.tmi)}</strong>
              </div>
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">IR estimé</span>
                <strong className="per-summary-stat-value">{fmtCurrency(situationFiscale.irEstime)}</strong>
              </div>
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">Marge TMI</span>
                <strong className="per-summary-stat-value">{fmtCurrency(situationFiscale.montantDansLaTMI)}</strong>
              </div>
              <div className="per-summary-stat">
                <span className="per-summary-stat-label">CEHR</span>
                <strong className="per-summary-stat-value">{fmtCurrency(situationFiscale.cehr)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="per-summary-side-stack">
          <PlafondBreakdownCard label="Déclarant 1" detail={plafond163Q.declarant1} />
          {isCouple && plafond163Q.declarant2 && (
            <PlafondBreakdownCard label="Déclarant 2" detail={plafond163Q.declarant2} />
          )}

          {modeVersement && (
            <div className="premium-card per-summary-simulation">
              <div className="per-summary-simulation-head">
                <div>
                  <p className="premium-section-title">Simulation de versement</p>
                  <h5 className="per-summary-simulation-title">Gain fiscal projeté</h5>
                </div>
              </div>
              <label className="per-summary-simulation-input">
                <span className="per-summary-simulation-label">Versement envisagé</span>
                <input
                  type="number"
                  min={0}
                  className="per-input"
                  value={versementEnvisage || ''}
                  placeholder="0"
                  onChange={(event) => onSetVersement(Number(event.target.value) || 0)}
                />
              </label>

              {simulation ? (
                <div className="per-summary-simulation-grid">
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Versement déductible</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.versementDeductible)}</strong>
                  </div>
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Économie IR</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.economieIRAnnuelle)}</strong>
                  </div>
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Coût net</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.coutNetApresFiscalite)}</strong>
                  </div>
                  <div className="per-summary-stat">
                    <span className="per-summary-stat-label">Plafond restant</span>
                    <strong className="per-summary-stat-value">{fmtCurrency(simulation.plafondRestantApres)}</strong>
                  </div>
                </div>
              ) : (
                <p className="per-summary-simulation-hint">
                  Saisissez un versement pour voir l&apos;économie d&apos;impôt.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="premium-card per-summary-section-card">
        <div className="per-summary-card-head">
          <p className="premium-section-title">Restitution 2042</p>
          <h4 className="per-summary-card-title">Cases à reporter</h4>
        </div>

        <table className="premium-table per-summary-table">
          <thead>
            <tr>
              <th>Rubrique</th>
              <th>Déclarant 1</th>
              {isCouple && <th>Déclarant 2</th>}
            </tr>
          </thead>
          <tbody>
            {declarationRows.map((row) => (
              <tr key={row.label}>
                <td>
                  <div className="per-summary-case-label">{row.label}</div>
                </td>
                <td className="value-cell">
                  {row.d1Case} — {fmtCurrency(row.d1Value)}
                </td>
                {isCouple && (
                  <td className="value-cell">
                    {row.d2Case} — {fmtCurrency(row.d2Value)}
                  </td>
                )}
              </tr>
            ))}
            {isCouple && (
              <tr>
                <td>Mutualisation des plafonds</td>
                <td colSpan={2} className="value-cell">
                  6QR — {declaration2042.case6QR ? 'Oui' : 'Non'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {estTNS && plafondMadelin && (
        <div className="premium-card per-summary-section-card">
          <div className="per-summary-card-head">
            <p className="premium-section-title">Madelin</p>
            <h4 className="per-summary-card-title">Potentiel 154 bis pour travailleurs non salariés</h4>
          </div>

          <div className={`per-summary-breakdown-grid ${isCouple ? 'is-couple' : ''}`}>
            {plafondMadelin.declarant1 && (
              <MadelinCard label="Déclarant 1" detail={plafondMadelin.declarant1} />
            )}
            {isCouple && plafondMadelin.declarant2 && (
              <MadelinCard label="Déclarant 2" detail={plafondMadelin.declarant2} />
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
