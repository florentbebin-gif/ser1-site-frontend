/**
 * AvisIrStep - Step 2: enter carry-forward ceilings from the tax notice.
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

function AvisFieldsCard({
  label,
  avis,
  onChange,
}: {
  label: string;
  avis: AvisIrPlafonds | null;
  onChange: (_patch: Partial<AvisIrPlafonds>) => void;
}): React.ReactElement {
  const values = avis ?? {
    nonUtiliseAnnee1: 0,
    nonUtiliseAnnee2: 0,
    nonUtiliseAnnee3: 0,
    plafondCalcule: 0,
    anneeRef: currentYear - 1,
  };

  const rows = [
    { label: `Plafond non utilise ${currentYear - 4}`, key: 'nonUtiliseAnnee1' as const },
    { label: `Plafond non utilise ${currentYear - 3}`, key: 'nonUtiliseAnnee2' as const },
    { label: `Plafond non utilise ${currentYear - 2}`, key: 'nonUtiliseAnnee3' as const },
    { label: `Plafond calcule sur revenus ${currentYear - 1}`, key: 'plafondCalcule' as const },
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
              className="premium-input per-avis-row-input"
              value={values[row.key] || ''}
              placeholder="0"
              onChange={(event) => onChange({ [row.key]: Number(event.target.value) || 0 })}
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
  onUpdate,
}: AvisIrStepProps): React.ReactElement {
  return (
    <div className="per-step per-step--avis">
      <div className="per-step-copy">
        <p className="per-step-eyebrow">Document source</p>
        <h3 className="per-step-title">Lecture de l avis d impot</h3>
        <p className="per-step-hint">
          Reprenez uniquement la rubrique "Plafond epargne retraite". L objectif est de recuperer
          les reports utilisables et le plafond calcule sur les revenus {currentYear - 1}.
        </p>
      </div>

      <div className="per-avis-layout">
        <div className="premium-card-compact per-avis-guide-card">
          <p className="premium-section-title">Ce qu il faut relever</p>
          <ol className="per-avis-checklist">
            <li>Les trois annees de plafond non utilise.</li>
            <li>Le plafond calcule sur les revenus {currentYear - 1}.</li>
            <li>Les montants declarant par declarant si le foyer est un couple.</li>
          </ol>
        </div>

        <div className="premium-card per-avis-preview-card">
          <div className="per-avis-preview">
            <div className="per-avis-preview-header">
              <div>
                <p className="premium-section-title">Reperage visuel</p>
                <h4 className="per-avis-preview-title">Avis d impot {currentYear}</h4>
              </div>
              <span className="per-avis-preview-chip">Revenus {currentYear - 1}</span>
            </div>

            <div className="per-avis-preview-sheet">
              <div className="per-avis-preview-line per-avis-preview-line--muted">Direction generale des finances publiques</div>
              <div className="per-avis-preview-line per-avis-preview-line--muted">Avis etabli en {currentYear}</div>
              <div className="per-avis-preview-focus">
                <span className="per-avis-preview-focus-label">Rubrique a lire</span>
                <strong>PLAFOND EPARGNE RETRAITE</strong>
              </div>
              <div className="per-avis-preview-grid">
                <div>Plafond total</div>
                <div>Plafond non utilise N-3</div>
                <div>Plafond non utilise N-2</div>
                <div>Plafond non utilise N-1</div>
                <div>Plafond calcule sur revenus {currentYear - 1}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`per-avis-form-grid ${isCouple ? 'is-couple' : ''}`}>
        <AvisFieldsCard
          label="Declarant 1"
          avis={avisIr}
          onChange={(patch) => onUpdate(patch, 1)}
        />

        {isCouple && (
          <AvisFieldsCard
            label="Declarant 2"
            avis={avisIr2}
            onChange={(patch) => onUpdate(patch, 2)}
          />
        )}
      </div>
    </div>
  );
}
