/**
 * AvisIrStep - Step 2: enter carry-forward ceilings from the tax notice.
 */

import React from 'react';
import type { AvisIrPlafonds, PerHistoricalBasis } from '../../../../../engine/per';
import { getAvisReferenceYears, type PerWorkflowYears } from '../../../utils/perWorkflowYears';

interface AvisIrStepProps {
  avisIr: AvisIrPlafonds | null;
  avisIr2: AvisIrPlafonds | null;
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
      <div className="per-avis-form-header sim-card__header--bleed">
        <p className="premium-section-title">Saisie</p>
        <h4 className="per-avis-form-title">{label}</h4>
      </div>
      <div className="sim-divider" />

      <div className="per-avis-row-list">
        {rows.map((row) => (
          <label key={row.key} className="per-avis-row">
            <span className="per-avis-row-label">{row.label}</span>
            <input
              type="number"
              min={0}
              className="per-input sim-field__control per-avis-row-input"
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
  basis,
  years,
  onUpdate,
}: AvisIrStepProps): React.ReactElement {
  const avisContext = getAvisReferenceYears(years, basis);
  const totalPlafond = (avisIr?.plafondCalcule ?? 0) + (avisIr2?.plafondCalcule ?? 0);

  return (
    <div className="per-step per-step--avis">
      <div className={`per-avis-form-grid per-avis-form-grid--always-two`}>
        <AvisFieldsCard
          label="Déclarant 1"
          avis={avisIr}
          incomeYear={avisContext.incomeYear}
          carryForwardYears={avisContext.carryForwardYears}
          onChange={(patch) => onUpdate(patch, 1)}
        />

        <AvisFieldsCard
          label="Déclarant 2"
          avis={avisIr2}
          incomeYear={avisContext.incomeYear}
          carryForwardYears={avisContext.carryForwardYears}
          onChange={(patch) => onUpdate(patch, 2)}
        />
      </div>

      <div className="per-avis-total-row">
        <span className="per-avis-total-label">
          Plafond pour les cotisations versées en {years.currentTaxYear}
        </span>
        <span className="per-avis-total-value">
          {totalPlafond.toLocaleString('fr-FR')} €
        </span>
      </div>
    </div>
  );
}
