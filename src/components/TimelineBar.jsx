import React from 'react';

const ProgressIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l6-6 4 4 7-7" />
    <path d="M14 4h7v7" />
  </svg>
);

const DaggerIcon = () => (
  <span className="pl-timeline__dagger">†</span>
);

export function TimelineBar({ ageActuel, ageDebutLiquidation, ageAuDeces }) {
  const dureeVieTotal = Math.max(1, ageAuDeces - ageActuel);
  const dureeEpargne = Math.max(0, ageDebutLiquidation - ageActuel);
  const positionDebutLiquidation = Math.min(100, Math.max(0, (dureeEpargne / dureeVieTotal) * 100));
  
  // Masquer l'âge de liquidation si décès avant liquidation
  const showLiquidationMarker = ageAuDeces >= ageDebutLiquidation;

  return (
    <div className="pl-timeline">
      <div className="pl-timeline__track-container">
        <div className="pl-timeline__icon pl-timeline__icon--left">
          <ProgressIcon />
        </div>
        <div className="pl-timeline__track">
          <div
            className="pl-timeline__segment pl-timeline__segment--epargne"
            style={{ width: `${positionDebutLiquidation}%` }}
          />
          <div
            className="pl-timeline__segment pl-timeline__segment--liquidation"
            style={{ width: `${100 - positionDebutLiquidation}%` }}
          />
        </div>
        <div className="pl-timeline__icon pl-timeline__icon--right">
          <DaggerIcon />
        </div>
      </div>

      <div className="pl-timeline__markers">
        <div className="pl-timeline__marker" style={{ left: '0%' }}>
          <div className="pl-timeline__line"></div>
          <div className="pl-timeline__label">
            <span className="pl-timeline__age">{ageActuel}</span>
            <span className="pl-timeline__unit">ans</span>
          </div>
        </div>

        {showLiquidationMarker && (
          <div className="pl-timeline__marker pl-timeline__marker--center" style={{ left: '50%' }}>
            <div className="pl-timeline__line"></div>
            <div className="pl-timeline__label">
              <span className="pl-timeline__age">{ageDebutLiquidation}</span>
              <span className="pl-timeline__unit">ans</span>
            </div>
          </div>
        )}

        <div className="pl-timeline__marker" style={{ left: '100%' }}>
          <div className="pl-timeline__line"></div>
          <div className="pl-timeline__label">
            <span className="pl-timeline__age">{ageAuDeces}</span>
            <span className="pl-timeline__unit">ans</span>
          </div>
        </div>
      </div>
    </div>
  );
}
