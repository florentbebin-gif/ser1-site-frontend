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

function phaseToneClass(index: number): string {
  return `ts-timeline-track__phase--tone-${(index % 5) + 1}`;
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
    <div className="ts-timeline-track-outer ts-scroll-x">
      <div className="ts-timeline-track" aria-label="Timeline des revenus">
        <svg
          width={layout.svgWidth}
          height={layout.svgHeight}
          viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
          role="img"
          aria-label="Parcours de revenus"
        >
          <line x1={layout.trackLeft} y1="76" x2={layout.trackRight} y2="76" className="ts-timeline-track__axis" />
          <line x1={layout.trackLeft} y1="148" x2={layout.trackRight} y2="148" className="ts-timeline-track__age-axis" />

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

          {layout.phases.map((item, index) => {
            const label = item.phase.label?.trim() || getRevenuePhaseSourceLabel(item.phase.source);
            const sourceLabel = getRevenuePhaseSourceLabel(item.phase.source);
            const clipId = `clip-phase-${item.phase.id}`;
            const title = `${label} · net ${fmtEuro(item.netRevenue)} · besoin ${fmtEuro(item.phase.annualNetIncomeNeed)} · CCA ${item.phase.useCcaForCompletion ? 'oui' : 'non'}`;
            const showDetail = item.width >= 200;
            const showLabel = item.width >= 120;
            const showSource = item.width >= 84;
            const badgeX = item.x + Math.min(20, item.width / 2);
            return (
              <g
                key={item.phase.id}
                role="button"
                tabIndex={0}
                aria-label={`Modifier ${title}`}
                className="ts-timeline-track__phase"
                onClick={() => onEditPhase(item.phase.id)}
                onKeyDown={event => onSegmentKeyDown(event, item.phase.id, onEditPhase)}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x={item.x} y="86" width={item.width} height="44" />
                  </clipPath>
                </defs>
                <title>{title}</title>
                <rect
                  x={item.x}
                  y="86"
                  width={item.width}
                  height="44"
                  rx="8"
                  className={`ts-timeline-track__phase-rect ${phaseToneClass(index)} ${phaseClass(item.phase.source)}`}
                />
                <g clipPath={`url(#${clipId})`}>
                  <circle
                    cx={badgeX}
                    cy="108"
                    r="12"
                    className="ts-timeline-track__phase-badge-dot"
                  />
                  <text
                    x={badgeX}
                    y="112"
                    textAnchor="middle"
                    className="ts-timeline-track__phase-badge"
                  >
                    {index + 1}
                  </text>
                  {showLabel ? (
                    <text
                      x={item.x + item.width / 2}
                      y={showDetail ? 104 : 112}
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
                  {showSource ? (
                    <text
                      x={item.x + item.width - 12}
                      y="101"
                      textAnchor="end"
                      className="ts-timeline-track__phase-source"
                    >
                      {sourceLabel}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}

          {layout.milestones.map(milestone => {
            const title = `${milestone.description} · ${milestone.year}`;
            return (
              <g key={milestone.id} className="ts-timeline-track__milestone">
                <line
                  x1={milestone.x}
                  y1={Math.min(milestone.dotY + 15, 142)}
                  x2={milestone.x}
                  y2="142"
                  className="ts-timeline-track__milestone-line"
                />
                <circle cx={milestone.x} cy={milestone.dotY} r="13" className="ts-timeline-track__milestone-dot" />
                <text
                  x={milestone.x}
                  y={milestone.dotY + 5}
                  textAnchor="middle"
                  className="ts-timeline-track__milestone-label"
                >
                  {milestone.label}
                </text>
                <title>{title}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
