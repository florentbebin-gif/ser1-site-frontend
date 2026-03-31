/**
 * AvisIrStep — Step 2 (conditional): enter carry-forward ceilings from the tax notice.
 */

import React from 'react';
import type { AvisIrPlafonds } from '../../../../../engine/per';

interface AvisIrStepProps {
  avisIr: AvisIrPlafonds | null;
  avisIr2: AvisIrPlafonds | null;
  isCouple: boolean;
  onUpdate: (_patch: Partial<AvisIrPlafonds>, _decl?: 1 | 2) => void;
}

const currentYear = new Date().getFullYear();

function AvisFields({ label, avis, onChange }: {
  label: string;
  avis: AvisIrPlafonds | null;
  onChange: (_patch: Partial<AvisIrPlafonds>) => void;
}): React.ReactElement {
  const v = avis ?? { nonUtiliseAnnee1: 0, nonUtiliseAnnee2: 0, nonUtiliseAnnee3: 0, plafondCalcule: 0, anneeRef: currentYear - 1 };
  return (
    <div className="per-avis-block">
      <h3 className="per-avis-block-title">{label}</h3>
      <div className="per-fields">
        <div className="per-field">
          <label>Plafond non utilisé {currentYear - 4}</label>
          <input type="number" min={0} value={v.nonUtiliseAnnee1 || ''} placeholder="0"
            onChange={(e) => onChange({ nonUtiliseAnnee1: Number(e.target.value) || 0 })} />
        </div>
        <div className="per-field">
          <label>Plafond non utilisé {currentYear - 3}</label>
          <input type="number" min={0} value={v.nonUtiliseAnnee2 || ''} placeholder="0"
            onChange={(e) => onChange({ nonUtiliseAnnee2: Number(e.target.value) || 0 })} />
        </div>
        <div className="per-field">
          <label>Plafond non utilisé {currentYear - 2}</label>
          <input type="number" min={0} value={v.nonUtiliseAnnee3 || ''} placeholder="0"
            onChange={(e) => onChange({ nonUtiliseAnnee3: Number(e.target.value) || 0 })} />
        </div>
        <div className="per-field">
          <label>Plafond calculé sur revenus {currentYear - 1}</label>
          <input type="number" min={0} value={v.plafondCalcule || ''} placeholder="0"
            onChange={(e) => onChange({ plafondCalcule: Number(e.target.value) || 0 })} />
        </div>
      </div>
    </div>
  );
}

export default function AvisIrStep({ avisIr, avisIr2, isCouple, onUpdate }: AvisIrStepProps): React.ReactElement {
  return (
    <div className="per-step">
      <h2 className="per-step-title">Plafonds de votre avis d'impôt</h2>
      <p className="per-step-hint">
        Reportez les montants de la rubrique « PLAFOND EPARGNE RETRAITE » de votre avis d'impôt {currentYear} (revenus {currentYear - 1}).
      </p>

      <AvisFields
        label="Déclarant 1"
        avis={avisIr}
        onChange={(patch) => onUpdate(patch, 1)}
      />

      {isCouple && (
        <AvisFields
          label="Déclarant 2"
          avis={avisIr2}
          onChange={(patch) => onUpdate(patch, 2)}
        />
      )}
    </div>
  );
}
