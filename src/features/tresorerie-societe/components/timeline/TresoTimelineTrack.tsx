import type { KeyboardEvent } from 'react';
import type { TresoTimelineLayout } from './timelineLayout';
import { getRevenuePhaseSourceLabel } from '../../utils/revenuePhaseLabels';

interface TresoTimelineTrackProps {
  layout: TresoTimelineLayout;
  onEditPhase: (phaseId: string) => void;
}

function fmtEuro(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

function phaseClass(source: string): string {
  return source === 'holding'
    ? 'ts-timeline-track__phase--holding'
    : source === 'subsidiary'
      ? 'ts-timeline-track__phase--subsidiary'
      : 'ts-timeline-track__phase--none';
}

function onSegmentKeyDown(
  event: KeyboardEvent<SVGGElement>,
  phaseId: string,
  onEditPhase: (phaseId: string) => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onEditPhase(phaseId);
}

export function TresoTimelineTrack({ layout, onEditPhase }: TresoTimelineTrackProps) {
  const tickModulo = layout.ticks.length > 10 ? 2 : 1;

  return (
    <div className="ts-timeline-track-outer">
      <div className="ts-timeline-track" aria-label="Timeline des revenus">
        <svg viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`} role="img" aria-label="Parcours de revenus">
          <line x1="64" y1="76" x2="936" y2="76" className="ts-timeline-track__axis" />
          <line x1="64" y1="148" x2="936" y2="148" className="ts-timeline-track__age-axis" />

          {layout.ticks.map((tick, index) => (
            <g key={tick.year}>
              <line x1={tick.x} y1="68" x2={tick.x} y2="154" className="ts-timeline-track__tick" />
              {index % tickModulo === 0 ? (
                <>
                  <text x={tick.x} y="54" textAnchor="middle" className="ts-timeline-track__year">
                    {tick.year}
                  </text>
                  {tick.age != null ? (
                    <text x={tick.x} y="174" textAnchor="middle" className="ts-timeline-track__age">
                      {tick.age} ans
                    </text>
                  ) : null}
                </>
              ) : null}
            </g>
          ))}

          {layout.phases.map(item => {
            const label = item.phase.label?.trim() || getRevenuePhaseSourceLabel(item.phase.source);
            const clipId = `clip-phase-${item.phase.id}`;
            const showDetail = item.width >= 80;
            const showLabel = item.width >= 36;
            return (
              <g
                key={item.phase.id}
                role="button"
                tabIndex={0}
                aria-label={`Modifier ${label}`}
                className="ts-timeline-track__phase"
                onClick={() => onEditPhase(item.phase.id)}
                onKeyDown={event => onSegmentKeyDown(event, item.phase.id, onEditPhase)}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x={item.x} y="86" width={item.width} height="44" />
                  </clipPath>
                </defs>
                <title>
                  {label} · net {fmtEuro(item.netRevenue)} · besoin {fmtEuro(item.phase.annualNetIncomeNeed)} · CCA {item.phase.useCcaForCompletion ? 'oui' : 'non'}
                </title>
                <rect
                  x={item.x}
                  y="86"
                  width={item.width}
                  height="44"
                  rx="8"
                  className={`ts-timeline-track__phase-rect ${phaseClass(item.phase.source)}`}
                />
                <g clipPath={`url(#${clipId})`}>
                  {showLabel ? (
                    <text
                      x={item.x + item.width / 2}
                      y={showDetail ? 105 : 113}
                      textAnchor="middle"
                      className="ts-timeline-track__phase-label"
                    >
                      {label}
                    </text>
                  ) : null}
                  {showDetail ? (
                    <text
                      x={item.x + item.width / 2}
                      y="122"
                      textAnchor="middle"
                      className="ts-timeline-track__phase-detail"
                    >
                      {item.startYear}-{item.endYear} · besoin {fmtEuro(item.phase.annualNetIncomeNeed)}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}

          {layout.milestones.map(milestone => (
            <g key={milestone.id} className="ts-timeline-track__milestone">
              <line x1={milestone.x} y1="62" x2={milestone.x} y2="142" className="ts-timeline-track__milestone-line" />
              <circle cx={milestone.x} cy="76" r="13" className="ts-timeline-track__milestone-dot" />
              <text x={milestone.x} y="81" textAnchor="middle" className="ts-timeline-track__milestone-label">
                {milestone.label}
              </text>
              <title>{milestone.description} · {milestone.year}</title>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
