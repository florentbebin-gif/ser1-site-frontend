/**
 * AvisIrStep - Step 2: enter carry-forward ceilings from the tax notice.
 */

import React from 'react';
import type { AvisIrPlafonds, PerHistoricalBasis } from '../../../../../engine/per';
import { getAvisReferenceYears, type PerWorkflowYears } from '../../../utils/perWorkflowYears';
import { PerAmountInput } from '../PerAmountInput';

interface AvisIrStepProps {
  avisIr: AvisIrPlafonds | null;
  avisIr2: AvisIrPlafonds | null;
  basis: PerHistoricalBasis;
  years: PerWorkflowYears;
  totalDeclarant1: number;
  totalDeclarant2: number;
  onUpdate: (_patch: Partial<AvisIrPlafonds>, _decl?: 1 | 2) => void;
}

type AvisFieldKey = keyof Pick<
  AvisIrPlafonds,
  'nonUtiliseAnnee1' | 'nonUtiliseAnnee2' | 'nonUtiliseAnnee3' | 'plafondCalcule'
>;

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function getAvisValues(avis: AvisIrPlafonds | null, incomeYear: number): AvisIrPlafonds {
  return avis ?? {
    nonUtiliseAnnee1: 0,
    nonUtiliseAnnee2: 0,
    nonUtiliseAnnee3: 0,
    plafondCalcule: 0,
    anneeRef: incomeYear,
  };
}

export default function AvisIrStep({
  avisIr,
  avisIr2,
  basis,
  years,
  totalDeclarant1,
  totalDeclarant2,
  onUpdate,
}: AvisIrStepProps): React.ReactElement {
  const avisContext = getAvisReferenceYears(years, basis);
  const valuesD1 = getAvisValues(avisIr, avisContext.incomeYear);
  const valuesD2 = getAvisValues(avisIr2, avisContext.incomeYear);
  const rows: { label: string; key: AvisFieldKey; operator: '+' | '' }[] = [
    {
      label: `Plafond non utilisé pour les revenus de ${avisContext.carryForwardYears[0]}`,
      key: 'nonUtiliseAnnee1',
      operator: '',
    },
    {
      label: `Plafond non utilisé pour les revenus de ${avisContext.carryForwardYears[1]}`,
      key: 'nonUtiliseAnnee2',
      operator: '+',
    },
    {
      label: `Plafond non utilisé pour les revenus de ${avisContext.carryForwardYears[2]}`,
      key: 'nonUtiliseAnnee3',
      operator: '+',
    },
    {
      label: `Plafond calculé sur les revenus de ${avisContext.incomeYear}`,
      key: 'plafondCalcule',
      operator: '+',
    },
  ];

  return (
    <div className="per-step per-step--avis">
      <div className="per-avis-intro">
        <p className="premium-section-title">Avis d&apos;impôt</p>
        <p className="per-avis-copy">
          Renseignez les montants relevés sur l&apos;avis IR {avisContext.taxYear}. Le potentiel
          163 quatervicies correspond à l&apos;addition des trois reports non utilisés et du plafond
          calculé de l&apos;année de référence, pour chaque déclarant.
        </p>
      </div>

      <div className="per-avis-matrix" role="table" aria-label={`Lecture de l'avis IR ${avisContext.taxYear}`}>
        <div className="per-avis-matrix-head-row" role="row">
          <div className="per-avis-matrix-head per-avis-matrix-head--label" role="columnheader">
            Rubrique
          </div>
          <div className="per-avis-matrix-head per-avis-matrix-head--operator" aria-hidden="true" />
          <div className="per-avis-matrix-head" role="columnheader">Déclarant 1</div>
          <div className="per-avis-matrix-head" role="columnheader">Déclarant 2</div>
        </div>

        {rows.map((row) => (
          <div key={row.key} className="per-avis-matrix-row" role="row">
            <div className="per-avis-matrix-label" role="rowheader">
              {row.label}
            </div>
            <div className="per-avis-matrix-operator" aria-hidden="true">
              {row.operator}
            </div>
            <div className="per-avis-matrix-cell" data-column-label="Déclarant 1" role="cell">
              <PerAmountInput
                value={valuesD1[row.key]}
                ariaLabel={`${row.label} - Déclarant 1`}
                className="per-avis-matrix-input"
                onChange={(value) => onUpdate({ [row.key]: value, anneeRef: avisContext.incomeYear }, 1)}
              />
            </div>
            <div className="per-avis-matrix-cell" data-column-label="Déclarant 2" role="cell">
              <PerAmountInput
                value={valuesD2[row.key]}
                ariaLabel={`${row.label} - Déclarant 2`}
                className="per-avis-matrix-input"
                onChange={(value) => onUpdate({ [row.key]: value, anneeRef: avisContext.incomeYear }, 2)}
              />
            </div>
          </div>
        ))}

        <div className="per-avis-matrix-row per-avis-matrix-row--total" role="row">
          <div className="per-avis-matrix-label per-avis-matrix-label--total" role="rowheader">
            Potentiel 163 quatervicies pour les cotisations versées en {avisContext.taxYear}
          </div>
          <div className="per-avis-matrix-operator per-avis-matrix-operator--total" aria-hidden="true">
            =
          </div>
          <div className="per-avis-matrix-total" data-column-label="Déclarant 1" role="cell">
            {fmtCurrency(totalDeclarant1)}
          </div>
          <div className="per-avis-matrix-total" data-column-label="Déclarant 2" role="cell">
            {fmtCurrency(totalDeclarant2)}
          </div>
        </div>
      </div>
    </div>
  );
}
