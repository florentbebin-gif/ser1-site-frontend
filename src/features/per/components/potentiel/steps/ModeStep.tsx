/**
 * ModeStep — Step 1: choose between "Versement N" and "Déclaration 2042 N-1".
 */

import React from 'react';
import type { PerMode } from '../../../hooks/usePerPotentiel';

interface ModeStepProps {
  mode: PerMode | null;
  avisIrConnu: boolean;
  onSelectMode: (_mode: PerMode) => void;
  onSetAvisIrConnu: (_v: boolean) => void;
}

const MODES: { id: PerMode; title: string; desc: string }[] = [
  {
    id: 'versement-n',
    title: 'Estimer mon potentiel de versement',
    desc: 'Je souhaite vérifier mon potentiel avant de verser en épargne retraite cette année.',
  },
  {
    id: 'declaration-n1',
    title: 'Déclarer mes versements dans la 2042',
    desc: 'J\'ai déjà versé l\'année dernière, je veux m\'assurer de la bonne déclaration fiscale.',
  },
];

export default function ModeStep({ mode, avisIrConnu, onSelectMode, onSetAvisIrConnu }: ModeStepProps): React.ReactElement {
  return (
    <div className="per-step">
      <h2 className="per-step-title">Que souhaitez-vous faire ?</h2>
      <div className="per-mode-grid">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`per-mode-card ${mode === m.id ? 'per-mode-card--selected' : ''}`}
            onClick={() => onSelectMode(m.id)}
          >
            <h3 className="per-mode-card-title">{m.title}</h3>
            <p className="per-mode-card-desc">{m.desc}</p>
          </button>
        ))}
      </div>

      {mode === 'versement-n' && (
        <div className="per-avis-toggle">
          <label className="per-toggle-label">
            <input
              type="checkbox"
              checked={avisIrConnu}
              onChange={(e) => onSetAvisIrConnu(e.target.checked)}
            />
            <span>J'ai mon avis d'impôt sous les yeux</span>
          </label>
          <p className="per-toggle-hint">
            {avisIrConnu
              ? 'Vous pourrez saisir vos plafonds reportés depuis l\'avis.'
              : 'Les plafonds seront estimés depuis vos revenus (moins précis).'}
          </p>
        </div>
      )}
    </div>
  );
}
