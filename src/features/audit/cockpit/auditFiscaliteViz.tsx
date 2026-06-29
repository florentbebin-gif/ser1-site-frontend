import type { ReactElement } from 'react';

// Une part du donut : un libellé, une valeur et le token de couleur data-viz associé.
export interface DonutSegment {
  label: string;
  value: number;
  token: string; // ex. '--viz-1' (jamais une couleur en dur)
}

const RADIUS = 42;
const CENTER = 52;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Donut catégoriel en tokens --viz uniquement. Total nul → anneau neutre (pas de
// fausse donnée). Centre = montant héros + libellé.
export function AuditDonut({
  segments,
  centerValue,
  centerLabel,
  ariaLabel,
  size = 132,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
  ariaLabel: string;
  size?: number;
}): ReactElement {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  let offset = 0;

  return (
    <div className="audit-donut" style={{ width: size, height: size }}>
      <svg className="audit-donut__svg" viewBox="0 0 104 104" role="img" aria-label={ariaLabel}>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--viz-sequential-1)"
          strokeWidth={STROKE}
        />
        {total > 0
          ? segments.map((segment) => {
              const value = Math.max(0, segment.value);
              if (value <= 0) return null;
              const length = (value / total) * CIRCUMFERENCE;
              const dash = `${length} ${CIRCUMFERENCE - length}`;
              const element = (
                <circle
                  key={segment.label}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={`var(${segment.token})`}
                  strokeWidth={STROKE}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return element;
            })
          : null}
      </svg>
      <div className="audit-donut__center">
        <span className="audit-donut__value">{centerValue}</span>
        <span className="audit-donut__label">{centerLabel}</span>
      </div>
    </div>
  );
}

// Légende d'un donut : pastille colorée (token) + libellé + valeur formatée.
export function DonutLegend({
  items,
}: {
  items: Array<{ label: string; token: string; value: string }>;
}): ReactElement {
  return (
    <ul className="audit-donut-legend">
      {items.map((item) => (
        <li key={item.label} className="audit-donut-legend__item">
          <span
            className="audit-donut-legend__swatch"
            style={{ background: `var(${item.token})` }}
            aria-hidden="true"
          />
          <span className="audit-donut-legend__label">{item.label}</span>
          <span className="audit-donut-legend__value">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
