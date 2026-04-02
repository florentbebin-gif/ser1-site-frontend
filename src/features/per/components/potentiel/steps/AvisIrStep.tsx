/**
 * AvisIrStep - Step 2: enter carry-forward ceilings from the tax notice.
 */

import React from 'react';
import type { AvisIrPlafonds, PerHistoricalBasis } from '../../../../../engine/per';
import { getAvisReferenceYears, type PerWorkflowYears } from '../../../utils/perWorkflowYears';

interface AvisIrStepProps {
  avisIr: AvisIrPlafonds | null;
  avisIr2: AvisIrPlafonds | null;
  isCouple: boolean;
  basis: PerHistoricalBasis;
  years: PerWorkflowYears;
  onUpdate: (_patch: Partial<AvisIrPlafonds>, _decl?: 1 | 2) => void;
}

function AvisFieldsCard({
  label,
  avis,
  incomeYear,
  carryForwardYears,
  onChange,
}: {
  label: string;
  avis: AvisIrPlafonds | null;
  incomeYear: number;
  carryForwardYears: [number, number, number];
  onChange: (_patch: Partial<AvisIrPlafonds>) => void;
}): React.ReactElement {
  const values = avis ?? {
    nonUtiliseAnnee1: 0,
    nonUtiliseAnnee2: 0,
    nonUtiliseAnnee3: 0,
    plafondCalcule: 0,
    anneeRef: incomeYear,
  };

  const rows = [
    { label: `Plafond non utilisé ${carryForwardYears[0]}`, key: 'nonUtiliseAnnee1' as const },
    { label: `Plafond non utilisé ${carryForwardYears[1]}`, key: 'nonUtiliseAnnee2' as const },
    { label: `Plafond non utilisé ${carryForwardYears[2]}`, key: 'nonUtiliseAnnee3' as const },
    { label: `Plafond calculé sur revenus ${incomeYear}`, key: 'plafondCalcule' as const },
  ];

  return (
    <div className="premium-card per-avis-form-card">
      <div className="per-avis-form-header">
        <p className="premium-section-title">Saisie</p>
        <h4 className="per-avis-form-title">{label}</h4>
      </div>

      <div className="per-avis-row-list">
        {rows.map((row) => (
          <label key={row.key} className="per-avis-row">
            <span className="per-avis-row-label">{row.label}</span>
            <input
              type="number"
              min={0}
              className="per-input per-avis-row-input"
              value={values[row.key] || ''}
              placeholder="0"
              onChange={(event) => onChange({ [row.key]: Number(event.target.value) || 0, anneeRef: incomeYear })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function AvisIrStep({
  avisIr,
  avisIr2,
  isCouple,
  basis,
  years,
  onUpdate,
}: AvisIrStepProps): React.ReactElement {
  const avisContext = getAvisReferenceYears(years, basis);

  return (
    <div className="per-step per-step--avis">
      <div className="per-avis-layout">
        <div className="premium-card-compact per-avis-guide-card">
          <p className="premium-section-title">Ce qu'il faut relever</p>
          <ol className="per-avis-checklist">
            <li>Les trois années de plafond non utilisé.</li>
            <li>Le plafond calculé sur les revenus {avisContext.incomeYear}.</li>
            <li>Les montants déclarant par déclarant si le foyer est un couple.</li>
          </ol>
        </div>

        <div className="premium-card per-avis-preview-card">
          <div className="per-avis-preview">
            <div className="per-avis-preview-header">
              <div>
                <p className="premium-section-title">Repérage visuel</p>
                <h4 className="per-avis-preview-title">Avis d'impôt {avisContext.taxYear}</h4>
              </div>
              <span className="per-avis-preview-chip">Revenus {avisContext.incomeYear}</span>
            </div>

            <div className="per-avis-preview-sheet">
              <div className="per-avis-preview-line per-avis-preview-line--muted">
                Direction générale des finances publiques
              </div>
              <div className="per-avis-preview-line per-avis-preview-line--muted">
                Avis établi en {avisContext.taxYear}
              </div>
              <div className="per-avis-preview-focus">
                <span className="per-avis-preview-focus-label">Rubrique à lire</span>
                <strong>PLAFOND ÉPARGNE RETRAITE</strong>
              </div>
              <div className="per-avis-preview-grid">
                <div>Plafond total</div>
                <div>Plafond non utilisé {avisContext.carryForwardYears[0]}</div>
                <div>Plafond non utilisé {avisContext.carryForwardYears[1]}</div>
                <div>Plafond non utilisé {avisContext.carryForwardYears[2]}</div>
                <div>Plafond calculé sur revenus {avisContext.incomeYear}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`per-avis-form-grid ${isCouple ? 'is-couple' : ''}`}>
        <AvisFieldsCard
          label="Déclarant 1"
          avis={avisIr}
          incomeYear={avisContext.incomeYear}
          carryForwardYears={avisContext.carryForwardYears}
          onChange={(patch) => onUpdate(patch, 1)}
        />

        {isCouple && (
          <AvisFieldsCard
            label="Déclarant 2"
            avis={avisIr2}
            incomeYear={avisContext.incomeYear}
            carryForwardYears={avisContext.carryForwardYears}
            onChange={(patch) => onUpdate(patch, 2)}
          />
        )}
      </div>
    </div>
  );
}
