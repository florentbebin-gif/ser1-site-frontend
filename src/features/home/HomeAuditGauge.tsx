import type { ReactElement } from 'react';

import './HomeAuditGauge.css';

interface HomeAuditGaugeProps {
  percent: number;
  label: string;
  ariaLabel: string;
}

const SIZE = 76;
const HEIGHT = 154;

/**
 * Demi-jauge de structuration du dossier (0 -> 100 %). Purement informative :
 * l'arc se remplit proportionnellement au pourcentage transmis.
 */
export function HomeAuditGauge({ percent, label, ariaLabel }: HomeAuditGaugeProps): ReactElement {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <figure
      className="home-gauge"
      aria-label={ariaLabel}
      title={ariaLabel}
      data-testid="home-dossier-gauge"
    >
      <svg className="home-gauge__svg" viewBox={`0 0 ${SIZE * 3} ${HEIGHT}`} aria-hidden="true">
        <path
          className="home-gauge__halo home-gauge__halo--outer"
          d="M 26 127 A 88 88 0 0 1 202 127"
          fill="none"
          pathLength={100}
        />
        <path
          className="home-gauge__halo home-gauge__halo--inner"
          d="M 62 126 A 52 52 0 0 1 166 126"
          fill="none"
          pathLength={100}
        />
        <path
          className="home-gauge__track"
          d="M 42 124 A 72 72 0 0 1 186 124"
          fill="none"
          pathLength={100}
        />
        <path
          className={['home-gauge__fill', clamped === 0 ? 'home-gauge__fill--empty' : '']
            .filter(Boolean)
            .join(' ')}
          d="M 42 124 A 72 72 0 0 1 186 124"
          fill="none"
          pathLength={100}
          strokeDasharray={`${clamped} ${100 - clamped}`}
        />
      </svg>
      <figcaption className="home-gauge__center" aria-hidden="true">
        <span className="home-gauge__value">{clamped}%</span>
        <span className="home-gauge__label">{label}</span>
      </figcaption>
    </figure>
  );
}

export default HomeAuditGauge;
