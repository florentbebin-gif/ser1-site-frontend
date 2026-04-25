/**
 * SynthesePotentielStep - Step 5: declarative restitution and live projection.
 */

import React from 'react';
import type {
  PerDeductionDetail,
  PerPotentielResult,
  PerProjectionAvisDetail,
  PlafondDetail,
  PlafondMadelinDetail,
} from '../../../../../engine/per';

interface SynthesePotentielStepProps {
  result: PerPotentielResult | null;
  isCouple: boolean;
}

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function PlafondBreakdownCard({
  label,
  detail,
  deduction,
}: {
  label: string;
  detail: PlafondDetail;
  deduction: PerDeductionDetail;
}): React.ReactElement {
  const rows = [
    { label: 'Plafond calculé sur l’avis', value: detail.plafondCalculeN },
    { label: 'Report N-3', value: detail.nonUtiliseN3 },
    { label: 'Report N-2', value: detail.nonUtiliseN2 },
    { label: 'Report N-1', value: detail.nonUtiliseN1 },
    { label: 'Cotisations 163Q / PERP versées', value: deduction.cotisationsVersees },
    { label: 'Cotisations retenues pour l’IR', value: deduction.cotisationsRetenuesIr },
    { label: 'Plafond après mutualisation', value: deduction.plafondApresMutualisation },
  ];

  return (
    <div className="premium-card-compact per-summary-breakdown-card">
      <div className="per-summary-card-head">
        <p className="premium-section-title">Potentiel 163 quatervicies</p>
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
          <span>Total disponible issu de l’avis</span>
          <strong>{fmtCurrency(detail.totalDisponible)}</strong>
        </div>
        <div className={`per-summary-breakdown-row per-summary-breakdown-row--highlight ${deduction.cotisationsNonDeductibles > 0 ? 'is-alert' : ''}`}>
          <span>Disponible restant</span>
          <strong>{fmtCurrency(deduction.disponibleRestant)}</strong>
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
          <span>Assiette de versement</span>
          <strong>{fmtCurrency(detail.assietteVersement)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Assiette de report 2042</span>
          <strong>{fmtCurrency(detail.assietteReport)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Enveloppe 15 %</span>
          <strong>{fmtCurrency(detail.enveloppe15Versement)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Enveloppe 10 % commune</span>
          <strong>{fmtCurrency(detail.enveloppe10)}</strong>
        </div>
        <div className="per-summary-breakdown-row per-summary-breakdown-row--total">
          <span>Disponible restant</span>
          <strong>{fmtCurrency(detail.disponibleRestant)}</strong>
        </div>
        <div className={`per-summary-breakdown-row per-summary-breakdown-row--highlight ${detail.depassement ? 'is-alert' : ''}`}>
          <span>Réintégration fiscale</span>
          <strong>{fmtCurrency(detail.surplusAReintegrer)}</strong>
        </div>
      </div>
    </div>
  );
}

function ProjectionCard({
  label,
  detail,
}: {
  label: string;
  detail: PerProjectionAvisDetail;
}): React.ReactElement {
  return (
    <div className="premium-card-compact per-summary-breakdown-card">
      <div className="per-summary-card-head">
        <p className="premium-section-title">Prochain avis IR</p>
        <h4 className="per-summary-card-title">{label}</h4>
      </div>

      <div className="per-summary-breakdown-list">
        <div className="per-summary-breakdown-row">
          <span>Reliquat N-2</span>
          <strong>{fmtCurrency(detail.nonUtiliseN2)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Reliquat N-1</span>
          <strong>{fmtCurrency(detail.nonUtiliseN1)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Reliquat N</span>
          <strong>{fmtCurrency(detail.nonUtiliseN)}</strong>
        </div>
        <div className="per-summary-breakdown-row">
          <span>Plafond calculé</span>
          <strong>{fmtCurrency(detail.plafondCalculeN)}</strong>
        </div>
        <div className="per-summary-breakdown-row per-summary-breakdown-row--total">
          <span>Total projeté</span>
          <strong>{fmtCurrency(detail.plafondTotal)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function SynthesePotentielStep({
  result,
  isCouple,
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
    plafond163Q,
    deductionFlow163Q,
    plafondMadelin,
    declaration2042,
    projectionAvisSuivant,
    warnings,
  } = result;

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
      label: 'Flux agrégé Art. 83 / PERCO / Madelin retraite',
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
      <div className={`per-summary-breakdown-grid ${isCouple && plafond163Q.declarant2 ? 'is-couple' : ''}`}>
        <PlafondBreakdownCard
          label="Déclarant 1"
          detail={plafond163Q.declarant1}
          deduction={deductionFlow163Q.declarant1}
        />
        {isCouple && plafond163Q.declarant2 && deductionFlow163Q.declarant2 && (
          <PlafondBreakdownCard
            label="Déclarant 2"
            detail={plafond163Q.declarant2}
            deduction={deductionFlow163Q.declarant2}
          />
        )}
      </div>

      <div className="premium-card per-summary-section-card">
        <div className="per-summary-card-head">
          <p className="premium-section-title">Restitution 2042</p>
          <h4 className="per-summary-card-title">Reports à opérer</h4>
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

      {plafondMadelin && (
        <div className="premium-card per-summary-section-card">
          <div className="per-summary-card-head">
            <p className="premium-section-title">Madelin</p>
            <h4 className="per-summary-card-title">Enveloppes 154 bis</h4>
          </div>

          <div className={`per-summary-breakdown-grid ${isCouple ? 'is-couple' : ''}`}>
            {plafondMadelin.declarant1.assietteVersement > 0 && (
              <MadelinCard label="Déclarant 1" detail={plafondMadelin.declarant1} />
            )}
            {isCouple && plafondMadelin.declarant2 && plafondMadelin.declarant2.assietteVersement > 0 && (
              <MadelinCard label="Déclarant 2" detail={plafondMadelin.declarant2} />
            )}
          </div>
        </div>
      )}

      <div className="premium-card per-summary-section-card">
        <div className="per-summary-card-head">
          <p className="premium-section-title">Prochain avis IR</p>
          <h4 className="per-summary-card-title">Reliquats projetés</h4>
        </div>

        <div className={`per-summary-breakdown-grid ${isCouple ? 'is-couple' : ''}`}>
          <ProjectionCard label="Déclarant 1" detail={projectionAvisSuivant.declarant1} />
          {isCouple && projectionAvisSuivant.declarant2 && (
            <ProjectionCard label="Déclarant 2" detail={projectionAvisSuivant.declarant2} />
          )}
        </div>
      </div>

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
