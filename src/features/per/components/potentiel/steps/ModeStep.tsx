/**
 * ModeStep - Step 1: choose the user goal and the document source.
 */

import React from 'react';
import type { PerMode } from '../../../hooks/usePerPotentiel';

interface ModeStepProps {
  mode: PerMode | null;
  avisIrConnu: boolean;
  onSelectMode: (_mode: PerMode) => void;
  onSetAvisIrConnu: (_value: boolean) => void;
}

const MODES: { id: PerMode; title: string; desc: string; marker: string }[] = [
  {
    id: 'versement-n',
    title: 'Controle du potentiel avant versement',
    desc: 'Je veux verifier si un versement PER cette annee reste deductible et quel gain fiscal il genere.',
    marker: 'Versement N',
  },
  {
    id: 'declaration-n1',
    title: 'Controle de la declaration 2042',
    desc: 'J ai deja verse et je veux fiabiliser les cases de declaration et la lecture du potentiel restant.',
    marker: 'Declaration N-1',
  },
];

const JOURNEY_BY_MODE: Record<PerMode, string[]> = {
  'versement-n': [
    'Choix du document de depart',
    'Reconstitution du foyer et des revenus',
    'Controle du plafond disponible et simulation du versement',
  ],
  'declaration-n1': [
    'Reprise de la declaration et des versements deja effectues',
    'Controle des cases 2042 et des reports',
    'Restitution du plafond restant pour l annee suivante',
  ],
};

export default function ModeStep({
  mode,
  avisIrConnu,
  onSelectMode,
  onSetAvisIrConnu,
}: ModeStepProps): React.ReactElement {
  const selectedMode = mode ?? 'versement-n';
  const showDocumentChoice = mode === 'versement-n';

  return (
    <div className="per-step per-step--mode">
      <div className="per-step-copy">
        <p className="per-step-eyebrow">Point de depart</p>
        <h3 className="per-step-title">Quelle mission voulez-vous traiter ?</h3>
        <p className="per-step-hint">
          Le simulateur doit d abord savoir si vous cherchez un potentiel futur ou une verification
          declarative. Cette decision determine le parcours visible et les ecrans affiches.
        </p>
      </div>

      <div className="per-mode-grid">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`per-mode-card ${mode === item.id ? 'per-mode-card--selected' : ''}`}
            onClick={() => onSelectMode(item.id)}
          >
            <span className="per-mode-card-marker">{item.marker}</span>
            <h4 className="per-mode-card-title">{item.title}</h4>
            <p className="per-mode-card-desc">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="per-mode-support-grid">
        <div className="premium-card-compact per-mode-support-card">
          <p className="premium-section-title">Parcours genere</p>
          <ol className="per-mode-journey-list">
            {JOURNEY_BY_MODE[selectedMode].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="premium-card per-mode-support-card per-mode-support-card--accent">
          <p className="premium-section-title">Documents disponibles</p>
          {showDocumentChoice ? (
            <div className="per-mode-doc-grid">
              <button
                type="button"
                className={`per-mode-doc-card ${avisIrConnu ? 'is-selected' : ''}`}
                onClick={() => onSetAvisIrConnu(true)}
              >
                <span className="per-mode-doc-title">Avis IR disponible</span>
                <span className="per-mode-doc-desc">
                  Vous reportez les plafonds deja calcules depuis la rubrique "Plafond epargne retraite".
                </span>
              </button>

              <button
                type="button"
                className={`per-mode-doc-card ${!avisIrConnu ? 'is-selected' : ''}`}
                onClick={() => onSetAvisIrConnu(false)}
              >
                <span className="per-mode-doc-title">Sans avis IR</span>
                <span className="per-mode-doc-desc">
                  Le potentiel sera reconstitue depuis les revenus saisis. Le resultat reste moins precis.
                </span>
              </button>
            </div>
          ) : (
            <div className="per-mode-declaration-note">
              <strong>Point de depart retenu :</strong> la declaration et les versements deja saisis.
              L avis IR n est pas obligatoire pour entrer dans le parcours de declaration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
